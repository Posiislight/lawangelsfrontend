import json

with open('quiz/practice_questions_data.json', 'r', encoding='utf-8') as f:
    data = json.load(f)

ethics = data['flk-1']['topics'][6]
print(f"Topic: {ethics['name']}")
print(f"Letters: {[a['letter'] for a in ethics['areas']]}")
for area in ethics['areas']:
    print(f"  {area['letter']}: {area['question_count']} questions")
