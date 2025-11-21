# Quick Reference: DOCX → CSV → Database

## One-Line Commands

### Convert DOCX to CSV
```bash
# Method 1: Direct script
python docx_converter.py questions.docx questions.csv

# Method 2: Django command
python manage.py convert_docx_to_csv questions.docx questions.csv
```

### Import CSV to Database
```bash
# Using cURL
curl -X POST \
  -H "Authorization: Token YOUR_TOKEN" \
  -F "exam_id=1" \
  -F "csv_file=@questions.csv" \
  http://localhost:8000/api/exams/import_questions/
```

## DOCX Format Template

```
Question 1
What is the question text?

A. First option
B. Second option
C. Third option
D. Fourth option
E. Fifth option

C is the correct option

Explanation
Detailed explanation of why C is correct...

Question 2
[Next question...]
```

## Complete Workflow

```bash
# 1. Convert DOCX to CSV
python docx_converter.py my_questions.docx my_questions.csv

# 2. Verify CSV looks good (optional)
head -3 my_questions.csv

# 3. Import to database (replace TOKEN and exam_id)
curl -X POST \
  -H "Authorization: Token YOUR_ADMIN_TOKEN" \
  -F "exam_id=1" \
  -F "csv_file=@my_questions.csv" \
  http://localhost:8000/api/exams/import_questions/

# 4. Success! Check the response for created/skipped counts
```

## Python Usage

```python
from docx_converter import DocxToCsvConverter

# Simple one-liner
converter = DocxToCsvConverter()
csv_file = converter.convert('questions.docx', 'questions.csv')
print(f"✅ Created: {csv_file}")
```

## CSV File Structure

| Column | Example | Notes |
|--------|---------|-------|
| question_number | 1 | Sequential integers |
| question_text | What is... | Full question |
| difficulty | medium | easy, medium, hard |
| option_a | Answer A | First option text |
| option_b | Answer B | Second option text |
| option_c | Answer C | Third option text |
| option_d | Answer D | Fourth option text |
| option_e | Answer E | Fifth option text |
| correct_answer | C | Single letter A-E |
| explanation | The reason is... | Detailed explanation |

## Common Issues & Fixes

| Issue | Fix |
|-------|-----|
| "No valid questions found" | Check "Question N" format exactly |
| "File not found" | Use full path or check filename |
| "File must be DOCX" | Save as .docx (not .doc) |
| Missing questions | Verify all questions have A-E options |
| Empty CSV | Check DOCX format matches template |

## Files Provided

- **docx_converter.py** - Main converter tool
- **quiz/management/commands/convert_docx_to_csv.py** - Django command
- **sample_questions.docx** - Example DOCX file
- **sample_questions.csv** - Example output CSV
- **DOCX_CONVERTER_GUIDE.md** - Full documentation

## Next Steps

1. Prepare your DOCX file with questions
2. Run the converter: `python docx_converter.py input.docx output.csv`
3. Verify output CSV looks correct
4. Import to database using the CSV import endpoint
5. Check database to verify questions were created

## Support

For detailed help, see **DOCX_CONVERTER_GUIDE.md**

---
Last updated: 2025-11-21
