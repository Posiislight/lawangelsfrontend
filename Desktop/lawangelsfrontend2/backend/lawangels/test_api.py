import os
import django
import requests
import json

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'lawangels.settings')
django.setup()

from django.contrib.auth.models import User
from quiz.models import Exam

# Create a test user if doesn't exist
user, created = User.objects.get_or_create(
    username='testuser',
    defaults={
        'email': 'test@example.com',
        'first_name': 'Test',
        'last_name': 'User'
    }
)
if created:
    user.set_password('testpass123')
    user.save()
    print(f"✅ Created test user: {user.username}")
else:
    print(f"✓ Test user already exists: {user.username}")

# Check exam exists
exam = Exam.objects.first()
if exam:
    print(f"✓ Exam found: {exam.title} (ID: {exam.id})")
else:
    print("❌ No exams found in database")
    exit(1)

# Test API login
BASE_URL = 'http://localhost:8000/api'

print("\n📝 Testing API endpoints...")

# 1. Get CSRF token by making a GET request
print("\n0️⃣ Fetching CSRF token...")
session = requests.Session()
csrf_response = session.get(f'{BASE_URL}/auth/me/')
csrf_token = session.cookies.get('csrftoken')
print(f"   CSRF Token: {csrf_token[:20] if csrf_token else 'None'}...")

# 1. Login
print("\n1️⃣ Testing login...")
login_response = session.post(
    f'{BASE_URL}/auth/login/',
    json={'username': 'testuser', 'password': 'testpass123'},
    headers={'Content-Type': 'application/json', 'X-CSRFToken': csrf_token or ''}
)
print(f"   Status: {login_response.status_code}")
if login_response.status_code == 200:
    print(f"   ✅ Login successful: {login_response.json()['user']['username']}")
else:
    print(f"   ❌ Login failed: {login_response.text}")
    exit(1)

# Get new CSRF token after login
csrf_token = session.cookies.get('csrftoken')

# 2. Create exam attempt
print("\n2️⃣ Testing exam attempt creation...")
attempt_response = session.post(
    f'{BASE_URL}/exam-attempts/',
    json={'exam_id': exam.id, 'speed_reader_enabled': False},
    headers={'Content-Type': 'application/json', 'X-CSRFToken': csrf_token or ''}
)
print(f"   Status: {attempt_response.status_code}")
if attempt_response.status_code in [200, 201]:
    attempt_data = attempt_response.json()
    print(f"   ✅ Exam attempt created!")
    print(f"   Attempt ID: {attempt_data.get('id')}")
    print(f"   Exam: {attempt_data.get('exam', {}).get('title')}")
else:
    print(f"   ❌ Failed: {attempt_response.text}")

print("\n✅ All tests completed!")
