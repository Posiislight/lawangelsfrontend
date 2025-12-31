from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.utils import timezone
from django.db.models import Count, Sum
from datetime import timedelta
import logging

from .models import Exam, ExamAttempt, Question
from .topic_models import UserGameProfile, TopicQuizAttempt

logger = logging.getLogger(__name__)


class UserProgressViewSet(viewsets.ViewSet):
    """
    OPTIMIZED ViewSet for user progress statistics.
    Uses minimal database queries with prefetching and aggregation.
    
    Endpoints:
    - GET /progress/ - Get comprehensive user progress data
    - GET /progress/summary/ - Get quick summary stats
    """
    permission_classes = [IsAuthenticated]

    def list(self, request):
        """
        Get comprehensive user progress data for the Progress Tracker page.
        
        OPTIMIZED: Only 5-6 database queries total instead of 20+
        """
        user = request.user
        
        try:
            # Query 1: Get or create game profile
            profile, _ = UserGameProfile.objects.get_or_create(user=user)
            
            # Query 2: Get ALL topic quiz attempts at once (for weekly, trend, and progress)
            topic_attempts = list(TopicQuizAttempt.objects.filter(user=user).values(
                'id', 'topic', 'status', 'correct_count', 'wrong_count', 
                'total_questions', 'points_earned', 'started_at'
            ))
            
            # Query 3: Get ALL exam attempts at once
            exam_attempts = list(ExamAttempt.objects.filter(user=user).select_related('exam').values(
                'id', 'exam_id', 'exam__title', 'status', 'score', 'started_at'
            ))
            
            # Query 4: Get question counts per topic (single query)
            topic_question_counts = {
                tc['topic']: tc['total'] 
                for tc in Question.objects.values('topic').annotate(total=Count('id'))
            }
            
            # Now calculate everything from the pre-fetched data (NO more DB queries)
            overall_progress = self._calculate_overall_progress(profile, topic_attempts, exam_attempts)
            weekly_activity = self._calculate_weekly_activity(topic_attempts, exam_attempts)
            performance_trend = self._calculate_performance_trend(topic_attempts, exam_attempts)
            course_progress = self._calculate_course_progress(topic_attempts, topic_question_counts)
            learning_distribution = self._calculate_learning_distribution(len(topic_attempts), len(exam_attempts))
            recent_activity = self._calculate_recent_activity(topic_attempts, exam_attempts)
            
            return Response({
                'overall_progress': overall_progress,
                'weekly_activity': weekly_activity,
                'performance_trend': performance_trend,
                'course_progress': course_progress,
                'learning_distribution': learning_distribution,
                'recent_activity': recent_activity,
            })
        except Exception as e:
            logger.error(f"Error fetching progress data: {str(e)}")
            return Response(
                {'error': 'Failed to fetch progress data'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

    def _calculate_overall_progress(self, profile, topic_attempts, exam_attempts):
        """Calculate overall progress from pre-fetched data"""
        # Filter completed topic attempts
        completed_topics = [t for t in topic_attempts if t['status'] in ['completed', 'failed']]
        
        total_correct = sum(t['correct_count'] or 0 for t in completed_topics)
        total_wrong = sum(t['wrong_count'] or 0 for t in completed_topics)
        
        quiz_accuracy = 0
        if (total_correct + total_wrong) > 0:
            quiz_accuracy = round((total_correct / (total_correct + total_wrong)) * 100)
        
        # Exam accuracy
        completed_exams = [e for e in exam_attempts if e['status'] == 'completed' and e['score'] is not None]
        avg_exam_score = 0
        if completed_exams:
            avg_exam_score = round(sum(e['score'] for e in completed_exams) / len(completed_exams))
        
        # Calculate streak from pre-fetched data
        streak_days = self._calculate_streak_from_data(topic_attempts, exam_attempts)
        
        # Overall progress
        max_expected_quizzes = 50
        quiz_completion_progress = min(100, (profile.total_quizzes_completed / max_expected_quizzes) * 100)
        overall_percentage = round((quiz_completion_progress + quiz_accuracy) / 2)
        
        return {
            'overall_percentage': overall_percentage,
            'quiz_accuracy': quiz_accuracy,
            'exam_accuracy': avg_exam_score,
            'quizzes_completed': profile.total_quizzes_completed,
            'total_points': profile.total_points,
            'current_level': profile.current_level,
            'rank': profile.rank,
            'rank_display': profile.get_rank_display(),
            'xp': profile.xp,
            'xp_to_next_level': profile.xp_to_next_level,
            'streak_days': streak_days,
            'longest_streak': profile.longest_streak,
        }

    def _calculate_streak_from_data(self, topic_attempts, exam_attempts):
        """Calculate streak from pre-fetched data"""
        # Get all unique dates
        all_dates = set()
        for t in topic_attempts:
            if t['started_at']:
                all_dates.add(t['started_at'].date())
        for e in exam_attempts:
            if e['started_at']:
                all_dates.add(e['started_at'].date())
        
        if not all_dates:
            return 0
        
        today = timezone.now().date()
        streak = 0
        current_date = today
        
        # Check starting from today or yesterday
        if today not in all_dates:
            yesterday = today - timedelta(days=1)
            if yesterday in all_dates:
                current_date = yesterday
            else:
                return 0
        
        while current_date in all_dates:
            streak += 1
            current_date -= timedelta(days=1)
        
        return streak

    def _calculate_weekly_activity(self, topic_attempts, exam_attempts):
        """Calculate weekly activity from pre-fetched data"""
        today = timezone.now().date()
        days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
        
        # Group attempts by date for quick lookup
        topic_by_date = {}
        for t in topic_attempts:
            if t['started_at']:
                date = t['started_at'].date()
                if date not in topic_by_date:
                    topic_by_date[date] = []
                topic_by_date[date].append(t)
        
        exam_by_date = {}
        for e in exam_attempts:
            if e['started_at']:
                date = e['started_at'].date()
                if date not in exam_by_date:
                    exam_by_date[date] = []
                exam_by_date[date].append(e)
        
        weekly_data = []
        for i in range(6, -1, -1):
            date = today - timedelta(days=i)
            day_name = days[date.weekday()]
            
            day_topics = topic_by_date.get(date, [])
            day_exams = [e for e in exam_by_date.get(date, []) if e['status'] == 'completed']
            
            total_quizzes = len(day_topics) + len(day_exams)
            correct = sum(t['correct_count'] or 0 for t in day_topics)
            wrong = sum(t['wrong_count'] or 0 for t in day_topics)
            
            hours = round(total_quizzes * 0.17, 1)
            
            weekly_data.append({
                'day': day_name,
                'hours': hours,
                'quizzes': total_quizzes,
                'correct': correct,
                'total': correct + wrong
            })
        
        return weekly_data

    def _calculate_performance_trend(self, topic_attempts, exam_attempts):
        """Calculate performance trend from pre-fetched data"""
        today = timezone.now().date()
        trend_data = []
        
        for week in range(6, 0, -1):
            week_start = today - timedelta(weeks=week)
            week_end = week_start + timedelta(days=7)
            
            # Filter topic attempts for this week
            week_topics = [
                t for t in topic_attempts 
                if t['status'] == 'completed' 
                and t['started_at'] 
                and week_start <= t['started_at'].date() < week_end
            ]
            
            if week_topics:
                total_correct = sum(t['correct_count'] or 0 for t in week_topics)
                total_questions = sum(t['total_questions'] or 1 for t in week_topics)
                score = round((total_correct / total_questions) * 100) if total_questions > 0 else 0
            else:
                # Check exam scores
                week_exams = [
                    e for e in exam_attempts
                    if e['status'] == 'completed' and e['score'] is not None
                    and e['started_at']
                    and week_start <= e['started_at'].date() < week_end
                ]
                if week_exams:
                    score = round(sum(e['score'] for e in week_exams) / len(week_exams))
                else:
                    score = None
            
            if score is not None:
                trend_data.append({'week': str(7 - week), 'score': score})
        
        return trend_data if trend_data else [{'week': '1', 'score': 0}]

    def _calculate_course_progress(self, topic_attempts, topic_question_counts):
        """Calculate course progress from pre-fetched data"""
        topic_choices = dict(TopicQuizAttempt.TOPIC_CHOICES)
        
        # Aggregate user progress by topic
        progress_map = {}
        completed_attempts = [t for t in topic_attempts if t['status'] in ['completed', 'failed']]
        for t in completed_attempts:
            topic = t['topic']
            if topic not in progress_map:
                progress_map[topic] = {'correct': 0, 'completed': 0}
            progress_map[topic]['correct'] += t['correct_count'] or 0
            progress_map[topic]['completed'] += 1
        
        colors = ['bg-blue-500', 'bg-green-500', 'bg-purple-500', 'bg-red-500', 
                  'bg-yellow-500', 'bg-indigo-500', 'bg-pink-500', 'bg-orange-500']
        
        course_data = []
        for idx, (topic_key, topic_display) in enumerate(topic_choices.items()):
            total_questions = topic_question_counts.get(topic_key, 0)
            user_data = progress_map.get(topic_key, {'correct': 0, 'completed': 0})
            
            progress = 0
            if total_questions > 0:
                progress = min(100, round((user_data['correct'] / total_questions) * 100))
            
            course_data.append({
                'name': topic_display,
                'topic': topic_key,
                'progress': progress,
                'completed_quizzes': user_data['completed'],
                'correct_answers': user_data['correct'],
                'total_questions': total_questions,
                'color': colors[idx % len(colors)]
            })
        
        course_data.sort(key=lambda x: x['progress'], reverse=True)
        return course_data

    def _calculate_learning_distribution(self, topic_count, exam_count):
        """Calculate learning distribution from counts"""
        total = topic_count + exam_count
        
        if total == 0:
            return [
                {'name': 'Topic Quizzes (0%)', 'value': 0, 'color': '#3B82F6'},
                {'name': 'Mock Exams (0%)', 'value': 0, 'color': '#8B5CF6'},
                {'name': 'Reading (0%)', 'value': 0, 'color': '#10B981'},
                {'name': 'Videos (0%)', 'value': 0, 'color': '#F59E0B'},
            ]
        
        topic_pct = round((topic_count / total) * 100)
        exam_pct = 100 - topic_pct
        
        return [
            {'name': f'Topic Quizzes ({topic_pct}%)', 'value': topic_pct, 'color': '#3B82F6'},
            {'name': f'Mock Exams ({exam_pct}%)', 'value': exam_pct, 'color': '#8B5CF6'},
            {'name': 'Reading (0%)', 'value': 0, 'color': '#10B981'},
            {'name': 'Videos (0%)', 'value': 0, 'color': '#F59E0B'},
        ]

    def _calculate_recent_activity(self, topic_attempts, exam_attempts, limit=10):
        """Calculate recent activity from pre-fetched data"""
        topic_display_map = dict(TopicQuizAttempt.TOPIC_CHOICES)
        now = timezone.now()
        
        activities = []
        
        # Process topic attempts
        for t in topic_attempts:
            activities.append({
                'type': 'topic_quiz',
                'title': f"{topic_display_map.get(t['topic'], t['topic'])} Quiz",
                'course': topic_display_map.get(t['topic'], t['topic']),
                'status': t['status'],
                'completed': t['status'] == 'completed',
                'score': t['points_earned'],
                'timestamp': t['started_at'],
                'icon_type': 'check' if t['status'] == 'completed' else 'scale'
            })
        
        # Process exam attempts
        for e in exam_attempts:
            activities.append({
                'type': 'mock_exam',
                'title': e['exam__title'] or f"Exam #{e['exam_id']}",
                'course': 'Mock Exam',
                'status': e['status'],
                'completed': e['status'] == 'completed',
                'score': e['score'],
                'timestamp': e['started_at'],
                'icon_type': 'book' if e['status'] == 'completed' else 'scale'
            })
        
        # Sort by timestamp and limit
        activities.sort(key=lambda x: x['timestamp'] or now, reverse=True)
        activities = activities[:limit]
        
        # Format timestamps
        for activity in activities:
            ts = activity['timestamp']
            if ts:
                diff = now - ts
                if diff.days == 0:
                    if diff.seconds < 3600:
                        activity['status_text'] = f"{diff.seconds // 60} mins ago"
                    else:
                        activity['status_text'] = f"{diff.seconds // 3600} hours ago"
                elif diff.days == 1:
                    activity['status_text'] = "Yesterday"
                else:
                    activity['status_text'] = f"{diff.days} days ago"
                activity['timestamp'] = ts.isoformat()
            else:
                activity['status_text'] = "Unknown"
                activity['timestamp'] = None
        
        return activities

    @action(detail=False, methods=['get'])
    def summary(self, request):
        """Get quick summary stats for dashboard widgets"""
        user = request.user
        profile, _ = UserGameProfile.objects.get_or_create(user=user)
        
        # Single aggregation query
        stats = TopicQuizAttempt.objects.filter(
            user=user,
            status__in=['completed', 'failed']
        ).aggregate(
            total_correct=Sum('correct_count'),
            total_wrong=Sum('wrong_count')
        )
        
        total_correct = stats['total_correct'] or 0
        total_wrong = stats['total_wrong'] or 0
        
        accuracy = 0
        if (total_correct + total_wrong) > 0:
            accuracy = round((total_correct / (total_correct + total_wrong)) * 100)
        
        # Get dates for streak calculation (minimal query)
        topic_dates = set(
            TopicQuizAttempt.objects.filter(user=user)
            .values_list('started_at__date', flat=True)
        )
        exam_dates = set(
            ExamAttempt.objects.filter(user=user)
            .values_list('started_at__date', flat=True)
        )
        all_dates = topic_dates | exam_dates
        
        streak = 0
        if all_dates:
            today = timezone.now().date()
            current = today if today in all_dates else today - timedelta(days=1)
            while current in all_dates:
                streak += 1
                current -= timedelta(days=1)
        
        return Response({
            'quizzes_completed': profile.total_quizzes_completed,
            'total_points': profile.total_points,
            'accuracy': accuracy,
            'streak_days': streak,
            'level': profile.current_level,
            'rank': profile.get_rank_display(),
        })
