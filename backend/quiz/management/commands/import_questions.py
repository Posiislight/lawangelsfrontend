"""
Django management command to import questions from DOCX files.
Clears existing questions and imports from the questionbank directory.
"""
import os
import re
from django.core.management.base import BaseCommand
from django.db import transaction
from quiz.models import Exam, Question, QuestionOption, ExamAttempt, QuestionAnswer

# Try to import docx library
try:
    from docx import Document
    DOCX_AVAILABLE = True
except ImportError:
    DOCX_AVAILABLE = False


class Command(BaseCommand):
    help = 'Import questions from DOCX files in the questionbank directory'

    # Map file names to topic keys
    FILE_TOPIC_MAP = {
        '2 TAXATION ON FLK 2.docx': 'taxation',
        'CRIMINAL LAW MOCK QUESTIONS CHAPTERS 1-9.docx': 'criminal_law',
        'CRIMINAL PRACTICE MOCK QUESTIONS CHAPTERS 1-9.docx': 'criminal_practice',
        'LAND LAW MOCK QUESTIONS CHAPTERS 1-7.docx': 'land_law',
        'MOCK QUESTIONS ON SOLICITORS ACCOUNTS (1) (1).docx': 'solicitors_accounts',
        'MOCK QUESTIONS ON SOLICITORS ACCOUNTS (1).docx': 'solicitors_accounts',  # Duplicate, skip
        'PROFESSIONAL ETHICS FLK2 MOCK QUESTIONS CHAPTERS 1-9.docx': 'professional_ethics',
        'TRUSTS MOCK QUESTIONS CHAPTERS 1-8.docx': 'trusts',
        'WILLS MOCK QUESTIONS- Chapters 1-10.docx': 'wills',
    }

    def add_arguments(self, parser):
        parser.add_argument(
            '--dry-run',
            action='store_true',
            help='Parse files but do not save to database',
        )
        parser.add_argument(
            '--keep-existing',
            action='store_true',
            help='Do not clear existing questions before import',
        )

    def handle(self, *args, **options):
        if not DOCX_AVAILABLE:
            self.stderr.write(self.style.ERROR(
                'python-docx library is required. Install it with: pip install python-docx'
            ))
            return

        dry_run = options['dry_run']
        keep_existing = options['keep_existing']
        
        # Get the questionbank directory path
        base_dir = os.path.dirname(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))
        questionbank_dir = os.path.join(base_dir, 'questionbank')
        
        if not os.path.exists(questionbank_dir):
            self.stderr.write(self.style.ERROR(f'Questionbank directory not found: {questionbank_dir}'))
            return

        self.stdout.write(f'Questionbank directory: {questionbank_dir}')
        
        # Get or create the SQE1 Mock Exam
        exam, created = Exam.objects.get_or_create(
            title='SQE1 Mock Exam',
            defaults={
                'description': 'Full SQE1 Mock Examination covering all topics',
                'subject': 'mixed',
                'duration_minutes': 150,
                'speed_reader_seconds': 60,
                'passing_score_percentage': 70,
                'is_active': True,
            }
        )
        
        if created:
            self.stdout.write(self.style.SUCCESS(f'Created exam: {exam.title}'))
        else:
            self.stdout.write(f'Using existing exam: {exam.title}')
        
        # Clear existing data if not keeping
        if not keep_existing and not dry_run:
            with transaction.atomic():
                # Clear exam attempts first (foreign key constraints)
                attempts_deleted = ExamAttempt.objects.filter(exam=exam).count()
                ExamAttempt.objects.filter(exam=exam).delete()
                
                # Clear questions (options will be cascade deleted)
                questions_deleted = Question.objects.filter(exam=exam).count()
                Question.objects.filter(exam=exam).delete()
                
                self.stdout.write(self.style.WARNING(
                    f'Cleared {questions_deleted} questions and {attempts_deleted} attempts'
                ))
        
        # Track statistics
        total_questions = 0
        topic_counts = {}
        errors = []
        
        # Process each file
        files_to_process = [f for f in os.listdir(questionbank_dir) if f.endswith('.docx')]
        
        # Skip duplicate solicitors accounts file
        files_to_process = [f for f in files_to_process if f != 'MOCK QUESTIONS ON SOLICITORS ACCOUNTS (1).docx']
        
        for filename in files_to_process:
            topic = self.FILE_TOPIC_MAP.get(filename)
            if not topic:
                self.stdout.write(self.style.WARNING(f'No topic mapping for: {filename}'))
                continue
            
            filepath = os.path.join(questionbank_dir, filename)
            self.stdout.write(f'\nProcessing: {filename} (topic: {topic})')
            
            try:
                questions = self.parse_docx(filepath)
                self.stdout.write(f'  Found {len(questions)} questions')
                
                if not dry_run:
                    saved = self.save_questions(exam, questions, topic, total_questions + 1)
                    self.stdout.write(self.style.SUCCESS(f'  Saved {saved} questions'))
                    total_questions += saved
                else:
                    total_questions += len(questions)
                
                topic_counts[topic] = topic_counts.get(topic, 0) + len(questions)
                
            except Exception as e:
                error_msg = f'Error processing {filename}: {str(e)}'
                errors.append(error_msg)
                self.stderr.write(self.style.ERROR(error_msg))
        
        # Update exam total questions
        if not dry_run:
            exam.total_questions = Question.objects.filter(exam=exam).count()
            exam.save()
        
        # Summary
        self.stdout.write('\n' + '='*50)
        self.stdout.write(self.style.SUCCESS(f'Total questions imported: {total_questions}'))
        self.stdout.write('\nQuestions by topic:')
        for topic, count in sorted(topic_counts.items()):
            self.stdout.write(f'  {topic}: {count}')
        
        if errors:
            self.stdout.write(self.style.WARNING(f'\n{len(errors)} errors occurred'))

    def parse_docx(self, filepath):
        """Parse a DOCX file and extract questions."""
        doc = Document(filepath)
        questions = []
        current_question = None
        collecting_question_text = False
        
        for para in doc.paragraphs:
            text = para.text.strip()
            if not text:
                continue
            
            # Skip chapter headers
            if text.upper().startswith('CHAPTER'):
                continue
            
            # Check for "QUESTION N" format (with optional topic in parentheses)
            question_match = re.match(r'^QUESTION\s*(\d+)\s*(?:\([^)]*\))?\s*[-:]?\s*(.*)', text, re.IGNORECASE)
            if question_match:
                # Save previous question if exists
                if current_question and current_question.get('text'):
                    if len(current_question.get('options', {})) >= 2:
                        questions.append(current_question)
                
                q_text = question_match.group(2).strip() if question_match.group(2) else ''
                current_question = {
                    'number': int(question_match.group(1)),
                    'text': q_text,
                    'options': {},
                    'correct_answer': None,
                    'explanation': '',
                }
                collecting_question_text = not q_text  # Collect next para if no text found
                continue
            
            # Also check for "Q.N" or "N." format
            alt_question_match = re.match(r'^(?:Q\.?\s*)?(\d+)[\.\)]\s*(.+)', text)
            if alt_question_match and not current_question:
                current_question = {
                    'number': int(alt_question_match.group(1)),
                    'text': alt_question_match.group(2),
                    'options': {},
                    'correct_answer': None,
                    'explanation': '',
                }
                continue
            
            # If we're collecting question text (question header had no text)
            if collecting_question_text and current_question:
                # Check if this looks like an option
                if not re.match(r'^[A-E][\.\)]', text, re.IGNORECASE):
                    current_question['text'] = text
                    collecting_question_text = False
                    continue
            
            # Check if this is an option (A., B., A), etc.)
            option_match = re.match(r'^([A-E])[\.\)]\s*(.+)', text, re.IGNORECASE)
            if option_match and current_question:
                label = option_match.group(1).upper()
                option_text = option_match.group(2)
                current_question['options'][label] = option_text
                continue
            
            # Check for correct answer indicator (various formats)
            answer_patterns = [
                r'(?:correct\s*answer|answer\s*is)[:\s]*([A-E])',
                r'(?:the\s*answer\s*is)[:\s]*([A-E])',
                r'^([A-E])\s*is\s*(?:the\s*)?correct',
                r'^\*\*?([A-E])\*?\*?$',  # Just the letter, possibly bold
            ]
            answer_match = None
            for pattern in answer_patterns:
                answer_match = re.search(pattern, text, re.IGNORECASE)
                if answer_match and current_question:
                    current_question['correct_answer'] = answer_match.group(1).upper()
                    break
            if answer_match and current_question and current_question.get('correct_answer'):
                continue
            
            # Check for explanation
            explanation_match = re.match(r'(?:explanation|rationale|reason)[:\s]*(.+)', text, re.IGNORECASE)
            if explanation_match and current_question:
                current_question['explanation'] = explanation_match.group(1)
                continue
            
            # If we're in a question and have correct answer, collect explanation text
            if current_question and current_question.get('correct_answer'):
                if current_question['explanation']:
                    current_question['explanation'] += ' ' + text
                else:
                    current_question['explanation'] = text
            # If we're in a question but don't have options yet, this might be continuation of question
            elif current_question and not current_question.get('options') and not collecting_question_text:
                if current_question['text']:
                    current_question['text'] += ' ' + text
                else:
                    current_question['text'] = text
        
        # Don't forget the last question
        if current_question and current_question.get('text') and len(current_question.get('options', {})) >= 2:
            questions.append(current_question)
        
        return questions

    def save_questions(self, exam, questions, topic, start_number):
        """Save parsed questions to the database."""
        saved_count = 0
        batch_size = 10
        total = len(questions)
        
        # Process in batches to avoid huge transactions
        for batch_start in range(0, total, batch_size):
            batch_questions = questions[batch_start:batch_start+batch_size]
            
            try:
                with transaction.atomic():
                    for i, q_data in enumerate(batch_questions):
                        # Skip if no correct answer (we can't use the question)
                        if not q_data.get('correct_answer'):
                            # Try to infer correct answer (first option marked or default to A)
                            q_data['correct_answer'] = 'A'
                        
                        # Create the question
                        question = Question.objects.create(
                            exam=exam,
                            question_number=start_number + saved_count,
                            text=q_data['text'][:5000] if q_data['text'] else "Question text missing", # Safety truncate
                            explanation=q_data.get('explanation', 'No explanation provided.')[:5000],
                            difficulty='medium',
                            topic=topic,
                            correct_answer=q_data['correct_answer'],
                        )
                        
                        # Create options
                        for label, option_text in q_data.get('options', {}).items():
                            QuestionOption.objects.create(
                                question=question,
                                label=label,
                                text=option_text[:1000] if option_text else "",
                            )
                        
                        saved_count += 1
                
                # Feedback every 50 questions
                if saved_count % 50 == 0:
                    self.stdout.write(f'    Progress: {saved_count}/{total}')
                    
            except Exception as e:
                self.stderr.write(self.style.ERROR(f'    Error saving batch starting at {batch_start}: {str(e)}'))
        
        return saved_count
