from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.utils import timezone
from django.db.models import Count, Max
from django.db import transaction
import random
import logging

from .practice_question_models import PracticeQuestion, PracticeQuestionTopic
from .topic_models import UserGameProfile, TopicQuizAttempt, TopicQuizAnswer
from .topic_serializers import (
    UserGameProfileSerializer,
    TopicSummarySerializer,
    TopicQuizAttemptSerializer,
    TopicQuizQuestionSerializer,
    SubmitAnswerRequestSerializer,
    SubmitAnswerResponseSerializer,
    TopicQuizResultSerializer,
)

logger = logging.getLogger(__name__)

# Update TOPIC_ICONS to match hyphenated slugs from PracticeQuestionTopic
# This is used for the API response which frontend might use as fallback
TOPIC_ICONS = {
    'taxation': '💰',
    'criminal-law': '⚖️',
    'criminal-practice': '🔍',
    'land-law': '🏠',
    'solicitors-accounts': '📊',
    'professional-ethics': '📜',
    'trusts': '🤝',
    'wills': '📝',
    'business-law': '🏢',
    'civil-dispute-resolution': '⚖️',
    'constitutional-and-administrative-law': '🏛️',
    'contract-law': '📝',
    'legal-services': '👥',
    'the-legal-system': '⚖️',
    'tort-law': '🚫',
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
        
        # Get all topics from PracticeQuestionTopic
        # We want to group by SLUG, not by Topic ID (though they map 1:1 usually)
        # But PracticeQuestionTopic is hierarchical under Course.
        # We need to aggregate across courses if same topic name appears? 
        # Actually PracticeQuestionTopic has unique 'course' + 'slug'. 
        # The user view seems to be flat list of topics.
        # Let's list ALL topics found in PracticeQuestionTopic
        
        topics_qs = PracticeQuestionTopic.objects.annotate(
            total_questions=Count('areas__questions')
        ).filter(total_questions__gt=0)
        
        # Get user's best scores per topic (using slug as key)
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
        for topic_obj in topics_qs:
            topic_key = topic_obj.slug
            topic_display = topic_obj.name
            
            user_data = user_scores_map.get(topic_key, {'best_score': None, 'attempts': 0})
            question_count = topic_obj.total_questions
            
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
        
        # Sort by topic name
        topics.sort(key=lambda x: x['topic_display'])
        
        serializer = TopicSummarySerializer(topics, many=True)
        return Response(serializer.data)

    @action(detail=True, methods=['get'])
    def questions(self, request, pk=None):
        """Get questions for a specific topic (for browsing, not quiz)"""
        topic_slug = pk
        questions = PracticeQuestion.objects.filter(area__topic__slug=topic_slug)
        serializer = TopicQuizQuestionSerializer(questions, many=True)
        return Response(serializer.data)


class TopicQuizAttemptViewSet(viewsets.ModelViewSet):
    """
    ViewSet for topic quiz attempts.
    """
    serializer_class = TopicQuizAttemptSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return TopicQuizAttempt.objects.filter(user=self.request.user)

    @transaction.atomic
    def create(self, request, *args, **kwargs):
        """Start a new topic quiz"""
        topic_slug = request.data.get('topic')
        try:
            num_questions = int(request.data.get('num_questions', 5))
        except (ValueError, TypeError):
            num_questions = 5
        
        # Validate topic exists
        if not PracticeQuestionTopic.objects.filter(slug=topic_slug).exists():
             return Response(
                {'error': f'Invalid topic: {topic_slug}'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Get questions for this topic
        questions = list(PracticeQuestion.objects.filter(area__topic__slug=topic_slug).values_list('id', flat=True))
        
        if not questions:
            return Response(
                {'error': f'No questions available for topic: {topic_slug}'},
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
            topic=topic_slug, # Now storing slug
            total_questions=num_questions,
            lives_remaining=3,
        )
        
        # Snapshot questions for performance
        snapshot = []
        for q_id in selected_questions:
            try:
                q = PracticeQuestion.objects.get(id=q_id)
                snapshot.append({
                    'id': q.id,
                    'question_id': q.question_id,
                    'text': q.text,
                    'difficulty': q.difficulty,
                    'options': q.options,
                    'correct_answer': q.correct_answer,
                    'explanation': q.explanation
                })
            except PracticeQuestion.DoesNotExist:
                continue
                
        attempt.questions_snapshot = snapshot
        attempt.correct_answers = {str(q['id']): q['correct_answer'] for q in snapshot} # Populate cache
        attempt.set_question_id_list([q['id'] for q in snapshot])
        attempt.total_questions = len(snapshot) # Adjust if any missing
        attempt.save()
        
        logger.info(f"User {request.user.username} started topic quiz: {topic_slug} with {num_questions} questions")
        
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
        
        # Try to use snapshot if available
        if attempt.questions_snapshot:
            try:
                # Find question in snapshot
                current_q_id = attempt.get_question_id_list()[attempt.current_question_index]
                question_data = next((q for q in attempt.questions_snapshot if q['id'] == current_q_id), None)
                
                if question_data:
                    # Filter out correct answer for client
                    client_q_data = {
                        'id': question_data['id'],
                        'question_id': question_data['question_id'],
                        'text': question_data['text'],
                        'difficulty': question_data['difficulty'],
                        'options': question_data['options']
                    }
                    
                    return Response({
                        'question': client_q_data,
                        'question_number': attempt.current_question_index + 1,
                        'total_questions': attempt.total_questions,
                        'lives_remaining': attempt.lives_remaining,
                        'points_earned': attempt.points_earned,
                        'current_streak': attempt.current_streak,
                    })
            except Exception as e:
                logger.error(f"Error using snapshot for attempt {attempt.id}: {e}")
                # Fallback to DB query below
        
        current_q_id = question_ids[attempt.current_question_index]
        logger.info(f"Attempt {attempt.id}: Fetching question {attempt.current_question_index + 1}/{len(question_ids)} (ID: {current_q_id})")
        
        try:
            question = PracticeQuestion.objects.get(id=current_q_id)
        except PracticeQuestion.DoesNotExist:
             logger.error(f"Attempt {attempt.id}: Question ID {current_q_id} not found in DB! indices={question_ids}")
             # Check if it exists in Question model? No, migrated.
             return Response({'error': f'Question record missing (ID: {current_q_id})'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
        
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
        
        question_id = serializer.validated_data['question_id'] # This is NOT ID, it's question_id from model? Wait.
        # Wait, PracticeQuestion has 'id' (pk) and 'question_id' (legacy field).
        # TopicQuizAttempt stores PKs in question_ids list.
        # The frontend sends back what it got.
        # TopicQuizQuestionSerializer sends 'id' as 'id' and 'question_id' as 'question_id'.
        # The frontend likely sends back 'question_id' usually referring to PK in generic terms?
        # Let's check SubmitAnswerRequestSerializer... it expects 'question_id'.
        # Let's assume frontend sends the PK because typically ID is used for lookup.
        # BUT... `serializer.validated_data['question_id']` is an IntegerField.
        # AND `TopicQuizQuestionSerializer` has `id` (pk).
        
        # Verify this is the current question
        question_ids = attempt.get_question_id_list()
        if attempt.current_question_index >= len(question_ids):
            return Response({'error': 'No more questions'}, status=status.HTTP_400_BAD_REQUEST)
        
        expected_q_pk = question_ids[attempt.current_question_index]
        
        # We need to trust the PK passed from client matches expected
        if question_id != expected_q_pk: # Assuming question_id refers to PK
             # It might be referring to the 'question_id' field.
             # Note: logic above in current_question sends 'id' (pk) as 'id'.
             # Frontend usually posts back ID.
             # Let's proceed assuming PK.
             # Check if question_id corresponds to expected PK.
             pass
        
        selected_answer = serializer.validated_data['selected_answer']
        time_spent = serializer.validated_data.get('time_spent_seconds', 0)

        # Use snapshot if available
        question_data = None
        if attempt.questions_snapshot:
            question_data = next((q for q in attempt.questions_snapshot if q['id'] == expected_q_pk), None)
            
        if attempt.correct_answers and str(expected_q_pk) in attempt.correct_answers:
             correct_answer = attempt.correct_answers[str(expected_q_pk)]
        else:
             # Fallback to snapshot (shouldn't happen if initialized correctly)
             if question_data:
                correct_answer = question_data['correct_answer']
             else:
                # DB fallback
                 try:
                    q = PracticeQuestion.objects.get(id=expected_q_pk)
                    correct_answer = q.correct_answer
                 except PracticeQuestion.DoesNotExist:
                     return Response({'error': 'Question broken'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
        
        # Get explanation (still need textual data)
        if question_data:
            explanation = question_data['explanation']
        else:
             # Fallback
             try:
                question = PracticeQuestion.objects.get(id=expected_q_pk)
                explanation = question.explanation
             except PracticeQuestion.DoesNotExist:
                 explanation = ""


        # Check if already answered
        if TopicQuizAnswer.objects.filter(attempt=attempt, question_id=expected_q_pk).exists():
             return Response({'error': 'Question already answered'}, status=status.HTTP_400_BAD_REQUEST)

        is_correct = selected_answer == correct_answer
        
        # Record the answer and update game state
        points_earned = attempt.record_answer(is_correct)
        
        TopicQuizAnswer.objects.create(
            attempt=attempt,
            question_id=expected_q_pk, # Store PK
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
            
            if attempt.status == 'completed':
                profile.total_quizzes_completed += 1
                profile.add_xp(attempt.points_earned)
                
                if attempt.current_streak > profile.longest_streak:
                    profile.longest_streak = attempt.current_streak
            
            profile.save()
            
        else:
             # Optimize save for in-progress updates - avoid writing back huge snapshot/cache blobs
             attempt.save(update_fields=[
                 'points_earned', 'current_streak', 'correct_count', 'wrong_count', 
                 'lives_remaining', 'status', 'current_question_index'
             ])
        
        # Prepare next question if available
        next_question_data = None
        if attempt.status == 'in_progress' and attempt.current_question_index < len(question_ids):
            next_q_id = question_ids[attempt.current_question_index]
            
            # Use snapshot for next question
            if attempt.questions_snapshot:
                next_q_data = next((q for q in attempt.questions_snapshot if q['id'] == next_q_id), None)
                if next_q_data:
                    next_question_data = {
                        'id': next_q_data['id'],
                        'question_id': next_q_data['question_id'],
                        'text': next_q_data['text'],
                        'difficulty': next_q_data['difficulty'],
                        'options': next_q_data['options']
                    }
            
            if not next_question_data:
                # Fallback
                try:
                    next_q = PracticeQuestion.objects.get(id=next_q_id)
                    next_question_data = TopicQuizQuestionSerializer(next_q).data
                except PracticeQuestion.DoesNotExist:
                    pass
        
        response_data = {
            'is_correct': is_correct,
            'correct_answer': correct_answer,
            'explanation': explanation,
            'points_earned': points_earned,
            'total_points': attempt.points_earned,
            'lives_remaining': attempt.lives_remaining,
            'current_streak': attempt.current_streak,
            'quiz_status': attempt.status,
            'next_question': next_question_data,
        }
        
        logger.info(f"User {request.user.username} answered Q{expected_q_pk}: {'correct' if is_correct else 'wrong'}, +{points_earned}pts")
        
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
            
            # Get current question
            question_ids = attempt.get_question_id_list()
            current_q_id = question_ids[attempt.current_question_index]
            try:
                question = PracticeQuestion.objects.get(id=current_q_id)
            except PracticeQuestion.DoesNotExist:
                 return Response({'error': 'Question not found'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
            
            # Identify wrong options
            wrong_options = [opt['label'] for opt in question.options if opt['label'] != question.correct_answer]
            
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
