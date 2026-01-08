"""
Management command to import practice questions from JSON to database.

Usage: python manage.py import_practice_questions
       python manage.py import_practice_questions --clear
"""
import json
from pathlib import Path
from django.core.management.base import BaseCommand
from django.db import transaction
from quiz.practice_question_models import (
    PracticeQuestionCourse,
    PracticeQuestionTopic,
    PracticeQuestionArea,
    PracticeQuestion
)


class Command(BaseCommand):
    help = 'Import practice questions from JSON file to database'

    def add_arguments(self, parser):
        parser.add_argument(
            '--clear',
            action='store_true',
            help='Clear existing data before importing',
        )

    def handle(self, *args, **options):
        json_path = Path(__file__).parent.parent.parent / 'practice_questions_data.json'
        
        if not json_path.exists():
            self.stderr.write(self.style.ERROR(f'JSON file not found: {json_path}'))
            return

        self.stdout.write(f'Loading JSON from {json_path}...')
        
        with open(json_path, 'r', encoding='utf-8') as f:
            data = json.load(f)

        if options['clear']:
            self.stdout.write('Clearing existing practice questions...')
            PracticeQuestion.objects.all().delete()
            PracticeQuestionArea.objects.all().delete()
            PracticeQuestionTopic.objects.all().delete()
            PracticeQuestionCourse.objects.all().delete()

        self.stdout.write('Starting import with bulk insert...')
        
        total_courses = 0
        total_topics = 0
        total_areas = 0
        total_questions = 0

        with transaction.atomic():
            for course_slug, course_data in data.items():
                # Create or get course
                course, created = PracticeQuestionCourse.objects.get_or_create(
                    slug=course_slug,
                    defaults={'name': course_data['name']}
                )
                if not created:
                    course.name = course_data['name']
                    course.save()
                    
                total_courses += 1
                action = 'Created' if created else 'Updated'
                self.stdout.write(f'  {action} course: {course.name}')

                for topic_data in course_data.get('topics', []):
                    # Create or get topic
                    topic, _ = PracticeQuestionTopic.objects.get_or_create(
                        course=course,
                        slug=topic_data['slug'],
                        defaults={
                            'name': topic_data['name'],
                            'area_count': topic_data.get('area_count', 0),
                            'question_count': topic_data.get('question_count', 0)
                        }
                    )
                    total_topics += 1
                    self.stdout.write(f'    Topic: {topic.name}')

                    for area_data in topic_data.get('areas', []):
                        # Create or get area
                        area, _ = PracticeQuestionArea.objects.get_or_create(
                            topic=topic,
                            slug=area_data['slug'],
                            defaults={
                                'letter': area_data['letter'],
                                'name': area_data['name'],
                                'question_count': area_data.get('question_count', 0)
                            }
                        )
                        total_areas += 1

                        # Prepare questions for bulk insert
                        existing_question_ids = set(
                            PracticeQuestion.objects.filter(area=area).values_list('question_id', flat=True)
                        )
                        
                        new_questions = []
                        for question_data in area_data.get('questions', []):
                            if question_data['id'] not in existing_question_ids:
                                new_questions.append(PracticeQuestion(
                                    area=area,
                                    question_id=question_data['id'],
                                    title=question_data.get('title', ''),
                                    text=question_data['text'],
                                    options=question_data['options'],
                                    correct_answer=question_data['correct_answer'],
                                    explanation=question_data.get('explanation', ''),
                                    difficulty=question_data.get('difficulty', 'medium')
                                ))
                        
                        # Bulk create new questions
                        if new_questions:
                            PracticeQuestion.objects.bulk_create(new_questions)
                        
                        total_questions += len(area_data.get('questions', []))

        self.stdout.write(self.style.SUCCESS(
            f'\nImport complete!\n'
            f'  Courses: {total_courses}\n'
            f'  Topics: {total_topics}\n'
            f'  Areas: {total_areas}\n'
            f'  Questions: {total_questions}'
        ))
