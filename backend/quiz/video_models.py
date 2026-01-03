"""
Video models for Cloudflare Stream integration.
Manages video courses, individual videos, and user progress tracking.
"""
from django.db import models
from django.contrib.auth.models import User
from django.utils.text import slugify


class VideoCourse(models.Model):
    """
    A course containing multiple video tutorials.
    E.g., "Contract Law", "Property Law", etc.
    """
    title = models.CharField(max_length=200)
    slug = models.SlugField(unique=True, blank=True)
    thumbnail_url = models.URLField(blank=True)
    order = models.IntegerField(default=0, help_text="Display order on course listing")
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['order', 'title']
        verbose_name = "Video Course"
        verbose_name_plural = "Video Courses"

    def __str__(self):
        return self.title

    def save(self, *args, **kwargs):
        if not self.slug:
            self.slug = slugify(self.title)
        super().save(*args, **kwargs)

    @property
    def total_videos(self):
        return self.videos.filter(is_active=True).count()

    @property
    def total_duration_seconds(self):
        return self.videos.filter(is_active=True).aggregate(
            total=models.Sum('duration_seconds')
        )['total'] or 0

    @property
    def total_duration_formatted(self):
        """Return duration in HH:MM format"""
        total_seconds = self.total_duration_seconds
        hours = total_seconds // 3600
        minutes = (total_seconds % 3600) // 60
        if hours > 0:
            return f"{hours}h {minutes}m"
        return f"{minutes}m"


class Video(models.Model):
    """
    Individual video in a course.
    Supports multiple video platforms (Cloudflare Stream, Bunny.net Stream).
    """
    PLATFORM_CLOUDFLARE = 'cloudflare'
    PLATFORM_BUNNY = 'bunny'
    PLATFORM_CHOICES = [
        (PLATFORM_CLOUDFLARE, 'Cloudflare Stream'),
        (PLATFORM_BUNNY, 'Bunny.net Stream'),
    ]
    
    course = models.ForeignKey(
        VideoCourse, 
        on_delete=models.CASCADE, 
        related_name='videos'
    )
    title = models.CharField(max_length=200)
    description = models.TextField(blank=True)
    
    # Video platform selection
    video_platform = models.CharField(
        max_length=20,
        choices=PLATFORM_CHOICES,
        default=PLATFORM_BUNNY,
        help_text="Video hosting platform"
    )
    
    # Cloudflare Stream video ID (legacy)
    cloudflare_video_id = models.CharField(
        max_length=100, 
        unique=True,
        blank=True,
        null=True,
        help_text="Cloudflare Stream video UID"
    )
    
    # Bunny.net Stream video ID
    bunny_video_id = models.CharField(
        max_length=100,
        unique=True,
        blank=True,
        null=True,
        help_text="Bunny.net Stream video GUID"
    )
    
    duration_seconds = models.IntegerField(default=0)
    order = models.IntegerField(default=0, help_text="Order within the course")
    key_topics = models.JSONField(
        default=list, 
        blank=True,
        help_text="List of key topics covered, e.g. ['Topic 1', 'Topic 2']"
    )
    thumbnail_url = models.URLField(blank=True)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['course', 'order']
        verbose_name = "Video"
        verbose_name_plural = "Videos"
        indexes = [
            models.Index(fields=['course', 'order']),
            models.Index(fields=['cloudflare_video_id']),
            models.Index(fields=['bunny_video_id']),
        ]

    def __str__(self):
        return f"{self.course.title} - {self.title}"

    @property
    def duration_formatted(self):
        """Return duration in MM:SS format"""
        minutes = self.duration_seconds // 60
        seconds = self.duration_seconds % 60
        return f"{minutes}:{seconds:02d}"

    @property
    def playback_url(self):
        """Generate Cloudflare Stream iframe embed URL"""
        return f"https://customer-{{}}.cloudflarestream.com/{self.cloudflare_video_id}/iframe"

    def get_next_video(self):
        """Get the next video in the course"""
        return Video.objects.filter(
            course=self.course,
            order__gt=self.order,
            is_active=True
        ).first()

    def get_previous_video(self):
        """Get the previous video in the course"""
        return Video.objects.filter(
            course=self.course,
            order__lt=self.order,
            is_active=True
        ).order_by('-order').first()


class VideoProgress(models.Model):
    """
    Tracks user's progress on a video.
    Stores watch position and completion status.
    """
    user = models.ForeignKey(
        User, 
        on_delete=models.CASCADE, 
        related_name='video_progress'
    )
    video = models.ForeignKey(
        Video, 
        on_delete=models.CASCADE, 
        related_name='user_progress'
    )
    watched_seconds = models.IntegerField(default=0)
    is_completed = models.BooleanField(default=False)
    last_watched_at = models.DateTimeField(auto_now=True)
    completed_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        unique_together = ['user', 'video']
        verbose_name = "Video Progress"
        verbose_name_plural = "Video Progress"
        indexes = [
            models.Index(fields=['user', 'video']),
            models.Index(fields=['user', 'is_completed']),
        ]

    def __str__(self):
        status = "✓" if self.is_completed else f"{self.progress_percentage}%"
        return f"{self.user.username} - {self.video.title} ({status})"

    @property
    def progress_percentage(self):
        """Calculate watch progress as percentage"""
        if self.video.duration_seconds == 0:
            return 0
        return min(100, int((self.watched_seconds / self.video.duration_seconds) * 100))

    def mark_complete(self):
        """Mark video as completed"""
        from django.utils import timezone
        self.is_completed = True
        self.completed_at = timezone.now()
        self.save()


class CourseProgress(models.Model):
    """
    Aggregated progress for a user on a course.
    Cached for performance - updated when video progress changes.
    """
    user = models.ForeignKey(
        User, 
        on_delete=models.CASCADE, 
        related_name='course_progress'
    )
    course = models.ForeignKey(
        VideoCourse, 
        on_delete=models.CASCADE, 
        related_name='user_progress'
    )
    videos_completed = models.IntegerField(default=0)
    last_video = models.ForeignKey(
        Video, 
        on_delete=models.SET_NULL, 
        null=True, 
        blank=True,
        help_text="Last video the user was watching"
    )
    last_watched_at = models.DateTimeField(auto_now=True)

    class Meta:
        unique_together = ['user', 'course']
        verbose_name = "Course Progress"
        verbose_name_plural = "Course Progress"

    def __str__(self):
        return f"{self.user.username} - {self.course.title} ({self.videos_completed}/{self.course.total_videos})"

    @property
    def progress_percentage(self):
        """Calculate course completion percentage"""
        total = self.course.total_videos
        if total == 0:
            return 0
        return int((self.videos_completed / total) * 100)

    def update_progress(self):
        """Recalculate completed videos count from VideoProgress"""
        completed = VideoProgress.objects.filter(
            user=self.user,
            video__course=self.course,
            is_completed=True
        ).count()
        self.videos_completed = completed
        self.save()
