#!/usr/bin/env python
"""Debug script to investigate quiz answer correctness issues"""
import os
import sys

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'lawangels.settings')

import django
django.setup()

from quiz.models import QuestionAnswer, ExamAttempt, Question
from django.db import connection

def debug_latest_attempt():
    print("=== Quiz Debug Script ===")
    
    # Check database
    print("Database:", connection.vendor)
    print("Database name:", connection.settings_dict['NAME'])
    
    # Get total counts
    print("\nTotal exam attempts:", ExamAttempt.objects.count())
    print("Total questions:", Question.objects.count())
    print("Total answers:", QuestionAnswer.objects.count())
    
    # Get sample exam attempt
    attempt = ExamAttempt.objects.first()
    if attempt:
        print("\nSample attempt ID:", attempt.id)
        print("User:", attempt.user.username)
        print("Selected questions:", attempt.selected_questions.count())
        print("Answers:", attempt.answers.count())
        
        # Check answers for this attempt
        for a in attempt.answers.all()[:5]:
            selected = a.selected_answer
            correct = a.question.correct_answer
            print("  Q", a.question.question_number, "sel=", repr(selected), "correct=", repr(correct), "is_correct=", a.is_correct)
    else:
        print("No exam attempts found")

if __name__ == '__main__':
    debug_latest_attempt()

