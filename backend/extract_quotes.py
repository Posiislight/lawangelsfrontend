
import docx
import json
import os
import re

def extract_quotes():
    file_path = r'c:\Users\adele\lawangelsfrontend\backend\motivational quotes\INSPIRATIONAL QUOTES WITHOUT SCRIPTURES.docx'
    
    if not os.path.exists(file_path):
        print(f"File not found: {file_path}")
        return

    try:
        doc = docx.Document(file_path)
        quotes = []
        for para in doc.paragraphs:
            text = para.text.strip()
            if text:
                # Basic cleaning: remove numbering if present (e.g. "1. Quote")
                cleaned_text = re.sub(r'^\d+[\.\)]\s*', '', text)
                quotes.append(cleaned_text)
        
        print(json.dumps(quotes, indent=2))
        
    except Exception as e:
        print(f"Error reading docx: {e}")

if __name__ == "__main__":
    extract_quotes()
