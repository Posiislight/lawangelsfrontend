import re
import os

def normalize_file(filepath):
    with open(filepath, 'r', encoding='utf-8', errors='replace') as f:
        lines = f.readlines()

    new_lines = []
    question_counter = 0
    
    # Regex to identify question start
    # specific patterns observed: "Question 1", "Question 1 (Topic)"
    q_pattern = re.compile(r'^(Question\s+)\d+(.*)', re.IGNORECASE)

    # Regex to fix missing dots in options: "A Option" -> "A. Option"
    # Matches A-E at start of line, NOT followed by . or ), followed by space
    opt_pattern = re.compile(r'^([A-E])(?![.\)])(\s+.*)')

    for line in lines:
        stripped = line.strip()
        
        # Renumber questions
        m_q = q_pattern.match(line) # match checks start of string
        if m_q:
            question_counter += 1
            # reconstruct line: "Question " + new_num + rest
            # But wait, if we have spurious "Question 1" lines without content, this will number them.
            # We can't easily detect spurious ones without parsing.
            # However, if the file is mostly clean, this helps duplicates.
            # Let's just renumber for now.
            prefix = m_q.group(1)
            rest = m_q.group(2)
            new_lines.append(f"{prefix}{question_counter}{rest}\n")
            continue

        # Fix options
        m_opt = opt_pattern.match(line)
        if m_opt and len(line) < 500: # heuristic to avoid fixing random sentences starting with A
            # Check if it looks like an option key or short text
            # e.g. "A Belief..."
            # line content:
            new_lines.append(f"{m_opt.group(1)}.{m_opt.group(2)}\n")
            continue
        
        new_lines.append(line)
    
    # Save to _fixed.txt
    new_filepath = filepath.replace('.txt', '_fixed.txt')
    with open(new_filepath, 'w', encoding='utf-8') as f:
        f.writelines(new_lines)
    
    print(f"Processed {filepath} -> {new_filepath}")
    print(f"  Renumbered {question_counter} questions.")

files = [
    'mock2_flk2_raw.txt',
    'mock3_flk2_raw.txt',
    'mock3_raw.txt'
]
base_dir = r'c:\Users\adele\lawangelsfrontend\backend\mockexam\txt files'

for fname in files:
    fpath = os.path.join(base_dir, fname)
    if os.path.exists(fpath):
        normalize_file(fpath)
