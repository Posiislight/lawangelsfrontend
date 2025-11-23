#!/usr/bin/env python
import os
import sys
import django
import json

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'lawangels.settings')
sys.path.insert(0, r'c:\Users\adele\Desktop\lawangelsfrontend2\backend\lawangels')
django.setup()

from django.contrib.auth.models import User
from quiz.models import ExamAttempt, Exam, Question, QuestionAnswer
from rest_framework.test import APIClient

# Create or get test user
user, _ = User.objects.get_or_create(
    username='testuser',
    defaults={'email': 'test@example.com', 'password': 'testpass123'}
)

# Get exam
exam = Exam.objects.filter(is_active=True).first()
if not exam:
    print("No active exam found!")
    sys.exit(1)

print(f"Using Exam: {exam.title} (ID: {exam.id})")
print(f"Total questions in exam: {exam.questions.count()}")

# Delete old attempts for this user
ExamAttempt.objects.filter(user=user, exam=exam).delete()

# Create new attempt
attempt = ExamAttempt.objects.create(
    user=user,
    exam=exam,
    status='in_progress',
    speed_reader_enabled=False
)

# Add selected questions (first 5 for testing)
questions = exam.questions.all()[:5]
attempt.selected_questions.set(questions)

print(f"\nCreated attempt: {attempt.id}")
print(f"Selected {attempt.selected_questions.count()} questions")

# Add some answers
for i, question in enumerate(questions):
    answer = 'A' if i % 2 == 0 else 'B'
    QuestionAnswer.objects.create(
        exam_attempt=attempt,
        question=question,
        selected_answer=answer,
        time_spent_seconds=30
    )
    print(f"Added answer for Q{question.question_number}: {answer}")

# Complete the attempt
attempt.status = 'completed'
attempt.score = attempt.calculate_score()
attempt.save()

print(f"\nAttempt completed with score: {attempt.score}%")

# Now test the API
client = APIClient()
client.force_authenticate(user=user)

# Test review endpoint
print(f"\n--- Testing Review Endpoint ---")
response = client.get(f'/api/exam-attempts/{attempt.id}/review/')

print(f"Status Code: {response.status_code}")
print(f"Response: {json.dumps(response.json(), indent=2)}")

if response.status_code == 200:
    data = response.json()
    print(f"\nAttempt ID: {data.get('id')}")
    print(f"Score: {data.get('score')}")
    print(f"Status: {data.get('status')}")
    print(f"Exam: {data.get('exam', {}).get('title')}")
    print(f"Answers Count: {len(data.get('answers', []))}")
    
    if data.get('answers'):
        print(f"\nFirst answer:")
        first_answer = data['answers'][0]
        print(f"  Question: {first_answer.get('question', {}).get('text', '')[:50]}...")
        print(f"  Selected: {first_answer.get('selected_answer')}")
        print(f"  Correct: {first_answer.get('is_correct')}")
