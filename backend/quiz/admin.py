from django.contrib import admin
from .models import (
    Exam, Question, QuestionOption, ExamAttempt,
    QuestionAnswer, ExamTimingConfig, Review
)
from .topic_models import UserGameProfile, TopicQuizAttempt, TopicQuizAnswer


class QuestionOptionInline(admin.TabularInline):
    model = QuestionOption
    extra = 0
    fields = ['label', 'text']


class QuestionInline(admin.TabularInline):
    model = Question
    extra = 0
    fields = ['question_number', 'text', 'correct_answer', 'difficulty']


@admin.register(Exam)
class ExamAdmin(admin.ModelAdmin):
    list_display = ['title', 'subject', 'total_questions', 'duration_minutes', 'is_active', 'created_at']
    list_filter = ['subject', 'is_active', 'created_at']
    search_fields = ['title', 'description']
    inlines = [QuestionInline]
    readonly_fields = ['total_questions', 'created_at', 'updated_at']


@admin.register(Question)
class QuestionAdmin(admin.ModelAdmin):
    list_display = ['get_exam_title', 'question_number', 'difficulty', 'correct_answer']
    list_filter = ['exam__title', 'difficulty', 'created_at']
    search_fields = ['text', 'exam__title']
    inlines = [QuestionOptionInline]
    readonly_fields = ['created_at', 'updated_at']
    fieldsets = (
        ('Question Details', {
            'fields': ('exam', 'question_number', 'text', 'difficulty')
        }),
        ('Answer', {
            'fields': ('correct_answer', 'explanation')
        }),
        ('Metadata', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )

    def get_exam_title(self, obj):
        return obj.exam.title
    get_exam_title.short_description = 'Exam'


@admin.register(QuestionOption)
class QuestionOptionAdmin(admin.ModelAdmin):
    list_display = ['get_question_exam', 'get_question_number', 'label', 'text']
    list_filter = ['question__exam__title']
    search_fields = ['question__text', 'text']

    def get_question_exam(self, obj):
        return obj.question.exam.title
    get_question_exam.short_description = 'Exam'

    def get_question_number(self, obj):
        return obj.question.question_number
    get_question_number.short_description = 'Question #'


@admin.register(ExamAttempt)
class ExamAttemptAdmin(admin.ModelAdmin):
    list_display = ['user', 'exam', 'status', 'score', 'started_at', 'ended_at']
    list_filter = ['status', 'exam__title', 'started_at']
    search_fields = ['user__username', 'exam__title']
    readonly_fields = ['user', 'exam', 'started_at']
    fieldsets = (
        ('Attempt Details', {
            'fields': ('user', 'exam', 'status')
        }),
        ('Performance', {
            'fields': ('score', 'time_spent_seconds', 'speed_reader_enabled')
        }),
        ('Timeline', {
            'fields': ('started_at', 'ended_at'),
            'classes': ('collapse',)
        }),
    )


@admin.register(QuestionAnswer)
class QuestionAnswerAdmin(admin.ModelAdmin):
    list_display = ['exam_attempt', 'question', 'selected_answer', 'is_correct', 'time_spent_seconds']
    list_filter = ['is_correct', 'exam_attempt__exam__title']
    search_fields = ['exam_attempt__user__username', 'question__text']
    readonly_fields = ['is_correct', 'answered_at']


@admin.register(ExamTimingConfig)
class ExamTimingConfigAdmin(admin.ModelAdmin):
    list_display = ['default_duration_minutes', 'default_speed_reader_seconds', 'allow_custom_timing']


@admin.register(Review)
class ReviewAdmin(admin.ModelAdmin):
    list_display = ['name', 'role', 'rating', 'title', 'is_approved', 'helpful_count', 'created_at']
    list_filter = ['is_approved', 'rating', 'created_at']
    search_fields = ['name', 'title', 'content', 'role']
    readonly_fields = ['created_at', 'updated_at', 'helpful_count']
    fieldsets = (
        ('Review Details', {
            'fields': ('user', 'name', 'role')
        }),
        ('Content', {
            'fields': ('rating', 'title', 'content')
        }),
        ('Status', {
            'fields': ('is_approved', 'helpful_count')
        }),
        ('Metadata', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )
    actions = ['approve_reviews', 'reject_reviews']

    def approve_reviews(self, request, queryset):
        """Action to approve selected reviews"""
        updated = queryset.update(is_approved=True)
        self.message_user(request, f'{updated} review(s) approved.')
    approve_reviews.short_description = 'Approve selected reviews'

    def reject_reviews(self, request, queryset):
        """Action to reject selected reviews (mark as not approved)"""
        updated = queryset.update(is_approved=False)
        self.message_user(request, f'{updated} review(s) rejected.')
    reject_reviews.short_description = 'Reject selected reviews'


# ========== Topic Quiz Admin ==========

class TopicQuizAnswerInline(admin.TabularInline):
    model = TopicQuizAnswer
    extra = 0
    fields = ['question_id', 'selected_answer', 'is_correct', 'points_earned', 'answered_at']
    readonly_fields = ['question_id', 'selected_answer', 'is_correct', 'points_earned', 'answered_at']


@admin.register(UserGameProfile)
class UserGameProfileAdmin(admin.ModelAdmin):
    list_display = ['user', 'current_level', 'rank', 'total_points', 'total_quizzes_completed', 'longest_streak']
    list_filter = ['rank', 'current_level']
    search_fields = ['user__username', 'user__email']
    readonly_fields = ['created_at', 'updated_at']
    fieldsets = (
        ('User', {
            'fields': ('user',)
        }),
        ('Level & XP', {
            'fields': ('current_level', 'xp', 'xp_to_next_level', 'rank', 'total_points')
        }),
        ('Stats', {
            'fields': ('total_quizzes_completed', 'total_correct_answers', 'total_wrong_answers', 'longest_streak')
        }),
        ('Metadata', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )


@admin.register(TopicQuizAttempt)
class TopicQuizAttemptAdmin(admin.ModelAdmin):
    list_display = ['user', 'topic', 'status', 'points_earned', 'lives_remaining', 'correct_count', 'wrong_count', 'started_at']
    list_filter = ['topic', 'status', 'started_at']
    search_fields = ['user__username']
    readonly_fields = ['started_at', 'completed_at']
    inlines = [TopicQuizAnswerInline]
    fieldsets = (
        ('Attempt', {
            'fields': ('user', 'topic', 'status')
        }),
        ('Game State', {
            'fields': ('lives_remaining', 'points_earned', 'current_streak')
        }),
        ('Progress', {
            'fields': ('current_question_index', 'total_questions', 'correct_count', 'wrong_count')
        }),
        ('Power-ups', {
            'fields': ('fifty_fifty_used', 'time_freeze_used')
        }),
        ('Questions', {
            'fields': ('question_ids',),
            'classes': ('collapse',)
        }),
        ('Timeline', {
            'fields': ('started_at', 'completed_at'),
            'classes': ('collapse',)
        }),
    )


@admin.register(TopicQuizAnswer)
class TopicQuizAnswerAdmin(admin.ModelAdmin):
    list_display = ['attempt', 'question_id', 'selected_answer', 'is_correct', 'points_earned', 'answered_at']
    list_filter = ['is_correct', 'attempt__topic']
    search_fields = ['attempt__user__username']
    readonly_fields = ['answered_at']

