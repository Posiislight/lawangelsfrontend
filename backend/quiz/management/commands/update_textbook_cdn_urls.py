"""
Management command to update textbook CDN URLs.

Usage:
    python manage.py update_textbook_cdn_urls --cdn-host lawangels-textbooks.b-cdn.net
    python manage.py update_textbook_cdn_urls --cdn-host lawangels-textbooks.b-cdn.net --dry-run
"""
from django.core.management.base import BaseCommand
from quiz.textbook_models import Textbook
from urllib.parse import quote


class Command(BaseCommand):
    help = 'Update textbook CDN URLs based on file names'

    def add_arguments(self, parser):
        parser.add_argument(
            '--cdn-host',
            type=str,
            required=True,
            help='CDN hostname (e.g., lawangels-textbooks.b-cdn.net)'
        )
        parser.add_argument(
            '--dry-run',
            action='store_true',
            help='Show changes without applying them'
        )

    def handle(self, *args, **options):
        cdn_host = options['cdn_host']
        dry_run = options['dry_run']

        if dry_run:
            self.stdout.write(self.style.WARNING('DRY RUN - No changes will be made'))

        textbooks = Textbook.objects.all()
        updated_count = 0

        for textbook in textbooks:
            # URL-encode the filename for proper CDN URL
            encoded_filename = quote(textbook.file_name)
            cdn_url = f'https://{cdn_host}/{encoded_filename}'

            if textbook.cdn_url != cdn_url:
                self.stdout.write(f'{textbook.title}:')
                self.stdout.write(f'  Old: {textbook.cdn_url or "(none)"}')
                self.stdout.write(f'  New: {cdn_url}')

                if not dry_run:
                    textbook.cdn_url = cdn_url
                    textbook.save(update_fields=['cdn_url'])
                    updated_count += 1

        if dry_run:
            self.stdout.write(self.style.WARNING(f'\nWould update {updated_count} textbooks'))
        else:
            self.stdout.write(self.style.SUCCESS(f'\nUpdated {updated_count} textbooks with CDN URLs'))
