import json

with open('quiz/practice_questions_data.json', 'r', encoding='utf-8') as f:
    data = json.load(f)

# Get Dispute Resolution topic (index 3)
dispute_topic = data['flk-1']['topics'][3]

print(f"Topic: {dispute_topic['name']}")
print(f"Total Questions: {dispute_topic['question_count']}")
print(f"\nAreas ({len(dispute_topic['areas'])} total):")
for area in dispute_topic['areas']:
    print(f"  {area['letter']}: {area['name']} - {area['question_count']} questions")
    
# Verify total
total_in_areas = sum(a['question_count'] for a in dispute_topic['areas'])
print(f"\nSum of area questions: {total_in_areas}")
