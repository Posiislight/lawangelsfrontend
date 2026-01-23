"""
Management command to index legal resources into Pinecone.
Usage: python manage.py index_legal_resources
"""

from django.core.management.base import BaseCommand
from quiz import pinecone_service


class Command(BaseCommand):
    help = 'Index legal resources (cases and statutes) into Pinecone for Angel AI RAG'

    def handle(self, *args, **options):
        self.stdout.write(self.style.NOTICE('Starting legal resources indexing...'))
        self.stdout.write(f'Resources directory: {pinecone_service.LEGAL_RESOURCES_DIR}')
        
        try:
            results = pinecone_service.index_legal_resources()
            
            if not results:
                self.stdout.write(self.style.ERROR('No resources were indexed!'))
                return
            
            # Print summary
            total_chunks = sum(results.values())
            self.stdout.write(self.style.SUCCESS(f'\n=== Indexing Complete ==='))
            self.stdout.write(f'Files processed: {len(results)}')
            self.stdout.write(f'Total chunks indexed: {total_chunks}')
            self.stdout.write('\nPer-file breakdown:')
            
            for filename, chunk_count in results.items():
                if chunk_count > 0:
                    self.stdout.write(self.style.SUCCESS(f'  ✓ {filename}: {chunk_count} chunks'))
                else:
                    self.stdout.write(self.style.WARNING(f'  ✗ {filename}: failed'))
                    
        except Exception as e:
            self.stdout.write(self.style.ERROR(f'Error during indexing: {e}'))
            raise
