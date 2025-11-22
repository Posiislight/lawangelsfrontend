from rest_framework import serializers
from .models import (
    Exam, Question, QuestionOption, ExamAttempt, 
    QuestionAnswer, ExamTimingConfig
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
        fields = ['id', 'question_number', 'text', 'explanation', 'difficulty', 'correct_answer', 'options']


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
        fields = ['id', 'question_number', 'text', 'difficulty', 'options']


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
    """Serializer for answer review (includes correct answer)"""
    question = QuestionDetailSerializer(read_only=True)
    
    class Meta:
        model = QuestionAnswer
        fields = ['id', 'question', 'selected_answer', 'is_correct', 'time_spent_seconds']


class ExamAttemptCreateSerializer(serializers.Serializer):
    """Serializer for creating a new exam attempt"""
    exam_id = serializers.IntegerField()
    speed_reader_enabled = serializers.BooleanField(default=False)
    
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


class ExamAttemptListSerializer(serializers.ModelSerializer):
    """Serializer for listing exam attempts"""
    exam = ExamSerializer(read_only=True)
    
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
