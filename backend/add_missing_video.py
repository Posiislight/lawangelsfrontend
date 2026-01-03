"""
Script to add back the missing Legal Service Chapter 1 video.
"""
import os
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'lawangels.settings')
import django
django.setup()

from quiz.cloudflare_service import cloudflare_service
from quiz.video_models import VideoCourse, Video

# Find the JURISDICTION video in Cloudflare
print("Fetching videos from Cloudflare...")
videos = cloudflare_service.list_all_videos()

for v in videos:
    name = v.get('meta', {}).get('name', '') or v.get('name', '')
    if 'JURISDICTION' in name.upper():
        print(f'Found: {name}')
        print(f'UID: {v.get("uid")}')
        print(f'Duration: {v.get("duration")} seconds')
        
        # Add it to Legal Service as Chapter 1
        legal_service = VideoCourse.objects.get(title='Legal Service')
        video, created = Video.objects.update_or_create(
            cloudflare_video_id=v.get('uid'),
            defaults={
                'course': legal_service,
                'title': 'Legal Service Chapter 1 - Jurisdiction, Applicable Law, and Commencing Proceedings',
                'duration_seconds': int(v.get('duration', 0)),
                'thumbnail_url': f"https://videodelivery.net/{v.get('uid')}/thumbnails/thumbnail.jpg",
                'order': 0,  # Will be first
                'is_active': True
            }
        )
        print(f'Video {"created" if created else "updated"}: {video.title}')
        break

# Now reorder all Legal Service videos
print("\nReordering Legal Service videos...")
legal_service = VideoCourse.objects.get(title='Legal Service')
videos = list(legal_service.videos.all().order_by('order', 'id'))

for i, video in enumerate(videos, start=1):
    video.order = i
    video.save()
    print(f"  {i}. {video.title[:60]}")

print(f"\nLegal Service now has {legal_service.total_videos} videos")
