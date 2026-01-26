import re
import os

def parse_txt_content(text_content):
    questions = []
    lines = text_content.split('\n')
    current_question = None
    question_text_lines = []
    in_explanation = False
    
    # Trackers for debugging
    total_found = 0
    dropped_questions = []

    for line_idx, line in enumerate(lines):
        text = line.strip()
        if not text:
            continue
        
        # Check for new question start
        question_match = re.match(r'^Question\s+(\d+)', text, re.IGNORECASE)
        
        if question_match:
            # Save previous question
            if current_question:
                # Fallback: if no options found, try to extract last 5 lines as options
                if not current_question.get('options') and len(question_text_lines) >= 6:
                    labels = ['A', 'B', 'C', 'D', 'E']
                    # Simple heuristic: assume last 5 lines are options A-E
                    option_lines = question_text_lines[-5:]
                    question_text_lines = question_text_lines[:-5]
                    for i, opt in enumerate(option_lines):
                        current_question['options'][labels[i]] = opt

                if question_text_lines:
                    current_question['text'] = ' '.join(question_text_lines)
                
                # VALIDATION CHECK
                if current_question.get('text') and len(current_question.get('options', {})) >= 2:
                    questions.append(current_question)
                else:
                    dropped_questions.append({
                        'number': current_question['number'], 
                        'reason': 'Validation failed',
                        'opts_len': len(current_question.get('options', {})),
                        'text_len': len(current_question.get('text', ''))
                    })
            
            # Start new question
            total_found += 1
            q_num = int(question_match.group(1) or question_match.group(2))
            current_question = {
                'number': q_num,
                'text': '',
                'options': {},
                'correct_answer': '',
                'explanation': '',
            }
            question_text_lines = []
            in_explanation = False
            continue
        
        # If we haven't found a question yet, skip header text
        if not current_question:
            continue

        # PARSING LOGIC (Simplified from import_text_exams.py)
        if text.startswith('A.') or text.startswith('a.'):
             print(f"DEBUG CHECK: {repr(text)}")
        
        # 1. Standalone option (Prioritize this)
        standalone = re.match(r'^([A-Ea-e])[\.\)]\s*(.+)', text, re.IGNORECASE)
        if current_question and standalone:
             if question_text_lines and not current_question.get('options'):
                 current_question['text'] = ' '.join(question_text_lines)
                 question_text_lines = []
             label = standalone.group(1).upper()
             val = standalone.group(2).strip()
             val = re.sub(r'^[\s●\-\.]+', '', val).strip()
             val = re.sub(r'^[A-Ea-e][\.\)]\s*', '', val).strip()
             current_question['options'][label] = val
             in_explanation = False
             continue

        # 2. Check for multi-options on one line: A. B. C. D. E.
        if current_question and re.search(r'\b[A-Ea-e][\.\)]\s', text):
             if question_text_lines:
                 current_question['text'] = ' '.join(question_text_lines)
                 question_text_lines = []
             
             parts = re.split(r'(?=\b[A-Ea-e][\.\)]\s)', text)
             for part in parts:
                 part = part.strip()
                 if not part: continue
                 match = re.match(r'^([A-Ea-e])[\.\)]\s*(.+)', part, re.IGNORECASE | re.DOTALL)
                 if match:
                     label = match.group(1).upper()
                     val = match.group(2).strip()
                     # Clean up
                     val = re.sub(r'^[\s●\-\.]+', '', val).strip()
                     val = re.sub(r'^[A-Ea-e][\.\)]\s*', '', val).strip()
                     current_question['options'][label] = val
             in_explanation = False
             continue

        # Correct answer
        if re.search(r'(?:correct\s+)?(option|answer)\s+(is\s+)?([A-E])', text, re.IGNORECASE) or \
           re.search(r'^([A-E])\s+is\s+correct', text, re.IGNORECASE):
            # Simple regex for now
            m = re.search(r'([A-E])', text[-5:], re.IGNORECASE) # Look at end of line often
            if not m: m = re.search(r'([A-E])', text, re.IGNORECASE)
            # This is hard to replicate exactly without full regex list, but let's assume it works or just focus on options
            in_explanation = True # usually answer key is explanation start
            continue
            
        # Explanation
        if re.match(r'^Explanation', text, re.IGNORECASE):
            in_explanation = True
            continue
            
        if in_explanation and current_question:
            current_question['explanation'] += ' ' + text
            continue
            
        if current_question and not current_question.get('options'):
            question_text_lines.append(text)
            
    # Process last question
    if current_question:
        if not current_question.get('options') and len(question_text_lines) >= 6:
             labels = ['A', 'B', 'C', 'D', 'E']
             option_lines = question_text_lines[-5:]
             question_text_lines = question_text_lines[:-5]
             for i, opt in enumerate(option_lines):
                 current_question['options'][labels[i]] = opt

        if question_text_lines:
             current_question['text'] = ' '.join(question_text_lines)
        
        if current_question.get('text') and len(current_question.get('options', {})) >= 2:
             questions.append(current_question)
        else:
             dropped_questions.append({
                'number': current_question['number'], 
                'reason': 'Validation failed (last)',
                'opts_len': len(current_question.get('options', {})),
                'text_len': len(current_question.get('text', ''))
             })

    return questions, dropped_questions

# Run on files
files = [
    'mock2_flk2_raw_fixed.txt',
    'mock3_flk2_raw_fixed.txt', 
    'mock3_raw_fixed.txt'
]
base_dir = r'c:\Users\adele\lawangelsfrontend\backend\mockexam\txt files'

for fname in files:
    fpath = os.path.join(base_dir, fname)
    if os.path.exists(fpath):
        with open(fpath, 'r', encoding='utf-8', errors='replace') as f:
            content = f.read()
            valid, dropped = parse_txt_content(content)
            print(f"File: {fname}")
            print(f"  Valid: {len(valid)}")
            print(f"  Dropped: {len(dropped)}")
            for d in dropped:
                print(f"    - Question {d['number']}: Options={d['opts_len']}, TextLen={d['text_len']}")
