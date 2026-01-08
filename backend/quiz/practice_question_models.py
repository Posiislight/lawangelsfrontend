"""
Practice Questions Models

Hierarchical structure for practice questions:
- PracticeQuestionCourse (FLK-1, FLK-2)
  - PracticeQuestionTopic (Business Law, Criminal Law, etc.)
    - PracticeQuestionArea (Areas A, B, C, etc.)
      - PracticeQuestion (Individual questions)
"""
from django.db import models


class PracticeQuestionCourse(models.Model):
    """Course/Exam type (e.g., FLK-1, FLK-2)"""
    name = models.CharField(max_length=100)
    slug = models.SlugField(max_length=100, unique=True, db_index=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['name']
        verbose_name = "Practice Question Course"
        verbose_name_plural = "Practice Question Courses"

    def __str__(self):
        return self.name

    @property
    def topic_count(self):
        return self.topics.count()

    @property
    def question_count(self):
        return sum(topic.question_count for topic in self.topics.all())


class PracticeQuestionTopic(models.Model):
    """Topic within a course (e.g., Business Law, Criminal Law)"""
    course = models.ForeignKey(
        PracticeQuestionCourse,
        on_delete=models.CASCADE,
        related_name='topics',
        db_index=True
    )
    name = models.CharField(max_length=200)
    slug = models.SlugField(max_length=200, db_index=True)
    area_count = models.PositiveIntegerField(default=0)
    question_count = models.PositiveIntegerField(default=0)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['course', 'name']
        unique_together = ['course', 'slug']
        verbose_name = "Practice Question Topic"
        verbose_name_plural = "Practice Question Topics"

    def __str__(self):
        return f"{self.course.name} - {self.name}"


class PracticeQuestionArea(models.Model):
    """Area within a topic (e.g., Area A, Area B)"""
    topic = models.ForeignKey(
        PracticeQuestionTopic,
        on_delete=models.CASCADE,
        related_name='areas',
        db_index=True
    )
    letter = models.CharField(max_length=5)
    name = models.CharField(max_length=500)
    slug = models.SlugField(max_length=200, db_index=True)
    question_count = models.PositiveIntegerField(default=0)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['topic', 'letter']
        unique_together = ['topic', 'slug']
        verbose_name = "Practice Question Area"
        verbose_name_plural = "Practice Question Areas"

    def __str__(self):
        return f"{self.topic.name} - Area {self.letter}"


class PracticeQuestion(models.Model):
    """Individual practice question"""
    DIFFICULTY_CHOICES = [
        ('easy', 'Easy'),
        ('medium', 'Medium'),
        ('hard', 'Hard'),
    ]

    area = models.ForeignKey(
        PracticeQuestionArea,
        on_delete=models.CASCADE,
        related_name='questions',
        db_index=True
    )
    question_id = models.PositiveIntegerField(help_text="Original question ID from JSON")
    title = models.CharField(max_length=500, blank=True)
    text = models.TextField()
    options = models.JSONField(help_text="List of answer options [{label, text}, ...]")
    correct_answer = models.CharField(max_length=1)
    explanation = models.TextField()
    difficulty = models.CharField(max_length=10, choices=DIFFICULTY_CHOICES, default='medium')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['area', 'question_id']
        unique_together = ['area', 'question_id']
        verbose_name = "Practice Question"
        verbose_name_plural = "Practice Questions"
        indexes = [
            models.Index(fields=['area', 'question_id']),
            models.Index(fields=['difficulty']),
        ]

    def __str__(self):
        return f"{self.area.topic.name} - Q{self.question_id}"
