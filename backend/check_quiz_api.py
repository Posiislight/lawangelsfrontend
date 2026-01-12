
import os
import django
import sys
from rest_framework.test import APIClient
from django.contrib.auth.models import User

sys.path.append(os.getcwd())
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'lawangels.settings')
django.setup()

# Ensure we have a user
user, created = User.objects.get_or_create(username='testuser')
client = APIClient()
client.force_authenticate(user=user)

print("Checking /api/topics/...")
response = client.get('/api/topics/')
print(f"Status Code: {response.status_code}")
if response.status_code == 200:
    data = response.json()
    print(f"Got {len(data)} topics")
    for item in data[:3]: # Print first 3
        print(f" - {item['topic']} ({item['question_count']} Qs)")
else:
    print(response.content)

# Try to verify PracticeQuestionTopic integration
from quiz.practice_question_models import PracticeQuestionTopic
topics = PracticeQuestionTopic.objects.all()
if topics.exists():
    t = topics.first()
    print(f"Attempting to start quiz for topic: {t.slug}")
    resp2 = client.post('/api/topic-attempts/', {'topic': t.slug, 'num_questions': 5})
    print(f"Start Quiz Status: {resp2.status_code}")
    if resp2.status_code == 201:
        print("Quiz started successfully!")
    else:
        print(resp2.content)
