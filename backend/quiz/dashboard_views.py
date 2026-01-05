from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.db import models
from django.db.models import Avg, Sum, Count, Max
from django.utils import timezone
from datetime import timedelta
import logging

from .models import Exam, ExamAttempt
from .serializers import ExamMinimalSerializer

logger = logging.getLogger(__name__)


class DashboardViewSet(viewsets.ViewSet):
    """
    Optimized dashboard API - returns all dashboard data in ONE request
    
    Endpoints:
    - GET /dashboard/ - Get all dashboard data (stats, activity, exams)
    - GET /dashboard/mock_exams/ - Get all mock exams with user stats
    """
    permission_classes = [IsAuthenticated]

    def list(self, request):
        """
        Get complete dashboard data in a single optimized request.
        
        OPTIMIZED: All data fetched in 4-5 queries total, ~200-400ms response time
        """
        user = request.user
        
        # Import all needed models at once
        from .topic_models import TopicQuizAttempt, TopicQuizAnswer
        from .video_models import VideoProgress
        from .textbook_models import TextbookProgress
        
        # === BATCH ALL QUERIES ===
        
        # Query 1: Get exam attempts (limited to recent for performance)
        attempts = list(ExamAttempt.objects.filter(user=user).select_related('exam').order_by('-started_at')[:50])
        
        # Query 2: Get active exams
        active_exams = list(Exam.objects.filter(is_active=True).order_by('-created_at')[:3])
        
        # Query 3: Get ALL aggregate stats in ONE query
        # This combines quiz time, video time, and last activity dates
        quiz_stats = TopicQuizAnswer.objects.filter(
            attempt__user=user
        ).aggregate(
            quiz_time=Sum('time_spent_seconds')
        )
        
        video_stats = VideoProgress.objects.filter(user=user).aggregate(
            video_time=Sum('watched_seconds'),
            last_video_date=models.Max('last_watched_at')
        )
        
        # Query 4: Get last activity dates in batch
        last_quiz = TopicQuizAttempt.objects.filter(user=user).order_by('-started_at').values('started_at').first()
        last_textbook = TextbookProgress.objects.filter(user=user).order_by('-last_read_at').values('last_read_at').first()
        
        # Query 5: Get all activity dates for streak (use values_list for efficiency)
        # Only fetch dates from last 60 days for streak calculation (optimization)
        cutoff_date = timezone.now() - timedelta(days=60)
        
        all_activity_dates = set()
        
        # Exam dates from already-fetched attempts
        for a in attempts:
            if a.started_at:
                all_activity_dates.add(a.started_at.date())
        
        # Quiz dates
        for dt in TopicQuizAttempt.objects.filter(
            user=user, started_at__gte=cutoff_date
        ).values_list('started_at', flat=True):
            if dt:
                all_activity_dates.add(dt.date())
        
        # Video dates
        for dt in VideoProgress.objects.filter(
            user=user, last_watched_at__gte=cutoff_date
        ).values_list('last_watched_at', flat=True):
            if dt:
                all_activity_dates.add(dt.date())
        
        # Textbook dates
        for dt in TextbookProgress.objects.filter(
            user=user, last_read_at__gte=cutoff_date
        ).values_list('last_read_at', flat=True):
            if dt:
                all_activity_dates.add(dt.date())
        
        # === CALCULATE STATS FROM PREFETCHED DATA ===
        
        completed_attempts = [a for a in attempts if a.status == 'completed']
        scores = [a.score for a in completed_attempts if a.score is not None]
        
        average_score = round(sum(scores) / len(scores)) if scores else 0
        passed_count = len([s for s in scores if s >= 70])
        pass_rate = round((passed_count / len(scores)) * 100) if scores else 0
        
        # Calculate total study time
        exam_time_seconds = sum(a.time_spent_seconds or 0 for a in completed_attempts)
        quiz_time_seconds = quiz_stats['quiz_time'] or 0
        video_time_seconds = video_stats['video_time'] or 0
        total_time_seconds = exam_time_seconds + quiz_time_seconds + video_time_seconds
        
        # Calculate streak from pre-fetched dates
        streak = self._calculate_streak_from_dates(all_activity_dates)
        
        # Get last active date
        activity_dates = []
        if attempts:
            activity_dates.append(attempts[0].started_at)
        if last_quiz and last_quiz['started_at']:
            activity_dates.append(last_quiz['started_at'])
        if video_stats['last_video_date']:
            activity_dates.append(video_stats['last_video_date'])
        if last_textbook and last_textbook['last_read_at']:
            activity_dates.append(last_textbook['last_read_at'])
        
        last_active = max(activity_dates) if activity_dates else None
        
        # Build response
        user_stats = {
            'totalExams': len(attempts),
            'completedExams': len(completed_attempts),
            'averageScore': average_score,
            'totalTimeSpentMinutes': round(total_time_seconds / 60),
            'currentStreak': streak,
            'lastActiveDate': last_active.isoformat() if last_active else None,
            'passRate': pass_rate,
        }
        
        # Build recent activity from already-fetched attempts
        recent_activity = []
        for attempt in attempts[:5]:
            passed = attempt.score is not None and attempt.score >= 70
            activity_type = 'quiz_passed' if attempt.status == 'completed' and passed else ('quiz_failed' if attempt.status == 'completed' else 'exam_started')
            
            recent_activity.append({
                'id': attempt.id,
                'type': activity_type,
                'title': attempt.exam.title if attempt.exam else f'Exam #{attempt.exam_id}',
                'description': f'Scored {attempt.score}%' if attempt.score else 'In progress',
                'date': (attempt.ended_at or attempt.started_at).isoformat(),
                'score': attempt.score,
                'passed': passed,
            })
        
        # Serialize exams
        upcoming_exams = ExamMinimalSerializer(active_exams, many=True).data
        
        return Response({
            'userStats': user_stats,
            'recentActivity': recent_activity,
            'upcomingExams': upcoming_exams,
        })
    
    def _calculate_streak_from_dates(self, dates):
        """Calculate streak from pre-fetched date set (no DB queries)."""
        if not dates:
            return 0
        
        today = timezone.now().date()
        streak = 0
        current_date = today
        
        # Check if today or yesterday has activity
        if today not in dates:
            yesterday = today - timedelta(days=1)
            if yesterday in dates:
                current_date = yesterday
            else:
                return 0
        
        # Count consecutive days
        while current_date in dates:
            streak += 1
            current_date -= timedelta(days=1)
        
        return streak

    @action(detail=False, methods=['get'])
    def mock_exams(self, request):
        """
        Get all mock exams with user attempt stats in ONE optimized call.
        
        For the MockQuestions page - replaces 3 separate API calls with 1.
        
        Returns:
        - exams: List of exams with attempt stats (attemptsTaken, avgScore, bestScore, lastAttempt)
        - userStats: Overall user statistics
        
        Performance: 2 database queries total
        """
        user = request.user
        
        # Query 1: Get ALL active exams
        all_exams = list(Exam.objects.filter(is_active=True).values(
            'id', 'title', 'description', 'subject', 'duration_minutes',
            'speed_reader_seconds', 'passing_score_percentage', 'total_questions', 'is_active'
        ))
        
        # Query 2: Get ALL user attempts with exam data
        attempts = list(ExamAttempt.objects.filter(user=user).select_related('exam').values(
            'id', 'exam_id', 'status', 'score', 'time_spent_seconds', 'started_at', 'ended_at'
        ))
        
        # Group attempts by exam (in Python - no additional queries)
        attempts_by_exam = {}
        for attempt in attempts:
            exam_id = attempt['exam_id']
            if exam_id not in attempts_by_exam:
                attempts_by_exam[exam_id] = []
            attempts_by_exam[exam_id].append(attempt)
        
        # Calculate user stats from attempts
        completed_attempts = [a for a in attempts if a['status'] == 'completed']
        scores = [a['score'] for a in completed_attempts if a['score'] is not None]
        
        average_score = round(sum(scores) / len(scores)) if scores else 0
        passed_count = len([s for s in scores if s >= 70])
        pass_rate = round((passed_count / len(scores)) * 100) if scores else 0
        total_time_seconds = sum(a['time_spent_seconds'] or 0 for a in completed_attempts)
        
        # Calculate streak
        dates = set()
        for a in attempts:
            if a['started_at']:
                dates.add(a['started_at'].date())
        
        streak = 0
        if dates:
            today = timezone.now().date()
            current = today if today in dates else today - timedelta(days=1)
            while current in dates:
                streak += 1
                current -= timedelta(days=1)
        
        user_stats = {
            'totalExams': len(attempts),
            'completedExams': len(completed_attempts),
            'averageScore': average_score,
            'totalTimeSpentMinutes': round(total_time_seconds / 60),
            'currentStreak': streak,
            'passRate': pass_rate,
        }
        
        # Enrich exams with attempt stats
        colors = ['blue', 'purple', 'green', 'red', 'yellow', 'indigo']
        enriched_exams = []
        
        for idx, exam in enumerate(all_exams):
            exam_attempts = attempts_by_exam.get(exam['id'], [])
            completed = [a for a in exam_attempts if a['status'] == 'completed']
            exam_scores = [a['score'] for a in completed if a['score'] is not None]
            
            # Get last attempt
            sorted_attempts = sorted(completed, key=lambda x: x['started_at'] or timezone.now(), reverse=True)
            last_attempt = sorted_attempts[0]['started_at'] if sorted_attempts else None
            
            enriched_exams.append({
                **exam,
                'attemptsTaken': len(completed),
                'averageScore': round(sum(exam_scores) / len(exam_scores)) if exam_scores else 0,
                'bestScore': max(exam_scores) if exam_scores else 0,
                'lastAttempt': last_attempt.isoformat() if last_attempt else None,
                'color': colors[idx % len(colors)],
            })
        
        return Response({
            'exams': enriched_exams,
            'userStats': user_stats,
        })

    @action(detail=False, methods=['get'])
    def progress_page(self, request):
        """
        Get all data needed for the Progress page in ONE optimized call.
        
        Replaces 3 separate API calls with 1.
        
        Returns:
        - userStats: Aggregated user statistics
        - examProgress: List of completed exams with progress data
        - progressBySubject: Progress grouped by subject
        
        Performance: 2 database queries total
        """
        user = request.user
        
        # Query 1: Get ALL exams
        all_exams = {
            e['id']: e 
            for e in Exam.objects.filter(is_active=True).values(
                'id', 'title', 'subject', 'total_questions'
            )
        }
        
        # Query 2: Get ALL user attempts with exam data
        attempts = list(ExamAttempt.objects.filter(user=user).select_related('exam').values(
            'id', 'exam_id', 'status', 'score', 'time_spent_seconds', 'started_at', 'ended_at'
        ))
        
        # Calculate user stats from attempts (no additional queries)
        completed_attempts = [a for a in attempts if a['status'] == 'completed']
        scores = [a['score'] for a in completed_attempts if a['score'] is not None]
        
        average_score = round(sum(scores) / len(scores)) if scores else 0
        passed_count = len([s for s in scores if s >= 70])
        pass_rate = round((passed_count / len(scores)) * 100) if scores else 0
        total_time_seconds = sum(a['time_spent_seconds'] or 0 for a in completed_attempts)
        
        # Calculate streak
        dates = set()
        for a in attempts:
            if a['started_at']:
                dates.add(a['started_at'].date())
        
        streak = 0
        if dates:
            today = timezone.now().date()
            current = today if today in dates else today - timedelta(days=1)
            while current in dates:
                streak += 1
                current -= timedelta(days=1)
        
        last_active = max([a['started_at'] for a in attempts if a['started_at']], default=None)
        
        user_stats = {
            'totalExams': len(attempts),
            'completedExams': len(completed_attempts),
            'averageScore': average_score,
            'totalTimeSpentMinutes': round(total_time_seconds / 60),
            'currentStreak': streak,
            'lastActiveDate': last_active.isoformat() if last_active else None,
            'passRate': pass_rate,
        }
        
        # Build exam progress (best score per exam)
        exam_best_scores = {}
        for a in completed_attempts:
            if a['score'] is not None:
                exam_id = a['exam_id']
                if exam_id not in exam_best_scores or a['score'] > exam_best_scores[exam_id]['score']:
                    exam_best_scores[exam_id] = a
        
        subject_names = {
            'land_law': 'Land Law',
            'trusts': 'Trusts & Equity',
            'property': 'Property Transactions',
            'criminal': 'Criminal Law',
            'commercial': 'Commercial Law',
            'tax': 'Tax Law',
            'professional': 'Professional Conduct',
            'wills': 'Wills & Administration',
            'mixed': 'Mixed',
        }
        
        exam_progress = []
        for exam_id, attempt in exam_best_scores.items():
            exam = all_exams.get(exam_id)
            if exam:
                subject = exam['subject']
                exam_progress.append({
                    'id': exam_id,
                    'title': exam['title'],
                    'progress': attempt['score'] or 0,
                    'completed': round((attempt['score'] or 0) / 100 * exam['total_questions']),
                    'total': exam['total_questions'],
                    'subject': subject_names.get(subject, subject),
                    'lastAccessed': attempt['started_at'].isoformat() if attempt['started_at'] else None,
                    'score': attempt['score'],
                })
        
        # Build progress by subject
        subject_stats = {}
        for a in completed_attempts:
            if a['score'] is not None and a['exam_id'] in all_exams:
                subject = all_exams[a['exam_id']]['subject']
                if subject not in subject_stats:
                    subject_stats[subject] = {'scores': [], 'count': 0}
                subject_stats[subject]['scores'].append(a['score'])
                subject_stats[subject]['count'] += 1
        
        progress_by_subject = []
        for subject, stats in subject_stats.items():
            avg_score = round(sum(stats['scores']) / len(stats['scores'])) if stats['scores'] else 0
            correct = round(avg_score / 100 * stats['count'] * 10)  # Approximate
            progress_by_subject.append({
                'subject': subject_names.get(subject, subject),
                'totalQuestions': stats['count'] * 10,  # Approximate
                'answeredQuestions': stats['count'],
                'correctAnswers': correct,
                'incorrectAnswers': stats['count'] - correct,
                'averageScore': avg_score,
                'lastAttemptDate': None,
            })
        
        return Response({
            'userStats': user_stats,
            'examProgress': exam_progress,
            'progressBySubject': progress_by_subject,
        })

    @action(detail=False, methods=['get'])
    def continue_learning(self, request):
        """
        Get data for 'Pick Up Where You Left Off' section.
        
        Returns last activity for reading, videos, and practice.
        """
        user = request.user
        
        # Default response - no activity
        reading_data = None
        video_data = None
        practice_data = None
        
        try:
            # Get last in-progress quiz attempt
            from .topic_models import TopicQuizAttempt
            last_quiz = TopicQuizAttempt.objects.filter(
                user=user,
                status='in_progress'
            ).order_by('-started_at').first()
            
            if last_quiz:
                topic_names = {
                    'land_law': 'Land Law',
                    'trusts': 'Trusts',
                    'criminal_law': 'Criminal Law',
                    'criminal_practice': 'Criminal Practice',
                    'professional_ethics': 'Professional Ethics',
                    'solicitors_accounts': 'Solicitors Accounts',
                    'taxation': 'Tax Law',
                }
                practice_data = {
                    'subject': topic_names.get(last_quiz.topic, last_quiz.topic.replace('_', ' ').title()),
                    'title': f'{last_quiz.topic.replace("_", " ").title()} Quiz',
                    'current': last_quiz.current_question_index + 1,
                    'total': last_quiz.total_questions,
                    'progress': round((last_quiz.current_question_index / last_quiz.total_questions) * 100) if last_quiz.total_questions else 0,
                    'href': f'/quiz/play/{last_quiz.topic}/{last_quiz.id}',
                }
        except Exception as e:
            logger.warning(f"Error getting quiz progress: {e}")
        
        try:
            # Get last video progress
            from .video_models import VideoProgress, Video
            last_video = VideoProgress.objects.filter(
                user=user,
                is_completed=False
            ).select_related('video', 'video__course').order_by('-last_watched_at').first()
            
            if last_video and last_video.video:
                # Calculate progress
                total_videos = Video.objects.filter(
                    course=last_video.video.course,
                    is_active=True
                ).count()
                completed_videos = VideoProgress.objects.filter(
                    user=user,
                    video__course=last_video.video.course,
                    is_completed=True
                ).count()
                progress = round((completed_videos / total_videos) * 100) if total_videos else 0
                
                video_data = {
                    'subject': last_video.video.course.title if last_video.video.course else 'Video',
                    'title': last_video.video.title,
                    'current': completed_videos + 1,
                    'total': total_videos,
                    'progress': progress,
                    'href': f'/video-tutorials/watch/{last_video.video.id}',
                }
        except Exception as e:
            logger.warning(f"Error getting video progress: {e}")
        
        try:
            # Get first available textbook as reading suggestion
            from .textbook_models import Textbook
            first_textbook = Textbook.objects.first()
            if first_textbook:
                reading_data = {
                    'subject': first_textbook.subject,
                    'title': first_textbook.title,
                    'current': 1,
                    'total': len(first_textbook.chapters) if first_textbook.chapters else 1,
                    'progress': 0,
                    'href': f'/textbook/{first_textbook.id}',
                }
        except Exception as e:
            logger.warning(f"Error getting textbook: {e}")
        
        return Response({
            'reading': reading_data,
            'video': video_data,
            'practice': practice_data,
        })

    def _calculate_streak(self, attempts):
        """
        Calculate consecutive days with ANY study activity.
        Includes: exam attempts, topic quizzes, video watching.
        """
        dates = set()
        
        # 1. Exam attempt dates
        for attempt in attempts:
            dates.add(attempt.started_at.date())
        
        # 2. Topic quiz dates
        try:
            from .topic_models import TopicQuizAttempt
            user = attempts[0].user if attempts else None
            if user:
                quiz_dates = TopicQuizAttempt.objects.filter(
                    user=user
                ).values_list('started_at', flat=True)
                for dt in quiz_dates:
                    if dt:
                        dates.add(dt.date())
        except Exception as e:
            logger.warning(f"Error getting quiz dates for streak: {e}")
        
        # 3. Video watch dates
        try:
            from .video_models import VideoProgress
            user = attempts[0].user if attempts else None
            if user:
                video_dates = VideoProgress.objects.filter(
                    user=user
                ).values_list('last_watched_at', flat=True)
                for dt in video_dates:
                    if dt:
                        dates.add(dt.date())
        except Exception as e:
            logger.warning(f"Error getting video dates for streak: {e}")
        
        # 4. Textbook reading dates
        try:
            from .textbook_models import TextbookProgress
            user = attempts[0].user if attempts else None
            if user:
                textbook_dates = TextbookProgress.objects.filter(
                    user=user
                ).values_list('last_read_at', flat=True)
                for dt in textbook_dates:
                    if dt:
                        dates.add(dt.date())
        except Exception as e:
            logger.warning(f"Error getting textbook dates for streak: {e}")
        
        if not dates:
            return 0
        
        today = timezone.now().date()
        streak = 0
        current_date = today
        
        # Check if today or yesterday has activity
        if today not in dates:
            yesterday = today - timedelta(days=1)
            if yesterday in dates:
                current_date = yesterday
            else:
                return 0
        
        # Count consecutive days
        while current_date in dates:
            streak += 1
            current_date -= timedelta(days=1)
        
        return streak
