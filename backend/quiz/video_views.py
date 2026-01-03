"""
Video API views for Cloudflare Stream integration.
Handles video courses, individual videos, and user progress tracking.
"""
from django.shortcuts import get_object_or_404
from django.utils import timezone
from django.db import models
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework import serializers

from .video_models import VideoCourse, Video, VideoProgress, CourseProgress


# ========== Serializers ==========

class VideoSerializer(serializers.ModelSerializer):
    """Serializer for Video model with computed fields"""
    duration_formatted = serializers.ReadOnlyField()
    is_completed = serializers.SerializerMethodField()
    watched_seconds = serializers.SerializerMethodField()
    progress_percentage = serializers.SerializerMethodField()
    embed_url = serializers.SerializerMethodField()

    class Meta:
        model = Video
        fields = [
            'id', 'title', 'description', 'cloudflare_video_id', 'bunny_video_id',
            'video_platform', 'embed_url', 'duration_seconds', 'duration_formatted', 
            'order', 'key_topics', 'thumbnail_url', 'is_completed',
            'watched_seconds', 'progress_percentage'
        ]

    def get_embed_url(self, obj):
        """Return the appropriate embed URL based on video platform"""
        from django.conf import settings
        if obj.video_platform == 'bunny' and obj.bunny_video_id:
            library_id = settings.BUNNY_STREAM_LIBRARY_ID
            return f"https://iframe.mediadelivery.net/embed/{library_id}/{obj.bunny_video_id}"
        elif obj.cloudflare_video_id:
            return f"https://iframe.videodelivery.net/{obj.cloudflare_video_id}"
        return ""

    def get_is_completed(self, obj):
        request = self.context.get('request')
        if request and request.user.is_authenticated:
            progress = VideoProgress.objects.filter(
                user=request.user, video=obj
            ).first()
            return progress.is_completed if progress else False
        return False

    def get_watched_seconds(self, obj):
        request = self.context.get('request')
        if request and request.user.is_authenticated:
            progress = VideoProgress.objects.filter(
                user=request.user, video=obj
            ).first()
            return progress.watched_seconds if progress else 0
        return 0

    def get_progress_percentage(self, obj):
        request = self.context.get('request')
        if request and request.user.is_authenticated:
            progress = VideoProgress.objects.filter(
                user=request.user, video=obj
            ).first()
            return progress.progress_percentage if progress else 0
        return 0


class VideoCourseListSerializer(serializers.ModelSerializer):
    """Serializer for course list (without videos)"""
    total_videos = serializers.ReadOnlyField()
    total_duration_formatted = serializers.ReadOnlyField()
    videos_completed = serializers.SerializerMethodField()
    progress_percentage = serializers.SerializerMethodField()

    class Meta:
        model = VideoCourse
        fields = [
            'id', 'title', 'slug',
            'thumbnail_url', 'order', 'total_videos',
            'total_duration_formatted', 'videos_completed', 'progress_percentage'
        ]

    def get_videos_completed(self, obj):
        request = self.context.get('request')
        if request and request.user.is_authenticated:
            return VideoProgress.objects.filter(
                user=request.user,
                video__course=obj,
                is_completed=True
            ).count()
        return 0

    def get_progress_percentage(self, obj):
        request = self.context.get('request')
        if request and request.user.is_authenticated:
            total = obj.total_videos
            if total == 0:
                return 0
            completed = VideoProgress.objects.filter(
                user=request.user,
                video__course=obj,
                is_completed=True
            ).count()
            return int((completed / total) * 100)
        return 0


class VideoCourseDetailSerializer(serializers.ModelSerializer):
    """Serializer for course detail (with videos)"""
    videos = VideoSerializer(many=True, read_only=True)
    total_videos = serializers.ReadOnlyField()
    total_duration_formatted = serializers.ReadOnlyField()
    videos_completed = serializers.SerializerMethodField()
    progress_percentage = serializers.SerializerMethodField()

    class Meta:
        model = VideoCourse
        fields = [
            'id', 'title', 'slug',
            'thumbnail_url', 'order', 'total_videos',
            'total_duration_formatted', 'videos_completed',
            'progress_percentage', 'videos'
        ]

    def get_videos_completed(self, obj):
        request = self.context.get('request')
        if request and request.user.is_authenticated:
            return VideoProgress.objects.filter(
                user=request.user,
                video__course=obj,
                is_completed=True
            ).count()
        return 0

    def get_progress_percentage(self, obj):
        request = self.context.get('request')
        if request and request.user.is_authenticated:
            total = obj.total_videos
            if total == 0:
                return 0
            completed = VideoProgress.objects.filter(
                user=request.user,
                video__course=obj,
                is_completed=True
            ).count()
            return int((completed / total) * 100)
        return 0


class VideoDetailSerializer(serializers.ModelSerializer):
    """Full video detail with playback info and navigation"""
    duration_formatted = serializers.ReadOnlyField()
    course_title = serializers.CharField(source='course.title', read_only=True)
    course_slug = serializers.CharField(source='course.slug', read_only=True)
    is_completed = serializers.SerializerMethodField()
    watched_seconds = serializers.SerializerMethodField()
    progress_percentage = serializers.SerializerMethodField()
    next_video_id = serializers.SerializerMethodField()
    previous_video_id = serializers.SerializerMethodField()
    video_number = serializers.SerializerMethodField()
    total_course_videos = serializers.SerializerMethodField()
    embed_url = serializers.SerializerMethodField()

    class Meta:
        model = Video
        fields = [
            'id', 'title', 'description', 'cloudflare_video_id', 'bunny_video_id',
            'video_platform', 'embed_url', 'duration_seconds', 'duration_formatted', 'order',
            'key_topics', 'thumbnail_url', 'course_title', 'course_slug',
            'is_completed', 'watched_seconds',
            'progress_percentage', 'next_video_id', 'previous_video_id',
            'video_number', 'total_course_videos'
        ]

    def get_embed_url(self, obj):
        """Return the appropriate embed URL based on video platform"""
        from django.conf import settings
        if obj.video_platform == 'bunny' and obj.bunny_video_id:
            library_id = settings.BUNNY_STREAM_LIBRARY_ID
            return f"https://iframe.mediadelivery.net/embed/{library_id}/{obj.bunny_video_id}"
        elif obj.cloudflare_video_id:
            return f"https://iframe.videodelivery.net/{obj.cloudflare_video_id}"
        return ""

    def get_is_completed(self, obj):
        request = self.context.get('request')
        if request and request.user.is_authenticated:
            progress = VideoProgress.objects.filter(
                user=request.user, video=obj
            ).first()
            return progress.is_completed if progress else False
        return False

    def get_watched_seconds(self, obj):
        request = self.context.get('request')
        if request and request.user.is_authenticated:
            progress = VideoProgress.objects.filter(
                user=request.user, video=obj
            ).first()
            return progress.watched_seconds if progress else 0
        return 0

    def get_progress_percentage(self, obj):
        request = self.context.get('request')
        if request and request.user.is_authenticated:
            progress = VideoProgress.objects.filter(
                user=request.user, video=obj
            ).first()
            return progress.progress_percentage if progress else 0
        return 0

    def get_next_video_id(self, obj):
        next_video = obj.get_next_video()
        return next_video.id if next_video else None

    def get_previous_video_id(self, obj):
        prev_video = obj.get_previous_video()
        return prev_video.id if prev_video else None

    def get_video_number(self, obj):
        return Video.objects.filter(
            course=obj.course,
            order__lt=obj.order,
            is_active=True
        ).count() + 1

    def get_total_course_videos(self, obj):
        return obj.course.total_videos


# ========== ViewSets ==========

class VideoCourseViewSet(viewsets.ReadOnlyModelViewSet):
    """
    ViewSet for video courses.
    List all courses with progress, or retrieve single course with videos.
    """
    queryset = VideoCourse.objects.filter(is_active=True)
    permission_classes = [IsAuthenticated]
    lookup_field = 'slug'
    pagination_class = None  # Return plain array, not paginated

    def get_serializer_class(self):
        if self.action == 'retrieve':
            return VideoCourseDetailSerializer
        return VideoCourseListSerializer

    def get_queryset(self):
        return VideoCourse.objects.filter(is_active=True).prefetch_related(
            'videos'
        )


class VideoViewSet(viewsets.ReadOnlyModelViewSet):
    """
    ViewSet for individual videos.
    Retrieve video details and manage progress.
    """
    queryset = Video.objects.filter(is_active=True)
    serializer_class = VideoDetailSerializer
    permission_classes = [IsAuthenticated]
    pagination_class = None  # Return plain array, not paginated

    def get_queryset(self):
        return Video.objects.filter(is_active=True).select_related('course')

    @action(detail=True, methods=['post'])
    def update_progress(self, request, pk=None):
        """
        Update video watch progress.
        POST /api/videos/<id>/update_progress/
        Body: { "watched_seconds": 120 }
        """
        video = self.get_object()
        watched_seconds = request.data.get('watched_seconds', 0)

        try:
            watched_seconds = int(watched_seconds)
        except (TypeError, ValueError):
            return Response(
                {'error': 'watched_seconds must be an integer'},
                status=status.HTTP_400_BAD_REQUEST
            )

        progress, created = VideoProgress.objects.get_or_create(
            user=request.user,
            video=video,
            defaults={'watched_seconds': watched_seconds}
        )

        if not created:
            # Only update if new position is further than before
            if watched_seconds > progress.watched_seconds:
                progress.watched_seconds = watched_seconds
                progress.save()

        # Update course progress last video
        course_progress, _ = CourseProgress.objects.get_or_create(
            user=request.user,
            course=video.course
        )
        course_progress.last_video = video
        course_progress.save()

        return Response({
            'watched_seconds': progress.watched_seconds,
            'progress_percentage': progress.progress_percentage,
            'is_completed': progress.is_completed
        })

    @action(detail=True, methods=['post'])
    def mark_complete(self, request, pk=None):
        """
        Mark video as completed.
        POST /api/videos/<id>/mark_complete/
        """
        video = self.get_object()

        progress, created = VideoProgress.objects.get_or_create(
            user=request.user,
            video=video
        )
        progress.watched_seconds = video.duration_seconds
        progress.is_completed = True
        progress.completed_at = timezone.now()
        progress.save()

        # Update course progress
        course_progress, _ = CourseProgress.objects.get_or_create(
            user=request.user,
            course=video.course
        )
        course_progress.update_progress()

        return Response({
            'is_completed': True,
            'completed_at': progress.completed_at,
            'course_videos_completed': course_progress.videos_completed,
            'course_progress_percentage': course_progress.progress_percentage
        })

    @action(detail=True, methods=['get'])
    def course_videos(self, request, pk=None):
        """
        Get all videos in the same course as this video.
        GET /api/videos/<id>/course_videos/
        """
        video = self.get_object()
        videos = Video.objects.filter(
            course=video.course,
            is_active=True
        ).order_by('order')

        serializer = VideoSerializer(
            videos, many=True, context={'request': request}
        )
        return Response({
            'course_title': video.course.title,
            'course_slug': video.course.slug,
            'videos': serializer.data
        })


class VideoProgressViewSet(viewsets.ViewSet):
    """
    ViewSet for user's overall video progress.
    """
    permission_classes = [IsAuthenticated]

    def list(self, request):
        """
        Get user's overall video statistics.
        GET /api/video-progress/
        """
        user = request.user

        total_videos = Video.objects.filter(is_active=True).count()
        completed_videos = VideoProgress.objects.filter(
            user=user, is_completed=True
        ).count()

        total_courses = VideoCourse.objects.filter(is_active=True).count()
        courses_started = CourseProgress.objects.filter(user=user).count()
        courses_completed = CourseProgress.objects.filter(
            user=user
        ).annotate(
            total=models.Count('course__videos', filter=models.Q(course__videos__is_active=True))
        ).filter(videos_completed=models.F('total')).count()

        # Total watch time in seconds
        total_watched = VideoProgress.objects.filter(user=user).aggregate(
            total=models.Sum('watched_seconds')
        )['total'] or 0

        # Continue watching - get last video for each started course
        continue_watching = []
        for cp in CourseProgress.objects.filter(user=user).order_by('-last_watched_at')[:3]:
            if cp.last_video:
                continue_watching.append({
                    'video_id': cp.last_video.id,
                    'video_title': cp.last_video.title,
                    'course_title': cp.course.title,
                    'course_slug': cp.course.slug,
                    'duration_formatted': cp.last_video.duration_formatted
                })

        return Response({
            'total_videos': total_videos,
            'completed_videos': completed_videos,
            'total_courses': total_courses,
            'courses_started': courses_started,
            'courses_completed': courses_completed,
            'total_watched_seconds': total_watched,
            'total_watched_formatted': self._format_duration(total_watched),
            'continue_watching': continue_watching
        })

    def _format_duration(self, seconds):
        """Format seconds to human readable duration"""
        hours = seconds // 3600
        minutes = (seconds % 3600) // 60
        if hours > 0:
            return f"{hours}h {minutes}m"
        return f"{minutes}m"
