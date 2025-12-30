from django.db import models


class Textbook(models.Model):
    """Model for textbook PDF files with FLK category classification."""
    
    CATEGORY_CHOICES = [
        ('FLK1', 'FLK1 - Functioning Legal Knowledge 1'),
        ('FLK2', 'FLK2 - Functioning Legal Knowledge 2'),
        ('BOTH', 'Both FLK1 and FLK2'),
    ]
    
    title = models.CharField(max_length=255)
    subject = models.CharField(max_length=100)
    description = models.TextField(blank=True)
    category = models.CharField(max_length=10, choices=CATEGORY_CHOICES, default='FLK1')
    file_name = models.CharField(max_length=255)
    icon = models.CharField(max_length=10, default='📚')
    order = models.IntegerField(default=0)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ['category', 'order', 'title']
    
    def __str__(self):
        return f"{self.title} ({self.category})"
    
    @property
    def file_path(self):
        """Return the full path to the PDF file."""
        import os
        from django.conf import settings
        return os.path.join(settings.BASE_DIR, 'textbooks', self.file_name)
