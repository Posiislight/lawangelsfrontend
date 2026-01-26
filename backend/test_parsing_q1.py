import re

fpath = r'c:\Users\adele\lawangelsfrontend\backend\mockexam\txt files\mock3_flk2_raw_fixed.txt'
with open(fpath, 'r', encoding='utf-8', errors='replace') as f:
    lines = f.readlines()[:50]

print(f"Read {len(lines)} lines")

current_question = None
question_text_lines = []

for i, line in enumerate(lines):
    text = line.strip()
    print(f"L{i}: {repr(text)}")
    
    # Header check
    q_match = re.match(r'^(?:Question\s+(\d+)|(\d+)[\.\)])', text, re.IGNORECASE)
    if q_match:
        print(f"  -> MATCH Q START: {q_match.groups()}")
        if current_question:
            print(f"  -> SAVING Q{current_question['number']}")
            print(f"     Options found: {list(current_question['options'].keys())}")
        
        current_question = {'number': q_match.group(1), 'options': {}}
        continue
        
    if not current_question:
        continue
        
    # Option check
    opt_search = re.search(r'\b[A-Ea-e][\.\)]\s', text)
    if opt_search:
        print(f"  -> OPTION SEARCH HIT: {opt_search.group()}")
        # Split logic
        parts = re.split(r'(?=\b[A-Ea-e][\.\)]\s)', text)
        print(f"  -> Split parts: {parts}")
        for part in parts:
            part = part.strip()
            if not part: continue
            m = re.match(r'^([A-Ea-e])[\.\)]\s*(.+)', part, re.IGNORECASE | re.DOTALL)
            if m:
                print(f"     -> FOUND OPTION {m.group(1)}")
                current_question['options'][m.group(1).upper()] = m.group(2)
        continue
        
    # Standalone check
    standalone = re.match(r'^([A-Ea-e])[\.\)]\s*(.+)', text, re.IGNORECASE)
    if standalone:
        print(f"  -> STANDALONE HIT: {standalone.group(1)}")
        current_question['options'][standalone.group(1).upper()] = standalone.group(2)
        continue

if current_question:
    print(f"  -> SAVING LAST Q{current_question['number']}")
    print(f"     Options found: {list(current_question['options'].keys())}")
