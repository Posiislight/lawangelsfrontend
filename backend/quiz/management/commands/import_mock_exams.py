"""
Django management command to import mock exams from DOCX files.
Creates separate exams for each mock test file in the mockexam directory.
"""
import os
import re
from django.core.management.base import BaseCommand
from django.db import transaction
from quiz.models import Exam, Question, QuestionOption

# Try to import docx library
try:
    from docx import Document
    DOCX_AVAILABLE = True
except ImportError:
    DOCX_AVAILABLE = False


class Command(BaseCommand):
    help = 'Import mock exams from DOCX files in the mockexam directory'

    # Map file names to exam details
    FILE_EXAM_MAP = {
        'MOCK 1 ( NO ANALYSIS).docx': {
            'title': 'Mock Test 1',
            'description': 'Full-length SQE1 mock exam - Practice Test 1',
            'subject': 'mixed',
            'color': 'blue',
        },
        'Mock 2  FLK 1 (NO ANALYSIS) .docx': {
            'title': 'Mock Test 2',
            'description': 'Full-length SQE1 mock exam - Practice Test 2 (FLK1)',
            'subject': 'mixed',
            'color': 'purple',
        },
        'MOCK 3. (No Analysis) docx.docx': {
            'title': 'Mock Test 3',
            'description': 'Full-length SQE1 mock exam - Practice Test 3',
            'subject': 'mixed',
            'color': 'green',
        },
    }

    def add_arguments(self, parser):
        parser.add_argument(
            '--dry-run',
            action='store_true',
            help='Parse files but do not save to database',
        )
        parser.add_argument(
            '--clear',
            action='store_true',
            help='Clear existing mock exams before import',
        )

    def handle(self, *args, **options):
        if not DOCX_AVAILABLE:
            self.stderr.write(self.style.ERROR(
                'python-docx library is required. Install it with: pip install python-docx'
            ))
            return

        dry_run = options['dry_run']
        clear = options['clear']
        
        # Get the mockexam directory path
        base_dir = os.path.dirname(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))
        mockexam_dir = os.path.join(base_dir, 'mockexam')
        
        if not os.path.exists(mockexam_dir):
            self.stderr.write(self.style.ERROR(f'Mockexam directory not found: {mockexam_dir}'))
            return

        self.stdout.write(f'Mockexam directory: {mockexam_dir}')
        
        # Optionally clear existing mock exams
        if clear and not dry_run:
            titles_to_clear = [config['title'] for config in self.FILE_EXAM_MAP.values()]
            with transaction.atomic():
                deleted_count = Exam.objects.filter(title__in=titles_to_clear).delete()[0]
                self.stdout.write(self.style.WARNING(f'Cleared {deleted_count} existing mock exams'))
        
        # Track statistics
        total_exams = 0
        total_questions = 0
        errors = []
        
        # Process each file
        for filename, exam_config in self.FILE_EXAM_MAP.items():
            filepath = os.path.join(mockexam_dir, filename)
            
            if not os.path.exists(filepath):
                self.stdout.write(self.style.WARNING(f'File not found: {filename}'))
                continue
            
            self.stdout.write(f'\nProcessing: {filename}')
            self.stdout.write(f'  Creating exam: {exam_config["title"]}')
            
            try:
                questions = self.parse_docx(filepath)
                self.stdout.write(f'  Found {len(questions)} questions')
                
                if not dry_run:
                    exam_obj, q_count = self.save_exam_with_questions(exam_config, questions)
                    self.stdout.write(self.style.SUCCESS(f'  Created exam with {q_count} questions'))
                    total_exams += 1
                    total_questions += q_count
                else:
                    total_questions += len(questions)
                    total_exams += 1
                
            except Exception as e:
                error_msg = f'Error processing {filename}: {str(e)}'
                errors.append(error_msg)
                self.stderr.write(self.style.ERROR(error_msg))
                import traceback
                traceback.print_exc()
        
        # Summary
        self.stdout.write('\n' + '='*50)
        self.stdout.write(self.style.SUCCESS(f'Total exams created: {total_exams}'))
        self.stdout.write(self.style.SUCCESS(f'Total questions imported: {total_questions}'))
        
        if errors:
            self.stdout.write(self.style.WARNING(f'\n{len(errors)} errors occurred'))

    def parse_docx(self, filepath):
        """Parse a DOCX file and extract questions."""
        doc = Document(filepath)
        questions = []
        current_question = None
        question_text_lines = []
        in_explanation = False
        
        for para in doc.paragraphs:
            text = para.text.strip()
            if not text:
                continue
            
            # Skip headers/titles
            if text.upper().startswith('MOCK') or text.upper().startswith('FLK'):
                continue
            
            # Check for "Question N" pattern
            question_match = re.match(r'^Question\s+(\d+)\s*(?:\([^)]*\))?', text, re.IGNORECASE)
            if question_match:
                # Save previous question if exists
                if current_question:
                    if question_text_lines:
                        current_question['text'] = ' '.join(question_text_lines)
                    if current_question.get('text') and len(current_question.get('options', {})) >= 2:
                        questions.append(current_question)
                
                q_num = int(question_match.group(1))
                current_question = {
                    'number': q_num,
                    'text': '',
                    'options': {},
                    'correct_answer': None,
                    'explanation': '',
                }
                question_text_lines = []
                in_explanation = False
                continue
            
            # Check if paragraph contains options (might have multiple options in one paragraph)
            # Split by option pattern: A. B. C. D. E.
            if current_question and re.search(r'\b[A-E]\.\s', text):
                # Save question text first
                if question_text_lines:
                    current_question['text'] = ' '.join(question_text_lines)
                    question_text_lines = []
                
                # Split the paragraph into individual options
                # Pattern: Split before each "X. " where X is A-E
                option_parts = re.split(r'(?=\b[A-E]\.\s)', text)
                for part in option_parts:
                    part = part.strip()
                    if not part:
                        continue
                    option_match = re.match(r'^([A-E])\.\s*(.+)', part, re.IGNORECASE | re.DOTALL)
                    if option_match:
                        label = option_match.group(1).upper()
                        option_text = option_match.group(2).strip()
                        current_question['options'][label] = option_text
                in_explanation = False
                continue
            
            # Check for correct answer patterns
            answer_patterns = [
                r'(?:The\s+)?correct\s+(?:option|answer)\s+is\s+([A-E])',
                r'([A-E])\s+is\s+(?:the\s+)?correct\s+(?:option|answer)',
                r'^Option\s+([A-E])\s+is\s+correct',
                r'^([A-E])\s+is\s+correct',
                r'Answer[:\s]+([A-E])',
            ]
            answer_found = False
            for pattern in answer_patterns:
                answer_match = re.search(pattern, text, re.IGNORECASE)
                if answer_match and current_question:
                    current_question['correct_answer'] = answer_match.group(1).upper()
                    answer_found = True
                    break
            
            if answer_found:
                continue
            
            # Check for explanation header
            if re.match(r'^Explanation\s*:?\s*$', text, re.IGNORECASE) and current_question:
                in_explanation = True
                continue
            
            # Check for inline explanation
            explanation_match = re.match(r'^Explanation[:\s]+(.+)', text, re.IGNORECASE)
            if explanation_match and current_question:
                current_question['explanation'] = explanation_match.group(1)
                in_explanation = True
                continue
            
            # Check for "Option X is incorrect/correct" explanation lines
            if current_question and re.match(r'^Option\s+[A-E]\s+is\s+(?:in)?correct', text, re.IGNORECASE):
                if current_question['explanation']:
                    current_question['explanation'] += ' ' + text
                else:
                    current_question['explanation'] = text
                in_explanation = True
                continue
            
            # If we're in explanation mode, collect explanation text
            if in_explanation and current_question:
                if current_question['explanation']:
                    current_question['explanation'] += ' ' + text
                else:
                    current_question['explanation'] = text
                continue
            
            # If we have a current question but no options yet, this is question text
            if current_question and not current_question.get('options'):
                question_text_lines.append(text)
        
        # Don't forget the last question
        if current_question:
            if question_text_lines:
                current_question['text'] = ' '.join(question_text_lines)
            if current_question.get('text') and len(current_question.get('options', {})) >= 2:
                questions.append(current_question)
        
        self.stdout.write(f'  Parsed {len(questions)} valid questions')
        return questions

    def save_exam_with_questions(self, exam_config, questions):
        """Create exam and save questions to database."""
        with transaction.atomic():
            # Delete existing exam with same title if exists
            Exam.objects.filter(title=exam_config['title']).delete()
            
            # Create the exam
            exam = Exam.objects.create(
                title=exam_config['title'],
                description=exam_config['description'],
                subject=exam_config['subject'],
                duration_minutes=60,
                speed_reader_seconds=70,
                passing_score_percentage=70,
                is_active=True,
                total_questions=len(questions),
            )
            
            saved_count = 0
            for i, q_data in enumerate(questions):
                # Default correct answer if not found
                if not q_data.get('correct_answer'):
                    q_data['correct_answer'] = 'A'
                
                # Determine topic based on keywords in question text
                topic = self.infer_topic(q_data.get('text', ''))
                
                # Create the question
                question = Question.objects.create(
                    exam=exam,
                    question_number=i + 1,
                    text=q_data['text'][:5000] if q_data.get('text') else "Question text missing",
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
            
            # Update total questions count
            exam.total_questions = saved_count
            exam.save()
            
            return exam, saved_count

    def infer_topic(self, text):
        """Infer the topic based on keywords in the question text."""
        text_lower = text.lower()
        
        topic_keywords = {
            'taxation': ['tax', 'income', 'vat', 'capital gains', 'inheritance tax', 'hmrc'],
            'criminal_law': ['criminal', 'offence', 'defendant', 'prosecution', 'guilty', 'manslaughter', 'murder', 'theft', 'assault'],
            'criminal_practice': ['bail', 'magistrates', 'crown court', 'sentencing', 'plea', 'custody'],
            'land_law': ['land', 'property', 'mortgage', 'lease', 'freehold', 'leasehold', 'easement', 'covenant', 'registration'],
            'solicitors_accounts': ['client account', 'office account', 'sra accounts', 'client money', 'ledger'],
            'professional_ethics': ['solicitor', 'sra', 'professional conduct', 'confidentiality', 'conflict of interest', 'duty'],
            'trusts': ['trust', 'trustee', 'beneficiary', 'settlor', 'fiduciary'],
            'wills': ['will', 'probate', 'intestacy', 'executor', 'administrator', 'legacy', 'bequest'],
        }
        
        for topic, keywords in topic_keywords.items():
            for keyword in keywords:
                if keyword in text_lower:
                    return topic
        
        return 'criminal_law'  # Default topic
