import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'lawangels.settings')
django.setup()

from quiz.models import Question

q = Question.objects.first()
print("✅ QUESTION SUCCESSFULLY IMPORTED!")
print(f"\nQuestion #{q.question_number}")
print(f"Difficulty: {q.difficulty.upper()}")
print(f"Correct Answer: {q.correct_answer}")
print(f"\nOptions:")
for opt in q.options.all():
    print(f"  {opt.label}. {opt.text[:60]}...")
print(f"\nExplanation (first 150 chars):")
print(f"  {q.explanation[:150]}...")
