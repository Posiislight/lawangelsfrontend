import re
import os

def fix_numbering(filepath):
    with open(filepath, 'r', encoding='utf-8', errors='replace') as f:
        lines = f.readlines()

    new_lines = []
    question_counter = 0
    # Regex for Question header
    q_re = re.compile(r'^(Question\s+)\d+(.*)', re.IGNORECASE)

    for line in lines:
        m = q_re.match(line)
        if m:
            question_counter += 1
            # Preserve the title part (e.g. " (LAND LAW)")
            new_lines.append(f"{m.group(1)}{question_counter}{m.group(2)}\n")
        else:
            new_lines.append(line)
    
    with open(filepath, 'w', encoding='utf-8') as f:
        f.writelines(new_lines)
    
    print(f"Renumbered {filepath}: {question_counter} questions.")

files = [
    'mock2_flk2_raw_fixed.txt',
    'mock3_flk2_raw_fixed.txt'
]
base_dir = r'c:\Users\adele\lawangelsfrontend\backend\mockexam\txt files'

for fname in files:
    fpath = os.path.join(base_dir, fname)
    if os.path.exists(fpath):
        fix_numbering(fpath)
