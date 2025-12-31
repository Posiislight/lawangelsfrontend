from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.utils import timezone
from django.db.models import Count, Avg, Sum, Max, F
from django.db.models.functions import TruncDate, TruncWeek
from datetime import timedelta
import logging

from .models import Exam, ExamAttempt, Question
from .topic_models import UserGameProfile, TopicQuizAttempt, TopicQuizAnswer

logger = logging.getLogger(__name__)


class UserProgressViewSet(viewsets.ViewSet):
    """
    ViewSet for user progress statistics.
    
    Endpoints:
    - GET /progress/ - Get comprehensive user progress data
    - GET /progress/summary/ - Get quick summary stats
    """
    permission_classes = [IsAuthenticated]

    def list(self, request):
        """Get comprehensive user progress data for the Progress Tracker page"""
        user = request.user
        
        try:
            # Get or create game profile
            profile, _ = UserGameProfile.objects.get_or_create(user=user)
            
            # Calculate overall stats
            overall_progress = self._get_overall_progress(user, profile)
            
            # Get weekly activity (last 7 days)
            weekly_activity = self._get_weekly_activity(user)
            
            # Get performance trend (last 6 weeks)
            performance_trend = self._get_performance_trend(user)
            
            # Get per-topic progress
            course_progress = self._get_course_progress(user)
            
            # Get learning mode distribution
            learning_distribution = self._get_learning_distribution(user)
            
            # Get recent activity
            recent_activity = self._get_recent_activity(user)
            
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

    def _get_overall_progress(self, user, profile):
        """Calculate overall progress statistics"""
        # Get quiz accuracy from topic quizzes
        topic_attempts = TopicQuizAttempt.objects.filter(
            user=user, 
            status__in=['completed', 'failed']
        )
        
        total_correct = topic_attempts.aggregate(
            total=Sum('correct_count')
        )['total'] or 0
        
        total_wrong = topic_attempts.aggregate(
            total=Sum('wrong_count')
        )['total'] or 0
        
        quiz_accuracy = 0
        if (total_correct + total_wrong) > 0:
            quiz_accuracy = round((total_correct / (total_correct + total_wrong)) * 100)
        
        # Get mock exam accuracy
        exam_attempts = ExamAttempt.objects.filter(
            user=user,
            status='completed'
        )
        avg_exam_score = exam_attempts.aggregate(avg=Avg('score'))['avg'] or 0
        
        # Calculate streak (consecutive days with activity)
        streak_days = self._calculate_streak(user)
        
        # Calculate overall progress percentage
        # Based on: quizzes completed, accuracy, and level progress
        max_expected_quizzes = 50  # Arbitrary target
        quiz_completion_progress = min(100, (profile.total_quizzes_completed / max_expected_quizzes) * 100)
        overall_percentage = round((quiz_completion_progress + quiz_accuracy) / 2)
        
        return {
            'overall_percentage': overall_percentage,
            'quiz_accuracy': quiz_accuracy,
            'exam_accuracy': round(avg_exam_score) if avg_exam_score else 0,
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

    def _calculate_streak(self, user):
        """Calculate current streak of consecutive days with quiz activity"""
        today = timezone.now().date()
        
        # Get all unique dates with activity
        topic_dates = TopicQuizAttempt.objects.filter(user=user).annotate(
            date=TruncDate('started_at')
        ).values_list('date', flat=True).distinct()
        
        exam_dates = ExamAttempt.objects.filter(user=user).annotate(
            date=TruncDate('started_at')
        ).values_list('date', flat=True).distinct()
        
        all_dates = set(topic_dates) | set(exam_dates)
        
        if not all_dates:
            return 0
        
        # Calculate streak
        streak = 0
        current_date = today
        
        while current_date in all_dates:
            streak += 1
            current_date -= timedelta(days=1)
        
        # Also check if we're continuing from yesterday
        if today not in all_dates and (today - timedelta(days=1)) in all_dates:
            current_date = today - timedelta(days=1)
            while current_date in all_dates:
                streak += 1
                current_date -= timedelta(days=1)
        
        return streak

    def _get_weekly_activity(self, user):
        """Get activity data for the last 7 days"""
        today = timezone.now().date()
        days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
        
        weekly_data = []
        
        for i in range(6, -1, -1):
            date = today - timedelta(days=i)
            day_name = days[date.weekday()]
            
            # Count topic quiz activity
            topic_activity = TopicQuizAttempt.objects.filter(
                user=user,
                started_at__date=date
            ).aggregate(
                quizzes=Count('id'),
                correct=Sum('correct_count'),
                wrong=Sum('wrong_count')
            )
            
            # Count exam activity
            exam_activity = ExamAttempt.objects.filter(
                user=user,
                started_at__date=date,
                status='completed'
            ).count()
            
            total_quizzes = (topic_activity['quizzes'] or 0) + exam_activity
            correct = topic_activity['correct'] or 0
            wrong = topic_activity['wrong'] or 0
            
            # Estimate study hours based on quiz activity (approx 10 mins per quiz)
            hours = round(total_quizzes * 0.17, 1)  # ~10 minutes per quiz
            
            weekly_data.append({
                'day': day_name,
                'hours': hours,
                'quizzes': total_quizzes,
                'correct': correct,
                'total': correct + wrong
            })
        
        return weekly_data

    def _get_performance_trend(self, user):
        """Get quiz performance trend over last 6 weeks"""
        today = timezone.now().date()
        trend_data = []
        
        for week in range(6, 0, -1):
            week_start = today - timedelta(weeks=week)
            week_end = week_start + timedelta(days=7)
            
            # Get average score for topic quizzes in this week
            topic_scores = TopicQuizAttempt.objects.filter(
                user=user,
                status='completed',
                started_at__date__gte=week_start,
                started_at__date__lt=week_end
            )
            
            if topic_scores.exists():
                total_correct = topic_scores.aggregate(Sum('correct_count'))['correct_count__sum'] or 0
                total_questions = topic_scores.aggregate(Sum('total_questions'))['total_questions__sum'] or 1
                score = round((total_correct / total_questions) * 100)
            else:
                # Check for exam scores
                exam_scores = ExamAttempt.objects.filter(
                    user=user,
                    status='completed',
                    started_at__date__gte=week_start,
                    started_at__date__lt=week_end
                )
                if exam_scores.exists():
                    score = round(exam_scores.aggregate(Avg('score'))['score__avg'] or 0)
                else:
                    score = None  # No data for this week
            
            trend_data.append({
                'week': str(7 - week),
                'score': score
            })
        
        # Filter out None values but keep the structure
        return [d for d in trend_data if d['score'] is not None] or [
            {'week': '1', 'score': 0}
        ]

    def _get_course_progress(self, user):
        """Get progress per topic/course"""
        topic_choices = dict(TopicQuizAttempt.TOPIC_CHOICES)
        
        # Get question counts per topic
        topic_question_counts = Question.objects.values('topic').annotate(
            total=Count('id')
        )
        question_count_map = {tc['topic']: tc['total'] for tc in topic_question_counts}
        
        # Get user's completed questions per topic (based on correct answers)
        user_progress = TopicQuizAttempt.objects.filter(
            user=user,
            status__in=['completed', 'failed']
        ).values('topic').annotate(
            correct=Sum('correct_count'),
            completed=Count('id')
        )
        progress_map = {up['topic']: up for up in user_progress}
        
        course_data = []
        colors = ['bg-blue-500', 'bg-green-500', 'bg-purple-500', 'bg-red-500', 
                  'bg-yellow-500', 'bg-indigo-500', 'bg-pink-500', 'bg-orange-500']
        
        for idx, (topic_key, topic_display) in enumerate(topic_choices.items()):
            total_questions = question_count_map.get(topic_key, 0)
            user_data = progress_map.get(topic_key, {'correct': 0, 'completed': 0})
            
            # Progress based on correct answers vs total questions
            if total_questions > 0:
                progress = min(100, round((user_data['correct'] or 0) / total_questions * 100))
            else:
                progress = 0
            
            course_data.append({
                'name': topic_display,
                'topic': topic_key,
                'progress': progress,
                'completed_quizzes': user_data['completed'],
                'correct_answers': user_data['correct'] or 0,
                'total_questions': total_questions,
                'color': colors[idx % len(colors)]
            })
        
        # Sort by progress descending
        course_data.sort(key=lambda x: x['progress'], reverse=True)
        
        return course_data

    def _get_learning_distribution(self, user):
        """Get distribution of learning activities"""
        # Since we only track quizzes, we'll estimate based on quiz types
        topic_quizzes = TopicQuizAttempt.objects.filter(user=user).count()
        exam_attempts = ExamAttempt.objects.filter(user=user).count()
        
        total = topic_quizzes + exam_attempts
        
        if total == 0:
            return [
                {'name': 'Topic Quizzes (0%)', 'value': 0, 'color': '#3B82F6'},
                {'name': 'Mock Exams (0%)', 'value': 0, 'color': '#8B5CF6'},
                {'name': 'Reading (0%)', 'value': 0, 'color': '#10B981'},
                {'name': 'Videos (0%)', 'value': 0, 'color': '#F59E0B'},
            ]
        
        topic_pct = round((topic_quizzes / total) * 100)
        exam_pct = 100 - topic_pct
        
        return [
            {'name': f'Topic Quizzes ({topic_pct}%)', 'value': topic_pct, 'color': '#3B82F6'},
            {'name': f'Mock Exams ({exam_pct}%)', 'value': exam_pct, 'color': '#8B5CF6'},
            {'name': 'Reading (0%)', 'value': 0, 'color': '#10B981'},
            {'name': 'Videos (0%)', 'value': 0, 'color': '#F59E0B'},
        ]

    def _get_recent_activity(self, user, limit=10):
        """Get recent user activity"""
        activities = []
        
        # Get recent topic quiz attempts
        topic_attempts = TopicQuizAttempt.objects.filter(user=user).order_by('-started_at')[:limit]
        topic_display_map = dict(TopicQuizAttempt.TOPIC_CHOICES)
        
        for attempt in topic_attempts:
            activities.append({
                'type': 'topic_quiz',
                'title': f"{topic_display_map.get(attempt.topic, attempt.topic)} Quiz",
                'course': topic_display_map.get(attempt.topic, attempt.topic),
                'status': attempt.status,
                'completed': attempt.status == 'completed',
                'score': attempt.points_earned,
                'timestamp': attempt.started_at.isoformat(),
                'icon_type': 'check' if attempt.status == 'completed' else 'scale'
            })
        
        # Get recent exam attempts
        exam_attempts = ExamAttempt.objects.filter(user=user).select_related('exam').order_by('-started_at')[:limit]
        
        for attempt in exam_attempts:
            activities.append({
                'type': 'mock_exam',
                'title': attempt.exam.title,
                'course': 'Mock Exam',
                'status': attempt.status,
                'completed': attempt.status == 'completed',
                'score': attempt.score,
                'timestamp': attempt.started_at.isoformat(),
                'icon_type': 'book' if attempt.status == 'completed' else 'scale'
            })
        
        # Sort by timestamp and limit
        activities.sort(key=lambda x: x['timestamp'], reverse=True)
        
        # Format timestamps for display
        now = timezone.now()
        for activity in activities[:limit]:
            ts = timezone.datetime.fromisoformat(activity['timestamp'].replace('Z', '+00:00'))
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
        
        return activities[:limit]

    @action(detail=False, methods=['get'])
    def summary(self, request):
        """Get quick summary stats for dashboard widgets"""
        user = request.user
        profile, _ = UserGameProfile.objects.get_or_create(user=user)
        
        # Quick stats
        topic_attempts = TopicQuizAttempt.objects.filter(
            user=user,
            status__in=['completed', 'failed']
        )
        
        total_correct = topic_attempts.aggregate(Sum('correct_count'))['correct_count__sum'] or 0
        total_wrong = topic_attempts.aggregate(Sum('wrong_count'))['wrong_count__sum'] or 0
        
        accuracy = 0
        if (total_correct + total_wrong) > 0:
            accuracy = round((total_correct / (total_correct + total_wrong)) * 100)
        
        streak = self._calculate_streak(user)
        
        return Response({
            'quizzes_completed': profile.total_quizzes_completed,
            'total_points': profile.total_points,
            'accuracy': accuracy,
            'streak_days': streak,
            'level': profile.current_level,
            'rank': profile.get_rank_display(),
        })
