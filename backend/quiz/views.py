from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, AllowAny, IsAdminUser
from django.utils import timezone
from django.shortcuts import get_object_or_404
from django.db import OperationalError, transaction
import logging
import time

logger = logging.getLogger(__name__)

from .models import (
    Exam, Question, QuestionOption, ExamAttempt, QuestionAnswer, ExamTimingConfig, Review
)
from .serializers import (
    ExamSerializer, ExamDetailSerializer, QuestionDetailSerializer,
    ExamAttemptCreateSerializer, ExamAttemptSerializer, ExamAttemptLightSerializer,
    ExamAttemptListSerializer, ExamAttemptUpdateSerializer, QuestionAnswerSerializer,
    ExamTimingConfigSerializer, CSVUploadSerializer, ExamAttemptMinimalCreateSerializer,
    ExamAttemptReviewSerializer,
    QuestionForAttemptSerializer, QuestionAnswerSubmitSerializer, ReviewSerializer, ReviewCreateSerializer
)
from .csv_parser import CSVQuestionParser
from logging_utils import ViewLoggingMixin, log_queryset_access


def get_response_size_kb(data):
    """Calculate response size efficiently without full JSON serialization"""
    try:
        # Estimate based on string length (much faster than json.dumps)
        return len(str(data).encode('utf-8')) / 1024
    except:
        return 0


class ExamViewSet(viewsets.ReadOnlyModelViewSet):
    """
    ViewSet for Exam model
    Endpoints:
    - GET /exams/ - List all exams
    - GET /exams/{id}/ - Retrieve exam with questions
    - GET /exams/{id}/questions/ - Get all questions for exam
    """
    queryset = Exam.objects.filter(is_active=True)
    serializer_class = ExamSerializer
    permission_classes = []

    def get_queryset(self):
        """Log queryset access with optimized queries"""
        queryset = super().get_queryset()
        # Only prefetch questions on detail view, not on list
        if self.action == 'retrieve':
            queryset = queryset.prefetch_related('questions__options')
        log_queryset_access(queryset, 'LIST' if self.action == 'list' else 'RETRIEVE')
        return queryset

    def get_serializer_class(self):
        if self.action == 'retrieve':
            return ExamDetailSerializer
        return ExamSerializer

    @action(detail=True, methods=['get'])
    def questions(self, request, pk=None):
        """Get all questions for an exam"""
        exam = self.get_object()
        questions = exam.questions.prefetch_related('options')
        log_queryset_access(questions, 'LIST')
        serializer = QuestionDetailSerializer(questions, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=['get'])
    def config(self, request):
        """Get global exam timing configuration"""
        config = ExamTimingConfig.objects.first()
        if not config:
            config = ExamTimingConfig.objects.create()
        serializer = ExamTimingConfigSerializer(config)
        return Response(serializer.data)

    @action(detail=False, methods=['post'], permission_classes=[IsAdminUser])
    def import_questions(self, request):
        """
        Import questions from CSV file
        POST body: multipart/form-data with exam_id and csv_file
        
        CSV Format (required columns):
        - question_number: Question number (integer)
        - question_text: The question text
        - difficulty: easy, medium, or hard
        - option_a: Option A text
        - option_b: Option B text
        - option_c: Option C text
        - option_d: Option D text
        - option_e: Option E text
        - correct_answer: A, B, C, D, or E
        - explanation: Detailed explanation
        """
        try:
            serializer = CSVUploadSerializer(data=request.data)
            if not serializer.is_valid():
                return Response(
                    {'success': False, 'errors': serializer.errors},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            exam_id = serializer.validated_data['exam_id']
            csv_file = serializer.validated_data['csv_file']
            
            # Read CSV file
            csv_content = csv_file.read().decode('utf-8')
            
            # Validate CSV format
            is_valid, error_msg = CSVQuestionParser.validate_csv_format(csv_content)
            if not is_valid:
                return Response(
                    {'success': False, 'message': error_msg},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            # Parse CSV
            questions_data, parse_error = CSVQuestionParser.parse_csv(csv_content)
            if parse_error:
                return Response(
                    {'success': False, 'message': parse_error},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            # Get exam
            exam = get_object_or_404(Exam, id=exam_id)
            
            # Import questions in transaction
            with transaction.atomic():
                created_count = 0
                skipped_count = 0
                
                for question_data in questions_data:
                    # Check if question already exists
                    question_exists = Question.objects.filter(
                        exam=exam,
                        question_number=question_data['question_number']
                    ).exists()
                    
                    if question_exists:
                        skipped_count += 1
                        logger.info(f"Question {question_data['question_number']} already exists, skipping")
                        continue
                    
                    # Create question
                    question = Question.objects.create(
                        exam=exam,
                        question_number=question_data['question_number'],
                        text=question_data['text'],
                        difficulty=question_data['difficulty'],
                        correct_answer=question_data['correct_answer'],
                        explanation=question_data['explanation']
                    )
                    
                    # Create options
                    for label, text in question_data['options'].items():
                        QuestionOption.objects.create(
                            question=question,
                            label=label,
                            text=text
                        )
                    
                    created_count += 1
                    logger.info(f"Created question {question.id}: {question}")
            
            # Update exam total_questions count
            exam.save()
            
            return Response(
                {
                    'success': True,
                    'message': f'Successfully imported {created_count} questions',
                    'created': created_count,
                    'skipped': skipped_count,
                    'exam': ExamDetailSerializer(exam).data
                },
                status=status.HTTP_201_CREATED
            )
        
        except Exception as e:
            logger.error(f"Error importing questions: {str(e)}")
            return Response(
                {'success': False, 'message': f'Error importing questions: {str(e)}'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


class QuestionViewSet(viewsets.ReadOnlyModelViewSet):
    """
    ViewSet for Question model
    Endpoints:
    - GET /questions/ - List all questions (without answers)
    - GET /questions/{id}/ - Retrieve question with options
    """
    queryset = Question.objects.select_related('exam').prefetch_related('options')
    serializer_class = QuestionDetailSerializer
    permission_classes = []

    def get_queryset(self):
        """Filter by exam if exam_id is provided in query params with optimized queries"""
        queryset = super().get_queryset().prefetch_related('options')
        log_queryset_access(queryset, 'LIST')
        exam_id = self.request.query_params.get('exam_id')
        if exam_id:
            queryset = queryset.filter(exam_id=exam_id)
        return queryset


class ExamAttemptViewSet(viewsets.ModelViewSet):
    """
    ViewSet for ExamAttempt model
    Endpoints:
    - GET /exam-attempts/ - List user's exam attempts
    - POST /exam-attempts/ - Create new exam attempt
    - GET /exam-attempts/{id}/ - Retrieve exam attempt details
    - PATCH /exam-attempts/{id}/ - End exam attempt
    - POST /exam-attempts/{id}/submit-answer/ - Submit answer to question
    - GET /exam-attempts/{id}/review/ - Get exam review with answers
    """
    serializer_class = ExamAttemptSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        """Return only current user's attempts with optimized queries"""
        queryset = ExamAttempt.objects.filter(user=self.request.user).prefetch_related(
            'answers__question',
            'selected_questions__options'
        ).select_related('exam')
        log_queryset_access(queryset, 'LIST')
        return queryset

    def get_serializer_class(self):
        if self.action == 'create':
            return ExamAttemptCreateSerializer  # Input validation serializer
        elif self.action == 'list':
            return ExamAttemptListSerializer
        elif self.action in ['partial_update', 'update']:
            return ExamAttemptUpdateSerializer
        return ExamAttemptSerializer

    def _select_balanced_questions(self, exam_id, target_count=60):
        """
        Select questions with equal distribution across topics.
        If a topic has fewer questions than needed, take all and distribute remainder.
        """
        import random
        from collections import defaultdict
        
        # Get all questions grouped by topic
        questions_by_topic = defaultdict(list)
        all_questions = Question.objects.filter(exam_id=exam_id).values_list('id', 'topic')
        
        for q_id, topic in all_questions:
            questions_by_topic[topic].append(q_id)
        
        if not questions_by_topic:
            # Fallback: if no topics, just random select
            return list(Question.objects.filter(exam_id=exam_id).order_by('?')[:target_count].values_list('id', flat=True))
        
        # Calculate questions per topic
        num_topics = len(questions_by_topic)
        questions_per_topic = target_count // num_topics
        remainder = target_count % num_topics
        
        selected_ids = []
        topics_with_extra = random.sample(list(questions_by_topic.keys()), min(remainder, num_topics))
        
        for topic, question_ids in questions_by_topic.items():
            # Determine how many to take from this topic
            to_take = questions_per_topic
            if topic in topics_with_extra:
                to_take += 1
            
            # Shuffle and take
            random.shuffle(question_ids)
            selected_ids.extend(question_ids[:to_take])
        
        # If we still need more (some topics had fewer questions), fill from remaining
        if len(selected_ids) < target_count:
            all_available = [q_id for ids in questions_by_topic.values() for q_id in ids if q_id not in selected_ids]
            random.shuffle(all_available)
            selected_ids.extend(all_available[:target_count - len(selected_ids)])
        
        return selected_ids

    def create(self, request, *args, **kwargs):
        """Create a new exam attempt with optimized performance
        
        Performance targets:
        - Total time: 500-800ms (down from 21s)
        - Database queries: 5-10 (down from 88)
        """
        total_start = time.time()
        logger.info(f"[TIMING] === CREATE EXAM ATTEMPT START ===")
        
        if not request.user.is_authenticated:
            logger.warning("Unauthenticated attempt to create exam attempt")
            return Response(
                {
                    'success': False,
                    'message': 'Authentication required to start exam',
                    'detail': 'Please log in first'
                },
                status=status.HTTP_401_UNAUTHORIZED
            )
        
        try:
            # Step 1: Validate input
            step_start = time.time()
            serializer = self.get_serializer(data=request.data, context={'request': request})
            if not serializer.is_valid():
                logger.warning(f"Invalid exam attempt data: {serializer.errors}")
                return Response(
                    {
                        'success': False,
                        'errors': serializer.errors,
                        'message': 'Invalid exam attempt data'
                    },
                    status=status.HTTP_400_BAD_REQUEST
                )
            logger.info(f"[TIMING] [1] Validation: {(time.time() - step_start)*1000:.2f}ms")
            
            exam_id = serializer.validated_data['exam_id']
            
            # Step 2: Check for existing attempt with optimized query
            step_start = time.time()
            # Use select_related to avoid extra query, change to single status check
            existing_attempt = ExamAttempt.objects.select_related('exam').filter(
                user=request.user,
                exam_id=exam_id,
                status='in_progress'  # Single value, no list
            ).first()
            logger.info(f"[TIMING] [2] Check existing: {(time.time() - step_start)*1000:.2f}ms")
            
            if existing_attempt:
                # If attempt exists but has no selected questions, populate them now
                if existing_attempt.selected_questions.count() == 0:
                    step_start = time.time()
                    selected_question_ids = self._select_balanced_questions(exam_id, target_count=60)
                    existing_attempt.selected_questions.set(selected_question_ids)
                    logger.info(f"[TIMING] [3] Populate existing with balanced questions: {(time.time() - step_start)*1000:.2f}ms")
                
                logger.info(f"User {request.user.username} resuming existing attempt for exam {exam_id}")
                # Use minimal serializer for faster response
                response_serializer = ExamAttemptMinimalCreateSerializer(existing_attempt)
                return Response(response_serializer.data, status=status.HTTP_200_OK)
            
            # Step 3: Create new attempt
            step_start = time.time()
            attempt = ExamAttempt.objects.create(
                user=request.user,
                exam_id=exam_id,
                speed_reader_enabled=serializer.validated_data.get('speed_reader_enabled', False)
            )
            logger.info(f"[TIMING] [3] Create attempt DB: {(time.time() - step_start)*1000:.2f}ms")
            
            # Step 4: Select 60 questions with equal topic distribution
            step_start = time.time()
            selected_question_ids = self._select_balanced_questions(exam_id, target_count=60)
            num_questions = len(selected_question_ids)
            logger.info(f"[TIMING] [4] Balanced topic sample {num_questions} questions: {(time.time() - step_start)*1000:.2f}ms")
            
            # Step 5: Bulk set relations (optimized - use through model directly)
            step_start = time.time()
            # Get the through model for the M2M relationship
            through_model = ExamAttempt.selected_questions.through
            
            # Create through model instances for bulk insert
            through_instances = [
                through_model(examattempt_id=attempt.id, question_id=qid)
                for qid in selected_question_ids
            ]
            
            # Bulk create the relationships (much faster than .set())
            through_model.objects.bulk_create(through_instances, ignore_conflicts=True)
            logger.info(f"[TIMING] [5] Bulk set selected questions: {(time.time() - step_start)*1000:.2f}ms")
            
            # Step 6: Serialize response with minimal serializer (no nested questions)
            step_start = time.time()
            # Fetch attempt with only needed relations for minimal serializer
            attempt = ExamAttempt.objects.select_related('exam').get(id=attempt.id)
            response_serializer = ExamAttemptMinimalCreateSerializer(attempt)
            logger.info(f"[TIMING] [6] Serialize response: {(time.time() - step_start)*1000:.2f}ms")
            
            total_time = (time.time() - total_start) * 1000
            logger.info(f"[TIMING] === TOTAL TIME: {total_time:.2f}ms ===\n")
            
            logger.info(f"User {request.user.username} started new exam attempt {attempt.id} for exam {exam_id} with {num_questions} questions")
            return Response(response_serializer.data, status=status.HTTP_201_CREATED)
        except Exception as e:
            logger.error(f"Error creating exam attempt: {str(e)}")
            return Response(
                {
                    'success': False,
                    'message': 'Error creating exam attempt',
                    'error': str(e)
                },
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

    def partial_update(self, request, *args, **kwargs):
        """End exam attempt and calculate score"""
        attempt = self.get_object()
        
        # Update attempt details
        serializer = self.get_serializer(attempt, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        
        # Calculate score if exam is being completed
        if attempt.status == 'completed':
            from django.utils import timezone
            attempt.ended_at = timezone.now()
            attempt.score = attempt.calculate_score()
            attempt.save()
        
        # Refresh with full serializer to include exam, answers, etc.
        attempt = ExamAttempt.objects.select_related('exam', 'user').prefetch_related(
            'answers__question__options', 'selected_questions__options'
        ).get(id=attempt.id)
        
        response_serializer = ExamAttemptSerializer(attempt)
        return Response(response_serializer.data)

    @action(detail=True, methods=['get'], permission_classes=[IsAuthenticated])
    def questions(self, request, pk=None):
        """Get the 40 randomly selected questions for this attempt
        
        Returns all question data including correct_answer and explanation
        for frontend to show/hide with JavaScript (no additional API calls needed)
        
        Performance:
        - Fast single request: 300-400ms, ~40KB payload
        - All data available for instant JS toggle of answers
        - No waiting for additional API calls after submission
        """
        try:
            start_time = time.time()
            attempt = self.get_object()
            
            # Load questions with all fields for complete data
            questions = attempt.selected_questions.prefetch_related('options').order_by('id')
            question_count = questions.count()
            
            fetch_time = (time.time() - start_time) * 1000
            start_time = time.time()
            
            # Use serializer that includes all question data (answers, explanations)
            serializer = QuestionForAttemptSerializer(questions, many=True)
            
            serialization_time = (time.time() - start_time) * 1000
            
            # Only log detailed metrics in DEBUG mode (production performance)
            if logger.isEnabledFor(logging.DEBUG):
                response_size = get_response_size_kb(serializer.data)
                logger.debug(
                    f"[GET_QUESTIONS] Attempt {pk} - "
                    f"{question_count} questions | "
                    f"Fetch: {fetch_time:.2f}ms | "
                    f"Serialize: {serialization_time:.2f}ms | "
                    f"Size: {response_size:.2f}KB"
                )
            
            return Response(serializer.data)
        except Exception as e:
            logger.error(f"Error fetching attempt questions: {str(e)}")
            return Response(
                {'error': str(e), 'success': False},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

    @action(detail=True, methods=['post'], permission_classes=[IsAuthenticated])
    def submit_answer(self, request, pk=None):
        """
        Submit answer to a question
        POST body: {
            "question_id": 1,
            "selected_answer": "A",
            "time_spent_seconds": 45
        }
        """
        try:
            # Log auth info for debugging
            logger.debug(f"submit_answer called by user {request.user.username if request.user else 'Anonymous'} for attempt {pk}")
            
            # Check if user owns this attempt
            try:
                attempt = self.get_object()
            except Exception as e:
                # If get_object fails, check if the attempt exists but doesn't belong to user
                try:
                    other_attempt = ExamAttempt.objects.get(id=pk)
                    logger.warning(f"User {request.user.username} attempted to access attempt {pk} owned by {other_attempt.user.username}")
                    return Response(
                        {'error': 'You do not have permission to submit answers for this attempt', 'success': False},
                        status=status.HTTP_403_FORBIDDEN
                    )
                except ExamAttempt.DoesNotExist:
                    logger.warning(f"Attempt {pk} not found")
                    return Response(
                        {'error': 'Exam attempt not found', 'success': False},
                        status=status.HTTP_404_NOT_FOUND
                    )
            
            if attempt.status != 'in_progress':
                logger.warning(f"Attempt to submit answer to non-in-progress attempt {attempt.id}")
                return Response(
                    {'error': 'Exam attempt is not in progress', 'success': False},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            question_id = request.data.get('question_id')
            selected_answer = request.data.get('selected_answer')
            time_spent_seconds = request.data.get('time_spent_seconds', 0)
            
            if not question_id or not selected_answer:
                logger.warning(f"Missing required fields: question_id={question_id}, selected_answer={selected_answer}")
                return Response(
                    {'error': 'question_id and selected_answer are required', 'success': False},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            question = get_object_or_404(Question, id=question_id, exam_id=attempt.exam_id)
            
            # Create or update answer
            answer, created = QuestionAnswer.objects.update_or_create(
                exam_attempt=attempt,
                question=question,
                defaults={
                    'selected_answer': selected_answer,
                    'time_spent_seconds': time_spent_seconds
                }
            )
            
            logger.info(f"Answer submitted for question {question_id} in attempt {attempt.id}")
            
            # Refresh answer to include full question data
            answer = QuestionAnswer.objects.select_related('question').get(id=answer.id)
            
            # Use submit serializer that includes full question with answers
            serializer = QuestionAnswerSubmitSerializer(answer)
            return Response(serializer.data, status=status.HTTP_201_CREATED if created else status.HTTP_200_OK)
        except OperationalError as e:
            logger.error(f"Database connection error submitting answer: {str(e)}")
            return Response(
                {'error': 'Database connection error. Please try again.', 'success': False, 'message': 'Temporary connection issue'},
                status=status.HTTP_503_SERVICE_UNAVAILABLE
            )
        except Exception as e:
            logger.error(f"Error submitting answer: {str(e)}")
            return Response(
                {'error': str(e), 'success': False, 'message': 'Error submitting answer'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

    @action(detail=True, methods=['get'], permission_classes=[IsAuthenticated])
    def review(self, request, pk=None):
        """Get exam review with all answers and explanations"""
        try:
            start_time = time.time()
            
            # Check if user owns this attempt
            try:
                attempt = self.get_object()
            except Exception as e:
                # If get_object fails, provide clear error
                try:
                    other_attempt = ExamAttempt.objects.get(id=pk)
                    logger.warning(f"User {request.user.username} attempted to review attempt {pk} owned by {other_attempt.user.username}")
                    return Response(
                        {'error': 'You do not have permission to review this attempt', 'success': False},
                        status=status.HTTP_403_FORBIDDEN
                    )
                except ExamAttempt.DoesNotExist:
                    return Response(
                        {'error': 'Exam attempt not found', 'success': False},
                        status=status.HTTP_404_NOT_FOUND
                    )
            
            fetch_time = (time.time() - start_time) * 1000
            start_time = time.time()
            
            # Refresh attempt with optimized queries to get answers and questions efficiently
            attempt = ExamAttempt.objects.select_related(
                'user', 'exam'
            ).prefetch_related(
                'selected_questions__options',
                'answers__question__options'
            ).get(id=attempt.id)
            
            serializer = ExamAttemptReviewSerializer(attempt)
            serialization_time = (time.time() - start_time) * 1000
            
            # Only log detailed metrics in DEBUG mode (production performance)
            if logger.isEnabledFor(logging.DEBUG):
                response_size = get_response_size_kb(serializer.data)
                logger.debug(
                    f"[GET_REVIEW] Attempt {attempt.id} - "
                    f"Fetch: {fetch_time:.2f}ms | "
                    f"Serialize: {serialization_time:.2f}ms | "
                    f"Size: {response_size:.2f}KB | "
                    f"Answers: {attempt.answers.count()}"
                )
            
            return Response(serializer.data)
        except Exception as e:
            logger.error(f"Error retrieving review: {str(e)}")
            return Response(
                {'error': str(e), 'success': False, 'message': 'Error retrieving review'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


class ReviewViewSet(viewsets.ModelViewSet):
    """
    ViewSet for Review/Testimonials
    Endpoints:
    - GET /reviews/ - List all approved reviews
    - POST /reviews/ - Create a new review
    - GET /reviews/{id}/ - Retrieve a specific review
    - POST /reviews/{id}/helpful/ - Mark review as helpful
    """
    queryset = Review.objects.filter(is_approved=True).order_by('-created_at')
    permission_classes = [AllowAny]
    
    def get_serializer_class(self):
        if self.action == 'create':
            return ReviewCreateSerializer
        return ReviewSerializer
    
    def get_queryset(self):
        queryset = super().get_queryset()
        # Allow admin to see unapproved reviews
        if self.request.user and self.request.user.is_staff:
            queryset = Review.objects.all().order_by('-created_at')
        return queryset
    
    def list(self, request, *args, **kwargs):
        """List all approved reviews with optional filtering"""
        sort_by = request.query_params.get('sort_by', 'relevant')
        
        queryset = self.get_queryset()
        
        if sort_by == 'recent':
            queryset = queryset.order_by('-created_at')
        else:  # Default to most relevant (by helpful count, then recent)
            queryset = queryset.order_by('-helpful_count', '-created_at')
        
        page = self.paginate_queryset(queryset)
        if page is not None:
            serializer = self.get_serializer(page, many=True)
            return self.get_paginated_response(serializer.data)
        
        serializer = self.get_serializer(queryset, many=True)
        return Response(serializer.data)
    
    def create(self, request, *args, **kwargs):
        """Create a new review"""
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        serializer.save(user=request.user if request.user.is_authenticated else None)
        
        return Response(
            {
                'message': 'Review submitted successfully! It will appear after admin approval.',
                'data': ReviewSerializer(serializer.instance).data
            },
            status=status.HTTP_201_CREATED
        )
    
    @action(detail=True, methods=['post'])
    def helpful(self, request, pk=None):
        """Mark a review as helpful"""
        review = self.get_object()
        review.helpful_count += 1
        review.save()
        
        serializer = self.get_serializer(review)
        return Response(
            {
                'message': 'Thank you for finding this review helpful!',
                'data': serializer.data
            },
            status=status.HTTP_200_OK
        )
    
    @action(detail=False, methods=['get'])
    def summary(self, request):
        """Get review summary statistics"""
        queryset = self.get_queryset()
        
        reviews_count = queryset.count()
        
        # Calculate average rating
        from django.db.models import Avg, Count
        rating_stats = queryset.aggregate(
            avg_rating=Avg('rating'),
            total_reviews=Count('id')
        )
        
        # Get rating distribution
        rating_distribution = {}
        for i in range(1, 6):
            count = queryset.filter(rating=i).count()
            percentage = (count / reviews_count * 100) if reviews_count > 0 else 0
            rating_distribution[str(i)] = {
                'count': count,
                'percentage': round(percentage, 1)
            }
        
        return Response({
            'average_rating': round(rating_stats['avg_rating'], 1) if rating_stats['avg_rating'] else 0,
            'total_reviews': reviews_count,
            'rating_distribution': rating_distribution
        })
