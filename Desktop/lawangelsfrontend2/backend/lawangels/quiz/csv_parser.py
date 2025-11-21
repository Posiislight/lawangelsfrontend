"""CSV parser for importing questions"""
import csv
from io import StringIO
from typing import List, Dict, Tuple
import logging

logger = logging.getLogger(__name__)


class CSVQuestionParser:
    """Parse CSV file and extract question data"""
    
    # Expected CSV columns
    REQUIRED_COLUMNS = {
        'question_number',
        'question_text',
        'difficulty',
        'option_a',
        'option_b',
        'option_c',
        'option_d',
        'option_e',
        'correct_answer',
        'explanation'
    }
    
    OPTIONAL_COLUMNS = set()
    
    @staticmethod
    def validate_csv_format(file_content: str) -> Tuple[bool, str]:
        """
        Validate CSV format and headers
        Returns: (is_valid, error_message)
        """
        try:
            reader = csv.DictReader(StringIO(file_content))
            if reader.fieldnames is None:
                return False, "CSV file is empty"
            
            fieldnames = set(name.lower().strip() for name in reader.fieldnames)
            missing_columns = CSVQuestionParser.REQUIRED_COLUMNS - fieldnames
            
            if missing_columns:
                return False, f"Missing required columns: {', '.join(missing_columns)}"
            
            # Check if file has rows
            first_row = next(reader, None)
            if first_row is None:
                return False, "CSV file contains headers but no data rows"
            
            return True, ""
        except Exception as e:
            return False, f"Error reading CSV: {str(e)}"
    
    @staticmethod
    def parse_csv(file_content: str) -> Tuple[List[Dict], str]:
        """
        Parse CSV file and extract question data
        Returns: (questions_list, error_message)
        """
        try:
            questions = []
            reader = csv.DictReader(StringIO(file_content))
            
            for row_num, row in enumerate(reader, start=2):  # start=2 because row 1 is headers
                try:
                    # Normalize field names to lowercase
                    row = {k.lower().strip(): v.strip() for k, v in row.items()}
                    
                    # Validate required fields
                    question_number = row.get('question_number', '').strip()
                    question_text = row.get('question_text', '').strip()
                    difficulty = row.get('difficulty', '').strip().lower()
                    correct_answer = row.get('correct_answer', '').strip().upper()
                    explanation = row.get('explanation', '').strip()
                    
                    # Validation
                    if not question_number:
                        return [], f"Row {row_num}: question_number is required"
                    
                    if not question_text:
                        return [], f"Row {row_num}: question_text is required"
                    
                    if difficulty not in ['easy', 'medium', 'hard']:
                        return [], f"Row {row_num}: difficulty must be 'easy', 'medium', or 'hard'"
                    
                    if correct_answer not in ['A', 'B', 'C', 'D', 'E']:
                        return [], f"Row {row_num}: correct_answer must be A-E"
                    
                    if not explanation:
                        return [], f"Row {row_num}: explanation is required"
                    
                    # Extract options
                    options = {}
                    for label in ['A', 'B', 'C', 'D', 'E']:
                        option_key = f'option_{label.lower()}'
                        option_text = row.get(option_key, '').strip()
                        
                        if not option_text:
                            return [], f"Row {row_num}: {option_key} is required"
                        
                        options[label] = option_text
                    
                    question_data = {
                        'question_number': int(question_number),
                        'text': question_text,
                        'difficulty': difficulty,
                        'correct_answer': correct_answer,
                        'explanation': explanation,
                        'options': options,
                    }
                    
                    questions.append(question_data)
                
                except ValueError as e:
                    return [], f"Row {row_num}: Invalid data format - {str(e)}"
                except Exception as e:
                    return [], f"Row {row_num}: Error parsing row - {str(e)}"
            
            if not questions:
                return [], "No valid questions found in CSV"
            
            return questions, ""
        
        except Exception as e:
            return [], f"Error parsing CSV: {str(e)}"
