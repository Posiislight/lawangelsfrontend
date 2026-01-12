import os
import django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')
django.setup()

from quiz.flashcard_models import FlashcardDeck

# Check stats
total_decks = FlashcardDeck.objects.count()
flk1_decks = FlashcardDeck.objects.filter(category='FLK1').count()
flk2_decks = FlashcardDeck.objects.filter(category='FLK2').count()
business_decks = FlashcardDeck.objects.filter(subject='Business Law').count()

print(f"Total Decks: {total_decks}")
print(f"FLK1 Decks: {flk1_decks}")
print(f"FLK2 Decks: {flk2_decks}")
print(f"Business Law Decks: {business_decks}")
