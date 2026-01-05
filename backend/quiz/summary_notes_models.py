"""
Models for Summary Notes feature.
Provides structured study notes for each subject with chapter organization.
"""
from django.db import models
from django.contrib.auth.models import User


class SummaryNotes(models.Model):
    """A summary notes document for a specific subject."""
    
    CATEGORY_CHOICES = [
        ('FLK1', 'FLK1 - Functioning Legal Knowledge 1'),
        ('FLK2', 'FLK2 - Functioning Legal Knowledge 2'),
    ]
    
    title = models.CharField(max_length=255)
    subject = models.CharField(max_length=100)  # e.g., "Business Law", "Criminal Law"
    category = models.CharField(max_length=10, choices=CATEGORY_CHOICES, default='FLK1')
    description = models.TextField(blank=True)
    icon = models.CharField(max_length=10, default='📝')
    order = models.IntegerField(default=0)
    source_file = models.CharField(max_length=255, blank=True)  # Original .docx filename
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ['category', 'order', 'title']
        verbose_name = "Summary Notes"
        verbose_name_plural = "Summary Notes"
    
    def __str__(self):
        return f"{self.title} ({self.category})"
    
    @property
    def total_chapters(self):
        return self.chapters.filter(is_active=True).count()


class SummaryNotesChapter(models.Model):
    """A chapter within a summary notes document."""
    
    summary_notes = models.ForeignKey(
        SummaryNotes,
        on_delete=models.CASCADE,
        related_name='chapters'
    )
    title = models.CharField(max_length=255)
    order = models.IntegerField(default=0)
    # Content stored as HTML for rich formatting
    content = models.TextField()
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ['summary_notes', 'order']
        verbose_name = "Summary Notes Chapter"
        verbose_name_plural = "Summary Notes Chapters"
    
    def __str__(self):
        return f"{self.summary_notes.title} - {self.title}"


class SummaryNotesProgress(models.Model):
    """Tracks user's reading progress on summary notes."""
    
    user = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name='summary_notes_progress'
    )
    summary_notes = models.ForeignKey(
        SummaryNotes,
        on_delete=models.CASCADE,
        related_name='user_progress'
    )
    current_chapter = models.ForeignKey(
        SummaryNotesChapter,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='current_readers'
    )
    # Track which chapters have been completed
    completed_chapters = models.JSONField(default=list)  # List of chapter IDs
    last_read_at = models.DateTimeField(auto_now=True)
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        unique_together = ['user', 'summary_notes']
        verbose_name = "Summary Notes Progress"
        verbose_name_plural = "Summary Notes Progress"
    
    def __str__(self):
        return f"{self.user.username} - {self.summary_notes.title}"
    
    @property
    def progress_percentage(self):
        total = self.summary_notes.total_chapters
        if total <= 0:
            return 0
        completed = len(self.completed_chapters) if self.completed_chapters else 0
        return round((completed / total) * 100)
    
    @property
    def chapters_completed(self):
        return len(self.completed_chapters) if self.completed_chapters else 0
