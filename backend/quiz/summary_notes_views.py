"""
API views for Summary Notes feature.
Provides endpoints for listing, reading, and tracking progress on summary notes.
OPTIMIZED: Uses annotations and batch queries to avoid N+1 problems.
"""
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework import serializers
from django.db.models import Count, Prefetch
from django.db import models
from django.core.cache import cache

from .summary_notes_models import SummaryNotes, SummaryNotesChapter, SummaryNotesProgress


# ========== Serializers ==========

class SummaryNotesChapterListSerializer(serializers.ModelSerializer):
    """Lightweight serializer for chapter list (no content)."""
    is_completed = serializers.SerializerMethodField()
    
    class Meta:
        model = SummaryNotesChapter
        fields = ['id', 'title', 'order', 'is_completed']
    
    def get_is_completed(self, obj):
        # Use cached completed_chapters from context
        completed_chapters = self.context.get('completed_chapters', [])
        return obj.id in completed_chapters


class SummaryNotesChapterDetailSerializer(serializers.ModelSerializer):
    """Full serializer for chapter with content."""
    is_completed = serializers.SerializerMethodField()
    
    class Meta:
        model = SummaryNotesChapter
        fields = ['id', 'title', 'order', 'content', 'is_completed']
    
    def get_is_completed(self, obj):
        completed_chapters = self.context.get('completed_chapters', [])
        return obj.id in completed_chapters


class SummaryNotesListSerializer(serializers.ModelSerializer):
    """Serializer for summary notes list - uses annotated fields."""
    # Use annotated field from queryset instead of property
    total_chapters = serializers.IntegerField(source='chapter_count', read_only=True)
    chapters_completed = serializers.SerializerMethodField()
    progress_percentage = serializers.SerializerMethodField()
    category_display = serializers.CharField(source='get_category_display', read_only=True)
    
    class Meta:
        model = SummaryNotes
        fields = [
            'id', 'title', 'subject', 'category', 'category_display',
            'description', 'icon', 'order', 'total_chapters',
            'chapters_completed', 'progress_percentage'
        ]
    
    def get_chapters_completed(self, obj):
        # Use prefetched user_progress
        if hasattr(obj, '_prefetched_progress'):
            progress = obj._prefetched_progress
            if progress:
                return len(progress.completed_chapters or [])
        return 0
    
    def get_progress_percentage(self, obj):
        # Use prefetched data and annotated count
        if hasattr(obj, '_prefetched_progress') and hasattr(obj, 'chapter_count'):
            progress = obj._prefetched_progress
            if progress and obj.chapter_count > 0:
                completed = len(progress.completed_chapters or [])
                return round((completed / obj.chapter_count) * 100)
        return 0


class SummaryNotesDetailSerializer(serializers.ModelSerializer):
    """Full serializer for summary notes with chapters."""
    chapters = serializers.SerializerMethodField()
    total_chapters = serializers.IntegerField(source='chapter_count', read_only=True)
    chapters_completed = serializers.SerializerMethodField()
    progress_percentage = serializers.SerializerMethodField()
    current_chapter_id = serializers.SerializerMethodField()
    category_display = serializers.CharField(source='get_category_display', read_only=True)
    
    class Meta:
        model = SummaryNotes
        fields = [
            'id', 'title', 'subject', 'category', 'category_display',
            'description', 'icon', 'order', 'total_chapters',
            'chapters_completed', 'progress_percentage', 'current_chapter_id',
            'chapters'
        ]
    
    def get_chapters(self, obj):
        # Use prefetched chapters - only get id, title, order (no content)
        chapters = obj.prefetched_chapters if hasattr(obj, 'prefetched_chapters') else []
        completed_chapters = self.context.get('completed_chapters', [])
        
        return [
            {
                'id': c.id,
                'title': c.title,
                'order': c.order,
                'is_completed': c.id in completed_chapters
            }
            for c in chapters
        ]
    
    def get_chapters_completed(self, obj):
        completed_chapters = self.context.get('completed_chapters', [])
        return len(completed_chapters)
    
    def get_progress_percentage(self, obj):
        completed_chapters = self.context.get('completed_chapters', [])
        total = getattr(obj, 'chapter_count', 0)
        if total > 0:
            return round((len(completed_chapters) / total) * 100)
        return 0
    
    def get_current_chapter_id(self, obj):
        return self.context.get('current_chapter_id')


# ========== ViewSets ==========

def add_cache_headers(response, max_age=3600, public=True):
    """Add Cache-Control headers to a response for edge caching."""
    cache_type = 'public' if public else 'private'
    response['Cache-Control'] = f'{cache_type}, max-age={max_age}, stale-while-revalidate=60'
    return response


class SummaryNotesViewSet(viewsets.ReadOnlyModelViewSet):
    """
    ViewSet for Summary Notes - OPTIMIZED for performance.
    
    Endpoints:
    - GET /summary-notes/ - List all summary notes
    - GET /summary-notes/{id}/ - Get summary notes with chapters
    - GET /summary-notes/{id}/chapter/{chapter_id}/ - Get specific chapter content
    - POST /summary-notes/{id}/progress/ - Update reading progress
    """
    queryset = SummaryNotes.objects.filter(is_active=True)
    permission_classes = [IsAuthenticated]
    
    def get_serializer_class(self):
        if self.action == 'retrieve':
            return SummaryNotesDetailSerializer
        return SummaryNotesListSerializer
    
    def get_queryset(self):
        # Annotate chapter count to avoid N+1 queries
        return SummaryNotes.objects.filter(is_active=True).annotate(
            chapter_count=Count('chapters', filter=models.Q(chapters__is_active=True))
        ).order_by('category', 'order', 'title')
    
    def list(self, request, *args, **kwargs):
        # CACHE KEY STRATEGY:
        # - Static data (course list): cached for 30 minutes
        # - User progress: cached for 2 minutes
        
        # Try to get cached static data
        static_cache_key = 'summary_notes_list_static'
        cached_static = cache.get(static_cache_key)
        
        if cached_static is None:
            # Fetch and cache static data
            queryset = self.get_queryset()
            notes_data = []
            for notes in queryset:
                notes_data.append({
                    'id': notes.id,
                    'title': notes.title,
                    'subject': notes.subject,
                    'category': notes.category,
                    'category_display': notes.get_category_display(),
                    'description': notes.description,
                    'icon': notes.icon,
                    'order': notes.order,
                    'total_chapters': notes.chapter_count,
                })
            cached_static = notes_data
            cache.set(static_cache_key, cached_static, 1800)  # 30 minutes
        
        # Get user progress (cached separately for 2 minutes)
        if request.user.is_authenticated:
            user_cache_key = f'summary_notes_progress_{request.user.id}'
            user_progress = cache.get(user_cache_key)
            
            # Handle stale cache with wrong format or missing cache
            if user_progress is None or not isinstance(user_progress, dict):
                progress_list = SummaryNotesProgress.objects.filter(
                    user=request.user
                ).values('summary_notes_id', 'completed_chapters', 'current_chapter_id')
                user_progress = {}
                for p in progress_list:
                    user_progress[p['summary_notes_id']] = {
                        'completed': p['completed_chapters'] or [],
                        'current': p['current_chapter_id']
                    }
                cache.set(user_cache_key, user_progress, 120)  # 2 minutes
        else:
            user_progress = {}
        
        # Merge static data with user progress
        result = []
        for notes in cached_static:
            notes_progress = user_progress.get(notes['id'], {})
            if isinstance(notes_progress, dict):
                completed = notes_progress.get('completed', [])
            else:
                # Handle legacy format (list directly)
                completed = notes_progress if isinstance(notes_progress, list) else []
            total = notes['total_chapters']
            result.append({
                **notes,
                'chapters_completed': len(completed),
                'progress_percentage': round(len(completed) / total * 100) if total > 0 else 0,
            })
        
        response = Response(result)
        return add_cache_headers(response, max_age=120, public=False)
    
    def retrieve(self, request, *args, **kwargs):
        pk = kwargs.get('pk')
        
        # Try to get cached static data for this notes
        static_cache_key = f'summary_notes_detail_{pk}'
        cached_static = cache.get(static_cache_key)
        
        if cached_static is None:
            instance = self.get_object()
            
            # Batch fetch chapters (only id, title, order - NO content)
            chapters = list(
                instance.chapters.filter(is_active=True)
                .order_by('order')
                .values('id', 'title', 'order')
            )
            
            cached_static = {
                'id': instance.id,
                'title': instance.title,
                'subject': instance.subject,
                'category': instance.category,
                'category_display': instance.get_category_display(),
                'description': instance.description,
                'icon': instance.icon,
                'order': instance.order,
                'total_chapters': len(chapters),
                'chapters': chapters,
            }
            cache.set(static_cache_key, cached_static, 1800)  # 30 minutes
        
        # Get user progress (cached for 2 minutes)
        completed_chapters = []
        current_chapter_id = cached_static['chapters'][0]['id'] if cached_static['chapters'] else None
        
        if request.user.is_authenticated:
            user_cache_key = f'summary_notes_progress_{request.user.id}'
            user_progress = cache.get(user_cache_key)
            
            # Handle stale cache with wrong format or missing cache
            if user_progress is None or not isinstance(user_progress, dict):
                progress_list = SummaryNotesProgress.objects.filter(
                    user=request.user
                ).values('summary_notes_id', 'completed_chapters', 'current_chapter_id')
                user_progress = {}
                for p in progress_list:
                    user_progress[p['summary_notes_id']] = {
                        'completed': p['completed_chapters'] or [],
                        'current': p['current_chapter_id']
                    }
                cache.set(user_cache_key, user_progress, 120)  # 2 minutes
            
            notes_progress = user_progress.get(int(pk), {})
            if isinstance(notes_progress, dict):
                completed_chapters = notes_progress.get('completed', [])
                if notes_progress.get('current'):
                    current_chapter_id = notes_progress['current']
        
        # Build response with merged data
        chapters_with_status = []
        for ch in cached_static['chapters']:
            chapters_with_status.append({
                **ch,
                'is_completed': ch['id'] in completed_chapters,
            })
        
        total = cached_static['total_chapters']
        response_data = {
            **cached_static,
            'chapters': chapters_with_status,
            'chapters_completed': len(completed_chapters),
            'progress_percentage': round(len(completed_chapters) / total * 100) if total > 0 else 0,
            'current_chapter_id': current_chapter_id,
        }
        
        return Response(response_data)
    
    @action(detail=True, methods=['get'], url_path='chapter/(?P<chapter_id>[^/.]+)')
    def chapter(self, request, pk=None, chapter_id=None):
        """Get specific chapter content."""
        
        # Try to get cached chapter content (rarely changes)
        chapter_cache_key = f'summary_notes_chapter_{pk}_{chapter_id}'
        cached_chapter = cache.get(chapter_cache_key)
        
        if cached_chapter is None:
            summary_notes = self.get_object()
            
            try:
                chapter = summary_notes.chapters.only(
                    'id', 'title', 'order', 'content', 'summary_notes_id'
                ).get(id=chapter_id, is_active=True)
            except SummaryNotesChapter.DoesNotExist:
                return Response(
                    {'error': 'Chapter not found'},
                    status=status.HTTP_404_NOT_FOUND
                )
            
            # Get chapter navigation info efficiently
            chapter_nav = list(
                summary_notes.chapters.filter(is_active=True)
                .order_by('order')
                .values_list('id', flat=True)
            )
            
            try:
                current_index = chapter_nav.index(chapter.id)
                prev_chapter_id = chapter_nav[current_index - 1] if current_index > 0 else None
                next_chapter_id = chapter_nav[current_index + 1] if current_index < len(chapter_nav) - 1 else None
            except ValueError:
                current_index = 0
                prev_chapter_id = None
                next_chapter_id = None
            
            cached_chapter = {
                'id': chapter.id,
                'title': chapter.title,
                'order': chapter.order,
                'content': chapter.content,
                'previous_chapter_id': prev_chapter_id,
                'next_chapter_id': next_chapter_id,
                'chapter_number': current_index + 1,
                'total_chapters': len(chapter_nav)
            }
            cache.set(chapter_cache_key, cached_chapter, 1800)  # 30 minutes
        
        # Get user's completed chapters from cached progress
        is_completed = False
        if request.user.is_authenticated:
            user_cache_key = f'summary_notes_progress_{request.user.id}'
            user_progress = cache.get(user_cache_key)
            
            # Handle stale cache with wrong format or missing cache
            if user_progress is None or not isinstance(user_progress, dict):
                progress_list = SummaryNotesProgress.objects.filter(
                    user=request.user
                ).values('summary_notes_id', 'completed_chapters', 'current_chapter_id')
                user_progress = {}
                for p in progress_list:
                    user_progress[p['summary_notes_id']] = {
                        'completed': p['completed_chapters'] or [],
                        'current': p['current_chapter_id']
                    }
                cache.set(user_cache_key, user_progress, 120)  # 2 minutes
            
            notes_progress = user_progress.get(int(pk), {})
            if isinstance(notes_progress, dict):
                is_completed = cached_chapter['id'] in notes_progress.get('completed', [])
        
        return Response({
            **cached_chapter,
            'is_completed': is_completed,
        })
    
    @action(detail=True, methods=['post'])
    def progress(self, request, pk=None):
        """Update reading progress."""
        # Use default auth (session + JWT) - no need for special handling
        if not request.user.is_authenticated:
            return Response({'error': 'Authentication required'}, status=status.HTTP_401_UNAUTHORIZED)
        
        summary_notes = self.get_object()
        
        chapter_id = request.data.get('chapter_id')
        mark_completed = request.data.get('mark_completed', False)
        
        # Get or create progress
        progress, created = SummaryNotesProgress.objects.get_or_create(
            user=request.user,
            summary_notes=summary_notes
        )
        
        # Update current chapter
        if chapter_id:
            try:
                chapter = summary_notes.chapters.get(id=chapter_id, is_active=True)
                progress.current_chapter = chapter
                
                # Mark as completed if requested
                if mark_completed:
                    completed = progress.completed_chapters or []
                    if chapter.id not in completed:
                        completed.append(chapter.id)
                        progress.completed_chapters = completed
                
                progress.save()
                
                # Invalidate user's progress cache so next request gets fresh data
                user_cache_key = f'summary_notes_progress_{request.user.id}'
                cache.delete(user_cache_key)
                
            except SummaryNotesChapter.DoesNotExist:
                return Response(
                    {'error': 'Chapter not found'},
                    status=status.HTTP_404_NOT_FOUND
                )
        
        return Response({
            'current_chapter_id': progress.current_chapter.id if progress.current_chapter else None,
            'chapters_completed': progress.chapters_completed,
            'progress_percentage': progress.progress_percentage,
            'completed_chapters': progress.completed_chapters or []
        })
