"""
Flashcard Models

Stores flashcard decks and individual flashcards for spaced repetition learning.
Tracks user progress per deck.
"""

from django.db import models
from django.contrib.auth.models import User


class FlashcardDeck(models.Model):
    """A collection of flashcards for a specific subject."""
    
    CATEGORY_CHOICES = [
        ('FLK1', 'FLK1 - Functioning Legal Knowledge 1'),
        ('FLK2', 'FLK2 - Functioning Legal Knowledge 2'),
        ('BOTH', 'Both FLK1 and FLK2'),
    ]
    
    title = models.CharField(max_length=255)
    subject = models.CharField(max_length=100)
    description = models.TextField(blank=True)
    category = models.CharField(max_length=10, choices=CATEGORY_CHOICES, default='FLK1')
    icon = models.CharField(max_length=10, default='📚')
    order = models.IntegerField(default=0)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ['category', 'order', 'title']
        verbose_name = 'Flashcard Deck'
        verbose_name_plural = 'Flashcard Decks'
    
    def __str__(self):
        return f"{self.title} ({self.category})"
    
    @property
    def total_cards(self):
        return self.cards.filter(is_active=True).count()


class Flashcard(models.Model):
    """Individual flashcard with question and answer."""
    
    deck = models.ForeignKey(
        FlashcardDeck,
        on_delete=models.CASCADE,
        related_name='cards'
    )
    question = models.TextField()
    answer = models.TextField()
    hint = models.TextField(blank=True)
    order = models.IntegerField(default=0)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ['deck', 'order']
        unique_together = ['deck', 'order']
        verbose_name = 'Flashcard'
        verbose_name_plural = 'Flashcards'
    
    def __str__(self):
        return f"{self.deck.title} - Card {self.order}: {self.question[:50]}"


class FlashcardProgress(models.Model):
    """Tracks user progress for a flashcard deck."""
    
    user = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name='flashcard_progress'
    )
    deck = models.ForeignKey(
        FlashcardDeck,
        on_delete=models.CASCADE,
        related_name='user_progress'
    )
    cards_studied = models.IntegerField(default=0)
    correct_answers = models.IntegerField(default=0)
    total_attempts = models.IntegerField(default=0)
    last_studied_at = models.DateTimeField(auto_now=True)
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        unique_together = ['user', 'deck']
        verbose_name = 'Flashcard Progress'
        verbose_name_plural = 'Flashcard Progress'
    
    def __str__(self):
        return f"{self.user.username} - {self.deck.title}"
    
    @property
    def accuracy_percentage(self):
        if self.total_attempts == 0:
            return 0
        return round((self.correct_answers / self.total_attempts) * 100)
    
    @property
    def progress_percentage(self):
        total = self.deck.total_cards
        if total == 0:
            return 0
        return round((self.cards_studied / total) * 100)
