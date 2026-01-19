
import re

content = """
A. Debit Client Bank Account £5,000; Credit Client Ledger £5,000
B. Debit Client Ledger £5,000; Credit Client Bank Account £5,000
"""

lines = content.strip().split('\n')

for line in lines:
    line = line.strip()
    print(f"Testing line: {repr(line)}")
    
    option_match = re.match(r'^[\u2022\uf0b7\u2023\u25e6\u25aa\u25ab\u2219\u25cf\-\*]*\s*([A-Ea-e])[\.\)]\s*(.+)', line)
    print(f"Match 1: {bool(option_match)}")
    if option_match:
        print(f"Groups: {option_match.groups()}")

    if not option_match:
        option_match = re.match(r'^([A-E])\s+([A-Z].+)', line)
        print(f"Match 2: {bool(option_match)}")
