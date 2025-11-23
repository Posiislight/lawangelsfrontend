# DOCX to CSV Converter Guide

## Overview
This tool converts Word documents (DOCX) containing exam questions into CSV format for bulk import into the database using the CSV import endpoint.

## Features
- ✅ Extracts questions, options, correct answers, and explanations
- ✅ Validates question structure and data integrity
- ✅ Handles multiple questions in a single document
- ✅ Detailed logging for debugging
- ✅ Error handling and validation

## Installation

### Prerequisites
```bash
pip install python-docx pandas openpyxl
```

### Files Included
- `docx_converter.py` - Main converter module
- `quiz/management/commands/convert_docx_to_csv.py` - Django management command

## Input Document Format

Your DOCX file should follow this structure:

```
Question 1
[Question text can be multiple lines]

A. [Option A text]
B. [Option B text]
C. [Option C text]
D. [Option D text]
E. [Option E text]

C is the correct option

Explanation
[Explanation text - can be multiple lines, providing detailed reasoning]

Question 2
[Next question...]
```

### Important Format Requirements

1. **Question Header**: Must start with "Question" followed by a number
   - Example: `Question 1`, `Question 42`

2. **Options**: Must be labeled A through E with period and space
   - Example: `A. The first option`
   - Each option must be on its own line

3. **Correct Answer**: Must state which option is correct
   - Example: `B is the correct option`
   - Can include extra text like "B is the correct option because..."

4. **Explanation**: Must start with line containing only "Explanation"
   - Everything after this marker until the next question is the explanation
   - Can span multiple lines

### Example DOCX Content

```
Question 1
What is the primary principle of contract law?

A. Offer and acceptance only
B. Offer, acceptance, and consideration
C. Written agreement only
D. Mutual intent only
E. Payment of money

B is the correct option

Explanation
A valid contract requires three essential elements: offer, acceptance, and consideration. 
The offer must be clear and definite, acceptance must correspond exactly with the offer, 
and both parties must exchange something of value (consideration). Written form is required 
only for certain contracts under the statute of frauds.

Question 2
When does a contract become binding?
...
```

## Usage

### Method 1: Direct Python Script

```bash
cd /path/to/backend/lawangels
python docx_converter.py input_questions.docx output_questions.csv
```

**Output:**
```
Starting conversion: input_questions.docx -> output_questions.csv
Processing Question 1
Processing Question 2
...
Successfully exported 15 questions to output_questions.csv
✅ Success! CSV created at: output_questions.csv
```

### Method 2: Django Management Command

```bash
cd /path/to/backend/lawangels
python manage.py convert_docx_to_csv input_questions.docx output_questions.csv
```

### Method 3: Python Script

```python
from docx_converter import DocxToCsvConverter

converter = DocxToCsvConverter()
csv_path = converter.convert('input_questions.docx', 'output_questions.csv')
print(f"CSV created at: {csv_path}")
```

### Method 4: Import in Your Code

```python
from docx_converter import DocxQuestionParser, CSVExporter

# Parse DOCX
parser = DocxQuestionParser()
questions = parser.extract_questions('input_questions.docx')

# Export to CSV
exporter = CSVExporter()
exporter.export_to_csv(questions, 'output_questions.csv')

print(f"Extracted and exported {len(questions)} questions")
```

## Output CSV Format

The generated CSV will have these columns:
- `question_number`
- `question_text`
- `difficulty` (always "medium" by default)
- `option_a`
- `option_b`
- `option_c`
- `option_d`
- `option_e`
- `correct_answer`
- `explanation`

This format matches exactly what the `/api/exams/import_questions/` endpoint expects.

## Workflow: DOCX → CSV → Database

### Step 1: Prepare DOCX File
Create your DOCX file with questions in the required format (see above).

### Step 2: Convert to CSV
```bash
python docx_converter.py questions.docx questions.csv
```

### Step 3: Verify CSV
Open `questions.csv` to verify the data looks correct.

### Step 4: Import to Database

#### Using cURL:
```bash
curl -X POST \
  -H "Authorization: Token YOUR_ADMIN_TOKEN" \
  -F "exam_id=1" \
  -F "csv_file=@questions.csv" \
  http://localhost:8000/api/exams/import_questions/
```

#### Using Python:
```python
import requests

with open('questions.csv', 'rb') as f:
    response = requests.post(
        'http://localhost:8000/api/exams/import_questions/',
        files={'csv_file': f},
        data={'exam_id': 1},
        headers={'Authorization': 'Token YOUR_ADMIN_TOKEN'}
    )
    print(response.json())
```

## Troubleshooting

### Issue: "No valid questions found in DOCX file"
**Solution:**
- Verify "Question N" format exactly
- Check all questions have options A-E
- Ensure correct answer line exists
- Verify explanation section is present

### Issue: Some questions are skipped
**Solution:**
- Check logs for validation errors
- Each question must have all 5 options
- Correct answer must be A-E
- Explanation cannot be empty

### Issue: Question text is incomplete
**Solution:**
- Ensure question text is separated from options by blank line
- Question text should appear before options start
- Check for formatting issues in DOCX

### Issue: Options not recognized
**Solution:**
- Options must start with letter followed by period and space: `A. `
- Each option must be on its own paragraph/line
- Check for extra spaces or formatting

### Issue: "File must be DOCX format"
**Solution:**
- Use `.docx` format (Word 2007+), not `.doc`
- Save your file in modern Word format

## Advanced Usage

### Processing Multiple Files

```python
from pathlib import Path
from docx_converter import DocxToCsvConverter

converter = DocxToCsvConverter()
docx_dir = Path('questions_docx')

for docx_file in docx_dir.glob('*.docx'):
    try:
        csv_file = docx_file.with_suffix('.csv')
        converter.convert(str(docx_file), str(csv_file))
        print(f"✅ Converted: {docx_file.name}")
    except Exception as e:
        print(f"❌ Failed: {docx_file.name} - {e}")
```

### Custom Difficulty Assignment

After conversion, you can modify difficulty levels:

```python
import pandas as pd

df = pd.read_csv('questions.csv')

# Assign difficulty based on question number
df['difficulty'] = df['question_number'].apply(
    lambda x: 'easy' if x <= 5 else 'medium' if x <= 10 else 'hard'
)

df.to_csv('questions.csv', index=False)
```

## CSV Validation Before Import

```python
import pandas as pd
from quiz.csv_parser import CSVQuestionParser

df = pd.read_csv('questions.csv')
csv_content = df.to_csv(index=False)

is_valid, error_msg = CSVQuestionParser.validate_csv_format(csv_content)

if is_valid:
    print("✅ CSV is valid and ready for import")
else:
    print(f"❌ CSV validation failed: {error_msg}")
```

## Tips for Best Results

1. **Keep DOCX Simple**: Use basic formatting, avoid complex tables or styling
2. **Consistent Spacing**: Use single blank lines between sections
3. **Clear Question Text**: Make questions clear and unambiguous
4. **Balanced Options**: All options should seem plausible
5. **Detailed Explanations**: Provide comprehensive reasoning
6. **Test First**: Convert a small sample (5 questions) first to verify format
7. **Backup Original**: Keep a backup of your DOCX files

## Complete End-to-End Example

### 1. Create DOCX with Questions
Create `exam_questions.docx` with your questions.

### 2. Convert to CSV
```bash
python docx_converter.py exam_questions.docx exam_questions.csv
```

### 3. Verify CSV
```bash
head exam_questions.csv
```

### 4. Create Exam (if needed)
```bash
curl -X POST \
  -H "Authorization: Token YOUR_ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Tax Law Mock Exam",
    "description": "Complete taxation exam",
    "subject": "tax",
    "duration_minutes": 90
  }' \
  http://localhost:8000/api/exams/
```

### 5. Import Questions
```bash
curl -X POST \
  -H "Authorization: Token YOUR_ADMIN_TOKEN" \
  -F "exam_id=1" \
  -F "csv_file=@exam_questions.csv" \
  http://localhost:8000/api/exams/import_questions/
```

### 6. Verify in Database
```bash
curl -H "Authorization: Token YOUR_ADMIN_TOKEN" \
  http://localhost:8000/api/exams/1/
```

Done! Your questions are now in the database and ready for use.
