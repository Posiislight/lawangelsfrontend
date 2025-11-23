import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'lawangels.settings')
django.setup()

from quiz.models import Question

Question.objects.all().delete()
print("✅ Deleted all questions")
