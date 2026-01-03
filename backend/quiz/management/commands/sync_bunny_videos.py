"""
Management command to sync videos from Bunny.net Stream.

Fetches all videos from Bunny.net Stream library and creates/updates Video records.

Usage:
    python manage.py sync_bunny_videos
    python manage.py sync_bunny_videos --dry-run
"""
import os
import re
from django.core.management.base import BaseCommand, CommandError
from django.conf import settings
from quiz.bunny_service import bunny_service
from quiz.video_models import VideoCourse, Video


class Command(BaseCommand):
    help = 'Sync videos from Bunny.net Stream and create Video records'

    def add_arguments(self, parser):
        parser.add_argument(
            '--dry-run',
            action='store_true',
            help='Show what would be created without actually creating',
        )

    def handle(self, *args, **options):
        dry_run = options['dry_run']
        
        if dry_run:
            self.stdout.write(self.style.WARNING('DRY RUN - No changes will be made'))
        
        # Fetch videos from Bunny.net
        self.stdout.write('Fetching videos from Bunny.net Stream...')
        
        try:
            videos = bunny_service.list_all_videos()
        except ValueError as e:
            raise CommandError(str(e))
        except Exception as e:
            raise CommandError(f'Failed to fetch videos from Bunny.net: {e}')
        
        self.stdout.write(self.style.SUCCESS(f'Found {len(videos)} videos in Bunny.net Stream'))
        
        # Group videos by course
        courses_dict = {}
        
        for video_data in videos:
            parsed = bunny_service.parse_video_info(video_data)
            course_name = parsed['course_name']
            
            if course_name not in courses_dict:
                courses_dict[course_name] = []
            
            courses_dict[course_name].append(parsed)
        
        # Sort videos within each course by chapter number
        for course_name in courses_dict:
            courses_dict[course_name].sort(key=lambda x: x['chapter_number'] if x['chapter_number'] > 0 else 999)
        
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
            from django.utils.text import slugify
            course_slug = slugify(course_name)[:50]
            
            # Try to find existing course by slug, then create
            try:
                course = VideoCourse.objects.get(slug=course_slug)
                course_created = False
            except VideoCourse.DoesNotExist:
                course = VideoCourse.objects.create(
                    title=course_name[:200],
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
                video_id = video_info['video_id']
                
                # Check if video exists by bunny_video_id
                try:
                    video = Video.objects.get(bunny_video_id=video_id)
                    video_created = False
                except Video.DoesNotExist:
                    video = Video(bunny_video_id=video_id)
                    video_created = True
                
                # Update video fields
                video.course = course
                video.title = video_info['title'][:200]
                video.duration_seconds = video_info['duration_seconds']
                video.thumbnail_url = video_info['thumbnail_url']
                video.order = idx + 1
                video.is_active = True
                video.video_platform = Video.PLATFORM_BUNNY
                video.save()
                
                if video_created:
                    created_videos += 1
                    self.stdout.write(self.style.SUCCESS(f'  ✓ Created: {video_info["title"][:50]}'))
                else:
                    updated_videos += 1
                    self.stdout.write(f'  ↻ Updated: {video_info["title"][:50]}')
        
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
