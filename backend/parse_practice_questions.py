"""
Script to parse all practice question .docx files and generate JSON data
with AREA-based organization (A, B, C, D, E, F sections within each topic).
"""
import json
import os
import re
from pathlib import Path
import sys

try:
    import docx
except ImportError:
    print("Installing python-docx...")
    import subprocess
    subprocess.check_call([sys.executable, "-m", "pip", "install", "python-docx"])
    import docx


def slugify(text: str) -> str:
    """Convert text to URL-friendly slug"""
    text = text.lower().strip()
    text = re.sub(r'[^\w\s-]', '', text)
    text = re.sub(r'[-\s]+', '-', text)
    return text[:50]


def extract_topic_from_filename(filename: str) -> str:
    """Extract topic name from filename"""
    name = Path(filename).stem
    name = re.sub(r'\s*(practice\s*)?questions?\s*(\(\d+\))?$', '', name, flags=re.IGNORECASE)
    name = re.sub(r'[-_]?\s*(practice\s*)?questions?$', '', name, flags=re.IGNORECASE)
    return name.strip()


def parse_docx_with_areas(filepath: str) -> list:
    """
    Parse questions from a practice questions .docx file with AREA organization.
    
    Format examples:
    - "A- Core institutions of the state"
    - "B- Constitutional conventions"
    """
    doc = docx.Document(filepath)
    
    # Collect paragraphs
    paragraphs = [p.text.strip() for p in doc.paragraphs if p.text.strip()]
    
    # Find area markers: "A-", "B-", etc. at START of paragraph
    area_pattern = re.compile(r'^([A-F])\s*[-–]\s*(.+)$', re.IGNORECASE)
    
    areas = []
    current_area = None
    current_content = []
    
    for para in paragraphs:
        match = area_pattern.match(para)
        if match:
            # Save previous area if exists
            if current_area and current_content:
                questions = parse_questions_from_content("\n".join(current_content))
                if questions:
                    areas.append({
                        "letter": current_area["letter"],
                        "name": current_area["name"],
                        "slug": slugify(f"{current_area['letter']}-{current_area['name']}"),
                        "question_count": len(questions),
                        "questions": questions
                    })
            
            # Start new area
            current_area = {
                "letter": match.group(1).upper(),
                "name": match.group(2).strip()
            }
            current_content = []
        else:
            current_content.append(para)
    
    # Save last area
    if current_area and current_content:
        questions = parse_questions_from_content("\n".join(current_content))
        if questions:
            areas.append({
                "letter": current_area["letter"],
                "name": current_area["name"],
                "slug": slugify(f"{current_area['letter']}-{current_area['name']}"),
                "question_count": len(questions),
                "questions": questions
            })
    
    # If no areas found, try parsing entire document as one area
    if not areas:
        all_content = "\n".join(paragraphs)
        questions = parse_questions_from_content(all_content)
        if questions:
            areas.append({
                "letter": "A",
                "name": "General Questions",
                "slug": "general-questions",
                "question_count": len(questions),
                "questions": questions
            })
    
    return areas


def parse_questions_from_content(content: str) -> list:
    """Parse questions from content text"""
    questions = []
    
    # Split by "Question N" pattern
    question_pattern = r'Question\s+(\d+)'
    parts = re.split(question_pattern, content, flags=re.IGNORECASE)
    
    for i in range(1, len(parts), 2):
        if i + 1 >= len(parts):
            break
            
        q_content = parts[i + 1]
        
        # Find correct answer pattern - multiple formats used
        correct_match = re.search(r'The correct option is\s+([A-E])', q_content, re.IGNORECASE)
        if not correct_match:
            correct_match = re.search(r'Correct [Oo]ption[:\s]+([A-E])', q_content, re.IGNORECASE)
        if not correct_match:
            # FLK 2 uses "Correct Answer: D" format
            correct_match = re.search(r'Correct Answer[:\s]+([A-E])', q_content, re.IGNORECASE)
        if not correct_match:
            continue
            
        correct_answer = correct_match.group(1).upper()
        
        # Split at correct answer marker
        correct_pos = correct_match.start()
        question_part = q_content[:correct_pos].strip()
        explanation_part = q_content[correct_match.end():].strip()
        
        # Clean explanation
        explanation_part = re.sub(r'^[\s\.\:\-]+', '', explanation_part)
        expl_match = re.search(r'Explanation[\:\s]*', explanation_part, re.IGNORECASE)
        if expl_match:
            explanation_part = explanation_part[expl_match.end():].strip()
        
        # Extract options - look for A., B., C., D., E. patterns
        options = {}
        lines = question_part.split('\n')
        question_text_lines = []
        
        for line in lines:
            line = line.strip()
            # Check if line starts with option letter
            opt_match = re.match(r'^([A-E])[\.\)\s]+(.+)$', line)
            if opt_match:
                options[opt_match.group(1).upper()] = opt_match.group(2).strip()
            elif not options:  # Still building question text
                question_text_lines.append(line)
            else:
                # Append to last option if we're past the question
                last_opt = max(options.keys()) if options else None
                if last_opt:
                    options[last_opt] += " " + line
        
        question_text = " ".join(question_text_lines).strip()
        
        # If no options found in lines, try inline pattern
        if len(options) < 4:
            options = {}
            # Try inline: "A. text B. text C. text"
            opt_pattern = r'([A-E])[\.\)]\s*([^A-E]+?)(?=(?:[A-E][\.\)])|$)'
            opt_matches = list(re.finditer(opt_pattern, question_part))
            for m in opt_matches:
                options[m.group(1).upper()] = m.group(2).strip()
            
            # Question is before first option
            if opt_matches:
                question_text = question_part[:opt_matches[0].start()].strip()
        
        # Validate
        if len(options) < 4 or not question_text or len(question_text) < 10:
            continue
        
        # Build formatted options
        formatted_options = []
        for label in ['A', 'B', 'C', 'D', 'E']:
            if label in options:
                formatted_options.append({
                    "label": label,
                    "text": options[label]
                })
        
        # Truncate explanation
        if len(explanation_part) > 600:
            explanation_part = explanation_part[:600] + "..."
        
        questions.append({
            "id": len(questions) + 1,
            "text": question_text,
            "options": formatted_options,
            "correct_answer": correct_answer,
            "explanation": explanation_part if explanation_part else "See course materials.",
            "difficulty": "medium"
        })
    
    return questions


def parse_all_questions():
    """Parse all .docx files"""
    base_dir = Path(__file__).parent / "practice questions"
    
    courses = {
        "flk-1": {"name": "FLK 1", "slug": "flk-1", "topics": []},
        "flk-2": {"name": "FLK 2", "slug": "flk-2", "topics": []}
    }
    
    flk1_files = [
        "BUSINESS LAW  PRACTICE QUESTION.docx",
        "CONSTITUTIONAL LAW PRACTICE QUESTIONS.docx",
        "CONTRACT PRACTICE QUESTIONS.docx",
        "DISPUTE RESOLUTION PRACTICE QUESTIONS.docx",
        "LEGAL SYSTEM PRACTICE QUESTIONS.docx",
        "Legal Services practice questions.docx",
        "PROFESSIONAL ETHICS PRACTICE QUESTION (1).docx",
        "Tort-PRACTICE QUESTION.docx"
    ]
    
    flk2_files = [
        "CRIMINAL LAW  QUESTIONS.docx",
        "CRIMINAL PRACTICE QUESTIONS.docx",
        "LAND LAW  PRACTICE QUESTION.docx",
        "PROPERTY LAW PRACTICE QUESTION.docx"
    ]
    
    # Parse FLK 1
    for filename in flk1_files:
        filepath = base_dir / filename
        if filepath.exists():
            print(f"Parsing {filename}...")
            try:
                areas = parse_docx_with_areas(str(filepath))
                topic_name = extract_topic_from_filename(filename)
                topic_slug = slugify(topic_name)
                total_q = sum(a["question_count"] for a in areas)
                
                courses["flk-1"]["topics"].append({
                    "name": topic_name,
                    "slug": topic_slug,
                    "area_count": len(areas),
                    "question_count": total_q,
                    "areas": areas
                })
                print(f"  -> {len(areas)} areas, {total_q} questions")
            except Exception as e:
                print(f"  -> Error: {e}")
                import traceback
                traceback.print_exc()
    
    # Parse FLK 2
    for filename in flk2_files:
        filepath = base_dir / "FLK 2" / filename
        if filepath.exists():
            print(f"Parsing FLK 2/{filename}...")
            try:
                areas = parse_docx_with_areas(str(filepath))
                topic_name = extract_topic_from_filename(filename)
                topic_slug = slugify(topic_name)
                total_q = sum(a["question_count"] for a in areas)
                
                courses["flk-2"]["topics"].append({
                    "name": topic_name,
                    "slug": topic_slug,
                    "area_count": len(areas),
                    "question_count": total_q,
                    "areas": areas
                })
                print(f"  -> {len(areas)} areas, {total_q} questions")
            except Exception as e:
                print(f"  -> Error: {e}")
    
    return courses


def main():
    print("=" * 60)
    print("Practice Questions Parser (Area Organization)")
    print("=" * 60)
    
    courses = parse_all_questions()
    
    total_topics = sum(len(c["topics"]) for c in courses.values())
    total_areas = sum(sum(t.get("area_count", 0) for t in c["topics"]) for c in courses.values())
    total_questions = sum(sum(t["question_count"] for t in c["topics"]) for c in courses.values())
    
    print("\n" + "=" * 60)
    print(f"Summary: {total_topics} topics, {total_areas} areas, {total_questions} questions")
    print("=" * 60)
    
    output_path = Path(__file__).parent / "quiz" / "practice_questions_data.json"
    with open(output_path, 'w', encoding='utf-8') as f:
        json.dump(courses, f, indent=2, ensure_ascii=False)
    
    print(f"\nSaved to: {output_path}")


if __name__ == "__main__":
    main()
