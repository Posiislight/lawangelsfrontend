#!/usr/bin/env python
import os
import sys
import django
import requests

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'lawangels.settings')
sys.path.insert(0, r'c:\Users\adele\Desktop\lawangelsfrontend2\backend\lawangels')
django.setup()

from django.contrib.auth.models import User
from quiz.models import ExamAttempt

# Get a user and their latest attempt
user = User.objects.first()
if not user:
    print("No user found")
    sys.exit(1)

attempt = user.exam_attempts.filter(status='in_progress').first()
if not attempt:
    print(f"No in-progress attempts for {user.username}")
    # Create a test attempt
    from quiz.models import Exam
    import random
    exam = Exam.objects.first()
    attempt = ExamAttempt.objects.create(user=user, exam=exam)
    all_questions = list(exam.questions.values_list('id', flat=True))
    num = min(40, len(all_questions))
    attempt.selected_questions.set(random.sample(all_questions, num))
    print(f"Created test attempt {attempt.id}")

print(f"\nAttempt {attempt.id}:")
print(f"  Status: {attempt.status}")
print(f"  Selected Questions: {attempt.selected_questions.count()}")

questions = attempt.selected_questions.all().order_by('id')
print(f"\nFirst 3 questions:")
for q in questions[:3]:
    print(f"  Q{q.id}: {q.text[:50]}...")
