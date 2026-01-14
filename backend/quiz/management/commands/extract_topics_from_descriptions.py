"""
Management command to extract key topics from video descriptions.
Some videos have topics embedded in the description text separated by asterisks.
This command extracts them into the key_topics field and cleans up the description.
"""
import re
from django.core.management.base import BaseCommand
from quiz.video_models import Video


class Command(BaseCommand):
    help = 'Extract asterisk-separated key topics from video descriptions'

    def add_arguments(self, parser):
        parser.add_argument(
            '--dry-run',
            action='store_true',
            help='Preview changes without saving to database',
        )

    def handle(self, *args, **options):
        dry_run = options['dry_run']
        
        videos = Video.objects.filter(is_active=True)
        updated_count = 0
        
        for video in videos:
            if not video.description:
                continue
            
            # Check if description contains asterisk-separated topics
            # Pattern: text ending with period, then * Topic1 * Topic2 * Topic3
            if ' * ' not in video.description:
                continue
            
            # Find the pattern: after a period, asterisk-separated items
            # Match: ". * Item1 * Item2 * Item3" at the end
            match = re.search(r'\.\s*(\*\s*[^*]+(?:\s*\*\s*[^*]+)+)\s*$', video.description)
            
            if match:
                topics_text = match.group(1)
                
                # Extract individual topics
                topics = [t.strip() for t in topics_text.split('*') if t.strip()]
                
                if topics:
                    # Clean the description (remove the topics part)
                    clean_description = video.description[:match.start() + 1].strip()
                    
                    self.stdout.write(f'\n{"="*60}')
                    self.stdout.write(f'Video: {video.title[:50]}')
                    self.stdout.write(f'  Topics found: {topics}')
                    self.stdout.write(f'  Clean desc: "{clean_description[:80]}..."')
                    
                    if not dry_run:
                        # Merge with existing topics if any
                        existing_topics = video.key_topics or []
                        all_topics = list(set(existing_topics + topics))
                        
                        video.description = clean_description
                        video.key_topics = all_topics
                        video.save(update_fields=['description', 'key_topics'])
                        self.stdout.write(self.style.SUCCESS('  ✓ Updated'))
                    
                    updated_count += 1
        
        if dry_run:
            self.stdout.write(self.style.WARNING(f'\n[DRY RUN] Would update {updated_count} videos.'))
        else:
            self.stdout.write(self.style.SUCCESS(f'\nComplete! Updated {updated_count} videos.'))
