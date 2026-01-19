
import re
import os

file_path = 'backend/mockexam/mock exam 1 flk2.txt'

def parse_lines(q_num, lines):
    question_data = {
        'number': q_num,
        'text': '',
        'options': {},
        'correct_answer': None,
        'explanation': '',
        'topic': 'criminal_law',
    }
    
    current_section = 'question'
    question_lines = []
    explanation_lines = []
    expecting_answer_letter = False
    
    print(f"DEBUG Q{q_num}: parsing {len(lines)} lines")
    
    for line in lines:
        line_original = line
        line = line.strip()
        if not line:
            continue
            
        print(f"[{current_section.upper()}] Line: {repr(line)}")
            
        # Check if previous line was just "Answer:" and this line starts with a letter
        if expecting_answer_letter and not question_data['correct_answer']:
            letter_match = re.match(r'^([A-E])[\.\s]', line)
            if letter_match:
                print(f"  -> Found Answer (expecting): {letter_match.group(1)}")
                question_data['correct_answer'] = letter_match.group(1).upper()
                current_section = 'answer'
                expecting_answer_letter = False
                continue
            expecting_answer_letter = False
        
        if re.match(r'^Question\s+\d+', line):
            print("  -> Found next question, breaking")
            break
            
        answer_match = None
        # ... skipped regexes for brevity in this manual copy ...
        # Assume regexes work as tested previously
        
        # Check for "Answer:" alone
        if re.match(r'^Answer\s*:\s*$', line, re.IGNORECASE) and not question_data['correct_answer']:
            print("  -> Found Answer: header")
            expecting_answer_letter = True
            current_section = 'answer'
            continue
        
        if re.match(r'^Options\s*:?\s*$', line, re.IGNORECASE):
            print("  -> Found Options: header")
            current_section = 'options'
            continue
            
        option_match = re.match(r'^[\u2022\uf0b7\u2023\u25e6\u25aa\u25ab\u2219\u25cf\-\*]*\s*([A-Ea-e])[\.\)]\s*(.+)', line)
        if not option_match and current_section == 'options':
            option_match = re.match(r'^.*?([A-E])[\.\)]\s*(.+)', line)
            if option_match: print("  -> Matched using RELAXED regex")

        if option_match and current_section in ['question', 'options']:
            print(f"  -> MATCHED OPTION: {option_match.group(1)}")
            current_section = 'options'
            label = option_match.group(1).upper()
            text = option_match.group(2).strip()
            question_data['options'][label] = text
            continue
            
        # ... rest of logic
        
    print(f"Final Options: {len(question_data['options'])} Keys: {list(question_data['options'].keys())}")

with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

question_pattern = r'Questio[n]?\s+(\d+)\s*(?:\([^)]*\))?'
parts = re.split(question_pattern, content)

for i in range(1, len(parts), 2):
    if i + 1 >= len(parts): break
    q_num = int(parts[i])
    if q_num == 84:
        q_content = parts[i + 1].strip()
        print(f"Found Q84 content length: {len(q_content)}")
        parse_lines(84, q_content.split('\n'))
        break
else:
    print("Q84 NOT FOUND in split")
