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
            library_id = getattr(settings, 'BUNNY_STREAM_LIBRARY_ID', '573273')
            return f"https://iframe.mediadelivery.net/embed/{library_id}/{obj.bunny_video_id}"
        elif obj.cloudflare_video_id:
            return f"https://iframe.videodelivery.net/{obj.cloudflare_video_id}"
        return ""

    def _get_progress(self, obj):
        """Get or cache video progress for current user"""
        # Check if already cached on the object
        if hasattr(obj, '_cached_progress'):
            return obj._cached_progress
        
        request = self.context.get('request')
        if request and request.user.is_authenticated:
            # Check if progress was prefetched
            if hasattr(obj, 'prefetched_progress'):
                obj._cached_progress = obj.prefetched_progress[0] if obj.prefetched_progress else None
            else:
                obj._cached_progress = VideoProgress.objects.filter(
                    user=request.user, video=obj
                ).first()
        else:
            obj._cached_progress = None
        return obj._cached_progress

    def get_is_completed(self, obj):
        progress = self._get_progress(obj)
        return progress.is_completed if progress else False

    def get_watched_seconds(self, obj):
        progress = self._get_progress(obj)
        return progress.watched_seconds if progress else 0

    def get_progress_percentage(self, obj):
        progress = self._get_progress(obj)
        return progress.progress_percentage if progress else 0


class VideoCourseListSerializer(serializers.ModelSerializer):
    """Serializer for course list (without videos)"""
    total_videos = serializers.ReadOnlyField()
    total_duration_formatted = serializers.ReadOnlyField()
    videos_completed = serializers.SerializerMethodField()
    progress_percentage = serializers.SerializerMethodField()
    category_display = serializers.CharField(source='get_category_display', read_only=True)
    first_video_id = serializers.SerializerMethodField()
    next_video_id = serializers.SerializerMethodField()

    class Meta:
        model = VideoCourse
        fields = [
            'id', 'title', 'slug', 'category', 'category_display', 'description',
            'thumbnail_url', 'order', 'total_videos',
            'total_duration_formatted', 'videos_completed', 'progress_percentage',
            'first_video_id', 'next_video_id'
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

    def get_first_video_id(self, obj):
        """Get ID of first video in course"""
        first_video = obj.videos.filter(is_active=True).order_by('order').first()
        return first_video.id if first_video else None

    def get_next_video_id(self, obj):
        """Get ID of next unwatched video, or first video if all completed"""
        request = self.context.get('request')
        if request and request.user.is_authenticated:
            # Get IDs of completed videos
            completed_ids = set(VideoProgress.objects.filter(
                user=request.user,
                video__course=obj,
                is_completed=True
            ).values_list('video_id', flat=True))
            
            # Find first unwatched video
            for video in obj.videos.filter(is_active=True).order_by('order'):
                if video.id not in completed_ids:
                    return video.id
        
        # Return first video if all completed or not authenticated
        first_video = obj.videos.filter(is_active=True).order_by('order').first()
        return first_video.id if first_video else None

    def get_progress_percentage(self, obj):
        total = obj.total_videos
        completed = self.get_videos_completed(obj)
        if total == 0:
            return 0
        return int((completed / total) * 100)


class VideoCourseDetailSerializer(serializers.ModelSerializer):
    """Serializer for course detail (with videos)"""
    videos = VideoSerializer(many=True, read_only=True)
    total_videos = serializers.ReadOnlyField()
    total_duration_formatted = serializers.ReadOnlyField()
    videos_completed = serializers.SerializerMethodField()
    progress_percentage = serializers.SerializerMethodField()
    category_display = serializers.CharField(source='get_category_display', read_only=True)

    class Meta:
        model = VideoCourse
        fields = [
            'id', 'title', 'slug', 'category', 'category_display', 'description',
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
        total = obj.total_videos
        completed = self.get_videos_completed(obj)
        if total == 0:
            return 0
        return int((completed / total) * 100)


class VideoDetailSerializer(serializers.ModelSerializer):
    """Full video detail with playback info and navigation - OPTIMIZED"""
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
            library_id = getattr(settings, 'BUNNY_STREAM_LIBRARY_ID', '573273')
            return f"https://iframe.mediadelivery.net/embed/{library_id}/{obj.bunny_video_id}"
        elif obj.cloudflare_video_id:
            return f"https://iframe.videodelivery.net/{obj.cloudflare_video_id}"
        return ""

    def _get_progress(self, obj):
        """Get and cache video progress for current user - avoids multiple queries"""
        if hasattr(obj, '_cached_progress'):
            return obj._cached_progress
        
        request = self.context.get('request')
        if request and request.user.is_authenticated:
            obj._cached_progress = VideoProgress.objects.filter(
                user=request.user, video=obj
            ).first()
        else:
            obj._cached_progress = None
        return obj._cached_progress

    def get_is_completed(self, obj):
        progress = self._get_progress(obj)
        return progress.is_completed if progress else False

    def get_watched_seconds(self, obj):
        progress = self._get_progress(obj)
        return progress.watched_seconds if progress else 0

    def get_progress_percentage(self, obj):
        progress = self._get_progress(obj)
        return progress.progress_percentage if progress else 0

    def get_next_video_id(self, obj):
        # Use cached nav data if available
        if hasattr(obj, '_next_video_id'):
            return obj._next_video_id
        next_video = obj.get_next_video()
        return next_video.id if next_video else None

    def get_previous_video_id(self, obj):
        # Use cached nav data if available
        if hasattr(obj, '_previous_video_id'):
            return obj._previous_video_id
        prev_video = obj.get_previous_video()
        return prev_video.id if prev_video else None

    def get_video_number(self, obj):
        if hasattr(obj, '_video_number'):
            return obj._video_number
        return Video.objects.filter(
            course=obj.course,
            order__lt=obj.order,
            is_active=True
        ).count() + 1

    def get_total_course_videos(self, obj):
        if hasattr(obj, '_total_course_videos'):
            return obj._total_course_videos
        return obj.course.total_videos


# ========== ViewSets ==========

def add_cache_headers(response, max_age=3600, public=True):
    """Add Cache-Control headers to a response for edge caching."""
    cache_type = 'public' if public else 'private'
    response['Cache-Control'] = f'{cache_type}, max-age={max_age}, stale-while-revalidate=60'
    return response


class VideoCourseViewSet(viewsets.ReadOnlyModelViewSet):
    """
    ViewSet for video courses - optimized with annotated counts.
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
        # Model has total_videos as a property, so just prefetch videos
        return VideoCourse.objects.filter(is_active=True).prefetch_related(
            'videos'
        ).order_by('order', 'title')
    
    def list(self, request, *args, **kwargs):
        """List all courses with caching."""
        response = super().list(request, *args, **kwargs)
        # Cache for 5 minutes (has user-specific progress)
        return add_cache_headers(response, max_age=300, public=False)


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
    
    def retrieve(self, request, *args, **kwargs):
        """
        OPTIMIZED: Precompute navigation and progress data to avoid multiple queries.
        """
        video = self.get_object()
        
        # Get all videos in course in ONE query for navigation
        course_videos = list(Video.objects.filter(
            course=video.course,
            is_active=True
        ).order_by('order').values_list('id', 'order'))
        
        # Find video position and nav
        video_ids = [v[0] for v in course_videos]
        video_orders = {v[0]: v[1] for v in course_videos}
        
        try:
            idx = video_ids.index(video.id)
            video._video_number = idx + 1
            video._total_course_videos = len(video_ids)
            video._next_video_id = video_ids[idx + 1] if idx + 1 < len(video_ids) else None
            video._previous_video_id = video_ids[idx - 1] if idx > 0 else None
        except ValueError:
            video._video_number = 1
            video._total_course_videos = len(video_ids)
            video._next_video_id = None
            video._previous_video_id = None
        
        # Cache progress
        if request.user.is_authenticated:
            progress = VideoProgress.objects.filter(
                user=request.user, video=video
            ).first()
            video._cached_progress = progress
        else:
            video._cached_progress = None
        
        serializer = self.get_serializer(video)
        return Response(serializer.data)

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
        
        OPTIMIZED: Pre-fetches all progress data to avoid N+1 queries
        """
        video = self.get_object()
        videos = list(Video.objects.filter(
            course=video.course,
            is_active=True
        ).order_by('order'))
        
        # Pre-fetch all progress data for these videos in ONE query
        if request.user.is_authenticated:
            video_ids = [v.id for v in videos]
            progress_map = {
                vp['video_id']: vp
                for vp in VideoProgress.objects.filter(
                    user=request.user,
                    video_id__in=video_ids
                ).values('video_id', 'is_completed', 'watched_seconds')
            }
            
            # Attach progress to each video object for serializer to use
            for v in videos:
                vp = progress_map.get(v.id)
                if vp:
                    v._cached_progress = type('Progress', (), {
                        'is_completed': vp['is_completed'],
                        'watched_seconds': vp['watched_seconds'],
                        'progress_percentage': int((vp['watched_seconds'] / v.duration_seconds) * 100) if v.duration_seconds > 0 else 0
                    })()
                else:
                    v._cached_progress = None

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

    @action(detail=False, methods=['get'])
    def page_data(self, request):
        """
        OPTIMIZED: Get all data needed for VideoTutorials page in ONE call.
        
        Performance: Uses caching + minimal database queries
        """
        from django.core.cache import cache
        
        user = request.user
        
        # Check cache for course and video data (static - cache for 30 minutes)
        cache_key = 'video_page_courses'
        cached_data = cache.get(cache_key)
        
        if cached_data:
            courses = cached_data['courses']
            first_videos = cached_data['first_videos']
            course_videos = cached_data['course_videos']
        else:
            # Query 1: Get all courses with video counts AND total duration
            courses = list(VideoCourse.objects.filter(is_active=True).annotate(
                video_count=models.Count('videos', filter=models.Q(videos__is_active=True)),
                total_duration=models.Sum('videos__duration_seconds', filter=models.Q(videos__is_active=True))
            ).values(
                'id', 'title', 'slug', 'category', 'description', 
                'thumbnail_url', 'order', 'video_count', 'total_duration'
            ).order_by('order', 'title'))
            
            # Query 2: Get ALL videos in one query
            first_videos = {}
            course_videos = {}
            for video in Video.objects.filter(is_active=True).values(
                'id', 'course_id', 'order'
            ).order_by('course_id', 'order'):
                course_id = video['course_id']
                if course_id not in first_videos:
                    first_videos[course_id] = video['id']
                if course_id not in course_videos:
                    course_videos[course_id] = []
                course_videos[course_id].append(video['id'])
            
            # Cache static data for 30 minutes
            cache.set(cache_key, {
                'courses': courses,
                'first_videos': first_videos,
                'course_videos': course_videos
            }, 1800)
        
        # User progress (not cached - must be fresh)
        all_progress = {}
        completed_videos_count = 0
        total_watched = 0
        courses_started_count = 0
        continue_watching = []
        
        if user.is_authenticated:
            # Get completed video IDs grouped by course
            for vp in VideoProgress.objects.filter(
                user=user, is_completed=True
            ).values('video_id', 'video__course_id'):
                course_id = vp['video__course_id']
                if course_id not in all_progress:
                    all_progress[course_id] = set()
                all_progress[course_id].add(vp['video_id'])
            
            # Get aggregate stats in one query
            stats = VideoProgress.objects.filter(user=user).aggregate(
                completed_count=models.Count('id', filter=models.Q(is_completed=True)),
                total_watched=models.Sum('watched_seconds')
            )
            completed_videos_count = stats['completed_count'] or 0
            total_watched = stats['total_watched'] or 0
            
            # Get courses started count
            courses_started_count = CourseProgress.objects.filter(user=user).count()
            
            # Continue watching (limit 3)
            for cp in CourseProgress.objects.filter(
                user=user, last_video__isnull=False
            ).select_related('last_video', 'course').order_by('-last_watched_at')[:3]:
                continue_watching.append({
                    'video_id': cp.last_video.id,
                    'video_title': cp.last_video.title,
                    'course_title': cp.course.title,
                    'course_slug': cp.course.slug,
                    'duration_formatted': f"{cp.last_video.duration_seconds // 60}:{cp.last_video.duration_seconds % 60:02d}"
                })
        
        # Build course data
        course_data = []
        courses_completed_count = 0
        
        for course in courses:
            course_id = course['id']
            completed_ids = all_progress.get(course_id, set())
            completed_count = len(completed_ids)
            total_videos = course['video_count'] or 0
            total_duration = course['total_duration'] or 0
            
            # Calculate first unwatched video
            first_video_id = first_videos.get(course_id)
            next_video_id = first_video_id
            
            if completed_ids and course_id in course_videos:
                for vid_id in course_videos[course_id]:
                    if vid_id not in completed_ids:
                        next_video_id = vid_id
                        break
            
            # Format duration
            hours = total_duration // 3600
            minutes = (total_duration % 3600) // 60
            duration_formatted = f"{hours}h {minutes}m" if hours > 0 else f"{minutes}m"
            
            if total_videos > 0 and completed_count == total_videos:
                courses_completed_count += 1
            
            category_display = 'FLK1 - Functioning Legal Knowledge 1' if course['category'] == 'FLK1' else 'FLK2 - Functioning Legal Knowledge 2'
            
            course_data.append({
                'id': course_id,
                'title': course['title'],
                'slug': course['slug'],
                'category': course['category'],
                'category_display': category_display,
                'description': course['description'],
                'thumbnail_url': course['thumbnail_url'],
                'order': course['order'],
                'total_videos': total_videos,
                'total_duration_formatted': duration_formatted,
                'videos_completed': completed_count,
                'progress_percentage': int((completed_count / total_videos) * 100) if total_videos > 0 else 0,
                'first_video_id': first_video_id,
                'next_video_id': next_video_id,
            })
        
        # Calculate totals
        total_videos_count = sum(c['total_videos'] for c in course_data)
        
        watched_hours = total_watched // 3600
        watched_minutes = (total_watched % 3600) // 60
        watched_formatted = f"{watched_hours}h {watched_minutes}m" if watched_hours > 0 else f"{watched_minutes}m"
        
        response = Response({
            'courses': course_data,
            'stats': {
                'total_videos': total_videos_count,
                'completed_videos': completed_videos_count,
                'total_courses': len(courses),
                'courses_started': courses_started_count,
                'courses_completed': courses_completed_count,
                'total_watched_seconds': total_watched,
                'total_watched_formatted': watched_formatted,
                'continue_watching': continue_watching,
            }
        })
        
        # Add cache headers for edge caching (5 min for user-specific data)
        response['Cache-Control'] = 'private, max-age=300, stale-while-revalidate=60'
        return response
