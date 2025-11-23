import csv
from django.core.management.base import BaseCommand
from django.db import transaction
from quiz.models import Exam, Question, QuestionOption
import logging

logger = logging.getLogger(__name__)


class Command(BaseCommand):
    help = 'Import questions from CSV file'

    def add_arguments(self, parser):
        parser.add_argument(
            'csv_file',
            type=str,
            help='Path to the CSV file containing questions'
        )
        parser.add_argument(
            '--exam-id',
            type=int,
            help='Exam ID to associate questions with (creates default if not provided)'
        )

    @transaction.atomic
    def handle(self, *args, **options):
        csv_file = options['csv_file']
        exam_id = options.get('exam_id')

        # Get or create exam
        if exam_id:
            try:
                exam = Exam.objects.get(id=exam_id)
                self.stdout.write(f"Using existing exam: {exam.title}")
            except Exam.DoesNotExist:
                self.stdout.write(self.style.ERROR(f"Exam with ID {exam_id} not found"))
                return
        else:
            exam, created = Exam.objects.get_or_create(
                title="Law Angels Mock Exam",
                defaults={
                    'description': 'Comprehensive law exam covering various topics',
                    'duration_minutes': 180,
                    'passing_score_percentage': 70,
                    'total_questions': 100,
                    'is_active': True
                }
            )
            if created:
                self.stdout.write(f"Created new exam: {exam.title}")
            else:
                self.stdout.write(f"Using existing exam: {exam.title}")

        question_count = 0
        error_count = 0
        question_number = 1

        try:
            with open(csv_file, 'r', encoding='utf-8') as f:
                reader = csv.DictReader(f)
                
                for row_num, row in enumerate(reader, start=2):  # start=2 because row 1 is header
                    try:
                        # Create question
                        question, created = Question.objects.get_or_create(
                            text=row['question_text'],
                            exam=exam,
                            defaults={
                                'question_number': question_number,
                                'difficulty': row.get('difficulty', 'medium'),
                                'correct_answer': row.get('correct_answer', 'A').strip(),
                                'explanation': row.get('explanation', ''),
                            }
                        )

                        if created:
                            question_count += 1
                            question_number += 1
                            logger.info(f"Created question: {question.id}")

                        # Create options (answers)
                        for i in range(1, 6):  # Support up to 5 options
                            label_key = f'option_{i}_label'
                            text_key = f'option_{i}_text'

                            if label_key in row and text_key in row and row[label_key]:
                                label = row[label_key].strip()
                                text = row[text_key]

                                QuestionOption.objects.get_or_create(
                                    question=question,
                                    label=label,
                                    defaults={'text': text}
                                )

                    except Exception as e:
                        error_count += 1
                        logger.error(f"Error processing row {row_num}: {str(e)}")
                        self.stdout.write(
                            self.style.ERROR(f"Error on row {row_num}: {str(e)}")
                        )

        except FileNotFoundError:
            self.stdout.write(self.style.ERROR(f"File not found: {csv_file}"))
            return
        except Exception as e:
            self.stdout.write(self.style.ERROR(f"Error reading CSV: {str(e)}"))
            return

        # Print summary
        self.stdout.write(
            self.style.SUCCESS(
                f'\n✓ Successfully imported {question_count} questions'
            )
        )
        if error_count > 0:
            self.stdout.write(
                self.style.WARNING(f'⚠ {error_count} rows had errors')
            )
