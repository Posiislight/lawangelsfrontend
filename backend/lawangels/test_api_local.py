import os
import django
import json

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'lawangels.settings')
django.setup()

from django.test import Client
from django.contrib.auth.models import User
from quiz.models import Exam

# Create a test client
client = Client()

# Get first user and exam
user = User.objects.first()
exam = Exam.objects.first()

print(f"\nTesting POST /api/exam-attempts/")
print(f"User: {user.username}")
print(f"Exam: {exam.title} (ID: {exam.id})")
print()

# Test 1: Create attempt without authentication
print("[Test 1] POST without authentication...")
response = client.post(
    '/api/exam-attempts/',
    data=json.dumps({'exam_id': exam.id, 'speed_reader_enabled': False}),
    content_type='application/json'
)
print(f"Status: {response.status_code}")
if response.status_code != 401:
    print(f"Response: {response.content.decode()}")

# Test 2: Create attempt with authentication
print("\n[Test 2] POST with authentication...")
client.force_login(user)
response = client.post(
    '/api/exam-attempts/',
    data=json.dumps({'exam_id': exam.id, 'speed_reader_enabled': False}),
    content_type='application/json'
)
print(f"Status: {response.status_code}")
print(f"Response: {response.content.decode()[:500]}")

if response.status_code == 201 or response.status_code == 200:
    data = response.json()
    print(f"\nSuccess! Created attempt:")
    print(f"  ID: {data.get('id')}")
    print(f"  Status: {data.get('status')}")
    print(f"  Questions: {data.get('total_questions')}")
