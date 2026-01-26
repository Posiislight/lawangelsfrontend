import re

lines = [
    "A. ● A. Eleanor is not liable because she acted in good faith",
    "●A. Diana has a valid beneficial interest",
    "A. Option A text",
    "B. ● B. Option B text"
]

for text in lines:
    option_match = re.match(r'^([A-Ea-e])[\.\)]\s*(.+)', text, re.IGNORECASE)
    if option_match:
        label = option_match.group(1).upper()
        option_text = option_match.group(2).strip()
        print(f"Matched: Label={label}, Text='{option_text}'")
    else:
        print(f"No match for: '{text}'")
