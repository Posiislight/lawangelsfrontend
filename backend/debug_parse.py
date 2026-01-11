from docx import Document
import re

doc = Document('mockexam/MOCK 1 ( NO ANALYSIS).docx')
questions = []
current_question = None
question_text_lines = []
in_explanation = False

for para in doc.paragraphs:
    text = para.text.strip()
    if not text:
        continue
    
    # Skip headers/titles
    if text.upper().startswith('MOCK') or text.upper().startswith('FLK'):
        continue
    
    # Check for "Question N" pattern
    question_match = re.match(r'^Question\s+(\d+)\s*(?:\([^)]*\))?', text, re.IGNORECASE)
    if question_match:
        # Save previous question if exists
        if current_question:
            if question_text_lines:
                current_question['text'] = ' '.join(question_text_lines)
            questions.append(current_question)
        
        q_num = int(question_match.group(1))
        current_question = {
            'number': q_num,
            'text': '',
            'options': {},
            'correct_answer': None,
            'explanation': '',
        }
        question_text_lines = []
        in_explanation = False
        continue
    
    # Check if paragraph contains options (might have multiple options in one paragraph)
    if current_question and re.search(r'\b[A-E]\.\s', text):
        # Save question text first
        if question_text_lines:
            current_question['text'] = ' '.join(question_text_lines)
            question_text_lines = []
        
        # Split the paragraph into individual options
        option_parts = re.split(r'(?=\b[A-E]\.\s)', text)
        for part in option_parts:
            part = part.strip()
            if not part:
                continue
            option_match = re.match(r'^([A-E])\.\s*(.+)', part, re.IGNORECASE | re.DOTALL)
            if option_match:
                label = option_match.group(1).upper()
                option_text = option_match.group(2).strip()
                current_question['options'][label] = option_text
        in_explanation = False
        continue
    
    # Check for correct answer patterns
    answer_patterns = [
        r'(?:The\s+)?correct\s+(?:option|answer)\s+is\s+([A-E])',
        r'([A-E])\s+is\s+(?:the\s+)?correct\s+(?:option|answer)',
        r'^Option\s+([A-E])\s+is\s+correct',
        r'^([A-E])\s+is\s+correct',
        r'Answer[:\s]+([A-E])',
        r'^([A-E])\s+is\s+the\s+correct\s+option',
    ]
    answer_found = False
    for pattern in answer_patterns:
        answer_match = re.search(pattern, text, re.IGNORECASE)
        if answer_match and current_question:
            current_question['correct_answer'] = answer_match.group(1).upper()
            answer_found = True
            break
    
    if answer_found:
        continue
    
    # Check for explanation header
    if re.match(r'^Explanation\s*:?\s*$', text, re.IGNORECASE) and current_question:
        in_explanation = True
        continue
    
    # Check for inline explanation
    explanation_match = re.match(r'^Explanation[:\s]+(.+)', text, re.IGNORECASE)
    if explanation_match and current_question:
        current_question['explanation'] = explanation_match.group(1)
        in_explanation = True
        continue
    
    # Check for "Option X is incorrect/correct" explanation lines
    if current_question and re.match(r'^Option\s+[A-E]\s+is\s+(?:in)?correct', text, re.IGNORECASE):
        if current_question['explanation']:
            current_question['explanation'] += ' ' + text
        else:
            current_question['explanation'] = text
        in_explanation = True
        continue
    
    # If we're in explanation mode, collect explanation text
    if in_explanation and current_question:
        if current_question['explanation']:
            current_question['explanation'] += ' ' + text
        else:
            current_question['explanation'] = text
        continue
    
    # If we have a current question but no options yet, this is question text
    if current_question and not current_question.get('options'):
        question_text_lines.append(text)

# Don't forget the last question
if current_question:
    if question_text_lines:
        current_question['text'] = ' '.join(question_text_lines)
    questions.append(current_question)

# Analyze results
print(f'Total questions found: {len(questions)}')
print('\n--- Questions with issues ---')
for q in questions:
    num_opts = len(q.get('options', {}))
    has_text = bool(q.get('text'))
    has_answer = bool(q.get('correct_answer'))
    
    if num_opts < 2 or not has_text or not has_answer:
        print(f"Q{q['number']}: text={has_text} ({len(q.get('text',''))} chars), opts={num_opts}, answer={q.get('correct_answer')}")
        if num_opts < 2:
            print(f"  Options found: {list(q.get('options', {}).keys())}")
