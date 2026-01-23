import os
import django
import sys

# Add project root to path
sys.path.append(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'lawangels.settings')
django.setup()

from quiz.models import Exam, Question

exams_to_verify = [
    'Mock 2 FLK 2',
    'Mock 3 FLK 2'
]

for exam_title in exams_to_verify:
    try:
        exam = Exam.objects.get(title=exam_title)
        print(f"Exam found: {exam.title}")
        print(f"Total questions: {exam.questions.count()}")
        
        # Verify first and last few questions exist
        first_q = exam.questions.order_by('question_number').first()
        last_q = exam.questions.order_by('question_number').last()
        
        if first_q:
            print(f"  First question ({first_q.question_number}): {first_q.text[:30]}...")
        if last_q:
            print(f"  Last question ({last_q.question_number}): {last_q.text[:30]}...")
            
        # Specific check for Mock 2 FLK 2
        if exam_title == 'Mock 2 FLK 2':
            try:
                q35 = exam.questions.get(question_number=35)
                print(f"  Question 35 found: {q35.text[:30]}...")
            except Question.DoesNotExist:
                print("  ERROR: Question 35 NOT found.")
                
            try:
                q80 = exam.questions.get(question_number=80)
                print(f"  Question 80 found: {q80.text[:30]}...")
            except Question.DoesNotExist:
                print("  ERROR: Question 80 NOT found.")

        # Specific check for Mock 3 FLK 2
        if exam_title == 'Mock 3 FLK 2':
            try:
                q43 = exam.questions.get(question_number=43)
                print(f"  Question 43 found: {q43.text[:30]}...")
            except Question.DoesNotExist:
                print("  ERROR: Question 43 NOT found.")
                
            try:
                q44 = exam.questions.get(question_number=44)
                print(f"  Question 44 found: {q44.text[:30]}...")
            except Question.DoesNotExist:
                print("  ERROR: Question 44 NOT found.")
            
    except Exam.DoesNotExist:
        print(f"ERROR: Exam '{exam_title}' not found.")
