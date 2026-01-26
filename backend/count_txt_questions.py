import re
import os

files = [
    'mock exam 1 flk2.txt',
    'mock1_raw.txt',
    'mock2_flk2_raw.txt',
    'mock2_raw.txt',
    'mock3_flk2_raw.txt',
    'mock3_raw.txt'
]

base_dir = r'c:\Users\adele\lawangelsfrontend\backend\mockexam\txt files'

for filename in files:
    filepath = os.path.join(base_dir, filename)
    try:
        with open(filepath, 'r', encoding='utf-8', errors='replace') as f:
            content = f.read()
            # Count "Question X" patterns
            matches = re.findall(r'^Question\s+(\d+)', content, re.MULTILINE | re.IGNORECASE)
            print(f"{filename}: Found {len(matches)} questions. Max number: {max(map(int, matches)) if matches else 0}")
            
            # Check for duplicates or missing
            nums = sorted(list(map(int, matches)))
            expected = list(range(1, len(nums) + 1))
            missing = [n for n in range(1, 91) if n not in nums]
            if missing:
                print(f"  Missing numbers: {missing}")
    except Exception as e:
        print(f"Error reading {filename}: {e}")
