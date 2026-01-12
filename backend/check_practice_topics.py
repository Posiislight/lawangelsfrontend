
import os
import django
import sys

sys.path.append(os.getcwd())
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'lawangels.settings')
django.setup()

from quiz.practice_question_models import PracticeQuestionTopic, PracticeQuestion

topics = PracticeQuestionTopic.objects.all()
print(f"Found {topics.count()} topics")
for t in topics:
    q_count = PracticeQuestion.objects.filter(area__topic=t).count()
    print(f"Topic: '{t.name}' | Slug: '{t.slug}' | Questions: {q_count}")
