import json
import os

try:
    with open('quiz/practice_questions_data.json', encoding='utf-8') as f:
        data = json.load(f)
        
    total = 0
    courses = ['flk-1', 'flk-2']
    
    for course_key in courses:
        course = data.get(course_key)
        if not course: 
            print(f"Course {course_key} not found")
            continue
            
        print(f"Course: {course.get('name', course_key)}")
        for topic in course.get('topics', []):
            print(f"  {topic['name']}: {topic['question_count']}")
            total += topic['question_count']
            
    print(f"Total Questions: {total}")

except Exception as e:
    print(f"Error: {e}")
