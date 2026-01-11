"""
Django management command to import Mock Exam 1 from raw text file.
"""
import re
import os
from django.core.management.base import BaseCommand
from django.db import transaction
from quiz.models import Exam, Question, QuestionOption


class Command(BaseCommand):
    help = 'Import Mock Exam 1 (90 questions) from raw text file'

    def add_arguments(self, parser):
        parser.add_argument(
            '--clear',
            action='store_true',
            help='Clear existing Mock Test 1 before import',
        )
        parser.add_argument(
            '--file',
            type=str,
            default='mockexam/mock1_raw.txt',
            help='Path to the raw text file (relative to backend directory)',
        )

    def handle(self, *args, **options):
        clear = options['clear']
        file_path = options['file']
        
        # Clear existing exam if requested
        if clear:
            with transaction.atomic():
                deleted_count = Exam.objects.filter(title='Mock Test 1').delete()[0]
                self.stdout.write(self.style.WARNING(f'Cleared existing Mock Test 1 ({deleted_count} objects)'))
        
        # Parse questions from file
        try:
            questions_data = self.parse_text_file(file_path)
            self.stdout.write(f'Parsed {len(questions_data)} questions from file')
            
            # Import the questions
            with transaction.atomic():
                exam, count = self.import_questions(questions_data)
                self.stdout.write(self.style.SUCCESS(f'Successfully imported Mock Test 1 with {count} questions'))
        except Exception as e:
            self.stderr.write(self.style.ERROR(f'Error importing Mock Test 1: {str(e)}'))
            import traceback
            traceback.print_exc()

    def parse_text_file(self, file_path):
        """Parse the raw text file and extract all questions"""
        with open(file_path, 'r', encoding='utf-8') as f:
            content = f.read()
        
        questions = []
        
        # Split by "Question N" pattern
        question_pattern = r'Question\s+(\d+)\s*(?:\([^)]*\))?'
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
        
        for line in lines:
            line = line.strip()
            if not line:
                continue
            
            # Check for next question (stop parsing)
            if re.match(r'^Question\s+\d+', line):
                break
            
            # IMPORTANT: Check for correct answer BEFORE option lines
            # because "D is the correct option" could be mismatched as an option
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
            
            if answer_match:
                current_section = 'answer'
                question_data['correct_answer'] = answer_match.group(1).upper()
                continue
            
            # Check for option lines - handles multiple formats:
            # A. B. C. (uppercase with period)
            # A) B) C) (uppercase with parenthesis)  
            # a) b) c) (lowercase with parenthesis)
            # A.Text (no space after period)
            # •A. (bullet character before letter - \uf0b7 or similar)
            # Must have a period or parenthesis after the letter (not just space)
            # Pattern: optional bullet + letter + (period or paren) + optional space + text
            option_match = re.match(r'^[\u2022\uf0b7\u2023\u25e6\u25aa\u25ab\u2219\-\*]*\s*([A-Ea-e])[\.\)]\s*(.+)', line)
            if option_match and current_section in ['question', 'options']:
                current_section = 'options'
                label = option_match.group(1).upper()  # Normalize to uppercase
                text = option_match.group(2).strip()
                question_data['options'][label] = text
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
                f'Question {q_num} incomplete: text={bool(question_data["text"])}, '
                f'options={len(question_data["options"])}, answer={question_data["correct_answer"]}'
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

    def import_questions(self, questions_data):
        """Create exam and import all questions"""
        # Create the exam
        exam = Exam.objects.create(
            title='Mock Test 1',
            description='Full-length SQE1 mock exam - Practice Test 1 (90 questions)',
            subject='mixed',
            duration_minutes=180,  # 3 hours for 90 questions
            speed_reader_seconds=120,
            passing_score_percentage=70,
            is_active=True,
            total_questions=len(questions_data),
        )
        
        # Create questions and options
        for q_data in questions_data:
            question = Question.objects.create(
                exam=exam,
                question_number=q_data['number'],
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
