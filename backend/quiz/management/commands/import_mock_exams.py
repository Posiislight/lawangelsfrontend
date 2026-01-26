"""
Django management command to import mock exams from DOCX files.
Creates separate exams for each mock test file in the mockexam directory.
"""
import os
import re
from django.core.management.base import BaseCommand
from django.db import transaction, models
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
        'txt files/mock1_raw.txt': {
            'title': 'Mock Test 1',
            'description': 'Full-length SQE1 mock exam - Practice Test 1 (FLK1)',
            'subject': 'mixed',
            'color': 'blue',
            'category': 'FLK1',
        },
        'txt files/mock2_flk2_raw_fixed.txt': {
            'title': 'Mock 2 FLK 2',
            'description': 'Full-length SQE1 mock exam - Mock 2 FLK 2',
            'subject': 'mixed',
            'color': 'purple',
            'category': 'FLK2',
        },
        'txt files/mock3_raw_fixed.txt': {
            'title': 'Mock Test 3',
            'description': 'Full-length SQE1 mock exam - Practice Test 3 (FLK1)',
            'subject': 'mixed',
            'color': 'green',
            'category': 'FLK1',
        },
        'flk2/MOCK 1 FLK 2 (UPDATED).docx': {
            'title': 'Mock 1 FLK 2',
            'description': 'Full-length SQE1 mock exam - Mock 1 FLK 2',
            'subject': 'mixed',
            'color': 'indigo',
            'category': 'FLK2',
        },
        'txt files/mock2_raw.txt': {
            'title': 'Mock Test 2',
            'description': 'Full-length SQE1 mock exam - Practice Test 2 (FLK1)',
            'subject': 'mixed',
            'color': 'purple',
            'category': 'FLK1',
        },
        'txt files/mock3_flk2_raw_fixed.txt': {
            'title': 'Mock 3 FLK 2',
            'description': 'Full-length SQE1 mock exam - Mock 3 FLK 2',
            'subject': 'mixed',
            'color': 'teal',
            'category': 'FLK2',
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
                if filename.lower().endswith('.docx'):
                    questions = self.parse_docx(filepath)
                else:
                    questions = self.parse_text_file(filepath)
                    
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
                self.stdout.write(f'EXCEPTION CAUGHT: {error_msg}') # Force stdout print
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
                    # Fallback: if no options found, try to extract last 5 lines as options
                    if not current_question.get('options') and len(question_text_lines) >= 6:
                        labels = ['A', 'B', 'C', 'D', 'E']
                        option_lines = question_text_lines[-5:]
                        question_text_lines = question_text_lines[:-5]
                        for i, opt in enumerate(option_lines):
                            current_question['options'][labels[i]] = opt

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
            
            # Check for standalone option line (single option on its own line)
            # Matches A. text, A) text, a. text, a) text
            standalone_option = re.match(r'^([A-Ea-e])[\.\)]\s*(.+)', text, re.IGNORECASE)
            if current_question and standalone_option:
                # If we are already in explanation mode or have a correct answer, treat this as explanation
                if in_explanation or current_question.get('correct_answer'):
                    if current_question['explanation']:
                        current_question['explanation'] += ' ' + text
                    else:
                        current_question['explanation'] = text
                    in_explanation = True
                    continue

                # Save question text first if we haven't collected options yet
                if question_text_lines and not current_question.get('options'):
                    current_question['text'] = ' '.join(question_text_lines)
                    question_text_lines = []
                
                label = standalone_option.group(1).upper()
                option_text = standalone_option.group(2).strip()
                # Clean up double lettering/bullets (e.g. "● A. Text" -> "Text")
                option_text = re.sub(r'^[\s●\-\.]+', '', option_text).strip()
                option_text = re.sub(r'^[A-Ea-e][\.\)]\s*', '', option_text).strip()
                current_question['options'][label] = option_text
                in_explanation = False
                continue

            # Check if paragraph contains options (might have multiple options in one paragraph)
            # Split by option pattern: A. B. C. D. E. or a) b) c) d) e)
            if current_question and re.search(r'\b[A-Ea-e][\.\)]\s', text):
                # Save question text first
                if question_text_lines:
                    current_question['text'] = ' '.join(question_text_lines)
                    question_text_lines = []
                
                # Split the paragraph into individual options
                # Pattern: Split before each "X. " or "x) " where X is A-E
                option_parts = re.split(r'(?=\b[A-Ea-e][\.\)]\s)', text)
                for part in option_parts:
                    part = part.strip()
                    if not part:
                        continue
                    option_match = re.match(r'^([A-Ea-e])[\.\)]\s*(.+)', part, re.IGNORECASE | re.DOTALL)
                    if option_match:
                        label = option_match.group(1).upper()
                        option_text = option_match.group(2).strip()
                        # Clean up double lettering/bullets (e.g. "● A. Text" -> "Text")
                        option_text = re.sub(r'^[\s●\-\.]+', '', option_text).strip()
                        option_text = re.sub(r'^[A-Ea-e][\.\)]\s*', '', option_text).strip()
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
            # Fallback: if no options found, try to extract last 5 lines as options
            if not current_question.get('options') and len(question_text_lines) >= 6:
                labels = ['A', 'B', 'C', 'D', 'E']
                option_lines = question_text_lines[-5:]
                question_text_lines = question_text_lines[:-5]
                for i, opt in enumerate(option_lines):
                    current_question['options'][labels[i]] = opt

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
            self.stdout.write(f'  Deleting existing exam "{exam_config["title"]}"...')
            Exam.objects.filter(title=exam_config['title']).delete()
            
            # Create the exam
            self.stdout.write(f'  Creating new exam object...')
            exam = Exam.objects.create(
                title=exam_config['title'],
                description=exam_config['description'],
                subject=exam_config['subject'],
                category=exam_config.get('category', 'FLK1'),
                duration_minutes=60,
                speed_reader_seconds=70,
                passing_score_percentage=70,
                is_active=True,
                total_questions=len(questions),
            )
            
            saved_count = 0
            self.stdout.write(f'  Saving {len(questions)} questions...')
            for i, q_data in enumerate(questions):
                if i % 10 == 0:
                   self.stdout.write(f'    Saving question {i+1}...')
                # Default correct answer if not found
                if not q_data.get('correct_answer'):
                    q_data['correct_answer'] = 'A'
                
                # Determine topic based on keywords in question text
                topic = self.infer_topic(q_data.get('text', ''))
                
                # Ensure question number is unique for this exam
                q_num = q_data['number']
                if Question.objects.filter(exam=exam, question_number=q_num).exists():
                     # Find next available number
                     max_num = Question.objects.filter(exam=exam).aggregate(models.Max('question_number'))['question_number__max']
                     q_num = (max_num or 0) + 1
                
                # Create the question
                question = Question.objects.create(
                    exam=exam,
                    question_number=q_num,
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

    def parse_text_file(self, filepath):
        """Parse a plain text file with mock exam questions."""
        self.stdout.write(f'Parsing text file: {filepath}')
        questions = []
        current_question = None
        question_text_lines = []
        in_explanation = False
        with open(filepath, 'r', encoding='utf-8', errors='replace') as f:
            lines = f.readlines()
        self.stdout.write(f'Read {len(lines)} lines')

        for line in lines:
            text = line.strip()
            if not text:
                continue
            
            # Skip headers/titles
            if text.upper().startswith('MOCK') or (text.upper().startswith('FLK') and 'QUESTION' not in text.upper()):
                continue
            
            # Check for "Question N" pattern
            question_match = re.match(r'^Question\s+(\d+)\s*(?:\([^)]*\))?', text, re.IGNORECASE)
            if question_match:
                # Save previous question if exists
                if current_question:
                    # Fallback: if no options found, try to extract last 5 lines as options
                    if not current_question.get('options') and len(question_text_lines) >= 6:
                        labels = ['A', 'B', 'C', 'D', 'E']
                        option_lines = question_text_lines[-5:]
                        question_text_lines = question_text_lines[:-5]
                        for i, opt in enumerate(option_lines):
                            current_question['options'][labels[i]] = opt

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
            
            # Check for options: A. B. C. D. E.
            # Matches A. text, A) text, a. text, a) text
            option_match = re.match(r'^([A-Ea-e])[\.\)]\s*(.+)', text, re.IGNORECASE)
            if current_question and option_match:
                # If we are already in explanation mode or have a correct answer, treat this as explanation
                if in_explanation or current_question.get('correct_answer'):
                    if current_question['explanation']:
                        current_question['explanation'] += ' ' + text
                    else:
                        current_question['explanation'] = text
                    in_explanation = True
                    continue

                # Save question text if not yet saved (first option encounter)
                if question_text_lines and not current_question.get('options'):
                    current_question['text'] = ' '.join(question_text_lines)
                    question_text_lines = []
                
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
                r'^Answer[:\s]+([A-E])',
                r'^Correct\s+(?:Answer|Option)[:\s]+([A-E])'
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
             
             # Check for "Option X is incorrect/correct" explanation lines (common in text file)
            if current_question and re.match(r'^Option\s+[A-E]\s+ is\s+(?:in)?correct', text, re.IGNORECASE):
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
             # Fallback: if no options found, try to extract last 5 lines as options
            if not current_question.get('options') and len(question_text_lines) >= 6:
                labels = ['A', 'B', 'C', 'D', 'E']
                option_lines = question_text_lines[-5:]
                question_text_lines = question_text_lines[:-5]
                for i, opt in enumerate(option_lines):
                    current_question['options'][labels[i]] = opt

            if question_text_lines:
                current_question['text'] = ' '.join(question_text_lines)
            if current_question.get('text') and len(current_question.get('options', {})) >= 2:
                questions.append(current_question)
        
        self.stdout.write(f'  Parsed {len(questions)} valid questions from text file')
        return questions
