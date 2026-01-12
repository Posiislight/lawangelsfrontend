
import sys
import traceback
import random
from rest_framework.test import APIClient
from django.contrib.auth.models import User
from quiz.practice_question_models import PracticeQuestionTopic, PracticeQuestion

try:
    print("Setting up test user...")
    user, _ = User.objects.get_or_create(username='debuguser')
    client = APIClient()
    client.force_authenticate(user=user)

    # 1. Pick a valid topic
    topic = PracticeQuestionTopic.objects.first()
    if not topic:
        print("No PracticeQuestionTopic found! Cannot test.")
        sys.exit(1)
    
    print(f"Starting quiz for topic: {topic.slug}")
    
    # 2. Check if topic has questions
    q_count = PracticeQuestion.objects.filter(area__topic=topic).count()
    print(f"Topic '{topic.name}' has {q_count} questions.")
    if q_count == 0:
        print("Topic has no questions. Choosing another...")
        found = False
        for t in PracticeQuestionTopic.objects.all():
             c = PracticeQuestion.objects.filter(area__topic=t).count()
             if c > 0:
                 topic = t
                 print(f"Switched to '{topic.name}' with {c} questions.")
                 found = True
                 break
        if not found:
            print("No topics with questions found!")
            sys.exit(1)

    # 3. Create Attempt
    resp = client.post('/api/topic-attempts/', {'topic': topic.slug, 'num_questions': 3})
    if resp.status_code != 201:
        print(f"Create failed: {resp.status_code}")
        print(resp.content.decode())
        sys.exit(1)
    
    attempt_data = resp.json()
    attempt_id = attempt_data['id']
    print(f"Quiz started! Attempt ID: {attempt_id}")

    # 4. Get Current Question
    print(f"Fetching current question for attempt {attempt_id}...")
    resp2 = client.get(f'/api/topic-attempts/{attempt_id}/current-question/')
    
    if resp2.status_code == 200:
        q_data = resp2.json()
        print("Success! Got question.")
        print(f"Question ID: {q_data['question']['id']}")
        print(f"Text: {q_data['question']['text'][:50]}...")
    else:
        print(f"Current Question Failed: {resp2.status_code}")
        print(resp2.content.decode())

except Exception:
    traceback.print_exc()
