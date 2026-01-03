"""Check updated videos"""
import os
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'lawangels.settings')
import django
django.setup()
from quiz.video_models import VideoCourse, Video

print("=" * 80)
print("UPDATED VIDEO LIBRARY")
print("=" * 80)

for course in VideoCourse.objects.all().order_by('title'):
    print(f"\n📚 {course.title} ({course.videos.count()} videos)")
    for video in course.videos.all().order_by('order')[:3]:
        has_desc = "✓" if video.description else ""
        print(f"   {video.order}. {video.title[:55]}... {has_desc}")
    if course.videos.count() > 3:
        print(f"   ... and {course.videos.count() - 3} more")

with_desc = Video.objects.exclude(description='').exclude(description__isnull=True).count()
print(f"\nTotal: {Video.objects.count()} videos, {with_desc} with descriptions")
