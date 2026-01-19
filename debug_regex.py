
import re
import os

file_path = 'backend/mockexam/mock exam 1 flk2.txt'
if not os.path.exists(file_path):
    print(f"File not found: {file_path}")
    exit(1)

with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

print(f"Content length: {len(content)}")

idx = content.find('Question 84')
if idx != -1:
    snippet = content[idx:idx+50]
    print(f'Found at {idx}. Snippet: {repr(snippet)}')
    
    # EXACT pattern from import_mock_text.py
    pattern = r'Questio[n]?\s+(\d+)\s*(?:\([^)]*\))?'
    
    match = re.match(pattern, snippet)
    print(f'Matches full pattern? {bool(match)}')
    if match:
        print(f'Groups: {match.groups()}')
    else:
        print('NO MATCH with full pattern')
        
    # Check split behavior locally
    print("\nChecking split behavior around this point:")
    # context around Q83 and Q84
    q83_idx = content.find('Question 83')
    if q83_idx != -1:
        region = content[q83_idx:idx+100]
        print(f"Region length: {len(region)}")
        parts = re.split(pattern, region)
        print(f"Split parts count: {len(parts)}")
        for i, p in enumerate(parts):
            print(f"Part {i}: {repr(p[:50])}...")
else:
    print('String "Question 84" NOT FOUND in content')
