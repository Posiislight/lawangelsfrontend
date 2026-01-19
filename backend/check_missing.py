
import os
import django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'lawangels.settings')
django.setup()

from quiz.models import Exam, Question

try:
    e = Exam.objects.get(title='FLK2 Mock Test 1')
    count = Question.objects.filter(exam=e).count()
    print(f'Total Questions: {count}')
    
    existing = set(Question.objects.filter(exam=e).values_list('question_number', flat=True))
    missing = sorted(list(set(range(1, 91)) - existing))
    print(f'Missing: {missing}')
    
    # Check Q7 specifically
    if 7 in existing:
        q7 = Question.objects.get(exam=e, question_number=7)
        print(f"Q7 Answer: {q7.correct_answer}")
        print(f"Q7 Options: {q7.questionoption_set.count()}")
    else:
        print("Q7 is MISSING")

except Exam.DoesNotExist:
    print("Exam not found")
except Exception as e:
    print(f"Error: {e}")
