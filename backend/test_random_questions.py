#!/usr/bin/env python
import os
import sys
import django

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'lawangels.settings')
sys.path.insert(0, r'c:\Users\adele\Desktop\lawangelsfrontend2\backend\lawangels')
django.setup()

from quiz.models import Exam, Question, ExamAttempt
from django.contrib.auth.models import User
import random

# Get or create test user
user, _ = User.objects.get_or_create(username='testuser', defaults={'email': 'test@example.com'})

# Get exam
exam = Exam.objects.first()
if not exam:
    print("No exam found!")
    sys.exit(1)

# Check how many questions exist
total_questions = exam.questions.count()
print(f"Exam '{exam.title}' has {total_questions} questions")

# Create an attempt
attempt = ExamAttempt.objects.create(
    user=user,
    exam=exam,
    speed_reader_enabled=False
)

# Get all questions and randomly select 40
all_questions = list(Question.objects.filter(exam_id=exam.id).values_list('id', flat=True))
num_questions = min(40, len(all_questions))
selected_question_ids = random.sample(all_questions, num_questions)

# Add selected questions to attempt
attempt.selected_questions.set(selected_question_ids)

print(f"\nAttempt {attempt.id} created")
print(f"Selected {num_questions} questions from {total_questions} total")
print(f"Selected question IDs: {selected_question_ids[:10]}... (showing first 10)")

# Verify
selected = attempt.selected_questions.all()
print(f"\nVerification - Attempt has {selected.count()} selected questions")
