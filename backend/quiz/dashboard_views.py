from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.db.models import Avg, Sum, Count
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
    """
    permission_classes = [IsAuthenticated]

    def list(self, request):
        """
        Get complete dashboard data in a single optimized request.
        
        Returns:
        - userStats: Aggregated user statistics
        - recentActivity: Last 5 exam attempts
        - upcomingExams: Active exams (limit 3)
        
        Performance: 2-3 database queries total, ~50-100ms response time
        """
        user = request.user
        
        # Query 1: Get all exam attempts with exam data (single query with select_related)
        attempts = ExamAttempt.objects.filter(user=user).select_related('exam').order_by('-started_at')
        
        # Query 2: Get active exams (single query)
        active_exams = Exam.objects.filter(is_active=True).order_by('-created_at')[:3]
        
        # Calculate stats from already-fetched data (no additional queries)
        completed_attempts = [a for a in attempts if a.status == 'completed']
        scores = [a.score for a in completed_attempts if a.score is not None]
        
        average_score = round(sum(scores) / len(scores)) if scores else 0
        passed_count = len([s for s in scores if s >= 70])
        pass_rate = round((passed_count / len(scores)) * 100) if scores else 0
        
        total_time_seconds = sum(a.time_spent_seconds or 0 for a in completed_attempts)
        
        # Calculate streak
        streak = self._calculate_streak(attempts)
        
        # Get last active date
        last_active = attempts[0].started_at if attempts else None
        
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
        
        # Build recent activity from already-fetched attempts (no additional queries)
        recent_activity = []
        for attempt in attempts[:5]:
            passed = attempt.score is not None and attempt.score >= 70
            if attempt.status == 'completed':
                activity_type = 'quiz_passed' if passed else 'quiz_failed'
            else:
                activity_type = 'exam_started'
                
            recent_activity.append({
                'id': attempt.id,
                'type': activity_type,
                'title': attempt.exam.title if attempt.exam else f'Exam #{attempt.exam_id}',
                'description': f'Scored {attempt.score}%' if attempt.score else 'In progress',
                'date': (attempt.ended_at or attempt.started_at).isoformat(),
                'score': attempt.score,
                'passed': passed,
            })
        
        # Serialize exams (uses lightweight serializer)
        upcoming_exams = ExamMinimalSerializer(active_exams, many=True).data
        
        return Response({
            'userStats': user_stats,
            'recentActivity': recent_activity,
            'upcomingExams': upcoming_exams,
        })

    def _calculate_streak(self, attempts):
        """Calculate consecutive days with activity"""
        if not attempts:
            return 0
        
        dates = set()
        for attempt in attempts:
            dates.add(attempt.started_at.date())
        
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
