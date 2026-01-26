
import re

filepath = r"c:\Users\adele\lawangelsfrontend\backend\mockexam\txt files\mock3_flk2_raw_fixed.txt"
with open(filepath, 'r', encoding='utf-8') as f:
    lines = f.readlines()

line_target = lines[1192].strip() # 0-indexed
print(f"Line 1192 content: '{line_target}'")
print(f"Hex: {line_target.encode('utf-8').hex()}")

pattern = r'^([A-Ea-e])[\.\)]\s*(.+)'
match = re.match(pattern, line_target, re.IGNORECASE)
print(f"Option Match: {match}")
if match:
    print(f"Label: {match.group(1)}")
