
import zipfile
import xml.etree.ElementTree as ET
import json
import os
import re

def extract_quotes_xml():
    file_path = r'c:\Users\adele\lawangelsfrontend\backend\motivational quotes\INSPIRATIONAL QUOTES WITHOUT SCRIPTURES.docx'
    
    if not os.path.exists(file_path):
        print(f"File not found: {file_path}")
        return

    try:
        with zipfile.ZipFile(file_path, 'r') as z:
            xml_content = z.read('word/document.xml')
            tree = ET.fromstring(xml_content)
            
            # Namespace for Word
            ns = {'w': 'http://schemas.openxmlformats.org/wordprocessingml/2006/main'}
            
            quotes = []
            for p in tree.findall('.//w:p', ns):
                texts = [node.text for node in p.findall('.//w:t', ns) if node.text]
                full_text = ''.join(texts).strip()
                if full_text:
                     # Basic cleaning
                    cleaned_text = re.sub(r'^\d+[\.\)]\s*', '', full_text)
                    if cleaned_text:
                        quotes.append(cleaned_text)
            
            with open('quotes.json', 'w', encoding='utf-8') as f:
                json.dump(quotes, f, indent=2)
            print("Quotes saved to quotes.json")
            
    except Exception as e:
        print(f"Error reading docx xml: {e}")

if __name__ == "__main__":
    extract_quotes_xml()
