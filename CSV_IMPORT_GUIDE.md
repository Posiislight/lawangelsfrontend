# CSV Questions Import Guide

## Overview
The CSV import endpoint allows administrators to bulk import questions with options, correct answers, and explanations into the database.

## Endpoint
**POST** `/api/exams/import_questions/`

**Authentication:** Admin user required (staff/superuser)

**Content-Type:** `multipart/form-data`

## Request Format

### Form Parameters
- `exam_id` (integer, required): ID of the exam to import questions into
- `csv_file` (file, required): CSV file with questions data

### File Constraints
- File must be a CSV file (`.csv` extension)
- Maximum file size: 5MB
- Encoding: UTF-8

## CSV File Format

### Required Columns (order doesn't matter)
1. **question_number** - Unique question number within the exam (integer)
2. **question_text** - The question text (string)
3. **difficulty** - Question difficulty level: `easy`, `medium`, or `hard`
4. **option_a** - Text for option A (string)
5. **option_b** - Text for option B (string)
6. **option_c** - Text for option C (string)
7. **option_d** - Text for option D (string)
8. **option_e** - Text for option E (string)
9. **correct_answer** - Correct answer: A, B, C, D, or E (single uppercase letter)
10. **explanation** - Detailed explanation of the correct answer (string)

### Example CSV

```csv
question_number,question_text,difficulty,option_a,option_b,option_c,option_d,option_e,correct_answer,explanation
1,What is the rule for contract formation?,easy,Offer only,Offer and acceptance,Consideration only,Written agreement,Verbal agreement,B,"A valid contract requires both an offer and acceptance. The offer must be clear and definite, and acceptance must be unconditional and correspond exactly with the offer."
2,What is the doctrine of consideration?,medium,Gift principle,Exchange of value,Unilateral promise,Charitable donation,Goodwill gesture,B,"Consideration is the exchange of value between parties. Each party must give something of value to the other. A promise without consideration is generally not enforceable as a contract, with limited exceptions."
3,When does a contract become binding?,hard,When one party offers,When both parties intend,When offer is made,When acceptance is communicated,When payment is made,D,"A contract becomes binding when acceptance is communicated to the offeror. Mere intention to be bound is insufficient. The communication of acceptance is the moment the contract is formed and becomes legally binding."
```

## CSV Guidelines

### Data Entry Best Practices
1. **Question Numbers**: Should be sequential (1, 2, 3, etc.) for each exam
2. **Question Text**: Clear, concise, and unambiguous
3. **Options**: Should be distinct and reasonably plausible as answers
4. **Correct Answer**: Must be one of A, B, C, D, or E
5. **Explanation**: Detailed reasoning - at least 2-3 sentences explaining why the answer is correct
6. **Difficulty**: Use lowercase values only - `easy`, `medium`, or `hard`

### Common Issues & Solutions

| Issue | Solution |
|-------|----------|
| "Missing required columns" | Ensure all 10 column names are present exactly as specified |
| "Invalid data format" | Check for proper CSV formatting, ensure numbers are in numeric fields |
| "Difficult must be 'easy', 'medium', or 'hard'" | Use exact lowercase values without extra spaces |
| "correct_answer must be A-E" | Use uppercase single letter, remove quotes or spaces |
| "File size must be less than 5MB" | Split large CSV into multiple files and import separately |

## Response Format

### Success Response (201 Created)
```json
{
  "success": true,
  "message": "Successfully imported 3 questions",
  "created": 3,
  "skipped": 0,
  "exam": {
    "id": 1,
    "title": "Mock Test 1",
    "description": "Practice exam",
    "subject": "mixed",
    "duration_minutes": 60,
    "speed_reader_seconds": 70,
    "passing_score_percentage": 70,
    "is_active": true,
    "total_questions": 3,
    "questions_count": 3
  }
}
```

### Error Response (400/500)
```json
{
  "success": false,
  "message": "Error message describing what went wrong"
}
```

Specific error messages:
- `"Missing required columns: ..."` - CSV format issue
- `"Row X: question_number is required"` - Missing data in specific row
- `"Row X: difficulty must be 'easy', 'medium', or 'hard'"` - Invalid difficulty value
- `"Row X: correct_answer must be A-E"` - Invalid answer selection
- `"No valid questions found in CSV"` - CSV has no data rows

## Duplicate Handling

If a question with the same `question_number` already exists in the exam:
- The existing question is **skipped** (not imported)
- The system continues importing other questions
- Response will show how many were created vs skipped

Example:
```json
{
  "created": 8,
  "skipped": 2,
  "message": "Successfully imported 8 questions"
}
```

## Using with cURL

```bash
curl -X POST \
  -H "Authorization: Token YOUR_ADMIN_TOKEN" \
  -F "exam_id=1" \
  -F "csv_file=@questions.csv" \
  http://localhost:8000/api/exams/import_questions/
```

## Using with Python

```python
import requests

with open('questions.csv', 'rb') as f:
    files = {'csv_file': f}
    data = {'exam_id': 1}
    headers = {'Authorization': 'Token YOUR_ADMIN_TOKEN'}
    
    response = requests.post(
        'http://localhost:8000/api/exams/import_questions/',
        files=files,
        data=data,
        headers=headers
    )
    print(response.json())
```

## Using with JavaScript/Fetch

```javascript
const formData = new FormData();
formData.append('exam_id', 1);
formData.append('csv_file', fileInput.files[0]);

const response = await fetch('/api/exams/import_questions/', {
  method: 'POST',
  body: formData,
  headers: {
    'Authorization': `Token ${token}`
  }
});

const result = await response.json();
console.log(result);
```

## Admin Interface Access

For the admin panel, the endpoint is available at:
- Django Admin: `/admin/quiz/question/`

## Tips for Large Imports

1. **Test with small file first** - Start with 5-10 questions to verify format
2. **Split large files** - If importing 500+ questions, split into 100-question batches
3. **Monitor logs** - Check Django logs for any import warnings
4. **Verify results** - After import, check the exam in Django admin to verify questions loaded correctly

## Troubleshooting

### Import succeeds but questions are blank
- Check CSV file is UTF-8 encoded
- Verify all cells have content (no empty cells in required columns)

### "Exam not found" error
- Verify `exam_id` exists in database
- Check you're using the correct exam ID

### Permission denied (403)
- User must be admin/staff
- Ensure you're authenticated with proper admin token
