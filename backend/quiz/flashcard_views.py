"""
Flashcard API Views

Provides REST API endpoints for flashcard decks, flashcards, and user progress tracking.
"""

from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.db.models import Count, Q, F
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
    """Serializer for deck list view."""
    total_cards = serializers.IntegerField(source='card_count', read_only=True)
    user_progress = serializers.SerializerMethodField()
    
    class Meta:
        model = FlashcardDeck
        fields = ['id', 'title', 'subject', 'category', 'icon', 'total_cards', 'user_progress']
    
    def get_user_progress(self, obj):
        # Check if progress was prefetched
        if hasattr(obj, '_prefetched_progress') and obj._prefetched_progress:
            return FlashcardProgressSerializer(obj._prefetched_progress).data
        return None


class FlashcardDeckDetailSerializer(serializers.ModelSerializer):
    """Serializer for deck detail view with all cards."""
    cards = FlashcardSerializer(many=True, read_only=True)
    total_cards = serializers.IntegerField(read_only=True)
    user_progress = serializers.SerializerMethodField()
    
    class Meta:
        model = FlashcardDeck
        fields = ['id', 'title', 'subject', 'description', 'category', 'icon', 
                  'total_cards', 'cards', 'user_progress']
    
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
    """ViewSet for flashcard decks."""
    permission_classes = [IsAuthenticated]
    
    def get_serializer_class(self):
        if self.action == 'retrieve':
            return FlashcardDeckDetailSerializer
        return FlashcardDeckListSerializer
    
    def get_queryset(self):
        # Annotate with total cards count (use card_count to avoid conflict with property)
        return FlashcardDeck.objects.filter(is_active=True).annotate(
            card_count=Count('cards', filter=Q(cards__is_active=True))
        ).order_by('category', 'order', 'title')
    
    def list(self, request, *args, **kwargs):
        """List all decks with user progress."""
        queryset = self.get_queryset()
        
        # Batch fetch user progress
        user_progress_map = {}
        if request.user.is_authenticated:
            progress_list = FlashcardProgress.objects.filter(
                user=request.user,
                deck__in=queryset
            )
            user_progress_map = {p.deck_id: p for p in progress_list}
        
        # Attach progress to decks
        decks_list = list(queryset)
        for deck in decks_list:
            deck._prefetched_progress = user_progress_map.get(deck.id)
        
        serializer = self.get_serializer(decks_list, many=True)
        return Response(serializer.data)
    
    @action(detail=True, methods=['post'])
    def update_progress(self, request, pk=None):
        """Update user progress for a deck."""
        deck = self.get_object()
        
        cards_studied = request.data.get('cards_studied', 0)
        correct = request.data.get('correct', False)
        
        # Get or create progress
        progress, created = FlashcardProgress.objects.get_or_create(
            user=request.user,
            deck=deck,
            defaults={'cards_studied': 0, 'correct_answers': 0, 'total_attempts': 0}
        )
        
        # Update progress
        if cards_studied > progress.cards_studied:
            progress.cards_studied = cards_studied
        
        progress.total_attempts += 1
        if correct:
            progress.correct_answers += 1
        
        progress.save()
        
        serializer = FlashcardProgressSerializer(progress)
        return Response(serializer.data)
    
    @action(detail=True, methods=['get'])
    def study(self, request, pk=None):
        """Get cards for study session."""
        deck = self.get_object()
        
        # Get all active cards
        cards = deck.cards.filter(is_active=True).order_by('order')
        
        # Get user progress
        progress = None
        if request.user.is_authenticated:
            progress, _ = FlashcardProgress.objects.get_or_create(
                user=request.user,
                deck=deck,
                defaults={'cards_studied': 0, 'correct_answers': 0, 'total_attempts': 0}
            )
        
        return Response({
            'deck': FlashcardDeckDetailSerializer(deck, context={'request': request}).data,
            'cards': FlashcardSerializer(cards, many=True).data,
            'progress': FlashcardProgressSerializer(progress).data if progress else None
        })
