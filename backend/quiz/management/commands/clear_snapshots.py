from django.core.management.base import BaseCommand
from quiz.models import Exam

class Command(BaseCommand):
    help = 'Clears the questions_snapshot field for all exams'

    def handle(self, *args, **options):
        self.stdout.write('Clearing snapshots for all exams...')
        updated_count = Exam.objects.update(questions_snapshot=None)
        self.stdout.write(self.style.SUCCESS(f'Successfully cleared snapshots for {updated_count} exams.'))
