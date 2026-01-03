"""
Bunny.net Stream API Service

Handles all interactions with Bunny.net Stream API for video management.
"""
import requests
from django.conf import settings
import logging

logger = logging.getLogger(__name__)


class BunnyStreamService:
    """Service for interacting with Bunny.net Stream API."""
    
    BASE_URL = "https://video.bunnycdn.com/library"
    
    def __init__(self):
        self.library_id = settings.BUNNY_STREAM_LIBRARY_ID
        self.api_key = settings.BUNNY_STREAM_API_KEY
        self.cdn_hostname = settings.BUNNY_STREAM_CDN_HOSTNAME
        
        if not self.library_id or not self.api_key:
            logger.warning("Bunny.net credentials not configured. Set BUNNY_STREAM_LIBRARY_ID and BUNNY_STREAM_API_KEY in .env")
    
    @property
    def headers(self):
        return {
            "AccessKey": self.api_key,
            "Content-Type": "application/json"
        }
    
    @property
    def library_url(self):
        return f"{self.BASE_URL}/{self.library_id}"
    
    def list_all_videos(self, page=1, items_per_page=100):
        """
        Fetch all videos from Bunny.net Stream library.
        Returns list of video objects with: guid, title, length, thumbnailFileName, etc.
        """
        if not self.library_id or not self.api_key:
            raise ValueError("Bunny.net credentials not configured")
        
        all_videos = []
        current_page = page
        
        while True:
            url = f"{self.library_url}/videos?page={current_page}&itemsPerPage={items_per_page}"
            
            response = requests.get(url, headers=self.headers)
            
            if not response.ok:
                try:
                    error_data = response.json()
                    raise ValueError(f"Bunny.net API error ({response.status_code}): {error_data}")
                except:
                    raise ValueError(f"Bunny.net API error ({response.status_code}): {response.text}")
            
            data = response.json()
            
            videos = data.get('items', [])
            all_videos.extend(videos)
            
            # Check if there are more pages
            total_items = data.get('totalItems', 0)
            
            if len(all_videos) >= total_items or len(videos) < items_per_page:
                break
            
            current_page += 1
        
        logger.info(f"Fetched {len(all_videos)} videos from Bunny.net Stream")
        return all_videos
    
    def get_video(self, video_guid: str):
        """
        Get details for a single video.
        """
        url = f"{self.library_url}/videos/{video_guid}"
        
        response = requests.get(url, headers=self.headers)
        
        if not response.ok:
            raise ValueError(f"Bunny.net API error ({response.status_code}): {response.text}")
        
        return response.json()
    
    def get_embed_url(self, video_guid: str) -> str:
        """
        Get the embed URL for a video.
        Format: https://iframe.mediadelivery.net/embed/{libraryId}/{videoId}
        """
        return f"https://iframe.mediadelivery.net/embed/{self.library_id}/{video_guid}"
    
    def get_direct_play_url(self, video_guid: str) -> str:
        """
        Get the direct HLS playback URL for a video.
        Format: https://{cdnHostname}/{videoId}/playlist.m3u8
        """
        return f"https://{self.cdn_hostname}/{video_guid}/playlist.m3u8"
    
    def get_thumbnail_url(self, video_guid: str) -> str:
        """
        Get the thumbnail URL for a video.
        """
        return f"https://{self.cdn_hostname}/{video_guid}/thumbnail.jpg"
    
    def parse_video_info(self, video_data: dict) -> dict:
        """
        Parse Bunny.net video data into a format suitable for our Video model.
        
        Extracts:
        - video_id: The GUID
        - title: Video title
        - duration_seconds: Length in seconds
        - thumbnail_url: Thumbnail URL
        - course_name: Extracted from video title
        - chapter_number: Extracted chapter number
        """
        guid = video_data.get('guid', '')
        title = video_data.get('title', '')
        
        # Parse the video title to extract course and chapter
        course_name, chapter_number = self._parse_video_title(title)
        
        # Get duration (Bunny returns length in seconds)
        duration_seconds = int(video_data.get('length', 0))
        
        # Get thumbnail URL
        thumbnail_url = self.get_thumbnail_url(guid) if guid else ''
        
        return {
            'video_id': guid,
            'title': title,
            'duration_seconds': duration_seconds,
            'thumbnail_url': thumbnail_url,
            'embed_url': self.get_embed_url(guid),
            'course_name': course_name,
            'chapter_number': chapter_number,
            'raw_data': video_data
        }
    
    def _parse_video_title(self, title: str) -> tuple:
        """
        Parse video title to extract course name and chapter number.
        Maps to the official course series:
        
        FLK 1: Business Law, Constitutional Law, Contract Law, Dispute Resolution,
               Legal Service, Legal System, Torts
        
        FLK 2: Criminal Practice, Land Law, Professional Ethics, Property Practice,
               Solicitors Account, Tax Law/Taxation, Trusts
        """
        import re
        
        if not title:
            return ('Unknown', 0)
        
        title_lower = title.lower()
        
        # Extract chapter number first
        chapter_match = re.search(r'chapter\s*(\d+)|chap\s*(\d+)|\s(\d+)(?:\s*[-.]|$)', title, re.IGNORECASE)
        chapter_number = 0
        if chapter_match:
            chapter_number = int(chapter_match.group(1) or chapter_match.group(2) or chapter_match.group(3))
        
        # FLK 1 Courses
        if 'business' in title_lower and 'law' in title_lower:
            return ('Business Law', chapter_number)
        
        if 'constitutional' in title_lower or 'constitution law' in title_lower:
            return ('Constitutional Law', chapter_number)
        
        if 'contract' in title_lower:
            return ('Contract Law', chapter_number)
        
        if 'dispute' in title_lower or 'resolution' in title_lower:
            return ('Dispute Resolution', chapter_number)
        
        if 'legal service' in title_lower or 'legal services' in title_lower:
            return ('Legal Service', chapter_number)
        
        if 'legal system' in title_lower or 'legal systems' in title_lower:
            return ('Legal System', chapter_number)
        
        if 'tort' in title_lower:
            return ('Torts', chapter_number)
        
        # FLK 2 Courses
        if 'criminal' in title_lower and 'practice' in title_lower:
            return ('Criminal Practice', chapter_number)
        
        if 'land' in title_lower and 'law' in title_lower:
            return ('Land Law', chapter_number)
        
        if 'professional' in title_lower and 'ethics' in title_lower:
            return ('Professional Ethics', chapter_number)
        if 'profesional' in title_lower and 'ethics' in title_lower:  # Handle typo
            return ('Professional Ethics', chapter_number)
        
        if 'property' in title_lower and 'practice' in title_lower:
            return ('Property Practice', chapter_number)
        
        if 'solicitor' in title_lower and 'account' in title_lower:
            return ('Solicitors Account', chapter_number)
        
        if 'tax' in title_lower:
            return ('Tax Law', chapter_number)
        
        if 'trust' in title_lower:
            return ('Trusts', chapter_number)
        
        # Default: try to clean up the title
        return (title.split(' Chapter')[0].split(' chapter')[0].strip(), chapter_number)


# Singleton instance
bunny_service = BunnyStreamService()
