#!/usr/bin/env python
import os
import sys
import django
import json

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'lawangels.settings')
sys.path.insert(0, r'c:\Users\adele\Desktop\lawangelsfrontend2\backend\lawangels')
django.setup()

from quiz.models import Exam, ExamAttempt, Question
from quiz.serializers import ExamAttemptSerializer, QuestionDetailSerializer
from django.contrib.auth.models import User

# Clean up: Delete all attempts
ExamAttempt.objects.all().delete()
print("Deleted all previous attempts")

# Get or create test user
user, _ = User.objects.get_or_create(username='testuser', defaults={'email': 'test@example.com'})

# Get exam
exam = Exam.objects.first()
print(f"\nExam: {exam.title}")
print(f"Total questions in exam: {exam.questions.count()}")

# Create a new attempt
attempt = ExamAttempt.objects.create(
    user=user,
    exam=exam,
    speed_reader_enabled=False
)

# Simulate what the backend does
import random
all_questions = list(Question.objects.filter(exam_id=exam.id).values_list('id', flat=True))
num_questions = min(40, len(all_questions))
selected_question_ids = random.sample(all_questions, num_questions)
attempt.selected_questions.set(selected_question_ids)

print(f"\nAttempt {attempt.id} created")
print(f"Selected {num_questions} questions")

# Test serialization
serializer = ExamAttemptSerializer(attempt)
attempt_data = serializer.data

print(f"\nSerialized attempt:")
print(f"  ID: {attempt_data['id']}")
print(f"  Status: {attempt_data['status']}")
print(f"  Selected questions count: {len(attempt_data.get('selected_questions', []))}")
print(f"  First 5 question IDs: {attempt_data.get('selected_questions', [])[:5]}")

# Now test the questions endpoint
questions = attempt.selected_questions.all().order_by('id')
questions_serializer = QuestionDetailSerializer(questions, many=True)
questions_data = questions_serializer.data

print(f"\nQuestions endpoint response:")
print(f"  Number of questions: {len(questions_data)}")
if questions_data:
    q = questions_data[0]
    print(f"  First question:")
    print(f"    ID: {q['id']}")
    print(f"    Text: {q['text'][:50]}...")
    print(f"    Options: {len(q['options'])}")
    print(f"    Has explanation: {'explanation' in q and bool(q['explanation'])}")
    print(f"    Correct answer: {q.get('correct_answer', 'N/A')}")
