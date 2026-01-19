
import re

def parse_q84():
    # Exact content from Q84 based on what we think parsing gives
    content = """
The firm, in a conveyancing transaction, issues an invoice to a client, Emily, for £5,000 in legal fees. Emily has already transferred money into the client bank account on account of these fees. The firm now applies the funds held on account to settle her invoice. Using double-entry bookkeeping, what is the correct way to record this transaction?
Options:
A. Debit Client Bank Account £5,000; Credit Client Ledger £5,000
B. Debit Client Ledger £5,000; Credit Client Bank Account £5,000
C. Debit Office Bank Account £5,000; Credit Client Ledger £5,000
D. Debit Client Ledger £5,000; Credit Office Bank Account £5,000
E. Debit Profit Costs £5,000; Credit Client Bank Account £5,000
Answer:
B. Debit Client Ledger £5,000; Credit Client Bank Account £5,000
Explanation:
When the client’s invoice is settled from funds already held in the client bank account:
The firm’s liability to the client decreases (the Client Ledger shows what is owed by the firm to the client), so the Client Ledger is Debited £5,000.
The firm’s asset (Client Bank Account) decreases because the money is now applied to pay for the invoice, so the Client Bank Account is Credited £5,000.
A: Debits the client bank account, which would increase it; here, the bank balance is actually reducing.
C & D: Involve the office account, which is incorrect because this transaction affects client money only.
E: Credits profit or costs prematurely; no profit has been realized until it is formally transferred to the office account after the correct accounting process.
"""
    q_num = 84
    
    question_data = {
        'number': q_num,
        'text': '',
        'options': {},
        'correct_answer': None,
        'explanation': '',
        'topic': 'criminal_law',
    }
    
    lines = content.strip().split('\n')
    current_section = 'question'
    question_lines = []
    explanation_lines = []
    expecting_answer_letter = False
    
    print(f"Total lines: {len(lines)}")
    
    for line in lines:
        line = line.strip()
        if not line:
            continue
            
        print(f"Processing: {repr(line)} [Section: {current_section}]")
        
        # LOGIC FROM import_mock_text.py
        
        # Check if previous line was just "Answer:" and this line starts with a letter
        if expecting_answer_letter and not question_data['correct_answer']:
            letter_match = re.match(r'^([A-E])[\.\s]', line)
            if letter_match:
                print(f"FOUND ANSWER via expecting_answer_letter: {letter_match.group(1)}")
                question_data['correct_answer'] = letter_match.group(1).upper()
                current_section = 'answer'
                expecting_answer_letter = False
                continue
            expecting_answer_letter = False
        
        if re.match(r'^Question\s+\d+', line):
            break
            
        answer_match = None
        if not answer_match: answer_match = re.search(r'(?:The\s+)?correct\s+(?:option|answer)\s+is\s+([A-E])', line, re.IGNORECASE)
        if not answer_match: answer_match = re.search(r'(?:The\s+)?Correct\s+(?:option|answer)\s*:\s*([A-E])', line, re.IGNORECASE)
        if not answer_match: answer_match = re.search(r'^([A-E])\s+is\s+(?:the\s+)?correct', line, re.IGNORECASE)
        if not answer_match: answer_match = re.search(r'Option\s+([A-E])\s+is\s+(?:the\s+)?correct', line, re.IGNORECASE)
        if not answer_match: answer_match = re.search(r'^([A-E])\s+is\s+correct\s+option', line, re.IGNORECASE)
        if not answer_match: answer_match = re.search(r'Correct\s+Answer\s*:?\s*([A-E])\.?', line, re.IGNORECASE)
        if not answer_match: answer_match = re.search(r'^Answer\s*:?\s*([A-E])', line, re.IGNORECASE)
        if not answer_match: answer_match = re.search(r'^Answer\s+is\s+([A-E])', line, re.IGNORECASE)
        
        if answer_match:
            if not question_data['correct_answer']:
                print(f"FOUND ANSWER via match: {answer_match.group(1)}")
                question_data['correct_answer'] = answer_match.group(1).upper()
                if current_section != 'explanation':
                    current_section = 'answer'
                continue

        if re.match(r'^Answer\s*:\s*$', line, re.IGNORECASE) and not question_data['correct_answer']:
            print("Found 'Answer:' alone")
            expecting_answer_letter = True
            current_section = 'answer'
            continue
        
        if re.match(r'^Options\s*:?\s*$', line, re.IGNORECASE):
            print("Skipping Options header")
            current_section = 'options'
            continue
            
        option_match = re.match(r'^[\u2022\uf0b7\u2023\u25e6\u25aa\u25ab\u2219\u25cf\-\*]*\s*([A-Ea-e])[\.\)]\s*(.+)', line)
        if not option_match:
            option_match = re.match(r'^([A-E])\s+([A-Z].+)', line)
        if option_match and current_section in ['question', 'options']:
            print(f"Option detected {option_match.group(1)}")
            current_section = 'options'
            label = option_match.group(1).upper()
            text = option_match.group(2).strip()
            question_data['options'][label] = text
            continue

        if current_section in ['question', 'options']:
             if re.match(r'^A[\.\)]', line.strip()):
                 # ... (single line options logic omitted for brevity as Q84 is multi-line)
                 pass

        if re.match(r'^Explanation\s*:?\s*$', line, re.IGNORECASE):
            current_section = 'explanation'
            continue
            
        expl_match = re.match(r'^Explanation\s*:?\s+(.+)', line, re.IGNORECASE)
        if expl_match:
            current_section = 'explanation'
            explanation_lines.append(expl_match.group(1))
            continue
            
        if current_section == 'question':
            question_lines.append(line)
        elif current_section == 'explanation':
            explanation_lines.append(line)
        elif current_section == 'options':
            if question_data['options']:
                last_key = list(question_data['options'].keys())[-1]
                question_data['options'][last_key] += ' ' + line
                
    print(f"Final Options Count: {len(question_data['options'])}")
    print(f"Final Answer: {question_data['correct_answer']}")

parse_q84()
