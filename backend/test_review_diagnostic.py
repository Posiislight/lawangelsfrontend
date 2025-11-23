#!/usr/bin/env python
"""
Quick diagnostic to show exactly what the review endpoint returns
"""
import os
import sys
import django
import json

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'lawangels.settings')
sys.path.insert(0, r'c:\Users\adele\Desktop\lawangelsfrontend2\backend\lawangels')
django.setup()

from django.contrib.auth.models import User
from quiz.models import ExamAttempt, Exam
from rest_framework.test import APIClient

# Get most recent attempt
user = User.objects.filter(username='testuser_complete').first()
if not user:
    print("No test user found")
    sys.exit(1)

attempt = ExamAttempt.objects.filter(user=user).order_by('-id').first()
if not attempt:
    print("No attempts found")
    sys.exit(1)

print(f"Using attempt: {attempt.id} (Status: {attempt.status}, Score: {attempt.score}%)")
print(f"Answers: {attempt.answers.count()}")

client = APIClient()
client.force_authenticate(user=user)

response = client.get(f'/api/exam-attempts/{attempt.id}/review/')

if response.status_code == 200:
    data = response.json()
    print(f"\n✓ Review endpoint returns:")
    print(f"  - Keys: {list(data.keys())}")
    print(f"  - ID: {data.get('id')}")
    print(f"  - Status: {data.get('status')}")
    print(f"  - Score: {data.get('score')}")
    print(f"  - Exam keys: {list(data.get('exam', {}).keys()) if data.get('exam') else 'None'}")
    print(f"  - Answers count: {len(data.get('answers', []))}")
    print(f"  - First answer keys: {list(data.get('answers', [{}])[0].keys()) if data.get('answers') else 'None'}")
    
    # Show what the frontend will receive
    print(f"\n✓ Frontend will receive:")
    print(f"  attempt = response")
    print(f"  attemptData.id = {data.get('id')}")
    print(f"  attemptData.exam = {data.get('exam', {}).get('title')}")
    print(f"  attemptData.answers = [...{len(data.get('answers', []))} answers...]")
    print(f"  answers = attemptData.answers || []")
else:
    print(f"✗ Error: {response.status_code}")
    print(response.json())
