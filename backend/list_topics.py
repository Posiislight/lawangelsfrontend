
import os
import django
from collections import Counter

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'lawangels.settings')
django.setup()

from quiz.models import Question, Exam

def list_topics():
    # Filter for FLK1 exams or all
    topics = Question.objects.values_list('topic', flat=True)
    counts = Counter(topics)
    print("Distinct Topics found in DB:")
    for topic, count in counts.most_common():
        print(f"  '{topic}': {count}")

if __name__ == '__main__':
    list_topics()
