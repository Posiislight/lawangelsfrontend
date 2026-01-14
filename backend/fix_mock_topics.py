
import os
import django
import re
import sys

# Setup Django environment
# Add the project root to python path
current_dir = os.path.dirname(os.path.abspath(__file__))
sys.path.append(current_dir)
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'lawangels.settings')
django.setup()

from quiz.models import Question, Exam
from django.db import transaction

# Normalization rules to consolidate variations
TOPIC_NORMALIZATION = {
    'torts': 'tort',
    'contract': 'contract_law',
    'constitutional': 'constitutional_law',
    'business_law_and_practice': 'business_law',
    'legal_system': 'legal_services',
}

def normalize_topic(topic_raw):
    """Normalize topic name to avoid duplicates"""
    if not topic_raw:
        return 'unknown'
    
    # Clean up: strip, lowercase, replace spaces/dashes with underscores
    topic = topic_raw.strip().lower()
    
    # Remove sub-topic after colon (e.g., "Business Law and Practice: Directors' Duties")
    if ':' in topic:
        topic = topic.split(':')[0].strip()
    
    # Replace spaces and dashes with underscores
    topic = topic.replace(' ', '_').replace('-', '_')
    
    # Apply normalization rules
    if topic in TOPIC_NORMALIZATION:
        topic = TOPIC_NORMALIZATION[topic]
    
    return topic

def fix_mock_topics(mock_title='Mock Test 1', file_path='mockexam/mock1_raw.txt'):
    print(f"\nFixing topics for {mock_title} from {file_path}")
    
    try:
        exam = Exam.objects.get(title=mock_title)
    except Exam.DoesNotExist:
        print(f"Exam '{mock_title}' not found.")
        return

    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            content = f.read()
    except FileNotFoundError:
        print(f"File {file_path} not found.")
        return

    # Parse file to extract (question_number -> topic)
    question_pattern = r'Question\s+(\d+)\s*(?:\(([^)]+)\))?'
    matches = re.finditer(question_pattern, content)
    
    updates = 0
    with transaction.atomic():
        for match in matches:
            q_num = int(match.group(1))
            topic_raw = match.group(2)
            
            if topic_raw:
                topic_slug = normalize_topic(topic_raw)
                
                # Update question
                updated = Question.objects.filter(exam=exam, question_number=q_num).update(topic=topic_slug)
                if updated:
                    updates += 1
                else:
                    print(f"Question Q{q_num} not found in DB")
            else:
                print(f"No topic found for Q{q_num}")

    print(f"Successfully updated {updates} questions for {mock_title}")

if __name__ == '__main__':
    # Fix all mock exams
    fix_mock_topics(mock_title='Mock Test 1', file_path='mockexam/mock1_raw.txt')
    fix_mock_topics(mock_title='Mock Test 2', file_path='mockexam/mock2_raw.txt')
    fix_mock_topics(mock_title='Mock Test 3', file_path='mockexam/mock3_raw.txt')
