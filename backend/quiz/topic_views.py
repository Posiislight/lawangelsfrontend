from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.utils import timezone
from django.db.models import Count, Max
from django.db import transaction
import random
import logging

from .models import Question
from .topic_models import UserGameProfile, TopicQuizAttempt, TopicQuizAnswer
from .topic_serializers import (
    UserGameProfileSerializer,
    TopicSummarySerializer,
    TopicQuizAttemptSerializer,
    TopicQuizQuestionSerializer,
    TopicQuizQuestionWithAnswerSerializer,
    SubmitAnswerRequestSerializer,
    SubmitAnswerResponseSerializer,
    TopicQuizResultSerializer,
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


class UserGameProfileViewSet(viewsets.ReadOnlyModelViewSet):
    """
    ViewSet for user's game profile.
    
    Endpoints:
    - GET /game-profile/ - Get current user's game profile
    """
    serializer_class = UserGameProfileSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return UserGameProfile.objects.filter(user=self.request.user)

    def list(self, request):
        """Get or create the current user's game profile"""
        profile, created = UserGameProfile.objects.get_or_create(user=request.user)
        serializer = self.get_serializer(profile)
        return Response(serializer.data)


class TopicViewSet(viewsets.ViewSet):
    """
    ViewSet for topic listing and questions.
    
    Endpoints:
    - GET /topics/ - List all topics with question counts and user stats
    - GET /topics/{topic}/questions/ - Get questions for a specific topic
    """
    permission_classes = [IsAuthenticated]

    def list(self, request):
        """List all topics with question counts and user stats"""
        user = request.user
        
        # Get question counts per topic
        topic_counts = Question.objects.values('topic').annotate(
            question_count=Count('id')
        )
        topic_count_map = {tc['topic']: tc['question_count'] for tc in topic_counts}
        
        # Get user's best scores per topic
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
        
        # Build topic list
        topics = []
        for topic_key, topic_display in TopicQuizAttempt.TOPIC_CHOICES:
            user_data = user_scores_map.get(topic_key, {'best_score': None, 'attempts': 0})
            question_count = topic_count_map.get(topic_key, 0)
            
            # Calculate best percentage (assuming 5 questions, 100 points each = 500 max)
            best_percentage = None
            if user_data['best_score'] is not None and question_count > 0:
                max_possible = min(5, question_count) * 100  # 5 questions per quiz
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
        
        serializer = TopicSummarySerializer(topics, many=True)
        return Response(serializer.data)

    @action(detail=True, methods=['get'])
    def questions(self, request, pk=None):
        """Get questions for a specific topic (for browsing, not quiz)"""
        topic = pk
        questions = Question.objects.filter(topic=topic).prefetch_related('options')
        serializer = TopicQuizQuestionSerializer(questions, many=True)
        return Response(serializer.data)


class TopicQuizAttemptViewSet(viewsets.ModelViewSet):
    """
    ViewSet for topic quiz attempts.
    
    Endpoints:
    - GET /topic-attempts/ - List user's topic quiz attempts
    - POST /topic-attempts/ - Start a new topic quiz
    - GET /topic-attempts/{id}/ - Get attempt details
    - POST /topic-attempts/{id}/submit-answer/ - Submit answer
    - GET /topic-attempts/{id}/current-question/ - Get current question
    - GET /topic-attempts/{id}/summary/ - Get completed quiz summary
    """
    serializer_class = TopicQuizAttemptSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return TopicQuizAttempt.objects.filter(user=self.request.user)

    @transaction.atomic
    def create(self, request, *args, **kwargs):
        """Start a new topic quiz"""
        topic = request.data.get('topic')
        num_questions = request.data.get('num_questions', 5)
        
        # Validate topic
        valid_topics = [choice[0] for choice in TopicQuizAttempt.TOPIC_CHOICES]
        if topic not in valid_topics:
            return Response(
                {'error': f'Invalid topic. Valid options: {valid_topics}'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Get questions for this topic
        questions = list(Question.objects.filter(topic=topic).values_list('id', flat=True))
        
        if not questions:
            return Response(
                {'error': f'No questions available for topic: {topic}'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Limit and randomize questions
        num_questions = min(num_questions, len(questions), 10)  # Max 10 per quiz
        selected_questions = random.sample(questions, num_questions)
        
        # Ensure user has a game profile
        UserGameProfile.objects.get_or_create(user=request.user)
        
        # Create the attempt
        attempt = TopicQuizAttempt.objects.create(
            user=request.user,
            topic=topic,
            total_questions=num_questions,
            lives_remaining=3,
        )
        attempt.set_question_id_list(selected_questions)
        attempt.save()
        
        logger.info(f"User {request.user.username} started topic quiz: {topic} with {num_questions} questions")
        
        serializer = self.get_serializer(attempt)
        return Response(serializer.data, status=status.HTTP_201_CREATED)

    @action(detail=True, methods=['get'])
    def current_question(self, request, pk=None):
        """Get the current question for an in-progress quiz"""
        try:
            attempt = self.get_queryset().get(pk=pk)
        except TopicQuizAttempt.DoesNotExist:
            return Response({'error': 'Attempt not found'}, status=status.HTTP_404_NOT_FOUND)
        
        if attempt.status != 'in_progress':
            return Response(
                {'error': 'Quiz is not in progress', 'status': attempt.status},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        question_ids = attempt.get_question_id_list()
        if attempt.current_question_index >= len(question_ids):
            return Response({'error': 'No more questions'}, status=status.HTTP_400_BAD_REQUEST)
        
        current_q_id = question_ids[attempt.current_question_index]
        question = Question.objects.prefetch_related('options').get(id=current_q_id)
        
        serializer = TopicQuizQuestionSerializer(question)
        return Response({
            'question': serializer.data,
            'question_number': attempt.current_question_index + 1,
            'total_questions': attempt.total_questions,
            'lives_remaining': attempt.lives_remaining,
            'points_earned': attempt.points_earned,
            'current_streak': attempt.current_streak,
        })

    @action(detail=True, methods=['post'])
    @transaction.atomic
    def submit_answer(self, request, pk=None):
        """Submit an answer to the current question"""
        try:
            attempt = self.get_queryset().select_for_update().get(pk=pk)
        except TopicQuizAttempt.DoesNotExist:
            return Response({'error': 'Attempt not found'}, status=status.HTTP_404_NOT_FOUND)
        
        if attempt.status != 'in_progress':
            return Response(
                {'error': 'Quiz is not in progress', 'status': attempt.status},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Validate request
        serializer = SubmitAnswerRequestSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        
        question_id = serializer.validated_data['question_id']
        selected_answer = serializer.validated_data['selected_answer']
        time_spent = serializer.validated_data.get('time_spent_seconds', 0)
        
        # Verify this is the current question
        question_ids = attempt.get_question_id_list()
        if attempt.current_question_index >= len(question_ids):
            return Response({'error': 'No more questions'}, status=status.HTTP_400_BAD_REQUEST)
        
        expected_q_id = question_ids[attempt.current_question_index]
        if question_id != expected_q_id:
            return Response(
                {'error': f'Unexpected question. Expected {expected_q_id}, got {question_id}'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Check if already answered
        if TopicQuizAnswer.objects.filter(attempt=attempt, question_id=question_id).exists():
            return Response({'error': 'Question already answered'}, status=status.HTTP_400_BAD_REQUEST)
        
        # Get question and check answer
        question = Question.objects.prefetch_related('options').get(id=question_id)
        is_correct = selected_answer == question.correct_answer
        
        # Record the answer and update game state
        points_earned = attempt.record_answer(is_correct)
        
        TopicQuizAnswer.objects.create(
            attempt=attempt,
            question_id=question_id,
            selected_answer=selected_answer,
            is_correct=is_correct,
            points_earned=points_earned,
            time_spent_seconds=time_spent,
        )
        
        # If quiz completed, update user's game profile
        if attempt.status in ['completed', 'failed']:
            attempt.completed_at = timezone.now()
            attempt.save()
            
            profile = UserGameProfile.objects.get(user=request.user)
            profile.total_correct_answers += attempt.correct_count
            profile.total_wrong_answers += attempt.wrong_count
            
            if attempt.status == 'completed':
                profile.total_quizzes_completed += 1
                profile.add_xp(attempt.points_earned)
                
                if attempt.current_streak > profile.longest_streak:
                    profile.longest_streak = attempt.current_streak
            
            profile.save()
        
        # Prepare next question if available
        next_question = None
        if attempt.status == 'in_progress' and attempt.current_question_index < len(question_ids):
            next_q_id = question_ids[attempt.current_question_index]
            next_q = Question.objects.prefetch_related('options').get(id=next_q_id)
            next_question = TopicQuizQuestionSerializer(next_q).data
        
        response_data = {
            'is_correct': is_correct,
            'correct_answer': question.correct_answer,
            'explanation': question.explanation,
            'points_earned': points_earned,
            'total_points': attempt.points_earned,
            'lives_remaining': attempt.lives_remaining,
            'current_streak': attempt.current_streak,
            'quiz_status': attempt.status,
            'next_question': next_question,
        }
        
        logger.info(f"User {request.user.username} answered Q{question_id}: {'correct' if is_correct else 'wrong'}, +{points_earned}pts")
        
        return Response(response_data)

    @action(detail=True, methods=['get'])
    def summary(self, request, pk=None):
        """Get summary for a completed quiz"""
        try:
            attempt = self.get_queryset().prefetch_related('answers').get(pk=pk)
        except TopicQuizAttempt.DoesNotExist:
            return Response({'error': 'Attempt not found'}, status=status.HTTP_404_NOT_FOUND)
        
        if attempt.status == 'in_progress':
            return Response(
                {'error': 'Quiz is still in progress'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Get user's updated profile
        profile = UserGameProfile.objects.get(user=request.user)
        
        serializer = TopicQuizResultSerializer(attempt)
        result = serializer.data
        result['user_profile'] = {
            'current_level': profile.current_level,
            'rank': profile.rank,
            'rank_display': profile.get_rank_display(),
            'total_points': profile.total_points,
            'xp': profile.xp,
            'xp_to_next_level': profile.xp_to_next_level,
        }
        
        return Response(result)

    @action(detail=True, methods=['post'])
    def use_powerup(self, request, pk=None):
        """Use a power-up (50/50 or time freeze)"""
        try:
            attempt = self.get_queryset().get(pk=pk)
        except TopicQuizAttempt.DoesNotExist:
            return Response({'error': 'Attempt not found'}, status=status.HTTP_404_NOT_FOUND)
        
        if attempt.status != 'in_progress':
            return Response({'error': 'Quiz is not in progress'}, status=status.HTTP_400_BAD_REQUEST)
        
        powerup = request.data.get('powerup')
        
        if powerup == 'fifty_fifty':
            if attempt.fifty_fifty_used:
                return Response({'error': '50/50 already used'}, status=status.HTTP_400_BAD_REQUEST)
            
            # Get current question and return 2 wrong options to eliminate
            question_ids = attempt.get_question_id_list()
            current_q_id = question_ids[attempt.current_question_index]
            question = Question.objects.prefetch_related('options').get(id=current_q_id)
            
            wrong_options = [opt.label for opt in question.options.all() if opt.label != question.correct_answer]
            # Pick 2 random wrong options to eliminate
            options_to_eliminate = random.sample(wrong_options, min(2, len(wrong_options)))
            
            attempt.fifty_fifty_used = True
            attempt.save()
            
            return Response({'eliminated_options': options_to_eliminate})
        
        elif powerup == 'time_freeze':
            if attempt.time_freeze_used:
                return Response({'error': 'Time freeze already used'}, status=status.HTTP_400_BAD_REQUEST)
            
            attempt.time_freeze_used = True
            attempt.save()
            
            return Response({'message': 'Time freeze activated'})
        
        return Response({'error': 'Invalid powerup'}, status=status.HTTP_400_BAD_REQUEST)
