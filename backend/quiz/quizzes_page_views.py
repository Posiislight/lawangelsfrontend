from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.db.models import Count, Max
import logging

from .models import Question
from .topic_models import UserGameProfile, TopicQuizAttempt
from .topic_serializers import (
    TopicSummarySerializer,
)

logger = logging.getLogger(__name__)

# Topic icons mapping
TOPIC_ICONS = {
    'taxation': '💰',
    'criminal_law': '⚖️',
    'criminal_practice': '🔍',
    'land_law': '🏠',
    'solicitors_accounts': '📊',
    'professional_ethics': '📜',
    'trusts': '🤝',
    'wills': '📝',
}


class QuizzesPageViewSet(viewsets.ViewSet):
    """
    Optimized API for the Quizzes page.
    Returns all data needed for the page in ONE request instead of 3.
    
    Endpoints:
    - GET /quizzes-page/ - Get all quizzes page data (topics, recent attempts, profile)
    """
    permission_classes = [IsAuthenticated]

    def list(self, request):
        """
        Get complete quizzes page data in a single optimized request.
        
        Returns:
        - topics: List of topics with question counts and user stats
        - recentAttempts: Last 6 quiz attempts
        - profile: User game profile
        
        Performance: 4 database queries total (was 6+ from 3 separate API calls)
        """
        user = request.user
        
        # Query 1: Get or create user's game profile
        profile, _ = UserGameProfile.objects.get_or_create(user=user)
        
        # Query 2: Get question counts per topic
        topic_counts = Question.objects.values('topic').annotate(
            question_count=Count('id')
        )
        topic_count_map = {tc['topic']: tc['question_count'] for tc in topic_counts}
        
        # Query 3: Get user's best scores and attempt counts per topic
        user_best_scores = TopicQuizAttempt.objects.filter(
            user=user,
            status='completed'
        ).values('topic').annotate(
            best_score=Max('points_earned'),
            attempts=Count('id')
        )
        user_scores_map = {
            ubs['topic']: {
                'best_score': ubs['best_score'],
                'attempts': ubs['attempts']
            }
            for ubs in user_best_scores
        }
        
        # Query 4: Get recent attempts (last 6)
        recent_attempts = TopicQuizAttempt.objects.filter(user=user).order_by('-started_at')[:6]
        
        # Build topics list (no additional queries - all data is pre-fetched)
        topics = []
        for topic_key, topic_display in TopicQuizAttempt.TOPIC_CHOICES:
            user_data = user_scores_map.get(topic_key, {'best_score': None, 'attempts': 0})
            question_count = topic_count_map.get(topic_key, 0)
            
            # Calculate best percentage
            best_percentage = None
            if user_data['best_score'] is not None and question_count > 0:
                max_possible = min(5, question_count) * 100
                best_percentage = round((user_data['best_score'] / max_possible) * 100, 1)
            
            topics.append({
                'topic': topic_key,
                'topic_display': topic_display,
                'question_count': question_count,
                'user_attempts': user_data['attempts'],
                'best_score': user_data['best_score'],
                'best_percentage': best_percentage,
                'icon': TOPIC_ICONS.get(topic_key, '📚'),
            })
        
        # Build recent attempts list
        attempts_data = []
        for attempt in recent_attempts:
            attempts_data.append({
                'id': attempt.id,
                'topic': attempt.topic,
                'topic_display': attempt.get_topic_display(),
                'status': attempt.status,
                'correct_count': attempt.correct_count,
                'wrong_count': attempt.wrong_count,
                'total_questions': attempt.total_questions,
                'points_earned': attempt.points_earned,
                'started_at': attempt.started_at.isoformat(),
                'completed_at': attempt.completed_at.isoformat() if attempt.completed_at else None,
            })
        
        # Build profile data
        profile_data = {
            'current_level': profile.current_level,
            'rank': profile.rank,
            'rank_display': profile.get_rank_display(),
            'total_points': profile.total_points,
            'xp': profile.xp,
            'xp_to_next_level': profile.xp_to_next_level,
            'total_quizzes_completed': profile.total_quizzes_completed,
            'total_correct_answers': profile.total_correct_answers,
            'total_wrong_answers': profile.total_wrong_answers,
            'longest_streak': profile.longest_streak,
        }
        
        return Response({
            'topics': topics,
            'recentAttempts': attempts_data,
            'profile': profile_data,
        })
