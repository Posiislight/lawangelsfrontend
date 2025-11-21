"""
Django management command to convert DOCX to CSV
Usage: python manage.py convert_docx_to_csv <input.docx> [output.csv]
"""

import sys
from pathlib import Path
from django.core.management.base import BaseCommand, CommandError
from django.conf import settings

# Add parent directory to path to import converter
sys.path.insert(0, str(Path(__file__).resolve().parent.parent.parent.parent))

from docx_converter import DocxToCsvConverter


class Command(BaseCommand):
    help = 'Convert DOCX file containing questions to CSV format'

    def add_arguments(self, parser):
        parser.add_argument(
            'docx_file',
            type=str,
            help='Path to input DOCX file'
        )
        parser.add_argument(
            'csv_file',
            type=str,
            nargs='?',
            help='Path to output CSV file (optional, derives from docx_file if not provided)'
        )

    def handle(self, *args, **options):
        docx_path = options['docx_file']
        csv_path = options.get('csv_file')

        try:
            self.stdout.write(self.style.SUCCESS('Starting DOCX to CSV conversion...'))
            
            converter = DocxToCsvConverter()
            output_path = converter.convert(docx_path, csv_path)
            
            self.stdout.write(
                self.style.SUCCESS(f'✅ Successfully converted to: {output_path}')
            )
            
        except FileNotFoundError as e:
            raise CommandError(f'File not found: {str(e)}')
        except ValueError as e:
            raise CommandError(f'Invalid file format: {str(e)}')
        except Exception as e:
            raise CommandError(f'Error during conversion: {str(e)}')
