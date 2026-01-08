import json

with open('quiz/practice_questions_data.json', 'r', encoding='utf-8') as f:
    data = json.load(f)

print("FLK-1 Topics:")
for i, topic in enumerate(data['flk-1']['topics']):
    print(f"{i}: {topic['name']} ({len(topic['areas'])} areas)")

print("\nFLK-2 Topics:")
for i, topic in enumerate(data['flk-2']['topics']):
    print(f"{i}: {topic['name']} ({len(topic['areas'])} areas)")
