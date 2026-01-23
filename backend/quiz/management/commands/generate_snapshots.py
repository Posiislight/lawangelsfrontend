"""
Django management command to generate questions_snapshot for all exams.
This pre-serializes question data for fast results page loading.
"""
from django.core.management.base import BaseCommand
from quiz.models import Exam, Question


class Command(BaseCommand):
    help = 'Generate questions_snapshot for all exams (one-time backfill)'

    def add_arguments(self, parser):
        parser.add_argument(
            '--exam-id',
            type=int,
            help='Generate snapshot for a specific exam ID only',
        )

    def handle(self, *args, **options):
        exam_id = options.get('exam_id')
        
        if exam_id:
            exams = Exam.objects.filter(id=exam_id)
            if not exams.exists():
                self.stderr.write(self.style.ERROR(f'Exam {exam_id} not found'))
                return
        else:
            exams = Exam.objects.all()
        
        self.stdout.write(f'Generating snapshots for {exams.count()} exams...')
        
        for exam in exams:
            snapshot = self.generate_snapshot(exam)
            exam.questions_snapshot = snapshot
            exam.save(update_fields=['questions_snapshot'])
            self.stdout.write(f'  {exam.title}: {len(snapshot)} questions')
        
        self.stdout.write(self.style.SUCCESS('Done!'))

    def generate_snapshot(self, exam):
        """Generate pre-serialized question data for an exam."""
        questions = Question.objects.filter(exam=exam).prefetch_related('options').order_by('question_number')
        
        snapshot = []
        for q in questions:
            snapshot.append({
                'id': q.id,
                'question_number': q.question_number,
                'text': q.text,
                'explanation': q.explanation,
                'correct_answer': q.correct_answer,
                'topic': q.topic,
                'options': [
                    {'label': o.label, 'text': o.text}
                    for o in q.options.all()
                ]
            })
        
        return snapshot
