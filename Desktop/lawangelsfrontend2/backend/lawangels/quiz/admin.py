from django.contrib import admin
from .models import (
    Exam, Question, QuestionOption, ExamAttempt,
    QuestionAnswer, ExamTimingConfig
)


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

    def has_add_permission(self, request):
        """Allow only one config"""
        return not ExamTimingConfig.objects.exists()

    def has_delete_permission(self, request, obj=None):
        """Prevent deletion"""
        return False
