"""
Flashcard API Views - Optimized for Performance

Provides REST API endpoints for flashcard decks, flashcards, and user progress tracking.
Uses annotated queries and caching for fast responses.
"""

from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.db.models import Count, Q
from django.core.cache import cache
from .flashcard_models import FlashcardDeck, Flashcard, FlashcardProgress
from rest_framework import serializers


# Serializers
class FlashcardSerializer(serializers.ModelSerializer):
    """Serializer for individual flashcards."""
    class Meta:
        model = Flashcard
        fields = ['id', 'question', 'answer', 'hint', 'order']


class FlashcardProgressSerializer(serializers.ModelSerializer):
    """Serializer for flashcard progress."""
    accuracy_percentage = serializers.IntegerField(read_only=True)
    progress_percentage = serializers.IntegerField(read_only=True)
    
    class Meta:
        model = FlashcardProgress
        fields = ['id', 'cards_studied', 'correct_answers', 'total_attempts', 
                  'accuracy_percentage', 'progress_percentage', 'last_studied_at']


class FlashcardDeckListSerializer(serializers.ModelSerializer):
    """Serializer for deck list view - minimal fields for speed."""
    total_cards = serializers.IntegerField(source='card_count', read_only=True)
    user_progress = serializers.SerializerMethodField()
    
    class Meta:
        model = FlashcardDeck
        fields = ['id', 'title', 'subject', 'category', 'icon', 'total_cards', 'user_progress']
    
    def get_user_progress(self, obj):
        if hasattr(obj, '_prefetched_progress') and obj._prefetched_progress:
            return FlashcardProgressSerializer(obj._prefetched_progress).data
        return None


class FlashcardDeckDetailSerializer(serializers.ModelSerializer):
    """Serializer for deck detail view with all cards."""
    cards = FlashcardSerializer(many=True, read_only=True)
    total_cards = serializers.SerializerMethodField()
    user_progress = serializers.SerializerMethodField()
    
    class Meta:
        model = FlashcardDeck
        fields = ['id', 'title', 'subject', 'description', 'category', 'icon', 
                  'total_cards', 'cards', 'user_progress']
    
    def get_total_cards(self, obj):
        return obj.cards.filter(is_active=True).count()
    
    def get_user_progress(self, obj):
        user = self.context['request'].user
        if user.is_authenticated:
            try:
                progress = FlashcardProgress.objects.get(user=user, deck=obj)
                return FlashcardProgressSerializer(progress).data
            except FlashcardProgress.DoesNotExist:
                return None
        return None


class FlashcardDeckViewSet(viewsets.ReadOnlyModelViewSet):
    """ViewSet for flashcard decks - optimized for performance."""
    permission_classes = [IsAuthenticated]
    
    def get_serializer_class(self):
        if self.action == 'retrieve':
            return FlashcardDeckDetailSerializer
        return FlashcardDeckListSerializer
    
    def get_queryset(self):
        """Get queryset with card count annotation - single optimized query."""
        return FlashcardDeck.objects.filter(is_active=True).annotate(
            card_count=Count('cards', filter=Q(cards__is_active=True))
        ).only('id', 'title', 'subject', 'category', 'icon', 'order').order_by('category', 'order', 'title')
    
    def list(self, request, *args, **kwargs):
        """List all decks - optimized with caching."""
        # Try cache first (cache key includes user for progress)
        cache_key = f'flashcard_decks_user_{request.user.id}'
        cached = cache.get(cache_key)
        
        if cached is not None:
            response = Response(cached)
            response['Cache-Control'] = 'private, max-age=300, stale-while-revalidate=60'
            return response
        
        # Get all deck IDs first (fast)
        deck_ids = list(FlashcardDeck.objects.filter(is_active=True).values_list('id', flat=True))
        
        # Single query for all decks with annotation
        queryset = self.get_queryset()
        
        # Single query for user progress
        user_progress_map = {}
        if request.user.is_authenticated:
            progress_list = FlashcardProgress.objects.filter(
                user=request.user,
                deck_id__in=deck_ids
            ).only('deck_id', 'cards_studied', 'correct_answers', 'total_attempts', 'last_studied_at')
            user_progress_map = {p.deck_id: p for p in progress_list}
        
        # Attach progress
        decks_list = list(queryset)
        for deck in decks_list:
            deck._prefetched_progress = user_progress_map.get(deck.id)
        
        serializer = self.get_serializer(decks_list, many=True)
        data = serializer.data
        
        # Cache for 5 minutes (300 seconds)
        cache.set(cache_key, data, 300)
        
        response = Response(data)
        response['Cache-Control'] = 'private, max-age=300, stale-while-revalidate=60'
        return response
    
    @action(detail=False, methods=['get'])
    def topics(self, request):
        """Get grouped topics - highly optimized endpoint."""
        cache_key = 'flashcard_topics'
        cached = cache.get(cache_key)
        
        if cached is not None:
            response = Response(cached)
            response['Cache-Control'] = 'public, max-age=1800, stale-while-revalidate=300'
            return response
        
        # Single aggregation query - count distinct decks per subject
        topics_data = FlashcardDeck.objects.filter(is_active=True).values(
            'subject', 'category', 'icon'
        ).annotate(
            total_decks=Count('id', distinct=True),
            total_cards=Count('cards', filter=Q(cards__is_active=True))
        ).order_by('category', 'subject')
        
        result = list(topics_data)
        
        # Cache for 30 minutes (topics rarely change)
        cache.set(cache_key, result, 1800)
        
        response = Response(result)
        response['Cache-Control'] = 'public, max-age=1800, stale-while-revalidate=300'
        return response
    
    @action(detail=True, methods=['post'])
    def update_progress(self, request, pk=None):
        """Update user progress for a deck."""
        deck = self.get_object()
        
        cards_studied = request.data.get('cards_studied', 0)
        correct = request.data.get('correct', False)
        
        progress, created = FlashcardProgress.objects.get_or_create(
            user=request.user,
            deck=deck,
            defaults={'cards_studied': 0, 'correct_answers': 0, 'total_attempts': 0}
        )
        
        if cards_studied > progress.cards_studied:
            progress.cards_studied = cards_studied
        
        progress.total_attempts += 1
        if correct:
            progress.correct_answers += 1
        
        progress.save()
        
        # Invalidate user caches
        cache.delete(f'flashcard_decks_user_{request.user.id}')
        cache.delete(f'flashcard_progress_{request.user.id}_{pk}')
        
        serializer = FlashcardProgressSerializer(progress)
        return Response(serializer.data)
    
    @action(detail=True, methods=['get'])
    def study(self, request, pk=None):
        """Get cards for study session - optimized with caching."""
        
        # Try to get cached static data (deck and cards)
        static_cache_key = f'flashcard_study_{pk}'
        cached_static = cache.get(static_cache_key)
        
        if cached_static is None:
            deck = FlashcardDeck.objects.filter(id=pk, is_active=True).first()
            
            if not deck:
                return Response({'error': 'Deck not found'}, status=404)
            
            cards = list(deck.cards.filter(is_active=True).order_by('order').values(
                'id', 'question', 'answer', 'hint', 'order'
            ))
            
            cached_static = {
                'deck': {
                    'id': deck.id,
                    'title': deck.title,
                    'subject': deck.subject,
                    'description': deck.description,
                    'category': deck.category,
                    'icon': deck.icon,
                    'total_cards': len(cards),
                },
                'cards': cards,
            }
            cache.set(static_cache_key, cached_static, 1800)  # 30 minutes
        
        # Get user progress (cached for 2 minutes)
        progress_data = None
        if request.user.is_authenticated:
            progress_cache_key = f'flashcard_progress_{request.user.id}_{pk}'
            progress_data = cache.get(progress_cache_key)
            
            if progress_data is None:
                progress, _ = FlashcardProgress.objects.get_or_create(
                    user=request.user,
                    deck_id=pk,
                    defaults={'cards_studied': 0, 'correct_answers': 0, 'total_attempts': 0}
                )
                total_cards = cached_static['deck']['total_cards']
                progress_data = {
                    'id': progress.id,
                    'cards_studied': progress.cards_studied,
                    'correct_answers': progress.correct_answers,
                    'total_attempts': progress.total_attempts,
                    'accuracy_percentage': progress.accuracy_percentage,
                    'progress_percentage': round(progress.cards_studied / total_cards * 100) if total_cards > 0 else 0,
                    'last_studied_at': progress.last_studied_at.isoformat() if progress.last_studied_at else None,
                }
                cache.set(progress_cache_key, progress_data, 120)  # 2 minutes
        
        return Response({
            'deck': {
                **cached_static['deck'],
                'user_progress': progress_data,
            },
            'cards': cached_static['cards'],
            'progress': progress_data,
        })
