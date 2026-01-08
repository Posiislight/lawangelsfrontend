import json

with open('quiz/practice_questions_data.json', 'r', encoding='utf-8') as f:
    data = json.load(f)

t = data['flk-1']['topics'][3]
print(f"Topic: {t['name']} ({t['question_count']} questions)")
print("Areas:")
for a in t['areas']:
    print(f"  {a['letter']}: {a['question_count']}q - {a['name'][:50]}")
