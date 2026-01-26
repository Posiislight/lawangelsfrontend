
import re

filepath = r"c:\Users\adele\lawangelsfrontend\backend\mockexam\txt files\mock3_flk2_raw_fixed.txt"
with open(filepath, 'r', encoding='utf-8') as f:
    lines = f.readlines()

q_nums = []
for i, line in enumerate(lines):
    match = re.match(r'^Question\s+(\d+)', line.strip(), re.IGNORECASE)
    if match:
        q_nums.append(int(match.group(1)))

print(f"Found {len(q_nums)} questions.")
expected = set(range(1, 91))
found = set(q_nums)
missing = expected - found
print(f"Missing numbers: {sorted(list(missing))}")
print(f"Duplicate numbers: {sorted([x for x in q_nums if q_nums.count(x) > 1])}")
