"""
Django management command to import Mock Exams from raw text files.
Supports Mock Test 1, 2, and 3.
"""
import re
import os
from django.core.management.base import BaseCommand
from django.db import transaction
from quiz.models import Exam, Question, QuestionOption


class Command(BaseCommand):
    help = 'Import Mock Exams from raw text files'

    # Configuration for each mock test
    MOCK_TESTS = {
        1: {
            'title': 'Mock Test 1',
            'description': 'Full-length SQE1 mock exam - Practice Test 1 (90 questions)',
            'file': 'mockexam/mock1_raw.txt',
            'category': 'FLK1',
        },
        2: {
            'title': 'Mock Test 2',
            'description': 'Full-length SQE1 mock exam - Practice Test 2 (FLK1)',
            'file': 'mockexam/mock2_raw.txt',
            'category': 'FLK1',
        },
        3: {
            'title': 'Mock Test 3',
            'description': 'Full-length SQE1 mock exam - Practice Test 3',
            'file': 'mockexam/mock3_raw.txt',
            'category': 'FLK1',
        },
        4: {
            'title': 'Mock Test 1',
            'description': 'Full-length SQE1 FLK2 mock exam - Practice Test 1 (90 questions)',
            'file': 'mockexam/mock exam 1 flk2.txt',
            'category': 'FLK2',
        },
    }

    def add_arguments(self, parser):
        parser.add_argument(
            'mock_number',
            type=int,
            choices=[1, 2, 3, 4],
            help='Mock test number to import (1, 2, 3, or 4 for FLK2)',
        )
        parser.add_argument(
            '--clear',
            action='store_true',
            help='Clear existing mock test before import',
        )
        parser.add_argument(
            '--file',
            type=str,
            help='Override the default file path',
        )

    def handle(self, *args, **options):
        mock_number = options['mock_number']
        clear = options['clear']
        
        if mock_number not in self.MOCK_TESTS:
            self.stderr.write(self.style.ERROR(f'Invalid mock number: {mock_number}'))
            return
        
        mock_config = self.MOCK_TESTS[mock_number]
        file_path = options.get('file') or mock_config['file']
        
        # Check if file exists
        if not os.path.exists(file_path):
            self.stderr.write(self.style.ERROR(
                f"File not found: {file_path}\n"
                f"Please create the file with the raw text content of Mock Test {mock_number}."
            ))
            return
        
        # Clear existing exam if requested
        if clear:
            with transaction.atomic():
                deleted_count = Exam.objects.filter(title=mock_config['title']).delete()[0]
                self.stdout.write(self.style.WARNING(
                    f"Cleared existing {mock_config['title']} ({deleted_count} objects)"
                ))
        
        # Parse questions from file
        try:
            questions_data = self.parse_text_file(file_path)
            self.stdout.write(f'Parsed {len(questions_data)} questions from file')
            
            # Import the questions
            with transaction.atomic():
                exam, count = self.import_questions(questions_data, mock_config)
                self.stdout.write(self.style.SUCCESS(
                    f"Successfully imported {mock_config['title']} with {count} questions"
                ))
        except Exception as e:
            self.stderr.write(self.style.ERROR(f"Error importing {mock_config['title']}: {str(e)}"))
            import traceback
            traceback.print_exc()

    def parse_text_file(self, file_path):
        """Parse the raw text file and extract all questions"""
        with open(file_path, 'r', encoding='utf-8') as f:
            content = f.read()
        
        questions = []
        
        # Split by "Question N" pattern - also handle common typos like "Questio" (missing 'n')
        question_pattern = r'Questio[n]?\s+(\d+)'
        parts = re.split(question_pattern, content)
        
        # Skip the first part (before first question)
        for i in range(1, len(parts), 2):
            if i + 1 >= len(parts):
                break
                
            q_num = int(parts[i])
            q_content = parts[i + 1].strip()
            
            # Parse this question
            q_data = self.parse_question(q_num, q_content)
            if q_data:
                questions.append(q_data)
        
        return questions

    def parse_question(self, q_num, content):
        """Parse a single question's content"""
        question_data = {
            'number': q_num,
            'text': '',
            'options': {},
            'correct_answer': None,
            'explanation': '',
            'topic': 'criminal_law',  # default
        }
        
        lines = content.split('\n')
        current_section = 'question'  # question, options, answer, explanation
        question_lines = []
        explanation_lines = []
        expecting_answer_letter = False  # For multi-line answer format "Answer:\nB."
        
        for line in lines:
            line = line.strip()
            if not line:
                continue
            
            # Check if previous line was just "Answer:" and this line starts with a letter
            if expecting_answer_letter and not question_data['correct_answer']:
                letter_match = re.match(r'^([A-E])(?:[\.\)\:\s]|$)', line)
                if letter_match:
                    question_data['correct_answer'] = letter_match.group(1).upper()
                    current_section = 'answer'
                    expecting_answer_letter = False
                    continue
                expecting_answer_letter = False
            
            # Check for next question (stop parsing)
            if re.match(r'^Question\s+\d+', line):
                break
            
            # IMPORTANT: Check for correct answer BEFORE option lines
            answer_match = None
            
            # Format 1: "The correct option is X" or "correct option is X"
            if not answer_match:
                answer_match = re.search(r'(?:The\s+)?correct\s+(?:option|answer)\s+is\s+([A-E])', line, re.IGNORECASE)
            
            # Format 2: "Correct Option: X" or "The Correct Option: X"
            if not answer_match:
                answer_match = re.search(r'(?:The\s+)?Correct\s+(?:option|answer)\s*:\s*([A-E])', line, re.IGNORECASE)
            
            # Format 3: "X is the correct option" or "X is correct"
            if not answer_match:
                answer_match = re.search(r'^([A-E])\s+is\s+(?:the\s+)?correct', line, re.IGNORECASE)
            
            # Format 4: "Option X is correct" or "Option X is the correct"
            if not answer_match:
                answer_match = re.search(r'Option\s+([A-E])\s+is\s+(?:the\s+)?correct', line, re.IGNORECASE)
            
            # Format 5: Just "X is correct option" at start of line
            if not answer_match:
                answer_match = re.search(r'^([A-E])\s+is\s+correct\s+option', line, re.IGNORECASE)
            
            # Format 6: "Correct Answer X." or "Correct Answer X" (with optional period)
            if not answer_match:
                answer_match = re.search(r'Correct\s+Answer\s*:?\s*([A-E])\.?', line, re.IGNORECASE)
            
            # Format 7: "Answer: X" or "Answer X"
            if not answer_match:
                answer_match = re.search(r'^Answer\s*:?\s*([A-E])', line, re.IGNORECASE)
            
            # Format 8: "Answer is X" 
            if not answer_match:
                answer_match = re.search(r'^Answer\s+is\s+([A-E])', line, re.IGNORECASE)
            
            if answer_match:
                # Only set correct_answer if not already set (first match wins)
                if not question_data['correct_answer']:
                    question_data['correct_answer'] = answer_match.group(1).upper()
                    if current_section != 'explanation':
                        current_section = 'answer'
                    continue

            # Check for "Answer:" alone on a line (answer letter on next line)
            if re.match(r'^(?:Correct\s+)?Answer\s*:?\s*$', line, re.IGNORECASE) and not question_data['correct_answer']:
                expecting_answer_letter = True
                current_section = 'answer'
                continue
            
            # Skip "Options:" header line
            if re.match(r'^Options\s*:?\s*$', line, re.IGNORECASE):
                current_section = 'options'
                continue
            
            # Check for option lines
            # First try with standard formats: letter followed by dot/paren
            option_match = re.match(r'^[\u2022\uf0b7\u2023\u25e6\u25aa\u25ab\u2219\u25cf\-\*]*\s*([A-Ea-e])[\.\)]\s*(.+)', line)
            
            # If no match, try letter followed by space and text (no period/paren) - handles "A No liability"
            if not option_match:
                option_match = re.match(r'^([A-E])\s+([A-Z].+)', line)
            
            # Special case for Q84 logic (from debug script): relaxed regex if in options section
            if not option_match and current_section == 'options':
                option_match = re.match(r'^.*?([A-E])[\.\)\:\s]\s+(.+)', line)

            if option_match and current_section in ['question', 'options']:
                current_section = 'options'
                label = option_match.group(1).upper()
                text = option_match.group(2).strip()
                question_data['options'][label] = text
                continue
            
            # Check for all options on a single line (e.g., "A. text. B. text. C. text. D. text. E. text.")
            if current_section in ['question', 'options']:
                # Split on '. [B-E]. ' pattern
                if re.match(r'^A[\.\)]', line.strip()):
                    parts = re.split(r'\. ([B-E])[\.\)] ', line)
                    if len(parts) >= 2:  # Found at least A and B
                        current_section = 'options'
                        first_match = re.match(r'^A[\.\)]\s*(.+)', parts[0])
                        if first_match:
                            question_data['options']['A'] = first_match.group(1).strip().rstrip('.')
                        for i in range(1, len(parts) - 1, 2):
                            if i + 1 < len(parts):
                                label = parts[i].upper()
                                text = parts[i + 1].strip().rstrip('.')
                                question_data['options'][label] = text
                        if len(parts) % 2 == 0 and len(parts) >= 2:
                            last_text = parts[-1].strip().rstrip('.')
                            if last_text and len(question_data['options']) > 0:
                                last_label = list(question_data['options'].keys())[-1]
                                question_data['options'][last_label] = question_data['options'][last_label] + ' ' + last_text
                        continue
            
            # Check for explanation header
            if re.match(r'^Explanation\s*:?\s*$', line, re.IGNORECASE):
                current_section = 'explanation'
                continue
            
            # Check for inline explanation
            expl_match = re.match(r'^Explanation\s*:?\s+(.+)', line, re.IGNORECASE)
            if expl_match:
                current_section = 'explanation'
                explanation_lines.append(expl_match.group(1))
                continue
            
            # Collect content based on current section
            if current_section == 'question':
                question_lines.append(line)
            elif current_section == 'explanation':
                explanation_lines.append(line)
            elif current_section == 'options':
                # Continuation of previous option
                if question_data['options']:
                    last_key = list(question_data['options'].keys())[-1]
                    question_data['options'][last_key] += ' ' + line
        
        # Assemble final text
        question_data['text'] = ' '.join(question_lines).strip()
        question_data['explanation'] = ' '.join(explanation_lines).strip()
        
        # Infer topic from question text
        question_data['topic'] = self.infer_topic(question_data['text'])
        
        # Validate question has minimum required data
        if not question_data['text'] or len(question_data['options']) < 2:
            self.stdout.write(self.style.WARNING(
                f"Question {q_num} incomplete: text={bool(question_data['text'])}, "
                f"options={len(question_data['options'])} ({list(question_data['options'].keys())}), "
                f"answer={question_data['correct_answer']}"
            ))
            return None
        
        # Set default correct answer if missing
        if not question_data['correct_answer']:
            question_data['correct_answer'] = 'A'
            self.stdout.write(self.style.WARNING(f'Question {q_num}: No correct answer found, defaulting to A'))
        
        return question_data

    def infer_topic(self, text):
        """Infer topic from question text"""
        text_lower = text.lower()
        
        if any(word in text_lower for word in ['tax', 'vat', 'income tax', 'capital gains']):
            return 'taxation'
        elif any(word in text_lower for word in ['criminal', 'theft', 'assault', 'murder', 'robbery']):
            return 'criminal_law'
        elif any(word in text_lower for word in ['land', 'property', 'lease', 'freehold', 'easement']):
            return 'land_law'
        elif any(word in text_lower for word in ['solicitor', 'account', 'client money', 'sra']):
            return 'solicitors_accounts'
        elif any(word in text_lower for word in ['professional', 'ethics', 'conduct', 'conflict']):
            return 'professional_ethics'
        elif any(word in text_lower for word in ['trust', 'trustee', 'beneficiary']):
            return 'trusts'
        elif any(word in text_lower for word in ['will', 'testament', 'probate', 'intestacy']):
            return 'wills'
        else:
            return 'criminal_law'  # default

    def import_questions(self, questions_data, mock_config):
        """Create exam and import all questions"""
        # Delete existing exam if it exists
        Exam.objects.filter(title=mock_config['title']).delete()
        
        # Create the exam
        exam = Exam.objects.create(
            title=mock_config['title'],
            description=mock_config['description'],
            subject='mixed',
            category=mock_config.get('category', 'FLK1'),
            duration_minutes=153,  # 2 hours 33 minutes for 90 questions
            speed_reader_seconds=120,
            passing_score_percentage=70,
            is_active=True,
            total_questions=len(questions_data),
        )
        
        # Create questions and options
        for i, q_data in enumerate(questions_data, 1):
            if i % 10 == 0:
                self.stdout.write(f'Importing question {i}/{len(questions_data)}...')
            question = Question.objects.create(
                exam=exam,
                question_number=i,  # Use sequential numbering to handle duplicates/gaps
                text=q_data['text'][:5000],  # Limit to field max length
                explanation=q_data['explanation'][:5000] if q_data['explanation'] else 'No explanation provided.',
                difficulty='medium',
                topic=q_data['topic'],
                correct_answer=q_data['correct_answer'],
            )
            
            # Create options
            for label in ['A', 'B', 'C', 'D', 'E']:
                if label in q_data['options']:
                    QuestionOption.objects.create(
                        question=question,
                        label=label,
                        text=q_data['options'][label][:1000],  # Limit to field max length
                    )
        
        return exam, len(questions_data)
