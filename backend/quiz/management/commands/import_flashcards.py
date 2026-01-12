"""
Management command to import flashcards from .docx files.
Creates a separate deck for each chapter within each subject.
"""

from django.core.management.base import BaseCommand
from django.db import transaction
from docx import Document
import os
import re
from quiz.flashcard_models import FlashcardDeck, Flashcard


# Map flashcard file names to subject info
FLASHCARD_MAPPING = {
    'CRIMINAL PRACTICE FLASHCARDS.docx': {
        'subject': 'Criminal Practice',
        'category': 'FLK2',
        'icon': '⚖️',
    },
    'Criminal Law Flashcards – Law Angels SQE Series.docx': {
        'subject': 'Criminal Law',
        'category': 'FLK2',
        'icon': '🚔',
    },
    'FINAL FLASHCARDS ON LAND LAW.docx': {
        'subject': 'Land Law',
        'category': 'FLK2',
        'icon': '🏘️',
    },
    'FINAL FLASHCARDS ON WILLS AND ADMINISTRATION OF ESTATES.docx': {
        'subject': 'Wills & Administration',
        'category': 'FLK2',
        'icon': '📜',
    },
    'PROPERTY PRACTICE FLASHCARDS.docx': {
        'subject': 'Property Practice',
        'category': 'FLK2',
        'icon': '🏠',
    },
    'TRUST FLASHCARDS.docx': {
        'subject': 'Trusts',
        'category': 'FLK2',
        'icon': '🤝',
    },
    'BUSINESS LAW FLASHCARDS (1).docx': {
        'subject': 'Business Law',
        'category': 'FLK1',
        'icon': '💼',
    },
    'Constitutional Law Flashcards.docx': {
        'subject': 'Constitutional Law',
        'category': 'FLK1',
        'icon': '🏛️',
    },
    'Contract Law Flashcards.docx': {
        'subject': 'Contract Law',
        'category': 'FLK1',
        'icon': '📝',
    },
    'DISPUTE RESOLUTION FLASHCARDS.docx': {
        'subject': 'Dispute Resolution',
        'category': 'FLK1',
        'icon': '🧑‍⚖️',
    },
    'LEGAL SYSTEM FLASHCARDS.docx': {
        'subject': 'The Legal System',
        'category': 'FLK1',
        'icon': '🇬🇧',
    },
    'Legal Services Flashcards.docx': {
        'subject': 'Legal Services',
        'category': 'FLK1',
        'icon': '🏢',
    },
    'PROFESSIONAL ETHICS FLASHCARDS.docx': {
        'subject': 'Professional Ethics',
        'category': 'FLK1',
        'icon': '🧭',
    },
    'TORTS FLASHCARDS.docx': {
        'subject': 'Tort Law',
        'category': 'FLK1',
        'icon': '🤕',
    },
}


class Command(BaseCommand):
    help = 'Import flashcards from .docx files, creating a deck per chapter'

    def handle(self, *args, **kwargs):
        flashcards_dir = os.path.join(os.path.dirname(__file__), '../../../flashcards')
        flashcards_dir = os.path.abspath(flashcards_dir)
        
        if not os.path.exists(flashcards_dir):
            self.stdout.write(self.style.ERROR(f'Flashcards directory not found: {flashcards_dir}'))
            return
        
        # Get actual filenames and paths
        file_paths = {}
        
        # Check root directory
        for f in os.listdir(flashcards_dir):
            if f.endswith('.docx') and not f.startswith('~$'):
                file_paths[f] = os.path.join(flashcards_dir, f)
                
        # Check flk1 subdirectory
        flk1_dir = os.path.join(flashcards_dir, 'flk1')
        if os.path.exists(flk1_dir):
            for f in os.listdir(flk1_dir):
                if f.endswith('.docx') and not f.startswith('~$'):
                    file_paths[f] = os.path.join(flk1_dir, f)

        self.stdout.write(f"DEBUG: Found {len(file_paths)} docx files.")
        self.stdout.write(f"DEBUG: Files: {list(file_paths.keys())}")

        # For backwards compatibility with existing logic slightly modify how we use it
        actual_files = list(file_paths.keys())
        
        total_decks = 0
        total_cards = 0
        deck_order = 0
        
        # First, delete all existing flashcard decks and cards
        FlashcardDeck.objects.all().delete()
        self.stdout.write(self.style.WARNING('Cleared existing flashcard data'))
        
        for filename, info in FLASHCARD_MAPPING.items():
            # Find actual file
            # Try exact filename match first (case-insensitive check)
            matching = [f for f in actual_files if f.lower() == filename.lower()]
            
            # Fallback to subject name matching if exact file not found
            if not matching:
                matching = [f for f in actual_files if info['subject'].lower().split()[0] in f.lower()]
            
            if not matching:
                self.stdout.write(self.style.WARNING(f'File not found for: {info["subject"]}'))
                continue
            
            actual_filename = matching[0]
            filepath = file_paths[actual_filename]
            
            self.stdout.write(f'\nProcessing: {info["subject"]}')
            
            try:
                # Parse file and get chapters with their cards
                chapters = self.parse_flashcard_doc(filepath)
                
                if not chapters:
                    self.stdout.write(self.style.WARNING(f'  No chapters found'))
                    continue
                
                # Create a deck for each chapter
                with transaction.atomic():
                    for chapter_title, cards in chapters.items():
                        if not cards:
                            continue
                        
                        deck_order += 1
                        
                        # Create deck for this chapter
                        deck = FlashcardDeck.objects.create(
                            title=chapter_title,
                            subject=info['subject'],
                            category=info['category'],
                            icon=info['icon'],
                            order=deck_order,
                            is_active=True
                        )
                        
                        # Create cards for this deck
                        for i, card_data in enumerate(cards, start=1):
                            Flashcard.objects.create(
                                deck=deck,
                                question=card_data['question'],
                                answer=card_data['answer'],
                                hint='',
                                order=i,
                                is_active=True
                            )
                        
                        total_decks += 1
                        total_cards += len(cards)
                        
                        self.stdout.write(self.style.SUCCESS(
                            f'  + {chapter_title}: {len(cards)} cards'
                        ))
            
            except Exception as e:
                self.stdout.write(self.style.ERROR(f'  Error: {str(e)}'))
                import traceback
                traceback.print_exc()
                continue
        
        self.stdout.write(self.style.SUCCESS(f'\n[OK] Import complete!'))
        self.stdout.write(self.style.SUCCESS(f'   Decks (chapters): {total_decks}'))
        self.stdout.write(self.style.SUCCESS(f'   Total cards: {total_cards}'))
    
    def parse_flashcard_doc(self, filepath):
        """Parse .docx file and return dict of {chapter_title: [cards]}."""
        doc = Document(filepath)
        
        chapters = {}
        current_chapter = "General"
        current_question = None  # For multi-paragraph cards
        
        for para in doc.paragraphs:
            text = para.text.strip()
            if not text:
                continue
            
            # Check for chapter heading
            # Regex usually matches until newline if . is used without DOTALL
            chapter_match = re.match(r'^(CHAPTER\s+\d+[:\s]*.+|CHAPTER\s+\d+)$', text.split('\n')[0], re.IGNORECASE)
            
            card_text_to_process = text
            
            if chapter_match:
                # We found a chapter heading
                header = chapter_match.group(1).strip()
                # Clean up colon if captured
                if header.lower().startswith('chapter'):
                    parts = header.split(':', 1)
                    if len(parts) > 1:
                        # Normalize title part
                        current_chapter = f"{parts[0].strip()}: {parts[1].strip()}"
                    else:
                        current_chapter = header
                else:
                    current_chapter = header

                if current_chapter not in chapters:
                    chapters[current_chapter] = []
                
                # Reset multi-para state
                current_question = None
                
                # Check if there is content AFTER the header (e.g. "Chapter 1...\nQuestion...")
                # Split text by newline. If > 1 line, the rest is card data.
                lines = text.split('\n', 1)
                if len(lines) > 1 and lines[1].strip():
                    card_text_to_process = lines[1].strip()
                else:
                    continue
            
            # Process card_text_to_process
            
            # Strategy 1: Explicit Q: and A: in same block
            if 'Q:' in card_text_to_process and 'A:' in card_text_to_process:
                current_question = None # Reset
                parts = re.split(r'\nA:|(?<!\w)A:', card_text_to_process, maxsplit=1)
                if len(parts) == 2:
                    question = parts[0].replace('Q:', '').strip()
                    answer = parts[1].strip()
                    if question and answer:
                        chapters[current_chapter].append({
                            'question': question,
                            'answer': answer
                        })
                continue
                
            # Strategy 2: Newline separation (Question \n Answer) but no explicit Q/A markers sometimes
            if '\n' in card_text_to_process:
                parts = card_text_to_process.split('\n', 1)
                # If looks like a pair
                if len(parts) == 2 and len(parts[0]) > 2 and len(parts[1]) > 2:
                    # If Strategy 1 failed (maybe markers missing or format differs)
                    chapters[current_chapter].append({
                        'question': parts[0].strip(),
                        'answer': parts[1].strip()
                    })
                    current_question = None
                    continue

            # Strategy 3: Multi-paragraph Q and A
            # Check for Question start
            if card_text_to_process.startswith('Q:') or card_text_to_process.startswith('Q '):
                 current_question = card_text_to_process.split(':', 1)[-1].strip() if ':' in card_text_to_process else card_text_to_process[2:].strip()
                 continue
            
            # Check for Answer start (only if question pending)
            if current_question and (card_text_to_process.startswith('A:') or card_text_to_process.startswith('A ')):
                 answer = card_text_to_process.split(':', 1)[-1].strip() if ':' in card_text_to_process else card_text_to_process[2:].strip()
                 chapters[current_chapter].append({
                     'question': current_question,
                     'answer': answer
                 })
                 current_question = None
                 continue

        
        # Remove empty chapters
        chapters = {k: v for k, v in chapters.items() if v}
        
        return chapters
