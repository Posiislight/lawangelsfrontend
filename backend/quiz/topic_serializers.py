from rest_framework import serializers
from django.contrib.auth.models import User
from .topic_models import UserGameProfile, TopicQuizAttempt, TopicQuizAnswer
from .models import Question


class UserGameProfileSerializer(serializers.ModelSerializer):
    """Serializer for user's game profile"""
    rank_display = serializers.CharField(source='get_rank_display', read_only=True)
    username = serializers.CharField(source='user.username', read_only=True)
    xp_progress_percentage = serializers.SerializerMethodField()
    
    class Meta:
        model = UserGameProfile
        fields = [
            'id', 'username', 'total_points', 'current_level', 'xp', 
            'xp_to_next_level', 'xp_progress_percentage', 'rank', 'rank_display',
            'total_quizzes_completed', 'total_correct_answers', 'total_wrong_answers',
            'longest_streak', 'created_at', 'updated_at'
        ]
        read_only_fields = fields

    def get_xp_progress_percentage(self, obj):
        if obj.xp_to_next_level == 0:
            return 100
        return round((obj.xp / obj.xp_to_next_level) * 100, 1)


class TopicSummarySerializer(serializers.Serializer):
    """Serializer for topic listing with stats"""
    topic = serializers.CharField()
    topic_display = serializers.CharField()
    question_count = serializers.IntegerField()
    user_attempts = serializers.IntegerField()
    best_score = serializers.IntegerField(allow_null=True)
    best_percentage = serializers.FloatField(allow_null=True)
    icon = serializers.CharField()


class TopicQuizAnswerSerializer(serializers.ModelSerializer):
    """Serializer for individual quiz answers"""
    class Meta:
        model = TopicQuizAnswer
        fields = [
            'id', 'question_id', 'selected_answer', 'is_correct',
            'points_earned', 'time_spent_seconds', 'answered_at'
        ]
        read_only_fields = ['id', 'is_correct', 'points_earned', 'answered_at']


class TopicQuizAttemptSerializer(serializers.ModelSerializer):
    """Serializer for topic quiz attempts"""
    topic_display = serializers.CharField(source='get_topic_display', read_only=True)
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    answers = TopicQuizAnswerSerializer(many=True, read_only=True)
    questions_remaining = serializers.SerializerMethodField()
    progress_percentage = serializers.SerializerMethodField()
    
    class Meta:
        model = TopicQuizAttempt
        fields = [
            'id', 'topic', 'topic_display', 'status', 'status_display',
            'lives_remaining', 'points_earned', 'current_streak',
            'current_question_index', 'total_questions', 'questions_remaining',
            'progress_percentage', 'correct_count', 'wrong_count',
            'fifty_fifty_used', 'time_freeze_used',
            'started_at', 'completed_at', 'answers'
        ]
        read_only_fields = [
            'id', 'status', 'lives_remaining', 'points_earned', 'current_streak',
            'current_question_index', 'correct_count', 'wrong_count',
            'started_at', 'completed_at', 'answers'
        ]

    def get_questions_remaining(self, obj):
        return max(0, obj.total_questions - obj.current_question_index)
    
    def get_progress_percentage(self, obj):
        if obj.total_questions == 0:
            return 0
        return round((obj.current_question_index / obj.total_questions) * 100, 1)


class TopicQuizQuestionSerializer(serializers.ModelSerializer):
    """Serializer for questions during a topic quiz (without correct answer initially)"""
    options = serializers.SerializerMethodField()
    
    class Meta:
        model = Question
        fields = ['id', 'question_number', 'text', 'difficulty', 'topic', 'options']

    def get_options(self, obj):
        return [
            {'label': opt.label, 'text': opt.text}
            for opt in obj.options.all().order_by('label')
        ]


class TopicQuizQuestionWithAnswerSerializer(serializers.ModelSerializer):
    """Serializer for questions after answering (includes correct answer and explanation)"""
    options = serializers.SerializerMethodField()
    
    class Meta:
        model = Question
        fields = ['id', 'question_number', 'text', 'difficulty', 'topic', 'options', 
                  'correct_answer', 'explanation']

    def get_options(self, obj):
        return [
            {'label': opt.label, 'text': opt.text}
            for opt in obj.options.all().order_by('label')
        ]


class SubmitAnswerRequestSerializer(serializers.Serializer):
    """Serializer for answer submission requests"""
    question_id = serializers.IntegerField()
    selected_answer = serializers.ChoiceField(choices=['A', 'B', 'C', 'D', 'E'])
    time_spent_seconds = serializers.IntegerField(min_value=0, default=0)


class SubmitAnswerResponseSerializer(serializers.Serializer):
    """Serializer for answer submission response"""
    is_correct = serializers.BooleanField()
    correct_answer = serializers.CharField()
    explanation = serializers.CharField()
    points_earned = serializers.IntegerField()
    total_points = serializers.IntegerField()
    lives_remaining = serializers.IntegerField()
    current_streak = serializers.IntegerField()
    quiz_status = serializers.CharField()
    next_question = TopicQuizQuestionSerializer(allow_null=True)


class TopicQuizResultSerializer(serializers.ModelSerializer):
    """Serializer for completed quiz results"""
    topic_display = serializers.CharField(source='get_topic_display', read_only=True)
    accuracy_percentage = serializers.SerializerMethodField()
    xp_earned = serializers.IntegerField(source='points_earned')
    answers = TopicQuizAnswerSerializer(many=True, read_only=True)
    
    class Meta:
        model = TopicQuizAttempt
        fields = [
            'id', 'topic', 'topic_display', 'status',
            'points_earned', 'xp_earned', 'lives_remaining',
            'correct_count', 'wrong_count', 'total_questions',
            'accuracy_percentage', 'current_streak',
            'started_at', 'completed_at', 'answers'
        ]

    def get_accuracy_percentage(self, obj):
        total = obj.correct_count + obj.wrong_count
        if total == 0:
            return 0
        return round((obj.correct_count / total) * 100, 1)
