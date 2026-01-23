import os
import django
import sys

# Add project root to path
sys.path.append(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'lawangels.settings')
django.setup()

from quiz.models import Exam, Question

try:
    exam = Exam.objects.get(title='Mock 1 FLK 1')
    print(f"Exam found: {exam.title}")
    
    try:
        q83 = Question.objects.get(exam=exam, question_number=83)
        print(f"Question 83 found.")
        print(f"Text: {q83.text[:100]}...")
        print(f"Correct Answer: {q83.correct_answer}")
        print(f"Explanation: {q83.explanation[:100]}...")
        
        # Verify specific content matching user prompt
        prompt_snippet = "Official Secrets Act makes it an offense"
        if prompt_snippet in q83.text:
            print("SUCCESS: Text matches user prompt.")
        else:
            print("WARNING: Text might not match exactly.")
            
    except Question.DoesNotExist:
        print("ERROR: Question 83 does not exist.")
        
except Exam.DoesNotExist:
    print("ERROR: Exam 'Mock 1 FLK 1' not found.")
