#!/usr/bin/env python
import os
import sys
import django
import json

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'lawangels.settings')
sys.path.insert(0, r'c:\Users\adele\Desktop\lawangelsfrontend2\backend\lawangels')
django.setup()

from quiz.models import Exam, ExamAttempt
from quiz.serializers import ExamAttemptSerializer
from django.contrib.auth.models import User

# Get or create test user
user, _ = User.objects.get_or_create(username='testuser', defaults={'email': 'test@example.com'})

# Get exam
exam = Exam.objects.first()

# Get the most recent attempt
attempt = ExamAttempt.objects.filter(user=user, exam=exam).order_by('-started_at').first()

if not attempt:
    print("No recent attempt found")
    sys.exit(1)

print(f"Attempt {attempt.id}:")
print(f"  Status: {attempt.status}")
print(f"  Selected questions count: {attempt.selected_questions.count()}")
print(f"  Selected questions IDs: {list(attempt.selected_questions.values_list('id', flat=True)[:5])}...")

# Serialize and check output
serializer = ExamAttemptSerializer(attempt)
data = serializer.data
print(f"\nSerialized data keys: {list(data.keys())}")
print(f"Selected questions in response: {data.get('selected_questions', [])[:5]}...")
