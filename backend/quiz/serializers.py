from rest_framework import serializers
from .models import (
    Exam, Question, QuestionOption, ExamAttempt, 
    QuestionAnswer, ExamTimingConfig, Review
)


class QuestionOptionSerializer(serializers.ModelSerializer):
    """Serializer for question options"""
    class Meta:
        model = QuestionOption
        fields = ['label', 'text']


class QuestionDetailSerializer(serializers.ModelSerializer):
    """Serializer for question with options and explanation"""
    options = QuestionOptionSerializer(many=True, read_only=True)
    
    class Meta:
        model = Question
        fields = ['id', 'question_number', 'text', 'explanation', 'difficulty', 'topic', 'correct_answer', 'options']


class QuestionListSerializer(serializers.ModelSerializer):
    """Serializer for question list (without correct answer)"""
    options = QuestionOptionSerializer(many=True, read_only=True)
    
    class Meta:
        model = Question
        fields = ['id', 'question_number', 'text', 'difficulty', 'options']


class QuestionMinimalSerializer(serializers.ModelSerializer):
    """Serializer for questions in exam attempts (minimal payload - no explanation)"""
    options = QuestionOptionSerializer(many=True, read_only=True)
    
    class Meta:
        model = Question
        fields = ['id', 'question_number', 'text', 'difficulty', 'topic', 'options']


class ExamMinimalSerializer(serializers.ModelSerializer):
    """Ultra-lightweight exam serializer for dashboard - NO extra queries"""
    class Meta:
        model = Exam
        fields = [
            'id', 'title', 'subject', 'duration_minutes',
            'passing_score_percentage', 'is_active', 'total_questions'
        ]


class ExamSerializer(serializers.ModelSerializer):
    """Serializer for exam with all details"""
    questions_count = serializers.SerializerMethodField()
    
    class Meta:
        model = Exam
        fields = [
            'id', 'title', 'description', 'subject', 'duration_minutes',
            'speed_reader_seconds', 'passing_score_percentage', 'is_active',
            'total_questions', 'questions_count'
        ]
    
    def get_questions_count(self, obj):
        return obj.questions.count()


class ExamDetailSerializer(serializers.ModelSerializer):
    """Serializer for exam with questions"""
    questions = QuestionListSerializer(many=True, read_only=True)
    
    class Meta:
        model = Exam
        fields = [
            'id', 'title', 'description', 'subject', 'duration_minutes',
            'speed_reader_seconds', 'passing_score_percentage', 'is_active',
            'total_questions', 'questions'
        ]


class QuestionAnswerSerializer(serializers.ModelSerializer):
    """Serializer for user's answer submission"""
    class Meta:
        model = QuestionAnswer
        fields = ['id', 'exam_attempt', 'question', 'selected_answer', 'is_correct', 'time_spent_seconds']
        read_only_fields = ['is_correct']


class QuestionAnswerDetailSerializer(serializers.ModelSerializer):
    """Serializer for answer review (includes correct answer and full question details)"""
    question = QuestionDetailSerializer(read_only=True)
    
    class Meta:
        model = QuestionAnswer
        fields = ['id', 'question', 'selected_answer', 'is_correct', 'time_spent_seconds']


class ExamAttemptCreateSerializer(serializers.Serializer):
    """Serializer for creating a new exam attempt"""
    exam_id = serializers.IntegerField()
    speed_reader_enabled = serializers.BooleanField(default=False)
    is_mock = serializers.BooleanField(default=False, required=False)
    
    def validate_exam_id(self, value):
        if not Exam.objects.filter(id=value).exists():
            raise serializers.ValidationError("Exam not found")
        return value
    
    def create(self, validated_data):
        exam_id = validated_data['exam_id']
        exam = Exam.objects.get(id=exam_id)
        attempt = ExamAttempt.objects.create(
            user=self.context['request'].user,
            exam=exam,
            speed_reader_enabled=validated_data.get('speed_reader_enabled', False)
        )
        return attempt


class ExamAttemptSerializer(serializers.ModelSerializer):
    """Serializer for exam attempt details"""
    exam = ExamSerializer(read_only=True)
    answers = QuestionAnswerDetailSerializer(many=True, read_only=True)
    # Use minimal serializer (no explanations) for faster initial load
    selected_questions_detail = QuestionMinimalSerializer(many=True, read_only=True, source='selected_questions')
    selected_questions = serializers.PrimaryKeyRelatedField(many=True, read_only=True)
    
    class Meta:
        model = ExamAttempt
        fields = [
            'id', 'exam', 'user', 'started_at', 'ended_at', 'status',
            'score', 'time_spent_seconds', 'speed_reader_enabled', 'answers', 'selected_questions', 'selected_questions_detail'
        ]
        read_only_fields = ['user', 'started_at', 'ended_at', 'score']


class ExamAttemptLightSerializer(serializers.ModelSerializer):
    """Lightweight serializer for exam attempt creation (excludes nested data for speed)"""
    exam = ExamSerializer(read_only=True)
    selected_questions_detail = QuestionMinimalSerializer(many=True, read_only=True, source='selected_questions')
    selected_questions = serializers.PrimaryKeyRelatedField(many=True, read_only=True)
    
    class Meta:
        model = ExamAttempt
        fields = [
            'id', 'exam', 'started_at', 'status',
            'time_spent_seconds', 'speed_reader_enabled', 'selected_questions', 'selected_questions_detail'
        ]
        read_only_fields = ['started_at', 'status']


class ExamAttemptReviewSerializer(serializers.ModelSerializer):
    """Serializer for exam attempt review (includes full question details)
    
    OPTIMIZED: Uses ExamMinimalSerializer to avoid N+1 query from get_questions_count()
    """
    exam = ExamMinimalSerializer(read_only=True)
    answers = QuestionAnswerDetailSerializer(many=True, read_only=True)
    # Use full detail serializer (with explanations/correct answers) for review
    questions = QuestionDetailSerializer(many=True, read_only=True, source='selected_questions')
    
    class Meta:
        model = ExamAttempt
        fields = [
            'id', 'exam', 'user', 'started_at', 'ended_at', 'status',
            'score', 'time_spent_seconds', 'speed_reader_enabled', 'answers', 'questions'
        ]


class ExamAttemptDashboardSerializer(serializers.ModelSerializer):
    """Ultra-lightweight serializer for dashboard - NO extra queries
    
    Uses only pre-fetched data and avoids any SerializerMethodField
    that could trigger additional queries.
    """
    exam_id = serializers.IntegerField(source='exam.id', read_only=True)
    exam_title = serializers.CharField(source='exam.title', read_only=True)
    exam_subject = serializers.CharField(source='exam.subject', read_only=True)
    
    class Meta:
        model = ExamAttempt
        fields = [
            'id', 'exam_id', 'exam_title', 'exam_subject',
            'started_at', 'ended_at', 'status', 'score', 'time_spent_seconds'
        ]


class ExamAttemptListSerializer(serializers.ModelSerializer):
    """Serializer for listing exam attempts"""
    exam = ExamMinimalSerializer(read_only=True)
    
    class Meta:
        model = ExamAttempt
        fields = [
            'id', 'exam', 'started_at', 'ended_at', 'status',
            'score', 'time_spent_seconds', 'speed_reader_enabled'
        ]


class ExamAttemptUpdateSerializer(serializers.ModelSerializer):
    """Serializer for updating exam attempt (end exam)"""
    class Meta:
        model = ExamAttempt
        fields = ['ended_at', 'status', 'time_spent_seconds', 'speed_reader_enabled']


class ExamTimingConfigSerializer(serializers.ModelSerializer):
    """Serializer for exam timing configuration"""
    class Meta:
        model = ExamTimingConfig
        fields = ['default_duration_minutes', 'default_speed_reader_seconds', 'allow_custom_timing']


class ExamAttemptMinimalCreateSerializer(serializers.ModelSerializer):
    """Ultra-lightweight serializer for exam attempt creation response
    
    Excludes nested question data to minimize serialization time.
    Reduces queries from 88 to ~2-3 and response time from 21s to ~500ms
    """
    exam = ExamSerializer(read_only=True)
    total_questions = serializers.SerializerMethodField()
    
    class Meta:
        model = ExamAttempt
        fields = [
            'id', 'exam', 'started_at', 'status', 
            'speed_reader_enabled', 'total_questions'
        ]
        read_only_fields = ['started_at', 'status']
    
    def get_total_questions(self, obj):
        return obj.selected_questions.count()


class QuestionForAttemptSerializer(serializers.ModelSerializer):
    """Optimized serializer for questions during exam attempt
    
    NOW INCLUDES: correct_answer and explanation for immediate JS show/hide
    - Still fast because it's done in one request (not multiple API calls)
    - Frontend loads all data with quiz, then uses JavaScript to toggle visibility
    - No waiting for additional API calls after submission
    - Payload: ~40KB (acceptable for single load)
    """
    options = QuestionOptionSerializer(many=True, read_only=True)
    
    class Meta:
        model = Question
        fields = ['id', 'question_number', 'text', 'difficulty', 'topic', 'correct_answer', 'explanation', 'options']


class QuestionAnswerSubmitSerializer(serializers.ModelSerializer):
    """Serializer for submit-answer response with full question details for immediate feedback display
    
    Returns answer data plus full question (including correct_answer and explanation)
    so frontend can show feedback immediately with JavaScript (no extra API call needed)
    """
    question = QuestionForAttemptSerializer(read_only=True)
    
    class Meta:
        model = QuestionAnswer
        fields = ['id', 'exam_attempt', 'question', 'selected_answer', 'is_correct', 'time_spent_seconds']


class CSVUploadSerializer(serializers.Serializer):
    """Serializer for CSV file upload"""
    exam_id = serializers.IntegerField()
    csv_file = serializers.FileField()
    
    def validate_exam_id(self, value):
        if not Exam.objects.filter(id=value).exists():
            raise serializers.ValidationError("Exam not found")
        return value
    
    def validate_csv_file(self, value):
        if not value.name.endswith('.csv'):
            raise serializers.ValidationError("File must be a CSV file")
        if value.size > 5 * 1024 * 1024:  # 5MB max
            raise serializers.ValidationError("File size must be less than 5MB")
        return value


class ReviewSerializer(serializers.ModelSerializer):
    """Serializer for reviews and testimonials"""
    days_ago = serializers.SerializerMethodField()
    
    class Meta:
        model = Review
        fields = [
            'id', 'name', 'role', 'rating', 'title', 'content',
            'helpful_count', 'created_at', 'days_ago', 'is_approved'
        ]
        read_only_fields = ['id', 'created_at', 'helpful_count', 'is_approved']
    
    def get_days_ago(self, obj):
        from datetime import datetime, timezone
        now = datetime.now(timezone.utc)
        delta = now - obj.created_at
        days = delta.days
        if days == 0:
            return "Today"
        elif days == 1:
            return "1d"
        else:
            return f"{days}d"


class ReviewCreateSerializer(serializers.ModelSerializer):
    """Serializer for creating reviews"""
    class Meta:
        model = Review
        fields = ['name', 'role', 'rating', 'title', 'content']
    
    def create(self, validated_data):
        review = Review.objects.create(**validated_data)
        return review
