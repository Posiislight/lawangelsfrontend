#!/usr/bin/env python
"""
Test the complete exam flow: create attempt -> submit answers -> end exam -> get review
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
from quiz.models import ExamAttempt, Exam, Question, QuestionAnswer
from rest_framework.test import APIClient

def test_complete_flow():
    """Test complete exam flow"""
    
    # Create or get test user
    user, _ = User.objects.get_or_create(
        username='testuser_complete',
        defaults={'email': 'test@example.com', 'password': 'testpass123'}
    )
    
    # Get exam
    exam = Exam.objects.filter(is_active=True).first()
    if not exam:
        print("ERROR: No active exam found!")
        return False
    
    print(f"✓ Using Exam: {exam.title} (ID: {exam.id})")
    
    # Delete old attempts for this user
    ExamAttempt.objects.filter(user=user, exam=exam).delete()
    
    # Create API client and authenticate
    client = APIClient()
    client.force_authenticate(user=user)
    
    # Step 1: Start exam (POST /exam-attempts/)
    print("\n--- Step 1: Starting Exam ---")
    response = client.post('/api/exam-attempts/', {
        'exam_id': exam.id,
        'speed_reader_enabled': False
    }, format='json')
    
    print(f"Status: {response.status_code}")
    if response.status_code != 201:
        print(f"ERROR: Failed to create attempt")
        print(f"Response: {response.json()}")
        return False
    
    attempt_data = response.json()
    attempt_id = attempt_data.get('id')
    print(f"✓ Attempt created: {attempt_id}")
    
    # Step 2: Submit some answers
    print("\n--- Step 2: Submitting Answers ---")
    
    # Get the attempt to see what questions were selected
    response = client.get(f'/api/exam-attempts/{attempt_id}/questions/')
    if response.status_code != 200:
        print(f"ERROR: Failed to get questions")
        print(f"Response: {response.json()}")
        return False
    
    questions = response.json()
    print(f"✓ Loaded {len(questions)} questions")
    
    # Submit answers for first 3 questions
    for i, question in enumerate(questions[:3]):
        answer = 'A' if i % 2 == 0 else 'B'
        response = client.post(
            f'/api/exam-attempts/{attempt_id}/submit-answer/',
            {
                'question_id': question['id'],
                'selected_answer': answer,
                'time_spent_seconds': 30
            },
            format='json'
        )
        
        if response.status_code not in [200, 201]:
            print(f"ERROR: Failed to submit answer for question {question['id']}")
            print(f"Response: {response.json()}")
            return False
        
        print(f"✓ Submitted answer for Q{question['question_number']}: {answer}")
    
    # Step 3: End exam (PATCH /exam-attempts/{id}/)
    print("\n--- Step 3: Ending Exam ---")
    response = client.patch(
        f'/api/exam-attempts/{attempt_id}/',
        {'status': 'completed'},
        format='json'
    )
    
    print(f"Status: {response.status_code}")
    if response.status_code != 200:
        print(f"ERROR: Failed to end attempt")
        print(f"Response: {response.json()}")
        return False
    
    end_data = response.json()
    print(f"✓ Attempt ended")
    print(f"  Status: {end_data.get('status')}")
    print(f"  Score: {end_data.get('score')}%")
    
    # Step 4: Get review (GET /exam-attempts/{id}/review/)
    print("\n--- Step 4: Getting Review ---")
    response = client.get(f'/api/exam-attempts/{attempt_id}/review/')
    
    print(f"Status: {response.status_code}")
    if response.status_code != 200:
        print(f"ERROR: Failed to get review")
        print(f"Response: {response.json()}")
        return False
    
    review_data = response.json()
    print(f"✓ Review retrieved successfully")
    print(f"  Attempt ID: {review_data.get('id')}")
    print(f"  Status: {review_data.get('status')}")
    print(f"  Score: {review_data.get('score')}%")
    print(f"  Answers: {len(review_data.get('answers', []))}")
    print(f"  Exam: {review_data.get('exam', {}).get('title')}")
    
    return True

if __name__ == '__main__':
    success = test_complete_flow()
    print("\n" + "="*50)
    if success:
        print("✓ All tests passed!")
        sys.exit(0)
    else:
        print("✗ Tests failed!")
        sys.exit(1)
