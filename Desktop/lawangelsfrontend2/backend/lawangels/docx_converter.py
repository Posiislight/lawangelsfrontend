"""
DOCX to CSV Converter for Questions
Converts Word documents containing questions into CSV format for database import
"""

import docx
import pandas as pd
import re
from pathlib import Path
from typing import List, Dict
import logging

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)


class DocxQuestionParser:
    """Parse questions from DOCX documents"""
    
    def __init__(self):
        self.option_map = {
            "A": "option_a",
            "B": "option_b",
            "C": "option_c",
            "D": "option_d",
            "E": "option_e",
        }
    
    def extract_questions(self, doc_path: str) -> List[Dict]:
        """
        Extract questions from DOCX file
        
        Format:
        - Questions are identified by "Question N" prefix
        - Options can be in the same paragraph or separate, all starting with A., B., C., D., E.
        - Correct answer line: "X is the correct option"  
        - Explanation section begins after "Explanation" keyword
        """
        try:
            doc = docx.Document(doc_path)
            logger.info(f"Loaded DOCX document: {doc_path}")
            
            questions = []
            current = self._create_empty_question()
            collecting_explanation = False
            
            for para_idx, para in enumerate(doc.paragraphs):
                text = para.text.strip()
                
                if not text:
                    continue
                
                # Detect start of new question (e.g., "Question 1 (Title)")
                q_match = re.match(r"Question\s+(\d+)", text, re.IGNORECASE)
                if q_match:
                    # Save previous question if valid
                    if current["question_number"]:
                        if self._is_valid_question(current):
                            questions.append(current)
                        else:
                            logger.warning(f"Skipping invalid question {current['question_number']}")
                    
                    # Start new question
                    current = self._create_empty_question()
                    current["question_number"] = int(q_match.group(1))
                    logger.info(f"Processing Question {current['question_number']}")
                    collecting_explanation = False
                    continue
                
                # Skip if no current question
                if not current["question_number"]:
                    continue
                
                # Check if this is a "correct option" line
                if re.search(r"[A-E]\s+is\s+the\s+correct\s+option", text, re.IGNORECASE):
                    match = re.match(r"([A-E])", text)
                    if match:
                        current["correct_answer"] = match.group(1).upper()
                    collecting_explanation = False
                    continue
                
                # Check for Explanation marker
                if text.lower() == "explanation":
                    collecting_explanation = True
                    continue
                
                # If collecting explanation
                if collecting_explanation:
                    if current["explanation"]:
                        current["explanation"] += " " + text
                    else:
                        current["explanation"] = text
                    continue
                
                # Try to extract OPTIONS from paragraph (they might be all in one paragraph)
                # Split by patterns like "A. ... B. ... C. ..."
                if re.search(r"[A-E]\.\s+", text) and not current["option_a"]:
                    # This paragraph contains options - split them
                    options_found = self._extract_options_from_paragraph(text)
                    if options_found:
                        for letter, option_text in options_found.items():
                            current[self.option_map[letter]] = option_text
                        continue
                
                # Single line option (e.g., "A. Option text")
                opt_match = re.match(r"^([A-E])\.\s+(.+)$", text)
                if opt_match:
                    letter = opt_match.group(1).upper()
                    option_text = opt_match.group(2).strip()
                    current[self.option_map[letter]] = option_text
                    continue
                
                # If we haven't found all options and haven't started explanation,
                # this must be question text
                if not collecting_explanation and not current["option_a"]:
                    # This is part of question text
                    if current["question_text"]:
                        current["question_text"] += " " + text
                    else:
                        current["question_text"] = text
            
            # Add last question
            if current["question_number"]:
                if self._is_valid_question(current):
                    questions.append(current)
                else:
                    logger.warning(f"Skipping invalid question {current['question_number']}")
            
            logger.info(f"Successfully extracted {len(questions)} questions")
            return questions
        
        except Exception as e:
            logger.error(f"Error extracting questions from {doc_path}: {str(e)}")
            raise
    
    def _create_empty_question(self) -> Dict:
        """Create empty question template"""
        return {
            "question_number": None,
            "question_text": "",
            "difficulty": "medium",
            "option_a": "",
            "option_b": "",
            "option_c": "",
            "option_d": "",
            "option_e": "",
            "correct_answer": "",
            "explanation": "",
            "in_explanation": False
        }
    
    def _extract_options_from_paragraph(self, text: str) -> Dict[str, str]:
        """
        Extract A-E options from a single paragraph where they might be combined
        e.g., "A. Text of A B. Text of B C. Text of C D. Text of D E. Text of E"
        """
        options = {}
        try:
            # Split by letter markers (A., B., C., D., E.)
            # Use lookahead to stop at the next option without consuming it
            pattern = r'([A-E])\.\s+(.+?)(?=\s+[A-E]\.\s+|\s*$)'
            matches = re.findall(pattern, text, re.DOTALL)
            
            for letter, option_text in matches:
                # Clean up the option text - remove extra whitespace
                cleaned = ' '.join(option_text.split()).strip()
                options[letter.upper()] = cleaned
            
            return options if len(options) == 5 else {}
        except Exception as e:
            logger.debug(f"Could not extract options from paragraph: {str(e)}")
            return {}
    
    
    def _is_valid_question(self, question: Dict) -> bool:
        """Validate question has all required fields"""
        required = [
            question["question_number"],
            question["question_text"],
            question["option_a"],
            question["option_b"],
            question["option_c"],
            question["option_d"],
            question["option_e"],
            question["correct_answer"],
            question["explanation"]
        ]
        
        # Check all required fields are present and non-empty
        return all(required)


class CSVExporter:
    """Export questions to CSV format"""
    
    @staticmethod
    def export_to_csv(questions: List[Dict], output_path: str, encoding: str = 'utf-8') -> bool:
        """
        Export questions to CSV file
        
        Args:
            questions: List of question dictionaries
            output_path: Path where CSV will be saved
            encoding: File encoding (default: utf-8)
        
        Returns:
            True if successful, False otherwise
        """
        try:
            if not questions:
                logger.warning("No questions to export")
                return False
            
            # Create DataFrame
            df = pd.DataFrame(questions)
            
            # Remove internal fields
            df = df.drop(columns=['in_explanation'], errors='ignore')
            
            # Reorder columns for consistency
            column_order = [
                'question_number', 'question_text', 'difficulty',
                'option_a', 'option_b', 'option_c', 'option_d', 'option_e',
                'correct_answer', 'explanation'
            ]
            df = df[[col for col in column_order if col in df.columns]]
            
            # Save to CSV
            df.to_csv(output_path, index=False, encoding=encoding)
            logger.info(f"Successfully exported {len(df)} questions to {output_path}")
            
            return True
        
        except Exception as e:
            logger.error(f"Error exporting to CSV: {str(e)}")
            raise


class DocxToCsvConverter:
    """Main converter class"""
    
    def __init__(self):
        self.parser = DocxQuestionParser()
        self.exporter = CSVExporter()
    
    def convert(self, docx_path: str, csv_path: str = None) -> str:
        """
        Convert DOCX to CSV
        
        Args:
            docx_path: Path to input DOCX file
            csv_path: Path to output CSV file (optional, derives from docx_path if not provided)
        
        Returns:
            Path to created CSV file
        """
        # Validate input
        docx_file = Path(docx_path)
        if not docx_file.exists():
            raise FileNotFoundError(f"DOCX file not found: {docx_path}")
        
        if not docx_file.suffix.lower() == '.docx':
            raise ValueError(f"File must be DOCX format, got: {docx_file.suffix}")
        
        # Determine output path
        if csv_path is None:
            csv_path = str(docx_file.with_suffix('.csv'))
        
        logger.info(f"Starting conversion: {docx_path} -> {csv_path}")
        
        # Extract questions
        questions = self.parser.extract_questions(docx_path)
        
        if not questions:
            raise ValueError("No valid questions found in DOCX file")
        
        # Export to CSV
        self.exporter.export_to_csv(questions, csv_path)
        
        logger.info(f"Conversion complete: {csv_path}")
        return csv_path


def main():
    """Command line interface"""
    import sys
    
    if len(sys.argv) < 2:
        print("Usage: python docx_converter.py <input.docx> [output.csv]")
        print("\nExample:")
        print("  python docx_converter.py questions.docx questions.csv")
        sys.exit(1)
    
    docx_path = sys.argv[1]
    csv_path = sys.argv[2] if len(sys.argv) > 2 else None
    
    try:
        converter = DocxToCsvConverter()
        output_path = converter.convert(docx_path, csv_path)
        print(f"\n✅ Success! CSV created at: {output_path}")
    except Exception as e:
        print(f"\n❌ Error: {str(e)}")
        sys.exit(1)


if __name__ == "__main__":
    main()
