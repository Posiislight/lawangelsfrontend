#!/usr/bin/env python
import os
import sys
import django
import requests
import json

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'lawangels.settings')
sys.path.insert(0, r'c:\Users\adele\Desktop\lawangelsfrontend2\backend\lawangels')
django.setup()

from django.contrib.auth.models import User
from quiz.models import ExamAttempt, Exam
from django.contrib.sessions.models import Session
from django.utils import timezone

# Create or get test user
user, _ = User.objects.get_or_create(
    username='testuser',
    defaults={'email': 'test@example.com'}
)

# Get exam
exam = Exam.objects.first()
if not exam:
    print("No exam found!")
    sys.exit(1)

print(f"Using Exam: {exam.title} (ID: {exam.id})")
print(f"Total questions in exam: {exam.questions.count()}")

# Delete old attempts
ExamAttempt.objects.filter(user=user, exam=exam).delete()

# Create new attempt
attempt = ExamAttempt.objects.create(
    user=user,
    exam=exam,
    speed_reader_enabled=False
)

print(f"\nAttempt created: ID {attempt.id}")
print(f"Attempt status: {attempt.status}")

# Manually add questions (simulating what the create view should do)
import random
all_questions = list(exam.questions.values_list('id', flat=True))
num_questions = min(40, len(all_questions))
selected_question_ids = random.sample(all_questions, num_questions)
attempt.selected_questions.set(selected_question_ids)

print(f"Selected {num_questions} questions")
print(f"Selected question IDs: {selected_question_ids[:5]}... (first 5)")

# Now test the API
print("\n" + "="*50)
print("Testing API endpoints")
print("="*50)

# Test 1: Get attempt via API
response = requests.get(
    f'http://localhost:8000/api/exam-attempts/{attempt.id}/',
    headers={'Cookie': f'sessionid={user.username}'},
    auth=('testuser', '')
)
print(f"\n1. GET /api/exam-attempts/{attempt.id}/ - Status: {response.status_code}")
if response.status_code == 200:
    data = response.json()
    print(f"   - Attempt ID: {data.get('id')}")
    print(f"   - Status: {data.get('status')}")
    selected_qs = data.get('selected_questions', [])
    print(f"   - Selected questions count: {len(selected_qs)}")
    print(f"   - First 5 selected: {selected_qs[:5]}")
else:
    print(f"   Error: {response.text}")

# Test 2: Get questions for attempt
response = requests.get(
    f'http://localhost:8000/api/exam-attempts/{attempt.id}/questions/',
    headers={'Cookie': f'sessionid={user.username}'},
    auth=('testuser', '')
)
print(f"\n2. GET /api/exam-attempts/{attempt.id}/questions/ - Status: {response.status_code}")
if response.status_code == 200:
    data = response.json()
    print(f"   - Number of questions returned: {len(data)}")
    if len(data) > 0:
        print(f"   - First question ID: {data[0].get('id')}")
        print(f"   - First question text (first 50 chars): {data[0].get('text', '')[:50]}...")
        print(f"   - First question has options: {len(data[0].get('options', []))} options")
    else:
        print("   - NO QUESTIONS RETURNED!")
else:
    print(f"   Error: {response.text}")

print("\nTest complete!")
