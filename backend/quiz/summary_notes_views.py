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
        queryset = self.get_queryset()
        
        # Batch fetch all user progress in ONE query
        user_progress_map = {}
        if request.user.is_authenticated:
            progress_list = SummaryNotesProgress.objects.filter(
                user=request.user,
                summary_notes__in=queryset
            ).select_related('current_chapter')
            
            user_progress_map = {p.summary_notes_id: p for p in progress_list}
        
        # Attach progress to each notes object
        notes_list = list(queryset)
        for notes in notes_list:
            notes._prefetched_progress = user_progress_map.get(notes.id)
        
        serializer = self.get_serializer(notes_list, many=True)
        return Response(serializer.data)
    
    def retrieve(self, request, *args, **kwargs):
        instance = self.get_object()
        
        # Batch fetch chapters (only id, title, order - NO content)
        chapters = list(
            instance.chapters.filter(is_active=True)
            .order_by('order')
            .only('id', 'title', 'order', 'summary_notes_id')
        )
        instance.prefetched_chapters = chapters
        
        # Get user progress
        completed_chapters = []
        current_chapter_id = chapters[0].id if chapters else None
        
        if request.user.is_authenticated:
            progress = SummaryNotesProgress.objects.filter(
                user=request.user,
                summary_notes=instance
            ).select_related('current_chapter').first()
            
            if progress:
                completed_chapters = progress.completed_chapters or []
                if progress.current_chapter:
                    current_chapter_id = progress.current_chapter.id
        
        serializer = self.get_serializer(instance, context={
            'request': request,
            'completed_chapters': completed_chapters,
            'current_chapter_id': current_chapter_id
        })
        return Response(serializer.data)
    
    @action(detail=True, methods=['get'], url_path='chapter/(?P<chapter_id>[^/.]+)')
    def chapter(self, request, pk=None, chapter_id=None):
        """Get specific chapter content."""
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
        
        # Get completed chapters from progress
        completed_chapters = []
        if request.user.is_authenticated:
            progress = SummaryNotesProgress.objects.filter(
                user=request.user,
                summary_notes=summary_notes
            ).values_list('completed_chapters', flat=True).first()
            completed_chapters = progress or []
        
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
        
        return Response({
            'id': chapter.id,
            'title': chapter.title,
            'order': chapter.order,
            'content': chapter.content,
            'is_completed': chapter.id in completed_chapters,
            'previous_chapter_id': prev_chapter_id,
            'next_chapter_id': next_chapter_id,
            'chapter_number': current_index + 1,
            'total_chapters': len(chapter_nav)
        })
    
    @action(detail=True, methods=['post'])
    def progress(self, request, pk=None):
        """Update reading progress."""
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
