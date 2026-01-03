"""
Management command to sync videos from Cloudflare Stream.

Fetches all videos from Cloudflare Stream and creates/updates Video records.
Also parses video descriptions from Word documents.

Usage:
    python manage.py sync_cloudflare_videos
    python manage.py sync_cloudflare_videos --dry-run
    python manage.py sync_cloudflare_videos --course "Contract Law"
"""
import os
import re
from django.core.management.base import BaseCommand, CommandError
from django.conf import settings
from quiz.cloudflare_service import cloudflare_service
from quiz.video_models import VideoCourse, Video


class Command(BaseCommand):
    help = 'Sync videos from Cloudflare Stream and create Video records'

    def add_arguments(self, parser):
        parser.add_argument(
            '--dry-run',
            action='store_true',
            help='Show what would be created without actually creating',
        )
        parser.add_argument(
            '--course',
            type=str,
            help='Only sync videos for a specific course name',
        )
        parser.add_argument(
            '--with-descriptions',
            action='store_true',
            help='Also parse and import descriptions from Word docs',
        )

    def handle(self, *args, **options):
        dry_run = options['dry_run']
        filter_course = options.get('course')
        with_descriptions = options.get('with_descriptions', False)
        
        if dry_run:
            self.stdout.write(self.style.WARNING('DRY RUN - No changes will be made'))
        
        # Fetch videos from Cloudflare
        self.stdout.write('Fetching videos from Cloudflare Stream...')
        
        try:
            videos = cloudflare_service.list_all_videos()
        except ValueError as e:
            raise CommandError(str(e))
        except Exception as e:
            raise CommandError(f'Failed to fetch videos from Cloudflare: {e}')
        
        self.stdout.write(self.style.SUCCESS(f'Found {len(videos)} videos in Cloudflare Stream'))
        
        # Parse descriptions if requested
        descriptions = {}
        if with_descriptions:
            descriptions = self._load_descriptions()
        
        # Group videos by course (normalize course names)
        courses_dict = {}
        course_name_mapping = {}  # Maps normalized name to display name
        
        for video_data in videos:
            parsed = cloudflare_service.parse_video_info(video_data)
            course_name = parsed['course_name']
            
            # Normalize course name (title case, remove extra spaces)
            normalized_name = self._normalize_course_name(course_name)
            
            # Filter by course if specified
            if filter_course and normalized_name.lower() != filter_course.lower():
                continue
            
            # Track the best display name (prefer title case)
            if normalized_name not in course_name_mapping:
                course_name_mapping[normalized_name] = normalized_name
            
            if normalized_name not in courses_dict:
                courses_dict[normalized_name] = []
            
            courses_dict[normalized_name].append(parsed)
        
        # Sort videos within each course by chapter number
        for course_name in courses_dict:
            courses_dict[course_name].sort(key=lambda x: x['chapter_number'])
        
        # Display summary
        self.stdout.write('\n' + '=' * 60)
        self.stdout.write('COURSES FOUND:')
        self.stdout.write('=' * 60)
        
        for course_name, course_videos in sorted(courses_dict.items()):
            self.stdout.write(f'\n📚 {course_name} ({len(course_videos)} videos)')
            for v in course_videos:
                chapter = f"Chapter {v['chapter_number']}" if v['chapter_number'] else "No chapter"
                duration = self._format_duration(v['duration_seconds'])
                self.stdout.write(f"   • {v['title']} [{duration}]")
        
        if dry_run:
            self.stdout.write(self.style.WARNING('\nDry run complete. No changes made.'))
            return
        
        # Create/update courses and videos
        self.stdout.write('\n' + '=' * 60)
        self.stdout.write('CREATING/UPDATING RECORDS:')
        self.stdout.write('=' * 60)
        
        created_courses = 0
        created_videos = 0
        updated_videos = 0
        
        for course_name, course_videos in courses_dict.items():
            # Generate slug for lookup (max 50 chars due to DB constraint)
            from django.utils.text import slugify
            course_slug = slugify(course_name)[:50]
            
            # Try to find existing course by slug first, then create
            try:
                course = VideoCourse.objects.get(slug=course_slug)
                course_created = False
            except VideoCourse.DoesNotExist:
                course = VideoCourse.objects.create(
                    title=course_name[:200],  # Truncate title too if needed
                    slug=course_slug,
                    is_active=True,
                    order=0
                )
                course_created = True
            
            if course_created:
                created_courses += 1
                self.stdout.write(self.style.SUCCESS(f'✓ Created course: {course_name}'))
            else:
                self.stdout.write(f'  Course exists: {course_name}')
            
            # Create/update videos
            for idx, video_info in enumerate(course_videos):
                video_id = video_info['cloudflare_video_id']
                
                # Try to find matching description
                description = self._find_description(
                    descriptions,
                    course_name,
                    video_info['chapter_number']
                )
                
                # Check if video exists
                video, video_created = Video.objects.update_or_create(
                    cloudflare_video_id=video_id,
                    defaults={
                        'course': course,
                        'title': video_info['title'],
                        'description': description,
                        'duration_seconds': video_info['duration_seconds'],
                        'thumbnail_url': video_info['thumbnail_url'],
                        'order': idx + 1,
                        'is_active': True
                    }
                )
                
                if video_created:
                    created_videos += 1
                    self.stdout.write(self.style.SUCCESS(f'  ✓ Created: {video_info["title"]}'))
                else:
                    updated_videos += 1
                    self.stdout.write(f'  ↻ Updated: {video_info["title"]}')
        
        # Summary
        self.stdout.write('\n' + '=' * 60)
        self.stdout.write('SUMMARY:')
        self.stdout.write('=' * 60)
        self.stdout.write(f'Courses created: {created_courses}')
        self.stdout.write(f'Videos created: {created_videos}')
        self.stdout.write(f'Videos updated: {updated_videos}')
        self.stdout.write(self.style.SUCCESS('\nSync complete!'))
    
    def _format_duration(self, seconds: int) -> str:
        """Format seconds as MM:SS or HH:MM:SS"""
        if seconds < 3600:
            mins = seconds // 60
            secs = seconds % 60
            return f'{mins}:{secs:02d}'
        else:
            hours = seconds // 3600
            mins = (seconds % 3600) // 60
            secs = seconds % 60
            return f'{hours}:{mins:02d}:{secs:02d}'
    
    def _normalize_course_name(self, name: str) -> str:
        """
        Normalize course name to one of the 7 official series:
        - Business Law
        - Constitutional Law
        - Contract Law
        - Dispute Resolution
        - Legal Service
        - Legal System
        - Torts
        """
        if not name:
            return "Unknown"
        
        # Lowercase for matching
        name_lower = name.lower()
        
        # Map to canonical course names
        if 'business' in name_lower and 'law' in name_lower:
            return 'Business Law'
        
        if 'constitutional' in name_lower or 'cons law' in name_lower:
            return 'Constitutional Law'
        
        if 'contract' in name_lower:
            return 'Contract Law'
        
        if 'dispute' in name_lower or 'resolution' in name_lower:
            return 'Dispute Resolution'
        
        if 'legal service' in name_lower or 'legal services' in name_lower:
            return 'Legal Service'
        
        if 'legal system' in name_lower or 'legal systems' in name_lower:
            return 'Legal System'
        
        if 'tort' in name_lower:
            return 'Torts'
        
        # For anything else, try to clean up the name
        # Remove file extensions
        name = re.sub(r'\.(mp4|mov|avi|mkv)$', '', name, flags=re.IGNORECASE)
        # Remove trailing numbers
        name = re.sub(r'\s+\d+\s*$', '', name)
        # Remove chapter references
        name = re.sub(r'\s*[Cc]hapter\s*\d*\s*$', '', name)
        name = re.sub(r'\s*[Cc]hap\s*\d*\s*$', '', name)
        # Clean up
        name = re.sub(r'\s+', ' ', name).strip()
        
        return name.title() if name else "Unknown"
    
    def _load_descriptions(self) -> dict:
        """
        Load descriptions from Word documents in video_descriptions folder.
        Returns dict: {course_name: {chapter_number: description}}
        """
        descriptions = {}
        desc_folder = os.path.join(settings.BASE_DIR, 'video_descriptions')
        
        if not os.path.exists(desc_folder):
            self.stdout.write(self.style.WARNING(f'Descriptions folder not found: {desc_folder}'))
            return descriptions
        
        try:
            import docx
        except ImportError:
            self.stdout.write(self.style.WARNING(
                'python-docx not installed. Run: pip install python-docx'
            ))
            return descriptions
        
        self.stdout.write(f'\nLoading descriptions from: {desc_folder}')
        
        for filename in os.listdir(desc_folder):
            if not filename.endswith(('.docx', '.doc')):
                continue
            
            filepath = os.path.join(desc_folder, filename)
            course_name = self._extract_course_name_from_filename(filename)
            
            if not course_name:
                continue
            
            try:
                if filename.endswith('.docx'):
                    doc = docx.Document(filepath)
                    
                    # Parse document - look for chapter headings and descriptions
                    current_chapter = 0
                    current_text = []
                    
                    for para in doc.paragraphs:
                        text = para.text.strip()
                        
                        if not text:
                            continue
                        
                        # Check if this is a chapter heading
                        chapter_match = re.match(
                            r'^[Cc]hapter\s*(\d+)|^(\d+)\.',
                            text,
                            re.IGNORECASE
                        )
                        
                        if chapter_match:
                            # Save previous chapter
                            if current_chapter > 0 and current_text:
                                if course_name not in descriptions:
                                    descriptions[course_name] = {}
                                descriptions[course_name][current_chapter] = '\n'.join(current_text)
                            
                            # Start new chapter
                            current_chapter = int(chapter_match.group(1) or chapter_match.group(2))
                            current_text = []
                        else:
                            current_text.append(text)
                    
                    # Save last chapter
                    if current_chapter > 0 and current_text:
                        if course_name not in descriptions:
                            descriptions[course_name] = {}
                        descriptions[course_name][current_chapter] = '\n'.join(current_text)
                    
                    self.stdout.write(f'  ✓ Loaded: {filename} ({len(descriptions.get(course_name, {}))} chapters)')
                    
            except Exception as e:
                self.stdout.write(self.style.WARNING(f'  ✗ Failed to parse {filename}: {e}'))
        
        return descriptions
    
    def _extract_course_name_from_filename(self, filename: str) -> str:
        """Extract course name from filename."""
        # Remove extension
        name = os.path.splitext(filename)[0]
        
        # Remove common suffixes
        patterns_to_remove = [
            r'\s*-?\s*[Vv]ideo\s*[Dd]escriptions?',
            r'\s*-?\s*[Ii]ntro\s*[Tt]ext[Ss]?',
            r'\s*\(\d+\)',  # Remove (2) etc
        ]
        
        for pattern in patterns_to_remove:
            name = re.sub(pattern, '', name, flags=re.IGNORECASE)
        
        return name.strip()
    
    def _find_description(self, descriptions: dict, course_name: str, chapter: int) -> str:
        """Find description for a specific course and chapter."""
        if not descriptions:
            return ''
        
        # Try exact match first
        if course_name in descriptions:
            if chapter in descriptions[course_name]:
                return descriptions[course_name][chapter]
        
        # Try fuzzy match on course name
        course_name_lower = course_name.lower()
        for desc_course, chapters in descriptions.items():
            if desc_course.lower() in course_name_lower or course_name_lower in desc_course.lower():
                if chapter in chapters:
                    return chapters[chapter]
        
        return ''
