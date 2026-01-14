"""
Management command to import key topics from video description docx files.
Parses documents in backend/video_descriptions/ and updates Video.key_topics.
"""
import os
import re
from pathlib import Path
from django.core.management.base import BaseCommand
from quiz.video_models import Video, VideoCourse

# Try to import python-docx for parsing
try:
    from docx import Document
    HAS_DOCX = True
except ImportError:
    HAS_DOCX = False


class Command(BaseCommand):
    help = 'Import key topics from video description docx files'

    def add_arguments(self, parser):
        parser.add_argument(
            '--dry-run',
            action='store_true',
            help='Preview changes without saving to database',
        )

    def handle(self, *args, **options):
        if not HAS_DOCX:
            self.stderr.write(self.style.ERROR(
                'python-docx is required. Install it with: pip install python-docx'
            ))
            return

        dry_run = options['dry_run']
        
        # Find video_descriptions directory (relative to backend folder)
        base_dir = Path(__file__).resolve().parent.parent.parent.parent
        descriptions_dir = base_dir / 'video_descriptions'
        
        if not descriptions_dir.exists():
            self.stderr.write(self.style.ERROR(
                f'Directory not found: {descriptions_dir}'
            ))
            return
        
        self.stdout.write(f'Scanning: {descriptions_dir}')
        
        total_updated = 0
        # Process each docx file
        for file_path in sorted(descriptions_dir.glob('*.docx')):
            if file_path.name.startswith('~'):  # Skip temp files
                continue
            count = self.process_file(file_path, dry_run)
            total_updated += count
        
        if dry_run:
            self.stdout.write(self.style.WARNING(f'\n[DRY RUN] Would update {total_updated} videos.'))
        else:
            self.stdout.write(self.style.SUCCESS(f'\nImport complete! Updated {total_updated} videos.'))

    def process_file(self, file_path: Path, dry_run: bool) -> int:
        """Process a single docx file and extract key topics."""
        self.stdout.write(f'\n{"="*60}')
        self.stdout.write(f'Processing: {file_path.name}')
        
        try:
            doc = Document(file_path)
        except Exception as e:
            self.stderr.write(self.style.ERROR(f'  Error reading file: {e}'))
            return 0
        
        # Parse the document to find video entries
        # Expected structure:
        # - "Video X – Title..." (video title line)
        # - Description paragraph
        # - "Key areas covered" or similar
        # - List Paragraph style items (the topics)
        
        videos_data = []
        current_video_title = None
        current_topics = []
        collecting_topics = False
        
        for para in doc.paragraphs:
            text = para.text.strip()
            if not text:
                continue
            
            style_name = para.style.name.lower() if para.style else ''
            
            # Detect video title: starts with "Video X" pattern
            video_match = re.match(r'^Video\s+\d+\s*[–-]?\s*(.+)', text, re.IGNORECASE)
            if video_match:
                # Save previous video if we have topics
                if current_video_title and current_topics:
                    videos_data.append({
                        'title': current_video_title,
                        'topics': current_topics
                    })
                
                # Start new video
                current_video_title = video_match.group(1).strip()
                current_topics = []
                collecting_topics = False
                continue
            
            # Detect "Key topics" or "Key areas" section
            if 'key' in text.lower() and ('topic' in text.lower() or 'area' in text.lower()):
                collecting_topics = True
                continue
            
            # Collect topics if in "List Paragraph" style or similar
            if collecting_topics and 'list' in style_name:
                # Clean up the topic text
                topic = text.strip('•-–● ')
                if topic and len(topic) > 2:
                    current_topics.append(topic)
        
        # Don't forget the last video
        if current_video_title and current_topics:
            videos_data.append({
                'title': current_video_title,
                'topics': current_topics
            })
        
        self.stdout.write(f'  Found {len(videos_data)} videos with topics')
        
        # Update videos in database
        updated_count = 0
        for video_data in videos_data:
            if self.update_video(video_data['title'], video_data['topics'], dry_run):
                updated_count += 1
        
        return updated_count

    def update_video(self, video_title: str, key_topics: list, dry_run: bool) -> bool:
        """Update a video's key_topics in the database."""
        # Clean up title for searching
        search_title = video_title[:80].strip()  # Limit length
        
        # Try exact-ish match first
        video = Video.objects.filter(title__icontains=search_title[:40]).first()
        
        if not video:
            # Try matching key words from the title
            words = [w for w in search_title.split() if len(w) > 4][:3]
            for word in words:
                video = Video.objects.filter(title__icontains=word).first()
                if video:
                    break
        
        if video:
            self.stdout.write(f'  ✓ Matched: "{video.title[:50]}"')
            self.stdout.write(f'    Topics ({len(key_topics)}): {key_topics[:2]}...' if len(key_topics) > 2 else f'    Topics: {key_topics}')
            
            if not dry_run:
                video.key_topics = key_topics
                video.save(update_fields=['key_topics'])
            return True
        else:
            self.stdout.write(self.style.WARNING(f'  ✗ No match for: "{search_title[:50]}"'))
            return False
