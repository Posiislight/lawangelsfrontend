"""
Script to update video titles and descriptions from Word documents.
Parses Word docs and updates Video records with proper titles and descriptions.
"""
import os
import re
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'lawangels.settings')
django.setup()

import docx
from quiz.video_models import VideoCourse, Video

# Mapping of Word document filenames to course names
COURSE_MAPPING = {
    'Business law - video Description.docx': 'Business Law',
    'Constitutional law Video Description.docx': 'Constitutional Law', 
    'Contract Law - Video descriptions.docx': 'Contract Law',
    'Corrected Criminal Practice.docx': 'Criminal Practice',
    'DISPUTE RESOLUTION INTRO TEXTS.docx': 'Dispute Resolution',
    'LAND LAW INTRO TEXT.docx': 'Land Law',
    'Property Practice.docx': 'Property Practice',
    'Solicitors Account .docx': 'Solicitors Account',
    "Solicitors' Account .docx": 'Solicitors Account',
    'TAXATION INTRO TEXT.docx': 'Tax Law',
    'TORTS.docx': 'Torts',
    'professional ethics.docx': 'Professional Ethics',
}


def parse_document(filepath):
    """
    Parse a Word document to extract video titles and descriptions.
    Returns: dict of {chapter_number: {'title': str, 'description': str}}
    """
    results = {}
    
    try:
        doc = docx.Document(filepath)
    except Exception as e:
        print(f"  Error reading {filepath}: {e}")
        return results
    
    current_chapter = None
    current_title = None
    current_description = []
    
    for para in doc.paragraphs:
        text = para.text.strip()
        
        if not text:
            continue
        
        # Check for video/chapter heading patterns
        # Pattern: "Video 1 – Title" or "Video 1 - Title"
        video_match = re.match(
            r'^[Vv]ideo\s+(\d+)\s*[-–—:]\s*(.+)$',
            text
        )
        # Pattern: "Chapter 1 - Title"
        chapter_match = re.match(
            r'^[Cc]hapter\s+(\d+)\s*[-–—:]\s*(.+)$',
            text
        )
        
        match = video_match or chapter_match
        
        if match:
            # Save previous chapter if exists
            if current_chapter is not None and current_title:
                results[current_chapter] = {
                    'title': current_title,
                    'description': ' '.join(current_description).strip()
                }
            
            # Start new chapter
            current_chapter = int(match.group(1))
            current_title = match.group(2).strip()
            current_description = []
        elif current_chapter is not None:
            # Skip headers
            if text.lower() in ['about this video', 'key areas covered', 'key areas covered:']:
                continue
            # Add to description
            current_description.append(text)
    
    # Save last chapter
    if current_chapter is not None and current_title:
        results[current_chapter] = {
            'title': current_title,
            'description': ' '.join(current_description).strip()
        }
    
    return results


def extract_chapter_from_title(title):
    """Extract chapter number from video title"""
    # Try "Chapter X" pattern
    match = re.search(r'[Cc]hapter\s*(\d+)', title)
    if match:
        return int(match.group(1))
    
    # Try trailing number pattern (e.g., "Contract Law 4.mp4")
    match = re.search(r'\s(\d+)(?:\s*\.(?:mp4|mov|avi|mkv))?$', title, re.IGNORECASE)
    if match:
        return int(match.group(1))
    
    return 0


def main():
    desc_folder = r'C:\Users\adele\lawangelsfrontend\backend\video_descriptions'
    
    print("=" * 70)
    print("LOADING VIDEO DESCRIPTIONS FROM WORD DOCUMENTS")
    print("=" * 70)
    
    # Parse all documents
    all_descriptions = {}
    
    for filename, course_name in COURSE_MAPPING.items():
        filepath = os.path.join(desc_folder, filename)
        if not os.path.exists(filepath):
            continue
        
        print(f"\n📄 {filename} -> {course_name}")
        chapters = parse_document(filepath)
        
        if chapters:
            # If course already has entries, merge them
            if course_name in all_descriptions:
                all_descriptions[course_name].update(chapters)
            else:
                all_descriptions[course_name] = chapters
            
            for ch_num, ch_data in sorted(chapters.items()):
                print(f"   Chapter {ch_num}: {ch_data['title'][:50]}...")
        else:
            print("   No chapters found")
    
    print("\n" + "=" * 70)
    print("UPDATING VIDEO RECORDS")
    print("=" * 70)
    
    updated_count = 0
    
    for course in VideoCourse.objects.all().order_by('title'):
        print(f"\n📚 {course.title}")
        
        course_descriptions = all_descriptions.get(course.title, {})
        
        for video in course.videos.all().order_by('order'):
            # Extract chapter number from video title
            chapter_num = extract_chapter_from_title(video.title)
            
            # Get description data if available
            desc_data = course_descriptions.get(chapter_num, {})
            chapter_title = desc_data.get('title', '')
            description = desc_data.get('description', '')
            
            if chapter_title or description:
                # Create new formatted title
                if chapter_title:
                    new_title = f"{course.title} Chapter {chapter_num} - {chapter_title}"
                else:
                    new_title = video.title
                
                # Truncate if too long
                new_title = new_title[:200]
                
                # Update video
                old_title = video.title
                video.title = new_title
                if description:
                    video.description = description[:2000]
                video.save()
                
                updated_count += 1
                print(f"   ✓ Chapter {chapter_num}: {new_title[:55]}...")
            else:
                print(f"   - Chapter {chapter_num}: No description found")
    
    print("\n" + "=" * 70)
    print(f"UPDATE COMPLETE! {updated_count} videos updated with titles/descriptions")
    print("=" * 70)


if __name__ == '__main__':
    main()
