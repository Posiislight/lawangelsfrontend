from django.db import models
from django.contrib.auth.models import User
from django.core.validators import MinValueValidator, MaxValueValidator
import random


class Exam(models.Model):
    """Mock exam configuration"""
    SUBJECT_CHOICES = [
        ('land_law', 'Land Law'),
        ('trusts', 'Trusts & Equity'),
        ('property', 'Property Transactions'),
        ('criminal', 'Criminal Law'),
        ('commercial', 'Commercial Law'),
        ('tax', 'Tax Law'),
        ('professional', 'Professional Conduct'),
        ('wills', 'Wills & Administration'),
        ('mixed', 'Mixed'),
    ]
    
    title = models.CharField(max_length=200, default='Mock Test 1')
    description = models.TextField(blank=True)
    subject = models.CharField(max_length=50, choices=SUBJECT_CHOICES, default='mixed')
    duration_minutes = models.IntegerField(default=60, validators=[MinValueValidator(1), MaxValueValidator(480)])
    speed_reader_seconds = models.IntegerField(default=70, validators=[MinValueValidator(1), MaxValueValidator(600)])
    total_questions = models.IntegerField(default=0)
    passing_score_percentage = models.IntegerField(default=70, validators=[MinValueValidator(0), MaxValueValidator(100)])
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    is_active = models.BooleanField(default=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return self.title

    def save(self, *args, **kwargs):
        """Update total_questions count before saving"""
        if self.pk:
            self.total_questions = self.questions.count()
        super().save(*args, **kwargs)


class Question(models.Model):
    """Quiz question"""
    DIFFICULTY_CHOICES = [
        ('easy', 'Easy'),
        ('medium', 'Medium'),
        ('hard', 'Hard'),
    ]
    
    exam = models.ForeignKey(Exam, on_delete=models.CASCADE, related_name='questions', db_index=True)
    question_number = models.IntegerField()
    text = models.TextField()
    explanation = models.TextField(help_text='Detailed explanation of the correct answer and why')
    difficulty = models.CharField(max_length=10, choices=DIFFICULTY_CHOICES, default='medium')
    correct_answer = models.CharField(max_length=1, choices=[('A', 'A'), ('B', 'B'), ('C', 'C'), ('D', 'D'), ('E', 'E')])
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['exam', 'question_number']
        unique_together = ['exam', 'question_number']
        indexes = [
            models.Index(fields=['exam', 'question_number']),
        ]

    def __str__(self):
        return f"{self.exam.title} - Q{self.question_number}"


class QuestionOption(models.Model):
    """Answer options for a question"""
    question = models.ForeignKey(Question, on_delete=models.CASCADE, related_name='options', db_index=True)
    label = models.CharField(max_length=1, choices=[('A', 'A'), ('B', 'B'), ('C', 'C'), ('D', 'D'), ('E', 'E')])
    text = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['question', 'label']
        unique_together = ['question', 'label']
        indexes = [
            models.Index(fields=['question', 'label']),
        ]

    def __str__(self):
        return f"Q{self.question.question_number} - {self.label}"


class ExamAttempt(models.Model):
    """User's attempt at an exam"""
    STATUS_CHOICES = [
        ('in_progress', 'In Progress'),
        ('completed', 'Completed'),
        ('abandoned', 'Abandoned'),
    ]
    
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='exam_attempts', db_index=True)
    exam = models.ForeignKey(Exam, on_delete=models.CASCADE, related_name='attempts', db_index=True)
    started_at = models.DateTimeField(auto_now_add=True)
    ended_at = models.DateTimeField(null=True, blank=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='in_progress')
    score = models.IntegerField(null=True, blank=True, validators=[MinValueValidator(0), MaxValueValidator(100)])
    time_spent_seconds = models.IntegerField(default=0)
    speed_reader_enabled = models.BooleanField(default=False)
    selected_questions = models.ManyToManyField(Question, related_name='attempted_in', blank=True)

    class Meta:
        ordering = ['-started_at']
        indexes = [
            models.Index(fields=['user', '-started_at']),
            models.Index(fields=['exam', 'status']),
            models.Index(fields=['user', 'status']),
        ]

    def __str__(self):
        return f"{self.user.username} - {self.exam.title} ({self.status})"

    def calculate_score(self):
        """Calculate exam score based on correct answers"""
        if self.status != 'completed':
            return None
        
        total_correct = self.answers.filter(is_correct=True).count()
        total_questions = self.selected_questions.count()
        
        if total_questions == 0:
            return 0
        
        score = (total_correct / total_questions) * 100
        return int(score)


class QuestionAnswer(models.Model):
    """User's answer to a question"""
    exam_attempt = models.ForeignKey(ExamAttempt, on_delete=models.CASCADE, related_name='answers', db_index=True)
    question = models.ForeignKey(Question, on_delete=models.CASCADE, db_index=True)
    selected_answer = models.CharField(max_length=1, choices=[('A', 'A'), ('B', 'B'), ('C', 'C'), ('D', 'D'), ('E', 'E')])
    is_correct = models.BooleanField()
    time_spent_seconds = models.IntegerField(default=0)
    answered_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['exam_attempt', 'question__question_number']
        unique_together = ['exam_attempt', 'question']
        indexes = [
            models.Index(fields=['exam_attempt', 'is_correct']),
            models.Index(fields=['question', 'is_correct']),
        ]

    def __str__(self):
        return f"{self.exam_attempt.user.username} - Q{self.question.question_number}"

    def save(self, *args, **kwargs):
        """Automatically determine if answer is correct"""
        self.is_correct = self.selected_answer == self.question.correct_answer
        super().save(*args, **kwargs)


class ExamTimingConfig(models.Model):
    """Global timing configuration for exams"""
    default_duration_minutes = models.IntegerField(default=60)
    default_speed_reader_seconds = models.IntegerField(default=70)
    allow_custom_timing = models.BooleanField(default=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"Exam Timing Config (Updated: {self.updated_at})"

    class Meta:
        verbose_name_plural = "Exam Timing Config"


class Review(models.Model):
    """User reviews and testimonials"""
    RATING_CHOICES = [
        (1, '1 Star'),
        (2, '2 Stars'),
        (3, '3 Stars'),
        (4, '4 Stars'),
        (5, '5 Stars'),
    ]
    
    user = models.ForeignKey(User, on_delete=models.CASCADE, null=True, blank=True, related_name='reviews')
    name = models.CharField(max_length=200)
    role = models.CharField(max_length=200)
    rating = models.IntegerField(choices=RATING_CHOICES, validators=[MinValueValidator(1), MaxValueValidator(5)])
    title = models.CharField(max_length=500)
    content = models.TextField()
    helpful_count = models.IntegerField(default=0)
    is_approved = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']
        verbose_name_plural = "Reviews"

    def __str__(self):
        return f"{self.name} - {self.rating} Stars"
