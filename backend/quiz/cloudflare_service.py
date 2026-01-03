"""
Cloudflare Stream API Service

Handles all interactions with Cloudflare Stream API for video management.
"""
import requests
from django.conf import settings
import logging

logger = logging.getLogger(__name__)


class CloudflareStreamService:
    """Service for interacting with Cloudflare Stream API."""
    
    BASE_URL = "https://api.cloudflare.com/client/v4/accounts"
    
    def __init__(self):
        self.account_id = settings.CLOUDFLARE_ACCOUNT_ID
        self.api_token = settings.CLOUDFLARE_API_TOKEN
        
        if not self.account_id or not self.api_token:
            logger.warning("Cloudflare credentials not configured. Set CLOUDFLARE_ACCOUNT_ID and CLOUDFLARE_API_TOKEN in .env")
    
    @property
    def headers(self):
        return {
            "Authorization": f"Bearer {self.api_token}",
            "Content-Type": "application/json"
        }
    
    @property
    def stream_url(self):
        return f"{self.BASE_URL}/{self.account_id}/stream"
    
    def list_all_videos(self):
        """
        Fetch all videos from Cloudflare Stream.
        Returns list of video objects with: uid, name, duration, thumbnail, created, etc.
        """
        if not self.account_id or not self.api_token:
            raise ValueError("Cloudflare credentials not configured")
        
        all_videos = []
        page = 1
        per_page = 100
        
        while True:
            url = f"{self.stream_url}?per_page={per_page}&page={page}"
            
            response = requests.get(url, headers=self.headers)
            
            # Check for errors with detailed message
            if not response.ok:
                try:
                    error_data = response.json()
                    errors = error_data.get('errors', [])
                    error_msgs = [e.get('message', str(e)) for e in errors]
                    raise ValueError(f"Cloudflare API error ({response.status_code}): {'; '.join(error_msgs)}")
                except ValueError:
                    raise
                except:
                    raise ValueError(f"Cloudflare API error ({response.status_code}): {response.text}")
            
            data = response.json()
            
            if not data.get('success'):
                raise ValueError(f"Cloudflare API error: {data.get('errors')}")
            
            videos = data.get('result', [])
            all_videos.extend(videos)
            
            # Check if there are more pages
            result_info = data.get('result_info', {})
            total_count = result_info.get('total_count', 0)
            
            if len(all_videos) >= total_count or len(videos) < per_page:
                break
            
            page += 1
        
        logger.info(f"Fetched {len(all_videos)} videos from Cloudflare Stream")
        return all_videos
    
    def get_video(self, video_uid: str):
        """
        Get details for a single video.
        """
        url = f"{self.stream_url}/{video_uid}"
        
        response = requests.get(url, headers=self.headers)
        response.raise_for_status()
        
        data = response.json()
        
        if not data.get('success'):
            raise ValueError(f"Cloudflare API error: {data.get('errors')}")
        
        return data.get('result')
    
    def parse_video_info(self, video_data: dict) -> dict:
        """
        Parse Cloudflare video data into a format suitable for our Video model.
        
        Extracts:
        - cloudflare_video_id: The UID
        - title: Video name
        - duration_seconds: Duration in seconds
        - thumbnail_url: Thumbnail URL
        - course_name: Extracted from video name (e.g., "Contract Law" from "Contract Law Chapter 1")
        - chapter_number: Extracted chapter number
        """
        name = video_data.get('meta', {}).get('name', '') or video_data.get('name', '')
        
        # Parse the video name to extract course and chapter
        # Expected format: "Course Name Chapter X" or "Course Name - Chapter X"
        course_name, chapter_number = self._parse_video_name(name)
        
        # Get duration (Cloudflare returns in seconds as float)
        duration = video_data.get('duration', 0)
        duration_seconds = int(duration) if duration else 0
        
        # Get thumbnail URL
        uid = video_data.get('uid', '')
        thumbnail_url = f"https://videodelivery.net/{uid}/thumbnails/thumbnail.jpg" if uid else ''
        
        return {
            'cloudflare_video_id': uid,
            'title': name,
            'duration_seconds': duration_seconds,
            'thumbnail_url': thumbnail_url,
            'course_name': course_name,
            'chapter_number': chapter_number,
            'raw_data': video_data
        }
    
    def _parse_video_name(self, name: str) -> tuple:
        """
        Parse video name to extract course name and chapter number.
        
        Handles formats like:
        - "Contract Law Chapter 1"
        - "Contract Law - Chapter 1"
        - "Criminal Practice Chapter 02"
        - "Torts Chapter One"
        
        Returns: (course_name, chapter_number)
        """
        import re
        
        if not name:
            return ('Unknown', 0)
        
        # Normalize the name
        name = name.strip()
        
        # Try to extract chapter number
        # Pattern 1: "Course Name Chapter X" or "Course Name - Chapter X"
        pattern = r'^(.+?)[\s\-]*[Cc]hapter[\s\-]*(\d+|[Oo]ne|[Tt]wo|[Tt]hree|[Ff]our|[Ff]ive|[Ss]ix|[Ss]even|[Ee]ight|[Nn]ine|[Tt]en)'
        match = re.match(pattern, name, re.IGNORECASE)
        
        if match:
            course_name = match.group(1).strip().rstrip('-').strip()
            chapter_str = match.group(2).lower()
            
            # Convert word numbers to integers
            word_to_num = {
                'one': 1, 'two': 2, 'three': 3, 'four': 4, 'five': 5,
                'six': 6, 'seven': 7, 'eight': 8, 'nine': 9, 'ten': 10
            }
            
            if chapter_str.isdigit():
                chapter_number = int(chapter_str)
            else:
                chapter_number = word_to_num.get(chapter_str, 0)
            
            return (course_name, chapter_number)
        
        # If no chapter found, use the whole name as course name
        return (name, 0)


# Singleton instance
cloudflare_service = CloudflareStreamService()
