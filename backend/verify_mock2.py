import os
import django
import sys

# Add project root to path
sys.path.append(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'lawangels.settings')
django.setup()

from quiz.models import Exam, Question

try:
    exam_title = 'Mock Test 2'
    exam = Exam.objects.get(title=exam_title)
    print(f"Exam found: {exam.title}")
    
    missing_questions = [15, 36, 59]
    all_found = True
    
    for q_num in missing_questions:
        try:
            q = Question.objects.get(exam=exam, question_number=q_num)
            print(f"Question {q_num} found.")
            print(f"Text snippet: {q.text[:50]}...")
        except Question.DoesNotExist:
            print(f"ERROR: Question {q_num} does not exist.")
            all_found = False
            
    if all_found:
        print("SUCCESS: All specified questions found.")
    else:
        print("FAILURE: Some questions missing.")
        
except Exam.DoesNotExist:
    print(f"ERROR: Exam '{exam_title}' not found.")
