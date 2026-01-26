import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'lawangels.settings')
django.setup()

from quiz.models import Exam

print(f"Total Exams: {Exam.objects.count()}")
for e in Exam.objects.all():
    print(f"- {e.title} (Questions: {e.questions.count()})")
