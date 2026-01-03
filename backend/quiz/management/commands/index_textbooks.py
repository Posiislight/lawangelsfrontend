"""
Management command to index textbooks for RAG.

Usage: python manage.py index_textbooks
"""

from django.core.management.base import BaseCommand
from quiz.textbook_models import Textbook
from quiz import rag_service


class Command(BaseCommand):
    help = 'Index all textbooks into ChromaDB for RAG functionality'

    def add_arguments(self, parser):
        parser.add_argument(
            '--textbook-id',
            type=int,
            help='Index only a specific textbook by ID',
        )

    def handle(self, *args, **options):
        textbook_id = options.get('textbook_id')

        if textbook_id:
            textbooks = Textbook.objects.filter(id=textbook_id)
            if not textbooks.exists():
                self.stderr.write(self.style.ERROR(f'Textbook with ID {textbook_id} not found'))
                return
        else:
            textbooks = Textbook.objects.all()

        if not textbooks.exists():
            self.stderr.write(self.style.WARNING('No textbooks found in database'))
            return

        self.stdout.write(f'Indexing {textbooks.count()} textbook(s)...\n')

        total_chunks = 0
        for textbook in textbooks:
            self.stdout.write(f'  Processing: {textbook.title}...')
            try:
                chunks = rag_service.index_textbook(textbook)
                total_chunks += chunks
                self.stdout.write(self.style.SUCCESS(f' {chunks} chunks indexed'))
            except Exception as e:
                self.stderr.write(self.style.ERROR(f' Error: {e}'))

        self.stdout.write(self.style.SUCCESS(f'\nTotal: {total_chunks} chunks indexed'))
