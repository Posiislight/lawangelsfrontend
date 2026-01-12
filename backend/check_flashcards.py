import os
import django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')
django.setup()

from quiz.flashcard_models import FlashcardDeck

crim = FlashcardDeck.objects.filter(subject='Criminal Practice').count()
trusts = FlashcardDeck.objects.filter(subject='Trusts').count()
print(f"Criminal: {crim}")
print(f"Trusts: {trusts}")
