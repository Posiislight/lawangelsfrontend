from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, AllowAny, IsAdminUser
from django.utils import timezone
from django.shortcuts import get_object_or_404
from django.db import OperationalError, transaction
import logging
import random
import time

logger = logging.getLogger(__name__)

from .models import (
    Exam, Question, QuestionOption, ExamAttempt, QuestionAnswer, ExamTimingConfig
)
from .serializers import (
    ExamSerializer, ExamDetailSerializer, QuestionDetailSerializer,
    ExamAttemptCreateSerializer, ExamAttemptSerializer, ExamAttemptLightSerializer,
    ExamAttemptListSerializer, ExamAttemptUpdateSerializer, QuestionAnswerSerializer,
    ExamTimingConfigSerializer, CSVUploadSerializer
)
from .csv_parser import CSVQuestionParser
from logging_utils import ViewLoggingMixin, log_queryset_access


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
        """Log queryset access"""
        queryset = super().get_queryset()
        log_queryset_access(queryset, 'LIST')
        return queryset

    def get_serializer_class(self):
        if self.action == 'retrieve':
            return ExamDetailSerializer
        return ExamSerializer

    @action(detail=True, methods=['get'])
    def questions(self, request, pk=None):
        """Get all questions for an exam"""
        exam = self.get_object()
        questions = exam.questions.all()
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
        """Filter by exam if exam_id is provided in query params"""
        queryset = super().get_queryset()
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
            return ExamAttemptCreateSerializer
        elif self.action == 'list':
            return ExamAttemptListSerializer
        elif self.action in ['partial_update', 'update']:
            return ExamAttemptUpdateSerializer
        return ExamAttemptSerializer

    def create(self, request, *args, **kwargs):
        """Create a new exam attempt with detailed timing logs"""
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
            serializer = self.get_serializer(data=request.data)
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
            
            # Step 2: Check for existing attempt
            step_start = time.time()
            existing_attempt = ExamAttempt.objects.filter(
                user=request.user,
                exam_id=exam_id,
                status__in=['in_progress']
            ).first()
            logger.info(f"[TIMING] [2] Check existing: {(time.time() - step_start)*1000:.2f}ms")
            
            if existing_attempt:
                # If attempt exists but has no selected questions, populate them now
                if existing_attempt.selected_questions.count() == 0:
                    step_start = time.time()
                    all_questions = list(Question.objects.filter(exam_id=exam_id).values_list('id', flat=True))
                    num_questions = min(40, len(all_questions))
                    selected_question_ids = random.sample(all_questions, num_questions)
                    existing_attempt.selected_questions.set(selected_question_ids)
                    logger.info(f"[TIMING] [3] Populate existing: {(time.time() - step_start)*1000:.2f}ms")
                
                logger.info(f"User {request.user.username} resuming existing attempt for exam {exam_id}")
                response_serializer = ExamAttemptSerializer(existing_attempt)
                return Response(response_serializer.data, status=status.HTTP_200_OK)
            
            # Step 3: Create new attempt
            step_start = time.time()
            attempt = ExamAttempt.objects.create(
                user=request.user,
                exam_id=exam_id,
                speed_reader_enabled=serializer.validated_data.get('speed_reader_enabled', False)
            )
            logger.info(f"[TIMING] [3] Create attempt DB: {(time.time() - step_start)*1000:.2f}ms")
            
            # Step 4: Fetch all questions (optimized query)
            step_start = time.time()
            all_questions = list(Question.objects.filter(exam_id=exam_id).values_list('id', flat=True))
            logger.info(f"[TIMING] [4] Fetch all questions ({len(all_questions)} total): {(time.time() - step_start)*1000:.2f}ms")
            
            # Step 5: Random sample
            step_start = time.time()
            num_questions = min(40, len(all_questions))
            selected_question_ids = random.sample(all_questions, num_questions)
            logger.info(f"[TIMING] [5] Random sample {num_questions} questions: {(time.time() - step_start)*1000:.2f}ms")
            
            # Step 6: Bulk set relations (optimized - use through model directly)
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
            logger.info(f"[TIMING] [6] Bulk set selected questions: {(time.time() - step_start)*1000:.2f}ms")
            
            # Step 7: Serialize response
            step_start = time.time()
            response_serializer = ExamAttemptLightSerializer(attempt)
            logger.info(f"[TIMING] [7] Serialize response: {(time.time() - step_start)*1000:.2f}ms")
            
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
            attempt.score = attempt.calculate_score()
            attempt.save()
        
        response_serializer = ExamAttemptSerializer(attempt)
        return Response(response_serializer.data)

    @action(detail=True, methods=['get'], permission_classes=[IsAuthenticated])
    def questions(self, request, pk=None):
        """Get the 40 randomly selected questions for this attempt"""
        try:
            attempt = self.get_object()
            # Get questions ordered by their position in the selected set
            questions = attempt.selected_questions.all().order_by('id')
            serializer = QuestionDetailSerializer(questions, many=True)
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
            serializer = QuestionAnswerSerializer(answer)
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
            
            logger.info(f"Review requested for attempt {attempt.id}")
            serializer = ExamAttemptSerializer(attempt)
            return Response(serializer.data)
        except Exception as e:
            logger.error(f"Error retrieving review: {str(e)}")
            return Response(
                {'error': str(e), 'success': False, 'message': 'Error retrieving review'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
