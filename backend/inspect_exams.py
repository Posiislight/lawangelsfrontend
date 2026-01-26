import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'lawangels.settings')
django.setup()

from quiz.models import Exam

print(f"{'ID':<5} {'Title':<30} {'Category':<10} {'Questions':<10} {'Active':<10}")
print("-" * 70)
for e in Exam.objects.all().order_by('id'):
    print(f"{e.id:<5} {e.title:<30} {e.category:<10} {e.questions.count():<10} {e.is_active}")
