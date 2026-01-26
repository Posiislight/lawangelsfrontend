
import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'lawangels.settings')
django.setup()

from quiz.models import Exam

def clear_snapshots():
    exams = Exam.objects.all()
    count = 0
    for exam in exams:
        if exam.questions_snapshot:
            exam.questions_snapshot = None
            exam.save(update_fields=['questions_snapshot'])
            count += 1
    print(f"Cleared snapshots for {count} exams.")

if __name__ == '__main__':
    clear_snapshots()
