"""
Script to extract table of contents from PDF textbooks using PyPDF2
"""
import os
import json

try:
    from PyPDF2 import PdfReader
except ImportError:
    print("Installing PyPDF2...")
    os.system("pip install PyPDF2")
    from PyPDF2 import PdfReader

TEXTBOOKS_DIR = os.path.join(os.path.dirname(__file__), 'textbooks')

def extract_toc_from_pdf(pdf_path):
    """Extract table of contents/bookmarks from a PDF file."""
    try:
        reader = PdfReader(pdf_path)
        
        # Get outlines (bookmarks/TOC)
        outlines = reader.outline
        
        if outlines:
            print(f"\n=== TOC from bookmarks ===")
            def process_outline(outline_list, level=0):
                chapters = []
                for item in outline_list:
                    if isinstance(item, list):
                        # Nested bookmarks
                        chapters.extend(process_outline(item, level + 1))
                    else:
                        try:
                            page_num = reader.get_destination_page_number(item) + 1
                            title = item.title
                            chapters.append({
                                'title': title,
                                'page': page_num,
                                'level': level
                            })
                            print(f"  {'  ' * level}{title} -> Page {page_num}")
                        except Exception as e:
                            print(f"  Error getting page for bookmark: {e}")
                return chapters
            
            return process_outline(outlines)
        else:
            print("  No bookmarks/outline found in PDF")
            
            # Try to find TOC from first few pages
            print(f"  Total pages: {len(reader.pages)}")
            
            # Read first 5 pages to look for table of contents
            for i in range(min(5, len(reader.pages))):
                text = reader.pages[i].extract_text()
                if text and ('contents' in text.lower() or 'chapter' in text.lower()):
                    print(f"\n  --- Page {i+1} text snippet ---")
                    print(text[:2000])
                    print("  ---")
            
            return []
            
    except Exception as e:
        print(f"  Error reading PDF: {e}")
        return []

def main():
    print("=" * 60)
    print("Extracting Table of Contents from PDF Textbooks")
    print("=" * 60)
    
    if not os.path.exists(TEXTBOOKS_DIR):
        print(f"Textbooks directory not found: {TEXTBOOKS_DIR}")
        return
    
    all_chapters = {}
    
    for filename in sorted(os.listdir(TEXTBOOKS_DIR)):
        if filename.endswith('.pdf'):
            pdf_path = os.path.join(TEXTBOOKS_DIR, filename)
            print(f"\n{'='*60}")
            print(f"Processing: {filename}")
            print(f"{'='*60}")
            
            chapters = extract_toc_from_pdf(pdf_path)
            all_chapters[filename] = chapters
    
    # Output as JSON for easy copy-paste
    print("\n\n" + "=" * 60)
    print("JSON OUTPUT FOR MIGRATION:")
    print("=" * 60)
    print(json.dumps(all_chapters, indent=2))

if __name__ == '__main__':
    main()
