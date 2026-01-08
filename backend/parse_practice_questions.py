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
    
    # Find area markers with various formats:
    # "A- Title", "B. title", "C: Title", "D.Title", "E Title" (just space)
    # Pattern 1: Letter + separator (dash, period, colon) + title (any case)
    # Pattern 2: Letter + space + capitalized title (for "E Funding" format)
    area_pattern = re.compile(r'^([A-Z])(?:\s*[-–—:]+\s*(.+)|\.\s*(.+)|\s+([A-Z].+))$')
    
    # First pass: Find paragraphs that are followed by "Question 1" - these are section headers
    # This reliably identifies section headers vs answer options
    potential_areas = []
    
    # Special headers that don't fit the standard pattern (missing letter prefix)
    # Map exact text to proper letter/name
    special_headers = {
        "The regulatory role of the SRA:& professional indemnity insurance": ("A", "The regulatory role of the SRA:& professional indemnity insurance"),
        # Add simpler version in case of minor variations
        "The regulatory role of the SRA:& professional indemnity": ("A", "The regulatory role of the SRA:& professional indemnity insurance"),
    }
    
    for i, para in enumerate(paragraphs):
        para_clean = para.strip()
        
        # Check special headers first
        if para_clean in special_headers:
            letter, name = special_headers[para_clean]
            potential_areas.append({
                'index': i,
                'letter': letter,
                'title': name
            })
            continue
            
        match = area_pattern.match(para)
        if match:
            title = match.group(2) or match.group(3) or match.group(4)
            if title:
                # Section headers are followed by "Question 1" within a few paragraphs
                # Answer options appear WITHIN questions, not before Question 1
                is_section_header = False
                
                # Look ahead for "Question 1" (strict match - must be within 2 paragraphs)
                # Section header -> Question 1 appears very close together
                for j in range(i + 1, min(i + 3, len(paragraphs))):
                    next_para = paragraphs[j].strip().lower()
                    if next_para == 'question 1' or next_para.startswith('question 1:') or next_para.startswith('question 1 '):
                        is_section_header = True
                        break
                
                if is_section_header:
                    potential_areas.append({
                        'index': i,
                        'letter': match.group(1).upper(),
                        'title': title.strip()
                    })
    
    areas = []
    
    # Process areas: extract questions between each area marker
    for idx, area_info in enumerate(potential_areas):
        start_idx = area_info['index'] + 1
        end_idx = potential_areas[idx + 1]['index'] if idx + 1 < len(potential_areas) else len(paragraphs)
        
        content_paragraphs = paragraphs[start_idx:end_idx]
        questions = parse_questions_from_content("\n".join(content_paragraphs))
        
        if questions:
            areas.append({
                "letter": area_info['letter'],
                "name": area_info['title'],
                "slug": slugify(f"{area_info['letter']}-{area_info['title']}"),
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
            # Pattern 5: "Option X is correct" (found in explanation sometimes)
            correct_match = re.search(r'Option\s+([A-E])\s+is\s+correct', q_content, re.IGNORECASE)
            
        if not correct_match:
            # FLK 2 uses "Correct Answer: D" format
            correct_match = re.search(r'Correct Answer[:\s]+([A-E])', q_content, re.IGNORECASE)
        if not correct_match:
            # Professional Ethics uses "Answer: D" format
            correct_match = re.search(r'^Answer[:\s]+([A-E])', q_content, re.MULTILINE | re.IGNORECASE)
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
        
        # Extract title from first line
        lines = question_part.split('\n')
        title = ""
        start_idx = 0
        
        if lines:
            first_line = lines[0].strip()
            # Check for title pattern (stripping leading "Question N" artifacts like ": ", "- ", or just text)
            clean_title = re.sub(r'^[:\-\u2013\u2014\s]+', '', first_line).strip()
            
            # Ensure it's not an option (A. ...)
            is_option = re.match(r'^[A-E][\.\)\s]+', clean_title)
            
            # Check for terminal punctuation to distinguish Title from Sentence
            ends_with_punct = clean_title[-1] in ['.', '?', '!'] if clean_title else False
            
            # Only extract title if:
            # 1. Not an option
            # 2. More content follows (lines > 1)
            # 3. Does NOT end in terminal punctuation (Titles are usually fragments)
            if clean_title and not is_option and len(lines) > 1 and not ends_with_punct:
                title = clean_title
                start_idx = 1
        
        question_text_lines = []
        
        for line in lines[start_idx:]:
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

        # Fallback: If text is empty but we extracted a title, it means the title was actually the question text
        # (e.g. single line question without punctuation). Revert title to text to prevent data loss.
        if not question_text and title:
            question_text = title
            title = ""
        
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


def apply_manual_patches(courses):
    """Apply manual content fixes to specific questions"""
    try:
        # Patch Legal Services (FLK 1) -> Section D -> Question 1
        # "Financial services"
        # User requested update for: Benjamin, a litigation solicitor...
        
        flk1 = courses.get("flk-1")
        if not flk1: return
            
        ls_topic = next((t for t in flk1["topics"] if "Legal Services" in t["name"]), None)
        if ls_topic:
            # Finanical Services is usually Area D (Index 3)
            # Find Area with letter D
            area_d = next((a for a in ls_topic["areas"] if a["letter"] == "D"), None)
            if area_d and area_d["questions"]:
                q1 = area_d["questions"][0] # Q1
                
                new_text = """Benjamin, a litigation solicitor, is representing Matthew in a dispute over a commercial contract. During a lunch break, Matthew mentions he has £50,000 to invest and asks Benjamin if he should buy shares in "Quantum Tech PLC." Benjamin, who has no FCA authorization, tells him it’s a "strong buy" based on a news article he read. Benjamin does not charge for this advice and it is the first time he has ever given investment advice.\nHas Benjamin breached the s.19 General Prohibition?"""
                
                q1["question_text"] = new_text
                # Also ensure title is cleared if it was wrongly extracted
                # (The scenario starts immediately, so title might have captured "Benjamin...")
                # We want title empty or specific. User didn't ask for title.
                # If we clear title, the text is fully shown.
                if q1.get("title") and "Benjamin" in q1["title"]:
                    q1["title"] = "" 
                    
                print("-> Patched Legal Services Area D Question 1")

                # Patch Question 6
                if len(area_d["questions"]) >= 6:
                    q6 = area_d["questions"][5] # Index 5 is Q6
                    new_text_q6 = """Hannah, a partner at a law firm, sends a newsletter to 500 clients stating: "Our firm has exclusive access to a new bond issue from GreenEnergy Ltd. We highly recommend you invest now for a 10% return."\nIs this a breach of s.21 FSMA?"""
                    
                    q6["question_text"] = new_text_q6
                    
                    # Clear title if it captured part of the scenario
                    if q6.get("title") and ("Hannah" in q6["title"] or "Partner" in str(q6["title"])):
                        q6["title"] = ""
                        
                    print("-> Patched Legal Services Area D Question 6")
        
        # =====================================================
        # Patch Business Law Section A - Complete Replacement
        # =====================================================
        # Business Law is topic 0 in FLK-1
        # Section A doesn't exist in the parsed data, so we INSERT it
        bl_topic = flk1["topics"][0] if flk1["topics"] else None
        if bl_topic:
            # Check if Area A already exists
            area_a = next((a for a in bl_topic["areas"] if a["letter"] == "A"), None)
            if area_a:
                # Replace existing Section A
                area_a["name"] = "Business and organisational characteristics (sole trader/partnership/LLP/private and unlisted public companies)"
                area_a["slug"] = "a-business-and-organisational-characteristics"
                area_a["question_count"] = 13
            else:
                # Create new Section A and insert at beginning
                area_a = {
                    "letter": "A",
                    "name": "Business and organisational characteristics (sole trader/partnership/LLP/private and unlisted public companies)",
                    "slug": "a-business-and-organisational-characteristics",
                    "question_count": 13,
                    "questions": []
                }
                bl_topic["areas"].insert(0, area_a)
            
            # Set the questions for Section A
            area_a["questions"] = [
                    {
                        "id": 1,
                        "title": "",
                        "text": """Marcus, a freelance graphic designer, has operated successfully as a sole trader for five years, trading as "Marcus Designs." He uses his personal bank account for all business transactions. He decides to take on a large, complex web design project for a major retailer. The contract is worth £75,000. Midway through the project, a critical error in the site's code (caused by Marcus) leads to a system crash during the retailer's peak sales period, resulting in claimed losses of £200,000. The retailer sues for this amount.\nWhat is the extent of Marcus's personal liability for this debt?""",
                        "options": [
                            {"label": "A", "text": "He is liable only up to the value of his business assets, such as his computer and software."},
                            {"label": "B", "text": "He is not liable as he was acting in a business capacity, and the debt is owed by the business name 'Marcus Designs'."},
                            {"label": "C", "text": "He has unlimited personal liability; the debt can be enforced against all his personal assets."},
                            {"label": "D", "text": "His liability is limited to the £75,000 contract value."},
                            {"label": "E", "text": "He is only liable if he was negligent, which would need to be proven in court first."}
                        ],
                        "correct_answer": "C",
                        "explanation": "Option C is correct. A sole trader has no separate legal personality from the individual. The business is the individual. Consequently, the individual has unlimited personal liability for all business debts and obligations, including those arising from negligence or breach of contract. All of the sole trader's personal assets (house, car, savings) are potentially available to satisfy business debts. The trading name is simply a label; it does not create a distinct legal entity.\nOption A is incorrect; the distinction between business and personal assets is irrelevant for liability purposes for a sole trader.\nOption B is incorrect; 'Marcus Designs' is not a legal entity that can own debts separately from Marcus himself.\nOption D is incorrect; liability is not capped by the contract value but by the full loss caused.\nOption E is incorrect; liability for breach of contract is strict. Even if negligence needed proving for a tort claim, once established, his liability would still be unlimited.",
                        "difficulty": "medium"
                    },
                    {
                        "id": 2,
                        "title": "",
                        "text": """Anya and Ben, friends since university, decide to start a boutique fitness studio together. They verbally agree to share all profits and losses 50/50, contribute £10,000 each for start-up costs, and both work full-time in the business. They do not draft a formal partnership agreement. They trade successfully as "Elevate Fitness" for two years. After a disagreement, Ben leaves the partnership without giving notice and starts a competing studio across town, taking several key clients with him. Anya is left to run the business alone and struggles with the debt incurred from a recent equipment loan.\nWhich of the following statements best reflects the legal position regarding the dissolution of the partnership?""",
                        "options": [
                            {"label": "A", "text": "The partnership was never legally formed because there was no written agreement, so Ben has no ongoing liabilities."},
                            {"label": "B", "text": "The partnership has been dissolved by Ben's express will to leave, triggering a winding-up of the business under the Partnership Act 1890."},
                            {"label": "C", "text": "The partnership continues with Anya as the sole proprietor, and Ben has no further liability for debts incurred after his departure."},
                            {"label": "D", "text": "Ben's departure is a breach of contract, but the partnership continues unless Anya also agrees to dissolve it."},
                            {"label": "E", "text": "The partnership is a partnership at will, which Ben has dissolved by his notice of leaving, but he remains liable for partnership debts incurred before his departure."}
                        ],
                        "correct_answer": "E",
                        "explanation": "Option E is correct. Under the Partnership Act 1890, where no fixed term is agreed, the partnership is a 'partnership at will'. A partnership at will can be dissolved by any partner giving notice of their intention to dissolve it (s.26). Ben's act of leaving constitutes such notice. However, under s.36, a partner who leaves remains liable for the debts and obligations of the firm incurred before their departure. They are not liable for debts incurred after they leave, unless they are held out as still being a partner. The absence of a written agreement does not prevent a partnership from existing; it is established by conduct (sharing profits, running a business in common).\nOption A is incorrect; a partnership can be formed orally or by conduct.\nOption B is partially correct but incomplete; dissolution triggers winding-up, but option E more precisely addresses the type of partnership and the key issue of ongoing liability.\nOption C is incorrect; a partnership requires at least two persons. If one leaves, the partnership ends unless a new partnership is formed. Ben remains liable for pre-departure debts.\nOption D is incorrect; for a partnership at will, a single partner's notice is sufficient to dissolve it.",
                        "difficulty": "medium"
                    },
                    {
                        "id": 3,
                        "title": "",
                        "text": """Zara, Chloe, and Liam are architects who wish to practice together. They want the flexibility of a partnership but seek to protect their personal assets from negligence claims against the firm. They also want the internal management structure to be governed by a formal agreement. They do not intend to list the business on any stock exchange.\nWhich business vehicle is most suitable for their needs?""",
                        "options": [
                            {"label": "A", "text": "A general partnership under the Partnership Act 1890."},
                            {"label": "B", "text": "A private company limited by shares."},
                            {"label": "C", "text": "A Limited Liability Partnership (LLP)."},
                            {"label": "D", "text": "An unlisted public limited company."},
                            {"label": "E", "text": "A sole trader with the others as employees."}
                        ],
                        "correct_answer": "C",
                        "explanation": "Option C is correct. A Limited Liability Partnership (LLP) under the Limited Liability Partnerships Act 2000 combines features of a partnership and a company. It provides its members (partners) with limited liability, protecting personal assets from business debts, including negligence claims. Internally, it is governed by a members' agreement, providing the desired contractual flexibility for management and profit-sharing. It has separate legal personality. This suits professional firms like architects. A private company (B) also offers limited liability but has a more rigid internal governance structure (model articles, directors' duties) and may be less familiar for a professional practice.\nOption A is incorrect because a general partnership offers no limited liability.\nOption B is possible but less ideal than an LLP for a professional practice wanting partnership-style internal governance.\nOption D is incorrect; an unlisted public company (PLC) is designed for larger organizations and has more onerous capital and regulatory requirements.\nOption E is impractical and does not provide limited liability to the 'employees'.",
                        "difficulty": "medium"
                    },
                    {
                        "id": 4,
                        "title": "",
                        "text": """"Swift Deliveries Ltd" is a private company limited by shares. Its articles of association state that the directors have the power to manage the business. The sole director and majority shareholder, Raj, enters into a five-year contract on behalf of the company to lease a large warehouse at an above-market rate from his brother-in-law. The company later suffers financial difficulties, and the minority shareholders argue the lease is not in the company's best interests and is a misuse of Raj's powers.\nWhich of the following best describes the legal nature of the company in assessing whether Raj had the authority to bind it?""",
                        "options": [
                            {"label": "A", "text": "Raj's authority to bind it is determined by the company's constitution and agency principles."},
                            {"label": "B", "text": "As the majority shareholder, Raj is the company, so his actions are always the company's actions."},
                            {"label": "C", "text": "The company is a partnership of its shareholders, so Raj needed the shareholders' consent for a long-term lease."},
                            {"label": "D", "text": "The company's capacity is unlimited, so Raj could bind it to any contract."},
                            {"label": "E", "text": "As a private company, it can only act through unanimous shareholder agreements."}
                        ],
                        "correct_answer": "A",
                        "explanation": "Option A is correct. A registered company is a separate legal person distinct from its members and directors (Salomon v Salomon). It can only act through human agents. The authority of an agent (like a director) to bind the company is governed by the company's constitution (the articles of association) and the general law of agency. The articles typically delegate management to the directors. Therefore, Raj's authority stems from his role as a director under the articles. Whether he exceeded his authority or breached his duties is a separate question, but the company, as a separate entity, is prima facie bound if he acted with apparent authority.\nOption B is incorrect; the separate legal personality doctrine means the company is distinct from even a sole shareholder-director.\nOption C is incorrect; a company is not a partnership.\nOption D is incorrect; a company's capacity is governed by its constitution and law, not unlimited.\nOption E is incorrect; private companies can act through their directors.",
                        "difficulty": "medium"
                    },
                    {
                        "id": 5,
                        "title": "",
                        "text": """Three entrepreneurs set up a private company, "Tech Innovate Ltd." They are the only shareholders and directors. They have not entered into any shareholders' agreement. Two of the founders wish to remove the third founder, Alex, as a director due to poor performance. The company's articles are the Model Articles for private companies.\nWhat is the correct procedure for removing Alex as a director?""",
                        "options": [
                            {"label": "A", "text": "The two founding shareholders can pass an ordinary resolution at a general meeting, giving special notice."},
                            {"label": "B", "text": "Alex can only be removed by a unanimous vote of all shareholders."},
                            {"label": "C", "text": "Alex can only be removed for cause, such as breach of duty, and requires a court order."},
                            {"label": "D", "text": "As Alex was a founder, he cannot be removed against his will unless he agrees to sell his shares."},
                            {"label": "E", "text": "The other directors can pass a resolution at a board meeting to remove him."}
                        ],
                        "correct_answer": "A",
                        "explanation": "Option A is correct. The Companies Act 2006, s.168, provides that a company may by ordinary resolution remove a director before the expiration of their period of office, notwithstanding anything in any agreement between the company and the director. Special notice (28 days) of the resolution is required. This provision is reinforced by Article 17 of the Model Articles for private companies. The power resides with the shareholders in general meeting, not the other directors. This is a fundamental shareholder right.\nOption B is incorrect; a simple majority of shareholders suffices.\nOption C is incorrect; s.168 allows removal with or without cause.\nOption D is incorrect; removal as a director is distinct from requiring a share sale.\nOption E is incorrect; directors cannot normally remove a fellow director unless the articles provide such a power (which the Model Articles do not).",
                        "difficulty": "medium"
                    },
                    {
                        "id": 6,
                        "title": "",
                        "text": """"Bespoke Cabinets LLP" is a successful Limited Liability Partnership with four designated members. The LLP agreement is silent on what happens when a member dies. One of the members, David, dies unexpectedly. His estate includes his capital contribution and share of accrued profits in the LLP.\nWhat is the legal effect of David's death on the LLP and his estate's interest?""",
                        "options": [
                            {"label": "A", "text": "The LLP is automatically dissolved and must be wound up."},
                            {"label": "B", "text": "David's estate automatically becomes a new member of the LLP with full rights."},
                            {"label": "C", "text": "The LLP continues, and David's estate is entitled to be paid out his share of the capital and profits, but does not become a member."},
                            {"label": "D", "text": "The remaining members must purchase David's share within 28 days at a fair market value."},
                            {"label": "E", "text": "David's membership interest lapses, and his estate has no claim against the LLP."}
                        ],
                        "correct_answer": "C",
                        "explanation": "Option C is correct. Under the Limited Liability Partnerships Act 2000 and the default provisions in the Limited Liability Partnerships Regulations 2001, unless the members' agreement provides otherwise, the death of a member does not cause the dissolution of the LLP. The LLP continues as a separate legal entity. The deceased member's personal representative is entitled to a share of the profits until the date of death and to be paid out the deceased's share of capital. However, the personal representative does not automatically become a member; membership is personal. This default position encourages business continuity.\nOption A is incorrect as it provides the default rule for a general partnership under the Partnership Act 1890, but not for an LLP.\nOption B is incorrect; membership is not automatically transferred.\nOption D is incorrect as it imposes a specific timetable not found in the default rules.\nOption E is incorrect; the estate has a clear financial claim.",
                        "difficulty": "medium"
                    },
                    {
                        "id": 7,
                        "title": "",
                        "text": """Elena operates a thriving online jewellery business as a sole trader. She is considering incorporating a private limited company to take over the business. Which of the following is a disadvantage of incorporation she should consider?""",
                        "options": [
                            {"label": "A", "text": "Increased personal liability for business debts."},
                            {"label": "B", "text": "A requirement to have at least two shareholders."},
                            {"label": "C", "text": "Greater administrative burdens and public disclosure of financial information."},
                            {"label": "D", "text": "The inability to raise capital from external investors."},
                            {"label": "E", "text": "Loss of control over business decisions to external managers."}
                        ],
                        "correct_answer": "C",
                        "explanation": "Option C is correct. A key disadvantage of incorporation as a company (compared to being a sole trader) is the increased regulatory burden. Companies must file annual accounts and a confirmation statement with Companies House, which are publicly available. They must comply with the Companies Act 2006 on matters like meetings, resolutions, and director duties. Sole traders have no such public filing requirements and face simpler administration.\nOption A is incorrect; incorporation brings limited liability, which reduces personal liability, it does not increase it.\nOption B is incorrect; a private company can have a single shareholder.\nOption D is incorrect; a private company can raise capital from external investors (e.g., through a private share placing), which is often harder for a sole trader.\nOption E is incorrect as it is not an inevitable disadvantage; in a small private company, the sole trader would likely be the sole director and shareholder, retaining full control.",
                        "difficulty": "medium"
                    },
                    {
                        "id": 8,
                        "title": "",
                        "text": """Two friends, Omar and Pete, start a business selling imported coffee without any formal agreement. Omar provides 70% of the start-up capital and does the bookkeeping from home. Pete provides 30% and manages the day-to-day stall at the market. They split the net profits 50/50. After a year, they have a dispute. Omar claims that as he provided most of the capital, he is entitled to 70% of the assets if they split up. Pete argues they are equal partners.\nBased on the definition in the Partnership Act 1890, are Omar and Pete in partnership?""",
                        "options": [
                            {"label": "A", "text": "No, because there is no written partnership agreement."},
                            {"label": "B", "text": "No, because the profit-sharing ratio (50/50) is not aligned with capital contributions (70/30), indicating a mere profit-sharing scheme."},
                            {"label": "C", "text": "Yes, the carrying on of a business in common with a view of profit establishes a partnership."},
                            {"label": "D", "text": "No, because Omar is not actively involved in the day-to-day sales, so he is merely a lender/investor."},
                            {"label": "E", "text": "Yes, but only if they register the partnership with Companies House."}
                        ],
                        "correct_answer": "C",
                        "explanation": "Option C is correct. Section 1 of the Partnership Act 1890 defines partnership as \"the relation which subsists between persons carrying on a business in common with a view of profit.\" The core elements are present: two persons, a business (selling coffee), carried on in common (they are both involved, albeit in different roles), with a view to profit. Sharing profits is prima facie evidence of partnership (s.2(3)), and unequal capital contributions are common and do not prevent a partnership from arising. The absence of a written agreement is irrelevant. The misalignment of capital and profit share is a matter for the partnership agreement (which here is oral/conduct-based), not a barrier to existence.\nOption A is incorrect; a partnership can be formed informally.\nOption B misinterprets s.2(3); sharing profits is evidence of partnership, and the courts look at the substance of the relationship.\nOption D is incorrect; a partner can be a \"sleeping partner\" who contributes capital but is not active in daily operations.\nOption E is incorrect; general partnerships are not registered (unlike LLPs).",
                        "difficulty": "medium"
                    },
                    {
                        "id": 9,
                        "title": "",
                        "text": """"GreenScape PLC" is an unlisted public company limited by shares. It has a large number of shareholders. Its board is considering a major investment that would significantly change the company's objects. The company's articles require a 75% majority vote for such a change.\nWhich of the following is a key characteristic that distinguishes it from a private company in this context?""",
                        "options": [
                            {"label": "A", "text": "It cannot alter its articles of association."},
                            {"label": "B", "text": "It must have a company secretary, whereas a private company may not."},
                            {"label": "C", "text": "Its shares are prohibited from being sold to the public."},
                            {"label": "D", "text": "It must have a minimum of two directors, whereas a private company needs only one."},
                            {"label": "E", "text": "It cannot restrict the transfer of its shares."}
                        ],
                        "correct_answer": "B",
                        "explanation": "Option B is correct. Under the Companies Act 2006, a public company (whether listed or unlisted) is required to have a company secretary (s.271). A private company is not required to appoint one (s.270). This is a key statutory distinction. While option D is also true (a plc needs two directors, a private company needs one), option B is a more definitive and less commonly known distinguishing characteristic. Option E is incorrect; an unlisted plc can still have transfer restrictions in its articles. Option A is incorrect; both can alter articles.\nOption C is incorrect; an unlisted public company's shares are not traded on a public market, but they can be offered to the public, whereas a private company is prohibited from offering shares to the public.",
                        "difficulty": "medium"
                    },
                    {
                        "id": 10,
                        "title": "",
                        "text": """A general partnership of three accountants, trading as "Summit Financial," has incurred significant debts it cannot pay. One partner, Clara, has substantial personal wealth. The other two partners are insolvent. A creditor obtains a court judgment against the partnership.\nWhat is the extent of Clara's liability to the creditor?""",
                        "options": [
                            {"label": "A", "text": "She is liable only for one-third of the debt, as she is one of three partners."},
                            {"label": "B", "text": "She is not personally liable; only the partnership's assets can be used."},
                            {"label": "C", "text": "She has joint and several liability with her partners, meaning the creditor can pursue her for the full amount."},
                            {"label": "D", "text": "She is liable only if she was personally involved in incurring the specific debt."},
                            {"label": "E", "text": "Her liability is limited to the amount she contributed to the partnership capital."}
                        ],
                        "correct_answer": "C",
                        "explanation": "Option C is correct. In a general partnership, partners have joint and several liability for all partnership debts and obligations (Partnership Act 1890, s.9). This means each partner is liable alongside the others (jointly) and also individually (severally) for the whole debt. A creditor can choose to sue any one partner for the entire amount. That partner (Clara) would then have to seek contribution from her insolvent co-partners, but that is a separate internal matter. This is a fundamental (and risky) characteristic of general partnerships.\nOption A is incorrect; liability is not proportionate for the creditor, though internally partners may contribute according to their profit-sharing ratio.\nOption B is incorrect as it describes the position for an LLP or a company, not a general partnership.\nOption D is incorrect; liability arises from the partnership relationship, not personal involvement in the transaction.\nOption E is incorrect; there is no capital-based limit on liability in a general partnership.",
                        "difficulty": "medium"
                    },
                    {
                        "id": 11,
                        "title": "",
                        "text": """A private company, "DataSolve Ltd," has an issued share capital of 100 £1 ordinary shares. Its articles grant pre-emption rights on the transfer of shares. The sole director and 60% shareholder, Imran, wishes to sell 20 of his shares to an external investor, Leo. The other shareholder, Meera (40%), cannot afford to buy them. Imran proceeds with the sale to Leo without first offering the shares to Meera. Meera objects.\nWhat is the likely consequence of Imran's actions?""",
                        "options": [
                            {"label": "A", "text": "The transfer is void, and the shares must be offered to Meera first."},
                            {"label": "B", "text": "The transfer is valid because Meera could not afford to buy the shares, so pre-emption rights are waived."},
                            {"label": "C", "text": "The transfer is valid because pre-emption rights in a private company are unenforceable."},
                            {"label": "D", "text": "The transfer is voidable at Meera's option, and she may apply to court to have it set aside."},
                            {"label": "E", "text": "The transfer is a breach of Imran's duty as a director, but the share transfer itself is effective."}
                        ],
                        "correct_answer": "D",
                        "explanation": "Option D is most accurate. Pre-emption rights in a private company's articles are a contractual right for the benefit of the other shareholders. A breach of these rights does not automatically render the transfer void (as it is a transfer of legal title between Imran and Leo). However, it is a breach of the articles, making the transfer voidable. The wronged shareholder (Meera) can seek an injunction to prevent an improper transfer before it happens or, after the fact, may apply to court for relief, which could include setting aside the transfer or claiming damages from Imran. The court has discretion.\nOption A is incorrect and too absolute.\nOption B is incorrect; inability to pay does not waive the right to be offered the shares.\nOption C is incorrect; such rights are standard and enforceable.\nOption E is partially true but incomplete; the primary breach is of the articles, not necessarily a director's duty.",
                        "difficulty": "medium"
                    },
                    {
                        "id": 12,
                        "title": "",
                        "text": """Four individuals establish a private company, "Culinary Creations Ltd," to run a restaurant. They are all shareholders and directors. They draft a shareholders' agreement which includes a clause stating that no director can be removed except by a unanimous vote of all shareholders. Two years later, a majority of shareholders wish to remove one of the directors for underperformance.\nIs the clause in the shareholders' agreement effective to prevent removal by ordinary resolution?""",
                        "options": [
                            {"label": "A", "text": "Yes, because a shareholders' agreement is a binding contract that overrides the Act."},
                            {"label": "B", "text": "No, there is a statutory right to remove a director by ordinary resolution, which cannot be contracted out of."},
                            {"label": "C", "text": "Yes, but only if the clause is also replicated in the company's articles of association."},
                            {"label": "D", "text": "No, because the clause is in a shareholders' agreement, which is not a constitutional document."},
                            {"label": "E", "text": "It is effective only if all current shareholders signed the agreement."}
                        ],
                        "correct_answer": "B",
                        "explanation": "Option B is correct. The Companies Act 2006, s.168(1), states: \"A company may by ordinary resolution remove a director before the expiration of his period of office, notwithstanding anything in any agreement between it and him.\" The courts have interpreted this powerful \"notwithstanding\" phrase to mean that the statutory right is fundamental and cannot be excluded or fettered by any agreement, including a shareholders' agreement or a provision in the articles. Therefore, the clause is ineffective to block an ordinary resolution for removal. However, such a clause might give rise to a claim for damages for breach of contract against the shareholders who voted for removal.\nOption A is incorrect; a statutory right trumps a contractual agreement.\nOption C is incorrect; even in the articles, such a clause would be ineffective against s.168.\nOption D is incorrect as it understates the reason; the key is the statutory override, not just the document type.\nOption E is incorrect; the statutory provision applies regardless.",
                        "difficulty": "medium"
                    },
                    {
                        "id": 13,
                        "title": "",
                        "text": """Sophia has run "Sophia's Bookshop" as a successful sole trader for a decade. She is considering forming a private limited company, "Bookworm Ltd," to which she will sell her business assets. She will be the sole director and shareholder. She is concerned about ensuring the company honours the existing store lease and liabilities to book suppliers.\nWhich of the following is a key legal consequence of incorporation in this scenario?""",
                        "options": [
                            {"label": "A", "text": "Sophia will automatically become an employee of the company, requiring a formal employment contract."},
                            {"label": "B", "text": "The bookshop's existing debts will automatically transfer to and become the responsibility of the new company."},
                            {"label": "C", "text": "The company will not be bound by the store lease or supplier contracts unless they are formally assigned or novated to it."},
                            {"label": "D", "text": "Sophia's personal liability for future business debts will increase."},
                            {"label": "E", "text": "The business must immediately change its trading name."}
                        ],
                        "correct_answer": "C",
                        "explanation": "Option C is correct. Upon incorporation, a new legal entity (the company) is created. It is not automatically liable for the contracts and debts of the sole trader's business. For the company to take them over, the contracts must be formally assigned or novated (with the consent of the other party, e.g., the landlord or supplier). This is a crucial practical step when incorporating an existing business. Failure to do this could leave Sophia personally liable under the original contracts while also making the company liable if it adopts the benefit of the contracts.\nOption A is not automatic, though it is prudent for tax and employment law reasons.\nOption B is incorrect; debts do not automatically transfer.\nOption D is incorrect; her liability for future debts incurred by the company will be limited, not increased.\nOption E is incorrect; the business can trade under the same name, but the company's registered name will be different, and business stationery must show the company's details.",
                        "difficulty": "medium"
                    }
                ]
            print("-> Patched Business Law Section A with 13 new questions")
            
            # =====================================================
            # Patch Business Law Section B - Legal personality
            # =====================================================
            area_b = next((a for a in bl_topic["areas"] if a["letter"] == "B"), None)
            if area_b:
                area_b["name"] = "Legal personality and limited liability"
                area_b["slug"] = "b-legal-personality-and-limited-liability"
                area_b["question_count"] = 12
            else:
                area_b = {
                    "letter": "B",
                    "name": "Legal personality and limited liability",
                    "slug": "b-legal-personality-and-limited-liability",
                    "question_count": 12,
                    "questions": []
                }
                # Insert after Section A
                bl_topic["areas"].insert(1, area_b)
            
            area_b["questions"] = [
                {
                    "id": 1,
                    "title": "",
                    "text": """Thomas is the sole director and shareholder of "Harbour Freight Ltd," a private company that operates a small cargo shipping business. The company is undercapitalised and has one old vessel. Thomas instructs the company to enter into a contract with "Global Goods plc" to transport fragile electronics. During the voyage, due to Thomas's negligent failure to maintain the vessel properly, the cargo is severely damaged by seawater. Harbour Freight Ltd has no insurance and insufficient assets to cover the £500,000 loss. Global Goods plc seeks to recover the full amount from Thomas personally, arguing he is the "alter ego" of the company and that the company is a mere façade.\nWhat is the primary obstacle to Global Goods' claim against Thomas personally?""",
                    "options": [
                        {"label": "A", "text": "Thomas can only be liable if he acted fraudulently."},
                        {"label": "B", "text": "Harbour Freight Ltd is a separate legal person distinct from Thomas, the company's debts are its own."},
                        {"label": "C", "text": "Thomas's liability is limited to the amount unpaid on his shares, which is likely zero."},
                        {"label": "D", "text": "Global Goods plc should have insured the cargo itself and cannot now shift the loss."},
                        {"label": "E", "text": "The claim is against the company, and Thomas is protected as an employee acting in the course of employment."}
                    ],
                    "correct_answer": "B",
                    "explanation": "Option B is correct. The foundational principle from Salomon v Salomon is that a duly incorporated company is a separate legal person from its members (shareholders) and directors. The company's debts are its debts, not those of its shareholders or directors. Limited liability protects Thomas as a shareholder; his liability is limited to any amount unpaid on his shares. His potential liability as a director for negligence is a separate issue (breach of duty), but the primary obstacle to a direct claim by a creditor for a company debt is the separate legal personality doctrine. The courts are very reluctant to \"pierce the corporate veil\" and hold a shareholder liable.\nOption A states a potential ground for piercing the veil, but it is not the primary obstacle; the primary obstacle is the separate legal personality itself.\nOption C is correct regarding his liability as a shareholder, but option B is the more fundamental statement of the legal principle creating that limit.\nOption D is irrelevant to the legal question of Thomas's personal liability.\nOption E mischaracterises his role; he is a director and shareholder, not a mere employee in this context.",
                    "difficulty": "medium"
                },
                {
                    "id": 2,
                    "title": "",
                    "text": """"Prestige Properties Ltd" is a property development company owned and controlled by Mr. Khan. Mr. Khan causes Prestige Properties Ltd to purchase a valuable London flat from Mrs. Smith. The purchase money is paid from the company's bank account. The legal title is registered in the company's name. During a subsequent divorce proceeding between Mr. Khan and his wife, the court is asked to determine if the flat is a marital asset. Mr. Khan argues it belongs to the company, not him personally.\nApplying the principle of separate legal personality, how should the court initially characterise the ownership of the flat?""",
                    "options": [
                        {"label": "A", "text": "The flat is owned by Mr. Khan because he controls the company and provided the funds."},
                        {"label": "B", "text": "The flat is owned by Prestige Properties Ltd, the registered legal owner."},
                        {"label": "C", "text": "The flat is owned jointly by Mr. Khan and the company as it was bought for his benefit."},
                        {"label": "D", "text": "The court should ignore the corporate structure as it is being used in the context of family law."},
                        {"label": "E", "text": "Ownership depends on whether the company was a mere nominee or agent for Mr. Khan."}
                    ],
                    "correct_answer": "B",
                    "explanation": "Option B is correct. The starting point, per Salomon, is that a company is a legal person capable of owning property. The flat is legally registered in the company's name and was paid for with the company's money. Therefore, prima facie, the company owns it. The court cannot simply disregard this because it is inconvenient in divorce proceedings. To attribute the asset to Mr. Khan, the court would need to find a specific legal basis, such as the company holding the property on a resulting trust for him (if he provided the money as a loan or gift is unclear) or, in the family law context, piercing the corporate veil if it was a façade (which requires evasive intent, not just ownership and control). The initial characterisation must respect separate legal personality.\nOption A is incorrect as it disregards the fundamental principle.\nOption C is incorrect as it has no basis in law without a specific trust arrangement.\nOption D is incorrect; the court applies general principles of property and company law unless statute provides otherwise.\nOption E is incorrect as it raises a possible argument but is not the initial characterisation; it is a potential avenue for challenging the prima facie position.",
                    "difficulty": "medium"
                },
                {
                    "id": 3,
                    "title": "",
                    "text": """"Safe Hands LLP" is a Limited Liability Partnership providing financial advice. One of its members, Julia, gives negligent advice to a client, causing the client a £1 million loss. The LLP has minimal professional indemnity insurance and few assets. The client sues.\nRegarding the liability of the other members of the LLP for this loss, which of the following is correct?""",
                    "options": [
                        {"label": "A", "text": "All members have joint and several unlimited personal liability, as in a general partnership."},
                        {"label": "B", "text": "Only Julia has personal liability; the other members are protected by limited liability."},
                        {"label": "C", "text": "The LLP itself is liable, and the client can only recover from the LLP's assets. The other members have no personal liability."},
                        {"label": "D", "text": "The LLP itself is liable, and if its assets are insufficient, the client can pursue Julia personally, but not the other members."},
                        {"label": "E", "text": "The client can pursue any member personally if it can prove they were involved in the management of the LLP."}
                    ],
                    "correct_answer": "D",
                    "explanation": "Option D is correct. An LLP is a separate legal entity (s.1(1), Limited Liability Partnerships Act 2000). A member of an LLP is not personally liable for the LLP's debts and obligations (s.1(4)). Therefore, the LLP itself is liable for the negligent advice given by Julia acting within her authority. If the LLP's assets are insufficient, the client cannot generally pursue the other members. However, the member who committed the wrongful act (Julia) is not shielded from personal liability for her own tortious acts. The client could sue Julia personally in tort for negligence, alongside suing the LLP. This is a key distinction from a company, where a director's tortious liability is usually borne by the company alone unless a personal duty of care is established.\nOption A describes a general partnership, not an LLP.\nOption B is incorrect because the LLP itself is also liable, and Julia retains personal liability.\nOption C is incorrect because it overlooks Julia's potential personal liability.\nOption E is incorrect; involvement in management does not, by itself, create personal liability for another member's tort.",
                    "difficulty": "medium"
                },
                {
                    "id": 4,
                    "title": "",
                    "text": """Mr. Adams is the sole shareholder and director of "Adams Utilities Ltd," which installs solar panels. He often uses the company's bank account to pay for personal expenses like holidays and his children's school fees, treating it as his own. The company becomes insolvent with substantial debts to suppliers. The liquidator seeks to make Mr. Adams personally liable for the company's debts.\nWhich legal doctrine provides the most direct route for the liquidator to challenge Mr. Adams' conduct?""",
                    "options": [
                        {"label": "A", "text": "Piercing the corporate veil on the grounds that the company is a mere façade."},
                        {"label": "B", "text": "The rule in Salomon v Salomon that the company is separate from its owner."},
                        {"label": "C", "text": "Provisions on wrongful trading under the Insolvency Act 1986."},
                        {"label": "D", "text": "The principle of limited liability protecting shareholders."},
                        {"label": "E", "text": "The doctrine of ultra vires, as the payments were not for company purposes."}
                    ],
                    "correct_answer": "C",
                    "explanation": "Option C is correct. The scenario describes classic \"wrongful trading\" or potentially \"fraudulent trading\" conduct under the Insolvency Act 1986. Wrongful trading (s.214) occurs when a director continues to trade and incur debts when they knew or ought to have known there was no reasonable prospect of avoiding insolvent liquidation. Mingling personal and company funds is a strong indicator of a failure to recognise the company's separate interests. If proven, the court can order the director to contribute personally to the company's assets. This is a more direct and commonly used route than the exceptional remedy of piercing the corporate veil (A). The veil-piercing doctrine (A) requires the corporate form to be used as a façade to conceal or evade existing legal obligations, which is a higher threshold.\nOption B is incorrect as it is the principle the liquidator is arguing against.\nOption D is incorrect as it the protection the liquidator is seeking to overcome.\nOption E is incorrect as it (ultra vires) relates to a company's capacity, not director liability for insolvency.",
                    "difficulty": "medium"
                },
                {
                    "id": 5,
                    "title": "",
                    "text": """A group of five architects operates as a general partnership, "Design Collective." The partnership borrows £200,000 from a bank to refurbish its studio. The loan agreement is signed by two partners on behalf of the partnership. The partnership later becomes insolvent, owing £300,000 in total, including the bank loan. One partner, Liam, had declared himself bankrupt personally before the loan was taken out, which his partners knew. The bank seeks to recover the loan from the other four partners.\nWhat is the extent of their personal liability?""",
                    "options": [
                        {"label": "A", "text": "They are jointly and severally liable for the full £200,000 loan."},
                        {"label": "B", "text": "They are each liable for one-fifth of the loan (£40,000)."},
                        {"label": "C", "text": "They are liable only if they personally signed the loan agreement."},
                        {"label": "D", "text": "They have no liability because the loan is a partnership debt, and the partnership is insolvent."},
                        {"label": "E", "text": "They are liable only for the portion of the loan used for partnership purposes."}
                    ],
                    "correct_answer": "A",
                    "explanation": "Option A is correct. In a general partnership, partners have joint and several liability for all partnership debts incurred while they are a partner (Partnership Act 1890, s.9). The bank can sue any one or all of the solvent partners for the entire debt. The fact that Liam is bankrupt does not affect the liability of the others; it merely means the bank is less likely to recover from him. The partners' internal agreement on sharing losses is irrelevant to the creditor. The liability is unlimited.\nOption B is incorrect as it describes internal contribution, not external liability to a creditor.\nOption C is incorrect; a partner's authority binds the firm, so all partners are liable even if they did not sign.\nOption D is incorrect; partnership creditors have recourse against partners' personal assets.\nOption E is incorrect; once it is a partnership debt, the purpose is not a limit on liability.",
                    "difficulty": "medium"
                },
                {
                    "id": 6,
                    "title": "",
                    "text": """"Holdings Ltd" is the parent company of "Subco Ltd," a wholly-owned subsidiary that manufactures chemicals. Subco Ltd causes a major pollution incident due to negligent operational practices. Subco Ltd is thinly capitalised and has minimal assets. The victims wish to sue Holdings Ltd, arguing it exercised total control over Subco's operations and should bear responsibility.\nBased on the principle in Adams v Cape Industries plc, what is the likely outcome?""",
                    "options": [
                        {"label": "A", "text": "The corporate veil will be pierced because Subco is under the control of Holdings."},
                        {"label": "B", "text": "Holdings will be liable as Subco was its agent."},
                        {"label": "C", "text": "Each company is a separate legal entity; Holdings is not liable for Subco's torts merely by virtue of ownership and control."},
                        {"label": "D", "text": "Holdings will be liable if it failed to ensure Subco had adequate insurance."},
                        {"label": "E", "text": "The court will consolidate the two companies for the purposes of the litigation."}
                    ],
                    "correct_answer": "C",
                    "explanation": "Option C is correct. Adams v Cape Industries established the principle that a corporate group comprises separate legal entities. The fact that a parent company owns and controls a subsidiary does not, by itself, mean the parent is liable for the subsidiary's torts or debts. To pierce the veil, it must be shown that the subsidiary was a mere façade or that the corporate form is being used to evade a pre-existing legal obligation. Mere control and undercapitalisation are insufficient. Victims are generally confined to claiming against the subsidiary's assets. This is a core aspect of separate legal personality in group structures.\nOption A is incorrect; control alone is not enough for piercing the veil.\nOption B is incorrect; agency requires a specific relationship where the subsidiary agrees to act on the parent's behalf, which is not implied by ownership.\nOption D is incorrect; there is no general duty on a parent to insure its subsidiary.\nOption E is incorrect; consolidation is a procedural matter in some jurisdictions but is not the general rule in English law for liability.",
                    "difficulty": "medium"
                },
                {
                    "id": 7,
                    "title": "",
                    "text": """When a company is incorporated, it obtains a legal personality distinct from its members. Which of the following is a direct legal consequence of this separate personality?""",
                    "options": [
                        {"label": "A", "text": "The company's shareholders are immune from all liability for the company's torts."},
                        {"label": "B", "text": "The company can own property, sue, and be sued in its own name."},
                        {"label": "C", "text": "The company's directors are automatically deemed to be employees with full employment rights."},
                        {"label": "D", "text": "The company is not subject to taxation, as only natural persons pay tax."},
                        {"label": "E", "text": "The company must have at least two members to maintain its separate existence."}
                    ],
                    "correct_answer": "B",
                    "explanation": "Option B is correct. The attribute of separate legal personality means the company is, in law, a \"person\" distinct from its human members. This grants it the legal capacity of a natural person, such as the ability to own property, enter into contracts, and institute or defend legal proceedings in its own name. This is the core practical consequence of incorporation.\nOption A is incorrect; shareholders have limited liability for debts, but separate personality doesn't grant immunity for their own torts if they commit them. Also, veil-piercing is possible in extreme cases.\nOption C is incorrect; directors are not automatically employees. They may have service contracts.\nOption D is incorrect; companies are subject to corporation tax.\nOption E is incorrect; a private company can have a single member.",
                    "difficulty": "medium"
                },
                {
                    "id": 8,
                    "title": "",
                    "text": """In Prest v Petrodel Resources Ltd, the Supreme Court considered piercing the corporate veil. Which of the following accurately states the principle confirmed in that case?""",
                    "options": [
                        {"label": "A", "text": "The corporate veil can be pierced whenever it is necessary in the interests of justice."},
                        {"label": "B", "text": "The corporate veil can only be pierced if a company is used as a façade to conceal or evade a pre-existing liability."},
                        {"label": "C", "text": "The corporate veil is automatically pierced in matrimonial cases to achieve a fair division of assets."},
                        {"label": "D", "text": "The corporate veil can be pierced if a company is undercapitalised."},
                        {"label": "E", "text": "The corporate veil can be pierced whenever a company is controlled by a single shareholder."}
                    ],
                    "correct_answer": "B",
                    "explanation": "Option B is correct. Prest v Petrodel (2013) is the leading modern case on piercing the corporate veil. The Supreme Court tightly restricted the doctrine. Lord Sumption stated that the veil may be pierced only when a person is under an existing legal obligation or liability which they deliberately evade by interposing a company under their control. It is not a general power to do justice. The court distinguished this from other situations where assets held by a company might be reached (e.g., via trust law or statute) without technically piercing the veil.\nOption A is incorrect as it is too broad and was rejected.\nOption C is incorrect; the court in Prest reached the assets via trust law, not by piercing the veil.\nOption D is incorrect as it is a factor in wrongful trading, not veil-piercing.\nOption E is incorrect; control alone is insufficient.",
                    "difficulty": "medium"
                },
                {
                    "id": 9,
                    "title": "",
                    "text": """Sarah is a sole trader running a catering business. She decides to incorporate "Sarah's Events Ltd" and transfers her business assets to the company in exchange for all its shares. She tells her existing suppliers that the company will now be responsible for future orders but does not formally novate the old contracts. One supplier, "Fresh Produce Co," which had an ongoing contract with Sarah as a sole trader, delivers goods after incorporation. The invoice remains in Sarah's trading name. The company does not pay.\nWho is primarily liable for this debt?""",
                    "options": [
                        {"label": "A", "text": "Sarah's Events Ltd, as it received the goods and is the new business entity."},
                        {"label": "B", "text": "Sarah personally, because the contract was with her as a sole trader and was not novated."},
                        {"label": "C", "text": "Both Sarah and the company are jointly and severally liable."},
                        {"label": "D", "text": "Neither, because the business was sold, discharging Sarah's liabilities."},
                        {"label": "E", "text": "Fresh Produce Co must elect whether to sue Sarah or the company."}
                    ],
                    "correct_answer": "B",
                    "explanation": "Option B is correct. The supplier had a contract with Sarah as a sole trader. Incorporation does not automatically transfer liabilities to the new company. For the company to become liable, the contract must be novated (i.e., a new contract agreed between the supplier and the company, releasing Sarah). Here, there is no evidence of novation; the supplier likely still views itself as contracting with Sarah. The company using the goods does not, by itself, transfer the contractual liability. Sarah remains personally liable on the original contract. The supplier may also have a claim against the company in restitution for unjust enrichment, but the primary contractual liability remains with Sarah.\nOption A is incorrect without novation.\nOption C is incorrect; joint liability does not arise automatically.\nOption D is incorrect; the sale of a business does not discharge the seller's debts unless the creditor agrees.\nOption E is incorrect; the doctrine of election does not apply here; the supplier has a clear contract with Sarah.",
                    "difficulty": "medium"
                },
                {
                    "id": 10,
                    "title": "",
                    "text": """An entrepreneur sets up a private company, "Digital Solutions Ltd," with a share capital of £1,000. He is the sole director and shareholder. The company rents servers and hires a programmer to develop software. The programmer is negligent, introducing a bug that causes a client's system to fail. The client sues for £500,000. Digital Solutions Ltd has only £5,000 in assets.\nCan the client successfully sue the entrepreneur personally for the programmer's negligence?""",
                    "options": [
                        {"label": "A", "text": "Yes, because he is the sole shareholder and director, making him vicariously liable for employees' torts."},
                        {"label": "B", "text": "Yes, because the company is undercapitalised, justifying piercing the corporate veil."},
                        {"label": "C", "text": "No, because the company is a separate legal person liable for the torts of its employees committed in the course of employment."},
                        {"label": "D", "text": "No, unless the client can show the entrepreneur personally assumed a duty of care."},
                        {"label": "E", "text": "Yes, but only if the programmer is also sued and found liable."}
                    ],
                    "correct_answer": "C",
                    "explanation": "Option C is correct. The company is the employer of the negligent programmer. Under the principle of vicarious liability, the company (as a separate legal person) is liable for torts committed by its employees in the course of employment. The client's claim in tort is against the company. The shareholder/director is not personally liable for the torts of the company's employees merely by virtue of ownership and control. The doctrine of separate legal personality shields him. Piercing the veil (B) would require more, such as the company being a façade. Undercapitalisation alone is not enough.\nOption D is incorrect as it highlights the only potential route to personal liability: if the director himself owed a personal duty of care (e.g., by giving direct advice), but the facts do not support this.\nOption A is incorrect; vicarious liability attaches to the employer (the company), not the ultimate shareholder.\nOption B is incorrect; undercapitalisation is not a standalone ground for piercing the veil.\nOption E is incorrect; the programmer's liability does not create shareholder liability.",
                    "difficulty": "medium"
                },
                {
                    "id": 11,
                    "title": "",
                    "text": """A Limited Liability Partnership (LLP) is formed by three accountants. Under the Limited Liability Partnerships Act 2000, how does the liability of a member of an LLP differ from that of a partner in a general partnership?""",
                    "options": [
                        {"label": "A", "text": "An LLP member has no liability for any debts of the LLP, while a general partner has unlimited liability."},
                        {"label": "B", "text": "An LLP member has liability limited to their capital contribution, while a general partner has unlimited liability."},
                        {"label": "C", "text": "The LLP itself is liable for its debts, and a member has no personal liability, whereas a general partner has joint and several unlimited liability."},
                        {"label": "D", "text": "An LLP member is only liable for debts they personally incur, while a general partner is liable for all partnership debts."},
                        {"label": "E", "text": "There is no difference; both have joint and several unlimited liability."}
                    ],
                    "correct_answer": "C",
                    "explanation": "Option C is the most precise. An LLP is a separate legal entity (s.1). It is liable for its own debts and obligations. A member is not, by reason of being a member, personally liable for these (s.1(4)). This is the core limited liability. In contrast, a general partnership is not a separate legal entity, and partners have joint and several unlimited liability for partnership debts (Partnership Act 1890, s.9). Option A is too absolute; an LLP member can be personally liable for their own negligence and may have liability for agreeing to guarantee an LLP debt. Option B is misleading; an LLP member's financial risk is the potential loss of their capital contribution, but legally their liability is not limited to that contribution in the same way a shareholder's is; they simply aren't personally liable for the LLP's debts at all. Option D is incorrect regarding LLPs; a member is not automatically liable for debts they incur on the LLP's behalf—the LLP is.\nOption E is incorrect.",
                    "difficulty": "medium"
                },
                {
                    "id": 12,
                    "title": "",
                    "text": """"Vertex Ltd" is a company that breaches a contract with "Omega Ltd." Omega Ltd obtains a judgment against Vertex Ltd but discovers Vertex Ltd has no assets. Omega Ltd learns that Mr. Sharp, the sole director and shareholder of Vertex Ltd, had previously transferred the company's only significant asset (a property) to another company he controls for nominal consideration, precisely when Vertex Ltd was facing financial difficulties.\nWhich remedy is most specifically designed to address this situation?""",
                    "options": [
                        {"label": "A", "text": "An application to pierce the corporate veil of Vertex Ltd."},
                        {"label": "B", "text": "A claim for wrongful trading against Mr. Sharp under s.214 Insolvency Act 1986."},
                        {"label": "C", "text": "An application to set aside the transaction as a transaction at an undervalue if Vertex Ltd is in liquidation."},
                        {"label": "D", "text": "A derivative claim against Mr. Sharp for breach of director's duties."},
                        {"label": "E", "text": "A personal action in tort against Mr. Sharp for the original breach of contract."}
                    ],
                    "correct_answer": "C",
                    "explanation": "Option C is correct. The scenario describes a clear transaction at an undervalue (selling an asset for far less than its worth) to a connected party when the company was in financial difficulty. This is precisely what s.238 of the Insolvency Act 1986 is designed to remedy, allowing a liquidator (or, in some cases, a creditor via the liquidator) to apply to court to have the transaction set aside. This allows the asset to be returned to Vertex Ltd's estate for the benefit of its creditors (including Omega Ltd). Veil-piercing (A) is a broader, more exceptional remedy. Wrongful trading (B) deals with continued trading, not asset stripping. A derivative claim (D) is for the company to sue the director, but here the company is likely unable to act. A personal action (E) would fail due to separate personality.",
                    "difficulty": "medium"
                }
            ]
            print("-> Patched Business Law Section B with 12 new questions")
            
            # =====================================================
            # Patch Business Law Section C - Procedures and documentation
            # =====================================================
            area_c = next((a for a in bl_topic["areas"] if a["letter"] == "C"), None)
            if area_c:
                area_c["name"] = "Procedures and documentation required to incorporate a company/form a partnership/LLP"
                area_c["slug"] = "c-procedures-and-documentation"
                area_c["question_count"] = 26
            else:
                area_c = {
                    "letter": "C",
                    "name": "Procedures and documentation required to incorporate a company/form a partnership/LLP",
                    "slug": "c-procedures-and-documentation",
                    "question_count": 26,
                    "questions": []
                }
                bl_topic["areas"].insert(2, area_c)
            
            area_c["questions"] = [
                {
                    "id": 1,
                    "title": "",
                    "text": """Adam is incorporating a private company limited by shares, "Adamson Digital Ltd." He is the sole subscriber and will be the sole director. He wants to use the standard constitutional template and ensure the company can trade as soon as it is formed. He is completing the application for registration.\nWhich of the following is not a mandatory document that must be delivered to the Registrar of Companies to incorporate this company?""",
                    "options": [
                        {"label": "A", "text": "The company's articles of association."},
                        {"label": "B", "text": "A statement of capital and initial shareholdings."},
                        {"label": "C", "text": "A statement of the company's proposed registered office address."},
                        {"label": "D", "text": "Details of the company's proposed secretary."},
                        {"label": "E", "text": "A statement of compliance."}
                    ],
                    "correct_answer": "D",
                    "explanation": "Option D is correct because it is not mandatory. A private company is not required to appoint a company secretary unless its articles specifically demand it (Companies Act 2006, s.270). Therefore, details of a secretary are not a mandatory part of the incorporation application.\nOption A is incorrect because a company must register articles of association unless it adopts the model articles in full, in which case it is deemed to have done so, but the application must still indicate this.\nOption B is incorrect because a statement of capital is a mandatory part of the application for a company limited by shares (Companies Act 2006, s.9).\nOption C is incorrect because a statement of the proposed registered office address is required by section 9 of the Companies Act 2006.\nOption E is incorrect because a statement of compliance, confirming the requirements of the Act have been met, is a mandatory document under section 13 of the Companies Act 2006.",
                    "difficulty": "medium"
                },
                {
                    "id": 2,
                    "title": "",
                    "text": """Benjamin and Chloe are forming a traditional partnership to run a bookshop. They have orally agreed to share profits equally. They plan to trade under the name "City Books." Benjamin is concerned about legal formalities.\nWhich of the following is an accurate statement regarding the legal steps required to form their partnership and enable it to commence operating?""",
                    "options": [
                        {"label": "A", "text": "They must execute and register a partnership deed at Companies House before they can legally start trading."},
                        {"label": "B", "text": "They must file an application for registration of the firm with the Registrar of Companies, similar to a company incorporation."},
                        {"label": "C", "text": "They must register the business name \"City Books\" with the Registrar of Companies if it does not consist of their surnames."},
                        {"label": "D", "text": "They must obtain a certificate of partnership from Companies House to prove the firm's legal existence."},
                        {"label": "E", "text": "No formal registration or written agreement is required at the point of formation; the partnership is created by their conduct in carrying on business together."}
                    ],
                    "correct_answer": "E",
                    "explanation": "Option E is correct. A general partnership under the Partnership Act 1890 is formed by two or more persons carrying on a business in common with a view to profit. No formal registration or written agreement is legally required for its creation.\nOption A is incorrect. A partnership deed is advisable but not a legal requirement, and it is a private document not filed at Companies House.\nOption B is incorrect. A general partnership is not a registered entity at Companies House; this confuses it with an LLP or a company.\nOption C is incorrect. While registering a business name may be required under the Companies Act 2006 if trading under a name that isn't the partners' surnames, this is not a step in forming the partnership. It is a separate regulatory requirement for trading under a business name.\nOption D is incorrect. There is no such thing as a certificate of partnership issued by Companies House for a general partnership.",
                    "difficulty": "medium"
                },
                {
                    "id": 3,
                    "title": "",
                    "text": """Daniel is incorporating a public company limited by shares, "Pioneer Technologies PLC." The company has an issued share capital of £60,000, with £15,000 paid up. The company has received its certificate of incorporation.\nWhat must Pioneer Technologies PLC obtain from the Registrar before it may lawfully commence business or exercise any borrowing powers?""",
                    "options": [
                        {"label": "A", "text": "A certificate of commencement of business issued under section 762 of the Companies Act 2006."},
                        {"label": "B", "text": "A trading certificate issued under section 761 of the Companies Act 2006."},
                        {"label": "C", "text": "Approval of its prospectus by the Financial Conduct Authority."},
                        {"label": "D", "text": "A certificate confirming that its share capital exceeds the authorised minimum of £50,000."},
                        {"label": "E", "text": "A filed copy of a shareholder resolution adopting the company's articles."}
                    ],
                    "correct_answer": "B",
                    "explanation": "Option B is correct. Under section 761 of the Companies Act 2006, a public company limited by shares must not do business or exercise any borrowing powers unless the Registrar has issued it with a trading certificate.\nOption A is incorrect. The terminology \"certificate of commencement of business\" is from previous companies legislation and is not used in the Companies Act 2006.\nOption C is incorrect. While a prospectus may be needed to offer shares to the public, it is not a prerequisite for the company to commence business or borrow. The trading certificate is the key requirement.\nOption D is incorrect. The Registrar issues the trading certificate upon being satisfied the company's share capital is at least the authorised minimum, but the certificate itself is the trading certificate, not a separate certificate about the share capital.\nOption E is incorrect. The articles are submitted on incorporation. Adopting articles is not a separate step that triggers the right to trade for a public company; the trading certificate is.",
                    "difficulty": "medium"
                },
                {
                    "id": 4,
                    "title": "",
                    "text": """Eleanor and Francesca are establishing a Limited Liability Partnership (LLP) for their law practice. They have agreed on profit shares and contributions. They want to ensure the LLP is properly formed and limited liability applies from the start.\nWhat is the crucial legal step that must be completed before the LLP can legally operate as a body corporate with limited liability?""",
                    "options": [
                        {"label": "A", "text": "The members must sign and file a formal LLP agreement at Companies House."},
                        {"label": "B", "text": "The LLP must be registered by filing an incorporation document (Form LL IN01) and receiving a certificate of incorporation from Companies House."},
                        {"label": "C", "text": "The members must publish a notice of formation in the London Gazette."},
                        {"label": "D", "text": "The LLP must register for Value Added Tax (VAT) with HMRC."},
                        {"label": "E", "text": "The members must obtain a business license from the Solicitors Regulation Authority."}
                    ],
                    "correct_answer": "B",
                    "explanation": "Option B is correct. Under the Limited Liability Partnerships Act 2000, an LLP is formed by incorporation. It comes into existence on the date registered on the certificate of incorporation issued by the Registrar (s.3). This grants it legal personality and limited liability.\nOption A is incorrect. An LLP agreement governs internal relations but is not a prerequisite for incorporation or for obtaining limited liability. It is a private document and is not filed at Companies House.\nOption C is incorrect. Publication in the Gazette is done by the Registrar after incorporation, not by the members as a prerequisite.\nOption D is incorrect. VAT registration is a tax requirement that occurs after the LLP has been formed and is commencing taxable business.\nOption E is incorrect. While a law practice may need regulatory approval, this is not the step that creates the LLP as a body corporate with limited liability. The certificate of incorporation does that.",
                    "difficulty": "medium"
                },
                {
                    "id": 5,
                    "title": "",
                    "text": """George is the sole director of "Horizon Ltd," a private company incorporated last week. The company's registered office is currently at his home address, but he now wants to change it to his accountant's business address.\nWhat must George do to effect this change and comply with companies legislation?""",
                    "options": [
                        {"label": "A", "text": "He must pass an ordinary resolution of the members and then file Form AD02 at Companies House within 14 days."},
                        {"label": "B", "text": "He must notify Companies House by filing Form AD01 (Change of registered office address) within 14 days of the change taking effect."},
                        {"label": "C", "text": "He must obtain written consent from all shareholders and then update the company's register of members."},
                        {"label": "D", "text": "He must simply update the address on the company's website and business stationery; no Companies House filing is required for a private company."},
                        {"label": "E", "text": "He must apply to the Registrar for permission to change the address, as it can only be changed once per year."}
                    ],
                    "correct_answer": "B",
                    "explanation": "Option B is correct. Under section 87 of the Companies Act 2006, a company may change its registered office by giving notice to the Registrar on the prescribed form (Form AD01). The change takes effect upon registration, but the notice must be delivered within 14 days of the change.\nOption A is incorrect. While the change may need to be authorised in accordance with the articles (often by the directors), there is no requirement for a member resolution specifically, and the form is AD01, not AD02.\nOption C is incorrect. Shareholder consent is not a statutory requirement, and the register of members is for details of members, not the registered office.\nOption D is incorrect. A company is required by law to notify Companies House of a change to its registered office address; updating public materials is insufficient.\nOption E is incorrect. There is no limit on the frequency of changing the registered office, and no permission from the Registrar is required.",
                    "difficulty": "medium"
                },
                {
                    "id": 6,
                    "title": "",
                    "text": """Hannah and Imran are forming a general partnership. They have drafted a detailed partnership deed covering profit sharing, decision-making, and dissolution. They intend to start trading next month.\nFrom a legal perspective, which of the following is an essential action they should take prior to or upon commencing trading to ensure regulatory compliance, separate from executing the partnership deed?""",
                    "options": [
                        {"label": "A", "text": "Register the partnership itself as a legal entity with Companies House by filing Form IN01."},
                        {"label": "B", "text": "Register the business name with the Registrar of Companies if it is different from their surnames."},
                        {"label": "C", "text": "File a copy of their partnership deed with HMRC to secure partnership tax status."},
                        {"label": "D", "text": "Obtain a partnership trading licence from the local authority."},
                        {"label": "E", "text": "Publish the partnership deed in the London Gazette."}
                    ],
                    "correct_answer": "B",
                    "explanation": "Option B is correct. Under the Companies Act 2006, if a business (including a partnership) trades under a name that is not the surname(s) of all partners (with permitted additions), it must register that business name. Failure to do so is an offence.\nOption A is incorrect. A general partnership is not a registered entity at Companies House; this confuses it with a company or an LLP.\nOption C is incorrect. HMRC does not require or accept registration of the partnership deed for tax purposes. The partnership will need to register for Self-Assessment separately.\nOption D is incorrect. While certain trades require licences, there is no generic \"partnership trading licence\" required for all partnerships.\nOption E is incorrect. There is no legal requirement to publish a partnership deed.",
                    "difficulty": "medium"
                },
                {
                    "id": 7,
                    "title": "",
                    "text": """Jack is incorporating a private company limited by guarantee to run a non-profit sports club. The subscribers will be the first members/guarantors.\nWhat key document, distinct from that required for a company limited by shares, must be delivered to the Registrar as part of the incorporation application?""",
                    "options": [
                        {"label": "A", "text": "A statement of guarantee instead of a statement of capital and initial shareholdings."},
                        {"label": "B", "text": "A copy of the club's constitution approved by the Sports Council."},
                        {"label": "C", "text": "A statement of the company's objects, which must be restricted to non-profit purposes."},
                        {"label": "D", "text": "A declaration that the company will not pay dividends."},
                        {"label": "E", "text": "A statement of compliance signed by all the guarantors in the presence of a witness."}
                    ],
                    "correct_answer": "A",
                    "explanation": "Option A is correct. For a company limited by guarantee, the application for registration must contain a statement of guarantee under section 11 of the Companies Act 2006, instead of a statement of capital.\nOption B is incorrect. While the club may seek external approval, no such document is a mandatory part of the Companies House incorporation process.\nOption C is incorrect. The company's objects are contained within its articles of association, not filed as a separate document. There is no separate \"statement of objects\" required on incorporation.\nOption D is incorrect. A company limited by guarantee does not have a share capital and therefore cannot pay dividends by definition, but no specific declaration is required on incorporation.\nOption E is incorrect. The statement of compliance is required for all companies, but it is not distinct to guarantee companies and does not need to be signed by all guarantors.",
                    "difficulty": "medium"
                },
                {
                    "id": 8,
                    "title": "",
                    "text": """Katherine has just been appointed a director of "Swift Solutions Ltd," a private company. The appointment was made by the existing director under the model articles. The company has not yet notified Companies House.\nWhat is the consequence if the company fails to notify the Registrar of Companies of Katherine's appointment within the statutory time limit?""",
                    "options": [
                        {"label": "A", "text": "The appointment is void and Katherine will not be deemed a director until the notice is filed."},
                        {"label": "B", "text": "The company and every officer in default commit an offence and are liable to a fine, but the appointment itself remains valid."},
                        {"label": "C", "text": "The appointment is valid, but Katherine will be personally liable for all company debts until the notice is filed."},
                        {"label": "D", "text": "The company will be automatically dissolved for failing to comply with its filing obligations."},
                        {"label": "E", "text": "There is no consequence, as notification of director appointments is voluntary for private companies."}
                    ],
                    "correct_answer": "B",
                    "explanation": "Option B is correct. Under section 167 of the Companies Act 2006, a company must give notice of a director's appointment to the Registrar within 14 days. Failure to do so is an offence by the company and every officer in default under section 167(5), but the appointment itself remains valid.\nOption A is incorrect. The appointment is effective from the date it is made in accordance with the articles, not from the date of filing.\nOption C is incorrect. There is no provision that makes a director personally liable for company debts due to a filing delay.\nOption D is incorrect. Failure to file this notice does not lead to automatic dissolution.\nOption E is incorrect. Notification is mandatory, not voluntary.",
                    "difficulty": "medium"
                },
                {
                    "id": 9,
                    "title": "",
                    "text": """Liam and Maya are forming a traditional partnership. They commence trading without any written agreement. After six months, a dispute arises about how profits should be shared. Liam contributed 75% of the start-up capital.\nIn the absence of a written or oral agreement, how will profits be shared under the default provisions of the Partnership Act 1890?""",
                    "options": [
                        {"label": "A", "text": "Profits will be shared in proportion to the capital contributed by each partner (i.e., 75% to Liam, 25% to Maya)."},
                        {"label": "B", "text": "Profits will be shared equally."},
                        {"label": "C", "text": "Profits will be shared in proportion to the time each partner devotes to the business."},
                        {"label": "D", "text": "All profits will belong to Liam, as he provided most of the capital."},
                        {"label": "E", "text": "The partnership will be deemed void for uncertainty, and no profits can be distributed until an agreement is made."}
                    ],
                    "correct_answer": "B",
                    "explanation": "Option B is correct. Section 24(1) of the Partnership Act 1890 provides that, in the absence of any agreement to the contrary, all partners are entitled to share equally in the capital and profits of the business.\nOption A is incorrect. Capital contribution governs the return of capital on dissolution, not the default profit-sharing ratio during the partnership.\nOption C is incorrect. There is no default rule linking profit share to time devoted.\nOption D is incorrect. This is not a rule under the 1890 Act.\nOption E is incorrect. The Act provides clear default rules to avoid uncertainty.",
                    "difficulty": "medium"
                },
                {
                    "id": 10,
                    "title": "",
                    "text": """"Nova Consulting LLP" was incorporated two months ago. It has two designated members, Rachel and Tom. The LLP has now commenced trading. Rachel is concerned about ongoing compliance.\nWhat is the deadline for delivering Nova Consulting LLP's first confirmation statement (Form CS01) to Companies House?""",
                    "options": [
                        {"label": "A", "text": "Within 28 days of the date of incorporation."},
                        {"label": "B", "text": "Within 14 days of the first anniversary of incorporation."},
                        {"label": "C", "text": "Within 12 months of the date of incorporation, and then at least once every 12 months thereafter."},
                        {"label": "D", "text": "It is only required once the LLP has commenced trading and has financial transactions to report."},
                        {"label": "E", "text": "It must be filed alongside the first annual accounts."}
                    ],
                    "correct_answer": "B",
                    "explanation": "Option B is correct. Under section 853A of the Companies Act 2006 (as applied to LLPs), the first confirmation statement must be delivered within 14 days after the end of the review period. The first review period is the 12 months beginning with the date of incorporation. Therefore, the deadline is within 14 days of the first anniversary of incorporation.\nOption A is incorrect. The first filing is not due 28 days after incorporation.\nOption C is incorrect because it omits the crucial 14-day filing window after the 12-month review period ends.\nOption D is incorrect. The confirmation statement is required regardless of whether the LLP is trading.\nOption E is incorrect. The confirmation statement and annual accounts are separate filings with different deadlines.",
                    "difficulty": "medium"
                },
                {
                    "id": 11,
                    "title": "",
                    "text": """Oliver is incorporating a private company, "Pixel Designs Ltd." He is completing the statement of capital. The company's authorised share capital is 50,000 ordinary shares of £1 each. Oliver and his friend are each subscribing for 100 shares at par value, paying £1 per share.\nWhich of the following is the correct way to present this in the statement of capital?""",
                    "options": [
                        {"label": "A", "text": "\"Number of shares: 50,000. Aggregate nominal value: £50,000. Total amount unpaid: £49,800.\""},
                        {"label": "B", "text": "\"Number of shares to be taken on formation: 200. Aggregate nominal value: £200. Total amount unpaid: £0.\""},
                        {"label": "C", "text": "\"Authorised share capital: £50,000. Issued share capital: £200. Paid-up capital: £200.\""},
                        {"label": "D", "text": "\"Number of shares: 200. Aggregate nominal value: £200. Amount paid up: £200. Total amount unpaid: £0.\""},
                        {"label": "E", "text": "\"Number of shares: 200. Nominal value per share: £1. Total paid: £200. Total unpaid: £0.\""}
                    ],
                    "correct_answer": "D",
                    "explanation": "Option D is correct. The statement of capital under section 10 of the Companies Act 2006 must include: the total number of shares, the aggregate nominal value, the amount paid up, and the amount unpaid on them. Option D presents all these elements correctly for the 200 issued shares.\nOption A is incorrect. It refers to the authorised capital (50,000 shares) rather than the shares taken by the subscribers (200).\nOption B is incomplete. It omits the separate figures for \"amount paid up\" and \"total amount unpaid,\" which are required by the Act.\nOption C uses outdated terminology (\"authorised,\" \"issued,\" \"paid-up\"). The current statement of capital requires the specific data set out in section 10.\nOption E is close but does not use the exact statutory phrasing \"aggregate nominal value\" and separates \"total paid\" and \"total unpaid\" in a way that may not match the prescribed form.",
                    "difficulty": "medium"
                },
                {
                    "id": 12,
                    "title": "",
                    "text": """Priya is the sole member of "Sunrise Ltd," a private company limited by shares. She wishes to appoint her sister, Anya, as a second director. The company's articles are the model articles.\nWhat is the correct procedure to formally appoint Anya as a director so that the appointment is valid and compliant?""",
                    "options": [
                        {"label": "A", "text": "Priya can appoint Anya by simply notifying her in writing, as the sole member has this power."},
                        {"label": "B", "text": "Anya must be appointed by an ordinary resolution of the members, and then Form AP01 must be filed at Companies House within 14 days."},
                        {"label": "C", "text": "The appointment must be made in accordance with the company's articles. Under the model articles, the existing director(s) can appoint, and Form AP01 must be filed within 14 days."},
                        {"label": "D", "text": "Anya must sign a consent to act form and file it directly with Companies House, which completes the appointment."},
                        {"label": "E", "text": "The appointment is effective once recorded in the company's register of directors; no Companies House filing is needed."}
                    ],
                    "correct_answer": "C",
                    "explanation": "Option C is correct. The appointment must be made in accordance with the company's articles. Model Article 17 provides that the directors may appoint a person as a director. The company must then notify the Registrar on Form AP01 within 14 days under section 167.\nOption A is incorrect. While Priya as sole member could appoint by resolution, the model articles also provide a mechanism for director appointment by existing directors. The statement is too simplistic and ignores the filing requirement.\nOption B is incorrect for a standard appointment under model articles, as it states members must appoint. While members can appoint, the model articles allow the directors to do so. The key is following the articles.\nOption D is incorrect. Anya's consent to act (s.157) is required and must be kept by the company, but it is not filed at Companies House. Filing Form AP01 is the company's separate obligation.\nOption E is incorrect. While the register of directors must be updated, the company also has a statutory duty to notify Companies House.",
                    "difficulty": "medium"
                },
                {
                    "id": 13,
                    "title": "",
                    "text": """After receiving the certificate of incorporation for "Quantum Ltd," the directors realise they forgot to register the company for corporation tax with HMRC. They have been trading for three months.\nWhat is the statutory deadline for notifying HMRC of the company's liability to corporation tax when it first commences a trade?""",
                    "options": [
                        {"label": "A", "text": "Within 3 months of the date of incorporation."},
                        {"label": "B", "text": "Within 12 months of the end of the company's first accounting period."},
                        {"label": "C", "text": "Within 3 months of the date it commences a trade or business."},
                        {"label": "D", "text": "There is no statutory requirement; HMRC will contact the company using details from Companies House."},
                        {"label": "E", "text": "The company must notify on its first annual corporation tax return, which is due 12 months after the end of its accounting period."}
                    ],
                    "correct_answer": "C",
                    "explanation": "Option C is correct. Under paragraph 2 of Schedule 41 to the Finance Act 2004, a company must notify HMRC of its chargeability to corporation tax within three months of the commencement of trading (or other chargeable activity).\nOption A is incorrect. The trigger is the start of trading, not the date of incorporation.\nOption B and E are incorrect. They relate to the filing of returns, not the initial notification of chargeability, which is a separate and earlier obligation.\nOption D is dangerously incorrect. While HMRC receives data from Companies House, the company has a separate legal duty to notify HMRC of its chargeability to tax. Failure can result in penalties.",
                    "difficulty": "medium"
                },
                {
                    "id": 14,
                    "title": "",
                    "text": """Raj is forming a public company, "Apex Manufacturing PLC." The company has just received its certificate of incorporation. It has an issued share capital of £55,000, all of which is paid up. The directors wish to enter into a large contract immediately.\nWhich of the following accurately describes the legal position of Apex Manufacturing PLC at this moment?""",
                    "options": [
                        {"label": "A", "text": "It can commence business and borrow money, as its share capital meets the authorised minimum."},
                        {"label": "B", "text": "It can only perform acts necessary to obtain a trading certificate, such as allotting shares and appointing directors."},
                        {"label": "C", "text": "It is fully operational and can trade, as the certificate of incorporation confers all necessary powers."},
                        {"label": "D", "text": "It can trade but cannot create any charges over its assets until it has filed its first confirmation statement."},
                        {"label": "E", "text": "It must hold its first annual general meeting before commencing any business activities."}
                    ],
                    "correct_answer": "B",
                    "explanation": "Option B is correct. Under section 761 of the Companies Act 2006, a public company must not do business or exercise any borrowing powers until it has obtained a trading certificate. However, section 761(2) allows it to do acts necessary to enable it to obtain such a certificate (e.g., allotting shares, paying formation expenses).\nOption A is incorrect. Despite meeting the share capital requirement, it cannot commence business or borrow until the trading certificate is issued.\nOption C is incorrect. This is true for a private company, but a public company requires a trading certificate.\nOption D is incorrect. The restriction is broader (no business or borrowing), and the confirmation statement is unrelated.\nOption E is incorrect. The first AGM is required within six months of the first accounts reference date, not before commencing business.",
                    "difficulty": "medium"
                },
                {
                    "id": 15,
                    "title": "",
                    "text": """Sophie and Thomas are converting their existing general partnership into a private limited company, "ST Consultants Ltd." The new company will take over the business assets.\nImmediately after the company receives its certificate of incorporation, which of the following is a critical step to ensure the company can legally own and operate the business?""",
                    "options": [
                        {"label": "A", "text": "The partners must pass a special resolution to adopt new articles of association for the company."},
                        {"label": "B", "text": "The company must execute a formal asset purchase agreement or transfer documentation to acquire the business from the partnership."},
                        {"label": "C", "text": "The company must register for PAYE and VAT using the partnership's existing registration numbers."},
                        {"label": "D", "text": "The partnership must be formally dissolved by filing a notice at Companies House before the company can trade."},
                        {"label": "E", "text": "The company must issue a prospectus to the existing partnership clients informing them of the change."}
                    ],
                    "correct_answer": "B",
                    "explanation": "Option B is correct. The company is a separate legal entity. To own the business assets, there must be a proper legal transfer (sale or contribution) from the partners to the company, typically via a business transfer agreement.\nOption A is incorrect. While the company may adopt articles on incorporation, this is not the critical step for acquiring the business assets.\nOption C is incorrect. The company will need its own registrations (though it may be possible to transfer a VAT number under the Transfer of a Going Concern rules, but this is not automatic or immediate upon incorporation).\nOption D is incorrect. The partnership dissolution is a private matter and does not involve filing a notice at Companies House (for a general partnership). The company can trade regardless.\nOption E is advisable for commercial reasons but is not a legal step to enable the company to own and operate the business.",
                    "difficulty": "medium"
                },
                {
                    "id": 16,
                    "title": "",
                    "text": """"Vertex LLP" has been incorporated. The two members, Emma and Noah, did not create a formal LLP agreement. They now disagree on how profits should be shared. Emma contributed 80% of the start-up capital.\nIn the absence of an LLP agreement, what is the default position regarding profit sharing under the applicable regulations?""",
                    "options": [
                        {"label": "A", "text": "Profits are shared in proportion to capital contributions (80% to Emma, 20% to Noah)."},
                        {"label": "B", "text": "Profits are shared equally."},
                        {"label": "C", "text": "Profits are shared in proportion to the time each member devotes to the business."},
                        {"label": "D", "text": "All profits belong to Emma, as she provided most of the capital."},
                        {"label": "E", "text": "The LLP is deemed to have no profit-sharing rules, so profits must be retained in the business until an agreement is made."}
                    ],
                    "correct_answer": "B",
                    "explanation": "Option B is correct. Regulation 7 of the Limited Liability Partnerships Regulations 2001 (SI 2001/1090) provides that, in the absence of agreement to the contrary, \"each member is entitled to share equally in the capital and profits of the limited liability partnership.\"\nOption A is incorrect. The default rule for return of capital on dissolution is in proportion to contributions, but profit sharing is equal.\nOption C is incorrect. There is no such default rule.\nOption D is incorrect. This is not a rule under the regulations.\nOption E is incorrect. The regulations provide clear default rules.",
                    "difficulty": "medium"
                },
                {
                    "id": 17,
                    "title": "",
                    "text": """Zara is incorporating a private company and wants to adopt bespoke articles that give the right to appoint a director to a specific shareholder. She is concerned about the legal limits on what articles can contain.\nWhich of the following statements accurately reflects a limitation on the content of a company's articles of association?""",
                    "options": [
                        {"label": "A", "text": "Articles cannot override any provision of the Companies Act 2006."},
                        {"label": "B", "text": "Articles cannot exclude the fundamental statutory duties of directors."},
                        {"label": "C", "text": "Articles must be in the exact form prescribed by the Model Articles Regulations."},
                        {"label": "D", "text": "Articles cannot contain any provisions that are not found in the model articles."},
                        {"label": "E", "text": "Articles cannot be amended once the company is incorporated."}
                    ],
                    "correct_answer": "B",
                    "explanation": "Option B is correct. While articles can regulate directors' powers, they cannot exclude the core statutory duties of directors set out in sections 171-177 of the Companies Act 2006.\nOption A is incorrect. Articles can override certain optional provisions of the Act (e.g., default rules on directors' powers), but not mandatory ones.\nOption C is incorrect. Companies can adopt bespoke articles; the model articles are a default applicable if no bespoke articles are registered.\nOption D is incorrect. Articles can contain a wide variety of provisions not found in the model articles, provided they are not unlawful.\nOption E is incorrect. Articles can be amended by special resolution under section 21 of the Companies Act 2006.",
                    "difficulty": "medium"
                },
                {
                    "id": 18,
                    "title": "",
                    "text": """Following the incorporation of "Bloom Ltd," the director, Leo, wishes to check the company's ongoing filing obligations. The company has not yet started trading.\nWhich of the following is an obligation that applies to Bloom Ltd from the date of incorporation, regardless of whether it is trading?""",
                    "options": [
                        {"label": "A", "text": "To file its first annual accounts within 9 months of the end of its first financial year."},
                        {"label": "B", "text": "To file a confirmation statement at least once every 12 months."},
                        {"label": "C", "text": "To register for VAT within 30 days of incorporation."},
                        {"label": "D", "text": "To file a return of allotments of shares (Form SH01) within 1 month of any share issue."},
                        {"label": "E", "text": "To hold an annual general meeting within 6 months of its first accounting reference date."}
                    ],
                    "correct_answer": "B",
                    "explanation": "Option B is correct. Under section 853A of the Companies Act 2006, a company must deliver a confirmation statement to the Registrar at least once in every 12-month period. The first period begins on the date of incorporation.\nOption A is incorrect. The obligation to prepare and file accounts arises, but the filing deadline is linked to the accounting reference period, not the date of incorporation, and may not be immediate.\nOption C is incorrect. VAT registration is only required if taxable supplies exceed the threshold.\nOption D is incorrect. This is an obligation that only triggers if and when shares are allotted after incorporation.\nOption E is incorrect. Private companies are not required to hold AGMs unless their articles specifically require it.",
                    "difficulty": "medium"
                },
                {
                    "id": 19,
                    "title": "",
                    "text": """Isaac and Jessica are forming a general partnership. They have a written partnership deed that states all business decisions require unanimous consent. They are about to sign a lease for premises. Isaac signs the lease without consulting Jessica, believing it was urgent.\nIn the absence of any actual authority from Jessica, is the lease binding on the partnership?""",
                    "options": [
                        {"label": "A", "text": "No, because the partnership deed requires unanimous consent for all business decisions."},
                        {"label": "B", "text": "Yes, because Isaac has apparent authority as a partner to bind the firm in matters within the usual course of business."},
                        {"label": "C", "text": "No, because a lease is a major commitment and falls outside the usual authority of a partner."},
                        {"label": "D", "text": "Yes, but only if Jessica ratifies the lease within 7 days of being informed."},
                        {"label": "E", "text": "No, because partnerships are not legal entities and cannot hold leases in the firm's name."}
                    ],
                    "correct_answer": "B",
                    "explanation": "Option B is correct. Under section 5 of the Partnership Act 1890, every partner is an agent of the firm for the purpose of the business. The partnership is bound by acts of a partner carried on in the usual way of business, unless the third party knows the partner has no authority. The internal restriction in the deed does not affect a third party without knowledge.\nOption A is incorrect. Internal restrictions in the partnership deed do not affect the rights of third parties dealing with a partner in good faith without notice of the restriction.\nOption C is incorrect. Entering into a lease for business premises is typically within the usual course of business for many trading partnerships.\nOption D is incorrect. Ratification is one way to bind the firm, but the lease is binding from the outset due to apparent authority, unless the landlord knew of the restriction.\nOption E is incorrect. A partnership can hold property in the name of the firm, and while it is not a separate legal entity, it can contract through its partners.",
                    "difficulty": "medium"
                },
                {
                    "id": 20,
                    "title": "",
                    "text": """"Cascade LLP" was incorporated a year ago. It has two designated members, Michael and Olivia. The LLP has been trading successfully. Michael is unsure about the ongoing compliance duties.\nWhich of the following is a statutory duty of the designated members of an LLP, distinct from the duties of ordinary members?""",
                    "options": [
                        {"label": "A", "text": "To ensure the LLP agreement is filed at Companies House within 14 days of any change."},
                        {"label": "B", "text": "To ensure the LLP's annual accounts are prepared, signed, and delivered to Companies House."},
                        {"label": "C", "text": "To manage the day-to-day business operations of the LLP."},
                        {"label": "D", "text": "To hold an annual general meeting of members."},
                        {"label": "E", "text": "To appoint an auditor within 3 months of incorporation."}
                    ],
                    "correct_answer": "B",
                    "explanation": "Option B is correct. Under the Limited Liability Partnerships (Accounts and Audit) Regulations 2008 and the Companies Act 2006 as applied, the designated members have the duty to ensure the LLP's accounts and reports are prepared and filed, similar to the duties of company directors.\nOption A is incorrect. The LLP agreement is a private document and is not filed at Companies House.\nOption C is incorrect. The management of the LLP is determined by the LLP agreement; there is no statutory rule that only designated members manage day-to-day operations.\nOption D is incorrect. There is no statutory requirement for an LLP to hold an annual general meeting.\nOption E is incorrect. Appointment of an auditor is only required if the LLP meets certain size thresholds, and it is not a specific duty tied to a 3-month deadline from incorporation.",
                    "difficulty": "medium"
                },
                {
                    "id": 21,
                    "title": "",
                    "text": """Daniel and Rebecca are forming a private company, "City Consultants Ltd." Daniel will hold 60 ordinary shares and Rebecca 40. They have drafted bespoke articles of association that include a pre-emption right on share transfers. They are ready to submit their application (Form IN01) to Companies House.\nWhat must the statement of capital included in the application specifically contain?""",
                    "options": [
                        {"label": "A", "text": "The total number of shares to be issued and their aggregate nominal value."},
                        {"label": "B", "text": "The amount each shareholder has agreed to pay for their shares."},
                        {"label": "C", "text": "The rights attached to each class of share (e.g., voting, dividend)."},
                        {"label": "D", "text": "The market value of the company's initial assets."},
                        {"label": "E", "text": "The names and addresses of the persons who have agreed to take shares."}
                    ],
                    "correct_answer": "A",
                    "explanation": "Option A is correct. The statement of capital required by s.10 of the Companies Act 2006 must include, among other details: the total number of shares of the company, the aggregate nominal value of those shares, and for each class of shares, details of voting rights, dividend rights, and rights on winding up. Option A captures the core requirement. Option C is partially correct as details of rights attached to shares are required for each class, but the question asks what it must contain, and A is a fundamental, unambiguous requirement. Option B is not required; the statement of capital deals with nominal value, not the price paid. Option D is irrelevant. Option E is not part of the statement of capital; subscriber details are provided elsewhere in Form IN01.",
                    "difficulty": "medium"
                },
                {
                    "id": 22,
                    "title": "",
                    "text": """Thomas is registering a new private company. He is completing Form IN01. The form asks for the address of the company's registered office. Thomas runs the business from his home but does not want his residential address publicly available on the Companies House register.\nWhich of the following is a permissible address for the registered office?""",
                    "options": [
                        {"label": "A", "text": "Only the director's residential address if the business operates from there."},
                        {"label": "B", "text": "Any address in the United Kingdom where the company can receive legal documents."},
                        {"label": "C", "text": "Only the address where the company's central management and control is exercised."},
                        {"label": "D", "text": "An address in any country where the company operates."},
                        {"label": "E", "text": "A PO Box number, provided a physical address is also supplied separately."}
                    ],
                    "correct_answer": "B",
                    "explanation": "Option B is correct. Under s.86 of the Companies Act 2006, a company's registered office must be situated in the part of the UK where the company is registered (e.g., England and Wales). It must be a physical address where official documents can be served, not a PO Box. It does not need to be the place of business or the director's home; it can be the address of its accountants, solicitors, or a commercial mail-handling service, provided service of documents there would effectively bring them to the company's attention. This allows directors to keep their home addresses private.\nOption A is not the only permissible option.\nOption C is incorrect; the registered office does not need to be the centre of management.\nOption D is incorrect; it must be in the UK jurisdiction of registration.\nOption E is incorrect; a PO Box alone is not permissible.",
                    "difficulty": "medium"
                },
                {
                    "id": 23,
                    "title": "",
                    "text": """Chloe is incorporating a private company to run a café. She will be the sole director and the only shareholder. She intends to use the Model Articles of Association. What must she do regarding the articles when submitting Form IN01 to Companies House?""",
                    "options": [
                        {"label": "A", "text": "She must attach a printed copy of the Model Articles to the form."},
                        {"label": "B", "text": "She must state on the form that the company's articles are the Model Articles."},
                        {"label": "C", "text": "She must draft her own articles and attach them, as a sole-director company cannot use the Model Articles."},
                        {"label": "D", "text": "She does not need to do anything; the Model Articles apply automatically by default."},
                        {"label": "E", "text": "She must attach a statement that she has read and agrees to the Model Articles."}
                    ],
                    "correct_answer": "B",
                    "explanation": "Option B is correct. Under the Companies Act 2006, if a company adopts the Model Articles (either in full or with amendments), it does not need to submit a copy to the Registrar. Instead, on the application for registration (Form IN01), there is a section to confirm the company's constitution. The applicant can tick a box stating that the Model Articles apply. If bespoke or amended articles are used, then those must be submitted. Therefore, for Chloe, simply indicating on IN01 that the company adopts the Model Articles suffices.\nOption A is unnecessary if adopting the Model Articles unmodified.\nOption C is incorrect; the Model Articles can be used by any private company.\nOption D is incorrect; the Model Articles are the default only if no articles are registered, but the applicant must still indicate the constitutional position on the form.\nOption E is not a filing requirement.",
                    "difficulty": "medium"
                },
                {
                    "id": 24,
                    "title": "",
                    "text": """James and Oliver are forming a general partnership to provide gardening services. They want a clear written agreement outlining profit shares, decision-making, and what happens if one wants to leave. They do not want any public registration of their agreement.\nWhich of the following accurately describes the legal and procedural steps they should take?""",
                    "options": [
                        {"label": "A", "text": "They must register the partnership with Companies House using form LP5 and file their partnership agreement."},
                        {"label": "B", "text": "They must draft a partnership deed, sign it, and each keep a copy. No registration with any public authority is required."},
                        {"label": "C", "text": "They must apply to HM Revenue & Customs for a partnership tax reference, which constitutes legal formation."},
                        {"label": "D", "text": "They must draft a partnership deed, sign it, and each keep a copy. Registration with public authority is however required."},
                        {"label": "E", "text": "They must register the business name with Companies House if it differs from their surnames."}
                    ],
                    "correct_answer": "B",
                    "explanation": "Option B is correct. A general partnership is formed by two or more persons carrying on a business with a view of profit (Partnership Act 1890). There is no legal requirement for a written agreement or public registration. However, a written partnership deed is highly advisable to govern relations. It is a private document. Option A describes the process for a Limited Partnership (LP), not a general partnership. Option C is a tax requirement after formation, not a step to create the legal entity. Option D is not required. Option E is only required if the business name does not include the partners' surnames and they are trading under a different name, but this is a business name registration, not partnership formation.",
                    "difficulty": "medium"
                },
                {
                    "id": 25,
                    "title": "",
                    "text": """Emma is incorporating "Harper Designs Ltd." She is the sole shareholder and will be the sole director. She is completing the "Statement of Proposed Officers" section of Form IN01. Regarding the company secretary, what must she do?""",
                    "options": [
                        {"label": "A", "text": "She must appoint herself as company secretary and provide her details."},
                        {"label": "B", "text": "She must appoint a separate individual as company secretary because a private company must have one."},
                        {"label": "C", "text": "She may leave the section blank, as a private company is not required to have a company secretary."},
                        {"label": "D", "text": "She must appoint a company secretary but can do so within 14 days of incorporation."},
                        {"label": "E", "text": "She must state that the company will not have a secretary and provide an alternative address for service."}
                    ],
                    "correct_answer": "C",
                    "explanation": "Option C is correct. Under s.270 of the Companies Act 2006, a private company is not required to have a company secretary. Therefore, on Form IN01, the section for the secretary can be left blank. This is a common feature of modern private companies, simplifying administration.\nOption A is permissible but not mandatory.\nOption B is incorrect; the requirement for a secretary was abolished for private companies.\nOption D is incorrect; there is no obligation to appoint one at any time.\nOption E is incorrect; no such statement is required.",
                    "difficulty": "medium"
                },
                {
                    "id": 26,
                    "title": "",
                    "text": """When Aaron submits the application to incorporate his company, "Summit Solutions Ltd," he must include details of the company's persons with significant control (PSC). Aaron will own 100% of the shares and be the sole director.\nWhich of the following statements regarding the PSC register is correct at the point of incorporation?""",
                    "options": [
                        {"label": "A", "text": "As the sole shareholder and director, Aaron is automatically a PSC, and his details must be provided in the application to Companies House."},
                        {"label": "B", "text": "The PSC register is an internal document only; no PSC details need to be filed with the initial application."},
                        {"label": "C", "text": "PSC details must be filed within 14 days of incorporation, not at the time of application."},
                        {"label": "D", "text": "Only companies with more than one shareholder need to file PSC details."},
                        {"label": "E", "text": "Because Aaron is the director, he is not a PSC; a PSC must be a non-director shareholder."}
                    ],
                    "correct_answer": "A",
                    "explanation": "Option A is correct. Under the Companies Act 2006 (as amended by the Small Business, Enterprise and Employment Act 2015), a company must identify and record details of its people with significant control. A person holding more than 25% of the shares is a PSC. Aaron, as the 100% shareholder, is a PSC. The company must include these details in its application for registration (Form IN01 includes a section for PSC information). The company must also maintain an internal PSC register.\nOption B is incorrect; while an internal register is required, the information must also be provided to Companies House on incorporation and updated as necessary.\nOption C is incorrect; for a new company, PSC details are required on incorporation.\nOption D is incorrect; even a single-shareholder company must file.\nOption E is incorrect; a director can also be a PSC through share ownership.",
                    "difficulty": "medium"
                }
            ]
            print("-> Patched Business Law Section C with 26 new questions")
            
            # =====================================================
            # Patch Business Law Section D - Finance
            # =====================================================
            area_d = next((a for a in bl_topic["areas"] if a["letter"] == "D"), None)
            if area_d:
                area_d["name"] = "Finance"
                area_d["slug"] = "d-finance"
                area_d["question_count"] = 18
            else:
                area_d = {
                    "letter": "D",
                    "name": "Finance",
                    "slug": "d-finance",
                    "question_count": 18,
                    "questions": []
                }
                bl_topic["areas"].insert(3, area_d)
            
            area_d["questions"] = [
                {
                    "id": 1,
                    "title": "",
                    "text": """Zahra is a director of "Phoenix Ltd," a profitable private company. The company wishes to raise £200,000 for expansion. The existing shareholders do not want their ownership diluted, and the directors want to avoid creating fixed repayment obligations. They are considering a bank loan versus issuing new shares to an external investor.\nWhich of the following best describes a key characteristic of debt financing (like a bank loan) compared to equity financing (issuing new shares)?""",
                    "options": [
                        {"label": "A", "text": "Debt financing typically requires the company to grant voting rights to the lender, diluting existing shareholder control."},
                        {"label": "B", "text": "Debt financing creates a legally enforceable obligation to make periodic interest payments and repay the principal, which can lead to insolvency if not met."},
                        {"label": "C", "text": "Equity financing does not require the company to grant any security over its assets, whereas debt financing always requires a fixed charge."},
                        {"label": "D", "text": "Interest payments on debt are discretionary distributions at the director's discretion, similar to dividends on equity."},
                        {"label": "E", "text": "Debt financing is always preferable for companies with low asset bases, as it does not require any form of security."}
                    ],
                    "correct_answer": "B",
                    "explanation": "Option B is correct. Debt financing creates a contractual obligation to repay principal and interest. Failure to meet these obligations is an event of default, potentially leading to enforcement of security or insolvency proceedings. This contrasts with equity, where returns (dividends) are discretionary.\nOption A is incorrect. Lenders (creditors) do not typically receive voting rights in the company; that is a feature of equity shareholders.\nOption C is incorrect. While equity does not require security, debt financing does not always require a fixed charge; it can be unsecured or secured by other types of security like a floating charge.\nOption D is incorrect. Interest on debt is a contractual obligation, not discretionary. Dividends on equity shares are discretionary, subject to profits and director/shareholder approval.\nOption E is incorrect. Debt financing for companies with low asset bases is often difficult to obtain precisely because lenders usually require security, which may not be available.",
                    "difficulty": "medium"
                },
                {
                    "id": 2,
                    "title": "",
                    "text": """"Stratford Engineers Ltd" grants a fixed charge to its bank over its factory premises and a floating charge over its stock and raw materials. The company subsequently goes into administration. The administrator sells the factory and the stock.\nWhich of the following correctly describes the priority of application of the sale proceeds?""",
                    "options": [
                        {"label": "A", "text": "The fixed charge holder must wait until all unsecured creditors are paid in full before receiving anything."},
                        {"label": "B", "text": "The floating charge holder is entitled to be paid from the proceeds of the stock before the fixed charge holder is paid from the proceeds of the factory."},
                        {"label": "C", "text": "The proceeds from the factory are applied first to satisfy the fixed charge holder's debt. The proceeds from the stock are used to pay preferential creditors, then the floating charge holder, then unsecured creditors."},
                        {"label": "D", "text": "Both the fixed and floating charge holders rank equally and must be paid proportionately from the pooled sale proceeds of all company assets."},
                        {"label": "E", "text": "The proceeds from the factory are applied first to satisfy the fixed charge holder's debt. The proceeds from the stock are used to pay preferential creditors, then unsecured creditors, then the floating charge holder."}
                    ],
                    "correct_answer": "C",
                    "explanation": "Option C is correct. A fixed charge holder has first claim on the proceeds of the specific asset charged. For assets subject to a floating charge, the prescribed order under the Insolvency Act 1986 is: 1) costs of realisation, 2) preferential creditors (e.g., certain employee claims), 3) the floating charge holder, 4) unsecured creditors.\nOption A is incorrect. A fixed charge holder has priority over unsecured creditors and is paid from the asset's proceeds ahead of them. Therefore E is incorrect.\nOption B is incorrect. The fixed charge holder has priority over their specific asset. The floating charge holder does not jump the queue.\nOption D is incorrect. Fixed and floating charge holders do not rank equally; fixed charges have priority over the specific asset.",
                    "difficulty": "medium"
                },
                {
                    "id": 3,
                    "title": "",
                    "text": """The directors of "Greenleaf Ltd" wish to declare an interim dividend for the current financial year. The company has substantial retained profits from previous years but is forecast to make a loss this year. The directors want to support shareholder income.\nWhich of the following is the primary legal rule governing the lawfulness of declaring an interim dividend?""",
                    "options": [
                        {"label": "A", "text": "An interim dividend can only be declared by an ordinary resolution of the members in general meeting."},
                        {"label": "B", "text": "Dividends can only be paid out of distributable profits."},
                        {"label": "C", "text": "The directors must have reasonable grounds for believing the company will be solvent after the dividend is paid."},
                        {"label": "D", "text": "An interim dividend is unlawful if the company has any outstanding loan obligations."},
                        {"label": "E", "text": "The company's articles of association must expressly permit the payment of interim dividends, otherwise they are prohibited."}
                    ],
                    "correct_answer": "B",
                    "explanation": "Option B is correct. The fundamental rule under the Companies Act 2006, s.830, is that a company may only make a distribution out of profits available for the purpose (i.e., distributable profits). This applies to all dividends, including interim dividends.\nOption A is incorrect. Interim dividends are typically declared by the directors under authority granted by the articles (e.g., Model Art 30), not by shareholder resolution.\nOption C is incorrect. While directors have a duty to consider solvency, the primary statutory rule for lawfulness is the requirement for distributable profits. Solvency is a separate, additional consideration under s.643.\nOption D is incorrect. The existence of loan obligations does not in itself make a dividend unlawful, provided there are distributable profits and the company remains solvent.\nOption E is incorrect. Most modern articles (including the Model Articles) provide directors with the power to pay interim dividends. It is a standard power, not a rare exception.",
                    "difficulty": "medium"
                },
                {
                    "id": 4,
                    "title": "",
                    "text": """"Knight Holdings PLC" issues £1 million in secured loan notes (debentures) to institutional investors. The trust deed creating the loan notes states they are secured by a fixed charge over the company's head office and a floating charge over its undertaking. The company must create a register of holders.\nWhich of the following statements correctly describes a characteristic of such loan notes?""",
                    "options": [
                        {"label": "A", "text": "They represent an ownership interest in the company, entitling holders to vote at general meetings."},
                        {"label": "B", "text": "They constitute an acknowledgment of a debt, typically evidenced by a debenture trust deed, and create a creditor relationship."},
                        {"label": "C", "text": "Holders of loan notes have no right to receive interest if the company makes a loss in a given financial year."},
                        {"label": "D", "text": "The security for the loan notes must be registered at HM Land Registry only, not at Companies House."},
                        {"label": "E", "text": "If the company is liquidated, loan note holders rank as unsecured creditors behind all other secured and preferential creditors."}
                    ],
                    "correct_answer": "B",
                    "explanation": "Option B is correct. Loan notes or debentures are documents that acknowledge a debt owed by the company. They often create or evidence a charge over company assets and are governed by a trust deed. The holders are creditors, not members.\nOption A is incorrect. Loan note holders are creditors, not owners. They do not typically have voting rights (unless the terms specifically provide for them in certain events, which is not the norm).\nOption C is incorrect. Interest on loan notes is a contractual obligation, not dependent on profitability. Failure to pay is an event of default.\nOption D is incorrect. Charges created by a company (including those securing loan notes) must generally be registered at Companies House within 21 days under Part 25 of the Companies Act 2006.\nOption E is incorrect. If the loan notes are secured, the holders are secured creditors and will rank ahead of unsecured creditors in relation to the charged assets.",
                    "difficulty": "medium"
                },
                {
                    "id": 5,
                    "title": "",
                    "text": """"Chesterfield Ltd" has created a floating charge over its stock-in-trade in favour of its bank. The company then sells a significant portion of this stock to a customer in the ordinary course of business. The customer pays and takes delivery.\nWhich of the following best describes the legal effect of this sale on the bank's floating charge?""",
                    "options": [
                        {"label": "A", "text": "The sale is void because it disposes of an asset covered by the charge without the bank's consent."},
                        {"label": "B", "text": "The floating charge automatically crystallises into a fixed charge over the remaining stock upon the sale."},
                        {"label": "C", "text": "The bank's charge simply ceases to attach to the sold stock and the charge attaches to the proceeds of sale."},
                        {"label": "D", "text": "The buyer takes the stock subject to the charge and must either pay the bank or return the stock."},
                        {"label": "E", "text": "The directors become personally liable to the bank for wilfully impairing the security."}
                    ],
                    "correct_answer": "C",
                    "explanation": "Option C is correct. A key characteristic of a floating charge is that it allows the company to deal with assets in the ordinary course of business until crystallisation. The buyer gets good title, and the charge attaches to the proceeds of sale (if the charge document captures them) or to the remaining assets.\nOption A is incorrect. The whole point of a floating charge is to permit such sales in the ordinary course of business.\nOption B is incorrect. Crystallisation typically occurs upon specified events (e.g., administration, cessation of business), not automatically upon a single sale in the ordinary course.\nOption D is incorrect. A buyer in the ordinary course of business takes free of the floating charge.\nOption E is incorrect. Directors have the right to sell stock in the ordinary course; this is not a wrongful act.",
                    "difficulty": "medium"
                },
                {
                    "id": 6,
                    "title": "",
                    "text": """The directors of "Avalon PLC" are considering ways to return capital to shareholders. The company has a large cash surplus and no immediate investment plans. They are considering a share buyback versus paying a special dividend.\nWhich of the following is a key legal requirement for a private company to undertake an off-market purchase of its own shares?""",
                    "options": [
                        {"label": "A", "text": "The purchase must be approved by an ordinary resolution of the shareholders."},
                        {"label": "B", "text": "The purchase must be funded solely from distributable profits."},
                        {"label": "C", "text": "The purchase contract must be approved by a special resolution of the members, and the shares must be cancelled upon purchase."},
                        {"label": "D", "text": "The company must have authority in its articles and the purchase must be made through a recognised stock exchange."},
                        {"label": "E", "text": "The purchase contract must be approved by an ordinary resolution of the members, and the shares must be cancelled upon purchase."}
                    ],
                    "correct_answer": "C",
                    "explanation": "Option C is correct. For an off-market purchase (which includes most buybacks by private companies), the contract must be approved by a special resolution under the Companies Act 2006, s.694. The purchased shares are treated as cancelled (s.706).\nOption A and E are incorrect. An ordinary resolution is insufficient; a special resolution is required.\nOption B is incorrect. A share buyback can be funded from distributable profits or the proceeds of a fresh issue of shares made for the purpose, or even (for private companies) out of capital subject to stringent conditions.\nOption D is incorrect. Purchases through a stock exchange are \"market purchases,\" which have different rules. The question specifies an off-market purchase. Authority in the articles is required, but the stock exchange element is wrong for off-market.",
                    "difficulty": "medium"
                },
                {
                    "id": 7,
                    "title": "",
                    "text": """"Derwent Ltd" grants a fixed charge to Bank A over its factory and a floating charge to Bank B over its entire undertaking. Both charges are properly registered. Derwent Ltd goes into liquidation. The factory sells for £500,000. The company's other assets (subject to the floating charge) realise £300,000. Bank A is owed £600,000. Bank B is owed £400,000. Preferential creditors claim £50,000. Liquidation costs are £20,000.\nWhat is the correct order of distribution?""",
                    "options": [
                        {"label": "A", "text": "Liquidation costs, Preferential creditors, Bank A (from factory proceeds), Bank B (from other assets)."},
                        {"label": "B", "text": "Bank A (£500k from factory), Liquidation costs from other assets, then Preferential creditors, then Bank B."},
                        {"label": "C", "text": "Liquidation costs, Bank A (£500k from factory), Preferential creditors from other assets, then Bank B."},
                        {"label": "D", "text": "Bank A (£500k from factory), Bank B (£300k from other assets), then Liquidation costs, then Preferential creditors."},
                        {"label": "E", "text": "Liquidation costs, Preferential creditors from other assets, Bank B from remaining other assets, Bank A receives the factory proceeds but is still under-secured."}
                    ],
                    "correct_answer": "B",
                    "explanation": "Option B is correct. The fixed charge holder (Bank A) has first claim on the proceeds of the specific asset (£500k). The shortfall of £100k becomes an unsecured claim. The floating charge assets (£300k) are applied in the statutory order: 1) Liquidation costs (s.176ZA), 2) Preferential creditors (up to the \"prescribed part\" may not apply here as it's for unsecured creditors, but preferential creditors come before the floating charge holder), 3) The floating charge holder (Bank B). So from the £300k: £20k costs, £50k preferential, then the remainder (£230k) to Bank B.\nOption A is incorrect because it misorders the application of liquidation costs relative to the fixed charge holder.\nOption C is incorrect because liquidation costs are paid from the floating charge assets first, not after the fixed charge holder.\nOption D is incorrect because it pays secured creditors before liquidation costs and preferential creditors, which is wrong for floating charge assets.\nOption E is incorrect because it suggests Bank B is paid before preferential creditors from the floating charge assets.",
                    "difficulty": "hard"
                },
                {
                    "id": 8,
                    "title": "",
                    "text": """"Fenton Ltd" has accumulated realised profits of £200,000. It also has a revaluation surplus of £150,000 on a freehold property (an unrealised profit). The directors propose to pay a dividend of £300,000.\nWhat is the maximum lawful dividend they can pay based on these figures alone, assuming no other relevant factors?""",
                    "options": [
                        {"label": "A", "text": "£350,000 (the total of all profits, realised and unrealised)."},
                        {"label": "B", "text": "£200,000 (only realised profits can be distributed)."},
                        {"label": "C", "text": "£150,000 (only unrealised profits can be used for dividends)."},
                        {"label": "D", "text": "£300,000, provided the directors are confident the company will remain solvent."},
                        {"label": "E", "text": "£0, because a company cannot pay a dividend that exceeds its retained earnings as per the balance sheet."}
                    ],
                    "correct_answer": "B",
                    "explanation": "Option B is correct. Under the Companies Act 2006, s.830(1), a distribution can only be made out of profits available for the purpose, which are \"accumulated, realised profits... less accumulated, realised losses.\" Unrealised profits (like a revaluation surplus) are not distributable.\nOption A is incorrect because it includes unrealised profits.\nOption C is incorrect because unrealised profits cannot be distributed.\nOption D is incorrect because solvency is an additional requirement, but the distributable profits limit is £200,000.\nOption E is incorrect; the company does have distributable profits of £200,000.",
                    "difficulty": "medium"
                },
                {
                    "id": 9,
                    "title": "",
                    "text": """"Grantham LLP" is considering its financing options. The members wish to raise funds without taking on debt that requires regular interest payments. They are considering admitting a new member who will contribute capital in exchange for a share of profits.\nWhich of the following is a key difference between admitting a new member (equity) and taking a bank loan (debt) for an LLP?""",
                    "options": [
                        {"label": "A", "text": "A new member's capital contribution is a liability that must be repaid on a fixed date, whereas a loan does not need to be repaid."},
                        {"label": "B", "text": "A new member will have management rights and a share of profits, whereas a lender has no management rights and is entitled to interest regardless of profits."},
                        {"label": "C", "text": "An LLP cannot take out a secured loan because it has no corporate personality to grant security."},
                        {"label": "D", "text": "A bank loan always requires personal guarantees from all members, whereas a new member's contribution does not."},
                        {"label": "E", "text": "The interest on a bank loan is a distribution of profit and can only be paid if the LLP has distributable profits."}
                    ],
                    "correct_answer": "B",
                    "explanation": "Option B is correct. Equity participants (members) typically have rights to participate in management and share in profits, which are discretionary based on the LLP agreement. Lenders are creditors with a right to contractual interest, irrespective of profitability, and generally have no management rights.\nOption A is incorrect. A member's capital is not a repayable debt; it is part of the LLP's capital unless returned in accordance with the agreement. A loan must be repaid.\nOption C is incorrect. An LLP is a body corporate and can grant security over its assets.\nOption D is incorrect. A bank loan does not always require personal guarantees; it depends on the creditworthiness of the LLP.\nOption E is incorrect. Interest on a loan is a business expense, not a distribution of profit. It is payable regardless of profits.",
                    "difficulty": "medium"
                },
                {
                    "id": 10,
                    "title": "",
                    "text": """"Harrogate Ltd" has an accounting reference date of 31 December. For the year ended 31 December 2024, it is a small company. Its directors approve the accounts on 15 March 2025. The company's financial year ends on 31 December.\nWhat is the deadline for filing these accounts with Companies House?""",
                    "options": [
                        {"label": "A", "text": "31 December 2025 (12 months after the accounting reference date)."},
                        {"label": "B", "text": "15 September 2025 (6 months after the date of approval)."},
                        {"label": "C", "text": "30 September 2025 (9 months after the end of the financial year)."},
                        {"label": "D", "text": "31 March 2025 (3 months from the date of approval)."},
                        {"label": "E", "text": "30 June 2025 (6 months from the end of the financial year)."}
                    ],
                    "correct_answer": "C",
                    "explanation": "Option C is correct. For a private company, the period for filing accounts is 9 months after the end of the relevant accounting period (Companies Act 2006, s.442). The accounting period ends on the accounting reference date (31 Dec). So the deadline is 30 September 2025. The date of approval is relevant for the period for sending copies to members, not for filing.\nOption A is incorrect.\nOption B and D incorrectly use the approval date for the filing deadline.\nOption E is 6 months, which is the period for sending accounts to members (for a private company) under s.423, not for filing.",
                    "difficulty": "medium"
                },
                {
                    "id": 11,
                    "title": "",
                    "text": """"Ilkley Ltd" issues 100,000 £1 preference shares at par. The terms state they carry a fixed cumulative dividend of 5% per annum and have priority in a winding up to a return of capital equal to the amount paid up. In 2024, the company has insufficient profits and does not pay the preference dividend.\nIn 2025, the company has ample profits and declares a dividend. What must the company do regarding the preference shareholders' dividends for 2024 and 2025?""",
                    "options": [
                        {"label": "A", "text": "Pay only the 2025 dividend; the 2024 dividend is forever lost because it was not declared."},
                        {"label": "B", "text": "Pay both the 2024 arrears and the 2025 dividend before any ordinary dividend can be paid."},
                        {"label": "C", "text": "Pay the 2025 dividend, and the 2024 arrears are converted into additional preference shares."},
                        {"label": "D", "text": "The directors have discretion to pay either the arrears or the current year's dividend first."},
                        {"label": "E", "text": "The preference shareholders lose their right to a dividend for 2024 because dividends are never accrued."}
                    ],
                    "correct_answer": "B",
                    "explanation": "Option B is correct. Cumulative preference shares mean the right to a dividend accrues if not paid. The arrears for 2024 must be paid in a later year when profits are available, before any dividend can be paid to ordinary shareholders. The current year's (2025) preference dividend is also due before ordinary dividends.\nOption A is incorrect because the dividend is cumulative, so the right accrues.\nOption C is incorrect; arrears are not automatically capitalised.\nOption D is incorrect; the arrears must be paid before ordinary dividends, and the current year's preference dividend is also due before ordinary dividends. The order is typically: arrears of preference, then current preference, then ordinary.\nOption E is incorrect; cumulative dividends do accrue.",
                    "difficulty": "medium"
                },
                {
                    "id": 12,
                    "title": "",
                    "text": """"Jervaulx Ltd" grants a fixed charge to Bank X over its machinery. The charge document is dated 1 March 2025. The company's director mistakenly believes registration is only needed if the bank requests it. The company's solicitor realises the error on 25 March 2025.\nWhat is the consequence if the charge is not registered at Companies House by the deadline?""",
                    "options": [
                        {"label": "A", "text": "The charge is void against the company, but remains valid against third parties."},
                        {"label": "B", "text": "The charge is void against a liquidator, administrator, and any creditor of the company, and the money secured becomes immediately payable."},
                        {"label": "C", "text": "The charge is only void against a subsequent chargee who registers their charge first."},
                        {"label": "D", "text": "The charge is valid, but the company and every officer in default commit an offence."},
                        {"label": "E", "text": "The charge is voidable at the option of the company, which can choose to cancel it."}
                    ],
                    "correct_answer": "B",
                    "explanation": "Option B is correct. Under the Companies Act 2006, s.859H, if a charge requiring registration under Part 25 is not registered within 21 days (i.e., by 22 March 2025), it is void (so far as any security on the company's property is conferred) against a liquidator, administrator, and any creditor. The debt becomes immediately payable (s.859H(4)).\nOption A is incorrect; it is void against the specified parties, not just the company.\nOption C is incorrect; the consequence is more severe than just losing priority.\nOption D is incorrect; while there may be an offence, the primary consequence is voidness of the security.\nOption E is incorrect; the charge is automatically void against the specified parties, not voidable.",
                    "difficulty": "medium"
                },
                {
                    "id": 13,
                    "title": "",
                    "text": """"Knaresborough Ltd" is a small company. Its directors wish to know what accounting records they are legally required to keep under the Companies Act 2006.\nWhich of the following is not a statutory requirement for the accounting records of a company?""",
                    "options": [
                        {"label": "A", "text": "Records sufficient to show and explain the company's transactions."},
                        {"label": "B", "text": "A record of the company's assets and liabilities."},
                        {"label": "C", "text": "A daily cash flow statement filed with HMRC."},
                        {"label": "D", "text": "Statements of stock-taking (if any) and supporting documentation."},
                        {"label": "E", "text": "Records of goods sold and purchased (if dealing in goods), identifying buyers and sellers."}
                    ],
                    "correct_answer": "C",
                    "explanation": "Option C is correct because there is no requirement to file a daily cash flow statement with HMRC. The Companies Act 2006, s.386, requires accounting records that are sufficient to show and explain transactions, disclose the financial position at any time, and enable directors to ensure accounts comply with the Act. Specifics include records of assets/liabilities, stock, goods sold/purchased (with identities), but not daily filings.\nOptions A, B, D, and E are all explicit requirements under s.386.",
                    "difficulty": "easy"
                },
                {
                    "id": 14,
                    "title": "",
                    "text": """"Linton Ltd" has one class of ordinary shares. The directors propose to pay a final dividend recommended by them and to be approved by the members in general meeting. The shareholders pass an ordinary resolution approving the dividend.\nWhich of the following statements is correct regarding this final dividend?""",
                    "options": [
                        {"label": "A", "text": "Once declared by the members, it becomes a debt due from the company to each shareholder."},
                        {"label": "B", "text": "It remains a discretionary distribution until actually paid, and the directors can rescind the resolution if they later believe it imprudent."},
                        {"label": "C", "text": "The directors are legally obliged to pay it immediately upon the passing of the resolution, even if the company subsequently becomes insolvent."},
                        {"label": "D", "text": "It can only be paid if the company has sufficient cash at bank, regardless of the level of distributable profits."},
                        {"label": "E", "text": "It is unlawful if any shareholder votes against the resolution."}
                    ],
                    "correct_answer": "A",
                    "explanation": "Option A is correct. A final dividend, when declared by the company in general meeting (or by the directors if they have the power), creates a debt enforceable by the shareholders. This contrasts with an interim dividend, which is discretionary until paid.\nOption B is incorrect; this describes an interim dividend, not a declared final dividend.\nOption C is incorrect; while it becomes a debt, if the company becomes insolvent, the shareholders rank as unsecured creditors and may not be paid.\nOption D is incorrect; the legal test is based on distributable profits, not cash liquidity (though liquidity is a practical consideration).\nOption E is incorrect; a dividend can be approved by a simple majority of those voting.",
                    "difficulty": "medium"
                },
                {
                    "id": 15,
                    "title": "",
                    "text": """"Masham Ltd" grants a floating charge to its bank "over the company's undertaking and all its property and assets present and future." The company later purchases a new piece of equipment.\nWhich of the following describes the status of this new equipment regarding the floating charge?""",
                    "options": [
                        {"label": "A", "text": "The equipment is not covered by the charge because it was acquired after the charge was created."},
                        {"label": "B", "text": "The equipment is automatically subject to a fixed charge in favour of the bank."},
                        {"label": "C", "text": "The equipment is automatically subject to the existing floating charge, as it falls within future property."},
                        {"label": "D", "text": "The company must seek the bank's consent to use the equipment in its business."},
                        {"label": "E", "text": "The equipment is free from any security interest unless a new charge is created over it."}
                    ],
                    "correct_answer": "C",
                    "explanation": "Option C is correct. A floating charge expressed to cover \"undertaking and all assets present and future\" will attach to after-acquired property automatically, subject to the company's right to deal with it in the ordinary course of business until crystallisation.\nOption A is incorrect; floating charges commonly cover future assets.\nOption B is incorrect; it remains subject to the floating charge, not a fixed charge.\nOption D is incorrect; the company can use the asset in the ordinary course without consent.\nOption E is incorrect; the floating charge attaches.",
                    "difficulty": "medium"
                },
                {
                    "id": 16,
                    "title": "",
                    "text": """"Nidderdale Ltd" has distributable profits of £100,000. It also has a share premium account of £50,000. The directors wish to use these funds to issue bonus shares to existing shareholders. Can the share premium account be used for this purpose?""",
                    "options": [
                        {"label": "A", "text": "No, the share premium account can only be used to pay up bonus shares if the company passes a special resolution to reduce capital."},
                        {"label": "B", "text": "Yes, the share premium account can always be used to finance the issue of fully paid bonus shares."},
                        {"label": "C", "text": "No, the share premium account is part of the company's capital and can never be distributed to shareholders."},
                        {"label": "D", "text": "Yes, but only if the company also has sufficient distributable profits to cover the issue."},
                        {"label": "E", "text": "No, the share premium account can only be used to write off preliminary expenses or issue expenses."}
                    ],
                    "correct_answer": "B",
                    "explanation": "Option B is correct. Under the Companies Act 2006, s.610, the share premium account may be applied in paying up unissued shares to be allotted to members as fully paid bonus shares. This is a permitted use without a court-approved reduction of capital.\nOption A is incorrect; a special resolution is not required for this specific use.\nOption C is incorrect; while it is part of capital and cannot be distributed as cash dividends, it can be used for bonus shares.\nOption D is incorrect; it can be used independently of distributable profits for this purpose.\nOption E is incorrect; while it can also be used for those purposes, issuing bonus shares is another permitted use.",
                    "difficulty": "medium"
                },
                {
                    "id": 17,
                    "title": "",
                    "text": """"Otley Ltd" takes out a term loan from a bank. As security, the company grants a fixed charge over its land and a floating charge over its other assets. The bank also requires a personal guarantee from the company's main director, David.\nIf the company defaults and the bank enforces the personal guarantee, which of the following is correct?""",
                    "options": [
                        {"label": "A", "text": "David, having paid under the guarantee, is subrogated to the bank's rights as a secured creditor and can enforce the charges."},
                        {"label": "B", "text": "David becomes an unsecured creditor of the company for the amount he paid."},
                        {"label": "C", "text": "The bank's charges are automatically transferred to David upon his payment."},
                        {"label": "D", "text": "David has no right of recovery from the company; the guarantee is a gift."},
                        {"label": "E", "text": "The bank must choose between enforcing the charges and calling the guarantee; it cannot do both."}
                    ],
                    "correct_answer": "A",
                    "explanation": "Option A is correct. The doctrine of subrogation entitles a guarantor who pays the debt to step into the shoes of the creditor and enforce any securities held by the creditor, subject to the terms of the guarantee.\nOption B is incorrect; the guarantor is subrogated to the secured position.\nOption C is incorrect; the charges are not automatically transferred; the guarantor acquires an equitable right to the securities.\nOption D is incorrect; a guarantor has a right of indemnity from the principal debtor (the company).\nOption E is incorrect; the bank can both enforce the charges and call the guarantee, though it cannot recover more than the total debt.",
                    "difficulty": "medium"
                },
                {
                    "id": 18,
                    "title": "",
                    "text": """"Ripon Ltd" has a financial year ending 31 January 2025. Its directors hold a board meeting on 1 May 2025 to approve the accounts. The company is private and small.\nWhat is the deadline for sending copies of the annual accounts to members?""",
                    "options": [
                        {"label": "A", "text": "Within 9 months of the year-end (i.e., by 31 October 2025)."},
                        {"label": "B", "text": "Within 6 months of the year-end (i.e., by 31 July 2025)."},
                        {"label": "C", "text": "At least 21 days before the general meeting at which they are to be laid (if any)."},
                        {"label": "D", "text": "The later of 9 months after the year-end or 3 months after the date of approval."},
                        {"label": "E", "text": "The later of 6 months after the year-end or 1 month after the date of approval."}
                    ],
                    "correct_answer": "B",
                    "explanation": "Option B is correct. For a private company, the period for sending copies of the annual accounts to members is 6 months after the end of the relevant accounting period (Companies Act 2006, s.423). The approval date is irrelevant for this deadline. The year-end is 31 January 2025, so the deadline is 31 July 2025.\nOption A is the filing deadline for a private company (9 months), not the sending deadline.\nOption C is the rule for sending copies before a general meeting, but for private companies, the default is sending within 6 months of year-end, regardless of a meeting.\nOption D and E are incorrect.",
                    "difficulty": "medium"
                }
            ]
            print("-> Patched Business Law Section D with 18 new questions")
            
            # =====================================================
            # Patch Business Law Section E - Corporate governance and compliance
            # =====================================================
            area_e = next((a for a in bl_topic["areas"] if a["letter"] == "E"), None)
            if area_e:
                area_e["name"] = "Corporate governance and compliance"
                area_e["slug"] = "e-corporate-governance-and-compliance"
                area_e["question_count"] = 20
            else:
                area_e = {
                    "letter": "E",
                    "name": "Corporate governance and compliance",
                    "slug": "e-corporate-governance-and-compliance",
                    "question_count": 20,
                    "questions": []
                }
                bl_topic["areas"].insert(4, area_e)
            
            area_e["questions"] = [
                {
                    "id": 1,
                    "title": "",
                    "text": """Thomas is the sole director of "Cedar Trading Ltd," a private company with two shareholders. Thomas uses £50,000 of the company's funds to purchase a luxury car for his personal use, without any discussion with the shareholders. He believes this is acceptable because the company is profitable and he works very hard. A shareholder discovers the transaction and challenges it.\nWhich of the following director's duties under the Companies Act 2006 has Thomas most clearly breached?""",
                    "options": [
                        {"label": "A", "text": "Duty to promote the success of the company."},
                        {"label": "B", "text": "Duty to exercise independent judgment."},
                        {"label": "C", "text": "Duty to avoid conflicts of interest."},
                        {"label": "D", "text": "Duty not to accept benefits from third parties."},
                        {"label": "E", "text": "Duty to exercise reasonable care, skill and diligence (s.174)."}
                    ],
                    "correct_answer": "A",
                    "explanation": "Option A is correct. The duty under s.172 requires a director to act in the way he considers, in good faith, would be most likely to promote the success of the company for the benefit of its members as a whole. Using company funds for a personal luxury item with no commercial justification is a classic breach of this duty, as it constitutes a failure to act for the benefit of the company.\nOption B is incorrect. While related, the core issue is not about independence of judgment but about the improper purpose of the expenditure.\nOption C is incorrect. This was a direct misuse of company property, not a situation where Thomas had a personal interest conflicting with the company's interest in a transactional sense (though it is related). The primary breach is of the s.172 purpose duty.\nOption D is incorrect. The benefit (the car) came from company funds, not from a third party.\nOption E is incorrect. While his actions may also lack diligence, the most direct and flagrant breach is of the good faith/promote success duty in s.172.",
                    "difficulty": "medium"
                },
                {
                    "id": 2,
                    "title": "",
                    "text": """"Ashbourne PLC" has seven directors. The board wishes to approve a substantial property transaction with a company in which one of the directors, Fatima, holds a 30% shareholding. The proposed transaction is at market value.\nWhich of the following is required for this transaction to be lawfully approved by the company?""",
                    "options": [
                        {"label": "A", "text": "The transaction must be approved by an ordinary resolution of the shareholders, with Fatima and any connected persons abstaining from voting."},
                        {"label": "B", "text": "The transaction must be approved by the board of directors, provided Fatima declares her interest and does not vote, and the other directors approve it."},
                        {"label": "C", "text": "The transaction requires both approval by the board (with Fatima's interest declared and her not voting) and subsequent approval by an ordinary resolution of the shareholders."},
                        {"label": "D", "text": "The transaction is prohibited absolutely under the Companies Act 2006 because Fatima has a substantial interest in the other company."},
                        {"label": "E", "text": "The transaction must be approved by a special resolution of the shareholders, with Fatima and any connected persons abstaining from voting."}
                    ],
                    "correct_answer": "A",
                    "explanation": "Option A is correct. This is a substantial property transaction with a director-connected person under s.190 of the Companies Act 2006. For a public company, such a transaction requires approval by a resolution of the members (shareholders). Director approval alone is insufficient. The director concerned cannot vote on the shareholder resolution.\nOption B is incorrect. Board approval is insufficient for a substantial property transaction with a connected person; shareholder approval is mandatory.\nOption C is incorrect. While board approval may be sought, the Act only mandates shareholder approval. It does not require both layers.\nOption D is incorrect. Such transactions are not prohibited; they are permissible with the required member approval.\nOption E is incorrect. It should be ordinary resolution.",
                    "difficulty": "medium"
                },
                {
                    "id": 3,
                    "title": "",
                    "text": """The board of "Marlow Ltd" wants to remove David, a director appointed for a fixed term of three years, after only one year. The company's articles do not contain any special provisions for removal. David is also a shareholder.\nWhat is the correct procedure to remove David as a director?""",
                    "options": [
                        {"label": "A", "text": "The board can pass a resolution to remove him by a simple majority, provided they give him notice of the meeting."},
                        {"label": "B", "text": "The shareholders can pass an ordinary resolution provided special notice is given to the company."},
                        {"label": "C", "text": "David can only be removed by a unanimous written resolution of all shareholders, as he is also a member."},
                        {"label": "D", "text": "David cannot be removed before his three-year term expires, as this would be a breach of his service contract."},
                        {"label": "E", "text": "The shareholders must pass a special resolution (75% vote in favour) because removal is an alteration of his contract."}
                    ],
                    "correct_answer": "B",
                    "explanation": "Option B is correct. S.168 of the Companies Act 2006 provides that a company may by ordinary resolution remove a director before the expiration of his period of office, notwithstanding anything in the articles or any service agreement. Special notice (28 days) must be given to the company by the shareholder proposing the resolution.\nOption A is incorrect. Directors cannot generally remove a fellow director unless the articles permit it. The primary statutory power resides with the shareholders.\nOption C is incorrect. Unanimity is not required; an ordinary resolution suffices.\nOption D is incorrect. S.168 explicitly allows removal before the end of a term, though it may give rise to a claim for damages for breach of service contract.\nOption E is incorrect. The resolution required is an ordinary resolution, not a special resolution.",
                    "difficulty": "medium"
                },
                {
                    "id": 4,
                    "title": "",
                    "text": """"Beacon Ltd" has three shareholders: Alex (70% of shares), Ben (20%), and Chloe (10%). Alex is also the sole director. Alex consistently makes decisions that benefit another company he owns, to the detriment of Beacon Ltd. Ben and Chloe are frustrated but are outvoted on every shareholder resolution Alex proposes.\nWhich of the following remedies might be available to Ben and Chloe as minority shareholders?""",
                    "options": [
                        {"label": "A", "text": "They can requisition a general meeting to pass an ordinary resolution to overrule the director's decisions."},
                        {"label": "B", "text": "They can apply to court for an order on the grounds that the company's affairs are being conducted in a manner unfairly prejudicial to their interests."},
                        {"label": "C", "text": "They can initiate a derivative claim on behalf of the company against Alex for breach of duty, without needing the court's permission."},
                        {"label": "D", "text": "They can demand that the company purchase their shares at a fair value, and if refused, petition for the company to be wound up."},
                        {"label": "E", "text": "They have no remedy because Alex, as the majority shareholder, is entitled to run the company as he sees fit."}
                    ],
                    "correct_answer": "B",
                    "explanation": "Option B is correct. S.994 provides a remedy where a company's affairs are being conducted in a manner unfairly prejudicial to the interests of its members generally or of some part of its members. Alex using his control to benefit himself at the company's expense is classic unfairly prejudicial conduct.\nOption A is incorrect. As Alex controls over 50% of the votes, he can defeat any ordinary resolution they propose.\nOption C is incorrect. A derivative claim requires permission from the court to continue (s.261). It is not automatic. Furthermore, a s.994 petition is often a more direct remedy for minority shareholders in a quasi-partnership like this.\nOption D is incorrect. While a buy-out order is a potential outcome of a successful s.994 petition, they cannot unilaterally demand it. A winding-up petition on the \"just and equitable\" ground (s.122(1)(g)) is possible but is a remedy of last resort.\nOption E is incorrect. Majority power is not absolute and must not be exercised in a manner that is unfairly prejudicial to the minority.",
                    "difficulty": "medium"
                },
                {
                    "id": 5,
                    "title": "",
                    "text": """The shareholders of "Denby Ltd" wish to pass a written resolution to approve a disposal of a major asset. The resolution is proposed as an ordinary resolution. There are 100 shares in issue. On 1 June, the company circulates the resolution. By 15 June, shareholders holding 55 shares have signed and returned their agreement. The holders of the remaining 45 shares are opposed but do not respond.\nWhen is the resolution passed?""",
                    "options": [
                        {"label": "A", "text": "On 15 June, when the majority (55%) of total shares has agreed."},
                        {"label": "B", "text": "On 1 July, provided no shareholders have revoked their agreement, as there is a 28-day deemed passage period."},
                        {"label": "C", "text": "It is not passed, because written resolutions require unanimous consent from all shareholders."},
                        {"label": "D", "text": "It is passed at the end of the 21-day period from circulation (i.e., on 22 June), provided the assents received represent a simple majority of the total voting rights."},
                        {"label": "E", "text": "It is passed at the end of the 28-day period from circulation (i.e., on 29 June), provided the assents received represent a simple majority of the total voting rights."}
                    ],
                    "correct_answer": "E",
                    "explanation": "Option E is correct. Under the Companies Act 2006, s.296, a written resolution is passed when the required majority (for an ordinary resolution, a simple majority of the total voting rights) is achieved. However, the resolution is not effectively passed until the end of the circulation period (default 28 days from circulation), provided the required majority is met at that point (s.296(3)-(4)).\nOption A is incorrect. While the majority has assented, the resolution is not formally passed until the end of the circulation period.\nOption B is incorrect. The resolution is passed at the end of the 28-day period, not on the day the majority is first reached.\nOption C is incorrect. Written resolutions for ordinary or special resolutions do not require unanimity.\nOption D is incorrect. It should be 28 days.",
                    "difficulty": "medium"
                },
                {
                    "id": 6,
                    "title": "",
                    "text": """"Elton Ltd" is a private company with four shareholders. The directors wish to issue 100 new ordinary shares to a new investor. The company's articles give the directors authority to allot shares, but they contain pre-emption rights on issue for cash in favour of existing shareholders.\nWhich of the following procedures must the directors follow to issue the shares lawfully to the new investor?""",
                    "options": [
                        {"label": "A", "text": "They must first offer the shares to existing shareholders pro rata, and only if those shareholders decline can they issue to the new investor."},
                        {"label": "B", "text": "They can issue the shares directly to the new investor, provided they pass a board resolution to that effect."},
                        {"label": "C", "text": "They must obtain an ordinary resolution of the shareholders disapplying the pre-emption rights for this specific issue."},
                        {"label": "D", "text": "They must obtain a special resolution of the shareholders authorising the allotment, as the directors have no existing authority."},
                        {"label": "E", "text": "They can issue the shares to the new investor if they believe it is in the best interests of the company, as pre-emption rights are not legally binding."}
                    ],
                    "correct_answer": "A",
                    "explanation": "Option A is correct. Unless disapplied, statutory pre-emption rights (s.561 of the Companies Act 2006) require that new equity shares offered for cash must first be offered to existing shareholders in proportion to their holdings. The company's articles often reinforce this.\nOption B is incorrect. The board resolution is necessary for the allotment, but it does not override the pre-emption rights.\nOption C is incorrect. While shareholders can pass a special resolution to disapply pre-emption rights (s.570), it is not required for each issue if the directors follow the pre-emption procedure. The question is about the procedure if they wish to issue to an outsider; they must first offer to existing shareholders.\nOption D is incorrect. The directors already have authority to allot under the articles. The issue is about pre-emption, not allotment authority.\nOption E is incorrect. Pre-emption rights are statutory and binding unless properly disapplied.",
                    "difficulty": "medium"
                },
                {
                    "id": 7,
                    "title": "",
                    "text": """Grace is a director of "Fenton Products Ltd." She is negotiating a contract on the company's behalf with "Harper Supplies Ltd," a company owned by her husband. At a board meeting, she discloses that her husband owns Harper Supplies but states she believes the terms are favourable.\nWhat must the board do to ensure the transaction is not voidable for conflict of interest?""",
                    "options": [
                        {"label": "A", "text": "Nothing, because Grace has disclosed her interest, and the transaction is fair."},
                        {"label": "B", "text": "The board must formally approve the transaction, and Grace must neither vote nor be counted in the quorum for that decision."},
                        {"label": "C", "text": "The board must formally approve the transaction, and Grace can vote and be counted in the quorum for that decision."},
                        {"label": "D", "text": "The transaction must be approved by an ordinary resolution of the shareholders after full disclosure."},
                        {"label": "E", "text": "The transaction is automatically voidable unless approved by the shareholders in general meeting."}
                    ],
                    "correct_answer": "B",
                    "explanation": "Option B is correct. Under s.175 of the Companies Act 2006, a director must avoid a conflict of interest. The conflict can be authorised by the directors provided the matter is proposed to the board, the interest is declared, and the conflicted director does not vote or count in the quorum (unless the articles permit otherwise). This is the standard procedure for board authorisation. Therefore, option C is incorrect.\nOption A is incorrect. Disclosure alone is insufficient; the conflict must be authorised by the directors (or shareholders).\nOption D is incorrect. Shareholder approval is an alternative route (s.180(4)(a)), but authorisation by the directors is sufficient if the articles permit it, which they typically do.\nOption E is incorrect. The transaction is voidable unless authorised or ratified; authorisation can be by the directors.",
                    "difficulty": "medium"
                },
                {
                    "id": 8,
                    "title": "",
                    "text": """"Irwell Ltd" holds its Annual General Meeting (AGM). The company's articles require an AGM every year. Due to an administrative error, the notice of the AGM was sent to shareholders only 12 days before the meeting date, instead of the required 14 clear days.\nWhat is the legal effect of this shorter notice period?""",
                    "options": [
                        {"label": "A", "text": "The meeting and any business conducted are void."},
                        {"label": "B", "text": "The meeting is valid if all shareholders entitled to attend and vote agree to short notice."},
                        {"label": "C", "text": "The meeting is valid only for the passing of ordinary resolutions, but special resolutions would be void."},
                        {"label": "D", "text": "The meeting is valid because private companies are no longer required to hold AGMs."},
                        {"label": "E", "text": "The meeting is valid if a majority of shareholders (by voting rights) agree to short notice."}
                    ],
                    "correct_answer": "B",
                    "explanation": "Option B is correct. Under s.307 of the Companies Act 2006, the notice period for a general meeting is 14 clear days. However, s.307(5) & (6) allow for shorter notice if agreed by a majority in number of members holding at least 90% of the voting rights (for a private company) or by all members entitled to attend and vote (for a public company). The most accurate general statement for a private company is that it requires agreement of the members.\nOption A is incorrect. The meeting is not automatically void; it can be validated by shareholder agreement.\nOption C is incorrect. The rule for short notice applies to the meeting itself, not to specific types of resolution, provided the requisite agreement is obtained.\nOption D is incorrect. While private companies can elect to dispense with AGMs, the question states the articles require one, so it must be held.\nOption E is incorrect. The required majority is not a simple majority; it is the 90% threshold (or unanimity for a public company).",
                    "difficulty": "medium"
                },
                {
                    "id": 9,
                    "title": "",
                    "text": """"Jarrow Ltd" has two directors, Mark and Nina. Mark holds 60% of the shares, Nina holds 10%, and an external investor holds 30%. Nina is removed as a director by an ordinary resolution of shareholders. She wishes to challenge her removal.\nWhich of the following best describes her legal position?""",
                    "options": [
                        {"label": "A", "text": "She cannot be removed because she is also a shareholder, and this protects her directorship."},
                        {"label": "B", "text": "Her removal is valid, but she may have a claim for unfair prejudice if she can show she had a legitimate expectation of participation in management."},
                        {"label": "C", "text": "Her removal is invalid unless the company also buys back her shares at a fair price."},
                        {"label": "D", "text": "Her removal is invalid because it requires a special resolution under s.168."},
                        {"label": "E", "text": "She can only be removed for cause, such as misconduct, and can challenge the removal if no cause is shown."}
                    ],
                    "correct_answer": "B",
                    "explanation": "Option B is correct. The power to remove under s.168 is broad, and the removal itself is valid. However, in a small quasi-partnership company where a shareholder-director has a legitimate expectation of participating in management, removal without good reason could form the basis of an unfair prejudice petition under s.994.\nOption A is incorrect. Shareholding does not confer an indefeasible right to be a director.\nOption C is incorrect. There is no legal link between removal as director and a compulsory share purchase.\nOption D is incorrect. S.168 explicitly requires only an ordinary resolution.\nOption E is incorrect. S.168 allows removal with or without cause.",
                    "difficulty": "medium"
                },
                {
                    "id": 10,
                    "title": "",
                    "text": """The board of "Kendal PLC" is proposing a substantial transaction that will require shareholder approval via a special resolution. They are concerned about a minority shareholder who is opposed and may try to disrupt the general meeting.\nWhat is the minimum percentage of voting rights that a shareholder (or group acting together) must hold to demand a poll vote on a special resolution at a general meeting?""",
                    "options": [
                        {"label": "A", "text": "5% of the voting rights."},
                        {"label": "B", "text": "10% of the voting rights."},
                        {"label": "C", "text": "Members holding at least 5% of the voting rights or 100 members, whichever is less."},
                        {"label": "D", "text": "Any single member, regardless of shareholding."},
                        {"label": "E", "text": "25% of the voting rights."}
                    ],
                    "correct_answer": "B",
                    "explanation": "Option B is correct. Under the Companies Act 2006, s.321, the right to demand a poll on a resolution is available to (among others) members representing not less than one-tenth of the total voting rights of all members having the right to vote on the resolution.\nOption A is incorrect. 5% is the threshold for requiring the circulation of a resolution or statement (s.292).\nOption C is incorrect. This is the threshold for requiring circulation of a resolution (s.292), not for demanding a poll.\nOption D is incorrect. While articles can give any member the right to demand a poll, the statutory minimum right is held by 10%.\nOption E is incorrect. 25% is a significant blocking minority for special resolutions but is not the threshold for demanding a poll.",
                    "difficulty": "medium"
                },
                {
                    "id": 11,
                    "title": "",
                    "text": """"Lytham Ltd" has three directors. One director, Oliver, resigns unexpectedly. The remaining two directors wish to appoint a new director to fill the vacancy.\nWhat is the correct procedure, assuming the company's articles are the Model Articles for private companies?""",
                    "options": [
                        {"label": "A", "text": "They can appoint a new director by a majority decision of the remaining directors."},
                        {"label": "B", "text": "They must call a general meeting of shareholders to pass an ordinary resolution appointing the new director."},
                        {"label": "C", "text": "They must obtain the unanimous written consent of all shareholders."},
                        {"label": "D", "text": "They cannot fill the vacancy; the company must continue with only two directors."},
                        {"label": "E", "text": "They can appoint a new director, but the appointment is only valid until the next AGM, where shareholders must confirm it."}
                    ],
                    "correct_answer": "A",
                    "explanation": "Option A is correct. Model Article 17(1) for private companies provides that the directors may appoint a person as a director, either to fill a vacancy or as an additional director. The standard rule is that such a decision is made by a majority of the directors.\nOption B is incorrect. While shareholders can also appoint directors by ordinary resolution, the articles typically give the directors the power to fill a casual vacancy.\nOption C is incorrect. Unanimous consent is not required.\nOption D is incorrect. Directors can fill vacancies to maintain the board.\nOption E is incorrect. There is no requirement for shareholder confirmation at the next AGM under the Model Articles.",
                    "difficulty": "medium"
                },
                {
                    "id": 12,
                    "title": "",
                    "text": """"Mauldeth Ltd" fails to file its annual confirmation statement (Form CS01) with Companies House within the 14-day deadline after its review period. The registrar has not taken any action.\nWhat is the potential consequence for the company and every officer in default?""",
                    "options": [
                        {"label": "A", "text": "The company is automatically dissolved after 6 months."},
                        {"label": "B", "text": "The company and every officer in default commit an offence and are liable to a fine."},
                        {"label": "C", "text": "The company's assets are frozen until the statement is filed."},
                        {"label": "D", "text": "There is no consequence; the confirmation statement is a voluntary filing."},
                        {"label": "E", "text": "The company's registered office address is struck from the register."}
                    ],
                    "correct_answer": "B",
                    "explanation": "Option B is correct. Failure to deliver a confirmation statement by the deadline is an offence under s.853 of the Companies Act 2006. The company and every officer in default is liable to a fine.\nOption A is incorrect. Failure to file confirmation statements can lead to the company being struck off the register, but this is not automatic after 6 months; it is a separate process.\nOption C is incorrect. There is no provision for freezing assets for this filing failure.\nOption D is incorrect. Filing the confirmation statement is a mandatory requirement.\nOption E is incorrect. The registered office is not struck off for this failure.",
                    "difficulty": "medium"
                },
                {
                    "id": 13,
                    "title": "",
                    "text": """Naomi is a shareholder in "Neston Ltd," holding 15% of the shares. She is concerned about a recent transaction approved by the board that she believes involved a conflict of interest. She wants to inspect the company's statutory books and records to investigate.\nWhich of the following records is Naomi entitled to inspect as of right without needing a court order?""",
                    "options": [
                        {"label": "A", "text": "The minutes of board meetings."},
                        {"label": "B", "text": "The register of directors' residential addresses."},
                        {"label": "C", "text": "The company's accounting records (e.g., sales ledgers)."},
                        {"label": "D", "text": "The register of members and the register of directors' service addresses."},
                        {"label": "E", "text": "Directors' service contracts."}
                    ],
                    "correct_answer": "D",
                    "explanation": "Option D is correct. Under the Companies Act 2006, shareholders have a statutory right to inspect the register of members (s.116) and the register of directors (which contains service addresses) (s.162). These are public documents.\nOption A is incorrect. Shareholders have a right to minutes of general meetings (s.358), not board meetings.\nOption B is incorrect. The register of directors' usual residential addresses is confidential and not open for inspection by shareholders (s.165).\nOption C is incorrect. Accounting records are not open for shareholder inspection as of right; they are private company records.\nOption E is incorrect. While shareholders have a right to inspect copies of directors' service contracts kept at the registered office (s.229), this is not as widely known as the registers, and the question asks for the clearest example of an absolute right. D is a more fundamental and unambiguous right.",
                    "difficulty": "medium"
                },
                {
                    "id": 14,
                    "title": "",
                    "text": """"Orrell Ltd" has one class of share. The directors wish to recommend a final dividend. The company's articles state that dividends are declared by ordinary resolution.\nWhat is the effect of the shareholders passing the resolution to declare the dividend?""",
                    "options": [
                        {"label": "A", "text": "It creates an immediate debt owing by the company to each shareholder in proportion to their shareholding."},
                        {"label": "B", "text": "It gives the directors discretion to pay the dividend if, and when, they think it prudent."},
                        {"label": "C", "text": "It must be paid within 14 days of the resolution, or it lapses."},
                        {"label": "D", "text": "It is only valid if the company had distributable profits both at the time of the resolution and at the time of payment."},
                        {"label": "E", "text": "It authorises the directors to pay an interim dividend of the same amount."}
                    ],
                    "correct_answer": "A",
                    "explanation": "Option A is correct. A final dividend, once declared by the company in general meeting, becomes a debt due from the company to the shareholders. This contrasts with an interim dividend, which is declared by directors and remains discretionary until paid.\nOption B is incorrect. This describes an interim dividend.\nOption C is incorrect. There is no statutory 14-day rule; the debt is enforceable within the limitation period.\nOption D is incorrect. The lawfulness of a dividend is judged at the time it is paid (or becomes a debt in the case of a declared final dividend). For a final dividend, the relevant date is the date of declaration.\nOption E is incorrect. A final dividend resolution is distinct; it does not authorise an interim dividend.",
                    "difficulty": "medium"
                },
                {
                    "id": 15,
                    "title": "",
                    "text": """Peter, a director of "Pendle Ltd," is exploring a business opportunity that falls within the company's existing line of business. He does not tell the board and sets up a separate company to pursue it.\nWhich duty has Peter most clearly breached?""",
                    "options": [
                        {"label": "A", "text": "Duty to exercise reasonable care, skill, and diligence (s.174)."},
                        {"label": "B", "text": "Duty to promote the success of the company (s.172)."},
                        {"label": "C", "text": "Duty to avoid conflicts of interest (s.175)."},
                        {"label": "D", "text": "Duty to declare an interest in a proposed transaction (s.177)."},
                        {"label": "E", "text": "Duty not to accept benefits from third parties (s.176)."}
                    ],
                    "correct_answer": "C",
                    "explanation": "Option C is correct. S.175 imposes a duty to avoid conflicts of interest, which specifically includes exploiting any property, information, or opportunity of the company. Taking a corporate opportunity for himself without authorisation is a direct breach of this duty.\nOption A is incorrect. While his actions may lack diligence, the primary breach is the conflict.\nOption B is incorrect. The breach of the s.172 duty is a consequence of the conflict; the most direct and specific breach is of s.175.\nOption D is incorrect. S.177 relates to declaring an interest in a transaction with the company. This is about exploiting an opportunity that belongs to the company, which falls under s.175.\nOption E is incorrect. The benefit is coming from the opportunity itself, not from a third party.",
                    "difficulty": "medium"
                },
                {
                    "id": 16,
                    "title": "",
                    "text": """"Quarry Bank Ltd" has four shareholders. The directors propose to amend the company's articles of association to introduce a new power for directors to refuse the transfer of shares. Shareholder A, who holds 30%, strongly objects.\nHow can the articles be validly amended?""",
                    "options": [
                        {"label": "A", "text": "By a special resolution passed at a general meeting."},
                        {"label": "B", "text": "By a written resolution agreed by shareholders holding 75% of the voting rights."},
                        {"label": "C", "text": "By an ordinary resolution passed at a general meeting."},
                        {"label": "D", "text": "By a unanimous written resolution of all shareholders."},
                        {"label": "E", "text": "Either A or B is correct."}
                    ],
                    "correct_answer": "E",
                    "explanation": "Option E is correct. Under s.21 of the Companies Act 2006, a company's articles can be amended by a special resolution. A special resolution can be passed either at a general meeting (s.283) or as a written resolution (s.288). Both require the same majority: 75% of the total voting rights.\nOption A is correct but incomplete, as B is also a valid method.\nOption B is correct but incomplete, as A is also a valid method.\nOption C is incorrect. An ordinary resolution is insufficient to amend the articles.\nOption D is incorrect. While unanimity would achieve the 75% threshold, it is not required; 75% suffices.",
                    "difficulty": "medium"
                },
                {
                    "id": 17,
                    "title": "",
                    "text": """"Rivington Ltd" has an audit committee. The committee is reviewing the independence of the external auditors. The finance director mentions that the audit partner's brother has recently been appointed as the company's Head of Internal Audit.\nUnder the UK Corporate Governance Code, which principle is most directly threatened by this situation?""",
                    "options": [
                        {"label": "A", "text": "The auditors must be appointed by the majority shareholders."},
                        {"label": "B", "text": "The auditors must exercise professional scepticism."},
                        {"label": "C", "text": "The auditors must be, and be seen to be, independent."},
                        {"label": "D", "text": "The auditors must rotate every 12 years."},
                        {"label": "E", "text": "The audit committee must comprise only non-executive directors."}
                    ],
                    "correct_answer": "C",
                    "explanation": "Option C is correct. A core principle of audit regulation is that auditors must be independent in fact and appearance. A close family connection between the audit partner and a key company officer (Head of Internal Audit) creates a clear threat to perceived independence.\nOption A is incorrect. It does not address the independence issue raised.\nOption B is incorrect. Professional scepticism is a separate requirement.\nOption D is incorrect. Partner rotation is a specific rule to safeguard independence, but the principle at stake here is independence itself.\nOption E is incorrect. This relates to the composition of the committee, not the auditor's independence.",
                    "difficulty": "medium"
                },
                {
                    "id": 18,
                    "title": "",
                    "text": """Sadia holds 8% of the shares in "Stalybridge Ltd." She wishes to propose a resolution at the next AGM to remove the current chairman from the board. The company has received her notice.\nWhat must the company do in these circumstances?""",
                    "options": [
                        {"label": "A", "text": "Include the resolution in the notice of the AGM and circulate it at Sadia's expense if she requests it."},
                        {"label": "B", "text": "Refuse to include the resolution because only the board can propose resolutions for an AGM."},
                        {"label": "C", "text": "Include the resolution only if the board agrees that it is in the company's best interests."},
                        {"label": "D", "text": "Circulate the resolution to members at the company's expense, as she holds more than 5% of the voting rights."},
                        {"label": "E", "text": "Require Sadia to obtain the support of shareholders holding at least 25% of the voting rights before including it."}
                    ],
                    "correct_answer": "A",
                    "explanation": "Option A is correct. Under s.338 of the Companies Act 2006, members representing 5% of the voting rights can require the company to give notice of a resolution at a general meeting. The company must include it in the notice of the meeting. Under s.340, the costs of circulation are borne by the requisitionists unless the company resolves otherwise.\nOption B is incorrect. Shareholders have the statutory right to propose resolutions if they meet the threshold.\nOption C is incorrect. The company has no discretion to refuse based on the merits of the resolution if the procedural requirements are met.\nOption D is incorrect. The company can charge the requisitionists for the costs of circulation.\nOption E is incorrect. The threshold is 5%, not 25%.",
                    "difficulty": "medium"
                },
                {
                    "id": 19,
                    "title": "",
                    "text": """"Timperley Ltd" is a private company. Its directors are considering making a loan to a director, Uzma, to help her with temporary personal financial difficulties. The company's articles are silent on this matter.\nWhich of the following is true regarding such a loan?""",
                    "options": [
                        {"label": "A", "text": "It is absolutely prohibited under the Companies Act 2006."},
                        {"label": "B", "text": "It is permissible if approved by an ordinary resolution of the shareholders."},
                        {"label": "C", "text": "It is permissible if approved by the board of directors, provided Uzma declares her interest."},
                        {"label": "D", "text": "It is permissible only if the company is a money-lending company in the ordinary course of its business."},
                        {"label": "E", "text": "It is permissible if the value of the loan does not exceed £10,000."}
                    ],
                    "correct_answer": "B",
                    "explanation": "Option B is correct. S.197 of the Companies Act 2006 prohibits loans to directors unless they are approved by a resolution of the members (shareholders). Board approval is insufficient.\nOption A is incorrect. It is not absolutely prohibited; member approval makes it lawful.\nOption C is incorrect. Board approval is insufficient for a loan to a director.\nOption D is incorrect. This is an exception under s.209 for quasi-loans and credit transactions, but for a straightforward loan, member approval is the primary route.\nOption E is incorrect. There is no de minimis threshold for loans to directors; member approval is required regardless of amount.",
                    "difficulty": "medium"
                },
                {
                    "id": 20,
                    "title": "",
                    "text": """"Uppermill Ltd" has three shareholders in a quasi-partnership: Vikram (40%), Will (40%), and Yasmine (20%). All three are directors. Deadlock arises, and Vikram and Will pass a board resolution to exclude Yasmine from management and the company premises. Yasmine remains a shareholder.\nWhat is Yasmine's most appropriate legal remedy?""",
                    "options": [
                        {"label": "A", "text": "Derivative claim for breach of director's duties by Vikram and Will."},
                        {"label": "B", "text": "Petition for the company to be wound up on the just and equitable ground."},
                        {"label": "C", "text": "Petition for relief on the grounds of unfairly prejudicial conduct."},
                        {"label": "D", "text": "Action for wrongful dismissal from her directorship."},
                        {"label": "E", "text": "Requisition a general meeting to remove Vikram and Will as directors."}
                    ],
                    "correct_answer": "C",
                    "explanation": "Option C is correct. In a quasi-partnership, exclusion from management in which a shareholder had a legitimate expectation to participate is the paradigm case of unfairly prejudicial conduct under s.994. This is the standard and most appropriate remedy, typically leading to a court order for the other shareholders to buy her shares.\nOption A is incorrect. While breaches of duty may have occurred, a derivative claim is for wrongs to the company. The wrong here is to Yasmine as a member, making s.994 the direct remedy.\nOption B is incorrect. Winding up is a remedy of last resort (\"just and equitable\") and is more drastic. A buy-out order under s.996 is the usual remedy for this kind of prejudice.\nOption D is incorrect. This might be a separate claim, but it does not address the core issue of her rights as a member.\nOption E is unlikely to succeed as Vikram and Will control 80% of the votes.",
                    "difficulty": "medium"
                }
            ]
            print("-> Patched Business Law Section E with 20 new questions")
            
            # =====================================================
            # Patch Business Law Section F - Partnership decision-making and authority of partners
            # =====================================================
            area_f = next((a for a in bl_topic["areas"] if a["letter"] == "F"), None)
            if area_f:
                area_f["name"] = "Partnership decision-making and authority of partners"
                area_f["slug"] = "f-partnership-decision-making-and-authority"
                area_f["question_count"] = 20
            else:
                area_f = {
                    "letter": "F",
                    "name": "Partnership decision-making and authority of partners",
                    "slug": "f-partnership-decision-making-and-authority",
                    "question_count": 20,
                    "questions": []
                }
                bl_topic["areas"].insert(5, area_f)
            
            area_f["questions"] = [
                {
                    "id": 1,
                    "title": "",
                    "text": """James and Sarah are in a general partnership running a hardware store under the Partnership Act 1890, with no written agreement. James, without consulting Sarah, enters into a contract with a supplier to purchase a large quantity of expensive power tools on credit for the shop. Sarah believes this is an excessive commitment and objects.\nUnder the Partnership Act 1890, is the partnership bound by this contract?""",
                    "options": [
                        {"label": "A", "text": "No, because James had no actual authority from Sarah, and major purchases require the consent of all partners."},
                        {"label": "B", "text": "Yes, because every partner is an agent of the firm and James had implied authority to buy stock for the business in the usual way."},
                        {"label": "C", "text": "No, because the contract was for credit, and partners only have implied authority to buy for cash unless otherwise agreed."},
                        {"label": "D", "text": "Yes, but only if the supplier can prove that Sarah had given James express authority for this specific transaction."},
                        {"label": "E", "text": "No, because the power tools are not 'ordinary' stock for a hardware store and therefore outside the usual course of business."}
                    ],
                    "correct_answer": "B",
                    "explanation": "Option B is correct. Section 5 of the Partnership Act 1890 states that every partner is an agent of the firm for the purpose of the business. Purchasing stock for resale is within the ordinary course of a retail hardware business, giving James implied authority to bind the firm.\nOption A is incorrect. The default rule is that a partner's act in the usual course of business binds the firm, even without the consent of other partners. Unanimous consent is only required for acts outside the ordinary course.\nOption C is incorrect. There is no default rule in the 1890 Act that implied authority is restricted to cash purchases; buying on credit for a trading business is typically within the usual course.\nOption D is incorrect. The firm is bound by the partner's implied authority; the supplier does not need to prove express authority from the other partner.\nOption E is incorrect. Power tools are commonly sold in hardware stores, making their purchase within the usual course of business.",
                    "difficulty": "medium"
                },
                {
                    "id": 2,
                    "title": "",
                    "text": """Michael, Chloe, and David are partners in a firm of architects. Their written partnership agreement states: "No single partner shall enter into any contract exceeding £20,000 in value without the prior written consent of all other partners." Michael, in the firm's name, signs a contract with a client for a £35,000 project without consulting Chloe or David. The client was unaware of the restriction in the agreement.\nIs the partnership bound to the £35,000 contract?""",
                    "options": [
                        {"label": "A", "text": "No, because the partnership agreement expressly prohibited Michael from entering into such a contract."},
                        {"label": "B", "text": "Yes, because the client dealt with Michael in good faith and had no notice of the internal restriction, so the firm is bound under the principle of apparent authority."},
                        {"label": "C", "text": "No, because Michael acted fraudulently and in breach of his fiduciary duty, which negates his authority."},
                        {"label": "D", "text": "Yes, but only if Chloe and David later ratify the contract after discovering it."},
                        {"label": "E", "text": "No, because the contract is for professional services, not the sale of goods, and different rules apply."}
                    ],
                    "correct_answer": "B",
                    "explanation": "Option B is correct. Under s.8 of the Partnership Act 1890, an act relating to the business which is done in the firm's name by a partner is binding if it falls within his apparent authority. Internal restrictions (like those in a partnership agreement) do not affect third parties who have no knowledge of them.\nOption A is incorrect. The agreement governs relations between partners but does not automatically invalidate transactions with third parties unaware of the restriction.\nOption C is incorrect. While Michael may be in breach of duty to his partners, this does not automatically void the contract with an innocent third party.\nOption D is incorrect. Ratification is one way to bind the firm, but the firm is bound from the outset due to Michael's apparent authority.\nOption E is incorrect. The Partnership Act 1890 applies to all types of business, including professional partnerships.",
                    "difficulty": "medium"
                },
                {
                    "id": 3,
                    "title": "",
                    "text": """Thomas and Emily are partners in a bakery. Their partnership is governed by the default rules of the Partnership Act 1890, with no written agreement. Thomas wants to hire his niece, Grace, as a full-time shop assistant. Emily strongly objects, believing Grace is not suitable.\nCan Thomas hire his niece?""",
                    "options": [
                        {"label": "A", "text": "Yes, as hiring staff for the shop is within the implied authority of a partner in a trading partnership."},
                        {"label": "B", "text": "No, because the admission of a new employee requires the unanimous consent of all partners under the 1890 Act."},
                        {"label": "C", "text": "Yes, but only if Thomas pays Grace's salary from his personal funds, not from partnership assets."},
                        {"label": "D", "text": "No, because hiring a relative creates a conflict of interest which is automatically prohibited."},
                        {"label": "E", "text": "Yes, but Emily can apply to court to have the hiring set aside as unfairly prejudicial."}
                    ],
                    "correct_answer": "A",
                    "explanation": "Option A is correct. Hiring shop staff is an ordinary matter connected with the day-to-day running of a retail bakery. Under the default rules, a partner has implied authority to perform such acts, which bind the firm, even if another partner disagrees.\nOption B is incorrect. Unanimity is required for matters outside the ordinary course of business (s.24(8)). Hiring shop staff is an ordinary matter.\nOption C is incorrect. If Thomas hires her as a shop assistant for the firm, it is a firm liability. He cannot unilaterally decide to pay from personal funds to circumvent partnership authority.\nOption D is incorrect. While it may be a conflict requiring disclosure, it is not automatically prohibited. The primary issue is one of authority.\nOption E is incorrect. The concept of \"unfairly prejudicial\" conduct is a statutory remedy for company shareholders, not partners under the 1890 Act.",
                    "difficulty": "medium"
                },
                {
                    "id": 4,
                    "title": "",
                    "text": """Daniel, Olivia, and Ben are partners in a partnership running a café. They have a written partnership agreement which states: "All decisions regarding the renovation or refurbishment of the café premises must be made by a majority of partners." Daniel and Olivia vote to spend £15,000 on a full refurbishment. Ben votes against.\nWhich of the following best describes the legal position?""",
                    "options": [
                        {"label": "A", "text": "The decision is invalid because substantial capital expenditures require the unanimous consent of all partners."},
                        {"label": "B", "text": "The decision is valid and binding on Ben, as the partnership agreement expressly provides for majority decision-making on this issue."},
                        {"label": "C", "text": "The decision is valid, but Ben is not personally liable for any losses arising from the refurbishment if it proves unprofitable."},
                        {"label": "D", "text": "The decision is invalid because it alters the nature of the partnership business, which requires unanimity under the 1890 Act."},
                        {"label": "E", "text": "The decision is valid only if Daniel and Olivia provide a personal guarantee for the loan needed to fund the refurbishment."}
                    ],
                    "correct_answer": "B",
                    "explanation": "Option B is correct. The Partnership Act 1890 rules are default provisions. Partners are free to modify them by agreement. Here, the written agreement specifically provides that refurbishment decisions are made by majority, so Daniel and Olivia's vote binds the firm.\nOption A is incorrect. The default rule in s.24(8) requires unanimity for changes to the nature of the business, but the partners have contracted out of this default by agreeing to a majority rule for refurbishment.\nOption C is incorrect. All partners are jointly liable for the firm's debts incurred in the course of business, including those authorised by a majority under the agreement.\nOption D is incorrect. A refurbishment, while significant, is unlikely to amount to a change in the nature of the business (from a café to something else). The agreement specifically covers this scenario.\nOption E is incorrect. There is no such requirement; the firm is liable.",
                    "difficulty": "medium"
                },
                {
                    "id": 5,
                    "title": "",
                    "text": """Sophie and Luke are partners in a garden landscaping business with no written agreement. Without telling Luke, Sophie uses the partnership van as security for a £5,000 personal loan from a friend, Henry. She signs a document pledging the van 'on behalf of the partnership'. Henry is unaware she is acting for personal reasons.\nWhat is the status of the security granted to Henry?""",
                    "options": [
                        {"label": "A", "text": "It is valid, as Sophie had apparent authority to deal with partnership assets in the ordinary course."},
                        {"label": "B", "text": "It is void, because a partner has no authority to pledge partnership property for a private debt."},
                        {"label": "C", "text": "It is voidable at Luke's option, because Sophie breached her fiduciary duty."},
                        {"label": "D", "text": "It is valid only if the loan money is paid into the partnership bank account."},
                        {"label": "E", "text": "It is valid, but Sophie must indemnify Luke for any loss if the van is seized."}
                    ],
                    "correct_answer": "B",
                    "explanation": "Option B is correct. Under the Partnership Act 1890, a partner's implied authority does not extend to using partnership property as security for their own personal debt. This is not an act for carrying on the business in the usual way. Henry cannot rely on apparent authority for this non-business purpose.\nOption A is incorrect. Apparent authority only covers acts in the ordinary course of the firm's business. Pledging a business asset for a personal loan is not within the ordinary course.\nOption C is incorrect. The transaction is likely void ab initio against the firm, not merely voidable, as it was outside the scope of Sophie's authority altogether.\nOption D is incorrect. The purpose of the loan (personal) makes the act unauthorised regardless of where the money goes.\nOption E is incorrect. The security is not valid against the firm. Sophie may have to indemnify Luke, but that is a separate internal matter.",
                    "difficulty": "medium"
                },
                {
                    "id": 6,
                    "title": "",
                    "text": """Jessica and Robert are partners in a bookshop under the Partnership Act 1890 with no written agreement. Jessica decides, without consulting Robert, to open a second bookshop in a neighbouring town, signing a two-year lease in the firm's name.\nIs the partnership bound by this lease?""",
                    "options": [
                        {"label": "A", "text": "Yes, because expanding the business is within the implied authority of a partner in a trading firm."},
                        {"label": "B", "text": "No, because opening a new branch fundamentally changes the scope of the partnership business which requires unanimous consent."},
                        {"label": "C", "text": "Yes, but only if the new shop is profitable in its first year of trading."},
                        {"label": "D", "text": "No, because a lease is a contract concerning land, and partners have no implied authority to bind the firm to interests in land."},
                        {"label": "E", "text": "Yes, but Robert can dissolve the partnership immediately if he does not approve."}
                    ],
                    "correct_answer": "B",
                    "explanation": "Option B is correct. Under s.24(8) of the Partnership Act 1890, unanimous consent is required for any act which would make it impossible to carry on the ordinary business of the partnership. Committing to a two-year lease for a new branch is a major expansion altering the scope and risk of the firm, requiring consent of all partners.\nOption A is incorrect. While buying stock is ordinary, a major expansion like opening a new premises is not considered a day-to-day trading decision.\nOption C is incorrect. The binding nature of the contract is determined at the time of entry, not by subsequent profitability.\nOption D is incorrect. Partners can have authority to deal with land if it is in the ordinary course (e.g., a shopkeeper might have authority to rent a storage unit). The issue is the scale and nature of this commitment, not the subject matter itself.\nOption E is incorrect. Robert may have grounds to seek dissolution, but that does not determine whether the firm is bound by the lease (it is not).",
                    "difficulty": "medium"
                },
                {
                    "id": 7,
                    "title": "",
                    "text": """A written partnership agreement between Adam, Brian, and Charles for a marketing agency contains the following clause: "The partnership capital shall be as follows: Adam £50,000, Brian £30,000, Charles £20,000. Profits and losses shall be shared in the same proportion as capital contributions." The partnership makes a loss of £10,000 in its first year.\nHow is this loss to be borne?""",
                    "options": [
                        {"label": "A", "text": "Equally between Adam, Brian, and Charles, as the Partnership Act 1890 prescribes equal sharing in the absence of agreement."},
                        {"label": "B", "text": "In proportion to capital contributions: Adam £5,000, Brian £3,000, Charles £2,000, as per the express agreement."},
                        {"label": "C", "text": "It is borne solely by Adam, as the partner with the largest capital contribution and therefore the greatest risk."},
                        {"label": "D", "text": "It is carried forward to the next year and set against future profits before any distribution is made."},
                        {"label": "E", "text": "It is borne by the partners in proportion to their drawings during the year."}
                    ],
                    "correct_answer": "B",
                    "explanation": "Option B is correct. The partners have expressly contracted out of the default equal-sharing rule in s.24(1) of the Partnership Act 1890. Their agreement clearly links profit and loss sharing to capital proportions.\nOption A is incorrect. The default rule of equal sharing only applies in the absence of agreement to the contrary. Here, there is a clear written agreement.\nOption C is incorrect. The agreement specifies sharing in proportion to capital, not that the largest contributor bears all losses.\nOption D is incorrect. While losses may be carried forward for accounting purposes, the question asks how the loss is borne (i.e., allocated) between partners, which is determined by the agreement.\nOption E is incorrect. The agreement makes no mention of drawings affecting loss sharing.",
                    "difficulty": "medium"
                },
                {
                    "id": 8,
                    "title": "",
                    "text": """Elena and Mark are partners in a dental practice. Their partnership agreement is silent on decision-making procedures. Elena wishes to purchase a new, very expensive digital X-ray machine for the practice. Mark refuses, believing the current equipment is adequate.\nCan Elena proceed with the purchase?""",
                    "options": [
                        {"label": "A", "text": "Yes, because purchasing medical equipment is within the implied authority of a partner in a professional practice."},
                        {"label": "B", "text": "No, because the purchase of a major capital asset is outside the ordinary course of business and requires Mark's consent."},
                        {"label": "C", "text": "Yes, but only if she funds the purchase entirely from her personal savings."},
                        {"label": "D", "text": "No, because partnerships can only purchase assets for cash, and such a large purchase would require financing which needs unanimous consent."},
                        {"label": "E", "text": "Yes, because a majority decision is sufficient for any partnership decision where the agreement is silent."}
                    ],
                    "correct_answer": "B",
                    "explanation": "Option B is correct. Under the default rules of the Partnership Act 1890, a partner's implied authority covers acts in the ordinary course of business. Purchasing a major, expensive piece of capital equipment is not an ordinary, day-to-day decision for a dental practice; it is a substantial commitment that changes the financial structure of the firm. Such an act likely falls under s.24(8), requiring unanimous consent.\nOption A is incorrect. While buying standard supplies is ordinary, a major capital expenditure on specialised equipment is not.\nOption C is incorrect. If she purchased it personally, it would be her property, not the firm's. The question implies she wishes the firm to purchase it.\nOption D is incorrect. The barrier is the nature of the act (major capital expenditure), not the method of payment.\nOption E is incorrect. The default position is that ordinary matters can be decided by any partner, but non-ordinary matters require unanimity. There is no default simple majority rule.",
                    "difficulty": "medium"
                },
                {
                    "id": 9,
                    "title": "",
                    "text": """A partnership agreement for a firm of three solicitors, Fiona, George, and Harry, includes an expulsion clause: "A partner may be expelled by a resolution of the other partners if they are guilty of conduct likely to have a serious detrimental effect on the partnership business." Fiona and George believe Harry has been negligent in his handling of several client matters, damaging the firm's reputation. They pass a resolution expelling him. Harry denies the allegations.\nWhich of the following is the most accurate statement regarding this expulsion?""",
                    "options": [
                        {"label": "A", "text": "The expulsion is effective immediately, as the agreement grants the power and the other partners have exercised it in good faith."},
                        {"label": "B", "text": "The expulsion is invalid because the Partnership Act 1890 does not permit expulsion clauses; a partner can only leave voluntarily or by court order."},
                        {"label": "C", "text": "The expulsion is invalid unless the agreement provides for expulsion by a unanimous vote of the other partners."},
                        {"label": "D", "text": "The expulsion is likely invalid unless Harry is given a fair opportunity to answer the allegations against him."},
                        {"label": "E", "text": "The expulsion is valid, but Harry is entitled to be paid out his capital account balance plus a share of goodwill, as determined by an independent valuer."}
                    ],
                    "correct_answer": "D",
                    "explanation": "Option D is correct. While partnership agreements can include expulsion clauses, the courts insist that such a power, being a drastic one, must be exercised in strict compliance with the clause and in accordance with natural justice (including the right to be heard). A failure to give Harry a fair opportunity to defend himself would likely render the expulsion invalid.\nOption A is incorrect. The power must be exercised fairly and in accordance with the implied terms of good faith and natural justice.\nOption B is incorrect. The Partnership Act 1890 is silent on expulsion, meaning partners are free to include such clauses in their agreement.\nOption C is incorrect. The agreement specifies \"a resolution of the other partners,\" which implies a majority of Fiona and George. Unanimity is not required by law unless the agreement says so.\nOption E is incorrect. While Harry may be entitled to a payout if expelled, the validity of the expulsion itself is the primary issue.",
                    "difficulty": "medium"
                },
                {
                    "id": 10,
                    "title": "",
                    "text": """Peter and Rachel are partners in a car repair garage with no written agreement. Peter accepts a customer's luxury car for a complex engine repair, quoting a price of £8,000. Rachel, who specialises in bodywork, was not consulted. The repair goes wrong, causing significant further damage to the car. The customer sues the partnership.\nIs the partnership liable for the customer's loss?""",
                    "options": [
                        {"label": "A", "text": "No, because Peter acted outside his ordinary authority by accepting such a complex and expensive job without Rachel's skill or consent."},
                        {"label": "B", "text": "Yes, because Peter, as a partner, had apparent authority to accept repair work for the garage."},
                        {"label": "C", "text": "No, because liability in a partnership is several, not joint, so only Peter is personally liable for his own negligent work."},
                        {"label": "D", "text": "Yes, but only up to the value of the partnership assets; Peter alone is personally liable for any excess."},
                        {"label": "E", "text": "No, unless Rachel personally participated in or supervised the failed repair work."}
                    ],
                    "correct_answer": "B",
                    "explanation": "Option B is correct. Accepting cars for repair is the core business of the garage. Peter had apparent authority to bind the firm in such contracts. Under s.10 of the Partnership Act 1890, the firm is liable for the wrongful acts of a partner acting in the ordinary course of business.\nOption A is incorrect. Accepting repair work, even complex jobs, is within the ordinary business of a garage. The default rule does not require consent of other partners for such core trading acts.\nOption C is incorrect. Under s.9-12, partners are jointly liable for partnership debts and obligations arising from wrongful acts in the course of business.\nOption D is incorrect. Partners are jointly and severally liable; the customer can sue any or all partners for the full amount.\nOption E is incorrect. Rachel's liability arises from her status as a partner, not from personal involvement in the tort.",
                    "difficulty": "medium"
                },
                {
                    "id": 11,
                    "title": "",
                    "text": """A written partnership agreement for "Consultancy Partners" states: "No partner shall have the authority to borrow money in the name of the firm." Simon, a partner, needing to cover a temporary cash flow shortfall, borrows £20,000 from a local bank in the firm's name. The bank was not shown the partnership agreement.\nIs the partnership liable to repay the bank loan?""",
                    "options": [
                        {"label": "A", "text": "No, because the partnership agreement expressly removed Simon's authority to borrow, making his act ultra vires the firm."},
                        {"label": "B", "text": "Yes, because the bank, having no notice of the restriction, can rely on Simon's apparent authority as a partner to borrow for business purposes."},
                        {"label": "C", "text": "No, because borrowing money is not in the ordinary course of a consultancy business and therefore never within implied authority."},
                        {"label": "D", "text": "Yes, but only if the other partners ratify the loan upon discovering it."},
                        {"label": "E", "text": "No, because the loan was for the firm's benefit, not Simon's personal benefit."}
                    ],
                    "correct_answer": "B",
                    "explanation": "Option B is correct. This is a classic application of s.8 of the Partnership Act 1890. Borrowing money is typically within the implied authority of a partner in a trading partnership. An internal restriction in the partnership agreement is not binding on a third party (the bank) without notice.\nOption A is incorrect. The concept of ultra vires applies to companies, not partnerships. The issue is one of actual vs. apparent authority.\nOption C is incorrect. Borrowing to cover cash flow is often within the ordinary course of many businesses, including consultancies. Even if it were not, the bank may still rely on apparent authority.\nOption D is incorrect. Ratification is not necessary; the firm is bound from the outset due to apparent authority.\nOption E is incorrect. The purpose (firm's benefit) supports the finding of apparent authority, but is not the decisive factor.",
                    "difficulty": "medium"
                },
                {
                    "id": 12,
                    "title": "",
                    "text": """Laura and Nicholas are partners in a delicatessen. Their partnership agreement states that all decisions must be unanimous. Laura, while Nicholas is on holiday, signs a one-year contract with a new cheese supplier to ensure stock continuity. Nicholas dislikes the new supplier upon his return.\nWhat is the legal position regarding this contract?""",
                    "options": [
                        {"label": "A", "text": "The contract is binding on the partnership because Laura had apparent authority to buy stock in the ordinary course."},
                        {"label": "B", "text": "The contract is not binding on Nicholas because the partnership agreement required unanimity, which was not obtained."},
                        {"label": "C", "text": "The contract is binding on the partnership because Nicholas's holiday constituted implied consent to Laura making necessary decisions."},
                        {"label": "D", "text": "The contract is voidable at Nicholas's option because Laura breached the partnership agreement."},
                        {"label": "E", "text": "The contract is binding only if the new supplier can prove they were unaware of the unanimity clause."}
                    ],
                    "correct_answer": "A",
                    "explanation": "Option A is correct. Buying stock from a supplier is within the ordinary course of a retail business. The internal unanimity clause does not affect a third party (the supplier) who has no notice of it. Laura had apparent authority, so the firm is bound.\nOption B is incorrect. The agreement governs relations between Laura and Nicholas. Nicholas may have a claim against Laura for breach of agreement, but the contract with the supplier is valid.\nOption C is incorrect. There is no doctrine of \"implied consent due to holiday\" that overrides a written agreement between partners. The binding nature stems from apparent authority vis-à-vis the third party.\nOption D is incorrect. The contract is not voidable against the supplier; it is fully binding on the firm.\nOption E is incorrect. The supplier's lack of notice is precisely why the firm is bound, but it is not a condition that needs to be proven in this scenario; it is presumed unless the firm can show the supplier had notice.",
                    "difficulty": "medium"
                },
                {
                    "id": 13,
                    "title": "",
                    "text": """Anthony and Zoe are partners in a florist shop under the Partnership Act 1890 with no written agreement. Anthony wishes to retire. Zoe wants to continue the business. They agree Anthony will leave and Zoe will pay him his capital contribution over six months.\nWhat is the minimum requirement for this retirement to be effective against future creditors of the old firm?""",
                    "options": [
                        {"label": "A", "text": "A written and signed agreement between Anthony and Zoe stating he has retired."},
                        {"label": "B", "text": "A notice of the retirement must be placed in the London Gazette."},
                        {"label": "C", "text": "Notification must be given to all existing creditors of the partnership."},
                        {"label": "D", "text": "No formalities are required; the private agreement between them is sufficient."},
                        {"label": "E", "text": "The retirement must be advertised in a local newspaper circulating in the area where the business is carried on."}
                    ],
                    "correct_answer": "B",
                    "explanation": "Option B is correct. Under s.36 of the Partnership Act 1890, a partner who retires does not cease to be liable for partnership debts incurred before their retirement. However, they may be discharged from liability for future debts by an agreement with the continuing partners and the creditors themselves. Failing that, a public notice in the London Gazette is effective to discharge the retiring partner from future debts to persons who had no prior dealings with the firm.\nOption A is incorrect. A private agreement does not protect Anthony from future creditors.\nOption C is incorrect. Notification to existing creditors is advisable and may discharge liability to them, but it does not protect against new creditors.\nOption D is incorrect. Private agreement is insufficient for protection against future creditors.\nOption E is incorrect. The statutory requirement is for notice in the London Gazette, not a local paper.",
                    "difficulty": "medium"
                },
                {
                    "id": 14,
                    "title": "",
                    "text": """A partnership agreement for a firm of accountants, Paul, Richard, and Stella, includes a clause: "No partner shall, without consent of the others, engage in any other business during the term of this partnership." Stella starts a separate, unrelated online tutoring business in the evenings. Paul and Richard object.\nWhich of the following is the most accurate statement of the law?""",
                    "options": [
                        {"label": "A", "text": "Stella is in clear breach of the agreement, and Paul and Richard can seek an injunction to restrain her."},
                        {"label": "B", "text": "Stella is not in breach because her tutoring business is unrelated and does not compete with the accounting firm."},
                        {"label": "C", "text": "Stella is in breach only if her tutoring business becomes more profitable than her partnership work."},
                        {"label": "D", "text": "Stella is in breach, but the only remedy for Paul and Richard is to dissolve the partnership."},
                        {"label": "E", "text": "The clause is unenforceable as an unreasonable restraint of trade."}
                    ],
                    "correct_answer": "A",
                    "explanation": "Option A is correct. The clause is a common type of partnership clause restricting other business engagements. It is a legitimate term to protect the partnership from divided loyalty and effort. Breach of such a clause is a clear wrong, and the other partners can seek an injunction to prevent the breach.\nOption B is incorrect. The clause is absolute (\"any other business\"), not restricted to competing businesses.\nOption C is incorrect. The breach occurs upon engaging in the other business, regardless of its profitability.\nOption D is incorrect. An injunction is a primary remedy for breach of a negative covenant. Dissolution is a more drastic alternative.\nOption E is incorrect. Such clauses in partnership agreements, being between partners, are generally upheld as reasonable to protect the mutual commitment of the partners.",
                    "difficulty": "medium"
                },
                {
                    "id": 15,
                    "title": "",
                    "text": """Benjamin and Katherine are partners in a bakery with no written agreement. Benjamin holds himself out as the "Managing Partner" on the shop signage and stationery. He enters into a contract to cater a large wedding for £5,000. The wedding client had never dealt with the bakery before. Katherine was unaware of the contract.\nIs the partnership bound?""",
                    "options": [
                        {"label": "A", "text": "No, because catering for weddings is not in the ordinary course of a bakery's business."},
                        {"label": "B", "text": "Yes, because Benjamin held himself out as the managing partner, giving him enhanced apparent authority in the eyes of a new customer."},
                        {"label": "C", "text": "No, because the value of the contract is large and therefore outside the scope of implied authority."},
                        {"label": "D", "text": "Yes, but only if the bakery had previously done some catering work."},
                        {"label": "E", "text": "No, because Katherine did not consent."}
                    ],
                    "correct_answer": "A",
                    "explanation": "Option A is correct. The implied authority of a partner is limited to acts in the ordinary course of that type of business. For a retail bakery, selling goods over the counter is ordinary. Taking on a large, one-off catering contract is a different type of venture, likely outside the ordinary course. The client, as a new customer, cannot assume it is ordinary.\nOption B is incorrect. The title \"Managing Partner\" does not, by itself, extend the scope of ordinary business. Apparent authority is based on the usual business of a bakery.\nOption C is incorrect. While value can be a factor, the primary issue is the nature of the act (catering vs. retail).\nOption D is incorrect. If the firm had a history of catering, it might be considered ordinary. The question states the client was new and implies no such history.\nOption E is incorrect. Lack of consent from another partner is not determinative; the issue is whether the act was within the ordinary course.",
                    "difficulty": "medium"
                },
                {
                    "id": 16,
                    "title": "",
                    "text": """Olivia and Sebastian are partners in a graphic design firm. Their written agreement states profits are shared 60:40. It is silent on losses. The firm incurs a significant loss due to a bad debt from a client who went bankrupt.\nHow is this loss to be shared?""",
                    "options": [
                        {"label": "A", "text": "In the same proportion as profits, i.e., 60:40."},
                        {"label": "B", "text": "Equally."},
                        {"label": "C", "text": "It is borne solely by Olivia."},
                        {"label": "D", "text": "In proportion to the partners' capital contributions, which is the default rule under the Act."},
                        {"label": "E", "text": "The loss remains a firm loss and is carried forward; it is not allocated to individual partners until dissolution."}
                    ],
                    "correct_answer": "B",
                    "explanation": "Option B is correct. Section 24(1) of the Partnership Act 1890 provides that, subject to any agreement, partners share capital, profits, and losses equally. An agreement on profit-sharing is not automatically an agreement on loss-sharing. Since the agreement is silent on losses, the default equal sharing rule applies.\nOption A is incorrect. The courts have held that a profit-sharing ratio does not necessarily imply an identical loss-sharing ratio unless the agreement clearly states so.\nOption C is incorrect. There is no such rule.\nOption D is incorrect. The default rule for loss sharing is equal, not in proportion to capital.\nOption E is incorrect. For accounting and liability purposes, losses are allocated to partners' capital accounts.",
                    "difficulty": "medium"
                },
                {
                    "id": 17,
                    "title": "",
                    "text": """Henry and Isabella are partners in a bookmaking business (taking bets on sports). Henry, without Isabella's knowledge, accepts a very large bet from a customer which the firm cannot cover if it loses. The bet loses, and the customer demands payment.\nIs the partnership liable to pay the customer?""",
                    "options": [
                        {"label": "A", "text": "No, because accepting a bet of such size was reckless and outside the ordinary course of prudent business."},
                        {"label": "B", "text": "Yes, because accepting bets is the ordinary business of the firm, and Henry had apparent authority to do so."},
                        {"label": "C", "text": "No, because gambling contracts are void and unenforceable under the Gambling Act 2005."},
                        {"label": "D", "text": "Yes, but Isabella can sue Henry for an indemnity for the full amount."},
                        {"label": "E", "text": "No, because the customer should have known that such a large bet required approval from both partners."}
                    ],
                    "correct_answer": "B",
                    "explanation": "Option B is correct. The business is bookmaking. Accepting bets is its ordinary business. A partner has apparent authority to conduct that business. The size of the bet, while imprudent, does not necessarily take it outside the ordinary course of that specific business. The firm is bound.\nOption A is incorrect. While imprudent, the act is of the type the firm exists to perform. The question of ordinary course is judged by the nature of the business, not the prudence of a single act.\nOption C is incorrect. The Gambling Act 2005 made gambling contracts enforceable, not void. This does not assist the firm in denying liability.\nOption D is correct in that Isabella can seek indemnity, but it does not answer the question of firm liability. The customer can sue the firm.\nOption E is incorrect. There is no such general notice requirement on customers.",
                    "difficulty": "medium"
                },
                {
                    "id": 18,
                    "title": "",
                    "text": """A partnership agreement for "Technical Solutions" includes a clause: "Any differences arising as to ordinary matters connected with the partnership business shall be decided by a majority of the partners." There are four partners. On a vote to purchase new office software, the vote is 2 in favour, 1 against, and 1 abstention.\nWhat is the outcome?""",
                    "options": [
                        {"label": "A", "text": "The motion is passed, as a majority of those voting is in favour."},
                        {"label": "B", "text": "The motion is not passed, as a majority of all partners did not vote in favour."},
                        {"label": "C", "text": "The motion is not passed, because the abstention counts as a vote against."},
                        {"label": "D", "text": "The motion is passed, because the clause refers to a majority of partners, and 2 is a majority of 4."},
                        {"label": "E", "text": "The matter must be referred to arbitration as the vote was inconclusive."}
                    ],
                    "correct_answer": "B",
                    "explanation": "Option B is correct. In partnership law, unless the agreement specifies otherwise, a \"majority of the partners\" means a majority in number of all the partners (s.24(8) uses this phrasing). With 4 partners, a majority is 3. An abstention is not a vote in favour.\nOption A is incorrect. The clause does not say \"a majority of those voting.\"\nOption C is incorrect. An abstention is not typically counted as a vote against; it is simply not a vote in favour.\nOption D is incorrect. 2 is not a majority of 4; a majority means more than half.\nOption E is incorrect. The vote has a clear outcome: it failed to achieve the required majority.",
                    "difficulty": "medium"
                },
                {
                    "id": 19,
                    "title": "",
                    "text": """Christopher and Maria are partners in a restaurant. They have no written agreement. Christopher wants to introduce his son, Alex, as a new partner. Maria refuses.\nCan Christopher introduce Alex as a partner?""",
                    "options": [
                        {"label": "A", "text": "Yes, because a partner has implied authority to manage the staff and hiring, which includes admitting new partners."},
                        {"label": "B", "text": "No, because the introduction of a new partner requires the unanimous consent of all existing partners."},
                        {"label": "C", "text": "Yes, but Alex's share of profits must come solely from Christopher's existing share."},
                        {"label": "D", "text": "No, unless the partnership agreement expressly permits the introduction of family members."},
                        {"label": "E", "text": "Yes, provided Alex contributes significant capital to the business."}
                    ],
                    "correct_answer": "B",
                    "explanation": "Option B is correct. Under s.24(7) of the Partnership Act 1890, \"no person may be introduced as a partner without the consent of all existing partners.\" This is a fundamental default rule.\nOption A is incorrect. Admitting a partner is fundamentally different from hiring an employee; it alters the mutual agency and financial liability of the firm.\nOption C is incorrect. Even if profit shares were rearranged, the admission itself requires consent.\nOption D is incorrect. The default rule in the 1890 Act requires unanimity. An agreement could modify this, but here there is no agreement.\nOption E is incorrect. The requirement for unanimous consent is not overridden by a capital contribution.",
                    "difficulty": "medium"
                },
                {
                    "id": 20,
                    "title": "",
                    "text": """Daniel and Emma are partners in a health food shop. Their partnership agreement states that the partnership shall continue for a fixed term of five years. In year three, a serious disagreement arises. Daniel serves notice on Emma that he is exercising his right to dissolve the partnership.\nCan Daniel dissolve the partnership unilaterally?""",
                    "options": [
                        {"label": "A", "text": "No, because the partnership is for a fixed term, and neither partner can dissolve it before the expiry of that term without consent or a court order."},
                        {"label": "B", "text": "Yes, because any partner has the right to dissolve the partnership at any time by giving notice under s.26 of the Partnership Act 1890."},
                        {"label": "C", "text": "No, because dissolution requires a majority resolution of the partners."},
                        {"label": "D", "text": "Yes, but he will be liable to Emma for damages for breach of the partnership agreement."},
                        {"label": "E", "text": "No, unless he can prove that Emma has been guilty of conduct prejudicial to the business."}
                    ],
                    "correct_answer": "D",
                    "explanation": "Option D is correct. Under s.27 of the Partnership Act 1890, a partnership entered into for a fixed term can still be dissolved by notice if a partner chooses. However, this constitutes a breach of the partnership agreement, and the dissolving partner may be liable in damages to the other partner(s) for any loss caused by the premature dissolution.\nOption A is incorrect. S.27 allows for dissolution before the end of a fixed term.\nOption B is incorrect. S.26 applies to partnerships at will (with no fixed term). S.27 governs fixed-term partnerships.\nOption C is incorrect. Dissolution by notice is an individual right, not a majority decision.\nOption E is incorrect. A partner does not need to prove fault to dissolve a fixed-term partnership by notice, though fault would affect liability for damages.",
                    "difficulty": "medium"
                }
            ]
            print("-> Patched Business Law Section F with 20 new questions")
            
            # =====================================================
            # Patch Business Law Section G - Insolvency (corporate and personal)
            # =====================================================
            area_g = next((a for a in bl_topic["areas"] if a["letter"] == "G"), None)
            if area_g:
                area_g["name"] = "Insolvency (corporate and personal)"
                area_g["slug"] = "g-insolvency-corporate-and-personal"
                area_g["question_count"] = 20
            else:
                area_g = {
                    "letter": "G",
                    "name": "Insolvency (corporate and personal)",
                    "slug": "g-insolvency-corporate-and-personal",
                    "question_count": 20,
                    "questions": []
                }
                bl_topic["areas"].insert(6, area_g)
            
            area_g["questions"] = [
                {
                    "id": 1,
                    "title": "",
                    "text": """David is a director of "Tower Trading Ltd," which is insolvent and on the brink of collapse. One month ago, David arranged for the company to repay in full a £50,000 unsecured loan from his wife, while leaving other unsecured trade creditors unpaid. The company has now entered administration.\nWhich of the following is most likely to allow the administrator to recover this repayment from David's wife?""",
                    "options": [
                        {"label": "A", "text": "Wrongful trading."},
                        {"label": "B", "text": "A transaction at an undervalue."},
                        {"label": "C", "text": "A preference."},
                        {"label": "D", "text": "Fraudulent trading."},
                        {"label": "E", "text": "Setting aside a floating charge under s.245 of the Insolvency Act 1986."}
                    ],
                    "correct_answer": "C",
                    "explanation": "Option C is correct. A preference occurs when a company does something that puts a creditor (or surety/guarantor) into a better position in a potential insolvency than they would otherwise have been. Repaying a connected party (David's wife) shortly before insolvency, to the detriment of other creditors, is a classic example of a voidable preference under s.239.\nOption A is incorrect. Wrongful trading relates to a director continuing to trade when there was no reasonable prospect of avoiding insolvency, not to the repayment of specific debts.\nOption B is incorrect. A transaction at an undervalue involves the company receiving significantly less than the value it gives (e.g., a gift or sale at a huge discount). A repayment of a debt is for full value, not an undervalue.\nOption D is incorrect. Fraudulent trading requires an element of actual dishonesty, which is a higher threshold than preference.\nOption E is incorrect. This applies to floating charges created for past value shortly before insolvency, not to the repayment of an unsecured loan.",
                    "difficulty": "medium"
                },
                {
                    "id": 2,
                    "title": "",
                    "text": """"Birchwood Ltd" is in financial difficulty. Its directors, Emma and Frank, know the company is insolvent but continue to accept customer deposits for goods they have no realistic chance of delivering, using the money to pay pressing wage bills. The company later enters compulsory liquidation.\nWhich of the following presents the greatest personal liability risk to Emma and Frank in these circumstances?""",
                    "options": [
                        {"label": "A", "text": "Being investigated for misfeasance."},
                        {"label": "B", "text": "A declaration of wrongful trading and a contribution order."},
                        {"label": "C", "text": "A criminal prosecution for fraudulent trading."},
                        {"label": "D", "text": "Being held liable for transactions at an undervalue."},
                        {"label": "E", "text": "Disqualification from acting as a director."}
                    ],
                    "correct_answer": "C",
                    "explanation": "Option C is correct. The scenario describes taking deposits with no intent or ability to supply the goods, which is indicative of actual dishonesty. This is the hallmark of fraudulent trading, which can be both a civil matter (s.213 IA 1986) and a criminal offence (s.993 CA 2006). Criminal liability carries the greatest personal risk.\nOption A is incorrect. Misfeasance is a breach of fiduciary duty, but the conduct described goes beyond mere breach of duty into potential criminality.\nOption B is incorrect. Wrongful trading (s.214) applies where directors ought to have known there was no reasonable prospect of avoiding insolvency. It does not require dishonesty, but the deliberate acceptance of deposits in bad faith is better characterised as fraudulent.\nOption D is incorrect. Transactions at an undervalue relate to asset disposals, not taking deposits.\nOption E is incorrect. Disqualification is likely, but it is a consequence, not the primary liability with the greatest immediate risk (which is criminal prosecution).",
                    "difficulty": "medium"
                },
                {
                    "id": 3,
                    "title": "",
                    "text": """"Ashcroft Ltd" enters administration. The administrator is realising assets. The company's assets comprise: (i) £50,000 from the sale of a factory subject to a fixed charge; (ii) £30,000 from the sale of stock subject to a floating charge; (iii) £10,000 cash at bank (unsecured). The fixed charge holder is owed £60,000. The floating charge holder is owed £40,000. Preferential creditors (mainly employees) claim £8,000. The administrator's fees and expenses are £5,000.\nIn what order should these funds be distributed?""",
                    "options": [
                        {"label": "A", "text": "1. Administrator's fees; 2. Preferential creditors; 3. Fixed charge holder; 4. Floating charge holder; 5. Unsecured creditors."},
                        {"label": "B", "text": "1. Fixed charge holder; 2. Administrator's fees; 3. Preferential creditors; 4. Floating charge holder; 5. Unsecured creditors."},
                        {"label": "C", "text": "1. Administrator's fees (from all assets); 2. Fixed charge holder; 3. Preferential creditors; 4. Floating charge holder; 5. Unsecured creditors."},
                        {"label": "D", "text": "1. Preferential creditors; 2. Administrator's fees; 3. Fixed charge holder; 4. Floating charge holder; 5. Unsecured creditors."},
                        {"label": "E", "text": "1. Fixed charge holder; 2. Floating charge holder; 3. Administrator's fees; 4. Preferential creditors; 5. Unsecured creditors."}
                    ],
                    "correct_answer": "B",
                    "explanation": "Option B is correct. The fixed charge holder has first claim on the proceeds of their specific asset (£50k, leaving a £10k shortfall as an unsecured claim). Assets subject to the floating charge (£30k from stock) are distributed in the statutory order under the Insolvency Act 1986: first, the costs of the administrator (s.176ZA), then preferential creditors, then the floating charge holder. Any remaining funds (the £10k cash) are for unsecured creditors.\nOption A is incorrect because it does not segregate the fixed charge asset proceeds.\nOption C is incorrect because administrator's fees are paid first from the floating charge assets, not from all assets.\nOption D is incorrect because it misstates the priority order.\nOption E is incorrect because it places secured creditors before administration expenses, which is wrong for floating charge assets.",
                    "difficulty": "hard"
                },
                {
                    "id": 4,
                    "title": "",
                    "text": """George is an individual with significant credit card debts and an unsecured personal loan. He has a steady job but cannot meet his monthly repayments. He wants to avoid bankruptcy and have a legally binding arrangement to pay back an affordable portion of his debts over time.\nWhich procedure is most suitable for George?""",
                    "options": [
                        {"label": "A", "text": "Administration."},
                        {"label": "B", "text": "A Company Voluntary Arrangement (CVA)."},
                        {"label": "C", "text": "An Individual Voluntary Arrangement (IVA)."},
                        {"label": "D", "text": "Debt Relief Order (DRO)."},
                        {"label": "E", "text": "Compulsory Liquidation."}
                    ],
                    "correct_answer": "C",
                    "explanation": "Option C is correct. An Individual Voluntary Arrangement (IVA) is a formal agreement between an individual and their creditors, supervised by an insolvency practitioner, to pay back debts over a set period (usually 5 years). It is designed to avoid bankruptcy.\nOption A is incorrect. Administration is a corporate insolvency procedure.\nOption B is incorrect. A CVA is a procedure for companies.\nOption D is incorrect. A DRO is for individuals with low income, low assets, and debts below a specific threshold; it is not a repayment plan.\nOption E is incorrect. Compulsory liquidation is a process to wind up a company.",
                    "difficulty": "easy"
                },
                {
                    "id": 5,
                    "title": "",
                    "text": """"Denby Products Ltd" granted a floating charge to its bank, SecuredBank Ltd, on 1 March 2025 to secure an existing overdraft from the previous year. The company went into administration on 1 June 2025. The charge was registered at Companies House on 5 March 2025.\nCan the administrator seek to set aside this floating charge under s.245 of the Insolvency Act 1986?""",
                    "options": [
                        {"label": "A", "text": "No, because the charge was properly registered at Companies House."},
                        {"label": "B", "text": "Yes, because it was a floating charge created within 12 months of the onset of insolvency."},
                        {"label": "C", "text": "No, because it secured money paid before the charge was created (the existing overdraft)."},
                        {"label": "D", "text": "Yes, but only if it can be shown that the company was already insolvent when the charge was created."},
                        {"label": "E", "text": "Yes, because it was a floating charge created within 6 months of the onset of insolvency."}
                    ],
                    "correct_answer": "B",
                    "explanation": "Option B is correct. S.245 of the Insolvency Act 1986 provides that a floating charge created within 12 months of the onset of insolvency (with certain exceptions) is invalid except to the extent of new money, goods, or services provided at the time of or after the creation of the charge. The charge here was created on 1 March, and administration began on 1 June, which is within 12 months.\nOption A is incorrect. Registration is a separate requirement; it does not protect a charge from being set aside under s.245.\nOption C is incorrect. The fact it secured past debt (the existing overdraft) is precisely what makes it vulnerable under s.245, unless it falls within an exception.\nOption D is incorrect. The company's insolvency at the time of creation is a factor for the 2-year period for connected persons, but for unconnected persons (like a bank), the 12-month rule applies regardless of the company's financial state at creation.\nOption E is incorrect. The period is 12 months (or 2 years for connected persons), not 6 months.",
                    "difficulty": "medium"
                },
                {
                    "id": 6,
                    "title": "",
                    "text": """Helen is the sole director of "Kestrel Ltd." As the company nears insolvency, she transfers its main delivery van, worth £15,000, to a competing business owned by her brother for £5,000. The company enters liquidation two months later.\nWhich provision allows the liquidator to challenge this transaction?""",
                    "options": [
                        {"label": "A", "text": "Fraudulent trading."},
                        {"label": "B", "text": "Wrongful trading."},
                        {"label": "C", "text": "A transaction at an undervalue."},
                        {"label": "D", "text": "A Preference."},
                        {"label": "E", "text": "Misfeasance."}
                    ],
                    "correct_answer": "C",
                    "explanation": "Option C is correct. A transaction at an undervalue under s.238 occurs where a company makes a gift or receives 'significantly less' in money or money's worth than it provides. Selling a £15,000 van for £5,000 is a clear example.\nOption A is incorrect. Fraudulent trading involves carrying on business with intent to defraud creditors, not a specific asset transfer.\nOption B is incorrect. Wrongful trading relates to the period of trading when insolvency was inevitable.\nOption D is incorrect. A preference involves improving the position of a creditor. Here, the brother is not a creditor; he is a purchaser.\nOption E is incorrect. Misfeasance is a breach of duty, but s.238 provides a specific, powerful remedy for this type of transaction.",
                    "difficulty": "medium"
                },
                {
                    "id": 7,
                    "title": "",
                    "text": """"Lakeside Ltd" is put into compulsory liquidation by its creditors. The liquidator discovers that three months before the liquidation, the company paid its electricity bill, which was six months overdue, in full. The electricity company was an unconnected, ordinary trade creditor.\nCan the liquidator recover this payment as a preference?""",
                    "options": [
                        {"label": "A", "text": "No, because the electricity company was not connected to the directors."},
                        {"label": "B", "text": "Yes, because any payment to a creditor within 6 months of liquidation is a voidable preference."},
                        {"label": "C", "text": "No, because paying an overdue utility bill is in the ordinary course of business."},
                        {"label": "D", "text": "Yes, but only if the company was insolvent at the time of the payment and it had the effect of preferring that creditor."},
                        {"label": "E", "text": "No, because the payment was for a legitimate debt and the creditor gave no fresh value."}
                    ],
                    "correct_answer": "D",
                    "explanation": "Option D is correct. For a preference under s.239, the liquidator must show the company was influenced by a desire to put the creditor in a better position (which can be inferred in the case of a connected person, but must be proven for an unconnected person like the electricity company). The company must also have been insolvent at the time or become insolvent because of the transaction.\nOption A is incorrect. Preferences can apply to unconnected persons, but the 'desire' test is harder to prove.\nOption B is incorrect. Not every payment is a preference; the statutory conditions must be met.\nOption C is incorrect. Being in the ordinary course of business is a factor a court may consider, but it is not an absolute defence.\nOption E is incorrect. The fact it was a legitimate debt is irrelevant; the issue is whether it was a preferential payment on the eve of insolvency.",
                    "difficulty": "medium"
                },
                {
                    "id": 8,
                    "title": "",
                    "text": """Mohammed is an individual debtor. He has no realisable assets, lives in rented accommodation, and has debts of £25,000. He is unemployed and on benefits.\nWhich insolvency solution is likely to be most appropriate and accessible for him?""",
                    "options": [
                        {"label": "A", "text": "Bankruptcy."},
                        {"label": "B", "text": "An Individual Voluntary Arrangement (IVA)."},
                        {"label": "C", "text": "A Debt Relief Order (DRO)."},
                        {"label": "D", "text": "A Consolidation Loan."},
                        {"label": "E", "text": "Administration."}
                    ],
                    "correct_answer": "C",
                    "explanation": "Option C is correct. A Debt Relief Order (DRO) is designed for individuals with low income, low assets (under £2,000), debts under £30,000, and no realistic prospect of repaying them. It results in debts being discharged after one year without requiring monthly payments.\nOption A is incorrect. Bankruptcy is an option but involves higher fees and is more severe; a DRO is a simpler, cheaper alternative for those who qualify.\nOption B is incorrect. An IVA requires a regular income to make monthly payments, which Mohammed does not have.\nOption D is incorrect. A consolidation loan is not an insolvency procedure and is unlikely to be available to someone unemployed with no assets.\nOption E is incorrect. Administration is a corporate procedure.",
                    "difficulty": "easy"
                },
                {
                    "id": 9,
                    "title": "",
                    "text": """"Norton Ltd" is in administration. The administrator is considering whether to adopt a contract for the supply of services which was entered into by the company before administration. The contract is loss-making.\nWhat is the primary legal consequence if the administrator adopts this contract?""",
                    "options": [
                        {"label": "A", "text": "The administrator becomes personally liable for any debts incurred under the contract from the time of adoption onwards."},
                        {"label": "B", "text": "The costs of fulfilling the contract will rank as an expense of the administration with priority."},
                        {"label": "C", "text": "The contract is automatically terminated, and the other party can only claim damages as an unsecured creditor."},
                        {"label": "D", "text": "The company's pre-administration liabilities under the contract are paid in full immediately."},
                        {"label": "E", "text": "The administrator must obtain court approval before continuing with the contract."}
                    ],
                    "correct_answer": "B",
                    "explanation": "Option B is correct. Under para 99 of Schedule B1 to the Insolvency Act 1986, if an administrator adopts a contract, any liability incurred under it during the administration is payable as an expense of the administration, which ranks in priority to the administrator's own remuneration and floating charge holders.\nOption A is incorrect. The administrator does not incur personal liability; the liability is an expense of the administration payable from company assets.\nOption C is incorrect. Adoption means the contract continues, not that it is terminated.\nOption D is incorrect. Pre-administration liabilities remain as pre-administration unsecured claims; adoption affects liabilities incurred after adoption.\nOption E is incorrect. Court approval is not required for adoption; it is an administrative decision, though it has significant financial consequences.",
                    "difficulty": "medium"
                },
                {
                    "id": 10,
                    "title": "",
                    "text": """"Oakfield Ltd" is wound up voluntarily. Its statement of affairs shows: Assets of £100,000; Fixed Charge Holder owed £80,000; Floating Charge Holder owed £60,000; Preferential Creditors owed £15,000; Unsecured Creditors owed £150,000; and Liquidation costs of £10,000.\nWhat is the 'prescribed part' under s.176A of the Insolvency Act 1986, and who is it for?""",
                    "options": [
                        {"label": "A", "text": "A sum set aside from the assets for the benefit of the company's members (shareholders)."},
                        {"label": "B", "text": "A sum set aside from the assets subject to a floating charge for the payment of the liquidator's fees."},
                        {"label": "C", "text": "A sum set aside from the assets subject to a floating charge for the payment of unsecured creditors."},
                        {"label": "D", "text": "A sum set aside from all assets for the payment of preferential creditors."},
                        {"label": "E", "text": "A sum set aside from the assets subject to a fixed charge for the payment of employee claims."}
                    ],
                    "correct_answer": "C",
                    "explanation": "Option C is correct. S.176A requires that a 'prescribed part' of the company's net property which is subject to a floating charge must be set aside for the benefit of unsecured creditors. The amount is capped (currently 50% of the first £10,000 and 20% of the remainder, with an overall maximum of £800,000).\nOption A is incorrect. Members are last in the order of priority.\nOption B is incorrect. Liquidation costs are paid before the prescribed part is calculated.\nOption D is incorrect. Preferential creditors are paid from floating charge assets before the floating charge holder, but the prescribed part is a separate ring-fenced fund for unsecured creditors.\nOption E is incorrect. The prescribed part comes from floating charge assets, not fixed charge assets.",
                    "difficulty": "medium"
                },
                {
                    "id": 11,
                    "title": "",
                    "text": """Three months before "Pinehurst Ltd" entered administration, its director, Sarah, who had personally guaranteed the company's bank loan, arranged for the company to pay £20,000 to the bank, reducing the guarantee exposure. Other unsecured creditors were not paid.\nWhich of the following is the most relevant claim for the administrator?""",
                    "options": [
                        {"label": "A", "text": "Transaction at an undervalue against the bank (s.238)."},
                        {"label": "B", "text": "Preference in favour of Sarah as a surety (s.239)."},
                        {"label": "C", "text": "Wrongful trading against Sarah (s.214)."},
                        {"label": "D", "text": "Fraudulent trading against Sarah (s.213)."},
                        {"label": "E", "text": "Setting aside a floating charge (s.245)."}
                    ],
                    "correct_answer": "B",
                    "explanation": "Option B is correct. A payment to a creditor which has the effect of putting a surety or guarantor (here, Sarah) in a better position can be a preference of that surety under s.239. The company's payment reduced Sarah's potential liability under her guarantee, thereby preferring her.\nOption A is incorrect. The payment was for full value (reducing a debt), not an undervalue.\nOption C and D are incorrect. They relate to the conduct of trading, not a specific payment.\nOption E is incorrect. The scenario involves a payment, not the creation of a charge.",
                    "difficulty": "medium"
                },
                {
                    "id": 12,
                    "title": "",
                    "text": """Raj is an individual who has been declared bankrupt. He owns a house jointly with his wife, which has £100,000 equity. He also has a valuable vintage car collection.\nWhat is the general rule regarding these assets in his bankruptcy?""",
                    "options": [
                        {"label": "A", "text": "Both the house equity and the car collection will automatically vest in his trustee in bankruptcy immediately."},
                        {"label": "B", "text": "The house is protected if it is the family home, but the car collection will vest in the trustee."},
                        {"label": "C", "text": "Both assets are exempt if their total value is below a certain threshold."},
                        {"label": "D", "text": "All of Raj's assets vest in his trustee in bankruptcy, subject to certain exemptions and the rights of secured creditors."},
                        {"label": "E", "text": "Only assets acquired after the bankruptcy order vest in the trustee."}
                    ],
                    "correct_answer": "D",
                    "explanation": "Option D is correct. Upon bankruptcy, the bankrupt's estate (with limited exceptions) vests in the trustee in bankruptcy under s.306 of the Insolvency Act 1986. The trustee will realise these assets for creditors. The family home is not automatically exempt, but the trustee has three years to deal with it, and the spouse may have rights. The car collection is not an exempt asset unless it is a vehicle used for personal travel, which may be of limited value.\nOption A is incorrect. While they vest, the process is not automatic in the sense of immediate seizure; the trustee must take steps.\nOption B is incorrect. The family home is not automatically protected; it forms part of the bankrupt's estate.\nOption C is incorrect. There is no general exemption for total asset value. Certain tools of the trade and basic household items are exempt.\nOption E is incorrect. It is assets owned at the date of the bankruptcy order that vest.",
                    "difficulty": "medium"
                },
                {
                    "id": 13,
                    "title": "",
                    "text": """"Summit Ltd" is in creditors' voluntary liquidation. The order of payment from the company's assets is being determined.\nWhich of the following is the correct order of priority for payment?""",
                    "options": [
                        {"label": "A", "text": "1. Secured creditors with a fixed charge; 2. Liquidation expenses; 3. Preferential creditors; 4. Secured creditors with a floating charge; 5. Unsecured creditors; 6. Members."},
                        {"label": "B", "text": "1. Liquidation expenses; 2. Preferential creditors; 3. Secured creditors with a fixed charge; 4. Secured creditors with a floating charge; 5. Unsecured creditors; 6. Members."},
                        {"label": "C", "text": "1. Secured creditors with a fixed charge; 2. Liquidation expenses; 3. Preferential creditors; 4. Secured creditors with a floating charge; 5. Unsecured creditors; 6. Members."},
                        {"label": "D", "text": "1. Liquidation expenses; 2. Secured creditors with a fixed charge; 3. Preferential creditors; 4. Secured creditors with a floating charge; 5. Unsecured creditors; 6. Members."},
                        {"label": "E", "text": "1. Preferential creditors; 2. Liquidation expenses; 3. Secured creditors (fixed then floating); 4. Unsecured creditors; 5. Members."}
                    ],
                    "correct_answer": "C",
                    "explanation": "Option C is correct. The fixed charge holder is paid from the proceeds of the asset over which the charge is held. Liquidation expenses are then paid from the general assets. Preferential creditors are paid next from assets not subject to a fixed charge (primarily from floating charge assets, after expenses). Then the floating charge holder is paid. Then unsecured creditors. Finally, any surplus to members.\nOption A is incorrect because it places liquidation expenses after the fixed charge holder, but expenses are paid from the general estate before preferential creditors.\nOption B and D are incorrect because they do not recognise that a fixed charge holder has first claim on their asset, not on the general pool.\nOption E is incorrect because it reverses the order of liquidation expenses and preferential creditors.",
                    "difficulty": "hard"
                },
                {
                    "id": 14,
                    "title": "",
                    "text": """"Torridge Ltd" is insolvent. Its director, Chloe, knows the company cannot pay its debts as they fall due but continues to trade for four months, incurring £50,000 of new credit from suppliers. The company then goes into liquidation.\nWhat must the liquidator prove to obtain a contribution order against Chloe for wrongful trading under s.214?""",
                    "options": [
                        {"label": "A", "text": "That Chloe acted dishonestly in incurring the new debts."},
                        {"label": "B", "text": "That Chloe knew the company was insolvent and continued to trade."},
                        {"label": "C", "text": "That at some point before the commencement of winding up, Chloe knew there was no reasonable prospect of avoiding insolvent liquidation, and she failed to minimise loss to creditors."},
                        {"label": "D", "text": "That she preferred some creditors over others during the four-month period."},
                        {"label": "E", "text": "That she transferred assets out of the company at an undervalue."}
                    ],
                    "correct_answer": "C",
                    "explanation": "Option C is correct. This is the precise statutory test for wrongful trading under s.214 of the Insolvency Act 1986. It is an objective test (ought to have concluded) and requires a failure to take minimising steps.\nOption A is incorrect. Dishonesty is the test for fraudulent trading, not wrongful trading.\nOption B is incorrect. Simply knowing the company is insolvent is not enough; the test requires knowledge that there was no reasonable prospect of avoiding insolvent liquidation.\nOption D is incorrect. Preferences are a separate matter under s.239.\nOption E is incorrect. Transactions at an undervalue are a separate matter under s.238.",
                    "difficulty": "medium"
                },
                {
                    "id": 15,
                    "title": "",
                    "text": """An Individual Voluntary Arrangement (IVA) has been approved by Daniel's creditors. Three years into the five-year arrangement, Daniel receives an unexpected inheritance of £50,000.\nWhat is the likely consequence of this?""",
                    "options": [
                        {"label": "A", "text": "The inheritance is Daniel's to keep; it does not affect the IVA as it is a windfall after the arrangement started."},
                        {"label": "B", "text": "The IVA will fail automatically, and Daniel will be made bankrupt."},
                        {"label": "C", "text": "Daniel must inform his insolvency practitioner, who will likely require the inheritance to be paid into the IVA for the benefit of creditors."},
                        {"label": "D", "text": "Daniel can use the inheritance to make a full and final settlement offer, but he is under no obligation to do so."},
                        {"label": "E", "text": "The inheritance is protected as it is not income from his employment."}
                    ],
                    "correct_answer": "C",
                    "explanation": "Option C is correct. Standard IVA terms include a 'windfall clause' requiring any unexpected assets or sums received during the term (like an inheritance) to be paid into the arrangement for creditors.\nOption A is incorrect. IVAs typically capture windfalls during their term.\nOption B is incorrect. A windfall does not cause automatic failure; it is provided for in the terms.\nOption D is incorrect. While a full and final settlement is possible, he is obliged to pay the windfall in under the terms.\nOption E is incorrect. The source is irrelevant; it is a windfall captured by the IVA.",
                    "difficulty": "medium"
                },
                {
                    "id": 16,
                    "title": "",
                    "text": """"Vale Ltd" enters administration. The administrator sells the business and assets as a going concern to a new company. Six months prior to administration, Vale Ltd had made a gift of a piece of machinery to its chairman.\nCan the administrator recover this gift?""",
                    "options": [
                        {"label": "A", "text": "No, because the gift was made more than 6 months before the administration."},
                        {"label": "B", "text": "Yes, as a transaction at an undervalue, provided Vale Ltd was insolvent at the time or became insolvent because of it."},
                        {"label": "C", "text": "No, because the chairman was not a creditor."},
                        {"label": "D", "text": "Yes, but only if it can be shown the chairman influenced the directors to make the gift."},
                        {"label": "E", "text": "No, because the administrator's role is to rescue the company, not to pursue historic transactions."}
                    ],
                    "correct_answer": "B",
                    "explanation": "Option B is correct. A gift is the clearest form of transaction at an undervalue under s.238. The relevant time period is 2 years before the onset of insolvency if the transaction is with a connected person (like a chairman). The administrator can apply to court to have it set aside.\nOption A is incorrect. The relevant look-back period for transactions at an undervalue with connected persons is 2 years, not 6 months.\nOption C is incorrect. Recovery under s.238 does not require the recipient to be a creditor.\nOption D is incorrect. While influence may be relevant to preferences, for a transaction at an undervalue with a connected person, no such proof is required.\nOption E is incorrect. One of the administrator's statutory objectives is to realise property to make a distribution to creditors, which includes clawing back such transactions.",
                    "difficulty": "medium"
                },
                {
                    "id": 17,
                    "title": "",
                    "text": """William is made bankrupt. He has an outstanding student loan.\nWhat is the status of this student loan in his bankruptcy?""",
                    "options": [
                        {"label": "A", "text": "It is discharged upon his discharge from bankruptcy (usually after one year)."},
                        {"label": "B", "text": "It is treated as an ordinary unsecured debt and included in the bankruptcy."},
                        {"label": "C", "text": "It is a non-provable debt and survives his bankruptcy."},
                        {"label": "D", "text": "It is a preferential debt and must be paid in full by the trustee."},
                        {"label": "E", "text": "It is a secured debt against his future earnings."}
                    ],
                    "correct_answer": "C",
                    "explanation": "Option C is correct. Student loans (of the type administered by the Student Loans Company) are specifically excluded from being provable debts in bankruptcy under the Insolvency Rules 2016. Therefore, they are not discharged by bankruptcy and remain payable.\nOption A is incorrect. Only provable debts are discharged; student loans are an exception.\nOption B is incorrect. They are not provable, so not included.\nOption D is incorrect. They are not preferential debts.\nOption E is incorrect. They are not secured debts.",
                    "difficulty": "medium"
                },
                {
                    "id": 18,
                    "title": "",
                    "text": """"Westgate Ltd" is in administration. The administrator is trying to decide which of the statutory objectives to pursue. The company has no viable business to rescue, but its assets are greater than would be achieved in a winding-up.\nWhich objective should the administrator pursue?""",
                    "options": [
                        {"label": "A", "text": "Rescuing the company as a going concern."},
                        {"label": "B", "text": "Achieving a better result for the company's creditors as a whole than would be likely in a winding up."},
                        {"label": "C", "text": "Realising property to make a distribution to one or more secured or preferential creditors."},
                        {"label": "D", "text": "Immediately moving the company into creditors' voluntary liquidation."},
                        {"label": "E", "text": "Selling the assets piecemeal as quickly as possible."}
                    ],
                    "correct_answer": "B",
                    "explanation": "Option B is correct. Under para 3(1)(b) of Schedule B1 to the Insolvency Act 1986, if rescuing the company is not reasonably practicable, the administrator must pursue the objective of achieving a better result for creditors as a whole than in a winding up. The scenario describes this situation.\nOption A is incorrect. The question states there is no viable business to rescue.\nOption C is incorrect. This is the third objective (para 3(1)(c)), but it is only to be pursued if the administrator thinks neither of the first two objectives is achievable. Objective B is achievable here.\nOption D is incorrect. The administrator must first try to achieve objective B.\nOption E is incorrect. This is a method, not a statutory objective.",
                    "difficulty": "medium"
                },
                {
                    "id": 19,
                    "title": "",
                    "text": """"Yewtree Ltd" granted a floating charge to its bank on 1 January 2025. The company went into liquidation on 1 November 2025. The charge secured an overdraft facility that was already fully drawn on 1 January 2025. No new money was advanced when the charge was created.\nWhat is the status of this floating charge?""",
                    "options": [
                        {"label": "A", "text": "It is valid and ranks above preferential creditors."},
                        {"label": "B", "text": "It is invalid except to the extent of any interest accruing after 1 January 2025."},
                        {"label": "C", "text": "It is void as a floating charge created for past consideration within 12 months of liquidation."},
                        {"label": "D", "text": "It is void as a floating charge created for past consideration within 6 months of liquidation."},
                        {"label": "E", "text": "It is voidable at the option of the liquidator as a preference."}
                    ],
                    "correct_answer": "C",
                    "explanation": "Option C is correct. S.245 of the Insolvency Act 1986 renders a floating charge created within 12 months of the onset of insolvency invalid, except to the extent of new money, goods, or services provided at the time of or after the charge's creation. Here, the charge secured an existing overdraft (past consideration) and was created within 12 months of liquidation, so it is invalid. Therefore, Option D is incorrect.\nOption A is incorrect. S.245 invalidates such charges.\nOption B is incorrect. The exception is for new value, not interest on old value.\nOption E is incorrect. S.245 is a specific provision for floating charges; it is not about preferences.",
                    "difficulty": "medium"
                },
                {
                    "id": 20,
                    "title": "",
                    "text": """Zara is the sole director of "Apex Ltd." The company is insolvent. To keep a key supplier happy, Zara arranges for the company to pay that supplier's invoice of £10,000 in full, while leaving other similar suppliers unpaid. The payment is made two months before the company enters compulsory liquidation. The supplier is not connected to Zara.\nCan the liquidator recover this payment?""",
                    "options": [
                        {"label": "A", "text": "No, because the supplier was not a connected person."},
                        {"label": "B", "text": "Yes, automatically, as it is a preference within the relevant period."},
                        {"label": "C", "text": "No, because it was a genuine business decision to maintain a key relationship."},
                        {"label": "D", "text": "Yes, but only if the liquidator can prove that Zara was influenced by a desire to prefer that supplier."},
                        {"label": "E", "text": "No, because the payment was in the ordinary course of business."}
                    ],
                    "correct_answer": "D",
                    "explanation": "Option D is correct. For an unconnected person, to establish a preference under s.239, the liquidator must prove the company was influenced by a desire to put the creditor in a better position. This is a subjective test and can be difficult to prove, but it is the correct legal hurdle.\nOption A is incorrect. Preferences can apply to unconnected persons, but the 'desire' test applies.\nOption B is incorrect. It is not automatic; the conditions, including the 'desire' for unconnected persons, must be proven.\nOption C is incorrect. The commercial rationale may be a factor, but it is not an absolute defence if the statutory conditions are met.\nOption E is incorrect. Being in the ordinary course is a factor the court may consider, but it is not a statutory defence.",
                    "difficulty": "medium"
                }
            ]
            print("-> Patched Business Law Section G with 20 new questions")
            
            # =====================================================
            # CONTRACT LAW PATCHES
            # =====================================================
            # Contract Law is topic index 2 in FLK-1
            contract_topic = courses["flk-1"]["topics"][2]
            
            # =====================================================
            # Patch Contract Law Section A - Formation of Contract
            # =====================================================
            area_a = next((a for a in contract_topic["areas"] if a["letter"] == "A"), None)
            if area_a:
                area_a["name"] = "Formation of Contract"
                area_a["slug"] = "a-formation-of-contract"
                area_a["question_count"] = 20
            else:
                area_a = {
                    "letter": "A",
                    "name": "Formation of Contract",
                    "slug": "a-formation-of-contract",
                    "question_count": 20,
                    "questions": []
                }
                contract_topic["areas"].insert(0, area_a)
            
            area_a["questions"] = [
                {
                    "id": 1,
                    "title": "",
                    "text": """Thomas, wishing to sell his vintage watch collection, emails Eleanor on Monday at 10:00 a.m., stating: "I offer to sell you my entire collection for £15,000. This offer is open for your acceptance until 5:00 p.m. on Wednesday." Eleanor is interested but wants to consult an expert. At 3:00 p.m. on Monday, she drafts an email that reads: "I accept your offer to buy the collection for £15,000." She clicks 'send' at 3:05 p.m. Unknown to her, a server outage at her email provider delays the message. Thomas, having heard nothing and receiving a better offer from Benjamin, emails Eleanor at 4:00 p.m. on Monday stating: "I revoke my offer." This email reaches Eleanor immediately. Eleanor's acceptance email finally leaves her outbox and is received by Thomas at 5:30 p.m. on Monday.\nWhich of the following best describes whether a contract was formed?""",
                    "options": [
                        {"label": "A", "text": "A contract was formed when Eleanor clicked 'send' at 3:05 p.m., as she had done all she could to communicate her acceptance."},
                        {"label": "B", "text": "A contract was formed when Thomas received the acceptance at 5:30 p.m., but only if the server outage constituted an external factor beyond Eleanor's control."},
                        {"label": "C", "text": "No contract was formed because Thomas's revocation, communicated at 4:00 p.m., was effective before Eleanor's acceptance was received."},
                        {"label": "D", "text": "A contract was formed because the offer was stated to be open until Wednesday, making Thomas's attempted revocation ineffective."},
                        {"label": "E", "text": "No contract was formed because Eleanor's acceptance was not communicated in a timely manner given the mode of communication used."}
                    ],
                    "correct_answer": "C",
                    "explanation": "The general rule for acceptance by instantaneous communication is that it takes effect when received by the offeror (Entores Ltd v Miles Far East Corp). Thomas's revocation was an effective communication when it reached Eleanor at 4:00 p.m. (Byrne v Van Tienhoven). Eleanor's acceptance was only received at 5:30 p.m., after the revocation was communicated. The offer being expressed as 'open until Wednesday' was not supported by consideration and was therefore a bare promise, which Thomas was free to revoke at any time before acceptance. The server delay does not invoke the postal rule exception, which is typically confined to non-instantaneous methods like post.",
                    "difficulty": "hard"
                },
                {
                    "id": 2,
                    "title": "",
                    "text": """Amelia's manufacturing company needs specialist components. She sends a detailed purchase order to Benjamin's company, which concludes: "Supply of components on the terms set out herein, which shall prevail over any other terms." Benjamin responds by sending an acknowledgement of order, which states: "Thank you for your order. We will supply the components subject to our standard terms and conditions attached, which exclude all liability for consequential loss." Attached are Benjamin's full terms. The components are then delivered to Amelia along with a delivery note that says: "Goods supplied subject to our standard terms available at www.standardterms.com." Amelia pays for the components without further communication. The components are later found to be defective, causing Amelia significant consequential losses.\nApplying the 'last shot' doctrine, which of the following is the most likely analysis?""",
                    "options": [
                        {"label": "A", "text": "Amelia's terms govern because her purchase order was the first document and contained an express 'precedence' clause."},
                        {"label": "B", "text": "Benjamin's terms govern because his acknowledgement of order was a counter-offer which Amelia accepted by accepting the goods without objection."},
                        {"label": "C", "text": "The delivery note terms govern as they were the last set of terms communicated before performance."},
                        {"label": "D", "text": "No contract was formed due to the inconsistent communications, but a quasi-contract exists for the value of the goods."},
                        {"label": "E", "text": "The contract is governed by the Supply of Goods and Services Act 1982 because the parties failed to reach agreement on which set of standard terms applied."}
                    ],
                    "correct_answer": "B",
                    "explanation": "Under the 'battle of the forms' and the 'last shot' doctrine, each new document containing different terms is treated as a counter-offer (Butler Machine Tool Co Ltd v Ex-Cell-O Corp). Benjamin's acknowledgement of order, which attached his own terms, was a counter-offer to Amelia's original purchase order (which was the initial offer). Amelia's subsequent conduct in accepting and paying for the goods without objection constituted acceptance of that counter-offer by performance. The delivery note is unlikely to be seen as a further counter-offer as it was received with the goods themselves, after the contract was likely already formed by conduct.",
                    "difficulty": "medium"
                },
                {
                    "id": 3,
                    "title": "",
                    "text": """Catherine, a software developer, publicly advertises: "A reward of £10,000 will be paid to the first person who identifies and reports a critical security vulnerability in our 'Vault' application before 1st December." Daniel, a cybersecurity researcher, begins testing the application. On 15th November, Catherine publishes another notice: "Due to unforeseen circumstances, the reward offer for the 'Vault' application is withdrawn with immediate effect." Daniel, unaware of this withdrawal, continues testing and identifies a critical vulnerability on 20th November, which he immediately reports to Catherine with proof.\nIs Catherine obligated to pay Daniel the £10,000 reward?""",
                    "options": [
                        {"label": "A", "text": "No, because Catherine effectively revoked her offer before Daniel completed the act of acceptance."},
                        {"label": "B", "text": "Yes, because the offer was for a unilateral contract and could only be revoked before Daniel began performance."},
                        {"label": "C", "text": "No, because Daniel did not communicate his acceptance of the offer before Catherine revoked it."},
                        {"label": "D", "text": "Yes, because Daniel had begun performance before the revocation, which created an ancillary contract that the offer would not be withdrawn."},
                        {"label": "E", "text": "No, because the offer required completion by 1st December and Catherine was free to withdraw it at any point before that date."}
                    ],
                    "correct_answer": "A",
                    "explanation": "A unilateral contract offer is generally revocable at any time before complete performance of the required act (Daulia Ltd v Four Millbank Nominees Ltd). Beginning performance does not, in English law, automatically create a binding option contract preventing revocation; such an ancillary contract would require separate consideration. Daniel had not completed the requested act (identifying and reporting the vulnerability) before Catherine's public revocation on 15th November. His continued performance, being in ignorance of the revocation, does not create a binding contract.",
                    "difficulty": "medium"
                },
                {
                    "id": 4,
                    "title": "",
                    "text": """George owns an art gallery. He places a rare sculpture in the window with a price tag of £25,000. Hannah visits the gallery, points to the sculpture and says, "I'll take it for the asking price." George replies, "I'm afraid I've decided not to sell that piece after all." Hannah insists a contract was formed. The following week, George lists the same sculpture on an online auction site. The listing has a clear description, a reserve price of £20,000, and states the auction will end at 12:00 noon on Friday. Isabella places the highest bid of £30,000 at 11:55 a.m. At 11:58 a.m., George, as the seller, uses his authority under the site's terms to cancel the listing and remove the item.\nWhich of the following best describes the legal position regarding Hannah and Isabella?""",
                    "options": [
                        {"label": "A", "text": "Hannah's statement was an acceptance of an offer made by George's display, forming a contract. Isabella's bid was an acceptance of an offer made by the auction listing, also forming a contract."},
                        {"label": "B", "text": "The display was an invitation to treat, so Hannah made an offer which George rejected. The auction listing was an invitation to treat, so Isabella's bid was an offer which George was free to cancel before the auction closed."},
                        {"label": "C", "text": "The display was an offer which Hannah accepted. The auction listing was an invitation to treat, so George's cancellation was a breach of contract with Isabella."},
                        {"label": "D", "text": "Neither situation resulted in a contract because both the display and the auction listing were merely advertisements with no intention to be bound."},
                        {"label": "E", "text": "Hannah has no claim, but Isabella has a claim because online auctions operate under special rules where the listing constitutes a firm offer to sell to the highest bidder."}
                    ],
                    "correct_answer": "B",
                    "explanation": "The display of goods with a price tag in a shop window is classically an invitation to treat, not an offer (Pharmaceutical Society of Great Britain v Boots Cash Chemists). Hannah's statement was therefore an offer, which George was free to reject. Similarly, an auction listing (where bids are invited) is an invitation to treat; each bid is an offer, and the seller's acceptance occurs on the fall of the hammer or equivalent closing action (British Car Auctions v Wright). George's cancellation before the auction closed meant he did not accept Isabella's offer (bid), so no contract was formed, assuming the site's terms allowed for such cancellation.",
                    "difficulty": "medium"
                },
                {
                    "id": 5,
                    "title": "",
                    "text": """Olivia is a freelance graphic designer. In January, she voluntarily redesigns the logo for her friend Liam's business as a favour, without any discussion of payment. Liam is delighted with the new logo. In March, after using the logo for two months, Liam writes to Olivia: "In consideration of your having redesigned my logo, I promise to pay you £2,000." Liam later fails to pay. Olivia sues to enforce the promise.\nIs Liam's promise to pay £2,000 enforceable?""",
                    "options": [
                        {"label": "A", "text": "Yes, because the act of redesigning the logo was done at Liam's request, albeit impliedly, and is valid consideration."},
                        {"label": "B", "text": "Yes, because the promise was made in a signed writing, which suffices to make past consideration valid."},
                        {"label": "C", "text": "No, because the consideration was past and voluntary."},
                        {"label": "D", "text": "No, unless Olivia can show she had originally expected to be paid, making it an executed rather than past consideration."},
                        {"label": "E", "text": "Yes, under the principle of moral obligation, as it would be unjust for Liam not to pay after using the work."}
                    ],
                    "correct_answer": "C",
                    "explanation": "Past consideration is not good consideration (Re McArdle). For an act to be valid consideration for a subsequent promise, it must have been done at the promisor's request and on the understanding that payment would be made. Here, the redesign was a voluntary favour with no prior request or understanding of payment. The subsequent promise is therefore unsupported by fresh consideration and is unenforceable. A signed writing does not, of itself, validate past consideration; it must be a deed to be enforceable without consideration.",
                    "difficulty": "easy"
                },
                {
                    "id": 6,
                    "title": "",
                    "text": """Felicity is a junior solicitor under a contract of employment with a firm. Her contract requires her to work her "normal hours" and provides for an annual bonus at the firm's discretion. During a particularly intense transaction, the partner in charge, David, tells Felicity: "If you work evenings and weekends to get this merger completed by the end of the month, I promise you a guaranteed £10,000 bonus on top of any discretionary bonus." Felicity works the extra hours and the merger completes on time. The firm later refuses to pay the £10,000, arguing Felicity was only doing what she was already contracted to do.\nWhich of the following is the strongest argument for enforcing David's promise?""",
                    "options": [
                        {"label": "A", "text": "Felicity provided good consideration by working beyond her 'normal hours,' which constituted a practical benefit to the firm."},
                        {"label": "B", "text": "The promise is enforceable as a variation of Felicity's employment contract, supported by the practical benefit."},
                        {"label": "C", "text": "Felicity was performing an existing contractual duty, which is never sufficient consideration for a fresh promise."},
                        {"label": "D", "text": "The promise is unenforceable as it was made without any fresh legal detriment to Felicity."},
                        {"label": "E", "text": "The promise may be enforceable if Felicity can show she otherwise would have breached her original contract, which she cannot."}
                    ],
                    "correct_answer": "B",
                    "explanation": "In Williams v Roffey Bros & Nicholls (Contractors) Ltd, the court held that a promise to pay extra for the performance of an existing contractual duty can be supported by the 'practical benefit' obtained by the promisor, such as securing timely performance and avoiding a penalty. Felicity's promise to work extra hours (beyond 'normal hours') provided a practical benefit to the firm (securing the merger deadline). This constitutes sufficient consideration for David's fresh promise, making it enforceable as a contractual variation.",
                    "difficulty": "medium"
                },
                {
                    "id": 7,
                    "title": "",
                    "text": """Jacob owes his supplier, Chloe, £50,000, which was due for payment on 1st April. On 1st April, Jacob tells Chloe he is in financial difficulty and can only pay £35,000 immediately. Reluctantly, Chloe agrees to accept £35,000 in "full and final settlement" of the £50,000 debt. Jacob pays the £35,000 that day. Two weeks later, Chloe demands the outstanding £15,000.\nCan Chloe successfully claim the £15,000?""",
                    "options": [
                        {"label": "A", "text": "No, because she agreed to accept £35,000 in full and final settlement, which extinguishes the entire debt."},
                        {"label": "B", "text": "Yes, because Jacob provided no fresh consideration for the promise to forgo £15,000."},
                        {"label": "C", "text": "No, because the agreement was made on the due date, which constitutes a binding accord and satisfaction."},
                        {"label": "D", "text": "Yes, unless Jacob can prove that Chloe's agreement was given under economic duress."},
                        {"label": "E", "text": "No, if Jacob can show that Chloe's agreement provided her with a practical benefit, such as avoiding the cost of debt recovery proceedings."}
                    ],
                    "correct_answer": "B",
                    "explanation": "The rule in Pinnel's Case (affirmed in Foakes v Beer) states that part payment of a debt is not good consideration for a promise to forgo the balance, as the debtor is only doing what they were already obliged to do. The 'practical benefit' principle from Williams v Roffey does not apply to simple payments of money (Re Selectmove Ltd). Therefore, Chloe's promise is not binding, and she can sue for the residue, unless fresh consideration was provided (e.g., payment early, at a different place, or with a chattel).",
                    "difficulty": "medium"
                },
                {
                    "id": 8,
                    "title": "",
                    "text": """Noah believes he has a strong claim against Sophia for breach of a consultancy agreement, worth approximately £20,000. He instructs solicitors and informs Sophia he will issue proceedings. Sophia's lawyer replies: "My client disputes liability entirely. However, to avoid the cost and distraction of litigation, she is willing to pay you £12,000 if you agree not to pursue the claim." Noah agrees in writing to accept £12,000 in "full and final settlement of all claims" arising from the agreement. Sophia pays the £12,000. Six months later, new evidence emerges suggesting Noah's original claim was actually worth over £30,000. Noah now wishes to sue for the balance.\nIs Noah likely to succeed in a claim for the additional money?""",
                    "options": [
                        {"label": "A", "text": "Yes, because the settlement was based on a mistaken view of the claim's value, rendering the agreement voidable."},
                        {"label": "B", "text": "No, because Noah's forbearance to sue, even on a disputed claim, constitutes good consideration for Sophia's promise to pay £12,000."},
                        {"label": "C", "text": "Yes, because forbearance to sue is only good consideration if the claim is ultimately proven to be valid, which it now appears to be."},
                        {"label": "D", "text": "No, but only if Sophia can prove that Noah acted in bad faith by hiding the new evidence at the time of settlement."},
                        {"label": "E", "text": "Yes, because the consideration was past; Noah's promise not to sue was given after the cause of action had already arisen."}
                    ],
                    "correct_answer": "B",
                    "explanation": "Forbearance to sue on a claim which is not vexatious or frivolous, and which the claimant honestly believes to be valid, constitutes good consideration (Alliance Bank Ltd v Broom). It is not necessary for the claim to be ultimately proven valid. The settlement agreement is a binding contract, and the subsequent discovery that the claim might have been worth more does not invalidate it, absent fraud or misrepresentation.",
                    "difficulty": "medium"
                },
                {
                    "id": 9,
                    "title": "",
                    "text": """Two sisters, Grace and Imogen, share a house. Grace is promoted and will be moving to a new city. At a family dinner, Grace says to Imogen: "I know the mortgage is in your name, but I've contributed to the payments for years. To help you out when I'm gone, I promise I'll send you £300 a month for the next two years to help cover the mortgage." Their mother witnesses the conversation. Grace moves and makes three monthly payments, then stops due to her own expenses. Imogen seeks to enforce the promise.\nWhich of the following is the most accurate statement of the legal principle applying to this scenario?""",
                    "options": [
                        {"label": "A", "text": "The presumption is that family agreements lack intention to create legal relations, and there are no strong countervailing factors to rebut it here."},
                        {"label": "B", "text": "The context (discussing financial contributions to a mortgage) and the precision of the promise are strong factors rebutting the presumption against intention in domestic agreements."},
                        {"label": "C", "text": "The promise is enforceable as a unilateral contract, with Imogen having provided consideration by allowing Grace to live in the house previously."},
                        {"label": "D", "text": "The presence of a witness, their mother, is crucial and rebuts the presumption against legal intention."},
                        {"label": "E", "text": "The promise is unenforceable as it was a mere statement of future intent, not a promise in exchange for consideration."}
                    ],
                    "correct_answer": "A",
                    "explanation": "Agreements between family members are presumed not to be intended to create legal relations (Balfour v Balfour). To rebut this presumption, clear evidence of an intention to be legally bound is required (e.g., a formal written agreement, or circumstances where the agreement is more commercial in nature). An informal promise made at a family dinner, even if precise and related to financial matters, is typically insufficient to rebut the strong domestic presumption. The presence of a family member as a witness does not alter this.",
                    "difficulty": "medium"
                },
                {
                    "id": 10,
                    "title": "",
                    "text": """Edward, the CEO of TechNova Ltd, has a long-standing professional friendship with Laura, the CEO of a potential client, DataSolve Ltd. After a productive but informal meeting at a golf club, Edward says to Laura: "Look, we really want to work with you. As a gesture of goodwill and to get things moving, I promise we'll handle your first major data migration project at cost price, with no profit margin for us." Laura replies, "That's incredibly generous, thank you. You have a deal." They shake hands. Later, TechNova's finance department insists on applying their standard profit margin. DataSolve claims a binding agreement exists.\nIs there a legally binding agreement?""",
                    "options": [
                        {"label": "A", "text": "No, because the agreement was made in a social setting and lacked the formalities required for commercial contracts."},
                        {"label": "B", "text": "Yes, because the presumption in commercial contexts is that the parties intend to be legally bound, and the agreement, while made informally, was precise."},
                        {"label": "C", "text": "No, because the phrase 'gesture of goodwill' expressly negates any intention to create legal relations."},
                        {"label": "D", "text": "Yes, but only if the parties had a prior course of dealing which established an intention to be bound by such informal statements."},
                        {"label": "E", "text": "No, because the agreement was too vague and lacked essential terms such as a detailed scope of work and payment schedule."}
                    ],
                    "correct_answer": "C",
                    "explanation": "While there is a strong presumption of an intention to create legal relations in commercial contexts, it can be rebutted by clear words indicating the contrary. Phrases such as 'gentlemen's agreement,' 'honour clause,' or, as here, 'gesture of goodwill' can be used expressly to negative legal intention (Rose & Frank Co v JR Crompton & Bros Ltd). Edward's use of this phrase, in an informal setting, is likely to rebut the commercial presumption.",
                    "difficulty": "medium"
                },
                {
                    "id": 11,
                    "title": "",
                    "text": """A bank is considering a large loan to Phoenix Ltd, a subsidiary company. The bank is concerned about Phoenix Ltd's standalone financial position. The parent company, Global Group PLC, sends the bank a "letter of comfort" which states: "It is our policy to ensure that Phoenix Ltd is always in a position to meet its financial obligations. We are aware of your proposed loan and believe it to be a sound arrangement." Relying on this letter, the bank makes the loan. Phoenix Ltd later defaults. The bank sues Global Group PLC, arguing the letter constituted a contractual guarantee.\nWhich of the following is the most likely outcome?""",
                    "options": [
                        {"label": "A", "text": "The bank will succeed because, in a commercial context, such a letter is presumed to be intended to have legal effect as a guarantee."},
                        {"label": "B", "text": "The bank will fail because the language used is indicative of a statement of belief, and lacks the clear intention required for a contract."},
                        {"label": "C", "text": "The bank will succeed if it can show that it relied on the letter to its detriment, giving rise to an estoppel."},
                        {"label": "D", "text": "The bank will fail unless the letter was signed as a deed, as guarantees require formality."},
                        {"label": "E", "text": "The bank will succeed because the parent company has a moral obligation to ensure its subsidiary can pay its debts."}
                    ],
                    "correct_answer": "B",
                    "explanation": "The legal effect of a 'letter of comfort' depends on its precise wording. Statements of present policy or belief, as opposed to clear promises of future financial support, are generally construed as not intended to be legally binding guarantees (Kleinwort Benson Ltd v Malaysia Mining Corporation Bhd). The language here ('It is our policy…', 'We…believe') is typical of a non-binding assurance, lacking the necessary contractual intention.",
                    "difficulty": "medium"
                },
                {
                    "id": 12,
                    "title": "",
                    "text": """Robert, a property developer, and Harriet, an architect, sign a heads of terms document. It states: "Robert engages Harriet to provide full architectural services for the development of the Riverside Site. Fees shall be calculated on a time-cost basis, with a total cap to be agreed in a subsequent formal contract. The parties shall negotiate in good faith to finalise and execute a formal agreement within 30 days." After two weeks of negotiations, the parties cannot agree on the fee cap. Robert appoints a different architect. Harriet claims they had a binding contract from the moment the heads of terms were signed.\nWas there a binding contract?""",
                    "options": [
                        {"label": "A", "text": "Yes, because the heads of terms identified the parties, subject matter, and basis of fees, with the fee cap being a minor term that could be determined by the court."},
                        {"label": "B", "text": "No, because a critical term was left for future agreement, rendering the agreement an unenforceable 'agreement to agree'."},
                        {"label": "C", "text": "Yes, because the parties had an obligation to negotiate in good faith, and Robert's failure to do so is a breach of that binding obligation."},
                        {"label": "D", "text": "No, unless the heads of terms were expressed to be 'subject to contract', which they were not."},
                        {"label": "E", "text": "Yes, but only if the court is willing to imply a term that fees will be reasonable, based on the time-cost basis specified."}
                    ],
                    "correct_answer": "B",
                    "explanation": "An agreement which leaves a crucial term, such as price or a price cap, to be agreed in the future is generally void for uncertainty (May & Butcher v The King). It is an unenforceable 'agreement to agree'. An obligation to 'negotiate in good faith' is also typically unenforceable in English law for lack of objective criteria (Walford v Miles). The court will not make a contract for the parties by imposing a reasonable cap.",
                    "difficulty": "medium"
                },
                {
                    "id": 13,
                    "title": "",
                    "text": """A café owner, Megan, agrees to sell her business to Leo. The written contract states the price is £200,000 and includes a clause: "The purchaser (Leo) shall have the option to lease the adjacent storage unit from the seller (Megan) on favourable terms to be agreed." Leo pays the £200,000 and takes over the café. When he tries to exercise the option, Megan refuses to negotiate. Leo argues the contract is binding and the court should imply a reasonable rent for the storage unit.\nWhich of the following best describes the status of the option clause?""",
                    "options": [
                        {"label": "A", "text": "The clause is binding and enforceable. The court will imply a term that the rent shall be a reasonable market rent, as the parties demonstrated an intention to be bound."},
                        {"label": "B", "text": "The clause is binding, but only as an agreement to negotiate, which Megan has breached by refusing to negotiate."},
                        {"label": "C", "text": "The clause is void for uncertainty because 'favourable terms' are too vague and no objective criteria exist to determine them."},
                        {"label": "D", "text": "The clause is severable from the main contract. The sale of the business is binding, but the option is not."},
                        {"label": "E", "text": "The clause constitutes a conditional contract, which only becomes binding once the parties themselves agree on the 'favourable terms'."}
                    ],
                    "correct_answer": "C",
                    "explanation": "Phrases such as 'on favourable terms' are usually too vague to be enforced, as there is no objective standard by which a court can determine what is 'favourable' (Bushwall Properties Ltd v Vortex Properties Ltd). The court will not make a contract for the parties by implying a reasonable term where the language used is inherently uncertain. The main sale contract may be binding, but this specific clause is likely void.",
                    "difficulty": "medium"
                },
                {
                    "id": 14,
                    "title": "",
                    "text": """Two companies, Alpha Ltd and Beta Ltd, enter into a joint venture agreement. A dispute arises. The contract contains a dispute resolution clause which states: "In the event of any dispute, the parties shall refer the matter to arbitration. The arbitrator shall resolve the dispute fairly and equitably, taking into account the spirit of the agreement and the parties' long-term relationship." Beta Ltd commences court proceedings, arguing the arbitration clause is too uncertain to be enforceable.\nIs the arbitration clause valid?""",
                    "options": [
                        {"label": "A", "text": "No, because it fails to specify a named arbitrator or a clear appointing mechanism, rendering it incomplete."},
                        {"label": "B", "text": "No, because the instructions to the arbitrator ('fairly and equitably', 'spirit of the agreement') are too vague and non-legal to constitute an enforceable mandate."},
                        {"label": "C", "text": "Yes, because arbitration clauses are presumed valid and the court will strive to uphold them."},
                        {"label": "D", "text": "Yes, but only if the parties can subsequently agree on the identity of the arbitrator. If they cannot, the clause fails."},
                        {"label": "E", "text": "No, because it ousts the jurisdiction of the court without providing a certain and binding alternative."}
                    ],
                    "correct_answer": "C",
                    "explanation": "The courts generally favour arbitration and will strive to uphold arbitration clauses. A clause referring disputes to arbitration to be decided 'fairly and equitably' or as an 'amiables compositeurs' can be valid, as it provides a workable method for dispute resolution (Halifax Financial Services Ltd v Intuitive Systems Ltd). The lack of an appointing mechanism can be remedied by the court under the Arbitration Act 1996. The clause is not void for uncertainty.",
                    "difficulty": "medium"
                },
                {
                    "id": 15,
                    "title": "",
                    "text": """Vincent is negotiating the sale of his company to Zoe's investment firm. On 1st June, they sign an agreement which states: "In consideration of Zoe incurring due diligence costs, Vincent agrees that he will not negotiate with any other potential purchaser for a period of 4 weeks from this date." The agreement does not specify a price or other key terms for the sale itself. Two weeks later, Vincent receives a better offer and signs a sale agreement with a third party. Zoe sues for breach of the 1st June agreement.\nIs the 1st June agreement enforceable?""",
                    "options": [
                        {"label": "A", "text": "No, because it is merely an agreement to negotiate the sale, which is inherently uncertain and unenforceable."},
                        {"label": "B", "text": "Yes, it is a valid lock-out agreement."},
                        {"label": "C", "text": "No, because the consideration expressed (Zoe incurring costs) is past consideration and therefore invalid."},
                        {"label": "D", "text": "Yes, but only if the court can imply a term that Vincent must negotiate in good faith with Zoe during the 4-week period."},
                        {"label": "E", "text": "No, because it lacks the essential terms of the sale it purports to facilitate, such as price."}
                    ],
                    "correct_answer": "B",
                    "explanation": "A 'lock-out' agreement, where one party promises not to negotiate with others for a fixed period, can be a valid and binding contract if it is supported by consideration and is sufficiently certain (Pitt v PHH Asset Management Ltd). Here, the consideration is Zoe incurring due diligence costs after the agreement. The obligation is certain: a clear negative promise for a defined period. It is distinct from an unenforceable agreement to negotiate (Walford v Miles).",
                    "difficulty": "medium"
                },
                {
                    "id": 16,
                    "title": "",
                    "text": """Sebastian, aged 17, lives independently while studying at college. He needs a new laptop for his course. He enters a computer shop and signs a hire-purchase agreement for a high-end laptop worth £1,500. After making two monthly payments, the laptop is damaged in an accident. Sebastian returns it to the shop, says the contract is voidable due to his minority, and demands a refund of his payments, refusing to pay any more.\nWhat is the legal position regarding Sebastian's liability?""",
                    "options": [
                        {"label": "A", "text": "Sebastian is not liable at all because the contract is void ab initio due to his lack of capacity."},
                        {"label": "B", "text": "Sebastian is liable to pay a reasonable price for the laptop, but only if it was a necessary."},
                        {"label": "C", "text": "Sebastian must continue with the hire-purchase agreement in full, as a laptop is clearly a necessary for a student."},
                        {"label": "D", "text": "Sebastian can avoid the contract entirely and is entitled to a full refund of all payments made, as minors' contracts are voidable at their option."},
                        {"label": "E", "text": "Sebastian is bound by the contract because he misrepresented his age, implying he was 18."}
                    ],
                    "correct_answer": "B",
                    "explanation": "Under the Minors' Contracts Act 1987 and common law, a contract for necessaries is binding on a minor, but only for a reasonable price (Sale of Goods Act 1979, s.3). A laptop may well be a necessary for a student living independently. However, the contract itself (the complex hire-purchase credit agreement) is unlikely to be enforceable as a whole. His liability is likely limited to a reasonable price for the goods, not the credit terms. He is not automatically entitled to a refund of payments made if they do not exceed that reasonable price.",
                    "difficulty": "medium"
                },
                {
                    "id": 17,
                    "title": "",
                    "text": """A 16-year-old aspiring musician, Evie, enters into a three-year management contract with a promoter, Max. The contract obliges Max to find her gigs and take a 20% commission, and obliges Evie not to engage any other manager. After six successful months, Evie decides she no longer likes the direction Max is taking and signs with a new manager. Max sues for breach of contract.\nWhat is the most likely outcome?""",
                    "options": [
                        {"label": "A", "text": "The contract is binding on Evie because it is for her benefit and relates to her education/training as a musician."},
                        {"label": "B", "text": "The contract is voidable at Evie's option. By repudiating it, she has validly avoided it and incurs no further liability."},
                        {"label": "C", "text": "The contract is unenforceable against Evie unless and until she ratifies it upon reaching 18, which she will not do."},
                        {"label": "D", "text": "The contract is binding because Evie has received benefits under it (gigs and income), implying ratification."},
                        {"label": "E", "text": "The contract is analogous to a contract of service and is therefore binding on a minor if, on the whole, it is for their benefit."}
                    ],
                    "correct_answer": "B",
                    "explanation": "Contracts for non-necessaries (which includes most trading and service contracts like management agreements) are voidable at the minor's option. They are valid unless and until repudiated by the minor, either before reaching 18 or within a reasonable time afterwards (Proform Sports Management Ltd v Proactive Sports Management Ltd). By signing with a new manager, Evie has clearly repudiated the original contract. This means she is no longer bound by it for the future, but she may be liable for necessaries actually supplied or for benefits obtained that cannot be returned.",
                    "difficulty": "medium"
                },
                {
                    "id": 18,
                    "title": "",
                    "text": """A community interest company (CIC), "Green Towns Ltd," has a stated object in its articles of association: "To promote urban sustainability projects within the county of Yorkshire." The board of directors enters into a lucrative contract to consult on a large fossil-fuel power station project in Scotland. A shareholder challenges the contract, arguing it is ultra vires.\nWhich of the following statements is correct regarding the effect of the ultra vires doctrine today?""",
                    "options": [
                        {"label": "A", "text": "The contract is void and unenforceable by either party because it falls outside the company's objects."},
                        {"label": "B", "text": "The contract is voidable at the option of the company, but may be enforced by the third party if they acted in good faith."},
                        {"label": "C", "text": "Under the Companies Act 2006, the company's capacity is unlimited, and the doctrine of ultra vires no longer affects the validity of a transaction with a third party."},
                        {"label": "D", "text": "The contract is valid and enforceable, but the directors are in breach of their fiduciary duty to the company."},
                        {"label": "E", "text": "The contract is valid only if it can be shown to indirectly promote the company's objects (e.g., by generating profits for Yorkshire projects)."}
                    ],
                    "correct_answer": "D",
                    "explanation": "Section 39(1) of the Companies Act 2006 provides that the validity of an act done by a company shall not be called into question on the ground of lack of capacity by reason of anything in the company's constitution. Therefore, the ultra vires doctrine is effectively abolished in relation to dealings with third parties. The contract with the third party is valid and enforceable. However, the directors may have acted in excess of their powers (breach of duty), which is a separate, internal matter between the directors and the company.",
                    "difficulty": "medium"
                },
                {
                    "id": 19,
                    "title": "",
                    "text": """Arthur, who suffers from periods of severe dementia, enters a contract to sell a valuable antique vase from his collection to Beatrice for £5,000. At the time of signing the contract, a medical report later confirms, Arthur did not understand the nature of the transaction. Beatrice was unaware of his condition and the price agreed was the full market value. Arthur's nephew, who holds power of attorney, seeks to set the contract aside.\nCan the contract be set aside?""",
                    "options": [
                        {"label": "A", "text": "No, because Beatrice contracted in good faith, for fair value, and had no notice of Arthur's incapacity."},
                        {"label": "B", "text": "Yes, because if a person lacks mental capacity at the time of contracting, the contract is void ab initio."},
                        {"label": "C", "text": "Yes, the contract is voidable at the option of Arthur or his representative, unless it was for necessaries or has been ratified during a lucid interval."},
                        {"label": "D", "text": "No, because contracts for the sale of goods are binding if the goods have been delivered, which they have not been here."},
                        {"label": "E", "text": "Yes, but only if the court finds the transaction was unconscionable, taking advantage of Arthur's condition."}
                    ],
                    "correct_answer": "C",
                    "explanation": "A contract made by a person who lacks mental capacity is voidable, not void, at that person's option (Imperial Loan Co v Stone). It can be set aside provided the other party knew or ought to have known of the incapacity. If the other party (Beatrice) acted in good faith, for fair value, and without notice, the contract may be upheld. However, the right to avoid generally remains, but the court's discretion in granting restitution may be affected by the other party's good faith. The representative can avoid it on Arthur's behalf.",
                    "difficulty": "medium"
                },
                {
                    "id": 20,
                    "title": "",
                    "text": """At an office Christmas party, Nigel, who has consumed a considerable amount of alcohol, agrees to sell his luxury sports car to his colleague, Patricia, for £25,000 (its market value is approximately £45,000). They scribble the terms on a napkin and both sign it. The next morning, Nigel has no memory of the event. Upon being reminded, he immediately repudiates the agreement. Patricia wants to enforce it.\nIs the contract enforceable?""",
                    "options": [
                        {"label": "A", "text": "Yes, because Nigel's intoxication was self-induced and does not affect his capacity to contract."},
                        {"label": "B", "text": "No, because Nigel was too intoxicated to understand the transaction, rendering the contract void."},
                        {"label": "C", "text": "The contract is voidable at Nigel's option, provided he repudiates it as soon as he is sober enough to understand what happened."},
                        {"label": "D", "text": "Yes, but only if Patricia can prove that Nigel appeared rational and she had no reason to suspect his incapacity."},
                        {"label": "E", "text": "No, because the consideration was grossly inadequate, which combined with the intoxication makes the contract unconscionable."}
                    ],
                    "correct_answer": "C",
                    "explanation": "A contract made by a person so intoxicated as not to understand the nature of the transaction is voidable at that person's option, provided they repudiate it within a reasonable time of becoming sober and regaining understanding (Porter v Latec Finance). The contract is not automatically void. The right to avoid may be lost if the other party (Patricia) had no reason to suspect the intoxication and if restitution cannot be made, but the gross inadequacy of the price may be relevant to whether Patricia ought to have suspected incapacity. Nigel's immediate repudiation is key.",
                    "difficulty": "medium"
                }
            ]
            print("-> Patched Contract Law Section A with 20 new questions")
            
            # =====================================================
            # Patch Contract Law Section B - Privity of Contract and Rights of Third Parties
            # =====================================================
            area_b = next((a for a in contract_topic["areas"] if a["letter"] == "B"), None)
            if area_b:
                area_b["name"] = "Privity of Contract and Rights of Third Parties"
                area_b["slug"] = "b-privity-of-contract"
                area_b["question_count"] = 9
            else:
                area_b = {
                    "letter": "B",
                    "name": "Privity of Contract and Rights of Third Parties",
                    "slug": "b-privity-of-contract",
                    "question_count": 9,
                    "questions": []
                }
                contract_topic["areas"].insert(1, area_b)
            
            area_b["questions"] = [
                {
                    "id": 1,
                    "title": "",
                    "text": """David promises his son, Ethan, that he will pay Ethan's university tuition fees directly to the university. To secure this promise, Ethan's mother, Fiona, enters into a formal agreement with David whereby Fiona agrees to pay David a monthly sum for two years. David fails to make the tuition payments when they fall due. Ethan, who is not a party to the agreement between David and Fiona, wishes to sue David for breach of contract.\nCan Ethan successfully enforce David's promise to pay the tuition fees?""",
                    "options": [
                        {"label": "A", "text": "Yes, because he is the intended beneficiary of the contract and would have provided consideration through his mother's payments."},
                        {"label": "B", "text": "Yes, under the Contracts (Rights of Third Parties) Act 1999, as the term purports to confer a benefit on him."},
                        {"label": "C", "text": "No, because of the doctrine of privity of contract; Ethan is not a party to the agreement between David and Fiona."},
                        {"label": "D", "text": "Yes, under the common law exception for contracts made for the benefit of a family member."},
                        {"label": "E", "text": "No, unless Fiona assigns her right of action to Ethan."}
                    ],
                    "correct_answer": "C",
                    "explanation": "The fundamental doctrine of privity of contract stipulates that a contract cannot confer rights or impose obligations on a person who is not a party to it. Ethan is a stranger to the contract between David and Fiona. The Contracts (Rights of Third Parties) Act 1999 does not apply automatically; it would only apply if the contract expressly provided that Ethan could enforce the term or if the term purported to confer a benefit on him and did not indicate a contrary intention. On these bare facts, the common law privity rule applies, blocking Ethan's claim (Tweedle v Atkinson).",
                    "difficulty": "medium"
                },
                {
                    "id": 2,
                    "title": "",
                    "text": """A logistics company, "QuickMove Ltd," enters a contract with "Warehouse Co" for storage services. Clause 12 of the contract states: "Warehouse Co shall maintain insurance for the benefit of QuickMove Ltd and for the benefit of any customer of QuickMove Ltd whose goods are stored hereunder. Any such customer may enforce this clause as if they were a party to this agreement." A customer, "Fragile Imports Ltd," has its goods damaged while in Warehouse Co's custody due to inadequate insurance coverage. Fragile Imports Ltd seeks to sue Warehouse Co directly under Clause 12.\nIs Fragile Imports Ltd likely to succeed?""",
                    "options": [
                        {"label": "A", "text": "No, because Fragile Imports Ltd provided no consideration to Warehouse Co."},
                        {"label": "B", "text": "Yes, because the contract expressly identifies customers as a class of persons entitled to enforce the clause."},
                        {"label": "C", "text": "No, because Fragile Imports Ltd is not expressly named in the contract."},
                        {"label": "D", "text": "Yes, but only if QuickMove Ltd assigns its rights under the contract to Fragile Imports Ltd."},
                        {"label": "E", "text": "No, because the clause is an exclusion clause which cannot benefit a third party under the 1999 Act."}
                    ],
                    "correct_answer": "B",
                    "explanation": "Section 1(3) of the Contracts (Rights of Third Parties) Act 1999 allows a third party to enforce a term if they are expressly identified in the contract by name, as a member of a class, or answering a particular description. Clause 12 expressly identifies 'any customer of QuickMove Ltd' as a beneficiary with a right of enforcement. Fragile Imports Ltd, as a customer, falls within this class and can therefore enforce the insurance obligation directly, provided the standard conditions under s.1 of the Act are met.",
                    "difficulty": "medium"
                },
                {
                    "id": 3,
                    "title": "",
                    "text": """Olivia hires "BuildRight Ltd" to build an extension on her house, specifying that the new kitchen within the extension is for her elderly mother, Clara, who lives with her. The contract price is £50,000. BuildRight's work is defective, causing the kitchen to be unusable. Clara is greatly inconvenienced and has to eat pre-prepared meals at extra cost. Olivia sues BuildRight for breach of contract. She seeks to recover, amongst other things, damages for Clara's inconvenience and extra meal costs.\nCan Olivia recover damages for the loss suffered by Clara?""",
                    "options": [
                        {"label": "A", "text": "No, because Clara's loss is not Olivia's loss; Olivia can only recover for her own financial loss."},
                        {"label": "B", "text": "Yes, under the principle established in Jackson v Horizon Holidays, where a party can recover for the disappointment of others where the contract was for their benefit."},
                        {"label": "C", "text": "No, because Clara is a third party and only she can sue for her own loss."},
                        {"label": "D", "text": "Yes, but only if Olivia held the contractual right on trust for Clara."},
                        {"label": "E", "text": "No, unless Olivia can prove she has a legal obligation to reimburse Clara for the extra costs."}
                    ],
                    "correct_answer": "A",
                    "explanation": "The general rule is that a claimant can only recover damages for their own loss. The controversial decision in Jackson v Horizon Holidays (which allowed recovery for family disappointment) has been narrowly interpreted and is of doubtful general application, especially in a commercial context like this. The House of Lords in Woodar Investment Development Ltd v Wimpey Construction Ltd disapproved of its broad use. Olivia's primary loss is the cost of rectifying the defective work or the diminished value of her property. Clara's personal inconvenience and expenses are her own loss, for which Olivia cannot claim unless she has a legal liability to indemnify Clara (Alfred McAlpine Construction Ltd v Panatown Ltd).",
                    "difficulty": "hard"
                },
                {
                    "id": 4,
                    "title": "",
                    "text": """A software developer, "CodeCraft," contracts with "BizSolutions" to create a custom inventory system. The contract includes a term that the final software will be licensed to BizSolutions and also to "RetailPro Ltd," a key business partner of BizSolutions, at a fixed annual fee. The contract is silent on variation. After the contract is signed but before the software is delivered, CodeCraft and BizSolutions agree to a variation that doubles the annual license fee for RetailPro Ltd. RetailPro Ltd objects when informed of the new fee.\nCan CodeCraft and BizSolutions validly vary the contract to increase RetailPro Ltd's fee?""",
                    "options": [
                        {"label": "A", "text": "Yes, because the doctrine of privity means only the parties to the main contract can vary it."},
                        {"label": "B", "text": "No, because once a third-party right has arisen, it cannot be withdrawn or varied without their consent."},
                        {"label": "C", "text": "Yes, but only if the original contract expressly reserved the right for the parties to vary the term without the third party's consent."},
                        {"label": "D", "text": "No, because RetailPro Ltd has already relied on the promise by planning its budget."},
                        {"label": "E", "text": "It depends on whether RetailPro Ltd has communicated its assent to the original term to CodeCraft."}
                    ],
                    "correct_answer": "C",
                    "explanation": "Section 2 of the Contracts (Rights of Third Parties) Act 1999 governs this. The parties to the contract may not, by agreement, vary or rescind the contract so as to extinguish or alter the third party's entitlement after the third party's right has crystallised. A right crystallises when the third party has communicated assent to the term to the promisor, or the promisor is aware that the third party has relied on the term, or the promisor reasonably should have foreseen such reliance. However, the contract may include an express provision allowing the parties to vary or rescind without the third party's consent (s.2(3)). Here, the contract is silent, so the default protective rules of s.2(1) would apply once RetailPro's rights have crystallised.",
                    "difficulty": "medium"
                },
                {
                    "id": 5,
                    "title": "",
                    "text": """"SafeGuard Insurers" enters a liability insurance contract with "Risky Operations Ltd," covering claims from members of the public. The contract includes an exclusion clause stating that coverage is void if Risky Operations fails to conduct monthly safety audits. The contract also states, pursuant to the 1999 Act, that any injured member of the public may enforce the insurance cover. Risky Operations misses a monthly audit. Subsequently, a member of the public, Noah, is injured and sues Risky Operations. Noah seeks to enforce the insurance contract directly against SafeGuard Insurers.\nCan SafeGuard rely on the breach of the audit clause as a defence against Noah?""",
                    "options": [
                        {"label": "A", "text": "No, because the defence is only available against the contracting party, Risky Operations."},
                        {"label": "B", "text": "Yes, because SafeGuard may raise against Noah, any defence that would have been available against the Risky Operations."},
                        {"label": "C", "text": "No, because exclusion clauses cannot be enforced against third parties."},
                        {"label": "D", "text": "Yes, but only if Noah was aware of the audit clause at the time of his injury."},
                        {"label": "E", "text": "No, because the breach of the audit clause occurred before Noah's injury and is irrelevant."}
                    ],
                    "correct_answer": "B",
                    "explanation": "Section 3(2) of the Contracts (Rights of Third Parties) Act 1999 is clear: the promisor (SafeGuard) can avail itself against the third party (Noah) of any defence or set-off arising from the contract that would have been available against the promisee (Risky Operations). This ensures that the promisor's position is not worsened by the third party's enforcement. The failure to conduct the audit is a breach by Risky Operations that would allow SafeGuard to deny coverage. This defence can be raised against Noah.",
                    "difficulty": "medium"
                },
                {
                    "id": 6,
                    "title": "",
                    "text": """A shipowner, "OceanCarrier," charters its vessel to "MegaFreight Ltd." The charterparty contract includes a clause granting "all concerned in the cargo" the benefit of an exclusion clause limiting OceanCarrier's liability. The contract also states: "Nothing in this contract is intended to confer any right of enforcement on any third party pursuant to the Contracts (Rights of Third Parties) Act 1999." A cargo owner, whose goods are damaged, seeks to rely on the exclusion clause as a third party.\nCan the cargo owner enforce the exclusion clause?""",
                    "options": [
                        {"label": "A", "text": "No, because the contract contains a valid exclusion of the 1999 Act."},
                        {"label": "B", "text": "Yes, because the clause clearly purports to confer a benefit on 'all concerned in the cargo,' and the 1999 Act exclusion is ineffective."},
                        {"label": "C", "text": "Yes, but only under the common law rules relating to Himalaya clauses."},
                        {"label": "D", "text": "No, because 'all concerned in the cargo' is too vague to identify a third party."},
                        {"label": "E", "text": "Yes, because exclusion clauses benefiting third parties are an exception to the privity rule."}
                    ],
                    "correct_answer": "C",
                    "explanation": "This scenario deals with a classic 'Himalaya' clause. Section 6(5) of the 1999 Act specifically provides that the Act does not affect any right of a third party to rely on an exclusion or limitation clause which is enforceable under the common law. The common law has developed mechanisms (through agency or bailment principles) to allow such clauses to protect third parties like stevedores or cargo interests (The Eurymedon). The parties' exclusion of the 1999 Act does not affect these pre-existing common law rights. Therefore, the cargo owner may still seek to rely on the clause under common law principles.",
                    "difficulty": "hard"
                },
                {
                    "id": 7,
                    "title": "",
                    "text": """Arthur contracts with "Landscape Designs Ltd" to completely redesign and maintain the garden of a cottage owned by his sister, Beatrice, as a gift to her. The contract price is £20,000, paid by Arthur. The work is done negligently, and all the new plants die. Beatrice is very distressed. Arthur sues Landscape Designs Ltd.\nWhat damages can Arthur recover?""",
                    "options": [
                        {"label": "A", "text": "Only the £20,000 he paid, as this is his financial loss."},
                        {"label": "B", "text": "Damages for the cost of rectification to the garden, even though Beatrice owns the property."},
                        {"label": "C", "text": "Damages for Beatrice's distress and disappointment."},
                        {"label": "D", "text": "Nothing, because only Beatrice, as the owner of the property, has suffered the loss."},
                        {"label": "E", "text": "Only nominal damages, as he has suffered no personal loss."}
                    ],
                    "correct_answer": "B",
                    "explanation": "Where a contracting party (Arthur) has suffered no direct personal financial loss because the loss falls on a third party (Beatrice), the traditional rule caused problems. However, a significant exception exists where the contracting party has a 'special interest' in performance, typically where they own or possess the property, or have made the contract for their own benefit. Here, Arthur paid for the service and had a genuine interest in seeing it performed for his sister's benefit. Following principles in cases like Woodar v Wimpey and Alfred McAlpine v Panatown, Arthur can recover substantial damages (the cost of cure or diminished value) because he is the promisee and is not merely suing for a third party's loss. He is suing for the failure to provide the service he paid for.",
                    "difficulty": "hard"
                },
                {
                    "id": 8,
                    "title": "",
                    "text": """A contract between "TechSupplier" and "IT Integrator Co" includes a term granting "the End-User Client identified in Schedule A" the right to receive technical support directly from TechSupplier. Schedule A lists "Global Bank" as the End-User Client. The contract is silent on the need for communication of assent. Global Bank is unaware of this clause. When a system fails, Global Bank contacts TechSupplier directly for support, but TechSupplier refuses, stating Global Bank is not its client.\nCan Global Bank enforce the support clause?""",
                    "options": [
                        {"label": "A", "text": "No, because it has not communicated its assent to the term to TechSupplier as required by s.2(1) of the 1999 Act."},
                        {"label": "B", "text": "Yes, because it is expressly identified by name in the contract, so its right arose upon formation."},
                        {"label": "C", "text": "No, because the contract did not expressly state that Global Bank could enforce the term."},
                        {"label": "D", "text": "Yes, but only if IT Integrator Co assigns its rights to Global Bank."},
                        {"label": "E", "text": "No, because Global Bank provided no consideration to TechSupplier."}
                    ],
                    "correct_answer": "B",
                    "explanation": "Under s.1(3) of the 1999 Act, a third party is 'expressly identified' if named in the contract. Global Bank is named in Schedule A. Section 2(1) discusses the crystallisation of rights for the purpose of variation/revocation, but the right itself is conferred by s.1. Communication of assent is relevant to when the right becomes irrevocable (s.2), not to its initial existence. Therefore, Global Bank's right to enforce the support term exists from the contract's formation, even without communication, unless the contract made the right conditional on communication.",
                    "difficulty": "medium"
                },
                {
                    "id": 9,
                    "title": "",
                    "text": """Liam and Jacob jointly borrow £10,000 from a bank, signing a loan agreement as co-borrowers. The agreement states they are "jointly and severally liable." Jacob disappears without paying his share. The bank demands the full £10,000 from Liam. Liam pays it. Liam then seeks to recover £5,000 from Jacob's brother, Hugo, to whom Jacob had previously written a note saying, "If I default on my loan, I'll get Hugo to cover half."\nCan Liam recover the £5,000 from Hugo?""",
                    "options": [
                        {"label": "A", "text": "Yes, because Hugo's promise to Jacob makes him liable for half the debt."},
                        {"label": "B", "text": "No, because of privity of contract; Hugo was not a party to the loan agreement."},
                        {"label": "C", "text": "Yes, under the Civil Liability (Contribution) Act 1978, as Hugo is a concurrent wrongdoer."},
                        {"label": "D", "text": "No, but Liam can claim a contribution from Jacob if he can be found."},
                        {"label": "E", "text": "Yes, because Jacob's note created a trust in favour of Liam for half the debt."}
                    ],
                    "correct_answer": "B",
                    "explanation": "This is a straightforward application of privity. The loan contract is between the bank and the joint borrowers (Liam & Jacob). Hugo is not a party to it. His separate promise to Jacob is a separate matter between them and does not create any obligation towards Liam. Liam's remedy, having paid the whole debt, is to seek a contribution from his co-debtor, Jacob, based on their internal relationship or the law of restitution. He has no contractual claim against Hugo.",
                    "difficulty": "easy"
                }
            ]
            print("-> Patched Contract Law Section B with 9 new questions")
            
            # =====================================================
            # Patch Contract Law Section C - Contract Terms
            # =====================================================
            area_c = next((a for a in contract_topic["areas"] if a["letter"] == "C"), None)
            if area_c:
                area_c["name"] = "Contract Terms"
                area_c["slug"] = "c-contract-terms"
                area_c["question_count"] = 19
            else:
                area_c = {
                    "letter": "C",
                    "name": "Contract Terms",
                    "slug": "c-contract-terms",
                    "question_count": 19,
                    "questions": []
                }
                contract_topic["areas"].insert(2, area_c)
            
            area_c["questions"] = [
                {
                    "id": 1,
                    "title": "",
                    "text": """Benjamin is purchasing a commercial printing press from Sarah. The written contract, which both parties sign, specifies the model, price, and delivery date. During negotiations, Sarah had orally promised that the press would be compatible with Benjamin's existing software and that her technician would provide a full day's training. These promises do not appear in the written contract. The press is delivered on time but is incompatible with the software, and no training is provided. Benjamin sues for breach of contract, relying on the oral promises.\nWhich of the following is the strongest argument for Sarah's defence?""",
                    "options": [
                        {"label": "A", "text": "The oral promises are binding collateral contracts, supported by Benjamin entering the main contract."},
                        {"label": "B", "text": "The parol evidence rule prevents Benjamin from adducing evidence of the oral promises to add to the written contract."},
                        {"label": "C", "text": "The oral promises are unenforceable as they were made before the contract was signed."},
                        {"label": "D", "text": "The court will imply a term of satisfactory quality under the Sale of Goods Act 1979, making the oral promises irrelevant."},
                        {"label": "E", "text": "The oral promises are enforceable if Benjamin can prove they were a decisive factor in him entering the contract."}
                    ],
                    "correct_answer": "B",
                    "explanation": "The parol evidence rule presumes that a written contract is the entire agreement between the parties. Evidence of prior oral negotiations cannot generally be admitted to add to, vary, or contradict the written terms (Jacobs v Batavia and General Plantations Trust). While there are exceptions (e.g., for collateral contracts or to establish a custom), the starting point is that the written document contains the full contractual terms. Sarah's strongest defence is to invoke this rule.",
                    "difficulty": "medium"
                },
                {
                    "id": 2,
                    "title": "",
                    "text": """Amanda signs a 12-page equipment lease agreement with "OfficeLease Ltd" without reading it. Clause 14, in small but clear print on page 10, states: "The Lessee agrees to indemnify the Lessor for all legal costs incurred in enforcing this agreement, regardless of outcome." Amanda falls behind on payments. OfficeLease Ltd sues and, having won, seeks full legal costs from Amanda under Clause 14. Amanda argues she should not be bound by a clause she did not read.\nIs Amanda bound by Clause 14?""",
                    "options": [
                        {"label": "A", "text": "No, because the clause was not brought to her attention reasonably, being in small print."},
                        {"label": "B", "text": "Yes, because she signed the document, and in the absence of misrepresentation, she is bound by its terms."},
                        {"label": "C", "text": "No, because an indemnity for costs is an onerous term requiring special notice."},
                        {"label": "D", "text": "Yes, but only if OfficeLease Ltd can prove they highlighted the clause before she signed."},
                        {"label": "E", "text": "No, because the clause is an unfair penalty and therefore unenforceable."}
                    ],
                    "correct_answer": "B",
                    "explanation": "The general rule from L'Estrange v F Graucob Ltd is that a party who signs a document is bound by its terms, whether they have read them or not, in the absence of fraud or misrepresentation. This is a strict application of the objective principle. The fact that the term is onerous or in small print does not, by itself, prevent incorporation by signature.",
                    "difficulty": "easy"
                },
                {
                    "id": 3,
                    "title": "",
                    "text": """Nina, a freelance graphic designer, has completed 15 projects for "Creatify Ltd" over two years. For each project, Creatify emailed a standard purchase order. The reverse of the printed version of this form (which Nina rarely printed) contained terms, including a clause limiting liability for late delivery to a refund of the fee. Nina never expressly agreed to these printed terms but always started work upon receiving the email, which did not attach the full terms. On the 16th project, Nina delivers late. Creatify seeks to rely on the limitation clause.\nIs the limitation clause incorporated into the contract?""",
                    "options": [
                        {"label": "A", "text": "Yes, because a consistent course of dealing over 15 projects is sufficient to incorporate the terms."},
                        {"label": "B", "text": "No, because the terms were never actually provided to Nina in the emails that formed the basis of each transaction."},
                        {"label": "C", "text": "Yes, because Nina, as a businessperson, should have known standard terms would apply."},
                        {"label": "D", "text": "No, unless Creatify can prove Nina had actual knowledge of the printed terms."},
                        {"label": "E", "text": "Yes, but only if the email explicitly stated that the order was subject to the terms on the reverse of the standard form."}
                    ],
                    "correct_answer": "B",
                    "explanation": "Incorporation by a previous course of dealing requires consistency and regularity, and the terms must have been knowingly received in the past (McCutcheon v David MacBrayne Ltd). Here, the course of dealing was based on emails that did not include the terms. The fact that a printed version existed is irrelevant if it was not the document consistently used to form the contracts. Therefore, there is insufficient evidence that the terms were part of the parties' established routine.",
                    "difficulty": "medium"
                },
                {
                    "id": 4,
                    "title": "",
                    "text": """Tom hires a barge from Riverways Ltd to transport his machinery from London to Oxford. The contract is silent on the barge's fitness for the journey. The barge sets off but becomes stuck in a shallow, rarely used section of the canal, causing significant delay and damage. It transpires the barge has a deeper draft than is suitable for the full route. Tom claims Riverways breached an implied term that the barge was reasonably fit for its purpose.\nWill the court imply such a term?""",
                    "options": [
                        {"label": "A", "text": "No, because the contract was silent, and the parties are sophisticated enough to have included such a term if desired."},
                        {"label": "B", "text": "Yes, under the 'officious bystander' test, as it is so obvious it goes without saying."},
                        {"label": "C", "text": "Yes, under the 'business efficacy' test as such a term is necessary to make the contract work."},
                        {"label": "D", "text": "No, because the risk of unsuitable canals is a normal commercial risk Tom accepted."},
                        {"label": "E", "text": "Yes, but only if Tom can prove he made his specific purpose known to Riverways at the time of contracting."}
                    ],
                    "correct_answer": "C",
                    "explanation": "The common law can imply a term to give business efficacy to a contract where it is necessary to make it work as intended by the parties (The Moorcock). Here, the central purpose of the contract is transportation. A term that the barge must be reasonably fit for the agreed route is necessary for that purpose. The 'officious bystander' test (Option B) is an alternative formulation, but The Moorcock's business efficacy test is the classic authority for such implied terms in commercial contracts.",
                    "difficulty": "medium"
                },
                {
                    "id": 5,
                    "title": "",
                    "text": """Clara buys a new "UltraClean" dishwasher from an electronics retailer. The sales brochure states it has a "super-quiet operation." At home, Clara finds it is very noisy. An engineer confirms it is working within normal technical parameters but admits it is louder than competing models. Clara rejects the dishwasher, claiming it is not of satisfactory quality under the Sale of Goods Act 1979.\nWhich of the following is the MOST relevant factor in determining if the dishwasher is of "satisfactory quality"?""",
                    "options": [
                        {"label": "A", "text": "Whether the noise level makes the dishwasher unfit for its basic purpose of washing dishes."},
                        {"label": "B", "text": "Whether the retailer knew or should have known about the noise level."},
                        {"label": "C", "text": "The description applied to the goods, including the 'super-quiet' claim in the brochure."},
                        {"label": "D", "text": "The price paid for the dishwasher relative to other models."},
                        {"label": "E", "text": "Whether a reasonable person would find the noise level acceptable."}
                    ],
                    "correct_answer": "C",
                    "explanation": "Under s.14(2) of the Sale of Goods Act 1979, the standard of satisfactory quality includes fitness for common purposes, appearance and finish, freedom from minor defects, safety, and durability. Critically, under s.14(2B), any public statements about the specific characteristics of the goods made by the seller, producer, or their representative (e.g., in advertising) are a relevant circumstance. The 'super-quiet' claim is a public statement about a specific characteristic and is central to the assessment of quality (R&B Customs Brokers Co Ltd v United Dominions Trust Ltd).",
                    "difficulty": "medium"
                },
                {
                    "id": 6,
                    "title": "",
                    "text": """Daniel hires "ProFix," a specialist IT contractor, to recover data from a crashed server. The contract states a fixed fee but is silent on the standard of service. ProFix works on the server but accidentally corrupts the only backup drive, making all data permanently unrecoverable. Daniel refuses to pay and sues for the value of the lost data.\nWhat is ProFix's likely liability, assuming no exclusion clause?""",
                    "options": [
                        {"label": "A", "text": "ProFix is not liable; they only promised to attempt recovery, not guarantee success."},
                        {"label": "B", "text": "ProFix is liable only for a refund of their fee, as the contract was for a fixed fee."},
                        {"label": "C", "text": "ProFix is liable for breach of an implied term under the Supply of Goods and Services Act 1982 to perform the service with reasonable care and skill."},
                        {"label": "D", "text": "ProFix is only liable if Daniel can prove gross negligence."},
                        {"label": "E", "text": "ProFix is not liable because data loss is a foreseeable risk Daniel accepted."}
                    ],
                    "correct_answer": "C",
                    "explanation": "Under s.13 of the Supply of Goods and Services Act 1982, a term is implied into a contract for the supply of a service that the supplier will carry out the service with reasonable care and skill. Corrupting the only backup drive is a clear failure to exercise reasonable care and skill. Liability is not limited to a refund of the fee; Daniel can claim damages for the consequential loss (the value of the data), subject to rules on remoteness.",
                    "difficulty": "medium"
                },
                {
                    "id": 7,
                    "title": "",
                    "text": """A storage company's contract with a customer includes: "The Company's liability for loss or damage to goods is limited to £100 per item stored." A fire, caused by the storage company's employee's negligence, destroys the customer's painting worth £20,000. The company seeks to limit its liability to £100.\nApplying the common law rule of construction, what is the key question?""",
                    "options": [
                        {"label": "A", "text": "Whether the clause is reasonable under the Unfair Contract Terms Act 1977."},
                        {"label": "B", "text": "Whether the wording of the clause, as a matter of ordinary language, is wide enough to cover liability for negligence."},
                        {"label": "C", "text": "Whether the customer had sufficient notice of the clause before the contract was made."},
                        {"label": "D", "text": "Whether the employee's act constituted gross negligence, which cannot be excluded."},
                        {"label": "E", "text": "Whether the clause is a penalty clause."}
                    ],
                    "correct_answer": "B",
                    "explanation": "Before considering reasonableness or incorporation, the court must construe the clause. The common law rule of construction states that a clause will not be construed as covering liability for negligence unless it does so expressly or by necessary implication (Canada Steamship Lines Ltd v The King). The court must first ask: Does the wording, on its ordinary meaning, extend to the loss caused by negligence? If it does not expressly mention 'negligence,' it must be clear that it applies to that type of liability.",
                    "difficulty": "medium"
                },
                {
                    "id": 8,
                    "title": "",
                    "text": """A gym's standard membership terms, signed by consumer-member Fatima, state: "The gym accepts no liability for any personal injury suffered on the premises, however caused." Fatima slips on a wet floor clearly marked with a warning sign, injuring herself. The wet floor resulted from a leaking pipe the gym management knew about but had not fixed. Fatima sues.\nWhat is the legal status of the clause regarding Fatima's claim for personal injury?""",
                    "options": [
                        {"label": "A", "text": "It is valid and effective, as Fatima signed the contract and warning signs were present."},
                        {"label": "B", "text": "It is void as excluding liability for death or personal injury resulting from negligence is prohibited."},
                        {"label": "C", "text": "Its validity depends on whether it satisfies the requirement of reasonableness under UCTA s.2(2)."},
                        {"label": "D", "text": "It is invalid because it is an unfair term under the Consumer Rights Act 2015."},
                        {"label": "E", "text": "It is valid because the gym's negligence was not the sole cause; Fatima should have seen the sign."}
                    ],
                    "correct_answer": "B",
                    "explanation": "UCTA 1977, s.2(1) states that a person cannot, by reference to any contract term or notice, exclude or restrict liability for death or personal injury resulting from negligence. This is an absolute prohibition in business-to-consumer contracts. The clause attempts to exclude liability for personal injury 'however caused,' which includes negligence. Therefore, it is void in respect of the negligence claim. The Consumer Rights Act 2015 would now apply to consumer contracts, but its Schedule 2, para. 1 contains an equivalent blacklisted term.",
                    "difficulty": "easy"
                },
                {
                    "id": 9,
                    "title": "",
                    "text": """A contract between two businesses, "Builder Ltd" and "Supplier Co," for the supply of roofing materials states: "Supplier Co shall not be liable for any consequential loss, including loss of profit, arising from any defect in the materials." The materials are defective, causing Builder Ltd to delay a project and incur penalty charges from its client. Builder Ltd sues for these losses.\nWhat is the critical factor in determining if the clause is effective?""",
                    "options": [
                        {"label": "A", "text": "Whether Builder Ltd had the opportunity to insure against the loss."},
                        {"label": "B", "text": "Whether the clause was contained in Supplier Co's written standard terms of business."},
                        {"label": "C", "text": "Whether the clause satisfies the requirement of reasonableness."},
                        {"label": "D", "text": "Whether the parties had equal bargaining power."},
                        {"label": "E", "text": "The precise definition of 'consequential loss' in commercial law."}
                    ],
                    "correct_answer": "C",
                    "explanation": "UCTA 1977 applies to business-to-business contracts. Section 3(2)(a) states that where one party deals on the other's written standard terms, they cannot exclude liability for breach except in so far as the term satisfies the requirement of reasonableness. The question of whether the clause is part of standard terms (B) is a threshold issue, but the ultimate test for effectiveness, given UCTA applies, is reasonableness under ss. 3 and 11. Factors like bargaining strength and insurance are relevant to the reasonableness test.",
                    "difficulty": "medium"
                },
                {
                    "id": 10,
                    "title": "",
                    "text": """In a contract for the sale of a ship, it is stated: "The vessel is currently classed with Lloyd's Register. Maintenance of this classification is a condition of this agreement." Two months after delivery, the ship fails its annual survey and loses its classification for three weeks while repairs are made. The buyer wishes to reject the ship and terminate the contract.\nWhat is the legal consequence of breaching a term expressly labelled a "condition"?""",
                    "options": [
                        {"label": "A", "text": "The buyer can always terminate, as labelling a term a condition indicates it is of the essence."},
                        {"label": "B", "text": "The court will ignore the label and assess the seriousness of the breach to decide if termination is allowed."},
                        {"label": "C", "text": "The buyer can terminate only if the breach deprives them of substantially the whole benefit of the contract."},
                        {"label": "D", "text": "The buyer can terminate, as the parties' own classification of the term is decisive (L Schuler AG v Wickman Machine Tool Sales Ltd)."},
                        {"label": "E", "text": "The buyer can terminate only if they have suffered significant financial loss."}
                    ],
                    "correct_answer": "A",
                    "explanation": "Where parties expressly designate a term as a 'condition,' this is strong evidence that they intend any breach of that term, regardless of its actual consequences, to give rise to a right to terminate (L Schuler AG v Wickman Machine Tool Sales Ltd). This provides commercial certainty. The court will generally uphold this intention unless the label is clearly misused. Here, the term is explicitly labelled a condition, so its breach gives the buyer the right to terminate, subject to any possible waiver.",
                    "difficulty": "medium"
                },
                {
                    "id": 11,
                    "title": "",
                    "text": """A contract for the charter of a ship requires it to be "seaworthy on delivery." The ship is delivered with a minor engine defect that causes a 48-hour delay at the start of the charter. The charterer seeks to terminate the contract.\nHow will the court classify the "seaworthiness" term?""",
                    "options": [
                        {"label": "A", "text": "As a warranty, because it relates to the state of the ship."},
                        {"label": "B", "text": "As a condition, because seaworthiness is fundamental to a charter."},
                        {"label": "C", "text": "As an innominate term, where the right to terminate depends on the nature and effect of the breach."},
                        {"label": "D", "text": "As a condition, because any breach relating to safety is fundamental."},
                        {"label": "E", "text": "As a warranty, because the delay was only 48 hours."}
                    ],
                    "correct_answer": "C",
                    "explanation": "The Hongkong Fir Shipping Co Ltd v Kawasaki Kisen Kaisha Ltd case established the category of 'innominate' (or intermediate) terms. For such terms, the remedy for breach is not automatic. The court looks at the consequences of the actual breach. If the breach deprives the innocent party of substantially the whole benefit of the contract, they may terminate; otherwise, only damages are available. Seaworthiness is a classic example of an innominate term; a trivial defect may only justify damages, while a serious one may justify termination.",
                    "difficulty": "medium"
                },
                {
                    "id": 12,
                    "title": "",
                    "text": """A share purchase agreement between two companies contains an "Entire Agreement" clause stating: "This document constitutes the entire agreement between the parties and supersedes all prior representations, negotiations, and understandings." During negotiations, the seller's CEO made detailed oral forecasts about future profits. These forecasts are not repeated in the written agreement. The profits do not materialise, and the buyer claims misrepresentation.\nWhat is the primary effect of the Entire Agreement clause?""",
                    "options": [
                        {"label": "A", "text": "It prevents the buyer from claiming misrepresentation based on the oral forecasts."},
                        {"label": "B", "text": "It is conclusive evidence that there were no pre-contractual representations."},
                        {"label": "C", "text": "It may prevent pre-contractual statements from being raised as contractual terms, but does not automatically exclude liability for misrepresentation."},
                        {"label": "D", "text": "It is ineffective unless reasonable under UCTA 1977."},
                        {"label": "E", "text": "It may prevent pre-contractual statements from being raised as contractual terms, but automatically excludes liability for misrepresentation."}
                    ],
                    "correct_answer": "C",
                    "explanation": "An Entire Agreement clause aims to define the contractual boundaries and prevent pre-contractual statements from being incorporated as terms. However, it does not, by itself, exclude liability for misrepresentation. To do that, the contract would need a separate 'non-reliance' clause or an explicit exclusion clause for misrepresentation, which would then be subject to reasonableness tests under UCTA s.3 (AXA Sun Life Services Plc v Campbell Martin Ltd). The clause here only states it supersedes prior agreements/understandings, not that no representations were made or relied upon.",
                    "difficulty": "medium"
                },
                {
                    "id": 13,
                    "title": "",
                    "text": """An insurance policy taken out by a small business states: "This policy does not cover damage caused by electrical or mechanical breakdown." A fire breaks out due to the overheating of a faulty motor (a mechanical breakdown), causing extensive damage. The insurer denies cover, citing the exclusion clause.\nApplying the contra proferentem rule, how is the clause likely to be interpreted?""",
                    "options": [
                        {"label": "A", "text": "The fire damage is excluded because it was caused by a mechanical breakdown."},
                        {"label": "B", "text": "The fire damage is covered because the clause only excludes the cost of repairing the broken motor itself, not the resultant fire damage."},
                        {"label": "C", "text": "The clause is void for ambiguity."},
                        {"label": "D", "text": "The fire damage is covered because 'breakdown' is too vague a term."},
                        {"label": "E", "text": "The clause must be interpreted in the way most favourable to the drafter (the insurer)."}
                    ],
                    "correct_answer": "B",
                    "explanation": "The contra proferentem rule states that any ambiguity in an exemption or exclusion clause is construed against the party who drafted it (the proferens). The clause excludes 'damage caused by... breakdown.' This is ambiguous: does it mean all damage that results from a breakdown, or only the damage constituting the breakdown itself? Given the ambiguity, the court will interpret it narrowly against the insurer, likely limiting it to the cost of repairing the faulty motor, not the separate, resultant fire damage (Ailsa Craig Fishing Co Ltd v Malvern Fishing Co Ltd).",
                    "difficulty": "medium"
                },
                {
                    "id": 14,
                    "title": "",
                    "text": """Lydia has a two-year contract to supply office stationery to "AccountPlus Ltd" at a fixed price. Due to a sudden spike in paper costs, Lydia tells AccountPlus she can no longer supply at the old price. AccountPlus's manager orally agrees to a 10% price increase for the remaining year to ensure continuity of supply. Lydia continues to deliver. Six months later, a new manager at AccountPlus refuses to pay the increased price, demanding a return to the original contract price.\nIs the oral variation to increase the price binding?""",
                    "options": [
                        {"label": "A", "text": "Yes, because AccountPlus received the practical benefit of continued supply."},
                        {"label": "B", "text": "No, because Lydia was only performing her existing contractual duty, which is not fresh consideration."},
                        {"label": "C", "text": "Yes, because the variation was agreed orally and performed."},
                        {"label": "D", "text": "No, because the variation was not in writing, as required by the original contract's amendment clause."},
                        {"label": "E", "text": "Yes, because AccountPlus's agreement waived its right to insist on the original price."}
                    ],
                    "correct_answer": "A",
                    "explanation": "In Williams v Roffey Bros, the court held that a promise to pay more for the performance of an existing duty can be supported by the 'practical benefit' obtained by the promisor. Here, AccountPlus obtained the practical benefit of securing continued supply from a known supplier, avoiding the hassle and cost of finding a new one. This constitutes sufficient consideration to support the variation promise, making the price increase binding.",
                    "difficulty": "medium"
                },
                {
                    "id": 15,
                    "title": "",
                    "text": """A construction contract requires "GreenBuild Ltd" to complete work by 1st June. By 25th May, it is clear GreenBuild will be at least two weeks late. The client, "HomeOwner Ltd," emails stating: "We note the delay. Please ensure quality is not compromised." HomeOwner Ltd takes no other action. GreenBuild completes on 15th June. HomeOwner Ltd now wishes to terminate the contract and hire a new builder, citing the missed deadline.\nCan HomeOwner Ltd terminate for the delay?""",
                    "options": [
                        {"label": "A", "text": "No, because its email constituted a variation agreeing to a new completion date."},
                        {"label": "B", "text": "Yes, because time remained of the essence, and the email did not expressly waive the deadline."},
                        {"label": "C", "text": "No, because its conduct amounted to a waiver of the right to terminate for that breach."},
                        {"label": "D", "text": "Yes, but only if it can prove it suffered loss from the delay."},
                        {"label": "E", "text": "No, because the delay was only two weeks, which is not a serious breach."}
                    ],
                    "correct_answer": "C",
                    "explanation": "This illustrates the doctrine of waiver by election (or equitable forbearance). Where one party, knowing of a breach that would entitle them to terminate, unequivocally communicates (by words or conduct) an intention to affirm the contract, they lose the right to terminate for that specific breach (Charles Rickards Ltd v Oppenhaim). HomeOwner Ltd's email, urging completion and not reserving its rights, followed by allowing continued performance, likely constitutes an election to affirm, waiving the right to terminate for the 1st June deadline. It can still claim damages for late completion.",
                    "difficulty": "medium"
                },
                {
                    "id": 16,
                    "title": "",
                    "text": """A commercial lease between "Landlord Co" and "Tenant Ltd" contains a clause stating: "This lease may only be varied by an agreement in writing signed by both parties." Over several months, Tenant Ltd consistently pays a reduced rent due to market conditions, and Landlord Co's agent accepts the payments without written agreement. Landlord Co later seeks to recover the full arrears, arguing the variation clause was not complied with.\nCan Tenant Ltd enforce the oral/conduct-based variation?""",
                    "options": [
                        {"label": "A", "text": "No, because the parties' subsequent conduct cannot override a formal variation clause."},
                        {"label": "B", "text": "Yes, because the parties' subsequent conduct can override a formal variation clause."},
                        {"label": "C", "text": "No, because variations to contracts over three years must be in writing under the Law of Property (Miscellaneous Provisions) Act 1989."},
                        {"label": "D", "text": "Yes, because Landlord Co waived the requirement for writing by accepting the reduced payments."},
                        {"label": "E", "text": "No, because consideration was not provided for the reduction in rent."}
                    ],
                    "correct_answer": "B",
                    "explanation": "In MWB v Rock Advertising, the Supreme Court confirmed that a 'no oral modification' (NOM) clause is legally effective. However, it also held that such a clause can itself be varied or waived by subsequent oral agreement or conduct. The parties, by their conduct (offering and accepting reduced rent), may have orally agreed to vary the original contract, including its NOM clause. Therefore, the oral variation could be effective. Option D ('waiver') is a related but distinct concept; the analysis here is one of a new oral agreement that varies the entire contract, including its formalities clause.",
                    "difficulty": "hard"
                },
                {
                    "id": 17,
                    "title": "",
                    "text": """Two companies enter a long-term "joint marketing agreement." It requires them to "co-operate in good faith to promote the joint brand." After a year, Company A launches a very similar competing product with a different partner. Company B claims this breaches the implied duty of good faith.\nIs a duty of good faith generally implied into English commercial contracts?""",
                    "options": [
                        {"label": "A", "text": "Yes, it is a universal term implied by law into all contracts."},
                        {"label": "B", "text": "No, English law does not recognise a general implied duty of good faith in commercial contracts (Mid Essex Hospital Services NHS Trust v Compass Group UK and Ireland Ltd)."},
                        {"label": "C", "text": "Yes, but only in contracts involving a fiduciary relationship."},
                        {"label": "D", "text": "No, unless the contract is one of utmost good faith (uberrimae fidei) like insurance."},
                        {"label": "E", "text": "Yes, but only in relational contracts of long duration, where the court may imply such a duty."}
                    ],
                    "correct_answer": "E",
                    "explanation": "English law is traditionally reluctant to imply a general duty of good faith. However, recent case law, notably Yam Seng Pte Ltd v International Trade Corporation Ltd, has opened the door to implying such a duty in certain 'relational' contracts, long-term agreements requiring a high degree of communication, cooperation, and mutual trust. Whether this particular joint marketing agreement qualifies is fact-sensitive. The express term to 'co-operate in good faith' would likely be enforceable on its own, but the question asks about implied terms. The most accurate general statement is E, reflecting the modern, context-specific approach.",
                    "difficulty": "hard"
                },
                {
                    "id": 18,
                    "title": "",
                    "text": """A contract for the secure storage of confidential documents states the provider will use "industry-standard encryption." A clause excludes liability for "any loss of data." The provider, in a grossly negligent act, leaves the server room unlocked and unguarded, resulting in a physical theft of the server and the loss of all documents.\nCan the provider rely on the exclusion clause?""",
                    "options": [
                        {"label": "A", "text": "No, because the doctrine of fundamental breach prevents a party from relying on an exclusion clause where they have breached a fundamental term."},
                        {"label": "B", "text": "Yes, provided the clause, on its true construction, is wide enough to cover the loss and is reasonable."},
                        {"label": "C", "text": "No, because gross negligence can never be excluded."},
                        {"label": "D", "text": "Yes, because the parties freely allocated this risk by contract."},
                        {"label": "E", "text": "No, because the breach (failure to secure) was different from the loss (theft), so the clause does not apply."}
                    ],
                    "correct_answer": "B",
                    "explanation": "The doctrine of 'fundamental breach' as an automatic rule of law was rejected in Photo Production Ltd v Securicor Transport Ltd. The modern approach is purely one of construction: does the clause, as a matter of language, cover the breach that occurred? If it does, it will be effective unless rendered unenforceable by statute (e.g., UCTA). The fact the breach is serious or negligent is relevant to construction (the court will require clear words to cover such events) and potentially to reasonableness, but it is not an automatic bar.",
                    "difficulty": "hard"
                },
                {
                    "id": 19,
                    "title": "",
                    "text": """Leo, new to the diamond trade in Antwerp, buys a batch of gems from a long-established dealer, Sofia. Their written contract is brief. When a dispute arises, Sofia argues that, by long-standing trade custom in Antwerp, all sales are subject to arbitration by the Diamond Bourse. This custom is not mentioned in their contract. Leo disputes this.\nWhen will a term be implied based on trade custom or usage?""",
                    "options": [
                        {"label": "A", "text": "Only if it is necessary to give business efficacy to the contract."},
                        {"label": "B", "text": "Only if both parties were actually aware of the custom at the time of contracting."},
                        {"label": "C", "text": "If the custom is certain and reasonable, and not contrary to the express terms."},
                        {"label": "D", "text": "Never, if the contract is in writing and appears complete."},
                        {"label": "E", "text": "Only if it is a statutory custom applicable to all trades in that location."}
                    ],
                    "correct_answer": "C",
                    "explanation": "A term can be implied into a contract based on a well-established trade custom or usage. The requirements are that the custom is (1) certain, (2) notorious (widely known in the trade), (3) reasonable, and (4) not inconsistent with the express terms of the contract (Hutton v Warren). It does not require both parties' actual knowledge if it is so notorious that they are presumed to have contracted with reference to it. Actual knowledge (B) can be a basis, but presumed knowledge through notoriety is sufficient.",
                    "difficulty": "medium"
                }
            ]
            print("-> Patched Contract Law Section C with 19 new questions")
            
            # =====================================================
            # Patch Contract Law Section D - Vitiating Factors in Contracts
            # =====================================================
            area_d = next((a for a in contract_topic["areas"] if a["letter"] == "D"), None)
            if area_d:
                area_d["name"] = "Vitiating Factors in Contracts"
                area_d["slug"] = "d-vitiating-factors"
                area_d["question_count"] = 19
            else:
                area_d = {
                    "letter": "D",
                    "name": "Vitiating Factors in Contracts",
                    "slug": "d-vitiating-factors",
                    "question_count": 19,
                    "questions": []
                }
                contract_topic["areas"].insert(3, area_d)
            
            area_d["questions"] = [
                {
                    "id": 1,
                    "title": "",
                    "text": """Sophia is considering buying a small hotel business from Robert. During negotiations, Robert states: "This hotel has a steady annual turnover of around £500,000." Sophia, relying on this statement and without seeking independent verification, agrees to purchase the business for £400,000. After taking over, she discovers the turnover was actually £320,000 for the last two years. Robert genuinely believed his statement was accurate based on figures from his accountant, which turned out to be erroneous.\nWhat is the most likely classification of Robert's statement?""",
                    "options": [
                        {"label": "A", "text": "Fraudulent misrepresentation, as the statement was materially false."},
                        {"label": "B", "text": "Innocent misrepresentation, as Robert honestly believed the statement to be true."},
                        {"label": "C", "text": "Negligent misrepresentation under s.2(1) of the Misrepresentation Act 1967, unless Robert can prove he had reasonable grounds for his belief."},
                        {"label": "D", "text": "A mere sales 'puff' with no legal effect."},
                        {"label": "E", "text": "A statement of opinion, not a statement of fact."}
                    ],
                    "correct_answer": "C",
                    "explanation": "The statement of fact ('turnover of around £500,000') was false and induced Sophia to enter the contract. Under s.2(1) of the Misrepresentation Act 1967, the burden shifts to the representor (Robert) to prove he had reasonable grounds to believe his statement was true. If he cannot discharge this burden (even if he honestly believed it), it is treated as negligent misrepresentation. An honest belief without reasonable grounds is not sufficient to establish innocence.",
                    "difficulty": "medium"
                },
                {
                    "id": 2,
                    "title": "",
                    "text": """During negotiations for the sale of a business, the seller hands the buyer a file of accounts for the last three years. The accounts contain a significant error, overstating profits by 20%. The buyer examines the accounts closely, signs a contract to purchase, and later discovers the error. The seller was unaware of the error.\nWhich of the following is most relevant to whether the seller is liable for misrepresentation?""",
                    "options": [
                        {"label": "A", "text": "Whether the buyer's reliance on the inaccurate accounts was reasonable."},
                        {"label": "B", "text": "Whether the seller made an express statement about the accuracy of the accounts."},
                        {"label": "C", "text": "The principle that silence generally does not constitute a misrepresentation."},
                        {"label": "D", "text": "Whether the error was due to the seller's negligence."},
                        {"label": "E", "text": "The seller's duty to disclose known material facts in a contract uberrimae fidei."}
                    ],
                    "correct_answer": "B",
                    "explanation": "A misrepresentation requires a false statement of fact. The question is whether the seller, by handing over the accounts, made an implied representation as to their accuracy. If the seller made no statement, express or implied, about the figures (e.g., simply handing over documents provided by a third party without endorsing them), there may be no 'statement' to be classified as a misrepresentation. The act of handing over a document can, in context, amount to a representation that it is accurate, but this is what the court must decide.",
                    "difficulty": "medium"
                },
                {
                    "id": 3,
                    "title": "",
                    "text": """In early December, a wine merchant accurately tells a buyer: "This vintage from Château Lalande is currently rated 'excellent' by the leading critics." On this basis, the buyer contracts to purchase 100 cases. By the time the buyer learns of the sale in late January, the wine has been downgraded to 'good' after a new critical review was published a week after the contract was signed. The merchant was unaware of the new review.\nDoes the buyer have a claim for misrepresentation?""",
                    "options": [
                        {"label": "A", "text": "Yes, because the statement was false at the time of the contract's performance."},
                        {"label": "B", "text": "No, because the statement was true when made and there was no change before the contract was concluded."},
                        {"label": "C", "text": "Yes, because the merchant had a duty to update the buyer about any change in the wine's status before delivery."},
                        {"label": "D", "text": "No, because statements of opinion about quality are not actionable."},
                        {"label": "E", "text": "No, because the change occurred after the contract was formed."}
                    ],
                    "correct_answer": "E",
                    "explanation": "While a representor has a duty to correct a statement that was true when made but becomes false before the contract is concluded (With v O'Flanagan), this duty does not extend to changes that occur after the contract is formed. Here, the contract was signed before the new review was published. The statement was true when made and at the time the contract was concluded. There is no continuing duty to update after the contract is executed.",
                    "difficulty": "medium"
                },
                {
                    "id": 4,
                    "title": "",
                    "text": """Annabel is induced by a fraudulent misrepresentation to buy a painting for £10,000. The painting is actually worth £8,000. She sells the painting two weeks later for £7,500 after the art market drops unexpectedly.\nWhat is the measure of damages for fraudulent misrepresentation?""",
                    "options": [
                        {"label": "A", "text": "£2,000 (the difference between price paid and actual value at the time of purchase)."},
                        {"label": "B", "text": "£2,500 (the difference between price paid and the sale price)."},
                        {"label": "C", "text": "Only the price paid minus the actual value at the time of purchase, as further losses are too remote."},
                        {"label": "D", "text": "All losses flowing directly from the transaction, including the market drop, provided it was not broken by an intervening act."},
                        {"label": "E", "text": "The profit Annabel would have made if the representation had been true."}
                    ],
                    "correct_answer": "D",
                    "explanation": "The measure of damages for fraudulent misrepresentation (the tort of deceit) is all direct loss flowing from the transaction, irrespective of foreseeability (Doyle v Olby). The normal remoteness rules do not apply. Therefore, Annabel can potentially recover all her losses, including the subsequent drop in market value, as a consequence of being induced into the transaction by the fraud.",
                    "difficulty": "medium"
                },
                {
                    "id": 5,
                    "title": "",
                    "text": """Oliver is induced by a negligent misrepresentation (under s.2(1) of the Misrepresentation Act 1967) to buy office equipment for £20,000. The equipment is actually worth £15,000. Due to a subsequent and unforeseeable change in technology, the equipment becomes worthless before Oliver can sell it.\nWhat is the measure of damages?""",
                    "options": [
                        {"label": "A", "text": "£5,000 (the difference between price paid and actual value at the time of purchase)."},
                        {"label": "B", "text": "£20,000 (the full price paid, as the equipment is now worthless), as the claimant is entitled to recover all consequential losses."},
                        {"label": "C", "text": "Only £5,000, as unforeseeable losses are not recoverable under the Act."},
                        {"label": "D", "text": "All direct losses flowing from the transaction, equivalent to the measure for fraud."},
                        {"label": "E", "text": "The profit Oliver would have made if he had not entered the contract."}
                    ],
                    "correct_answer": "D",
                    "explanation": "The 'fiction of fraud' under s.2(1) of the Misrepresentation Act 1967 means that damages are assessed as if the misrepresentation were fraudulent, even for a negligent (non-fraudulent) misrepresentation (Royscot Trust Ltd v Rogerson). This includes all direct losses from the transaction, without the usual foreseeability test. Therefore, Oliver may be able to recover for the subsequent loss of value, as it is a direct consequence of entering the transaction.",
                    "difficulty": "hard"
                },
                {
                    "id": 6,
                    "title": "",
                    "text": """After discovering a negligent misrepresentation that induced her to enter a contract, Priya has a choice of remedies. She decides she wants to rescind the contract but also wants compensation for her losses. The other party is a wealthy individual who can easily afford restitution.\nCan Priya both rescind and claim damages?""",
                    "options": [
                        {"label": "A", "text": "No, she must choose between rescission and damages."},
                        {"label": "B", "text": "Yes, damages under s.2(1) and rescission are cumulative remedies."},
                        {"label": "C", "text": "Yes, but only if she claims damages in addition to (not instead of) rescission."},
                        {"label": "D", "text": "No, because damages under s.2(2) are awarded in lieu of rescission, not in addition to it."},
                        {"label": "E", "text": "Yes, but the court will reduce damages to account for any benefits gained from rescission."}
                    ],
                    "correct_answer": "B",
                    "explanation": "Rescission (which returns the parties to their pre-contractual positions) and damages under s.2(1) (which compensate for loss) are available cumulatively. Priya can seek to undo the contract and claim damages for any loss she has suffered. Damages under s.2(2), which are awarded 'in lieu of rescission', would be an alternative to rescission, but s.2(1) damages are a separate right.",
                    "difficulty": "medium"
                },
                {
                    "id": 7,
                    "title": "",
                    "text": """A buyer enters a contract to purchase a vintage car, induced by a negligent misrepresentation about its mileage. He enjoys the car for three years, putting on 30,000 miles, before he discovers the truth. He now seeks to rescind the contract.\nWhat is the most likely bar to rescission?""",
                    "options": [
                        {"label": "A", "text": "Lapse of time."},
                        {"label": "B", "text": "Affirmation of the contract."},
                        {"label": "C", "text": "Impossibility of restitutio in integrum (the car's condition has deteriorated)."},
                        {"label": "D", "text": "The involvement of third-party rights."},
                        {"label": "E", "text": "The buyer's negligence in not discovering the truth sooner."}
                    ],
                    "correct_answer": "C",
                    "explanation": "Rescission requires that the parties be restored to their original positions (restitutio in integrum). After three years of extensive use, the car's value and condition have materially changed. It may be impossible to restore the seller to their original position. This is the classic bar to rescission in such circumstances (Clarke v Dickson). While lapse of time is a factor (and for innocent misrepresentation, time runs from contract not discovery), the key factual bar here is the impossibility of restitution.",
                    "difficulty": "medium"
                },
                {
                    "id": 8,
                    "title": "",
                    "text": """Two parties, A and B, enter a contract for the sale of a specific painting, both believing it to be by a famous artist. After the sale, an expert conclusively proves it is a forgery worth a fraction of the price paid. The provenance documents supplied by B were also forgeries, though B had purchased them in good faith from a deceased dealer.\nWhat type of mistake, if any, might render the contract void?""",
                    "options": [
                        {"label": "A", "text": "Unilateral mistake as to the subject matter."},
                        {"label": "B", "text": "Common mistake as to a fundamental quality of the subject matter."},
                        {"label": "C", "text": "Mutual mistake as to the subject matter's value."},
                        {"label": "D", "text": "No operative mistake, as this is merely a mistake as to value or quality."},
                        {"label": "E", "text": "Mistake as to identity of the subject matter."}
                    ],
                    "correct_answer": "B",
                    "explanation": "Both parties shared the same false assumption about a fundamental quality (the work's authenticity). This is a common mistake. Under the doctrine from Bell v Lever Brothers Ltd, a common mistake as to quality will only render a contract void if it makes the subject matter 'essentially different' from what the parties bargained for. A forged painting by an unknown artist is arguably essentially different from a genuine work by a famous master. However, the courts apply this doctrine very narrowly, so the outcome is uncertain.",
                    "difficulty": "hard"
                },
                {
                    "id": 9,
                    "title": "",
                    "text": """Harry contracts to sell 'my Rolex watch' to Margaret for £5,000. Harry owns two Rolex watches; he intends to sell his older, less valuable one, while Margaret believes she is buying his newer, more valuable model. Neither party is aware of the misunderstanding.\nWhat type of mistake is this?""",
                    "options": [
                        {"label": "A", "text": "A common mistake."},
                        {"label": "B", "text": "A mutual mistake."},
                        {"label": "C", "text": "A unilateral mistake."},
                        {"label": "D", "text": "A mistake as to quality."},
                        {"label": "E", "text": "No operative mistake."}
                    ],
                    "correct_answer": "B",
                    "explanation": "A mutual mistake occurs when the parties are at cross-purposes about the subject matter of the contract, with each party making a different mistake. Neither is aware of the other's mistake. Harry intends one watch; Margaret intends another. The court will try to resolve the ambiguity objectively; if it cannot, the contract may be void for uncertainty (Scriven v Hindley). It is 'mutual' because neither knew of the other's intention.",
                    "difficulty": "medium"
                },
                {
                    "id": 10,
                    "title": "",
                    "text": """Diana sees an advertisement for a luxury watch on a legitimate-looking website. She orders it and provides her credit card details. The website turns out to be a scam operated by a fraudster, Freddie. No watch is ever sent. Meanwhile, Freddie uses the credit card details to purchase goods from a third-party retailer, George.\nDoes a contract exist between Diana and Freddie?""",
                    "options": [
                        {"label": "A", "text": "Yes, a valid contract exists but is voidable for fraud."},
                        {"label": "B", "text": "No, the contract is void for unilateral mistake as to identity."},
                        {"label": "C", "text": "Yes, a contract exists but is unenforceable due to Freddie's fraudulent intent."},
                        {"label": "D", "text": "No, because the offer was not genuine."},
                        {"label": "E", "text": "The contract is void for illegality."}
                    ],
                    "correct_answer": "A",
                    "explanation": "In online or distance transactions where the parties do not deal face-to-face, cases like Shogun Finance Ltd v Hudson suggest a contract can still be formed with the fraudulent party (Freddie) unless the identity of the counterparty was truly fundamental and verifiable. However, for a simple online transaction with a website, there is typically a purported contract between Diana and the entity operating the site. This contract is voidable for fraud, not void for mistake as to identity, because Diana intended to contract with whoever ran the site. The deception goes to the quality/nature of the other party, not to their fundamental identity.",
                    "difficulty": "hard"
                },
                {
                    "id": 11,
                    "title": "",
                    "text": """"ShipWorks Ltd" contracts to repair a named vessel, "The Sea Spray." Unknown to both parties, "The Sea Spray" had sunk and was now lying at the bottom of the ocean at the time the contract was signed.\nWhat is the effect of this mistake?""",
                    "options": [
                        {"label": "A", "text": "The contract is voidable at the option of ShipWorks Ltd."},
                        {"label": "B", "text": "The contract is void for common mistake as to the existence of the subject matter."},
                        {"label": "C", "text": "The contract is valid, and the ship owner must pay for the services anyway."},
                        {"label": "D", "text": "The contract is frustrated."},
                        {"label": "E", "text": "The risk passes according to the common law rule of res perit domino."}
                    ],
                    "correct_answer": "B",
                    "explanation": "Where the subject matter of a contract (res extincta) has ceased to exist at the time of contracting, the contract is void at common law for common mistake. Both parties were operating under a shared fundamental error of fact: they believed the ship existed and could be repaired. This is distinct from frustration, which applies when the subject matter ceases to exist after the contract is formed (Couturier v Hastie).",
                    "difficulty": "easy"
                },
                {
                    "id": 12,
                    "title": "",
                    "text": """A small subcontractor is told by the main contractor that unless the subcontractor agrees to a 25% reduction in fees for remaining work, the main contractor will terminate the relationship and ensure the subcontractor is blacklisted from all future projects in the industry. The subcontractor, fearing for its business, reluctantly agrees. Later, it wishes to set the agreement aside.\nOn what basis might the agreement be set aside?""",
                    "options": [
                        {"label": "A", "text": "Misrepresentation."},
                        {"label": "B", "text": "Duress to the person."},
                        {"label": "C", "text": "Economic duress."},
                        {"label": "D", "text": "Undue influence."},
                        {"label": "E", "text": "Unconscionable bargain."}
                    ],
                    "correct_answer": "C",
                    "explanation": "Economic duress occurs when a party exerts illegitimate economic pressure on another, leaving them with no practical alternative but to comply. The threat to terminate the contract and blacklist the subcontractor is a form of illegitimate pressure, not an ordinary commercial negotiation. The key elements are: (1) illegitimate pressure, (2) causing the victim to enter the contract, and (3) the victim having no realistic alternative. If proved, the contract is voidable (DSND Subsea Ltd v Petroleum Geo-Services ASA).",
                    "difficulty": "medium"
                },
                {
                    "id": 13,
                    "title": "",
                    "text": """After a major dispute, a long-term supplier agrees to a new, less favourable contract with its customer. The supplier later argues the renegotiation was procured by economic duress, as it was told that refusal would lead to immediate termination and ruin. The customer argues it had a lawful right to terminate the old contract for cause.\nWhich factor is MOST critical in determining if economic duress occurred?""",
                    "options": [
                        {"label": "A", "text": "Whether the supplier protested at the time of the renegotiation."},
                        {"label": "B", "text": "Whether the supplier had access to independent legal advice."},
                        {"label": "C", "text": "Whether the customer's threat to terminate was a lawful act or an unlawful one."},
                        {"label": "D", "text": "Whether the supplier had any practical alternative to agreeing to the new terms."},
                        {"label": "E", "text": "Whether the customer was acting in good faith."}
                    ],
                    "correct_answer": "C",
                    "explanation": "A key element of economic duress is the nature of the pressure. A threat to do something the threatener has a legal right to do (e.g., lawful termination) is generally not 'illegitimate' pressure, especially in a commercial context where hard bargaining is expected (Graeme Rutenberg (Builders) Ltd v Hillcourt Homes Ltd). If the customer had a genuine right to terminate for cause, its threat to do so is likely lawful. However, if the threat is dressed up to conceal an improper purpose, illegitimacy may still be found. The analysis starts with the nature of the act threatened.",
                    "difficulty": "hard"
                },
                {
                    "id": 14,
                    "title": "",
                    "text": """An elderly woman, Edith, gifts her entire estate to her carer, Mark, shortly before her death. Her family challenges the gift, arguing undue influence. The relationship was clearly one of trust and confidence.\nWhat is the legal effect of proving a relationship of trust and confidence in such a case?""",
                    "options": [
                        {"label": "A", "text": "It creates an irrebuttable presumption of undue influence, voiding the transaction."},
                        {"label": "B", "text": "It creates a rebuttable presumption of undue influence, shifting the burden to the donee to prove the gift was freely given."},
                        {"label": "C", "text": "It proves undue influence as a matter of law."},
                        {"label": "D", "text": "It is merely one factor the court will consider; the family must still prove actual influence."},
                        {"label": "E", "text": "It has no legal significance unless combined with evidence of overt threats."}
                    ],
                    "correct_answer": "B",
                    "explanation": "For 'presumed' (Class 2B) undue influence, the claimant must show: (1) a relationship of trust and confidence, and (2) a transaction that 'calls for explanation' (i.e., is manifestly disadvantageous or otherwise suspicious). If both are shown, a rebuttable presumption arises that the transaction was procured by undue influence. The burden then shifts to the defendant (Mark) to rebut this presumption, typically by showing that Edith had independent advice and acted freely (Royal Bank of Scotland v Etridge).",
                    "difficulty": "medium"
                },
                {
                    "id": 15,
                    "title": "",
                    "text": """A woman, Helen, provides a guarantee to a bank for a loan made to her husband's business. She attends a brief meeting with a bank representative but does not receive independent legal advice. The bank is aware the couple have a close relationship but does not suspect any wrongdoing by the husband. The husband subsequently defaults. Helen claims the bank had constructive notice that she was acting under her husband's undue influence.\nWhat should the bank have done to protect itself?""",
                    "options": [
                        {"label": "A", "text": "Nothing further; the bank is protected as long as it acted in good faith."},
                        {"label": "B", "text": "Ensured Helen received independent legal advice; the 'bare minimum' step for the bank."},
                        {"label": "C", "text": "Refused to accept the guarantee without proof of independent advice."},
                        {"label": "D", "text": "Conducted its own investigation into the relationship between the couple."},
                        {"label": "E", "text": "Required the husband to sign a waiver of his rights."}
                    ],
                    "correct_answer": "B",
                    "explanation": "Following Barclays Bank plc v O'Brien and RBS v Etridge, where a transaction is entered into by a vulnerable party (like a wife guaranteeing a husband's debts) with a third party (the bank), the bank is put on inquiry. To protect its security from being set aside, the bank should take reasonable steps to ensure the surety (Helen) understands the transaction and its risks. The 'bare minimum' according to Etridge is to insist that she attend a private meeting where the transaction is explained, or that she receives independent legal advice (ILA) from a solicitor. A brief meeting with a bank representative is insufficient.",
                    "difficulty": "hard"
                },
                {
                    "id": 16,
                    "title": "",
                    "text": """A contract is made between two parties for the supply of goods to be used for an illegal purpose (drug manufacturing). Both parties are fully aware of the intended illegal use. The supplier delivers the goods, but the buyer refuses to pay.\nCan the supplier sue for the contract price?""",
                    "options": [
                        {"label": "A", "text": "Yes, because the supply of the goods itself was not illegal."},
                        {"label": "B", "text": "No, because the court will not assist a party to an illegal contract to enforce it."},
                        {"label": "C", "text": "Yes, because the supplier was only supplying goods and was not involved in the illegal activity."},
                        {"label": "D", "text": "No, unless the supplier can show they withdrew from the illegal purpose before delivery."},
                        {"label": "E", "text": "Yes, because the buyer cannot rely on their own illegal purpose as a defence."}
                    ],
                    "correct_answer": "B",
                    "explanation": "Under the doctrine of illegality (ex turpi causa), a court will generally refuse to enforce a contract that involves the commission of a crime or is entered into with an illegal purpose known to both parties. The supplier, being complicit in the illegal purpose, cannot ask the court to enforce the contract and grant them a remedy (Patel v Mirza set out a new discretionary approach, but the prima facie rule remains against enforcement).",
                    "difficulty": "easy"
                },
                {
                    "id": 17,
                    "title": "",
                    "text": """A contract between a landlord and a tenant is legal on its face. However, the landlord secretly intends to use the premises for an illegal gambling operation, a fact unknown to the tenant.\nCan the tenant enforce the lease against the landlord?""",
                    "options": [
                        {"label": "A", "text": "No, because any contract tainted by illegality is void for both parties."},
                        {"label": "B", "text": "Yes, because the tenant was innocent of the illegal purpose."},
                        {"label": "C", "text": "No, because the lease contract is for illegal premises."},
                        {"label": "D", "text": "Yes, but only if the tenant discovers and reports the illegal activity."},
                        {"label": "E", "text": "No, because landlords owe a duty to ensure lawful use of their property."}
                    ],
                    "correct_answer": "B",
                    "explanation": "The defence of illegality operates primarily against the party involved in the illegality. An innocent party, unaware of the other party's illegal purpose, can still enforce the contract. The lease is for the use of premises; its purpose, as stated, is lawful. The landlord's secret, unilateral illegal intention does not void the contract for the innocent tenant, who can enforce their rights under the lease (Archbolds (Freightage) Ltd v S Spanglett Ltd).",
                    "difficulty": "medium"
                },
                {
                    "id": 18,
                    "title": "",
                    "text": """A contract for the sale of company shares is voidable for fraudulent misrepresentation. The seller fraudulently overstated the company's profits. The buyer wishes to rescind. However, between the contract date and the buyer's discovery of the fraud, the company has fallen into administration, and a third party (the administrator) now controls the company's assets.\nIs rescission still available?""",
                    "options": [
                        {"label": "A", "text": "Yes, the buyer can always rescind for fraud."},
                        {"label": "B", "text": "No, because rescission is barred where third-party rights have intervened."},
                        {"label": "C", "text": "Yes, but only if the administrator agrees."},
                        {"label": "D", "text": "No, because the company's status has fundamentally changed."},
                        {"label": "E", "text": "Yes, but the buyer must wait until the administration ends."}
                    ],
                    "correct_answer": "B",
                    "explanation": "One of the established bars to rescission is the intervention of third-party rights. If, since the contract was made, a third party has acquired rights in the subject matter in good faith and for value, rescission may be impossible, as it would prejudice those innocent rights. Here, the administrator's appointment and control over the company's assets may bar a simple unwinding of the share sale, as it would affect the rights and powers of the administrator and creditors (Car & Universal Finance Co Ltd v Caldwell).",
                    "difficulty": "hard"
                },
                {
                    "id": 19,
                    "title": "",
                    "text": """A simple domestic agreement is made for the sale of a car between friends. The seller states, "Just so you know, there's a small rattle in the engine, but it's nothing to worry about." The buyer agrees and pays cash. The rattle turns out to be indicative of a major engine fault requiring £3,000 in repairs. The buyer claims innocent misrepresentation.\nWhat remedy is the court most likely to award under s.2(2) of the Misrepresentation Act 1967?""",
                    "options": [
                        {"label": "A", "text": "Rescission of the contract."},
                        {"label": "B", "text": "Damages in lieu of rescission, calculated on a contractual (expectation) basis."},
                        {"label": "C", "text": "Damages in lieu of rescission, calculated on a tortious (reliance) basis."},
                        {"label": "D", "text": "No remedy, as the statement was an opinion, not a statement of fact."},
                        {"label": "E", "text": "Specific performance of a repair."}
                    ],
                    "correct_answer": "C",
                    "explanation": "Section 2(2) of the Misrepresentation Act 1967 gives the court a discretion to award damages 'in lieu of rescission' for non-fraudulent misrepresentation (i.e., negligent or innocent misrepresentation). Where rescission is a disproportionate remedy (e.g., for a minor loss in a completed transaction), the court may instead award damages. The measure of damages under s.2(2) is typically tortious (reliance-based), aiming to restore the claimant to their pre-contract position, not to give them the benefit of a bargain (William Sindall Plc v Cambridgeshire CC).",
                    "difficulty": "medium"
                }
            ]
            print("-> Patched Contract Law Section D with 19 new questions")
            
            # =====================================================
            # Patch Contract Law Section E - Termination
            # =====================================================
            area_e = next((a for a in contract_topic["areas"] if a["letter"] == "E"), None)
            if area_e:
                area_e["name"] = "Termination"
                area_e["slug"] = "e-termination"
                area_e["question_count"] = 12
            else:
                area_e = {
                    "letter": "E",
                    "name": "Termination",
                    "slug": "e-termination",
                    "question_count": 12,
                    "questions": []
                }
                contract_topic["areas"].insert(4, area_e)
            
            area_e["questions"] = [
                {
                    "id": 1,
                    "title": "",
                    "text": """A builder, "QuickBuild Ltd," contracts to construct a small office extension for a client. The agreed contract price is £50,000, payable on completion. QuickBuild finishes the work, but a surveyor's report identifies minor cosmetic defects (e.g., some paintwork is uneven, a door handle is loose) costing £500 to rectify. The client refuses to pay the £50,000, arguing the work is not complete.\nIs the client entitled to refuse payment entirely?""",
                    "options": [
                        {"label": "A", "text": "Yes, because the builder has not fully performed their contractual obligations."},
                        {"label": "B", "text": "No, the builder is entitled to £49,500 under the doctrine of substantial performance."},
                        {"label": "C", "text": "Yes, because 'completion' under a construction contract means absolute perfection."},
                        {"label": "D", "text": "No, the client must pay the full £50,000 and then recover the £500 in a separate action."},
                        {"label": "E", "text": "No, the builder is entitled to the contract price less a deduction for the cost of remedying the defects."}
                    ],
                    "correct_answer": "E",
                    "explanation": "The doctrine of substantial performance (Hoenig v Isaacs) allows a party who has performed substantially but not perfectly to recover the contract price, less a deduction for the cost of remedying the defects. Here, the extension is built, and the defects are minor and cosmetic. QuickBuild has substantially performed and is entitled to be paid, with the client entitled to set off the cost of remedial works.",
                    "difficulty": "medium"
                },
                {
                    "id": 2,
                    "title": "",
                    "text": """A contract between "Ship Co" and "Cargo Ltd" for the carriage of goods by sea requires Cargo Ltd to have their goods ready for loading at the port by 1st July. Cargo Ltd informs Ship Co on 25th June that, due to a factory fire, the goods will not be ready until at least 1st September. Ship Co must now decide whether to wait or take other action.\nWhat right does Ship Co have immediately upon receiving this communication?""",
                    "options": [
                        {"label": "A", "text": "None, until the 1st July deadline passes without performance."},
                        {"label": "B", "text": "The right to suspend their own performance and wait until 1st July."},
                        {"label": "C", "text": "The right to treat Cargo Ltd's communication as an anticipatory breach and terminate the contract immediately."},
                        {"label": "D", "text": "The right to claim damages for losses suffered up to 25th June only."},
                        {"label": "E", "text": "The right to renegotiate the contract terms."}
                    ],
                    "correct_answer": "C",
                    "explanation": "Cargo Ltd's communication is a clear and unequivocal refusal or inability to perform a fundamental obligation (having the goods ready on time). This constitutes an anticipatory breach (Hochster v De La Tour). Upon receiving such a renunciation, the innocent party (Ship Co) has a choice: they can accept the breach, terminate the contract immediately, and claim damages; or they can affirm the contract, keep it alive, and wait until the performance date, suing for damages only if the breach is confirmed at that time.",
                    "difficulty": "medium"
                },
                {
                    "id": 3,
                    "title": "",
                    "text": """A supplier, "Parts Plus," contracts to deliver 100 specialist components to a manufacturer, "AssembleCo," by 1st December. The components are essential for AssembleCo's production line. On 1st December, Parts Plus delivers only 60 components, stating the remaining 40 will arrive on 15th December due to a supplier issue. AssembleCo's entire production line is halted. AssembleCo wishes to terminate the contract.\nCan AssembleCo terminate the contract?""",
                    "options": [
                        {"label": "A", "text": "Only if the contract contained a time-of-the-essence clause."},
                        {"label": "B", "text": "Only if AssembleCo can prove loss exceeding a certain threshold."},
                        {"label": "C", "text": "Yes, if the failure to deliver in full is a repudiatory breach, depriving AssembleCo of substantially the whole benefit of the contract."},
                        {"label": "D", "text": "No, because Parts Plus has delivered a substantial portion (60%), it has substantially performed."},
                        {"label": "E", "text": "No, AssembleCo must give Parts Plus a reasonable opportunity to cure the defect."}
                    ],
                    "correct_answer": "C",
                    "explanation": "For breach of an innominate term, the test for termination is whether the breach deprives the innocent party of substantially the whole benefit they were intended to receive under the contract (Hongkong Fir). If the 100 components were essential for a production run and 60 is insufficient, the effect of the breach may be to frustrate AssembleCo's commercial purpose entirely. This would likely be a repudiatory breach justifying termination. The 'substantial performance' doctrine from Hoenig v Isaacs applies to the builder's payment claim, not to the buyer's right to terminate for a serious breach.",
                    "difficulty": "hard"
                },
                {
                    "id": 4,
                    "title": "",
                    "text": """A pop star, "Melody," is booked to perform at a major festival for a fee of £100,000. The contract with the festival organiser states that the headliner slot on the main stage on Saturday evening is 'fundamental.' A week before the event, the organiser emails: "Due to unforeseen circumstances with our main stage, we can only offer you a headline slot on a smaller side-stage at the same time." Melody refuses this alternative and claims the contract is breached.\nIs Melody entitled to terminate?""",
                    "options": [
                        {"label": "A", "text": "No, because the organiser is offering an alternative performance slot."},
                        {"label": "B", "text": "Yes, because a fundamental term has been breached, giving rise to an automatic right to terminate."},
                        {"label": "C", "text": "No, unless Melody can prove the side-stage slot would cause her reputational harm."},
                        {"label": "D", "text": "Yes, if the contract is deemed to be frustrated by the main stage issue."},
                        {"label": "E", "text": "No, but she is entitled to a proportional reduction in her fee."}
                    ],
                    "correct_answer": "B",
                    "explanation": "The contract expressly states the main stage slot is 'fundamental.' This elevates the term to the status of a condition. Breach of a condition gives rise to a right to terminate regardless of the actual consequences of the breach (L Schuler AG v Wickman). The organiser's failure to provide what was promised (the main stage) is a breach of this condition. Melody is entitled to terminate and claim damages. The offer of an alternative does not cure this fundamental breach.",
                    "difficulty": "medium"
                },
                {
                    "id": 5,
                    "title": "",
                    "text": """A long-term contract for the supply of raw materials is in place between "Supplier Co" and "Manufacturer Ltd." After three years of good performance, Supplier Co sends a letter to Manufacturer Ltd stating: "We are reviewing all our contracts and reserve the right to cease supply if market conditions worsen." The letter contains no specific date for any cessation and supplies continue for the next six months without issue. Manufacturer Ltd seeks to terminate the contract, claiming the letter was an anticipatory breach.\nWas the letter an anticipatory breach?""",
                    "options": [
                        {"label": "A", "text": "Yes, because Supplier Co indicated an intention not to be bound by the contract."},
                        {"label": "B", "text": "No, because the letter was merely a statement of general business review, not a clear refusal to perform."},
                        {"label": "C", "text": "Yes, because 'reserving the right' to cease performance is a threat to breach."},
                        {"label": "D", "text": "No, because Manufacturer Ltd affirmed the contract by continuing to trade for six months."},
                        {"label": "E", "text": "Yes, but Manufacturer Ltd has lost the right to terminate by waiving the breach."}
                    ],
                    "correct_answer": "B",
                    "explanation": "An anticipatory breach requires a 'clear and unequivocal' refusal to perform the contract, or conduct demonstrating an intention not to be bound by it (Hochster v De La Tour). A vague statement 'reserving the right' to do something in the future, without a definite refusal to perform, is unlikely to meet this threshold. It is a warning of a potential future decision, not a present renunciation of the contract. Therefore, no anticipatory breach occurred.",
                    "difficulty": "medium"
                },
                {
                    "id": 6,
                    "title": "",
                    "text": """A charter agreement for a pleasure yacht specifies a two-week cruise starting on 1st August. On 25th July, the yacht is severely damaged by a fire for which neither party is responsible. The yacht cannot be repaired in time and is unavailable for the charter. The charterer had paid a £10,000 deposit.\nWhat is the effect of the fire on the contract?""",
                    "options": [
                        {"label": "A", "text": "The contract is voidable at the charterer's option."},
                        {"label": "B", "text": "The contract is frustrated, and the Law Reform (Frustrated Contracts) Act 1943 will apply."},
                        {"label": "C", "text": "The owner is in breach of contract for failing to provide the yacht."},
                        {"label": "D", "text": "The contract continues, and the owner must find a substitute yacht."},
                        {"label": "E", "text": "The charterer can claim for disappointment, as the cruise was a leisure activity."}
                    ],
                    "correct_answer": "B",
                    "explanation": "The doctrine of frustration applies when, without fault of either party, a supervening event makes performance of the contract impossible, illegal, or radically different from what was agreed. The destruction of a specific subject matter (the yacht) essential to performance is a classic case of frustrating impossibility (Taylor v Caldwell). The Law Reform (Frustrated Contracts) Act 1943 governs the financial consequences, allowing for recovery of prepaid sums and adjustments for expenses.",
                    "difficulty": "easy"
                },
                {
                    "id": 7,
                    "title": "",
                    "text": """A company contracts to supply uniforms for an international sporting event scheduled to be hosted in a foreign country. The contract price is £200,000. Six months before the event, the host country's government unexpectedly passes a law banning all foreign textiles. Importing the uniforms becomes illegal. The supplier has already incurred £50,000 in manufacturing costs.\nIs the contract frustrated?""",
                    "options": [
                        {"label": "A", "text": "No, because the supplier should have foreseen political risks and insured against them."},
                        {"label": "B", "text": "Yes, because supervening illegality makes performance impossible."},
                        {"label": "C", "text": "No, the supplier must find a way to source materials locally."},
                        {"label": "D", "text": "Yes, but the supplier is still liable for the £50,000 spent."},
                        {"label": "E", "text": "No, only war or natural disaster can frustrate a contract."}
                    ],
                    "correct_answer": "B",
                    "explanation": "Supervening illegality is a recognised ground for frustration. Where a change in law makes the performance of a contract illegal, the contract is frustrated (Fibrosa Spolka Akcyjna v Fairbairn Lawson Combe Barbour Ltd). The event was unforeseen and is not the fault of either party. The Law Reform (Frustrated Contracts) Act 1943 will then apply to deal with the £50,000 expenses, allowing the court to permit the supplier to retain or recover a just sum.",
                    "difficulty": "medium"
                },
                {
                    "id": 8,
                    "title": "",
                    "text": """A contract for the sale of a plot of land is signed. Before completion, a local authority serves a compulsory purchase order on the land, which the seller knew might happen. The buyer argues the contract is frustrated.\nIs the contract frustrated?""",
                    "options": [
                        {"label": "A", "text": "Yes, because performance of the sale is now impossible."},
                        {"label": "B", "text": "No, because a compulsory purchase order does not prevent the transfer of title."},
                        {"label": "C", "text": "No, because the risk of the order was foreseen by the seller, placing the risk on them."},
                        {"label": "D", "text": "Yes, but only if the order was served after contracts were exchanged."},
                        {"label": "E", "text": "No, frustration does not apply to contracts for the sale of land."}
                    ],
                    "correct_answer": "C",
                    "explanation": "A contract is not frustrated if the event was foreseen, or should have been foreseen, by the party seeking to rely on frustration, or if the risk of that event was allocated by the contract (Walton Harvey Ltd v Walker and Homfrays Ltd). Here, the seller knew the order was a possibility. The risk of this event was on the seller. This prevents frustration from applying, as it would not be fair to relieve the seller of a risk they were aware of.",
                    "difficulty": "hard"
                },
                {
                    "id": 9,
                    "title": "",
                    "text": """A contract for the sale of goods states the buyer must pay a 10% deposit on signing. The contract is valued at £100,000. The buyer pays the £10,000 deposit but then wrongfully repudiates the contract before completion. The seller resells the goods for £105,000 (i.e., at a profit).\nCan the seller retain the £10,000 deposit?""",
                    "options": [
                        {"label": "A", "text": "No, because the deposit is a penalty clause as the seller suffered no loss."},
                        {"label": "B", "text": "Yes, a deposit is forfeitable as an earnest of performance upon the buyer's breach."},
                        {"label": "C", "text": "No, the seller must return the deposit less their actual loss."},
                        {"label": "D", "text": "Yes, but only if it was explicitly labelled as 'non-refundable'."},
                        {"label": "E", "text": "No, because the seller has mitigated their loss by reselling at a profit."}
                    ],
                    "correct_answer": "B",
                    "explanation": "A true deposit, as an earnest of performance, is forfeitable upon breach by the payer (Howe v Smith). It is a guarantee of performance, not a pre-estimate of loss. Therefore, the penalty clause rules do not apply to it. The seller can retain the deposit even if they have suffered no loss or have made a profit on resale. However, if the deposit is 'unreasonable' (excessively large), the court has an equitable jurisdiction to relieve against forfeiture (Workers Trust & Merchant Bank Ltd v Dojap Investments Ltd). A 10% deposit is generally considered reasonable for a commercial sale.",
                    "difficulty": "medium"
                },
                {
                    "id": 10,
                    "title": "",
                    "text": """Upon termination of a contract for breach, the innocent party claims damages. The contract was for the installation of a bespoke heating system. The installer, the party in breach, had completed 80% of the work (valued at £40,000 of a £50,000 contract) before being rightly terminated by the client for a fundamental breach relating to the quality of work.\nCan the installer recover any payment for the work done?""",
                    "options": [
                        {"label": "A", "text": "Yes, under the doctrine of substantial performance."},
                        {"label": "B", "text": "No, the party in breach cannot claim anything for partial performance (the 'entire contracts' rule)."},
                        {"label": "C", "text": "Yes, on a quantum meruit basis for a reasonable sum for the value of the work done."},
                        {"label": "D", "text": "No, unless the client has been unjustly enriched by the partial work."},
                        {"label": "E", "text": "Yes, because 80% completion is a substantial majority of the work."}
                    ],
                    "correct_answer": "B",
                    "explanation": "The traditional rule is that a party in breach of an entire contract cannot use a quantum meruit claim to recover for partial performance (Sumpter v Hedges). They have not performed their side and cannot claim payment for it. The doctrine of substantial performance (Option A) applies where performance is complete but for minor defects, which is not the case here (there was a fundamental breach). The client may have a claim for damages exceeding the value of the part-work, and the installer has no right to any payment.",
                    "difficulty": "hard"
                },
                {
                    "id": 11,
                    "title": "",
                    "text": """A contract for the sale of a unique vintage car is repudiated by the buyer before completion. The seller, the innocent party, has two potential remedies: to sue for damages, or to ignore the breach and sue for the contract price. The car remains in the seller's possession.\nCan the seller sue for the agreed price?""",
                    "options": [
                        {"label": "A", "text": "Yes, because a repudiatory breach entitles the seller to the price as a remedy."},
                        {"label": "B", "text": "No, an action for the price is only available once property (ownership) in the goods has passed to the buyer."},
                        {"label": "C", "text": "Yes, if the seller has 'affirmed' the contract by keeping the car available for the buyer."},
                        {"label": "D", "text": "No, the seller must accept the buyer's repudiation and mitigate their loss by selling the car."},
                        {"label": "E", "text": "Yes, because the car is unique."}
                    ],
                    "correct_answer": "B",
                    "explanation": "Under the Sale of Goods Act 1979, s.49, an action for the price is generally only available where the property in the goods has passed to the buyer, or where the price was payable on a day certain irrespective of delivery, and the buyer wrongfully neglects or refuses to pay. Here, the buyer repudiated before completion, so property (title) in the car likely has not passed. The seller's primary remedy is to accept the repudiation, terminate, mitigate by reselling, and claim damages for any shortfall.",
                    "difficulty": "hard"
                },
                {
                    "id": 12,
                    "title": "",
                    "text": """A software development contract is terminated by the client for a fundamental breach by the developer. Before termination, the developer had spent six months gathering detailed user requirements and creating a comprehensive design document. This work had significant value and was handed to the client, who used it to brief a new developer. The new developer completed the project at a lower cost than the original contract.\nDoes the original developer have any claim against the client?""",
                    "options": [
                        {"label": "A", "text": "No, as the party in breach has no claim whatsoever."},
                        {"label": "B", "text": "Yes, for the full contract price for the work completed."},
                        {"label": "C", "text": "No, as termination for breach discharges all obligations."},
                        {"label": "D", "text": "Yes, possibly for restitution if the client would otherwise be unjustly enriched at the developer's expense."},
                        {"label": "E", "text": "Yes, for damages for the client's use of the design document."}
                    ],
                    "correct_answer": "D",
                    "explanation": "While a party in fundamental breach generally has no contractual right to payment for part performance, a separate restitutionary claim may lie if the innocent party has been 'enriched' by receiving a benefit (the valuable design document) for which they have not paid, and it would be unjust for them to retain it. This is a difficult claim for a party in breach to succeed on (Sumpter v Hedges is the general rule), but modern law may allow a claim in unjust enrichment where the benefit conferred is clear and distinct, and there is no policy reason to deny recovery (BP Exploration Co (Libya) Ltd v Hunt).",
                    "difficulty": "hard"
                }
            ]
            print("-> Patched Contract Law Section E with 12 new questions")
            
            # Update Contract Law topic question count
            contract_topic["question_count"] = sum(a["question_count"] for a in contract_topic["areas"])
            print(f"-> Updated Contract Law total: {contract_topic['question_count']} questions")
            
        # =====================================================
        # DISPUTE RESOLUTION PATCHES (Topic index 3)
        # =====================================================
        dispute_topic = courses["flk-1"]["topics"][3]
        
        # =====================================================
        # Patch Dispute Resolution Section A - Different options for dispute resolution
        # =====================================================
        area_a = next((a for a in dispute_topic["areas"] if a["letter"] == "A"), None)
        if area_a:
            area_a["name"] = "Different options for dispute resolution & Resolving a dispute through a civil claim"
            area_a["slug"] = "a-different-options-dispute-resolution"
            area_a["question_count"] = 25
        else:
            area_a = {
                "letter": "A",
                "name": "Different options for dispute resolution & Resolving a dispute through a civil claim",
                "slug": "a-different-options-dispute-resolution",
                "question_count": 25,
                "questions": []
            }
            dispute_topic["areas"].insert(0, area_a)
        
        area_a["questions"] = [
            {
                "id": 1,
                "title": "",
                "text": """Client A runs a manufacturing business. A key supplier has delivered defective components, causing A significant production delays and loss. The contract between them contains a detailed arbitration clause. Client A values speed, finality, and wishes to keep the technical details of their manufacturing process confidential. Which of the following is the LEAST accurate reason for advising Client A to pursue arbitration in this case?""",
                "options": [
                    {"label": "A", "text": "Arbitration is generally faster than court litigation due to streamlined procedures and limited rights of appeal."},
                    {"label": "B", "text": "Arbitration proceedings and the award are private and confidential, protecting business information."},
                    {"label": "C", "text": "The parties can select an arbitrator with specific expertise in commercial supply contracts."},
                    {"label": "D", "text": "The Arbitration Act 1996 provides a comprehensive legal framework ensuring procedural fairness."},
                    {"label": "E", "text": "The courts will automatically scrutinise the merits of an arbitral award if a party is dissatisfied with the outcome."}
                ],
                "correct_answer": "E",
                "explanation": "A key characteristic of arbitration is the limited grounds for challenging an award under the Arbitration Act 1996 (e.g., serious irregularity, lack of substantive jurisdiction). The courts do not 'automatically scrutinise the merits' or rehear the case; they cannot overturn an award simply because one party is dissatisfied with the outcome. (a), (b), (c), and (d) are all accurate statements about arbitration's advantages.",
                "difficulty": "medium"
            },
            {
                "id": 2,
                "title": "",
                "text": """In a dispute between two neighbours over a boundary, where the relationship has completely broken down and one neighbour is adamant they are legally correct, which dispute resolution method is likely to be the MOST appropriate initial step, and why?""",
                "options": [
                    {"label": "A", "text": "Litigation, as a binding public judgment from the court will definitively establish the legal position."},
                    {"label": "B", "text": "Arbitration, as it is less adversarial and will help repair the neighbourly relationship."},
                    {"label": "C", "text": "Mediation, as it is a without prejudice process that can explore commercial solutions even where legal rights are contested."},
                    {"label": "D", "text": "A direct without prejudice negotiation, as this avoids all third-party costs."},
                    {"label": "E", "text": "Mediation, as the mediator will provide a legally binding determination on the boundary line."}
                ],
                "correct_answer": "C",
                "explanation": "Even in disputes where parties are entrenched, mediation is a highly suitable first step. It is flexible, without prejudice, and can explore pragmatic solutions (e.g., sharing costs for a new fence, agreeing access rights) that a court cannot impose. It is cost-effective and may preserve a working relationship. (a) is true but often a last resort due to cost and acrimony. (b) is incorrect; arbitration is adversarial and binding, not focused on relationship repair. (d) is unlikely to succeed given the broken relationship. (e) is wrong; a mediator does not impose a binding decision.",
                "difficulty": "medium"
            },
            {
                "id": 3,
                "title": "",
                "text": """Which of the following is a distinctive characteristic of litigation in the courts of England and Wales, compared to arbitration and mediation?""",
                "options": [
                    {"label": "A", "text": "The process is governed by rules set and enforced by the state."},
                    {"label": "B", "text": "The decision-maker is neutral and independent."},
                    {"label": "C", "text": "The process can result in a legally binding outcome."},
                    {"label": "D", "text": "The parties have some control over the procedure."},
                    {"label": "E", "text": "The process is confidential."}
                ],
                "correct_answer": "A",
                "explanation": "Litigation is a public state function governed by the Civil Procedure Rules (CPR) and overseen by state-appointed judges. (b) is true of all three processes. (c) is true of litigation and arbitration, but not mediation (unless a settlement agreement is made binding). (d) is more true of arbitration/mediation; in litigation, procedure is primarily court-driven. (e) is false; court hearings and judgments are generally public.",
                "difficulty": "easy"
            },
            {
                "id": 4,
                "title": "",
                "text": """A company discovers its former director may have breached fiduciary duties. They want to investigate and obtain disclosure of documents from the director quickly, before any formal claim is issued. Which process offers the best mechanism for this?""",
                "options": [
                    {"label": "A", "text": "Mediation, as the mediator can order document production."},
                    {"label": "B", "text": "Arbitration, as the tribunal can make peremptory orders."},
                    {"label": "C", "text": "Litigation, using the procedure for pre-action disclosure under CPR 31.16."},
                    {"label": "D", "text": "Negotiation, by sending a letter before claim demanding the documents."},
                    {"label": "E", "text": "Early Neutral Evaluation, as the evaluator will assess the need for documents."}
                ],
                "correct_answer": "C",
                "explanation": "CPR 31.16 allows an application for disclosure of documents before proceedings have started, if the parties are likely to be party to subsequent proceedings and disclosure is desirable to dispose fairly of the anticipated proceedings or save costs. This is a unique feature of the court's powers. (a) & (e): Mediators/Evaluators have no coercive power to order disclosure. (b) An arbitral tribunal's powers generally arise only after arbitration is commenced. (d) A letter has no legal force to compel disclosure.",
                "difficulty": "medium"
            },
            {
                "id": 5,
                "title": "",
                "text": """In which of the following scenarios is arbitration likely to be INAPPROPRIATE?""",
                "options": [
                    {"label": "A", "text": "A dispute under an international construction contract where the parties desire a neutral venue."},
                    {"label": "B", "text": "A claim requiring urgent interim injunctive relief to prevent assets being dissipated."},
                    {"label": "C", "text": "A technical dispute about royalty payments under a software licensing agreement."},
                    {"label": "D", "text": "A commercial dispute where the parties wish to avoid the publicity of court."},
                    {"label": "E", "text": "A dispute where the parties have contractually agreed to arbitrate under the LCIA rules."}
                ],
                "correct_answer": "B",
                "explanation": "While arbitrators can grant interim relief, they lack the ex parte (without notice) and pervasive enforcement powers of the court. For urgent injunctions (e.g., freezing orders), applying to the court is often more effective. The court's powers under CPR Part 25 are immediate and backed by state authority. (a), (c), (d) are classic situations favouring arbitration. (e) is a scenario where arbitration is mandatory.",
                "difficulty": "medium"
            },
            {
                "id": 6,
                "title": "",
                "text": """The primary purpose of mediation is to:""",
                "options": [
                    {"label": "A", "text": "Determine the legal rights and wrongs of the parties' positions."},
                    {"label": "B", "text": "Facilitate a mutually acceptable settlement agreement between the parties."},
                    {"label": "C", "text": "Provide a legally binding judgment based on the evidence presented."},
                    {"label": "D", "text": "Establish a precedent for future similar disputes."},
                    {"label": "E", "text": "Formally determine issues of law for the benefit of the public."}
                ],
                "correct_answer": "B",
                "explanation": "Mediation is a facilitative, non-adjudicative process. The mediator assists the parties in negotiating their own settlement. (a) & (e) are the role of judges. (c) describes litigation or arbitration. (d) is a feature of court judgments, not mediation outcomes.",
                "difficulty": "easy"
            },
            {
                "id": 7,
                "title": "",
                "text": """A claimant wishes to bring a claim for damages for negligent professional advice. The advice was given in a meeting on 15 June 2019. The claimant relied on it and signed a contract on 1 July 2019. The claimant first suffered quantifiable financial loss on 30 September 2019. The claimant issued a claim form on 10 October 2022. Is the claim statute-barred under the Limitation Act 1980?""",
                "options": [
                    {"label": "A", "text": "Yes, because time ran from the date the advice was given (15 June 2019)."},
                    {"label": "B", "text": "Yes, because time ran from the date of reliance (1 July 2019)."},
                    {"label": "C", "text": "No, because time ran from the date the loss was suffered (30 September 2019) and the claim was issued within six years."},
                    {"label": "D", "text": "Yes, because the claim form was issued more than three years after the loss was suffered."},
                    {"label": "E", "text": "No, because the limitation period for professional negligence is six years from the date of the breach of duty."}
                ],
                "correct_answer": "C",
                "explanation": "For tort (negligence), the primary limitation period is 6 years from the date the cause of action accrues (s.2, Limitation Act 1980). The cause of action accrues when damage is suffered (Pirelli General Cable Works Ltd v Oscar Faber & Partners). Here, the actionable damage occurred on 30 September 2019. Issuing on 10 October 2022 is within 6 years. (d) is incorrect as the 3-year period under s.14A for latent damage does not apply here, as the loss was known.",
                "difficulty": "hard"
            },
            {
                "id": 8,
                "title": "",
                "text": """A contract for the sale of goods was made on 1 March 2020, with payment due on 1 April 2020. The buyer failed to pay. Assuming no acknowledgement of debt, what is the latest date to issue a claim for the contract debt?""",
                "options": [
                    {"label": "A", "text": "1 April 2026."},
                    {"label": "B", "text": "1 March 2026."},
                    {"label": "C", "text": "2 April 2026."},
                    {"label": "D", "text": "2 March 2026."},
                    {"label": "E", "text": "1 October 2026."}
                ],
                "correct_answer": "A",
                "explanation": "For a simple contract, limitation is 6 years from the date on which the cause of action accrued (s.5, Limitation Act 1980). The cause of action for debt accrues when the payment falls due, i.e., 1 April 2020. The latest date for issue is the anniversary of that date six years later: 1 April 2026. (CPR rule 7.2 states proceedings are started when the court issues the claim form).",
                "difficulty": "medium"
            },
            {
                "id": 9,
                "title": "",
                "text": """A contract for the supply of services was made on 10 March 2019. Payment of £50,000 was due on 10 April 2019, but was not made. On 15 June 2021, the debtor sent an email stating, "I acknowledge that the £50,000 for the 2019 project remains outstanding and I will arrange payment soon." No payment was ever made. The claimant issued a claim form for the debt on 1 May 2024. Applying the Limitation Act 1980, which of the following is the CORRECT analysis?""",
                "options": [
                    {"label": "A", "text": "The claim is statute-barred. Time expired on 10 April 2025, and the email of 15 June 2021 did not restart time because it was not a signed, written acknowledgment."},
                    {"label": "B", "text": "The claim is statute-barred. The primary limitation period expired on 10 April 2025, and while the email was an acknowledgment, it did not extend the limitation period sufficiently."},
                    {"label": "C", "text": "The claim is not statute-barred. The email of 15 June 2021 constituted an acknowledgment under s.29(5) of the Limitation Act 1980, and a fresh six-year period runs from that date, expiring on 15 June 2027."},
                    {"label": "D", "text": "The claim is not statute-barred. The limitation period is six years from the breach (10 April 2019), so it expires on 10 April 2025. The claim was issued on 1 May 2024, which is within time."},
                    {"label": "E", "text": "The claim is statute-barred. An acknowledgment only extends time if it is followed by part-payment. As no payment was made, the original limitation period of 10 April 2025 applies."}
                ],
                "correct_answer": "C",
                "explanation": "Under s.29(5) of the Limitation Act 1980, where any right of action has accrued to recover a debt and the person liable acknowledges the claim, the right is treated as having accrued on the date of the acknowledgment. This starts time running afresh. The acknowledgment must be in writing and signed by the person making it (s.30). An email from the debtor likely satisfies this requirement. The acknowledgment was made on 15 June 2021, so a new six-year period runs from that date, expiring on 15 June 2027. The claim issued in May 2024 is therefore within time.",
                "difficulty": "hard"
            },
            {
                "id": 10,
                "title": "",
                "text": """Which of the following is NOT a stated aim of the Practice Direction – Pre-Action Conduct?""",
                "options": [
                    {"label": "A", "text": "To encourage the exchange of early and full information about the dispute."},
                    {"label": "B", "text": "To enable parties to settle the matter without the need to start proceedings."},
                    {"label": "C", "text": "To support the efficient management of proceedings that cannot be avoided."},
                    {"label": "D", "text": "To act as a strict penal code for non-compliance with mandatory time limits."},
                    {"label": "E", "text": "To help parties understand the full nature of the other's case."}
                ],
                "correct_answer": "D",
                "explanation": "The PD (para. 3) emphasises that its aims should not be used to generate satellite litigation. While there are consequences for non-compliance (e.g., costs, sanctions), it is not intended as a 'strict penal code.' Its ethos is proportionate and reasonable conduct. (a), (b), (c), and (e) are all direct aims listed in paragraph 3 of the PD.",
                "difficulty": "medium"
            },
            {
                "id": 11,
                "title": "",
                "text": """In which of the following scenarios has a party most clearly failed to comply with the spirit of pre-action protocols, risking costs sanctions?""",
                "options": [
                    {"label": "A", "text": "Sending a detailed Letter of Claim to which the defendant responds fully within the protocol's time limit, but without enclosing copies of key documents already in the claimant's possession."},
                    {"label": "B", "text": "Issuing a claim form without sending any prior letter of claim because the limitation period was about to expire."},
                    {"label": "C", "text": "Engaging in a without prejudice meeting to discuss settlement before exchanging Letters of Claim and Response."},
                    {"label": "D", "text": "Taking an extra 5 days to send a Letter of Response due to the complexity of the issues and informing the claimant of the delay."},
                    {"label": "E", "text": "Refusing to participate in mediation after the exchange of pre-action correspondence, believing the case is purely a matter of legal interpretation."}
                ],
                "correct_answer": "B",
                "explanation": "Pre-action protocols require a claimant to send a Letter of Claim before issuing proceedings, to allow the defendant a reasonable opportunity to respond. Issuing without any prior notice is a clear breach, even if limitation is pressing. The claimant could issue to protect limitation but should then apply to stay proceedings for the protocol to be followed. (a) is a minor technical breach. (c) is encouraged. (d) is reasonable communication. (e) is not a breach of protocols, though refusal to consider ADR may carry costs risks later.",
                "difficulty": "medium"
            },
            {
                "id": 12,
                "title": "",
                "text": """Under the Professional Negligence Pre-Action Protocol, what is the consequence if a defendant fails to provide a Letter of Response within the stipulated 3 month period?""",
                "options": [
                    {"label": "A", "text": "The claimant is automatically entitled to judgment in default."},
                    {"label": "B", "text": "The defendant is barred from defending the claim."},
                    {"label": "C", "text": "The claimant is entitled to issue proceedings immediately."},
                    {"label": "D", "text": "The court must impose a costs sanction on the defendant."},
                    {"label": "E", "text": "The claimant should send a reminder before issuing proceedings."}
                ],
                "correct_answer": "C",
                "explanation": "The protocol states that if the defendant does not provide a Letter of Response within 3 months of the Letter of Claim, the claimant is entitled to commence proceedings. There is no automatic bar or default judgment (a, b). While costs sanctions are possible (d), they are not automatic and are at the court's discretion. Sending a reminder (e) is good practice but not a mandatory step.",
                "difficulty": "medium"
            },
            {
                "id": 13,
                "title": "",
                "text": """A pedestrian is injured when struck by a van driven by an employee during the course of his employment. The pedestrian wishes to sue. Which of the following statements regarding the correct defendant is FALSE?""",
                "options": [
                    {"label": "A", "text": "The pedestrian may sue the driver personally in tort (negligence)."},
                    {"label": "B", "text": "The pedestrian may sue the employer under the principle of vicarious liability."},
                    {"label": "C", "text": "The pedestrian must choose to sue either the driver or the employer, but not both."},
                    {"label": "D", "text": "The driver and employer may be sued as joint tortfeasors."},
                    {"label": "E", "text": "The employer's liability arises from the relationship with the employee and the course of employment."}
                ],
                "correct_answer": "C",
                "explanation": "It is permissible and common to sue multiple defendants in the alternative or jointly. The claimant does not have to choose one. (a), (b), (d), and (e) are true statements of law.",
                "difficulty": "medium"
            },
            {
                "id": 14,
                "title": "",
                "text": """A company incorporated in Germany enters into a contract, governed by French law, with a company incorporated in England. The contract is to be performed in Spain. A dispute arises and proceedings are brought in the High Court in London. Under the Rome I Regulation, which law will the English court apply to determine the substance of the contractual dispute?""",
                "options": [
                    {"label": "A", "text": "English law, as the forum state (lex fori)."},
                    {"label": "B", "text": "German law, as the law of the domicile of one party."},
                    {"label": "C", "text": "French law, as the law chosen by the parties."},
                    {"label": "D", "text": "Spanish law, as the law of the place of performance (lex loci solutionis)."},
                    {"label": "E", "text": "A combination of all relevant laws, based on the doctrine of renvoi."}
                ],
                "correct_answer": "C",
                "explanation": "Article 3 of the Rome I Regulation establishes the principle of party autonomy. The court will apply the law chosen by the parties, which here is French law. The forum, domicile, or place of performance are only relevant in the absence of choice.",
                "difficulty": "medium"
            },
            {
                "id": 15,
                "title": "",
                "text": """An English tourist is injured in a road traffic accident in Greece, caused by the negligence of a Greek driver. The tourist returns to England and issues a claim in the courts of England and Wales. Under the Rome II Regulation, what law will apply to the non-contractual obligation?""",
                "options": [
                    {"label": "A", "text": "Always English law, as the law of the forum."},
                    {"label": "B", "text": "Always Greek law, as the law of the country where the damage occurred."},
                    {"label": "C", "text": "English law, as the law of the country where the injured party is habitually resident."},
                    {"label": "D", "text": "Greek law, unless the tourist can show it is manifestly more closely connected to England."},
                    {"label": "E", "text": "The law of the country where the event giving rise to the damage occurred."}
                ],
                "correct_answer": "B",
                "explanation": "Article 4(1) of Rome II establishes the general rule: the law applicable to a tort/delict is the law of the country in which the damage occurs, irrespective of the country in which the event giving rise to the damage occurred. Here, the damage (injury) occurred in Greece. The exception in (d) is very narrow and unlikely to apply to a simple RTA. (a), (c), and (e) are incorrect statements of the rule.",
                "difficulty": "medium"
            },
            {
                "id": 16,
                "title": "",
                "text": """In a claim for breach of contract, which of the following is NOT a necessary element that the claimant must prove on the balance of probabilities?""",
                "options": [
                    {"label": "A", "text": "That a valid contract existed between the parties."},
                    {"label": "B", "text": "That the defendant breached a term of that contract."},
                    {"label": "C", "text": "That the claimant has suffered loss as a result of the breach."},
                    {"label": "D", "text": "That the defendant intended to cause the claimant loss."},
                    {"label": "E", "text": "That the breach of contract caused the claimant's loss."}
                ],
                "correct_answer": "D",
                "explanation": "Liability for breach of contract is strict. The claimant does not need to prove any intention (or negligence) on the part of the defendant, only that the breach occurred. (a), (b), (c), and (e) are essential elements of the cause of action.",
                "difficulty": "easy"
            },
            {
                "id": 17,
                "title": "",
                "text": """A claimant wishes to bring a claim for the tort of deceit. What is the key mental element that the claimant must prove against the defendant?""",
                "options": [
                    {"label": "A", "text": "Negligence – the defendant made a false statement carelessly."},
                    {"label": "B", "text": "Recklessness – the defendant was indifferent as to the truth of the statement."},
                    {"label": "C", "text": "Knowledge of falsity or lack of belief in its truth – the defendant knew the statement was false or was dishonest."},
                    {"label": "D", "text": "Intention to cause financial loss – the defendant's primary motive was to harm the claimant."},
                    {"label": "E", "text": "Strict liability – no mental state needs to be proven."}
                ],
                "correct_answer": "C",
                "explanation": "The tort of deceit (fraudulent misrepresentation) requires the claimant to prove the defendant made a false representation knowingly, without belief in its truth, or recklessly as to its truth (Derry v Peek). (b) is a component of (c). (a) describes negligent misstatement. (d) describes malice, which is not required. (e) is incorrect.",
                "difficulty": "medium"
            },
            {
                "id": 18,
                "title": "",
                "text": """Under the Practice Direction – Welsh Language, in which of the following circumstances may a party file a document at court in Welsh without also providing an English translation?""",
                "options": [
                    {"label": "A", "text": "When the proceedings are being heard in the Welsh capital, Cardiff."},
                    {"label": "B", "text": "When all parties to the proceedings agree to the filing of the document in Welsh."},
                    {"label": "C", "text": "When the party filing the document is a Welsh speaker."},
                    {"label": "D", "text": "When the claim relates to land located in Wales."},
                    {"label": "E", "text": "When the document is a witness statement from a witness who only speaks Welsh."}
                ],
                "correct_answer": "B",
                "explanation": "Paragraph 3.1 of the PD states that a party may file a document in Welsh, provided that all other parties consent. In the absence of consent, a translation must be provided (para 3.2). Location (a, d), personal preference (c), or the witness's language (e) do not, by themselves, waive the requirement for consent or a translation.",
                "difficulty": "medium"
            },
            {
                "id": 19,
                "title": "",
                "text": """A party wishes to have the trial of a civil claim conducted wholly in the Welsh language. What must they do?""",
                "options": [
                    {"label": "A", "text": "Nothing; it is an automatic right in any court in England and Wales."},
                    {"label": "B", "text": "File and serve a notice in accordance with CPR PD 57B."},
                    {"label": "C", "text": "Apply for an order from the court, giving reasons."},
                    {"label": "D", "text": "Ensure that the claim form was originally issued in Welsh."},
                    {"label": "E", "text": "Obtain the written consent of all other parties to the proceedings."}
                ],
                "correct_answer": "C",
                "explanation": "Paragraph 5.1 of the PD states that a party who wants a hearing to be conducted wholly or partly in Welsh must apply for an order. The application should be made as soon as possible and indicate the reasons. (b) is incorrect; PD 57B relates to the Welsh Language Watch. (e) Consent is not required, though the court will consider the interests of other parties.",
                "difficulty": "medium"
            },
            {
                "id": 20,
                "title": "",
                "text": """What is the effect of the Welsh Language (Wales) Measure 2011 on civil proceedings in the courts of England and Wales?""",
                "options": [
                    {"label": "A", "text": "It makes Welsh an official language of the courts in Wales, placing it on an equal footing with English."},
                    {"label": "B", "text": "It requires all proceedings relating to Wales to be conducted in Welsh."},
                    {"label": "C", "text": "It abolishes the need for translations from Welsh to English in any court document."},
                    {"label": "D", "text": "It applies only to criminal proceedings in Wales."},
                    {"label": "E", "text": "It mandates that all judges sitting in Wales must be fluent in Welsh."}
                ],
                "correct_answer": "A",
                "explanation": "The 2011 Measure gives the Welsh language official status in Wales. This is reflected in the PD, which states that the official languages of the courts in Wales are English and Welsh, and they should be treated on the basis of equality. (b), (c), (d), and (e) are all incorrect statements of the law.",
                "difficulty": "easy"
            },
            {
                "id": 21,
                "title": "",
                "text": """A junior doctor, employed by NHS Trust A but temporarily assigned to work at Hospital B (run by NHS Trust B), negligently misdiagnoses a patient. The patient suffers injury. The patient wishes to sue. Which of the following statements regarding the correct parties is MOST ACCURATE?""",
                "options": [
                    {"label": "A", "text": "The patient can only sue NHS Trust A, as it is the doctor's general employer under the principle of vicarious liability."},
                    {"label": "B", "text": "The patient can only sue NHS Trust B, as it had day-to-day control of the doctor at the time of the negligence."},
                    {"label": "C", "text": "The patient must sue the doctor personally, as the doctor owed the personal duty of care."},
                    {"label": "D", "text": "The patient may sue both NHS Trust A and NHS Trust B as potentially liable defendants, and the court will determine which bears vicarious liability."},
                    {"label": "E", "text": "The patient should sue the Secretary of State for Health, as the ultimate responsible body for the NHS."}
                ],
                "correct_answer": "D",
                "explanation": "In scenarios involving temporary assignments or 'borrowed employees,' the test for vicarious liability focuses on who had the right to control the employee's relevant actions. The court will examine the details of the arrangement (Mersey Docks and Harbour Board v Coggins & Griffiths). It is procedurally sound and common to join both potential employers as defendants, letting the court decide liability. (a) & (b) are potentially correct but prematurely definitive. (c) is legally true but impractical; the primary target is the vicariously liable employer. (e) is incorrect.",
                "difficulty": "hard"
            },
            {
                "id": 22,
                "title": "",
                "text": """On 1 October 2018, a homeowner entered a 10-year contract with a builder for roof repairs. The contract included a 12-year guarantee against defects. A latent defect in the work, which was not and could not have been reasonably discovered, caused major water damage to the property on 15 September 2023. The homeowner discovered the cause was the builder's faulty workmanship on 1 November 2023. Assuming the claim is in both contract and tort (negligence), what is the expiry date for the limitation period for the tort claim?""",
                "options": [
                    {"label": "A", "text": "1 October 2030 (12 years from the contract)."},
                    {"label": "B", "text": "1 October 2024 (6 years from the breach of contract)."},
                    {"label": "C", "text": "15 September 2029 (6 years from the date of damage)."},
                    {"label": "D", "text": "1 November 2026 (3 years from the date of knowledge)."},
                    {"label": "E", "text": "15 September 2026 (3 years from the date the damage occurred)."}
                ],
                "correct_answer": "D",
                "explanation": "For negligence causing latent damage (not involving personal injury), the Limitation Act 1980 provides a special time limit under s.14A. The primary 6-year period runs from the date the cause of action accrued (date of damage: 15 Sept 2023), so would expire 15 Sept 2029 (c). However, s.14A provides an alternative 3-year limitation period starting from the 'date of knowledge' of the material facts, if later. Here, knowledge was on 1 Nov 2023, so the 3-year period expires 1 Nov 2026. This later date is the operative one. (a) is the contract period based on a specialty (deed), not applicable here. (b) is the contract accrual date, not for tort.",
                "difficulty": "hard"
            },
            {
                "id": 23,
                "title": "",
                "text": """A claimant was injured in a tripping accident on a public highway on 1 May 2020. She consulted a solicitor in June 2020 but was incorrectly advised she had no claim. On 1 April 2024, after changing solicitors, she obtained an expert report confirming the local authority's negligence. She now wishes to sue. Applying the Limitation Act 1980, which of the following is the BEST advice?""",
                "options": [
                    {"label": "A", "text": "The claim is barred because more than 3 years have passed since the accident (1 May 2020)."},
                    {"label": "B", "text": "The claim is not barred because she has issued within 3 years of her date of knowledge (1 April 2024)."},
                    {"label": "C", "text": "The claim is technically barred but the court is likely to grant an extension under s.33 as she was let down by her first solicitor."},
                    {"label": "D", "text": "The claim is technically barred as the primary period expired on 1 May 2023; she must apply under s.33 for the court to exercise its discretion to allow the claim to proceed."},
                    {"label": "E", "text": "The claim is not barred because the limitation period for injuries against a public authority is 6 years."}
                ],
                "correct_answer": "D",
                "explanation": "The primary limitation period for personal injury (s.11) expired on 1 May 2023 (3 years from accrual). The date she gained constructive knowledge (April 2024) does not trigger a new primary period under s.14, as her lack of knowledge was due to a mistake of law (s.14(3)). Therefore, the claim is statute-barred. Her only recourse is to apply under s.33 for the court to disapply the limitation period, arguing it would be equitable to do so. (a) is true but incomplete; it doesn't mention s.33. (b) is wrong due to s.14(3). (c) is presumptive; the s.33 discretion is not automatic. (e) is incorrect; it's 3 years.",
                "difficulty": "hard"
            },
            {
                "id": 24,
                "title": "",
                "text": """A consumer purchases a poorly manufactured ladder from a retailer on 12 March 2022. On 10 April 2022, the ladder collapses while being used, causing injury to the consumer. On 15 April 2022, the consumer writes to the retailer demanding compensation. The retailer denies liability. The consumer issues a claim form against the retailer for breach of the Consumer Rights Act 2015 (goods not of satisfactory quality) and in negligence on 20 May 2025. Which cause of action is definitely statute-barred?""",
                "options": [
                    {"label": "A", "text": "The claim under the Consumer Rights Act 2015."},
                    {"label": "B", "text": "The claim in negligence (personal injury)."},
                    {"label": "C", "text": "Both claims."},
                    {"label": "D", "text": "Neither claim."},
                    {"label": "E", "text": "Only the claim for property damage to the ladder."}
                ],
                "correct_answer": "B",
                "explanation": "The breach of contract claim under the CRA 2015 accrued on the date of sale (12 March 2022). The limitation period is 6 years, expiring on 12 March 2028. Issued in May 2025, it is within time. The negligence claim for personal injury accrued on the date of injury (10 April 2022). The primary limitation period is 3 years, expiring on 10 April 2025. The claim was issued on 20 May 2025, which is outside this period. Therefore, the negligence claim is statute-barred unless a s.33 application succeeds.",
                "difficulty": "hard"
            },
            {
                "id": 25,
                "title": "",
                "text": """A company (C) enters a contract with a designer (D) on 1 February 2020 for a new company logo. The contract is executed as a deed. D delivers the final logo on 1 April 2020. On 1 June 2023, C discovers that D plagiarised the logo from another artist, putting C at risk of an infringement claim. C wishes to sue D for breach of contract. What is the limitation expiry date for this claim?""",
                "options": [
                    {"label": "A", "text": "1 April 2026 (6 years from delivery/breach)."},
                    {"label": "B", "text": "1 February 2032 (12 years from the date of the contract under seal)."},
                    {"label": "C", "text": "1 June 2026 (3 years from the date of discovery)."},
                    {"label": "D", "text": "1 April 2032 (12 years from the date of breach under a deed)."},
                    {"label": "E", "text": "1 February 2026 (6 years from the date of the contract)."}
                ],
                "correct_answer": "D",
                "explanation": "This is a claim for breach of a contract contained in a deed (a 'specialty'). Under s.8 of the Limitation Act 1980, the limitation period for such claims is 12 years from the date on which the cause of action accrued. The cause of action for breach of contract accrues on the date of the breach. The breach (delivery of a plagiarised logo in breach of the implied term of satisfactory quality and/or quiet possession) occurred on 1 April 2020. Therefore, the limitation period expires on 1 April 2032. (a) is the 6-year period applicable to simple contracts. (b) incorrectly calculates from the contract date rather than the breach date. (c) confuses the rule for negligence under s.14A. (e) is both the wrong period and the wrong start date.",
                "difficulty": "hard"
            }
        ]
        print("-> Patched Dispute Resolution Section A with 25 new questions")
        
        # =====================================================
        # Patch Dispute Resolution Section B - Where to start proceedings
        # =====================================================
        area_b = next((a for a in dispute_topic["areas"] if a["letter"] == "B"), None)
        if area_b:
            area_b["name"] = "Where to start proceedings"
            area_b["slug"] = "b-where-to-start-proceedings"
            area_b["question_count"] = 20
        else:
            area_b = {
                "letter": "B",
                "name": "Where to start proceedings",
                "slug": "b-where-to-start-proceedings",
                "question_count": 20,
                "questions": []
            }
            dispute_topic["areas"].insert(1, area_b)
        
        area_b["questions"] = [
            {
                "id": 1,
                "title": "",
                "text": """A claimant wishes to bring a claim for £120,000 for breach of contract. Where should the claimant normally start proceedings?""",
                "options": [
                    {"label": "A", "text": "County Court"},
                    {"label": "B", "text": "High Court, Queen's Bench Division"},
                    {"label": "C", "text": "High Court, Chancery Division"},
                    {"label": "D", "text": "Small Claims Track"},
                    {"label": "E", "text": "Family Court"}
                ],
                "correct_answer": "B",
                "explanation": "Claims over £100,000 for general civil disputes (like breach of contract or tort) are allocated to the High Court. Queen's Bench Division is appropriate for common law disputes. County courts generally handle claims up to £100,000. The Chancery Division deals with insolvency, trusts, mortgages, and company matters.",
                "difficulty": "easy"
            },
            {
                "id": 2,
                "title": "",
                "text": """A landlord wishes to recover possession of a residential property due to rent arrears. Which court should they generally approach first?""",
                "options": [
                    {"label": "A", "text": "County Court"},
                    {"label": "B", "text": "High Court, Queen's Bench Division"},
                    {"label": "C", "text": "Commercial Court"},
                    {"label": "D", "text": "Employment Tribunal"},
                    {"label": "E", "text": "Magistrates' Court"}
                ],
                "correct_answer": "A",
                "explanation": "Possession claims for residential property are usually started in the county court. High Court can be used if the matter is complex or involves multiple claims, but the starting point is county court.",
                "difficulty": "easy"
            },
            {
                "id": 3,
                "title": "",
                "text": """A company seeks to challenge a decision of a government department regarding a regulatory matter. Where is the specialist jurisdiction for such claims?""",
                "options": [
                    {"label": "A", "text": "High Court, Queen's Bench Division – Administrative Court"},
                    {"label": "B", "text": "High Court, Chancery Division"},
                    {"label": "C", "text": "County Court"},
                    {"label": "D", "text": "Family Court"},
                    {"label": "E", "text": "Crown Court"}
                ],
                "correct_answer": "A",
                "explanation": "Administrative Court deals with judicial review claims against public bodies. Chancery Division deals with business, trusts, insolvency, not public law challenges. Crown Court handles criminal cases, not civil regulatory disputes.",
                "difficulty": "medium"
            },
            {
                "id": 4,
                "title": "",
                "text": """Which of the following claims is likely to be allocated to the Chancery Division of the High Court?""",
                "options": [
                    {"label": "A", "text": "Claim for breach of contract for £50,000"},
                    {"label": "B", "text": "Claim involving mortgage repossession"},
                    {"label": "C", "text": "Claim for personal injury"},
                    {"label": "D", "text": "Claim under the small claims track"},
                    {"label": "E", "text": "Employment discrimination claim"}
                ],
                "correct_answer": "B",
                "explanation": "Chancery Division specializes in property disputes, mortgages, trusts, and company law. Contract claims usually go to Queen's Bench unless complex or over £100,000. Employment disputes go to Employment Tribunal.",
                "difficulty": "medium"
            },
            {
                "id": 5,
                "title": "",
                "text": """A claim arises from an employment dispute over unfair dismissal. Which forum has jurisdiction?""",
                "options": [
                    {"label": "A", "text": "High Court, Queen's Bench Division"},
                    {"label": "B", "text": "Employment Tribunal"},
                    {"label": "C", "text": "County Court"},
                    {"label": "D", "text": "Small Claims Track"},
                    {"label": "E", "text": "Administrative Court"}
                ],
                "correct_answer": "B",
                "explanation": "Employment Tribunals are specialized courts for employment disputes. High Court does not hear employment claims initially. County Court does not handle employment disputes.",
                "difficulty": "easy"
            },
            {
                "id": 6,
                "title": "",
                "text": """Which of the following is a specialist court for intellectual property disputes?""",
                "options": [
                    {"label": "A", "text": "High Court, Chancery Division"},
                    {"label": "B", "text": "County Court"},
                    {"label": "C", "text": "High Court, Intellectual Property Enterprise Court (IPEC)"},
                    {"label": "D", "text": "Family Court"},
                    {"label": "E", "text": "Employment Tribunal"}
                ],
                "correct_answer": "C",
                "explanation": "IPEC handles intellectual property disputes with cost-effective procedures. Chancery handles company, insolvency, and trusts, not specialized IP disputes.",
                "difficulty": "medium"
            },
            {
                "id": 7,
                "title": "",
                "text": """A claimant wishes to start proceedings in the High Court for a complex international commercial dispute valued at £3 million. Which division is appropriate?""",
                "options": [
                    {"label": "A", "text": "Chancery Division"},
                    {"label": "B", "text": "Queen's Bench Division – Commercial Court"},
                    {"label": "C", "text": "Family Court"},
                    {"label": "D", "text": "County Court"},
                    {"label": "E", "text": "Employment Tribunal"}
                ],
                "correct_answer": "B",
                "explanation": "Commercial Court handles high-value, complex business disputes, including international contracts. Chancery deals with financial, trusts, and property disputes, not international commercial disputes.",
                "difficulty": "medium"
            },
            {
                "id": 8,
                "title": "",
                "text": """Which court generally handles claims under £10,000?""",
                "options": [
                    {"label": "A", "text": "High Court"},
                    {"label": "B", "text": "County Court – Small Claims Track"},
                    {"label": "C", "text": "Queen's Bench Division"},
                    {"label": "D", "text": "Chancery Division"},
                    {"label": "E", "text": "County Court – Fast Track"}
                ],
                "correct_answer": "B",
                "explanation": "County Court handles small claims track for low-value claims. High Court is for high-value claims.",
                "difficulty": "easy"
            },
            {
                "id": 9,
                "title": "",
                "text": """A person wants to dispute a will under the Inheritance (Provision for Family and Dependants) Act 1975. Which court has jurisdiction?""",
                "options": [
                    {"label": "A", "text": "Family Court"},
                    {"label": "B", "text": "County Court"},
                    {"label": "C", "text": "High Court, Chancery Division"},
                    {"label": "D", "text": "High Court, Queen's Bench Division"},
                    {"label": "E", "text": "Small Claims Track"}
                ],
                "correct_answer": "C",
                "explanation": "Chancery Division deals with trusts, estates, and probate disputes. Family Court does not deal with disputed wills.",
                "difficulty": "medium"
            },
            {
                "id": 10,
                "title": "",
                "text": """A claim involves challenging a planning permission granted by a local authority. Where should proceedings be started?""",
                "options": [
                    {"label": "A", "text": "High Court, Administrative Court"},
                    {"label": "B", "text": "High Court, Chancery Division"},
                    {"label": "C", "text": "County Court"},
                    {"label": "D", "text": "Family Court"},
                    {"label": "E", "text": "Employment Tribunal"}
                ],
                "correct_answer": "A",
                "explanation": "Judicial review of local authority decisions, including planning, is in the Administrative Court. Chancery deals with business/property matters, not planning permissions.",
                "difficulty": "medium"
            },
            {
                "id": 11,
                "title": "",
                "text": """Mr. A, a businessman, claims that his supplier, Mr. B, delivered defective goods which caused him a loss of £85,000. He also incurred additional incidental costs of £10,000 while trying to mitigate the loss. Where should Mr. A start proceedings based on the value of the claim?""",
                "options": [
                    {"label": "A", "text": "County Court – Small Claims Track"},
                    {"label": "B", "text": "County Court – Fast Track"},
                    {"label": "C", "text": "County Court – Multi-Track"},
                    {"label": "D", "text": "High Court – Queen's Bench Division"},
                    {"label": "E", "text": "High Court – Chancery Division"}
                ],
                "correct_answer": "C",
                "explanation": "Claims over £25,000 or complex claims are allocated to multi-track. High Court generally starts for claims over £100,000. This claim (£95,000 total) is below that threshold.",
                "difficulty": "medium"
            },
            {
                "id": 12,
                "title": "",
                "text": """Ms. Y, a homeowner, suffered personal injury due to a trip in a supermarket. She claims damages for medical expenses, lost earnings, and pain and suffering. The total claim is calculated at £7,500. Which track and court is suitable for her claim?""",
                "options": [
                    {"label": "A", "text": "County Court – Small Claims Track"},
                    {"label": "B", "text": "County Court – Fast Track"},
                    {"label": "C", "text": "County Court – Multi-Track"},
                    {"label": "D", "text": "High Court – Queen's Bench Division"},
                    {"label": "E", "text": "High Court – Chancery Division"}
                ],
                "correct_answer": "A",
                "explanation": "Personal injury claims under £10,000 go to the small claims track. Fast track is for claims £10,000–£25,000.",
                "difficulty": "easy"
            },
            {
                "id": 13,
                "title": "",
                "text": """A company sues a contractor for defective work on an office building. The claim is valued at £1,250,000. The company seeks damages for breach of contract and additional losses caused by project delay. Where should the company initiate proceedings?""",
                "options": [
                    {"label": "A", "text": "County Court – Multi-Track"},
                    {"label": "B", "text": "High Court – Queen's Bench Division"},
                    {"label": "C", "text": "High Court – Commercial Court"},
                    {"label": "D", "text": "High Court – Chancery Division"},
                    {"label": "E", "text": "County Court – Small Claims Track"}
                ],
                "correct_answer": "B",
                "explanation": "Queen's Bench Division handles high-value general civil claims including breach of contract. Commercial Court could be used if claim is commercial and complex; this scenario suggests a standard building contract, not an international commercial dispute.",
                "difficulty": "medium"
            },
            {
                "id": 14,
                "title": "",
                "text": """Mrs. Z wants to challenge a bank's refusal to grant her a mortgage. The claim includes compensation of £60,000 for financial loss and legal costs. Which court and track is appropriate?""",
                "options": [
                    {"label": "A", "text": "County Court – Fast Track"},
                    {"label": "B", "text": "County Court – Multi-Track"},
                    {"label": "C", "text": "High Court – Chancery Division"},
                    {"label": "D", "text": "High Court – Queen's Bench Division"},
                    {"label": "E", "text": "Small Claims Track"}
                ],
                "correct_answer": "B",
                "explanation": "£60,000 claim is over £25,000, so multi-track is used in county court for complex/high-value cases under £100,000 threshold for High Court.",
                "difficulty": "medium"
            },
            {
                "id": 15,
                "title": "",
                "text": """A claimant suffered a personal injury from a road accident. The total claim including medical expenses, lost earnings, and general damages is £18,000. Which track should this claim follow?""",
                "options": [
                    {"label": "A", "text": "County Court – Small Claims Track"},
                    {"label": "B", "text": "County Court – Fast Track"},
                    {"label": "C", "text": "County Court – Multi-Track"},
                    {"label": "D", "text": "High Court – Queen's Bench Division"},
                    {"label": "E", "text": "High Court – Chancery Division"}
                ],
                "correct_answer": "B",
                "explanation": "Claims £10,000–£25,000 go to fast track. Multi-track is for claims over £25,000.",
                "difficulty": "easy"
            },
            {
                "id": 16,
                "title": "",
                "text": """Mr. K claims £250,000 against a supplier for late delivery and lost profits in an international trade contract. Which court should he start proceedings in?""",
                "options": [
                    {"label": "A", "text": "County Court – Multi-Track"},
                    {"label": "B", "text": "High Court – Queen's Bench Division"},
                    {"label": "C", "text": "High Court – Commercial Court"},
                    {"label": "D", "text": "High Court – Chancery Division"},
                    {"label": "E", "text": "Employment Tribunal"}
                ],
                "correct_answer": "C",
                "explanation": "Commercial Court specializes in high-value commercial disputes, including international trade. Queen's Bench Division could hear general disputes, but international/commercial complexity points to Commercial Court.",
                "difficulty": "medium"
            },
            {
                "id": 17,
                "title": "",
                "text": """A consumer claims £2,500 against a retailer for faulty goods purchased online. Where should proceedings normally be started?""",
                "options": [
                    {"label": "A", "text": "County Court – Small Claims Track"},
                    {"label": "B", "text": "County Court – Fast Track"},
                    {"label": "C", "text": "County Court – Multi-Track"},
                    {"label": "D", "text": "High Court – Queen's Bench Division"},
                    {"label": "E", "text": "High Court – Chancery Division"}
                ],
                "correct_answer": "A",
                "explanation": "Small claims track handles claims under £10,000.",
                "difficulty": "easy"
            },
            {
                "id": 18,
                "title": "",
                "text": """A company wants to claim £95,000 for breach of a commercial supply agreement. The matter involves standard contract issues without international elements. Which court/track is appropriate?""",
                "options": [
                    {"label": "A", "text": "County Court – Multi-Track"},
                    {"label": "B", "text": "High Court – Queen's Bench Division"},
                    {"label": "C", "text": "High Court – Commercial Court"},
                    {"label": "D", "text": "Small Claims Track"},
                    {"label": "E", "text": "County Court – Fast Track"}
                ],
                "correct_answer": "A",
                "explanation": "Claims under £100,000 but over £25,000 go to county court multi-track. High Court is typically used for claims over £100,000.",
                "difficulty": "medium"
            },
            {
                "id": 19,
                "title": "",
                "text": """A family claims £8,000 in damages for defective building works in their home. The matter involves minor property defects and no complex issues. Which track should the court allocate this claim to?""",
                "options": [
                    {"label": "A", "text": "County Court – Small Claims Track"},
                    {"label": "B", "text": "County Court – Fast Track"},
                    {"label": "C", "text": "County Court – Multi-Track"},
                    {"label": "D", "text": "High Court – Queen's Bench Division"},
                    {"label": "E", "text": "High Court – Chancery Division"}
                ],
                "correct_answer": "A",
                "explanation": "Claim under £10,000 with simple issues goes to small claims track.",
                "difficulty": "easy"
            },
            {
                "id": 20,
                "title": "",
                "text": """A software company claims £120,000 for unpaid invoices and related losses from another company. The matter involves standard contract disputes. Where should the company start proceedings?""",
                "options": [
                    {"label": "A", "text": "County Court – Multi-Track"},
                    {"label": "B", "text": "High Court – Queen's Bench Division"},
                    {"label": "C", "text": "High Court – Chancery Division"},
                    {"label": "D", "text": "High Court – Commercial Court"},
                    {"label": "E", "text": "Small Claims Track"}
                ],
                "correct_answer": "B",
                "explanation": "High Court for claims over £100,000; QBD handles general civil disputes. County Court is usually for claims under £100,000.",
                "difficulty": "medium"
            }
        ]
        print("-> Patched Dispute Resolution Section B with 20 new questions")
        
        # =====================================================
        # Patch Dispute Resolution Section C - Responding to a claim
        # =====================================================
        area_c = next((a for a in dispute_topic["areas"] if a["letter"] == "C"), None)
        if area_c:
            area_c["name"] = "Responding to a claim"
            area_c["slug"] = "c-responding-to-a-claim"
            area_c["question_count"] = 20
        else:
            area_c = {
                "letter": "C",
                "name": "Responding to a claim",
                "slug": "c-responding-to-a-claim",
                "question_count": 20,
                "questions": []
            }
            dispute_topic["areas"].insert(2, area_c)
        
        area_c["questions"] = [
            {
                "id": 1,
                "title": "",
                "text": """A claim form and particulars of claim are served on a defendant on Monday, 1 October. The defendant intends to defend the entire claim. They file an acknowledgment of service on Friday, 5 October. What is the latest date by which they must file their defence, assuming no extension is agreed or ordered?""",
                "options": [
                    {"label": "A", "text": "Monday, 15 October."},
                    {"label": "B", "text": "Friday, 19 October."},
                    {"label": "C", "text": "Monday, 29 October."},
                    {"label": "D", "text": "Tuesday, 30 October."},
                    {"label": "E", "text": "Monday, 5 November."}
                ],
                "correct_answer": "C",
                "explanation": "CPR 15.4(1)(b) states that if a defendant files an acknowledgment of service, the period for filing a defence is 28 days after service of the particulars of claim. Particulars were served on 1 October. 28 days from 1 October is Monday, 29 October. Filing the AoS on 5 October does not change this start date; it only confirms the defendant is using the longer 28-day period instead of the 14-day period that would apply if no AoS was filed.",
                "difficulty": "medium"
            },
            {
                "id": 2,
                "title": "",
                "text": """A claimant serves proceedings for breach of contract. The defendant files a defence. Two months later, before any further steps are taken, the claimant decides they no longer wish to pursue the claim. They file and serve a notice of discontinuance. The defendant had incurred significant legal costs. What is the default legal position regarding costs following this discontinuance under CPR 38.6?""",
                "options": [
                    {"label": "A", "text": "Each party bears its own costs."},
                    {"label": "B", "text": "The defendant is liable for the claimant's costs up to the date of discontinuance."},
                    {"label": "C", "text": "The claimant is liable for the defendant's costs incurred up to the date of the notice of discontinuance."},
                    {"label": "D", "text": "The claimant is only liable for the defendant's costs if they required the court's permission to discontinue."},
                    {"label": "E", "text": "There is no order as to costs unless the court holds a hearing."}
                ],
                "correct_answer": "C",
                "explanation": "CPR 38.6(1) establishes the default position: a claimant who discontinues is liable for the costs incurred by the defendant up to the date of service of the notice of discontinuance. This rule applies unless the court orders otherwise.",
                "difficulty": "medium"
            },
            {
                "id": 3,
                "title": "",
                "text": """A defendant is served with a claim form and believes the court does not have jurisdiction to hear the claim. What must they do to dispute jurisdiction without submitting to the jurisdiction?""",
                "options": [
                    {"label": "A", "text": "File an acknowledgment of service and then apply for a stay of proceedings."},
                    {"label": "B", "text": "File a defence raising the jurisdiction issue as a preliminary matter."},
                    {"label": "C", "text": "Take no steps in the proceedings and apply for an order declaring the court lacks jurisdiction."},
                    {"label": "D", "text": "File an acknowledgment of service and then file an application contesting jurisdiction within 14 days of filing the acknowledgment."},
                    {"label": "E", "text": "File an acknowledgment of service and then file an application contesting jurisdiction within 28 days of filing the acknowledgment."}
                ],
                "correct_answer": "D",
                "explanation": "CPR 11 sets out the procedure. A defendant who wishes to dispute jurisdiction must first file an acknowledgment of service (CPR 11(2)). They must then make an application within 14 days of filing the AoS (CPR 11(4)). Filing an AoS does not constitute submission to jurisdiction (CPR 11(3)). Filing a defence would constitute submission.",
                "difficulty": "hard"
            },
            {
                "id": 4,
                "title": "",
                "text": """Default judgment in a money claim can be entered by the claimant under CPR 12.3(1) if the defendant fails to:""",
                "options": [
                    {"label": "A", "text": "File an acknowledgment of service within 28 days of service or file a defence within 14 days of service of particulars."},
                    {"label": "B", "text": "File a defence within 28 days of service of particulars of claim."},
                    {"label": "C", "text": "File an acknowledgment of service within 14 days of service or file a defence within 28 days of service of particulars."},
                    {"label": "D", "text": "File a defence within 14 days of service of the claim form."},
                    {"label": "E", "text": "Respond in any way within 21 days of service."}
                ],
                "correct_answer": "C",
                "explanation": "CPR 12.3(1) states default judgment may be obtained if the defendant has failed to file an acknowledgment of service or failed to file a defence within the time specified. The time for AoS is 14 days after service of the claim form (CPR 10.3). The time for defence is 14 days after service of particulars if no AoS filed, or 28 days after service of particulars if AoS filed (CPR 15.4).",
                "difficulty": "medium"
            },
            {
                "id": 5,
                "title": "",
                "text": """A defendant files an acknowledgment of service but then fails to file a defence within the 28-day period. The claimant enters default judgment. The defendant applies to set it aside, arguing they have a meritorious defence. What is the court's primary consideration under CPR 13.3?""",
                "options": [
                    {"label": "A", "text": "Whether the defendant has a reasonable excuse for the delay."},
                    {"label": "B", "text": "Whether the defendant has applied promptly."},
                    {"label": "C", "text": "Whether the defendant has a real prospect of successfully defending the claim or there is some other good reason to set it aside."},
                    {"label": "D", "text": "Whether the claimant will suffer prejudice if judgment is set aside."},
                    {"label": "E", "text": "Whether the defendant has paid any money due under the judgment."}
                ],
                "correct_answer": "C",
                "explanation": "CPR 13.3(1) sets out the two main grounds: (a) the defendant has a real prospect of success, or (b) there is some other good reason. While other factors may be considered, the primary test is whether the defendant has a real prospect of success.",
                "difficulty": "medium"
            },
            {
                "id": 6,
                "title": "",
                "text": """In a claim for specified damages (a liquidated demand), the defendant files an admission on Form N9A offering to pay by instalments. What is the claimant's option if they reject the proposed instalment plan?""",
                "options": [
                    {"label": "A", "text": "They can enter default judgment for the full amount immediately."},
                    {"label": "B", "text": "They must apply to the court for a determination of the rate of payment."},
                    {"label": "C", "text": "They can request judgment for the admitted sum but must apply to the court for the terms of payment."},
                    {"label": "D", "text": "They can ignore the admission and proceed as if the defendant had filed a defence."},
                    {"label": "E", "text": "The admission is deemed withdrawn, and the defendant must file a defence."}
                ],
                "correct_answer": "B",
                "explanation": "CPR 14.5 applies. If the claimant does not accept the defendant's proposal for time to pay, they must request the court to determine the rate of payment. The claimant can request judgment on the admitted sum, but the court will decide the terms of payment.",
                "difficulty": "medium"
            },
            {
                "id": 7,
                "title": "",
                "text": """A claimant serves a claim form and particulars. The defendant files an acknowledgment of service within 14 days. How long does the defendant then have to file a defence?""",
                "options": [
                    {"label": "A", "text": "14 days from the date of service of the claim form."},
                    {"label": "B", "text": "14 days from the date of filing the acknowledgment of service."},
                    {"label": "C", "text": "28 days from the date of service of the particulars of claim."},
                    {"label": "D", "text": "28 days from the date of filing the acknowledgment of service."},
                    {"label": "E", "text": "21 days from the date of service of the claim form."}
                ],
                "correct_answer": "C",
                "explanation": "CPR 15.4(1)(b) states that if the defendant files an acknowledgment of service, the period for filing a defence is 28 days after service of the particulars of claim.",
                "difficulty": "easy"
            },
            {
                "id": 8,
                "title": "",
                "text": """A defendant wishes to bring a counterclaim against the claimant. When must the counterclaim be filed?""",
                "options": [
                    {"label": "A", "text": "At the same time as filing the defence, using Form N9D."},
                    {"label": "B", "text": "Within 14 days after filing the defence, using a separate claim form."},
                    {"label": "C", "text": "At any time before trial, with the court's permission."},
                    {"label": "D", "text": "Within 28 days of service of the claim form."},
                    {"label": "E", "text": "At the same time as filing the defence, using Form N6D."}
                ],
                "correct_answer": "A",
                "explanation": "CPR 20.4(1) states that a defendant may make a counterclaim against a claimant by filing particulars of the counterclaim with their defence. Form N9D is the combined form for defence and counterclaim.",
                "difficulty": "medium"
            },
            {
                "id": 9,
                "title": "",
                "text": """Under CPR 38, a claimant may discontinue all or part of a claim against a defendant by:""",
                "options": [
                    {"label": "A", "text": "Simply filing a notice of discontinuance and serving it on all parties, without the court's permission."},
                    {"label": "B", "text": "Applying to the court for an order granting permission to discontinue."},
                    {"label": "C", "text": "Filing a notice of discontinuance, but requires the court's permission if an interim injunction has been granted."},
                    {"label": "D", "text": "Filing a notice of discontinuance, but requires the consent of all other parties."},
                    {"label": "E", "text": "Filing a notice of discontinuance at any time before trial."}
                ],
                "correct_answer": "C",
                "explanation": "CPR 38.2(2) states a claimant may discontinue by filing a notice, but under CPR 38.2(2)(a), the claimant requires the court's permission if the court has granted an interim injunction.",
                "difficulty": "medium"
            },
            {
                "id": 10,
                "title": "",
                "text": """A defendant files an acknowledgment of service indicating an intention to defend the claim. They then fail to file a defence within the 28-day period. The claimant enters default judgment. The defendant applies to set aside, showing they were ill and could not instruct solicitors. What additional condition must generally be met for the court to set aside judgment?""",
                "options": [
                    {"label": "A", "text": "The defendant must pay the judgment sum into court."},
                    {"label": "B", "text": "The defendant must have a reasonable prospect of success on the merits."},
                    {"label": "C", "text": "The defendant must have applied to set aside within 14 days of learning of the judgment."},
                    {"label": "D", "text": "The defendant must show they filed the acknowledgment of service in time."},
                    {"label": "E", "text": "The claimant must consent to the judgment being set aside."}
                ],
                "correct_answer": "B",
                "explanation": "Under CPR 13.3(1), the court may set aside if the defendant shows a real prospect of success or there is some other good reason. While the court will consider the reason for default, it must also consider the merits.",
                "difficulty": "medium"
            },
            {
                "id": 11,
                "title": "",
                "text": """A defendant admits liability for a specified sum of money but claims they have already paid it. How should they respond?""",
                "options": [
                    {"label": "A", "text": "File a defence stating the money has been paid."},
                    {"label": "B", "text": "File an admission (Form N9A) and attach evidence of payment."},
                    {"label": "C", "text": "File an acknowledgment of service and then apply for summary judgment."},
                    {"label": "D", "text": "Do nothing, as the claim is effectively satisfied."},
                    {"label": "E", "text": "File a counterclaim for a declaration that the debt is discharged."}
                ],
                "correct_answer": "A",
                "explanation": "This is a defence of payment. The defendant should file a defence (Form N9B) setting out this factual defence. An admission would be inappropriate as the defendant is not admitting the money is owed.",
                "difficulty": "easy"
            },
            {
                "id": 12,
                "title": "",
                "text": """After a claim is settled, the parties wish to record the settlement in a way that is enforceable as a court order. What is the most common method?""",
                "options": [
                    {"label": "A", "text": "File a notice of discontinuance."},
                    {"label": "B", "text": "Enter into a Tomlin order, staying the proceedings on the agreed terms."},
                    {"label": "C", "text": "Enter into a consent order dismissing the claim."},
                    {"label": "D", "text": "File a notice of settlement with the court."},
                    {"label": "E", "text": "The claimant simply writes to the court withdrawing the claim."}
                ],
                "correct_answer": "B",
                "explanation": "A Tomlin order (staying proceedings on terms scheduled to the order) is a standard method for recording a settlement, as the terms become enforceable as a court order without needing to start new proceedings.",
                "difficulty": "medium"
            },
            {
                "id": 13,
                "title": "",
                "text": """A defendant wishes to admit a money claim but needs time to pay. They complete Form N9A, offering instalments of £50 per month. The claimant accepts the admission but rejects the rate of payment. What happens next?""",
                "options": [
                    {"label": "A", "text": "The claimant can enter judgment for the full amount immediately."},
                    {"label": "B", "text": "The court will automatically hold a hearing to determine payment terms."},
                    {"label": "C", "text": "The claimant must apply to the court for a determination of the terms of payment."},
                    {"label": "D", "text": "The defendant's offer is binding, and the claimant must accept it."},
                    {"label": "E", "text": "The admission is deemed withdrawn, and the defendant must file a defence."}
                ],
                "correct_answer": "C",
                "explanation": "Under CPR 14.5, if the claimant does not accept the defendant's proposal for payment, they may request the court to determine the rate of payment. The claimant files a request for judgment, and the court will decide the terms.",
                "difficulty": "medium"
            },
            {
                "id": 14,
                "title": "",
                "text": """In a claim for an unspecified amount (unliquidated damages), the defendant fails to file an acknowledgment of service or a defence. The claimant wishes to obtain default judgment. What must the claimant do?""",
                "options": [
                    {"label": "A", "text": "File a request for judgment in Form N227."},
                    {"label": "B", "text": "Apply to the court for judgment with supporting evidence on quantum."},
                    {"label": "C", "text": "File a notice of default and serve it on the defendant."},
                    {"label": "D", "text": "Simply file a certificate of non-response at court."},
                    {"label": "E", "text": "The claimant cannot obtain default judgment; they must apply for summary judgment."}
                ],
                "correct_answer": "B",
                "explanation": "For unliquidated damages (and other non-money claims), default judgment requires an application to the court (CPR 12.4(1)(b) and 12.10). The court will assess the amount of damages or give directions. Form N227 is for specified amounts.",
                "difficulty": "medium"
            },
            {
                "id": 15,
                "title": "",
                "text": """A defendant files an acknowledgment of service within the 14-day period but indicates they intend to contest jurisdiction. How long do they have to file their application disputing jurisdiction?""",
                "options": [
                    {"label": "A", "text": "14 days from the date of service of the claim form."},
                    {"label": "B", "text": "14 days from the date of filing the acknowledgment of service."},
                    {"label": "C", "text": "28 days from the date of service of the claim form."},
                    {"label": "D", "text": "28 days from the date of filing the acknowledgment of service."},
                    {"label": "E", "text": "Any time before filing a defence."}
                ],
                "correct_answer": "B",
                "explanation": "CPR 11(4)(a) requires the application to dispute jurisdiction to be made within 14 days after filing an acknowledgment of service.",
                "difficulty": "medium"
            },
            {
                "id": 16,
                "title": "",
                "text": """A claimant and defendant settle a claim after the defence is filed. They agree the claimant will discontinue and each party will bear its own costs. How should this be implemented to be binding?""",
                "options": [
                    {"label": "A", "text": "The claimant files a notice of discontinuance, and the defendant agrees not to apply for costs."},
                    {"label": "B", "text": "The claimant files a notice of discontinuance, and the parties file a consent order as to costs."},
                    {"label": "C", "text": "The parties file a Tomlin order staying the proceedings on the terms of settlement."},
                    {"label": "D", "text": "The claimant simply writes to the court withdrawing the claim."},
                    {"label": "E", "text": "The defendant applies to strike out the claim as settled."}
                ],
                "correct_answer": "B",
                "explanation": "CPR 38.6 provides that unless the court orders otherwise, a claimant who discontinues is liable for the defendant's costs. To avoid this, the parties should file a consent order as to costs (e.g., no order as to costs). A notice of discontinuance alone would leave the claimant liable for costs.",
                "difficulty": "medium"
            },
            {
                "id": 17,
                "title": "",
                "text": """A defendant is served with a claim form and particulars. They file an acknowledgment of service on day 14. On day 25, they file a defence. The claimant believes the defence has no merit. Can the claimant enter default judgment?""",
                "options": [
                    {"label": "A", "text": "No, because the defence was filed within 14 days of service of particulars."},
                    {"label": "B", "text": "Yes, because the defence has no merit."},
                    {"label": "C", "text": "No, because a defence has been filed, so default judgment is not available."},
                    {"label": "D", "text": "No, because the defence was filed within 28 days of service of particulars."},
                    {"label": "E", "text": "Only if the court gives permission."}
                ],
                "correct_answer": "D",
                "explanation": "The defence was filed within the 28-day period from service of particulars (day 25). Therefore, default judgment is not available. The claimant's remedy if they believe the defence has no merit is to apply for summary judgment under CPR Part 24.",
                "difficulty": "medium"
            },
            {
                "id": 18,
                "title": "",
                "text": """Which of the following is a consequence of filing an acknowledgment of service?""",
                "options": [
                    {"label": "A", "text": "It constitutes a submission to the jurisdiction of the court."},
                    {"label": "B", "text": "It extends the time for filing a defence to 28 days after service of particulars."},
                    {"label": "C", "text": "It waives any right to dispute the court's jurisdiction."},
                    {"label": "D", "text": "It extends the time for filing a defence to 14 days after service of particulars."},
                    {"label": "E", "text": "It prevents the claimant from applying for summary judgment."}
                ],
                "correct_answer": "B",
                "explanation": "CPR 15.4(1)(b) provides that filing an AoS extends the time for defence to 28 days after service of particulars. Filing an AoS does not constitute submission to jurisdiction if the defendant follows CPR 11.",
                "difficulty": "easy"
            },
            {
                "id": 19,
                "title": "",
                "text": """A claimant enters default judgment against a defendant. The defendant applies to set aside, arguing they never received the claim form. The court finds the claim form was not validly served. What is the likely outcome?""",
                "options": [
                    {"label": "A", "text": "The court must set aside the judgment under CPR 13.2."},
                    {"label": "B", "text": "The court may set aside the judgment under CPR 13.3 if the defendant has a real prospect of defence."},
                    {"label": "C", "text": "The court will order a trial of the issue of service."},
                    {"label": "D", "text": "The court will refuse to set aside because the defendant should have been more careful."},
                    {"label": "E", "text": "The court will set aside only if the defendant pays the judgment sum into court."}
                ],
                "correct_answer": "A",
                "explanation": "CPR 13.2 provides that the court must set aside default judgment if it was wrongly entered because the defendant did not file an acknowledgment or defence, but the claim form had not been served. Invalid service is a mandatory ground for setting aside.",
                "difficulty": "medium"
            },
            {
                "id": 20,
                "title": "",
                "text": """After a claim is settled, the parties agree that the claimant will discontinue and each side will pay its own costs. The claimant files a notice of discontinuance. What is the default costs position under CPR 38.6?""",
                "options": [
                    {"label": "A", "text": "The claimant is liable for the defendant's costs unless the court orders otherwise."},
                    {"label": "B", "text": "The defendant is liable for the claimant's costs because the claim was discontinued."},
                    {"label": "C", "text": "Each party bears its own costs automatically."},
                    {"label": "D", "text": "There is no order as to costs unless the parties file a consent order."},
                    {"label": "E", "text": "The court will decide costs at a hearing."}
                ],
                "correct_answer": "A",
                "explanation": "CPR 38.6(1) states that unless the court orders otherwise, a claimant who discontinues is liable for the costs incurred by the defendant up to the date of notice of discontinuance. Therefore, the claimant must get a consent order or court order to vary this default position.",
                "difficulty": "medium"
            }
        ]
        print("-> Patched Dispute Resolution Section C with 20 new questions")
        
        # =====================================================
        # Patch Dispute Resolution Section D - Statements of Case
        # =====================================================
        area_d = next((a for a in dispute_topic["areas"] if a["letter"] == "D"), None)
        if area_d:
            area_d["name"] = "Statements of Case"
            area_d["slug"] = "d-statements-of-case"
            area_d["question_count"] = 15
        else:
            area_d = {
                "letter": "D",
                "name": "Statements of Case",
                "slug": "d-statements-of-case",
                "question_count": 15,
                "questions": []
            }
            dispute_topic["areas"].insert(3, area_d)
        
        area_d["questions"] = [
            {
                "id": 1,
                "title": "",
                "text": """Under the Civil Procedure Rules, a claim form must be served on the defendant within a specified period after it is issued. What is this period?""",
                "options": [
                    {"label": "A", "text": "1 month."},
                    {"label": "B", "text": "2 months."},
                    {"label": "C", "text": "3 months."},
                    {"label": "D", "text": "4 months."},
                    {"label": "E", "text": "6 months."}
                ],
                "correct_answer": "D",
                "explanation": "CPR 7.5(1) provides that a claim form must be served within 4 months after the date of issue (or 6 months if the claim form is to be served out of the jurisdiction under rule 6.40).",
                "difficulty": "easy"
            },
            {
                "id": 2,
                "title": "",
                "text": """Which of the following must be included in all particulars of claim under CPR 16.4?""",
                "options": [
                    {"label": "A", "text": "A list of documents relied upon."},
                    {"label": "B", "text": "A concise statement of the facts on which the claimant relies."},
                    {"label": "C", "text": "A schedule of the claimant's loss and expense."},
                    {"label": "D", "text": "A detailed summary of the law."},
                    {"label": "E", "text": "Witness evidence supporting each fact."}
                ],
                "correct_answer": "B",
                "explanation": "CPR 16.4(1)(a) requires particulars of claim to include 'a concise statement of the facts on which the claimant relies.' Lists of documents and law are not mandatory, though a schedule of loss may be required in certain types of claims (e.g., personal injury).",
                "difficulty": "easy"
            },
            {
                "id": 3,
                "title": "",
                "text": """A party wishes to amend their statement of case after the other party has filed its defence. What must they do?""",
                "options": [
                    {"label": "A", "text": "File the amendment and serve it on all parties; no permission is needed."},
                    {"label": "B", "text": "Obtain the written consent of all parties or the court's permission."},
                    {"label": "C", "text": "File a new claim form and start the action again."},
                    {"label": "D", "text": "Apply for summary judgment before amending."},
                    {"label": "E", "text": "Wait until the case management conference to request the amendment."}
                ],
                "correct_answer": "B",
                "explanation": "CPR 17.1(2) provides that after the other party has filed a defence, a party may amend their statement of case only with the written consent of all other parties or the court's permission.",
                "difficulty": "medium"
            },
            {
                "id": 4,
                "title": "",
                "text": """A claimant issues a claim form but fails to serve it on the defendant. After 4 months, the claim has expired. What is the consequence?""",
                "options": [
                    {"label": "A", "text": "The claim form remains valid, but the claimant must apply for an extension of time."},
                    {"label": "B", "text": "The claim form is deemed served on the defendant by the court."},
                    {"label": "C", "text": "The claim form ceases to be valid for service."},
                    {"label": "D", "text": "The defendant can still acknowledge service and the case proceeds."},
                    {"label": "E", "text": "The claimant must pay a penalty fee to extend the claim form."}
                ],
                "correct_answer": "C",
                "explanation": "CPR 7.5 requires service within 4 months. If not served in time, the claim form ceases to be valid for service. The claimant must apply for an extension under CPR 7.6, which is discretionary.",
                "difficulty": "medium"
            },
            {
                "id": 5,
                "title": "",
                "text": """What is the purpose of a 'statement of truth' in a statement of case?""",
                "options": [
                    {"label": "A", "text": "To confirm the document has been reviewed by a solicitor."},
                    {"label": "B", "text": "To verify that the party believes the facts stated in the document are true."},
                    {"label": "C", "text": "To waive any privilege attaching to the document."},
                    {"label": "D", "text": "To confirm the party has paid all necessary court fees."},
                    {"label": "E", "text": "To notify the court the party intends to call witnesses."}
                ],
                "correct_answer": "B",
                "explanation": "CPR 22.1 requires a statement of truth, which is a statement that the party believes the facts stated in the document are true. This is to deter false statements and may lead to proceedings for contempt if made without an honest belief in its truth.",
                "difficulty": "easy"
            },
            {
                "id": 6,
                "title": "",
                "text": """A statement of case is struck out due to failure to include a required element. What is the likely result for the party?""",
                "options": [
                    {"label": "A", "text": "The party cannot re-file the statement; their claim/defence fails."},
                    {"label": "B", "text": "The court will automatically grant the party an extension to correct the error."},
                    {"label": "C", "text": "The party must apply for relief from sanctions under CPR 3.9."},
                    {"label": "D", "text": "The party may apply to the court for permission to file an amended statement."},
                    {"label": "E", "text": "The party can simply refile without applying to the court."}
                ],
                "correct_answer": "D",
                "explanation": "Where a statement of case is struck out, the party may apply for relief from sanctions under CPR 3.9 or apply for permission to file an amended or new statement. There is no automatic extension; the court has discretion.",
                "difficulty": "medium"
            },
            {
                "id": 7,
                "title": "",
                "text": """Which of the following is NOT a requirement for the content of a defence under CPR 16.5?""",
                "options": [
                    {"label": "A", "text": "State which allegations in the particulars of claim are denied."},
                    {"label": "B", "text": "State which allegations the defendant is unable to admit or deny."},
                    {"label": "C", "text": "State which allegations the defendant admits."},
                    {"label": "D", "text": "Set out the defendant's version of events."},
                    {"label": "E", "text": "Include a detailed schedule of the defendant's costs to date."}
                ],
                "correct_answer": "E",
                "explanation": "CPR 16.5 requires the defence to state which allegations are denied, admitted, or the defendant cannot admit or deny, and to set out the defendant's version of events if denying. There is no requirement for a costs schedule in the defence.",
                "difficulty": "medium"
            },
            {
                "id": 8,
                "title": "",
                "text": """A claimant wishes to add a new defendant to existing proceedings. They apply to the court for permission. What is the general test the court will apply?""",
                "options": [
                    {"label": "A", "text": "Whether the new defendant is related to the original defendant."},
                    {"label": "B", "text": "Whether it is desirable to add the new party to resolve all matters in dispute."},
                    {"label": "C", "text": "Whether the claimant has paid the necessary additional court fee."},
                    {"label": "D", "text": "Whether the new defendant consents to being added."},
                    {"label": "E", "text": "Whether the claim against the new defendant is likely to succeed."}
                ],
                "correct_answer": "B",
                "explanation": "CPR 19.2(2) provides that the court may add a new party if it is desirable to do so in order to resolve all the matters in dispute in the proceedings. Consent is not required, but prejudice to others may be considered.",
                "difficulty": "medium"
            },
            {
                "id": 9,
                "title": "",
                "text": """Under CPR Part 16, what must be stated if a claim for personal injuries includes a claim for damages for pain, suffering, and loss of amenity?""",
                "options": [
                    {"label": "A", "text": "A statement that the claimant has undergone medical treatment."},
                    {"label": "B", "text": "Whether the claimant expects to recover more or less than £1,000."},
                    {"label": "C", "text": "The name and address of the claimant's treating doctor."},
                    {"label": "D", "text": "The exact amount of general damages claimed."},
                    {"label": "E", "text": "A list of all previous personal injury claims by the claimant."}
                ],
                "correct_answer": "B",
                "explanation": "CPR 16.3(3)(a) requires that where the claimant is claiming damages for personal injuries, the particulars of claim must state whether the amount the claimant expects to recover as general damages for pain, suffering and loss of amenity is more or less than £1,000.",
                "difficulty": "medium"
            },
            {
                "id": 10,
                "title": "",
                "text": """A claim form is issued on 1 June. The claimant serves the claim form, without the particulars of claim, on 15 June. By what date must the particulars of claim be served?""",
                "options": [
                    {"label": "A", "text": "Within 7 days of service of the claim form."},
                    {"label": "B", "text": "Within 14 days of service of the claim form."},
                    {"label": "C", "text": "Within 28 days of service of the claim form"},
                    {"label": "D", "text": "Within 4 months of issue of the claim form."},
                    {"label": "E", "text": "At any time before the defence is filed."}
                ],
                "correct_answer": "B",
                "explanation": "CPR 7.4(2) provides that if the particulars of claim are not contained in or served with the claim form, they must be served on the defendant within 14 days after service of the claim form, but in any event not later than 4 months after the date of issue.",
                "difficulty": "medium"
            },
            {
                "id": 11,
                "title": "",
                "text": """What is the consequence if a defendant fails to deal with an allegation in their defence?""",
                "options": [
                    {"label": "A", "text": "The allegation is deemed denied."},
                    {"label": "B", "text": "The allegation is deemed admitted."},
                    {"label": "C", "text": "The court will strike out the defence."},
                    {"label": "D", "text": "The claimant must prove the allegation at trial."},
                    {"label": "E", "text": "The defendant can raise the issue in a witness statement."}
                ],
                "correct_answer": "B",
                "explanation": "CPR 16.5(5) states that if the defendant fails to deal with an allegation, they are taken to admit it. This emphasizes the need to address every allegation in the particulars of claim.",
                "difficulty": "easy"
            },
            {
                "id": 12,
                "title": "",
                "text": """A claimant wishes to rely on an expert report in their particulars of claim. Must they attach the report?""",
                "options": [
                    {"label": "A", "text": "Yes, the full report must be attached."},
                    {"label": "B", "text": "No, but they must identify the expert and summarise their conclusions."},
                    {"label": "C", "text": "No, expert evidence is not permitted at the statement of case stage."},
                    {"label": "D", "text": "Yes, but only if the claim is on the multi-track."},
                    {"label": "E", "text": "Expert reports are only attached to witness statements."}
                ],
                "correct_answer": "B",
                "explanation": "There is no requirement to attach expert reports to particulars of claim. However, if relying on expert evidence, it is good practice to identify the expert and summarize their conclusions. Full reports are exchanged later in proceedings.",
                "difficulty": "medium"
            },
            {
                "id": 13,
                "title": "",
                "text": """A reply to a defence is filed by the claimant. Under CPR Part 15, what is the effect of this reply?""",
                "options": [
                    {"label": "A", "text": "It becomes the claimant's final pleading, and no further statements of case can be filed."},
                    {"label": "B", "text": "It admits any allegations in the defence not specifically addressed in the reply."},
                    {"label": "C", "text": "If it does not address an allegation in the defence, it does not admit that allegation."},
                    {"label": "D", "text": "It allows the claimant to amend their particulars of claim without permission."},
                    {"label": "E", "text": "It automatically triggers a case management conference."}
                ],
                "correct_answer": "C",
                "explanation": "CPR 16.7 provides that a claimant who files a reply and fails to deal with an allegation in the defence is not taken to admit it. This is the reverse of the rule for defences.",
                "difficulty": "medium"
            },
            {
                "id": 14,
                "title": "",
                "text": """A defendant in a claim for breach of contract wishes to dispute the jurisdiction of the court. They file an acknowledgment of service indicating this. What must the acknowledgment include?""",
                "options": [
                    {"label": "A", "text": "The defendant's full defence on the merits."},
                    {"label": "B", "text": "A statement that the defendant intends to contest jurisdiction."},
                    {"label": "C", "text": "An application for a stay of proceedings."},
                    {"label": "D", "text": "Evidence supporting the jurisdictional challenge."},
                    {"label": "E", "text": "A request for the claim form to be set aside."}
                ],
                "correct_answer": "B",
                "explanation": "CPR 11(2) requires a defendant who wishes to contest jurisdiction to file an acknowledgment of service indicating that they intend to dispute the court's jurisdiction. The application itself follows under CPR 11(4).",
                "difficulty": "easy"
            },
            {
                "id": 15,
                "title": "",
                "text": """Under CPR Part 22, who may sign a statement of truth on behalf of a company?""",
                "options": [
                    {"label": "A", "text": "Only the company's chief executive officer."},
                    {"label": "B", "text": "A person holding a senior position in the company and authorized to do so."},
                    {"label": "C", "text": "Any employee of the company."},
                    {"label": "D", "text": "Only the company secretary."},
                    {"label": "E", "text": "Only the company's legal representative."}
                ],
                "correct_answer": "B",
                "explanation": "CPR 22.1(6)(b) provides that where a party is a company, the statement of truth must be signed by a person holding a senior position in the company. 'Senior position' is defined in PD 22 to include a director, treasurer, secretary, CEO, manager, or other officer of the company.",
                "difficulty": "easy"
            }
        ]
        print("-> Patched Dispute Resolution Section D with 15 new questions")
        
        # =====================================================
        # Patch Dispute Resolution Section E - Interim Applications
        # =====================================================
        area_e = next((a for a in dispute_topic["areas"] if a["letter"] == "E"), None)
        if area_e:
            area_e["name"] = "Interim Applications"
            area_e["slug"] = "e-interim-applications"
            area_e["question_count"] = 10
        else:
            area_e = {
                "letter": "E",
                "name": "Interim Applications",
                "slug": "e-interim-applications",
                "question_count": 10,
                "questions": []
            }
            dispute_topic["areas"].insert(4, area_e)
        
        area_e["questions"] = [
            {
                "id": 1,
                "title": "",
                "text": """A claimant in a breach of contract claim wishes to apply for an interim payment before trial. What must they generally demonstrate to obtain such an order under CPR 25.7?""",
                "options": [
                    {"label": "A", "text": "That the defendant has admitted liability."},
                    {"label": "B", "text": "That they have a reasonable prospect of success at trial."},
                    {"label": "C", "text": "That they have already won a related case against the defendant."},
                    {"label": "D", "text": "That the defendant has the means to pay the sum ordered."},
                    {"label": "E", "text": "That they would suffer irreparable harm without the payment."}
                ],
                "correct_answer": "A",
                "explanation": "CPR 25.7(1) sets out the conditions for an interim payment. The most common ground is that the defendant has admitted liability (CPR 25.7(1)(a)). Other grounds include that judgment has been obtained, or that the court is satisfied the claimant would obtain judgment at trial for a substantial amount of money. (b) is insufficient on its own; the test is higher than 'reasonable prospects.'",
                "difficulty": "medium"
            },
            {
                "id": 2,
                "title": "",
                "text": """A claimant believes the defendant is about to dissipate assets to avoid paying any judgment. They apply for a freezing injunction. What is a key requirement the claimant must demonstrate?""",
                "options": [
                    {"label": "A", "text": "That they have already obtained judgment against the defendant."},
                    {"label": "B", "text": "That there is a good arguable case and a real risk of dissipation."},
                    {"label": "C", "text": "That the defendant is insolvent."},
                    {"label": "D", "text": "That the defendant has admitted liability."},
                    {"label": "E", "text": "That the trial is scheduled within the next 3 months."}
                ],
                "correct_answer": "B",
                "explanation": "To obtain a freezing injunction (formerly Mareva injunction), the claimant must show: (1) a good arguable case on the merits, and (2) a real risk that the defendant will dissipate assets to frustrate enforcement of a judgment. Neither a judgment nor admission of liability is required.",
                "difficulty": "medium"
            },
            {
                "id": 3,
                "title": "",
                "text": """A party applies for summary judgment under CPR Part 24. What is the test the court must apply?""",
                "options": [
                    {"label": "A", "text": "Whether the applicant has a good chance of success at trial."},
                    {"label": "B", "text": "Whether the respondent has no reasonable prospect of success and there is no other compelling reason for trial."},
                    {"label": "C", "text": "Whether the respondent has admitted the claim."},
                    {"label": "D", "text": "Whether the claim is frivolous or vexatious."},
                    {"label": "E", "text": "Whether the claimant has suffered quantifiable loss."}
                ],
                "correct_answer": "B",
                "explanation": "CPR 24.2 provides that the court may give summary judgment if: (a) it considers the respondent has no real prospect of successfully defending the claim (or the claimant has no real prospect of success), and (b) there is no other compelling reason for the claim to be disposed of at trial.",
                "difficulty": "easy"
            },
            {
                "id": 4,
                "title": "",
                "text": """An interim injunction is sought to prevent the defendant from continuing an alleged breach of contract. What is the general test the court applies under the principles in American Cyanamid?""",
                "options": [
                    {"label": "A", "text": "Whether the claimant is likely to win at trial."},
                    {"label": "B", "text": "Whether there is a serious question to be tried, the balance of convenience favours the injunction, and damages would not be an adequate remedy."},
                    {"label": "C", "text": "Whether the defendant has admitted liability."},
                    {"label": "D", "text": "Whether the claimant has given a cross-undertaking in damages."},
                    {"label": "E", "text": "Whether the defendant has assets within the jurisdiction."}
                ],
                "correct_answer": "B",
                "explanation": "American Cyanamid v Ethicon sets out the test: (1) Is there a serious question to be tried? (2) Are damages an adequate remedy for either party? (3) Where does the balance of convenience lie? The court does not determine the likelihood of success at trial at the interim stage.",
                "difficulty": "medium"
            },
            {
                "id": 5,
                "title": "",
                "text": """A claimant seeks an order for specific disclosure of documents before trial. Under CPR Part 31, what must they show?""",
                "options": [
                    {"label": "A", "text": "That the documents are relevant to the issues in the case."},
                    {"label": "B", "text": "That the defendant has refused to provide the documents voluntarily."},
                    {"label": "C", "text": "That the documents are essential to prove their case."},
                    {"label": "D", "text": "That the documents are in the defendant's sole possession."},
                    {"label": "E", "text": "That the documents will conclusively determine the outcome of the case."}
                ],
                "correct_answer": "A",
                "explanation": "CPR 31.12 allows the court to order specific disclosure of documents that are relevant to the issues in the case. The test is relevance. The claimant does not need to show the documents are 'essential' or 'conclusive.'",
                "difficulty": "easy"
            },
            {
                "id": 6,
                "title": "",
                "text": """A search order (formerly Anton Piller order) is sought by a claimant who believes the defendant is destroying evidence. What is a key requirement for obtaining such an order?""",
                "options": [
                    {"label": "A", "text": "That the claimant has already won at trial."},
                    {"label": "B", "text": "That there is an extremely strong prima facie case and a real possibility of serious damage if the order is not made."},
                    {"label": "C", "text": "That the defendant has admitted to destroying evidence."},
                    {"label": "D", "text": "That the court has already granted a freezing injunction."},
                    {"label": "E", "text": "That the application is made with notice to the defendant."}
                ],
                "correct_answer": "B",
                "explanation": "For a search order, the claimant must show: (1) an extremely strong prima facie case; (2) the potential or actual damage is very serious; and (3) there is clear evidence the defendant has incriminating documents/things and there is a real possibility they will be destroyed before any application inter partes can be made.",
                "difficulty": "hard"
            },
            {
                "id": 7,
                "title": "",
                "text": """A defendant applies to strike out the claimant's statement of case under CPR 3.4. What must they generally show?""",
                "options": [
                    {"label": "A", "text": "That the claimant is unlikely to succeed at trial."},
                    {"label": "B", "text": "That the statement of case discloses no reasonable grounds for bringing the claim, is an abuse of process, or is likely to obstruct the just disposal of proceedings."},
                    {"label": "C", "text": "That the claimant has failed to comply with a court order."},
                    {"label": "D", "text": "That the claimant has not paid court fees."},
                    {"label": "E", "text": "That the claim is barred by limitation."}
                ],
                "correct_answer": "B",
                "explanation": "CPR 3.4(2) allows the court to strike out a statement of case if: (a) it discloses no reasonable grounds for bringing or defending the claim; (b) is an abuse of the court's process or is otherwise likely to obstruct the just disposal of the proceedings; or (c) there has been a failure to comply with a rule, direction or court order.",
                "difficulty": "medium"
            },
            {
                "id": 8,
                "title": "",
                "text": """A claimant in a personal injury claim applies for an interim payment of £10,000. The defendant has not admitted liability. What must the claimant show under CPR 25.7(1)(c)?""",
                "options": [
                    {"label": "A", "text": "That the defendant is likely to be found liable at trial."},
                    {"label": "B", "text": "That if the claim went to trial, the court would find the claimant entitled to a substantial sum of money."},
                    {"label": "C", "text": "That the defendant is insured for the claim."},
                    {"label": "D", "text": "That the claimant has incurred medical expenses exceeding £10,000."},
                    {"label": "E", "text": "That the trial date is within 6 months."}
                ],
                "correct_answer": "B",
                "explanation": "CPR 25.7(1)(c) requires the court to be satisfied that if the claim went to trial, the claimant would obtain judgment for a substantial sum of money. This is a higher test than 'likely to succeed' and requires confidence in the outcome.",
                "difficulty": "medium"
            },
            {
                "id": 9,
                "title": "",
                "text": """An application notice under CPR Part 23 must generally be served on the respondent:""",
                "options": [
                    {"label": "A", "text": "At least 3 clear days before the hearing."},
                    {"label": "B", "text": "At least 7 clear days before the hearing."},
                    {"label": "C", "text": "At least 14 days before the hearing."},
                    {"label": "D", "text": "At least 28 days before the hearing."},
                    {"label": "E", "text": "No notice is required if the application is urgent."}
                ],
                "correct_answer": "A",
                "explanation": "CPR 23.7(1) requires the application notice to be served at least 3 clear days before the hearing date. (e) is incorrect as a general rule, though there are exceptions for without-notice applications.",
                "difficulty": "easy"
            },
            {
                "id": 10,
                "title": "",
                "text": """A claimant has made a Part 36 offer to settle for £50,000. The defendant has not accepted it. At trial, the claimant is awarded £60,000. What additional consequences may apply under CPR 36.17?""",
                "options": [
                    {"label": "A", "text": "The defendant must pay double the damages awarded."},
                    {"label": "B", "text": "The defendant must pay interest on the damages at an enhanced rate, plus an additional amount up to £75,000."},
                    {"label": "C", "text": "The claimant is entitled to costs on the indemnity basis from the date the offer expired, plus interest at up to 10% above base rate."},
                    {"label": "D", "text": "The claimant automatically receives their costs from the start of proceedings."},
                    {"label": "E", "text": "No additional consequences apply; the defendant pays standard costs."}
                ],
                "correct_answer": "C",
                "explanation": "Under CPR 36.17(4), where a claimant obtains judgment at least as advantageous as their Part 36 offer, the consequences include: (a) interest on damages at up to 10% above base rate; (b) costs on the indemnity basis from the date the offer expired; (c) interest on those costs at up to 10% above base rate; and (d) an additional amount (up to £75,000).",
                "difficulty": "hard"
            }
        ]
        print("-> Patched Dispute Resolution Section E with 10 new questions")
        
        # =====================================================
        # Patch Dispute Resolution Section F - Case Management
        # =====================================================
        area_f = next((a for a in dispute_topic["areas"] if a["letter"] == "F"), None)
        if area_f:
            area_f["name"] = "Case Management"
            area_f["slug"] = "f-case-management"
            area_f["question_count"] = 14
        else:
            area_f = {
                "letter": "F",
                "name": "Case Management",
                "slug": "f-case-management",
                "question_count": 14,
                "questions": []
            }
            dispute_topic["areas"].insert(5, area_f)
        
        area_f["questions"] = [
            {
                "id": 1,
                "title": "",
                "text": """Under the Civil Procedure Rules, what is the financial limit for allocation to the small claims track for claims not involving personal injuries or housing disrepair?""",
                "options": [
                    {"label": "A", "text": "£5,000"},
                    {"label": "B", "text": "£10,000"},
                    {"label": "C", "text": "£15,000"},
                    {"label": "D", "text": "£25,000"},
                    {"label": "E", "text": "£50,000"}
                ],
                "correct_answer": "B",
                "explanation": "CPR 26.6(3) provides that the small claims track is the normal track for claims with a financial value not exceeding £10,000 (subject to exceptions for personal injury and housing disrepair claims).",
                "difficulty": "easy"
            },
            {
                "id": 2,
                "title": "",
                "text": """A claim for personal injuries is allocated to the fast track. What is the normal trial length for fast track cases?""",
                "options": [
                    {"label": "A", "text": "Half a day"},
                    {"label": "B", "text": "One day"},
                    {"label": "C", "text": "Three days"},
                    {"label": "D", "text": "Five days"},
                    {"label": "E", "text": "There is no normal length; it depends on complexity"}
                ],
                "correct_answer": "B",
                "explanation": "CPR 28.2(5) provides that the trial of a fast track claim will normally be listed for one day. This is a key characteristic distinguishing fast track from multi-track cases.",
                "difficulty": "easy"
            },
            {
                "id": 3,
                "title": "",
                "text": """What is the purpose of a Case Management Conference (CMC) in multi-track proceedings?""",
                "options": [
                    {"label": "A", "text": "To determine liability in the claim"},
                    {"label": "B", "text": "To assess damages"},
                    {"label": "C", "text": "To give directions for the preparation of the case for trial"},
                    {"label": "D", "text": "To hear expert evidence"},
                    {"label": "E", "text": "To assess costs"}
                ],
                "correct_answer": "C",
                "explanation": "CPR 29.3 provides that the purposes of a CMC include reviewing the parties' compliance with directions, giving directions for the management of the case, and setting the timetable for trial preparation. It is not a hearing on the merits.",
                "difficulty": "easy"
            },
            {
                "id": 4,
                "title": "",
                "text": """A party has failed to comply with a court order for disclosure. What is the first step the other party should typically take?""",
                "options": [
                    {"label": "A", "text": "Apply immediately for a strike out of the non-compliant party's statement of case."},
                    {"label": "B", "text": "Send an informal reminder and, if necessary, write formally requesting compliance."},
                    {"label": "C", "text": "Apply to enforce the order by committal proceedings."},
                    {"label": "D", "text": "Notify the court and request the case be struck out."},
                    {"label": "E", "text": "Proceed to trial without the documents."}
                ],
                "correct_answer": "B",
                "explanation": "Before making applications to the court, parties are expected to communicate and attempt to resolve compliance issues. The court will consider whether proportionate steps were taken before applying for sanctions. Jumping straight to strike out is disproportionate.",
                "difficulty": "medium"
            },
            {
                "id": 5,
                "title": "",
                "text": """Under CPR 3.9, what must the court consider when deciding whether to grant relief from sanctions?""",
                "options": [
                    {"label": "A", "text": "Only the seriousness of the breach and whether there is a good explanation."},
                    {"label": "B", "text": "All the circumstances of the case, including the need for litigation to be conducted efficiently and the enforcement of rules."},
                    {"label": "C", "text": "The financial resources of the party in breach."},
                    {"label": "D", "text": "Whether the other party would be prejudiced by relief being granted."},
                    {"label": "E", "text": "Whether the breach was deliberate."}
                ],
                "correct_answer": "B",
                "explanation": "CPR 3.9(1) requires the court to consider all the circumstances of the case, so as to enable it to deal justly with the application. It specifically includes consideration of (a) the need for litigation to be conducted efficiently and at proportionate cost; and (b) the need to enforce compliance with rules, practice directions and orders.",
                "difficulty": "medium"
            },
            {
                "id": 6,
                "title": "",
                "text": """What is the Denton test for relief from sanctions?""",
                "options": [
                    {"label": "A", "text": "A two-stage test: (1) Is there a good reason? (2) Would granting relief serve the overriding objective?"},
                    {"label": "B", "text": "A three-stage test: (1) Is the breach serious or significant? (2) Is there a good reason for the breach? (3) Consider all the circumstances of the case."},
                    {"label": "C", "text": "A single test: Would the non-compliant party suffer injustice if relief is refused?"},
                    {"label": "D", "text": "A four-stage test including proportionality of the sanction."},
                    {"label": "E", "text": "The court has unfettered discretion with no specific test."}
                ],
                "correct_answer": "B",
                "explanation": "Denton v TH White Ltd established a three-stage test: (1) Identify and assess the seriousness and significance of the failure; (2) Consider why the default occurred; (3) Evaluate all the circumstances of the case, including factors in CPR 3.9(1)(a) and (b).",
                "difficulty": "hard"
            },
            {
                "id": 7,
                "title": "",
                "text": """A defendant makes a Part 36 offer on 1 March. The claimant does not accept and proceeds to trial. The claimant is awarded less than the Part 36 offer. What are the typical costs consequences?""",
                "options": [
                    {"label": "A", "text": "The claimant pays all of the defendant's costs from the start of proceedings."},
                    {"label": "B", "text": "The claimant pays the defendant's costs from 22 days after the offer was made."},
                    {"label": "C", "text": "Each party bears their own costs."},
                    {"label": "D", "text": "The claimant pays the defendant's costs from the date the offer was made."},
                    {"label": "E", "text": "The defendant pays the claimant's costs up to the date of the offer."}
                ],
                "correct_answer": "B",
                "explanation": "Under CPR 36.17(3), where a claimant fails to obtain a judgment more advantageous than a defendant's Part 36 offer, the court will order the claimant to pay the defendant's costs from the date on which the relevant period expired (typically 21 days after the offer was made).",
                "difficulty": "medium"
            },
            {
                "id": 8,
                "title": "",
                "text": """The overriding objective of the Civil Procedure Rules is set out in CPR 1.1. Which of the following is NOT an element of the overriding objective?""",
                "options": [
                    {"label": "A", "text": "Dealing with cases justly and at proportionate cost."},
                    {"label": "B", "text": "Ensuring that the parties are on an equal footing."},
                    {"label": "C", "text": "Saving expense."},
                    {"label": "D", "text": "Ensuring that the wealthier party wins."},
                    {"label": "E", "text": "Allotting an appropriate share of the court's resources."}
                ],
                "correct_answer": "D",
                "explanation": "CPR 1.1 lists multiple elements of the overriding objective, including ensuring parties are on an equal footing, saving expense, dealing with cases proportionately, and allotting appropriate court resources. Ensuring the wealthier party wins is antithetical to the objective.",
                "difficulty": "easy"
            },
            {
                "id": 9,
                "title": "",
                "text": """A party wishes to vary a direction given by the court. What is the general approach under CPR 3.1(7)?""",
                "options": [
                    {"label": "A", "text": "The direction cannot be varied once made."},
                    {"label": "B", "text": "The court may vary or revoke a direction."},
                    {"label": "C", "text": "Only the party who obtained the direction can apply to vary it."},
                    {"label": "D", "text": "A direction can only be varied by the Court of Appeal."},
                    {"label": "E", "text": "A direction can only be varied if both parties consent."}
                ],
                "correct_answer": "B",
                "explanation": "CPR 3.1(7) provides that a power of the court to make an order includes the power to vary or revoke that order. This gives the court flexibility to manage cases.",
                "difficulty": "easy"
            },
            {
                "id": 10,
                "title": "",
                "text": """Under CPR Part 36, what is the 'relevant period' for accepting a Part 36 offer?""",
                "options": [
                    {"label": "A", "text": "7 days from service of the offer."},
                    {"label": "B", "text": "14 days from service of the offer."},
                    {"label": "C", "text": "21 days from the date the offer was made."},
                    {"label": "D", "text": "28 days from the date the offer was made."},
                    {"label": "E", "text": "Any period specified by the offeror, but not less than 21 days."}
                ],
                "correct_answer": "E",
                "explanation": "CPR 36.5(1)(c) provides that the relevant period must be not less than 21 days. The offeror may specify a longer period. If no period is specified, the default is 21 days.",
                "difficulty": "medium"
            },
            {
                "id": 11,
                "title": "",
                "text": """A claim is allocated to the multi-track. At the CMC, the court gives directions including a date for exchange of witness statements. What happens if a party fails to serve their witness statement by the due date?""",
                "options": [
                    {"label": "A", "text": "The witness may not be called to give evidence without the court's permission."},
                    {"label": "B", "text": "The trial is automatically adjourned."},
                    {"label": "C", "text": "The claim or defence is automatically struck out."},
                    {"label": "D", "text": "The defaulting party's costs are automatically disallowed."},
                    {"label": "E", "text": "The court will impose an immediate fine."}
                ],
                "correct_answer": "A",
                "explanation": "CPR 32.10 provides that if a witness statement is not served within the time specified, the witness may not be called unless the court permits. This is a significant sanction as it may undermine the party's case.",
                "difficulty": "medium"
            },
            {
                "id": 12,
                "title": "",
                "text": """What is a costs budget in multi-track proceedings?""",
                "options": [
                    {"label": "A", "text": "A record of costs already incurred in the proceedings."},
                    {"label": "B", "text": "An estimate of future costs that may be recoverable if successful."},
                    {"label": "C", "text": "A budget approved by the court setting the costs that may be recovered from the other party."},
                    {"label": "D", "text": "A statement of the maximum the party is willing to spend on the litigation."},
                    {"label": "E", "text": "A summary of costs for the court fee office."}
                ],
                "correct_answer": "C",
                "explanation": "Costs budgeting (CPR Part 3 Section II) requires parties to file costs budgets which are then approved or varied by the court. The approved budget sets the recoverable costs for future phases of the litigation.",
                "difficulty": "medium"
            },
            {
                "id": 13,
                "title": "",
                "text": """What is the purpose of a Pre-Trial Review (PTR) in multi-track proceedings?""",
                "options": [
                    {"label": "A", "text": "To conduct a mini-trial on the issues."},
                    {"label": "B", "text": "To ensure the case is ready for trial and to give any final directions."},
                    {"label": "C", "text": "To assess damages before trial."},
                    {"label": "D", "text": "To hear expert evidence."},
                    {"label": "E", "text": "To mediate the dispute."}
                ],
                "correct_answer": "B",
                "explanation": "The purpose of the PTR is to ensure the case is ready for trial and to deal with any outstanding matters. It typically takes place a few weeks before the trial date.",
                "difficulty": "easy"
            },
            {
                "id": 14,
                "title": "",
                "text": """A party in fast track proceedings wishes to adduce expert evidence. What is the court's default position under CPR 35.4?""",
                "options": [
                    {"label": "A", "text": "Expert evidence is not permitted on the fast track."},
                    {"label": "B", "text": "Each party may call two experts without permission."},
                    {"label": "C", "text": "Permission is required, and the court will limit expert evidence to that reasonably required."},
                    {"label": "D", "text": "Expert evidence is automatically permitted if the claim exceeds £10,000."},
                    {"label": "E", "text": "The parties must agree on a single joint expert."}
                ],
                "correct_answer": "C",
                "explanation": "CPR 35.4(1) provides that no party may call an expert or put in evidence an expert's report without the court's permission. This applies to all tracks. The court will restrict expert evidence to that which is reasonably required to resolve the proceedings.",
                "difficulty": "medium"
            }
        ]
        print("-> Patched Dispute Resolution Section F with 14 new questions")
        
        # =====================================================
        # Patch Dispute Resolution Section G - Evidence
        # =====================================================
        area_g = next((a for a in dispute_topic["areas"] if a["letter"] == "G"), None)
        if area_g:
            area_g["name"] = "Evidence"
            area_g["slug"] = "g-evidence"
            area_g["question_count"] = 23
        else:
            area_g = {
                "letter": "G",
                "name": "Evidence",
                "slug": "g-evidence",
                "question_count": 23,
                "questions": []
            }
            dispute_topic["areas"].insert(6, area_g)
        
        area_g["questions"] = [
            {
                "id": 1,
                "title": "",
                "text": """What is the general rule regarding the burden of proof in civil proceedings?""",
                "options": [
                    {"label": "A", "text": "The defendant must prove their defence."},
                    {"label": "B", "text": "The claimant must prove their case on the balance of probabilities."},
                    {"label": "C", "text": "The court must investigate the facts independently."},
                    {"label": "D", "text": "Neither party has a burden; the court decides based on all available evidence."},
                    {"label": "E", "text": "The claimant must prove their case beyond reasonable doubt."}
                ],
                "correct_answer": "B",
                "explanation": "In civil proceedings, the claimant bears the legal burden of proving their case. The standard is the 'balance of probabilities' – that it is more likely than not that the claimant's version of events is true. The 'beyond reasonable doubt' standard applies in criminal cases.",
                "difficulty": "easy"
            },
            {
                "id": 2,
                "title": "",
                "text": """A witness statement for use at trial must contain:""",
                "options": [
                    {"label": "A", "text": "Only the facts the witness observed directly."},
                    {"label": "B", "text": "The witness's opinion on the merits of the case."},
                    {"label": "C", "text": "A statement of truth signed by the witness."},
                    {"label": "D", "text": "A summary of all documents in the case."},
                    {"label": "E", "text": "Legal submissions on the issues in dispute."}
                ],
                "correct_answer": "C",
                "explanation": "CPR 32.8 and PD 32 require a witness statement to contain a statement of truth signed by the witness. The statement should contain the evidence the witness would be allowed to give orally. Opinion evidence is generally inadmissible unless the witness is an expert.",
                "difficulty": "easy"
            },
            {
                "id": 3,
                "title": "",
                "text": """Under CPR Part 35, what is the overriding duty of an expert witness?""",
                "options": [
                    {"label": "A", "text": "To assist the party who instructs them to win the case."},
                    {"label": "B", "text": "To provide evidence that is reasonably required to resolve the proceedings."},
                    {"label": "C", "text": "To help the court on matters within their expertise."},
                    {"label": "D", "text": "To ensure their fees are paid promptly."},
                    {"label": "E", "text": "To follow the instructions of the solicitor."}
                ],
                "correct_answer": "C",
                "explanation": "CPR 35.3(1) states that it is the duty of experts to help the court on matters within their expertise. This duty overrides any obligation to the party from whom they receive instructions or payment.",
                "difficulty": "easy"
            },
            {
                "id": 4,
                "title": "",
                "text": """What is hearsay evidence?""",
                "options": [
                    {"label": "A", "text": "Evidence given by an expert witness."},
                    {"label": "B", "text": "A statement made other than by a person while giving oral evidence in proceedings, tendered as evidence of the matters stated."},
                    {"label": "C", "text": "Documentary evidence."},
                    {"label": "D", "text": "Evidence of a person's bad character."},
                    {"label": "E", "text": "Evidence of matters known to be true by the judge."}
                ],
                "correct_answer": "B",
                "explanation": "Section 1(2) of the Civil Evidence Act 1995 defines hearsay as 'a statement made otherwise than by a person while giving oral evidence in the proceedings which is tendered as evidence of the matters stated.' For example, A telling the court what B said, to prove what B said was true.",
                "difficulty": "medium"
            },
            {
                "id": 5,
                "title": "",
                "text": """Is hearsay evidence admissible in civil proceedings?""",
                "options": [
                    {"label": "A", "text": "No, hearsay evidence is never admissible."},
                    {"label": "B", "text": "Yes, hearsay evidence is admissible, subject to procedural requirements."},
                    {"label": "C", "text": "Only if the maker of the statement is dead."},
                    {"label": "D", "text": "Only with the consent of all parties."},
                    {"label": "E", "text": "Only if it is contained in a document."}
                ],
                "correct_answer": "B",
                "explanation": "Section 1(1) of the Civil Evidence Act 1995 abolished the rule against hearsay in civil proceedings. Hearsay is admissible, but there are procedural requirements (notice under CPR 33) and the court will consider its weight carefully.",
                "difficulty": "medium"
            },
            {
                "id": 6,
                "title": "",
                "text": """Legal professional privilege protects communications between:""",
                "options": [
                    {"label": "A", "text": "A party and any third party regarding the litigation."},
                    {"label": "B", "text": "A client and their lawyer for the purpose of giving or receiving legal advice."},
                    {"label": "C", "text": "A party and the court."},
                    {"label": "D", "text": "Two lawyers on opposite sides of a case."},
                    {"label": "E", "text": "A party and media representatives."}
                ],
                "correct_answer": "B",
                "explanation": "Legal advice privilege covers confidential communications between a client and their lawyer (or the lawyer's employee/agent) made for the purpose of giving or receiving legal advice. Litigation privilege covers communications for the dominant purpose of litigation.",
                "difficulty": "medium"
            },
            {
                "id": 7,
                "title": "",
                "text": """Standard disclosure under CPR 31.6 requires a party to disclose documents:""",
                "options": [
                    {"label": "A", "text": "Only those that support their case."},
                    {"label": "B", "text": "Only those within their physical possession."},
                    {"label": "C", "text": "On which they rely, documents that adversely affect their case, adversely affect another party's case, or support another party's case."},
                    {"label": "D", "text": "All documents ever created by the party relating to the subject matter."},
                    {"label": "E", "text": "Only those requested by the other party."}
                ],
                "correct_answer": "C",
                "explanation": "CPR 31.6 defines standard disclosure as requiring a party to disclose documents on which they rely, documents which adversely affect their own case or another party's case, or documents which support another party's case.",
                "difficulty": "medium"
            },
            {
                "id": 8,
                "title": "",
                "text": """What is the 'without prejudice' rule?""",
                "options": [
                    {"label": "A", "text": "A rule that prevents any mention of costs in correspondence."},
                    {"label": "B", "text": "A rule that prevents admissions made in genuine settlement negotiations from being put before the court as evidence."},
                    {"label": "C", "text": "A rule that protects communications between solicitors."},
                    {"label": "D", "text": "A rule that prevents parties from changing their legal representatives."},
                    {"label": "E", "text": "A rule that requires fair treatment of all parties."}
                ],
                "correct_answer": "B",
                "explanation": "The 'without prejudice' rule prevents statements made in a genuine attempt to settle a dispute from being admitted into evidence at trial. This encourages parties to negotiate freely without fear that their admissions will be used against them.",
                "difficulty": "medium"
            },
            {
                "id": 9,
                "title": "",
                "text": """A party wishes to use a document at trial that is in the possession of a third party. What can they apply for?""",
                "options": [
                    {"label": "A", "text": "A witness summons requiring the third party to produce the document."},
                    {"label": "B", "text": "A freezing injunction."},
                    {"label": "C", "text": "A search order."},
                    {"label": "D", "text": "An order for committal of the third party."},
                    {"label": "E", "text": "Default judgment against the third party."}
                ],
                "correct_answer": "A",
                "explanation": "Under CPR 34.2, a witness summons may require a person to produce documents to the court. Additionally, CPR 31.17 allows an application for non-party disclosure.",
                "difficulty": "medium"
            },
            {
                "id": 10,
                "title": "",
                "text": """What is the purpose of an expert's declaration in their report?""",
                "options": [
                    {"label": "A", "text": "To confirm they have been paid for their services."},
                    {"label": "B", "text": "To confirm they understand their overriding duty to the court and have complied with it."},
                    {"label": "C", "text": "To confirm they agree with the party's legal submissions."},
                    {"label": "D", "text": "To confirm they have seen all documents in the case."},
                    {"label": "E", "text": "To confirm they will give oral evidence at trial."}
                ],
                "correct_answer": "B",
                "explanation": "PD 35 requires an expert's report to contain a declaration that the expert understands their duty to the court, has complied with that duty, and is aware of the requirements of CPR Part 35.",
                "difficulty": "easy"
            },
            {
                "id": 11,
                "title": "",
                "text": """A claimant claims damages for personal injury. The defendant wishes to have the claimant examined by their own medical expert. Can the defendant compel this?""",
                "options": [
                    {"label": "A", "text": "No, the claimant cannot be forced to submit to an examination."},
                    {"label": "B", "text": "Yes, under CPR 35.6, the court may order a claimant to submit to a medical examination."},
                    {"label": "C", "text": "Only if the claimant has disclosed no medical evidence."},
                    {"label": "D", "text": "Only if the defendant agrees to pay for the examination."},
                    {"label": "E", "text": "Only in claims exceeding £25,000."}
                ],
                "correct_answer": "B",
                "explanation": "CPR 35.6 provides that where a party's physical or mental condition is relevant, the court may order that party to submit to an examination by a medical expert. Failure to comply may result in adverse consequences.",
                "difficulty": "medium"
            },
            {
                "id": 12,
                "title": "",
                "text": """What is a single joint expert (SJE)?""",
                "options": [
                    {"label": "A", "text": "An expert instructed by one party who also advises the other party."},
                    {"label": "B", "text": "An expert instructed by the court to give evidence on behalf of the judge."},
                    {"label": "C", "text": "An expert instructed by the parties jointly to give evidence on a particular issue."},
                    {"label": "D", "text": "An expert who gives evidence in multiple cases."},
                    {"label": "E", "text": "An expert who specialises in more than one field."}
                ],
                "correct_answer": "C",
                "explanation": "CPR 35.7 allows the court to direct that evidence on a particular issue is given by a single joint expert instructed by the parties jointly. This is common in smaller claims to save costs.",
                "difficulty": "easy"
            },
            {
                "id": 13,
                "title": "",
                "text": """A party intends to rely on hearsay evidence at trial. What procedure must they follow under CPR 33?""",
                "options": [
                    {"label": "A", "text": "Apply for the court's permission to adduce hearsay."},
                    {"label": "B", "text": "Serve a hearsay notice on the other parties."},
                    {"label": "C", "text": "Obtain a certificate from the maker of the statement."},
                    {"label": "D", "text": "File a statement of truth confirming the hearsay is accurate."},
                    {"label": "E", "text": "No procedure is required; hearsay is automatically admissible."}
                ],
                "correct_answer": "B",
                "explanation": "CPR 33.2 requires a party who intends to rely on hearsay evidence to serve a hearsay notice on the other parties. The notice should identify the hearsay evidence and explain why the maker will not be called as a witness.",
                "difficulty": "medium"
            },
            {
                "id": 14,
                "title": "",
                "text": """What is the effect of serving a hearsay notice?""",
                "options": [
                    {"label": "A", "text": "The hearsay evidence becomes conclusive proof of the matters stated."},
                    {"label": "B", "text": "The other party cannot object to the hearsay evidence."},
                    {"label": "C", "text": "It allows the other party to challenge the weight of the hearsay evidence but not its admissibility."},
                    {"label": "D", "text": "The court is obliged to accept the hearsay evidence."},
                    {"label": "E", "text": "The maker of the statement must attend court for cross-examination."}
                ],
                "correct_answer": "C",
                "explanation": "Hearsay evidence is admissible in civil proceedings (Civil Evidence Act 1995 s.1). The hearsay notice allows the other party to call the maker of the statement for cross-examination or to attack the evidence's credibility. The court will assess the weight to be given to hearsay.",
                "difficulty": "medium"
            },
            {
                "id": 15,
                "title": "",
                "text": """Privilege against self-incrimination entitles a person to:""",
                "options": [
                    {"label": "A", "text": "Refuse to answer questions in court."},
                    {"label": "B", "text": "Refuse to give evidence or disclose documents that might expose them to criminal proceedings."},
                    {"label": "C", "text": "Claim legal aid for their defence."},
                    {"label": "D", "text": "Avoid being a party to civil proceedings."},
                    {"label": "E", "text": "Have a lawyer present during questioning."}
                ],
                "correct_answer": "B",
                "explanation": "The privilege against self-incrimination allows a person to refuse to answer questions or disclose documents that might tend to expose them (or, in some cases, their spouse) to criminal proceedings or a penalty.",
                "difficulty": "medium"
            },
            {
                "id": 16,
                "title": "",
                "text": """What are 'factual witnesses'?""",
                "options": [
                    {"label": "A", "text": "Witnesses who give evidence of their personal knowledge of relevant facts."},
                    {"label": "B", "text": "Witnesses who give evidence on matters of law."},
                    {"label": "C", "text": "Witnesses who give evidence of their opinion on technical matters."},
                    {"label": "D", "text": "Witnesses who only give written evidence."},
                    {"label": "E", "text": "Witnesses who have no direct knowledge of the events but provide background information."}
                ],
                "correct_answer": "A",
                "explanation": "Factual witnesses (also called 'witnesses of fact') are individuals who give evidence of their personal knowledge of relevant facts – what they saw, heard, did, or perceived. They are to be distinguished from expert witnesses who give opinion evidence.",
                "difficulty": "easy"
            },
            {
                "id": 17,
                "title": "",
                "text": """Under CPR 32.5, a witness statement will stand as the witness's evidence-in-chief unless:""",
                "options": [
                    {"label": "A", "text": "The witness is cross-examined."},
                    {"label": "B", "text": "The court orders otherwise."},
                    {"label": "C", "text": "The other party objects."},
                    {"label": "D", "text": "The statement was served late."},
                    {"label": "E", "text": "The witness changes their mind about the contents."}
                ],
                "correct_answer": "B",
                "explanation": "CPR 32.5(2) provides that where a witness is called to give oral evidence, their witness statement shall stand as their evidence-in-chief unless the court orders otherwise. The court may allow supplementary questions (amplification) in appropriate cases.",
                "difficulty": "medium"
            },
            {
                "id": 18,
                "title": "",
                "text": """If a party fails to give disclosure of a document, what is a potential consequence under CPR 31.21?""",
                "options": [
                    {"label": "A", "text": "The document is automatically deemed privileged."},
                    {"label": "B", "text": "The party may not rely on the document except with the court's permission."},
                    {"label": "C", "text": "The party's claim or defence is struck out."},
                    {"label": "D", "text": "The document is considered conclusive evidence."},
                    {"label": "E", "text": "The other party can obtain compensation."}
                ],
                "correct_answer": "B",
                "explanation": "CPR 31.21 provides that a party may not rely on any document which they fail to disclose or in respect of which they fail to permit inspection, except with the permission of the court.",
                "difficulty": "medium"
            },
            {
                "id": 19,
                "title": "",
                "text": """What is 'litigation privilege'?""",
                "options": [
                    {"label": "A", "text": "Privilege attaching to all documents created after proceedings are issued."},
                    {"label": "B", "text": "Privilege attaching to confidential communications made for the dominant purpose of pending or reasonably contemplated litigation."},
                    {"label": "C", "text": "Privilege attaching to communications with the court."},
                    {"label": "D", "text": "The right to conduct litigation without disclosing any documents."},
                    {"label": "E", "text": "Privilege attaching to negotiations between solicitors."}
                ],
                "correct_answer": "B",
                "explanation": "Litigation privilege attaches to confidential communications between a client, their lawyer, or a third party where the dominant purpose of the communication is for use in connection with pending or reasonably contemplated litigation.",
                "difficulty": "hard"
            },
            {
                "id": 20,
                "title": "",
                "text": """What is the relationship between disclosure and inspection?""",
                "options": [
                    {"label": "A", "text": "Disclosure and inspection are the same thing."},
                    {"label": "B", "text": "Disclosure is the stating that a document exists; inspection is allowing the other party to see it."},
                    {"label": "C", "text": "Inspection must occur before disclosure."},
                    {"label": "D", "text": "Disclosure relates to physical documents; inspection relates to electronic documents."},
                    {"label": "E", "text": "There is no relationship; they are independent obligations."}
                ],
                "correct_answer": "B",
                "explanation": "Disclosure is the process of stating that a document exists or has existed (usually in a list of documents). Inspection is the entitlement of the other party to see and take copies of disclosed documents. A party may withhold inspection on grounds of privilege.",
                "difficulty": "medium"
            },
            {
                "id": 21,
                "title": "",
                "text": """A party has documents which relate to the issues in the case but are commercially sensitive. What protection, if any, is available?""",
                "options": [
                    {"label": "A", "text": "The documents do not need to be disclosed if they are commercially sensitive."},
                    {"label": "B", "text": "The court can make an order restricting access to the documents, such as a confidentiality ring."},
                    {"label": "C", "text": "Commercial sensitivity is an absolute ground for withholding inspection."},
                    {"label": "D", "text": "The documents can only be disclosed to the court, not the other party."},
                    {"label": "E", "text": "Commercial sensitivity is irrelevant in litigation."}
                ],
                "correct_answer": "B",
                "explanation": "Commercial sensitivity is not a ground for withholding disclosure, but the court can make orders to protect confidentiality, such as restricting access to a 'confidentiality ring' of named legal representatives or redacting sensitive parts.",
                "difficulty": "hard"
            },
            {
                "id": 22,
                "title": "",
                "text": """What is the purpose of a 'list of documents' (Form N265)?""",
                "options": [
                    {"label": "A", "text": "To record all documents the party has ever created."},
                    {"label": "B", "text": "To list documents the party is disclosing and those they claim privilege over."},
                    {"label": "C", "text": "To list documents the party wishes to obtain from the other side."},
                    {"label": "D", "text": "To provide a summary of the case for the judge."},
                    {"label": "E", "text": "To identify expert reports."}
                ],
                "correct_answer": "B",
                "explanation": "Form N265 is a list of documents used to comply with disclosure obligations. It includes: (1) documents in respect of which the disclosing party claims a right to withhold inspection (e.g., privilege), and (2) documents which are no longer in the party's control.",
                "difficulty": "easy"
            },
            {
                "id": 23,
                "title": "",
                "text": """An expert's report is exchanged before trial. At trial, can the expert be cross-examined on their report?""",
                "options": [
                    {"label": "A", "text": "No, expert reports are treated as final."},
                    {"label": "B", "text": "Yes, the opposing party may cross-examine the expert on their report and conclusions."},
                    {"label": "C", "text": "Only if the court grants special permission."},
                    {"label": "D", "text": "Only if the expert is a single joint expert."},
                    {"label": "E", "text": "Only in multi-track cases."}
                ],
                "correct_answer": "B",
                "explanation": "If an expert's evidence is disputed, the opposing party has the right to cross-examine the expert at trial (CPR 35.11). The purpose of cross-examination is to test the reliability and accuracy of the expert's opinions and conclusions.",
                "difficulty": "easy"
            }
        ]
        print("-> Patched Dispute Resolution Section G with 23 new questions")
        
        # =====================================================
        # Patch Dispute Resolution Section H - Disclosure and Inspection
        # =====================================================
        area_h = next((a for a in dispute_topic["areas"] if a["letter"] == "H"), None)
        if area_h:
            area_h["name"] = "Disclosure and Inspection"
            area_h["slug"] = "h-disclosure-and-inspection"
            area_h["question_count"] = 15
        else:
            area_h = {
                "letter": "H",
                "name": "Disclosure and Inspection",
                "slug": "h-disclosure-and-inspection",
                "question_count": 15,
                "questions": []
            }
            dispute_topic["areas"].insert(7, area_h)
        
        area_h["questions"] = [
            {
                "id": 1,
                "title": "",
                "text": "During standard disclosure under CPR 31.6, a party must disclose documents:\na) On which they rely.\nb) Which adversely affect their own case or another party's case.\nc) Which support another party's case.\nd) Which they are required to disclose by a relevant practice direction.\ne) All of the above.",
                "options": [
                    {"label": "A", "text": "On which they rely."},
                    {"label": "B", "text": "Which adversely affect their own case or another party's case."},
                    {"label": "C", "text": "Which support another party's case."},
                    {"label": "D", "text": "Which they are required to disclose by a relevant practice direction."},
                    {"label": "E", "text": "All of the above."}
                ],
                "correct_answer": "E",
                "explanation": "CPR 31.6 defines the standard disclosure duty. A party must disclose documents on which they rely; which adversely affect their own or another party's case; which support another party's case; and which they are required to disclose by a relevant practice direction.",
                "difficulty": "medium"
            },
            {
                "id": 2,
                "title": "",
                "text": "Andrew brings a claim against Benjamin for breach of a consultancy agreement. During disclosure, Benjamin discloses only emails that directly mention non-payment. Andrew later discovers that Benjamin has withheld internal emails discussing whether payment could be avoided. Under standard disclosure, is Benjamin required to disclose the internal emails?",
                "options": [
                    {"label": "A", "text": "No, because only documents that support the disclosing party's case must be disclosed."},
                    {"label": "B", "text": "No, because internal communications are automatically exempt from disclosure."},
                    {"label": "C", "text": "Yes, because documents that may adversely affect a party's case must be disclosed."},
                    {"label": "D", "text": "Yes, but only if Andrew can prove the emails are decisive."},
                    {"label": "E", "text": "Yes, but only after inspection is requested."}
                ],
                "correct_answer": "C",
                "explanation": "Standard disclosure includes documents that support or adversely affect either party's case. Documents that may undermine Benjamin's defence fall squarely within standard disclosure.",
                "difficulty": "medium"
            },
            {
                "id": 3,
                "title": "",
                "text": "Charlotte sues Daniel for negligent financial advice. During disclosure, Daniel discloses documents but refuses to allow Charlotte to inspect draft reports, claiming they are irrelevant. Is Charlotte entitled to inspect the draft reports?",
                "options": [
                    {"label": "A", "text": "No, because draft documents are not subject to inspection."},
                    {"label": "B", "text": "No, because relevance can be reconsidered after disclosure."},
                    {"label": "C", "text": "Yes, unless the document is privileged or inspection would be disproportionate."},
                    {"label": "D", "text": "Yes, because inspection of all disclosed documents is automatic."},
                    {"label": "E", "text": "Yes, but only with the court's permission."}
                ],
                "correct_answer": "C",
                "explanation": "A party has the right to inspect disclosed documents unless they are privileged or inspection would be disproportionate.",
                "difficulty": "medium"
            },
            {
                "id": 4,
                "title": "",
                "text": "Before issuing proceedings, a potential claimant needs to see a report held by the potential defendant's insurer to assess whether they have a valid claim. Which application is most appropriate?",
                "options": [
                    {"label": "A", "text": "Application for a search order under CPR 25.1."},
                    {"label": "B", "text": "Application for pre-action disclosure under CPR 31.16."},
                    {"label": "C", "text": "Application for specific disclosure under CPR 31.12."},
                    {"label": "D", "text": "Application for non-party disclosure under CPR 31.17."},
                    {"label": "E", "text": "Application for disclosure against the insurer as a prospective party."}
                ],
                "correct_answer": "B",
                "explanation": "CPR 31.16 allows an application for disclosure before proceedings have started if the applicant and respondent are likely to be parties, and disclosure is desirable to dispose fairly of anticipated proceedings.",
                "difficulty": "medium"
            },
            {
                "id": 5,
                "title": "",
                "text": "A party inadvertently sends a privileged document to the other side during disclosure. Upon realising the mistake, they immediately notify the other side and request its return. What is the likely outcome if the disclosing party applies to the court?",
                "options": [
                    {"label": "A", "text": "Privilege is irrevocably waived because the document has been seen."},
                    {"label": "B", "text": "The court will order the return applying 'without prejudice' to the error."},
                    {"label": "C", "text": "The court will order the document's return if the mistake was obvious and correction was prompt."},
                    {"label": "D", "text": "The court will allow the receiving party to use the document."},
                    {"label": "E", "text": "The court will order a costs sanction but allow the document to be used."}
                ],
                "correct_answer": "C",
                "explanation": "The court has discretion to permit use or order return. Key factors include the obviousness of the mistake and the promptness of the corrective action (Permanent Trustee v Eurosail).",
                "difficulty": "hard"
            },
            {
                "id": 6,
                "title": "",
                "text": "Edward brings a claim against Francis relating to misrepresentation. Francis discloses a valuation report but redacts certain sections, claiming commercial sensitivity. Which statement best reflects the law on inspection and redaction?",
                "options": [
                    {"label": "A", "text": "A disclosed document must always be produced in full."},
                    {"label": "B", "text": "Redaction is never permitted under the CPR."},
                    {"label": "C", "text": "A party may redact irrelevant or privileged parts of a document."},
                    {"label": "D", "text": "Commercial sensitivity automatically prevents inspection."},
                    {"label": "E", "text": "Inspection can only be refused with the other party's consent."}
                ],
                "correct_answer": "C",
                "explanation": "A party may redact parts of a document that are irrelevant or privileged, provided the redaction is justified.",
                "difficulty": "medium"
            },
            {
                "id": 7,
                "title": "",
                "text": "Henry brings a claim against Isaac. Two weeks after disclosure, Henry discovers additional emails that could weaken his own claim. What is Henry's obligation regarding the newly discovered emails?",
                "options": [
                    {"label": "A", "text": "Henry has no obligation because disclosure has already occurred."},
                    {"label": "B", "text": "Henry must disclose the emails due to the continuing duty of disclosure."},
                    {"label": "C", "text": "Henry must disclose the emails only if Isaac applies for specific disclosure."},
                    {"label": "D", "text": "Henry may withhold the emails because they weaken his own case."},
                    {"label": "E", "text": "Henry must disclose the emails only if the court orders inspection."}
                ],
                "correct_answer": "B",
                "explanation": "There is a continuing duty of disclosure up to the end of proceedings. Documents adverse to a party's case must still be disclosed.",
                "difficulty": "medium"
            },
            {
                "id": 8,
                "title": "",
                "text": "Paul brings a claim against Richard. During disclosure, Richard does not search archived email accounts or messaging platforms used by his staff. How will the court assess whether Richard has complied with his disclosure obligations?",
                "options": [
                    {"label": "A", "text": "By requiring Richard to search every possible source regardless of cost."},
                    {"label": "B", "text": "By considering whether Richard conducted a reasonable and proportionate search."},
                    {"label": "C", "text": "By requiring proof that relevant documents actually exist."},
                    {"label": "D", "text": "By excluding electronic documents from standard disclosure."},
                    {"label": "E", "text": "By ordering disclosure only of documents Richard relies on."}
                ],
                "correct_answer": "B",
                "explanation": "The test is whether the party conducted a reasonable and proportionate search, considering factors such as cost, complexity, and importance of the case.",
                "difficulty": "medium"
            },
            {
                "id": 9,
                "title": "",
                "text": "An order for disclosure against a non-party under CPR 31.17 can be made only if:",
                "options": [
                    {"label": "A", "text": "The document is likely to support the case of the applicant."},
                    {"label": "B", "text": "The document is likely to be damaging to the non-party's reputation."},
                    {"label": "C", "text": "Disclosure is necessary in order to dispose fairly of the claim or to save costs."},
                    {"label": "D", "text": "The non-party has been uncooperative in previous correspondence."},
                    {"label": "E", "text": "The applicant undertakes to pay the non-party's costs of compliance."}
                ],
                "correct_answer": "C",
                "explanation": "CPR 31.17 sets out strict conditions including that disclosure is necessary to dispose fairly of the claim or save costs.",
                "difficulty": "medium"
            },
            {
                "id": 10,
                "title": "",
                "text": "A solicitor sends a letter to their client marked 'Without Prejudice'. The letter contains only legal advice, with no settlement proposal. Can the client be compelled to disclose this letter?",
                "options": [
                    {"label": "A", "text": "No, because it is marked 'Without Prejudice'."},
                    {"label": "B", "text": "No, because it is protected by legal advice privilege."},
                    {"label": "C", "text": "Yes, because 'Without Prejudice' only applies to settlement negotiations."},
                    {"label": "D", "text": "Yes, because privilege has been waived by sending it to the client."},
                    {"label": "E", "text": "It depends on whether the other party knows of its existence."}
                ],
                "correct_answer": "B",
                "explanation": "The letter contains legal advice, so it is protected by legal advice privilege. 'Without prejudice' privilege protects settlement negotiations, which this is not.",
                "difficulty": "hard"
            },
            {
                "id": 11,
                "title": "",
                "text": "Samuel sues Thomas for negligent architectural services. Thomas states that certain design documents were deleted during a system upgrade before proceedings began. What is Thomas required to do under the CPR?",
                "options": [
                    {"label": "A", "text": "Nothing, because documents not in his control are irrelevant."},
                    {"label": "B", "text": "Recreate the documents from memory."},
                    {"label": "C", "text": "Disclose the existence of the documents and explain what happened to them."},
                    {"label": "D", "text": "Apply for relief from sanctions."},
                    {"label": "E", "text": "Seek the court's permission to deny their existence."}
                ],
                "correct_answer": "C",
                "explanation": "A party must disclose documents that once existed, explain loss or destruction, and state when and how this occurred.",
                "difficulty": "medium"
            },
            {
                "id": 12,
                "title": "",
                "text": "A document is disclosed in the disclosure list. The disclosing party now wishes to resist inspection on the grounds of commercially sensitive pricing information. What should they do?",
                "options": [
                    {"label": "A", "text": "Refuse inspection and inform the other party of the reason."},
                    {"label": "B", "text": "Apply to the court for an order that inspection is not required."},
                    {"label": "C", "text": "Redact the sensitive parts before allowing inspection."},
                    {"label": "D", "text": "Claim privilege over the entire document."},
                    {"label": "E", "text": "Withdraw the document from their disclosure list."}
                ],
                "correct_answer": "B",
                "explanation": "Commercial confidentiality is not a privilege, but the court can restrict inspection. The correct route is an application to the court.",
                "difficulty": "medium"
            },
            {
                "id": 13,
                "title": "",
                "text": "Which of the following statements about the 'without prejudice' rule is CORRECT?",
                "options": [
                    {"label": "A", "text": "It only applies to written offers of settlement."},
                    {"label": "B", "text": "It applies to all genuine attempts to settle a dispute, whether oral or written."},
                    {"label": "C", "text": "It prevents the use of without prejudice communications for any purpose."},
                    {"label": "D", "text": "It is a rule of privilege that belongs to the solicitor, not the client."},
                    {"label": "E", "text": "It ceases to apply once a settlement agreement is reached."}
                ],
                "correct_answer": "B",
                "explanation": "The without prejudice rule applies to genuine negotiations aimed at settlement, whether oral or written (Rush & Tompkins v GLC).",
                "difficulty": "medium"
            },
            {
                "id": 14,
                "title": "",
                "text": "During disclosure, a party's solicitor reviews a document that contains both legal advice and factual commercial information. The party wishes to disclose the factual parts but withhold the legal advice. What is the correct approach?",
                "options": [
                    {"label": "A", "text": "Disclose the whole document, as it contains non-privileged material."},
                    {"label": "B", "text": "Withhold the whole document, as it contains privileged material."},
                    {"label": "C", "text": "Redact the privileged parts and disclose the rest, explaining the redaction."},
                    {"label": "D", "text": "Disclose a summary of the factual parts prepared by the solicitor."},
                    {"label": "E", "text": "Apply to the court for directions on 'mixed purpose' documents."}
                ],
                "correct_answer": "C",
                "explanation": "Where a document contains both privileged and non-privileged material, the party may redact the privileged portions, provided they explain the basis for redaction.",
                "difficulty": "hard"
            },
            {
                "id": 15,
                "title": "",
                "text": "Victoria brings a claim against William. William offers inspection only by physical appointment at his solicitor's office during limited hours. Victoria requests electronic copies. Is William's approach compliant?",
                "options": [
                    {"label": "A", "text": "Yes, because inspection may be offered in any manner the disclosing party chooses."},
                    {"label": "B", "text": "Yes, because electronic copies are never required."},
                    {"label": "C", "text": "No, because inspection must be reasonable in timing and manner."},
                    {"label": "D", "text": "No, because documents must always be delivered automatically."},
                    {"label": "E", "text": "Yes, because inspection does not need to be practical."}
                ],
                "correct_answer": "C",
                "explanation": "The CPR requires inspection to be offered in a reasonable time, place, and manner, including electronic provision where proportionate.",
                "difficulty": "medium"
            }
        ]
        print("-> Patched Dispute Resolution Section H with 15 new questions")
        
        # =====================================================
        # Patch Dispute Resolution Section I - Trial Procedure
        # =====================================================
        area_i = next((a for a in dispute_topic["areas"] if a["letter"] == "I"), None)
        if area_i:
            area_i["name"] = "Trial Procedure"
            area_i["slug"] = "i-trial-procedure"
            area_i["question_count"] = 20
        else:
            area_i = {
                "letter": "I",
                "name": "Trial Procedure",
                "slug": "i-trial-procedure",
                "question_count": 20,
                "questions": []
            }
            dispute_topic["areas"].insert(8, area_i)
        
        area_i["questions"] = [
            {
                "id": 1,
                "title": "",
                "text": "In a fast-track trial, the claimant's solicitor needs to ensure a crucial witness, who is reluctant to attend, is present. What is the appropriate mechanism to compel the witness's attendance?",
                "options": [
                    {"label": "A", "text": "Write a formal letter to the witness explaining the consequences of non-attendance."},
                    {"label": "B", "text": "Apply to the court for a witness summons under CPR 34."},
                    {"label": "C", "text": "Serve a notice to admit facts on the witness, which binds them to attend."},
                    {"label": "D", "text": "Issue an application for specific disclosure against the witness."},
                    {"label": "E", "text": "Notify the court, which will then send a warning letter to the witness."}
                ],
                "correct_answer": "B",
                "explanation": "A witness summons is the court order compelling a witness to attend court to give evidence or produce documents, obtained under CPR Part 34.",
                "difficulty": "medium"
            },
            {
                "id": 2,
                "title": "",
                "text": "What is the primary purpose of a pre-trial checklist (listing questionnaire) under CPR 29.6?",
                "options": [
                    {"label": "A", "text": "To provide a final opportunity for the parties to settle the case."},
                    {"label": "B", "text": "To confirm the parties' readiness for trial and provide information for listing directions."},
                    {"label": "C", "text": "To replace the need for a case management conference."},
                    {"label": "D", "text": "To allow the parties to amend their statements of case one final time."},
                    {"label": "E", "text": "To provide the judge with a summary of the legal arguments."}
                ],
                "correct_answer": "B",
                "explanation": "The pre-trial checklist (Form N170) is used to ensure the case is ready for trial and to fix the date and timetable.",
                "difficulty": "medium"
            },
            {
                "id": 3,
                "title": "",
                "text": "Which of the following is a fundamental rule regarding the content and preparation of the trial bundle?",
                "options": [
                    {"label": "A", "text": "The claimant is solely responsible for preparing and lodging it."},
                    {"label": "B", "text": "It must contain every document mentioned, including without prejudice correspondence."},
                    {"label": "C", "text": "It must be agreed by the parties, paginated consecutively, and lodged with the court on time."},
                    {"label": "D", "text": "The defendant must prepare the bundle if defending a counterclaim."},
                    {"label": "E", "text": "It is optional for trials estimated to last less than one day."}
                ],
                "correct_answer": "C",
                "explanation": "This reflects the core requirements of PD 32 27.2 and 27.9. Without prejudice material is excluded unless privilege is waived.",
                "difficulty": "medium"
            },
            {
                "id": 4,
                "title": "",
                "text": "During examination-in-chief, counsel asks: 'You then saw the defendant's car, which was travelling at excessive speed, run the red light and collide with the claimant's vehicle, correct?' What is the likely problem with this question?",
                "options": [
                    {"label": "A", "text": "It is a closed question."},
                    {"label": "B", "text": "It is a leading question, which is generally not permitted in examination-in-chief."},
                    {"label": "C", "text": "It is a leading question, which is generally permitted in examination-in-chief."},
                    {"label": "D", "text": "It is a compound question."},
                    {"label": "E", "text": "It contains a legal conclusion ('excessive speed')."}
                ],
                "correct_answer": "B",
                "explanation": "In examination-in-chief, a party cannot ask leading questions of their own witness. Counsel should ask open questions.",
                "difficulty": "medium"
            },
            {
                "id": 5,
                "title": "",
                "text": "When a judge delivers a reserved judgment, what is its legal effect from the moment it is handed down?",
                "options": [
                    {"label": "A", "text": "It has no effect until the order is sealed and drawn up."},
                    {"label": "B", "text": "It is binding on the parties from the moment it is pronounced, subject to any appeal."},
                    {"label": "C", "text": "It is only binding once the parties have had submissions on the form of the order."},
                    {"label": "D", "text": "It is provisional for 14 days to allow for corrections under the 'slip rule.'"},
                    {"label": "E", "text": "It is binding only on the claimant."}
                ],
                "correct_answer": "B",
                "explanation": "The judgment takes effect immediately upon being handed down or pronounced. The parties are bound unless and until it is successfully appealed or varied.",
                "difficulty": "medium"
            },
            {
                "id": 6,
                "title": "",
                "text": "During a trial, how should a barrister address a District Judge presiding in the County Court?",
                "options": [
                    {"label": "A", "text": "'Your Honour.'"},
                    {"label": "B", "text": "'My Lord' or 'My Lady.'"},
                    {"label": "C", "text": "'Sir' or 'Madam.'"},
                    {"label": "D", "text": "'Your worship.'"},
                    {"label": "E", "text": "'Your Lordship' or 'Your Ladyship.'"}
                ],
                "correct_answer": "A",
                "explanation": "A District Judge is addressed as 'Your Honour.' 'My Lord/Lady' is used for High Court Judges and above.",
                "difficulty": "easy"
            },
            {
                "id": 7,
                "title": "",
                "text": "The primary purpose of a pre-trial review (held close to the trial date) is to:",
                "options": [
                    {"label": "A", "text": "Hear final arguments on the substantive merits of the case."},
                    {"label": "B", "text": "Ensure all pre-trial directions have been complied with and the case is ready for trial."},
                    {"label": "C", "text": "Encourage a last-minute settlement through judicial mediation."},
                    {"label": "D", "text": "Read the witness statements into the record to save time at trial."},
                    {"label": "E", "text": "Decide preliminary issues of law."}
                ],
                "correct_answer": "B",
                "explanation": "A pre-trial review (CPR 29.7) is a final case management hearing to ensure readiness and address any practical issues.",
                "difficulty": "medium"
            },
            {
                "id": 8,
                "title": "",
                "text": "A witness is being cross-examined. Counsel asks: 'Isn't it true that you have a personal grudge against my client and have invented this entire story?' This is:",
                "options": [
                    {"label": "A", "text": "Improper, because it is a leading question."},
                    {"label": "B", "text": "Proper, because in cross-examination, leading questions are allowed and challenges to credibility are permitted."},
                    {"label": "C", "text": "Improper, because it assumes facts not in evidence."},
                    {"label": "D", "text": "Proper, only if the witness has already admitted the grudge."},
                    {"label": "E", "text": "Improper, because it calls for a narrative answer."}
                ],
                "correct_answer": "B",
                "explanation": "In cross-examination, leading questions are permitted. Challenging the witness's credibility is a central function of cross-examination.",
                "difficulty": "medium"
            },
            {
                "id": 9,
                "title": "",
                "text": "What is the consequence if a party fails to file a completed pre-trial checklist (listing questionnaire) by the specified date?",
                "options": [
                    {"label": "A", "text": "The claim and any counterclaim are automatically struck out."},
                    {"label": "B", "text": "The court may order costs but cannot debar them from proceedings."},
                    {"label": "C", "text": "The court may order costs or make a debarring order."},
                    {"label": "D", "text": "The court will hold the party in contempt."},
                    {"label": "E", "text": "The other party is entitled to judgment in default."}
                ],
                "correct_answer": "C",
                "explanation": "CPR 29.6(3) gives the court power to order costs or debar the defaulting party from pursuing or defending the claim.",
                "difficulty": "medium"
            },
            {
                "id": 10,
                "title": "",
                "text": "When preparing a trial bundle, which documents should typically be EXCLUDED?",
                "options": [
                    {"label": "A", "text": "The claim form and statements of case."},
                    {"label": "B", "text": "The relevant orders made in the case."},
                    {"label": "C", "text": "Without prejudice correspondence between the parties."},
                    {"label": "D", "text": "The disclosed documents on which the parties rely."},
                    {"label": "E", "text": "Witness statements and expert reports that have been served."}
                ],
                "correct_answer": "C",
                "explanation": "Without prejudice correspondence is privileged and should not be included in the trial bundle unless privilege has been waived.",
                "difficulty": "medium"
            },
            {
                "id": 11,
                "title": "",
                "text": "At the start of a trial, after the judge has entered, what is the usual first step in procedure?",
                "options": [
                    {"label": "A", "text": "The claimant's counsel makes an opening speech."},
                    {"label": "B", "text": "The defendant's counsel applies to strike out the claim."},
                    {"label": "C", "text": "The claimant's counsel calls their first witness."},
                    {"label": "D", "text": "The judge asks for any preliminary matters or applications."},
                    {"label": "E", "text": "The defendant's counsel makes a submission of no case to answer."}
                ],
                "correct_answer": "D",
                "explanation": "It is standard practice for the judge to inquire whether there are any preliminary matters before the trial proper begins.",
                "difficulty": "easy"
            },
            {
                "id": 12,
                "title": "",
                "text": "Lucy is cross-examining Mark, a witness called by Oliver. During cross-examination, Lucy raises a new issue not covered in Mark's witness statement. Oliver seeks to clarify that issue by re-examining Mark. Is Oliver entitled to re-examine Mark on that issue?",
                "options": [
                    {"label": "A", "text": "No, re-examination is never allowed."},
                    {"label": "B", "text": "No, because new issues cannot be addressed."},
                    {"label": "C", "text": "Yes, but only on matters arising from cross-examination."},
                    {"label": "D", "text": "Yes, and he may introduce new evidence."},
                    {"label": "E", "text": "Yes, but only with the opposing party's consent."}
                ],
                "correct_answer": "C",
                "explanation": "Re-examination is permitted, but strictly limited to matters arising from cross-examination.",
                "difficulty": "medium"
            },
            {
                "id": 13,
                "title": "",
                "text": "After the claimant has presented all their evidence, the defendant's counsel submits there is 'no case to answer.' What is the correct test the judge will apply?",
                "options": [
                    {"label": "A", "text": "Whether, on the claimant's evidence, no reasonable judge could find for the claimant."},
                    {"label": "B", "text": "Whether the judge personally believes the claimant's case is weak."},
                    {"label": "C", "text": "Whether the defendant has a stronger case on the balance of probabilities."},
                    {"label": "D", "text": "Whether the claimant has failed to call a material witness."},
                    {"label": "E", "text": "Whether a reasonable man believes the claimant's case is weak."}
                ],
                "correct_answer": "A",
                "explanation": "The test is whether, on the claimant's evidence taken at its highest, a reasonable tribunal could properly find for the claimant.",
                "difficulty": "hard"
            },
            {
                "id": 14,
                "title": "",
                "text": "Thomas brings a claim against Andrew for breach of contract. Andrew calls Daniel as a witness. Which party has the right to cross-examine Daniel?",
                "options": [
                    {"label": "A", "text": "The party who called the witness."},
                    {"label": "B", "text": "The opposing party."},
                    {"label": "C", "text": "The judge only."},
                    {"label": "D", "text": "Both parties simultaneously."},
                    {"label": "E", "text": "Neither party."}
                ],
                "correct_answer": "B",
                "explanation": "The opposing party has the right to cross-examine the witness. The party calling the witness may then re-examine.",
                "difficulty": "easy"
            },
            {
                "id": 15,
                "title": "",
                "text": "A judgment is pronounced in open court. One party wishes to appeal. What is the first step they must take?",
                "options": [
                    {"label": "A", "text": "File an appellant's notice with the Court of Appeal."},
                    {"label": "B", "text": "Apply to the trial judge for permission to appeal."},
                    {"label": "C", "text": "Request the judge to reconsider the judgment under the slip rule."},
                    {"label": "D", "text": "File a notice of appeal with the trial court."},
                    {"label": "E", "text": "Apply for a stay of execution of the judgment."}
                ],
                "correct_answer": "B",
                "explanation": "The normal route is to ask the trial judge for permission to appeal at the hearing immediately after judgment is given.",
                "difficulty": "medium"
            },
            {
                "id": 16,
                "title": "",
                "text": "Which of the following is a key responsibility of the advocates in preparing the trial bundle?",
                "options": [
                    {"label": "A", "text": "To ensure the bundle contains only documents favourable to their own case."},
                    {"label": "B", "text": "To agree on its contents, paginate it consecutively, and ensure timely delivery."},
                    {"label": "C", "text": "To provide the court with original documents only."},
                    {"label": "D", "text": "To prepare separate bundles for each witness."},
                    {"label": "E", "text": "To include skeleton arguments bound within the bundle."}
                ],
                "correct_answer": "B",
                "explanation": "The bundle must be agreed, paginated, and lodged in compliance with court directions (PD 32 27.2).",
                "difficulty": "medium"
            },
            {
                "id": 17,
                "title": "",
                "text": "During re-examination, what is the primary purpose?",
                "options": [
                    {"label": "A", "text": "To challenge the credibility of the witness."},
                    {"label": "B", "text": "To ask leading questions to clarify the witness's evidence."},
                    {"label": "C", "text": "To allow the witness to give a narrative account of events."},
                    {"label": "D", "text": "To clarify matters arising from cross-examination, without introducing new matters."},
                    {"label": "E", "text": "To undermine the evidence of other witnesses."}
                ],
                "correct_answer": "D",
                "explanation": "Re-examination allows the party who called the witness to clarify matters arising during cross-examination.",
                "difficulty": "medium"
            },
            {
                "id": 18,
                "title": "",
                "text": "What is the effect of a judgment being marked 'without prejudice to the reasons to be given later'?",
                "options": [
                    {"label": "A", "text": "The judgment is not binding until the reasons are provided."},
                    {"label": "B", "text": "The parties cannot apply for permission to appeal until the reasons are given."},
                    {"label": "C", "text": "The order is effective immediately, but the detailed reasoning follows."},
                    {"label": "D", "text": "The judgment is provisional and subject to change."},
                    {"label": "E", "text": "The judge is indicating they may change their mind."}
                ],
                "correct_answer": "C",
                "explanation": "The order is legally binding from the moment it is pronounced. The written reasons provide the justification for any appeal.",
                "difficulty": "medium"
            },
            {
                "id": 19,
                "title": "",
                "text": "In the High Court, how should a barrister address a Costs Judge?",
                "options": [
                    {"label": "A", "text": "'Your Honour.'"},
                    {"label": "B", "text": "'Master.'"},
                    {"label": "C", "text": "'My Lord' or 'My Lady.'"},
                    {"label": "D", "text": "'Sir' or 'Madam.'"},
                    {"label": "E", "text": "'Judge.'"}
                ],
                "correct_answer": "B",
                "explanation": "A Costs Judge (who is a Master of the Senior Courts) is addressed as 'Master.'",
                "difficulty": "easy"
            },
            {
                "id": 20,
                "title": "",
                "text": "Benjamin is the claimant in a fast-track dispute against Christopher. On trial day, Benjamin fails to attend without explanation. Christopher attends ready to proceed. What is the court entitled to do?",
                "options": [
                    {"label": "A", "text": "Automatically strike out Benjamin's claim."},
                    {"label": "B", "text": "Adjourn the trial until Benjamin attends."},
                    {"label": "C", "text": "Proceed with the trial in Benjamin's absence."},
                    {"label": "D", "text": "Dismiss Christopher's defence."},
                    {"label": "E", "text": "Require Christopher to prove Benjamin's case."}
                ],
                "correct_answer": "C",
                "explanation": "If a party does not attend trial, the court may proceed in their absence and decide the case on the evidence available.",
                "difficulty": "medium"
            }
        ]
        print("-> Patched Dispute Resolution Section I with 20 new questions")

        # =====================================================
        # Patch Dispute Resolution Section J - Costs
        # =====================================================
        area_j = next((a for a in dispute_topic["areas"] if a["letter"] == "J"), None)
        if area_j:
            area_j["name"] = "Costs"
            area_j["slug"] = "j-costs"
            area_j["question_count"] = 20
        else:
            area_j = {
                "letter": "J",
                "name": "Costs",
                "slug": "j-costs",
                "question_count": 20,
                "questions": []
            }
            dispute_topic["areas"].insert(9, area_j)
        
        area_j["questions"] = [
            {
                "id": 1,
                "title": "",
                "text": "When the court assesses costs on the standard basis, how is any doubt as to the reasonableness of the costs resolved?",
                "options": [
                    {"label": "A", "text": "In favour of the receiving party (the party recovering costs)."},
                    {"label": "B", "text": "In favour of the paying party."},
                    {"label": "C", "text": "By splitting the difference equally."},
                    {"label": "D", "text": "By referring the matter to a costs judge for a detailed assessment."},
                    {"label": "E", "text": "By applying a fixed percentage reduction."}
                ],
                "correct_answer": "B",
                "explanation": "On the standard basis, doubts as to reasonableness are resolved in favour of the paying party (CPR 44.3(2)).",
                "difficulty": "medium"
            },
            {
                "id": 2,
                "title": "",
                "text": "A claimant makes a Part 36 offer to accept £10,000. Closest to trial, the defendant fails to accept. At trial, the claimant is awarded £12,000. What is NOT a consequence of the claimant beating their own Part 36 offer?",
                "options": [
                    {"label": "A", "text": "Interest on the whole or part of the sum awarded at a rate not exceeding 10% above base rate."},
                    {"label": "B", "text": "Costs on the indemnity basis from the date the relevant period expired."},
                    {"label": "C", "text": "Interest on those costs at a rate not exceeding 10% above base rate."},
                    {"label": "D", "text": "An additional amount of 10% of the first £500,000 of damages awarded."},
                    {"label": "E", "text": "Automatic striking out of the defence."}
                ],
                "correct_answer": "E",
                "explanation": "CPR 36.17(4) lists the rewards for a claimant who matches or beats their own offer. It does not include striking out the defence.",
                "difficulty": "medium"
            },
            {
                "id": 3,
                "title": "",
                "text": "In a fast track claim, costs are generally:",
                "options": [
                    {"label": "A", "text": "Assessed on the indemnity basis."},
                    {"label": "B", "text": "Fixed by the CPR (fixed recoverable costs)."},
                    {"label": "C", "text": "Subject to detailed assessment at the end of the case."},
                    {"label": "D", "text": "Capped at £25,000."},
                    {"label": "E", "text": "Payable only if the court orders summary assessment."}
                ],
                "correct_answer": "B",
                "explanation": "Fast track claims (and now intermediate track claims) are subject to fixed recoverable costs (CPR 45).",
                "difficulty": "medium"
            },
            {
                "id": 4,
                "title": "",
                "text": "Which factor does the court NOT generally consider when exercising its discretion as to costs under CPR 44.2?",
                "options": [
                    {"label": "A", "text": "The conduct of all the parties."},
                    {"label": "B", "text": "Whether a party has succeeded on part of its case, even if it has not been wholly successful."},
                    {"label": "C", "text": "Any admissible offer to settle made by a party which is not a Part 36 offer."},
                    {"label": "D", "text": "The financial resources of the paying party (except in specific cases like legal aid)."},
                    {"label": "E", "text": "Whether the successful party has legal expenses insurance."}
                ],
                "correct_answer": "E",
                "explanation": "The existence of insurance is generally irrelevant to the liability for costs between parties.",
                "difficulty": "medium"
            },
            {
                "id": 5,
                "title": "",
                "text": "Qualified One-Way Costs Shifting (QOCS) primarily applies to which type of claims?",
                "options": [
                    {"label": "A", "text": "Contractual disputes involving consumers."},
                    {"label": "B", "text": "Personal injury claims."},
                    {"label": "C", "text": "Professional negligence claims."},
                    {"label": "D", "text": "Commercial property disputes."},
                    {"label": "E", "text": "Probate disputes."}
                ],
                "correct_answer": "B",
                "explanation": "QOCS (CPR 44.13) applies to claims for damages for personal injuries, protecting claimants from enforcing costs orders against them.",
                "difficulty": "easy"
            },
            {
                "id": 6,
                "title": "",
                "text": "When assessing costs on the indemnity basis, what is the test for allowability?",
                "options": [
                    {"label": "A", "text": "Costs must be reasonable and proportionate."},
                    {"label": "B", "text": "Costs must be reasonably incurred and reasonable in amount, with doubt resolved in favour of the receiving party."},
                    {"label": "C", "text": "Costs needs only be reasonably incurred, disregarding proportionality."},
                    {"label": "D", "text": "Costs must be proportionate to the sum in issue."},
                    {"label": "E", "text": "Costs are allowed in full unless manifestly excessive."}
                ],
                "correct_answer": "C",
                "explanation": "On the indemnity basis, the court does not consider proportionality (CPR 44.3(3)). Doubts are resolved in favour of the receiving party.",
                "difficulty": "hard"
            },
            {
                "id": 7,
                "title": "",
                "text": "A defendant makes a Part 36 offer of £15,000. The claimant rejects it and proceeds to trial, where they are awarded £12,000. What is the usual costs consequence?",
                "options": [
                    {"label": "A", "text": "The claimant gets their costs of the whole proceedings."},
                    {"label": "B", "text": "The claimant pays the defendant's costs from the date the relevant period expired."},
                    {"label": "C", "text": "The defendant pays the claimant's costs on the indemnity basis."},
                    {"label": "D", "text": "Each party bears their own costs."},
                    {"label": "E", "text": "The claimant gets costs up to the offer date, but pays the defendant's costs thereafter."}
                ],
                "correct_answer": "E",
                "explanation": "If the claimant fails to beat the defendant's Part 36 offer, the claimant usually recovers costs up to the end of the relevant period, but must pay the defendant's costs and interest from that point onwards (CPR 36.17(3)).",
                "difficulty": "hard"
            },
            {
                "id": 8,
                "title": "",
                "text": "Summary assessment of costs usually takes place:",
                "options": [
                    {"label": "A", "text": "At the conclusion of a fast track trial."},
                    {"label": "B", "text": "At the conclusion of any hearing which has lasted not more than one day."},
                    {"label": "C", "text": "Only in the small claims track."},
                    {"label": "D", "text": "Only in the High Court."},
                    {"label": "E", "text": "Whenever the costs claimed exceed £75,000."}
                ],
                "correct_answer": "B",
                "explanation": "The general rule is that the court should summarily assess costs at the conclusion of any hearing which has lasted not more than one day (PD 44 9.2).",
                "difficulty": "medium"
            },
            {
                "id": 9,
                "title": "",
                "text": "For a Part 36 offer to be valid, it must:",
                "options": [
                    {"label": "A", "text": "Be made in writing."},
                    {"label": "B", "text": "State strictly that it is intended to have the consequences of Part 36."},
                    {"label": "C", "text": "Specify a period of not less than 21 days for acceptance (the 'relevant period')."},
                    {"label": "D", "text": "State whether it relates to the whole or part of the claim."},
                    {"label": "E", "text": "All of the above."}
                ],
                "correct_answer": "E",
                "explanation": "CPR 36.5 sets out the form and content requirements, including all the listed elements.",
                "difficulty": "medium"
            },
            {
                "id": 10,
                "title": "",
                "text": "What is the 'relevant period' for a Part 36 offer?",
                "options": [
                    {"label": "A", "text": "14 days."},
                    {"label": "B", "text": "21 days, or such longer period as specified in the offer."},
                    {"label": "C", "text": "28 days."},
                    {"label": "D", "text": "Before the trial starts."},
                    {"label": "E", "text": "Whatever reasonable period the offeror chooses."}
                ],
                "correct_answer": "B",
                "explanation": "The relevant period must be not less than 21 days (CPR 36.5(1)(c)).",
                "difficulty": "easy"
            },
            {
                "id": 11,
                "title": "",
                "text": "In a claim involving a child (a protected party), a settlement reached before proceedings are issued:",
                "options": [
                    {"label": "A", "text": "Is valid without court approval if agreed by the litigation friend."},
                    {"label": "B", "text": "Must be approved by the court to be valid and binding."},
                    {"label": "C", "text": "Is valid only if witnessed by a solicitor."},
                    {"label": "D", "text": "Cannot be made until proceedings are issued."},
                    {"label": "E", "text": "Depends on the amount of the settlement."}
                ],
                "correct_answer": "B",
                "explanation": "CPR 21.10 states that no settlement involving a child or protected party is valid without the approval of the court.",
                "difficulty": "medium"
            },
            {
                "id": 12,
                "title": "",
                "text": "If a party accepts a Part 36 offer within the relevant period, what is the costs position?",
                "options": [
                    {"label": "A", "text": "Each party bears their own costs."},
                    {"label": "B", "text": "The claimant is entitled to their costs of the proceedings up to the date of acceptance."},
                    {"label": "C", "text": "The defendant pays the claimant's costs on the indemnity basis."},
                    {"label": "D", "text": "The court determines costs after a hearing."},
                    {"label": "E", "text": "The offeror pays the offeree's costs."}
                ],
                "correct_answer": "B",
                "explanation": "CPR 36.13(1) states that upon acceptance within the relevant period, the claimant is entitled to the costs of the proceedings up to the date of serving notice of acceptance.",
                "difficulty": "medium"
            },
            {
                "id": 13,
                "title": "",
                "text": "Before attending a hearing for summary assessment of costs, a party must file and serve:",
                "options": [
                    {"label": "A", "text": "A full bill of costs."},
                    {"label": "B", "text": "A statement of costs (Form N260)."},
                    {"label": "C", "text": "A costs budget (Precedent H)."},
                    {"label": "D", "text": "An estimate of costs."},
                    {"label": "E", "text": "A letter detailing their hourly rates."}
                ],
                "correct_answer": "B",
                "explanation": "PD 44 9.5 require parties to file and serve a statement of costs (Form N260) for summary assessment.",
                "difficulty": "medium"
            },
            {
                "id": 14,
                "title": "",
                "text": "Where a claimant discontinues their claim, the default rule is:",
                "options": [
                    {"label": "A", "text": "Each party bears their own costs."},
                    {"label": "B", "text": "The claimant is liable for the defendant's costs incurred on or before the date of discontinuance."},
                    {"label": "C", "text": "The defendant pays the claimant's costs."},
                    {"label": "D", "text": "Costs are reserved to a later hearing."},
                    {"label": "E", "text": "The court must make a special order."}
                ],
                "correct_answer": "B",
                "explanation": "CPR 38.6 states the general rule: a claimant who discontinues is liable for the defendant's costs.",
                "difficulty": "medium"
            },
            {
                "id": 15,
                "title": "",
                "text": "What is the primary difference between a 'Bullock' order and a 'Sanderson' order in multi-party litigation?",
                "options": [
                    {"label": "A", "text": "A Bullock order requires the claimant to pay the successful defendant's costs and recoup them from the unsuccessful defendant. A Sanderson order orders the unsuccessful defendant to pay the successful defendant directly."},
                    {"label": "B", "text": "A Bullock order is for indemnity costs; a Sanderson order is for standard costs."},
                    {"label": "C", "text": "A Bullock order applies to pre-action costs; a Sanderson order applies to trial costs."},
                    {"label": "D", "text": "A Sanderson order is used only in personal injury cases."},
                    {"label": "E", "text": "There is no difference; the terms are interchangeable."}
                ],
                "correct_answer": "A",
                "explanation": "Both orders address the costs of a successful co-defendant. In Bullock, the claimant pays and reclaims. In Sanderson, the unsuccessful defendant pays directly (Sanderson v Blyth Theatre Co).",
                "difficulty": "hard"
            },
            {
                "id": 16,
                "title": "",
                "text": "Under CPR 44.4, in assessing whether costs are proportionate, the court will have regard to:",
                "options": [
                    {"label": "A", "text": "The sums in issue in the proceedings."},
                    {"label": "B", "text": "The value of any non-monetary relief in issue."},
                    {"label": "C", "text": "The complexity of the litigation."},
                    {"label": "D", "text": "The conduct of the paying party."},
                    {"label": "E", "text": "All of the above."}
                ],
                "correct_answer": "E",
                "explanation": "CPR 44.3(5) and 44.4 lists these factors (finding the right balance) when considering proportionality.",
                "difficulty": "medium"
            },
            {
                "id": 17,
                "title": "",
                "text": "Can a Part 36 offer be withdrawn?",
                "options": [
                    {"label": "A", "text": "No, once made it remains open until trial."},
                    {"label": "B", "text": "Yes, by serving written notice of withdrawal."},
                    {"label": "C", "text": "Yes, but only with the court's permission."},
                    {"label": "D", "text": "Yes, but only after the relevant period has expired."},
                    {"label": "E", "text": "No, it expires automatically after 21 days."}
                ],
                "correct_answer": "B",
                "explanation": "A Part 36 offer can be withdrawn or changed by serving written notice (CPR 36.9). If withdrawn within the relevant period, it may have different costs consequences.",
                "difficulty": "medium"
            },
            {
                "id": 18,
                "title": "",
                "text": "What is the effect of a 'Calderbank' offer?",
                "options": [
                    {"label": "A", "text": "It has the same automatic consequences as a Part 36 offer."},
                    {"label": "B", "text": "It is a factor the court must take into account when exercising its discretion on costs."},
                    {"label": "C", "text": "It is inadmissible for all purposes, including costs."},
                    {"label": "D", "text": "It only applies to small claims."},
                    {"label": "E", "text": "It guarantees indemnity costs if beaten."}
                ],
                "correct_answer": "B",
                "explanation": "A Calderbank offer (an offer made 'without prejudice save as to costs' but not under Part 36) is a factor under CPR 44.2(4)(c) but lacks the automatic code of Part 36.",
                "difficulty": "medium"
            },
            {
                "id": 19,
                "title": "",
                "text": "Usually, an interim payment on account of costs is ordered:",
                "options": [
                    {"label": "A", "text": "Only in exceptional circumstances."},
                    {"label": "B", "text": "Where the court has made a costs order subject to detailed assessment."},
                    {"label": "C", "text": "Before liability has been determined."},
                    {"label": "D", "text": "Only if the receiving party is legally aided."},
                    {"label": "E", "text": "After the detailed assessment hearing."}
                ],
                "correct_answer": "B",
                "explanation": "CPR 44.2(8) provides that where the court orders a party to pay costs subject to detailed assessment, it will order that party to pay a reasonable sum on account of costs, unless there is good reason not to.",
                "difficulty": "medium"
            },
            {
                "id": 20,
                "title": "",
                "text": "A defendant wishes to make a Part 36 offer in respect of a counterclaim. How should they proceed?",
                "options": [
                    {"label": "A", "text": "They cannot make a Part 36 offer for a counterclaim."},
                    {"label": "B", "text": "They make the offer as if they were a claimant in the counterclaim."},
                    {"label": "C", "text": "They must include it in a global offer for the main claim."},
                    {"label": "D", "text": "They must obtain the court's permission."},
                    {"label": "E", "text": "They use a Calderbank letter instead."}
                ],
                "correct_answer": "B",
                "explanation": "CPR 36.2(3) states that a Part 36 offer may be made in respect of a counterclaim, and the rules apply as if the counterclaim were a claim.",
                "difficulty": "medium"
            }
        ]
        print("-> Patched Dispute Resolution Section J with 20 new questions")

        # =====================================================
        # Patch Dispute Resolution Section K - Appeals
        # =====================================================
        area_k = next((a for a in dispute_topic["areas"] if a["letter"] == "K"), None)
        if area_k:
            area_k["name"] = "Appeals"
            area_k["slug"] = "k-appeals"
            area_k["question_count"] = 20
        else:
            area_k = {
                "letter": "K",
                "name": "Appeals",
                "slug": "k-appeals",
                "question_count": 20,
                "questions": []
            }
            dispute_topic["areas"].insert(10, area_k)
        
        area_k["questions"] = [
            {
                "id": 1,
                "title": "",
                "text": "What is the general time limit for filing an appellant's notice after the lower court's decision, unless the court directs otherwise?",
                "options": [
                    {"label": "A", "text": "14 days."},
                    {"label": "B", "text": "21 days."},
                    {"label": "C", "text": "28 days."},
                    {"label": "D", "text": "7 days."},
                    {"label": "E", "text": "There is no fixed time limit."}
                ],
                "correct_answer": "B",
                "explanation": "CPR 52.12 states the appellant's notice must be filed within such period as the lower court directs, or if no direction is given, 21 days after the decision.",
                "difficulty": "easy"
            },
            {
                "id": 2,
                "title": "",
                "text": "Permission to appeal is required for:",
                "options": [
                    {"label": "A", "text": "All appeals from the County Court or High Court, subject to limited exceptions."},
                    {"label": "B", "text": "Only appeals to the Supreme Court."},
                    {"label": "C", "text": "Only appeals against case management decisions."},
                    {"label": "D", "text": "Appeals from final decisions in the fast track only."},
                    {"label": "E", "text": "Appeals where the value of the claim is less than £10,000."}
                ],
                "correct_answer": "A",
                "explanation": "The general rule under CPR 52.3 is that permission to appeal is required for all appeals from the County Court or High Court (except for committal orders and certain other specific exceptions).",
                "difficulty": "medium"
            },
            {
                "id": 3,
                "title": "",
                "text": "The test for granting permission to appeal is whether:",
                "options": [
                    {"label": "A", "text": "The appeal has a realistic prospect of success or there is some other compelling reason for the appeal to be heard."},
                    {"label": "B", "text": "The appeal is likely to succeed on the balance of probabilities."},
                    {"label": "C", "text": "The judge made a manifest error of law."},
                    {"label": "D", "text": "The appellant has suffered significant injustice."},
                    {"label": "E", "text": "The case involves a point of public importance."}
                ],
                "correct_answer": "A",
                "explanation": "CPR 52.6 sets out the test: realistic prospect of success OR some other compelling reason.",
                "difficulty": "medium"
            },
            {
                "id": 4,
                "title": "",
                "text": "An appeal against a decision of a District Judge in the County Court is normally heard by:",
                "options": [
                    {"label": "A", "text": "The Court of Appeal."},
                    {"label": "B", "text": "A Circuit Judge."},
                    {"label": "C", "text": "A High Court Judge."},
                    {"label": "D", "text": "Another District Judge."},
                    {"label": "E", "text": "The Master of the Rolls."}
                ],
                "correct_answer": "B",
                "explanation": "Current destination of appeals (PD 52A) generally routes appeals from a District Judge to a Circuit Judge.",
                "difficulty": "medium"
            },
            {
                "id": 5,
                "title": "",
                "text": "When will an appeal court allow an appeal?",
                "options": [
                    {"label": "A", "text": "If it disagrees with the lower court's decision."},
                    {"label": "B", "text": "If the decision was wrong or unjust because of a serious procedural or other irregularity."},
                    {"label": "C", "text": "If the lower court failed to consider a piece of evidence."},
                    {"label": "D", "text": "If the appeal court would have reached a different conclusion."},
                    {"label": "E", "text": "Only if the decision was perverse."}
                ],
                "correct_answer": "B",
                "explanation": "CPR 52.21(3) states the appeal will be allowed where the decision was 'wrong' or 'unjust because of a serious procedural or other irregularity'.",
                "difficulty": "medium"
            },
            {
                "id": 6,
                "title": "",
                "text": "Generally, an appeal is limited to:",
                "options": [
                    {"label": "A", "text": "A rehearing of the whole case."},
                    {"label": "B", "text": "A review of the decision of the lower court."},
                    {"label": "C", "text": "New evidence only."},
                    {"label": "D", "text": "Points of law only."},
                    {"label": "E", "text": "Matters of fact only."}
                ],
                "correct_answer": "B",
                "explanation": "CPR 52.21(1) states that every appeal will be limited to a review of the decision of the lower court unless the court considers that in the circumstances of an individual appeal it would be in the interests of justice to hold a re-hearing.",
                "difficulty": "medium"
            },
            {
                "id": 7,
                "title": "",
                "text": "Can a party introduce new evidence on appeal?",
                "options": [
                    {"label": "A", "text": "Yes, automatically."},
                    {"label": "B", "text": "No, never."},
                    {"label": "C", "text": "Yes, but only with the permission of the appeal court, applying the Ladd v Marshall principles."},
                    {"label": "D", "text": "Yes, if it was available at the trial but not used."},
                    {"label": "E", "text": "Only if the appeal is to the Supreme Court."}
                ],
                "correct_answer": "C",
                "explanation": "Unless the appeal court orders otherwise, it will not receive oral evidence or evidence which was not before the lower court (CPR 52.21(2)). Permission is required, usually based on the Ladd v Marshall criteria (could not have been obtained with reasonable diligence, would have an important influence, and is credible).",
                "difficulty": "hard"
            },
            {
                "id": 8,
                "title": "",
                "text": "An appeal against a final order in a multi-track claim made by a Circuit Judge is normally heard by:",
                "options": [
                    {"label": "A", "text": "The High Court."},
                    {"label": "B", "text": "The Court of Appeal."},
                    {"label": "C", "text": "Another Circuit Judge."},
                    {"label": "D", "text": "The Supreme Court."},
                    {"label": "E", "text": "A Divisional Court."}
                ],
                "correct_answer": "B",
                "explanation": "Appeals from a final decision in a multi-track claim (or specialist proceedings) go to the Court of Appeal (Access to Justice Act 1999 (Destination of Appeals) Order 2016).",
                "difficulty": "hard"
            },
            {
                "id": 9,
                "title": "",
                "text": "Does an appeal automatically operate as a stay of execution of the lower court's order?",
                "options": [
                    {"label": "A", "text": "Yes, always."},
                    {"label": "B", "text": "No, unless the appeal court or the lower court orders otherwise."},
                    {"label": "C", "text": "Yes, for 14 days."},
                    {"label": "D", "text": "No, but the appellant can withhold payment."},
                    {"label": "E", "text": "Yes, if the appellant is a litigant in person."}
                ],
                "correct_answer": "B",
                "explanation": "CPR 52.16 provides that an appeal does not operate as a stay of any order or decision of the lower court unless the appeal court or lower court so orders.",
                "difficulty": "medium"
            },
            {
                "id": 10,
                "title": "",
                "text": "What is a 'Respondents' Notice' used for?",
                "options": [
                    {"label": "A", "text": "To inform the court the respondent intends to defend the appeal."},
                    {"label": "B", "text": "To ask the appeal court to uphold the lower court's decision for different or additional reasons, or to vary the order."},
                    {"label": "C", "text": "To counter-appeal against the whole decision."},
                    {"label": "D", "text": "To apply for security for costs."},
                    {"label": "E", "text": "To request a transcript of the judgment."}
                ],
                "correct_answer": "B",
                "explanation": "A respondent's notice (CPR 52.13) is used if the respondent wants the order upheld for different reasons or wants the order varied (though a cross-appeal is needed to vary the order in a way that benefits the respondent materially beyond just upholding it - but for SQE purposes, varying/upholding on different grounds is the key function).",
                "difficulty": "medium"
            },
            {
                "id": 11,
                "title": "",
                "text": "Which court hears an appeal from a Master in the High Court?",
                "options": [
                    {"label": "A", "text": "The Court of Appeal."},
                    {"label": "B", "text": "A High Court Judge."},
                    {"label": "C", "text": "A Divisional Court."},
                    {"label": "D", "text": "Another Master."},
                    {"label": "E", "text": "The Supreme Court."}
                ],
                "correct_answer": "B",
                "explanation": "Appeals from a Master (High Court) go to a High Court Judge (PD 52A).",
                "difficulty": "medium"
            },
            {
                "id": 12,
                "title": "",
                "text": "In a second appeal (an appeal from a decision of a court which was itself an appeal court), permission will only be granted by:",
                "options": [
                    {"label": "A", "text": "The lower court."},
                    {"label": "B", "text": "The High Court."},
                    {"label": "C", "text": "The Court of Appeal."},
                    {"label": "D", "text": "The Supreme Court."},
                    {"label": "E", "text": "The Lord Chancellor."}
                ],
                "correct_answer": "C",
                "explanation": "Permission for a second appeal to the Court of Appeal must be granted by the Court of Appeal itself (CPR 52.7(1)).",
                "difficulty": "medium"
            },
            {
                "id": 13,
                "title": "",
                "text": "The 'Leapfrog' procedure allows an appeal to go directly:",
                "options": [
                    {"label": "A", "text": "From the County Court to the Supreme Court."},
                    {"label": "B", "text": "From the High Court to the Supreme Court, bypassing the Court of Appeal."},
                    {"label": "C", "text": "From the Small Claims Court to the High Court."},
                    {"label": "D", "text": "From a Master to the Court of Appeal."},
                    {"label": "E", "text": "From a District Judge to the Court of Appeal."}
                ],
                "correct_answer": "B",
                "explanation": "The leapfrog procedure allows appeals from the High Court (or Div Court) directly to the Supreme Court in cases of general public importance involving statutory interpretation, bypassing the CA.",
                "difficulty": "medium"
            },
            {
                "id": 14,
                "title": "",
                "text": "Who can grant permission to appeal?",
                "options": [
                    {"label": "A", "text": "Only the appeal court."},
                    {"label": "B", "text": "Only the lower court."},
                    {"label": "C", "text": "The lower court or the appeal court."},
                    {"label": "D", "text": "Only the Supreme Court."},
                    {"label": "E", "text": "The parties by agreement."}
                ],
                "correct_answer": "C",
                "explanation": "An application for permission can be made to the lower court at the hearing properly, or subsequently to the appeal court (CPR 52.3).",
                "difficulty": "easy"
            },
            {
                "id": 15,
                "title": "",
                "text": "If permission to appeal is refused on the papers by the Court of Appeal, can the appellant request an oral hearing?",
                "options": [
                    {"label": "A", "text": "Yes, always."},
                    {"label": "B", "text": "No, the decision is final."},
                    {"label": "C", "text": "Yes, unless the judge has certified the application as 'totally without merit'."},
                    {"label": "D", "text": "Yes, provided they pay a double fee."},
                    {"label": "E", "text": "No, they must appeal to the Supreme Court."}
                ],
                "correct_answer": "C",
                "explanation": "The applicant may request the decision be reconsidered at an oral hearing (CPR 52.5), unless the judge certifies the application as totally without merit.",
                "difficulty": "medium"
            },
            {
                "id": 16,
                "title": "",
                "text": "What power does the appeal court NOT have?",
                "options": [
                    {"label": "A", "text": "To affirm, set aside, or vary any order or judgment."},
                    {"label": "B", "text": "To refer any claim or issue for determination by the lower court."},
                    {"label": "C", "text": "To order a new trial or hearing."},
                    {"label": "D", "text": "To make orders for the payment of interest."},
                    {"label": "E", "text": "To retry the case with new witnesses as a matter of course."}
                ],
                "correct_answer": "E",
                "explanation": "While the court can order a new trial, it does not retry the case itself with new witnesses as a standard procedure; it reviews the decision. Options A-D are express powers under CPR 52.20.",
                "difficulty": "medium"
            },
            {
                "id": 17,
                "title": "",
                "text": "When applying for permission to appeal to the Court of Appeal from a decision of the High Court, the test is:",
                "options": [
                    {"label": "A", "text": "Realistic prospect of success or some other compelling reason."},
                    {"label": "B", "text": "The decision raises an important point of principle or practice."},
                    {"label": "C", "text": "The decision is plainly wrong."},
                    {"label": "D", "text": "The case value exceeds £100,000."},
                    {"label": "E", "text": "There is a compelling reason only."}
                ],
                "correct_answer": "A",
                "explanation": "This is the standard test for a first appeal (CPR 52.6).",
                "difficulty": "easy"
            },
            {
                "id": 18,
                "title": "",
                "text": "For a second appeal to the Court of Appeal, the test is stricter. The Court of Appeal will not give permission unless:",
                "options": [
                    {"label": "A", "text": "The appeal has a realistic prospect of success."},
                    {"label": "B", "text": "The appeal raises an important point of principle or practice OR there is some other compelling reason for the Court of Appeal to hear it."},
                    {"label": "C", "text": "The lower court was clearly wrong."},
                    {"label": "D", "text": "The damages award is excessive."},
                    {"label": "E", "text": "The appellant is a litigant in person."}
                ],
                "correct_answer": "B",
                "explanation": "CPR 52.7(2) sets out this stricter test for second appeals.",
                "difficulty": "hard"
            },
            {
                "id": 19,
                "title": "",
                "text": "If a respondent wishes to appeal against a part of the lower court's decision, they must:",
                "options": [
                    {"label": "A", "text": "File their own appellant's notice (cross-appeal) or seek permission to do so."},
                    {"label": "B", "text": "Simply state it in their skeleton argument."},
                    {"label": "C", "text": "Raise it orally at the hearing."},
                    {"label": "D", "text": "File a Respondent's Notice seeking to vary the order."},
                    {"label": "E", "text": "Write a letter to the court."}
                ],
                "correct_answer": "A",
                "explanation": "Although a Respondent's Notice can ask to vary an order, if the respondent is effectively bringing their own appeal against a distinct part of the decision, they may need to cross-appeal. However, for SQE purposes, a Respondent's Notice is often the primary mechanism to differ from the order. Technically, 'filing an appeal notice' (cross appeal) is required if they want to set aside or vary the order in a way that is distinct. But usually, permission is required.",
                "difficulty": "medium"
            },
            {
                "id": 20,
                "title": "",
                "text": "What is the status of a finding of fact by the lower court on appeal?",
                "options": [
                    {"label": "A", "text": "The appeal court will readily overturn it."},
                    {"label": "B", "text": "The appeal court will not interfere with findings of fact unless they are unsupported by evidence or plainly wrong."},
                    {"label": "C", "text": "The appeal court reviews all facts de novo."},
                    {"label": "D", "text": "Findings of fact are binding and cannot be appealed."},
                    {"label": "E", "text": "Facts are irrelevant on appeal."}
                ],
                "correct_answer": "B",
                "explanation": "Appeal courts are very reluctant to overturn findings of primary fact, especially those based on witness credibility, unless plainly wrong.",
                "difficulty": "medium"
            }
        ]
        print("-> Patched Dispute Resolution Section K with 20 new questions")

        # =====================================================
        # Patch Dispute Resolution Section L - Enforcement of Money Judgments
        # =====================================================
        area_l = next((a for a in dispute_topic["areas"] if a["letter"] == "L"), None)
        if area_l:
            area_l["name"] = "Enforcement of Money Judgments"
            area_l["slug"] = "l-enforcement-of-money-judgments"
            area_l["question_count"] = 17
        else:
            area_l = {
                "letter": "L",
                "name": "Enforcement of Money Judgments",
                "slug": "l-enforcement-of-money-judgments",
                "question_count": 17,
                "questions": []
            }
            dispute_topic["areas"].insert(11, area_l)
        
        area_l["questions"] = [
            {
                "id": 1,
                "title": "",
                "text": "A judgment creditor has obtained a final money judgment. They know little about the debtor's financial circumstances. Which enforcement method is specifically designed to obtain information about the debtor's assets and means before choosing an enforcement method?",
                "options": [
                    {"label": "A", "text": "Writ of Control (High Court) / Warrant of Control (County Court)."},
                    {"label": "B", "text": "Third Party Debt Order."},
                    {"label": "C", "text": "Oral Examination (CPR Part 71)."},
                    {"label": "D", "text": "Attachment of Earnings Order."},
                    {"label": "E", "text": "Charging Order."}
                ],
                "correct_answer": "C",
                "explanation": "An Oral Examination (or Order to Obtain Information) under CPR Part 71 compels the judgment debtor (or an officer of a corporate debtor) to attend court and answer questions on oath about their finances, employment, assets, etc. It is an information-gathering tool.",
                "difficulty": "medium"
            },
            {
                "id": 2,
                "title": "",
                "text": "Which of the following methods of enforcement can be initiated without first making a separate application to the court for permission?",
                "options": [
                    {"label": "A", "text": "Third Party Debt Order (final stage)."},
                    {"label": "B", "text": "Charging Order (final stage)."},
                    {"label": "C", "text": "Writ of Control / Warrant of Control."},
                    {"label": "D", "text": "Attachment of Earnings Order."},
                    {"label": "E", "text": "Appointment of a Receiver."}
                ],
                "correct_answer": "C",
                "explanation": "A Writ of Control (High Court) or Warrant of Control (County Court) can be issued as of right by the judgment creditor upon filing a simple request and paying a fee. All other listed methods generally require an application to the court.",
                "difficulty": "medium"
            },
            {
                "id": 3,
                "title": "",
                "text": "A judgment debtor is employed full-time on a modest but stable salary. They have no significant assets like property or valuable goods. Which enforcement method is likely to be most effective?",
                "options": [
                    {"label": "A", "text": "Writ of Control against their household goods."},
                    {"label": "B", "text": "Charging Order against their car."},
                    {"label": "C", "text": "Attachment of Earnings Order."},
                    {"label": "D", "text": "Third Party Debt Order against their spouse's bank account."},
                    {"label": "E", "text": "Bankruptcy petition."}
                ],
                "correct_answer": "C",
                "explanation": "An Attachment of Earnings Order (AEO) is specifically designed to enforce a judgment against a debtor in regular employment. It requires the employer to deduct a regular sum from the debtor's wages.",
                "difficulty": "medium"
            },
            {
                "id": 4,
                "title": "",
                "text": "A judgment creditor discovers the debtor holds a substantial credit balance in a bank account. Which enforcement method is best suited to seize these funds?",
                "options": [
                    {"label": "A", "text": "Writ of Fieri Facias."},
                    {"label": "B", "text": "Third Party Debt Order."},
                    {"label": "C", "text": "Charging Order."},
                    {"label": "D", "text": "Order for Sale."},
                    {"label": "E", "text": "Oral Examination."}
                ],
                "correct_answer": "B",
                "explanation": "A Third Party Debt Order (formerly a Garnishee Order) is the correct procedure for securing and obtaining payment of a debt owed to the judgment debtor by a third party (e.g., a bank).",
                "difficulty": "medium"
            },
            {
                "id": 5,
                "title": "",
                "text": "What is the effect of obtaining an interim charging order (a charging order nisi) over the debtor's registered freehold property?",
                "options": [
                    {"label": "A", "text": "It immediately transfers legal title of the property to the creditor."},
                    {"label": "B", "text": "It prevents the debtor from selling or mortgaging the property without the creditor's consent or the court's permission."},
                    {"label": "C", "text": "It authorises the creditor to take possession of the property."},
                    {"label": "D", "text": "It forces an immediate sale of the property."},
                    {"label": "E", "text": "It is unenforceable until made final."}
                ],
                "correct_answer": "B",
                "explanation": "An interim charging order (nisi) is a protective step. It is registered against the property at the Land Registry, which acts as a caution or restriction, preventing the debtor from disposing of the property without the charge being addressed.",
                "difficulty": "medium"
            },
            {
                "id": 6,
                "title": "",
                "text": "Which of the following is a disadvantage of using a Warrant of Control in the County Court compared to a High Court Writ of Control for the same judgment?",
                "options": [
                    {"label": "A", "text": "The High Court Enforcement Officer (HCEO) has greater powers of entry."},
                    {"label": "B", "text": "HCEOs work on a \"no recovery, no fee\" basis for the enforcement stage."},
                    {"label": "C", "text": "County Court bailiffs are court officials, while HCEOs are private enforcement agents motivated by success fees."},
                    {"label": "D", "text": "The fee structure for the creditor is always cheaper in the County Court."},
                    {"label": "E", "text": "A Warrant of Control cannot be used if the judgment is over £600."}
                ],
                "correct_answer": "C",
                "explanation": "County Court bailiffs are salaried court staff, which critics argue can make them less proactive. High Court Enforcement Officers (HCEOs) are private agents who add their fees to the debt and are often seen as more effective.",
                "difficulty": "medium"
            },
            {
                "id": 7,
                "title": "",
                "text": "A judgment creditor wants to enforce a County Court judgment of £15,000. The debtor owns a share in a valuable freehold property. The creditor does not want to force an immediate sale but wants to secure the debt against that asset. Which two-stage process should they use?",
                "options": [
                    {"label": "A", "text": "Apply for an Attachment of Earnings Order."},
                    {"label": "B", "text": "Apply for a Third Party Debt Order."},
                    {"label": "C", "text": "Apply for a Charging Order, followed potentially by an Order for Sale."},
                    {"label": "D", "text": "Issue a Warrant of Control."},
                    {"label": "E", "text": "Apply for the debtor's oral examination."}
                ],
                "correct_answer": "C",
                "explanation": "A Charging Order is the method for securing a judgment debt against a debtor's interest in land. The process involves an interim charging order followed by a final charging order.",
                "difficulty": "medium"
            },
            {
                "id": 8,
                "title": "",
                "text": "What is the primary purpose of the \"protected earnings rate\" in an Attachment of Earnings Order?",
                "options": [
                    {"label": "A", "text": "To ensure the creditor receives a minimum amount each week."},
                    {"label": "B", "text": "To calculate the employer's administrative fee."},
                    {"label": "C", "text": "To ensure the debtor retains enough income to meet basic living expenses."},
                    {"label": "D", "text": "To determine the priority of the judgment debt over other deductions."},
                    {"label": "E", "text": "To set a maximum limit on the total amount that can be deducted."}
                ],
                "correct_answer": "C",
                "explanation": "The \"protected earnings rate\" is the amount below which the debtor's earnings must not be reduced, designed to leave the debtor with enough money to cover essential living costs.",
                "difficulty": "medium"
            },
            {
                "id": 9,
                "title": "",
                "text": "A judgment debtor fails to comply with an Order to Attend Court for an Oral Examination (CPR Part 71). What can the court do?",
                "options": [
                    {"label": "A", "text": "Immediately issue a Warrant of Control against their goods."},
                    {"label": "B", "text": "Make an order for their committal to prison for contempt of court."},
                    {"label": "C", "text": "Transfer the case to the High Court automatically."},
                    {"label": "D", "text": "Dismiss the judgment as satisfied."},
                    {"label": "E", "text": "Order the creditor to pay the debtor's costs."}
                ],
                "correct_answer": "B",
                "explanation": "Failure to attend an oral examination is a contempt of court. The court can issue a warrant for the debtor's arrest to bring them before the court, and ultimately has the power to commit them to prison.",
                "difficulty": "medium"
            },
            {
                "id": 10,
                "title": "",
                "text": "Which of the following statements about a Writ of Control / Warrant of Control is FALSE?",
                "options": [
                    {"label": "A", "text": "It authorises an enforcement agent to take control of the debtor's goods and sell them."},
                    {"label": "B", "text": "Certain goods are exempt, such as tools and equipment necessary for the debtor's personal use in their employment, up to a value."},
                    {"label": "C", "text": "It can be used to seize goods owned by the debtor but found on premises occupied by a third party."},
                    {"label": "D", "text": "It allows the forced entry into a debtor's private dwelling house on the first visit."},
                    {"label": "E", "text": "The enforcement agent must provide the debtor with a notice of enforcement before taking control of goods."}
                ],
                "correct_answer": "D",
                "explanation": "An enforcement agent generally cannot use force to enter a private dwelling house on the first visit to take control of goods. They can usually only enter peaceably.",
                "difficulty": "medium"
            },
            {
                "id": 11,
                "title": "",
                "text": "When applying for a Third Party Debt Order, which of the following parties is served with the interim order?",
                "options": [
                    {"label": "A", "text": "Only the judgment debtor."},
                    {"label": "B", "text": "Only the third party (the garnishee, e.g., the bank)."},
                    {"label": "C", "text": "Both the judgment debtor and the third party."},
                    {"label": "D", "text": "The court funds office."},
                    {"label": "E", "text": "The judgment debtor's employer."}
                ],
                "correct_answer": "C",
                "explanation": "CPR 72.4(1) states the interim third party debt order must be served on the third party (to freeze the debt) and on the judgment debtor (to notify them).",
                "difficulty": "medium"
            },
            {
                "id": 12,
                "title": "",
                "text": "A judgment creditor has a charging order absolute over the debtor's property. The debt remains unpaid. What is the next step to realise the money from this security?",
                "options": [
                    {"label": "A", "text": "Automatically appoint a receiver."},
                    {"label": "B", "text": "Apply to the court for an Order for Sale."},
                    {"label": "C", "text": "Register the charge with the Land Registry again."},
                    {"label": "D", "text": "Issue a Writ of Possession."},
                    {"label": "E", "text": "The creditor can now sell the property themselves."}
                ],
                "correct_answer": "B",
                "explanation": "A charging order only secures the debt. To get paid, the creditor must apply to the court for an Order for Sale under CPR Part 40.",
                "difficulty": "medium"
            },
            {
                "id": 13,
                "title": "",
                "text": "Which of the following is a key advantage of enforcing a judgment in the High Court using a Writ of Control, rather than in the County Court?",
                "options": [
                    {"label": "A", "text": "It is always free of charge for the creditor."},
                    {"label": "B", "text": "The judgment must be for at least £600."},
                    {"label": "C", "text": "The High Court can enforce any judgment, regardless of original jurisdiction."},
                    {"label": "D", "text": "There is no need to transfer up a County Court judgment."},
                    {"label": "E", "text": "The debtor has no right to apply to suspend enforcement."}
                ],
                "correct_answer": "B",
                "explanation": "A judgment must be for at least £600 (excluding costs and interest) to be enforceable in the High Court by a Writ of Control (this is a condition, but differentiates it from small county court warrants).",
                "difficulty": "medium"
            },
            {
                "id": 14,
                "title": "",
                "text": "What is the main purpose of making a bankruptcy petition against an individual judgment debtor?",
                "options": [
                    {"label": "A", "text": "To obtain information about their assets."},
                    {"label": "B", "text": "To secure a specific debt against their property."},
                    {"label": "C", "text": "To have a trustee appointed to realise the debtor's assets for the benefit of all creditors."},
                    {"label": "D", "text": "To imprison the debtor for non-payment."},
                    {"label": "E", "text": "To attach their future earnings."}
                ],
                "correct_answer": "C",
                "explanation": "Bankruptcy is a collective enforcement procedure. The primary aim is to have a trustee appointed to realise the debtor's assets and distribute the proceeds fairly among all proven creditors.",
                "difficulty": "medium"
            },
            {
                "id": 15,
                "title": "",
                "text": "A judgment creditor is considering enforcement against a limited company debtor. Which of the following methods is NOT available against a company?",
                "options": [
                    {"label": "A", "text": "Third Party Debt Order."},
                    {"label": "B", "text": "Writ of Control (against company goods)."},
                    {"label": "C", "text": "Attachment of Earnings Order."},
                    {"label": "D", "text": "Charging Order (against company property)."},
                    {"label": "E", "text": "Winding-up Petition."}
                ],
                "correct_answer": "C",
                "explanation": "An Attachment of Earnings Order is only available against an individual judgment debtor in employment. It cannot be made against a company.",
                "difficulty": "medium"
            },
            {
                "id": 16,
                "title": "",
                "text": "James wins a County Court judgment against Peter for £25,000. Peter has made no payments, and James is unsure whether Peter has assets to satisfy the judgment. James considers applying for an oral examination of the judgment debtor to find out what assets Peter holds. Which statement correctly describes the oral examination procedure?",
                "options": [
                    {"label": "A", "text": "It is a voluntary meeting between the parties with no court involvement"},
                    {"label": "B", "text": "The debtor must attend court and answer questions under oath about their assets"},
                    {"label": "C", "text": "The creditor can seize assets without the debtor attending"},
                    {"label": "D", "text": "The court only allows oral examination if the debtor is a company"},
                    {"label": "E", "text": "Oral examination can be used to enforce judgments outside the UK"}
                ],
                "correct_answer": "B",
                "explanation": "Oral examination is a court-ordered procedure where the judgment debtor must attend court and answer questions under oath regarding assets that could satisfy the judgment.",
                "difficulty": "medium"
            },
            {
                "id": 17,
                "title": "",
                "text": "Sophia has a judgment for £10,000 against Daniel. Daniel has failed to pay despite letters of demand. Sophia considers instructing bailiffs to seize Daniel's goods. Which method of enforcement is most appropriate in this scenario?",
                "options": [
                    {"label": "A", "text": "Charging order"},
                    {"label": "B", "text": "Attachment of earnings"},
                    {"label": "C", "text": "Warrant of control"},
                    {"label": "D", "text": "Oral examination"},
                    {"label": "E", "text": "Third-party debt order"}
                ],
                "correct_answer": "C",
                "explanation": "A warrant of control (formerly warrant of execution) allows bailiffs to seize and sell a debtor’s goods to satisfy a money judgment.",
                "difficulty": "medium"
            }
        ]
        print("-> Patched Dispute Resolution Section L with 17 new questions")
        
        # Update Dispute Resolution total: 219 questions
        dispute_topic["question_count"] = sum(a["question_count"] for a in dispute_topic["areas"])
        print(f"-> Updated Dispute Resolution total: {dispute_topic['question_count']} questions")

        # =====================================================
        # Patch Professional Ethics Section A - Principles
        # =====================================================
        ethics_topic = next((t for t in flk1["topics"] if "PROFESSIONAL ETHICS" in t["name"]), None)
        if ethics_topic:
            # Check if Area A already exists
            area_a = next((a for a in ethics_topic["areas"] if a["letter"] == "A"), None)
            if area_a:
                area_a["name"] = "THE SRA PRINCIPLES AND FUNDAMENTAL OBLIGATIONS"
                area_a["slug"] = "a-the-sra-principles-and-fundamental-obligations"
                area_a["question_count"] = 20
            else:
                area_a = {
                    "letter": "A",
                    "name": "THE SRA PRINCIPLES AND FUNDAMENTAL OBLIGATIONS",
                    "slug": "a-the-sra-principles-and-fundamental-obligations",
                    "question_count": 20,
                    "questions": []
                }
                ethics_topic["areas"].insert(0, area_a)
            
            area_a["questions"] = [
                {
                    "id": 1,
                    "title": "",
                    "text": "Fatima is a solicitor acting for Kareem in an asylum claim. During a privileged consultation, Kareem confesses that he has given Fatima a completely false identity and nationality, and that he was previously deported for a serious violent crime. He insists this information is confidential and instructs Fatima to continue his case based on the false narrative. Fatima knows that to proceed would involve submitting false statements to the Tribunal.\nWhich of the following is the most important ethical principle that Fatima must prioritise in deciding how to act?",
                    "options": [
                        {"label": "A", "text": "Acting in the best interests of her client."},
                        {"label": "B", "text": "Upholding public trust and confidence in the profession."},
                        {"label": "C", "text": "Upholding the rule of law and the proper administration of justice."},
                        {"label": "D", "text": "Maintaining client confidentiality."},
                        {"label": "E", "text": "Acting with honesty."}
                    ],
                    "correct_answer": "C",
                    "explanation": "Principle 1 – the duty to uphold the rule of law and the proper administration of justice, is the solicitor’s paramount duty. It overrides all other duties when in conflict. Fatima cannot be a party to misleading a court or tribunal, which is a fraud on the administration of justice. She must cease acting and likely withdraw in a way that alerts the tribunal to the issue without necessarily breaching confidentiality.",
                    "difficulty": "hard"
                },
                {
                    "id": 2,
                    "title": "",
                    "text": "Ben, a respected commercial property partner, is convicted of drink-driving after a colleague’s wedding. He receives a fine and a 12-month driving ban. The incident is reported in the local newspaper. Ben is deeply embarrassed and believes it is a purely private matter unrelated to his professional competence.\nWhat is Ben’s most immediate professional obligation following his conviction?",
                    "options": [
                        {"label": "A", "text": "To inform his firm’s senior partner confidentially."},
                        {"label": "B", "text": "To report the conviction to the Solicitors Regulation Authority (SRA)."},
                        {"label": "C", "text": "To issue a public apology to uphold the profession’s reputation."},
                        {"label": "D", "text": "To take a leave of absence until the matter is resolved."},
                        {"label": "E", "text": "No specific professional obligation arises from a private motoring offence."}
                    ],
                    "correct_answer": "B",
                    "explanation": "Solicitors have a clear duty (under the SRA Code) to report to the regulator any criminal conviction, regardless of whether it is work-related. This is because Principle 2 requires upholding public trust, and off-duty conduct can impact the reputation of the profession. The SRA will assess whether the conviction affects his fitness to practise.",
                    "difficulty": "medium"
                },
                {
                    "id": 3,
                    "title": "",
                    "text": "Liam is negotiating a settlement for his client, Mr. Jones. The opposing solicitor, who is newly qualified, emails a draft settlement agreement that mistakenly states a settlement figure of £100,000 instead of the agreed £10,000. Mr. Jones sees the error and excitedly tells Liam to sign and return the agreement immediately “before they spot it.”\nWhat is Liam’s professional duty in this situation?",
                    "options": [
                        {"label": "A", "text": "To follow his client’s clear instruction to sign the agreement promptly."},
                        {"label": "B", "text": "To sign the agreement, as it is the opposing solicitor’s error and a binding contract may be formed."},
                        {"label": "C", "text": "To delay signing while seeking further instructions from his client on whether to exploit the error."},
                        {"label": "D", "text": "To point out the obvious error to the opposing solicitor before proceeding."},
                        {"label": "E", "text": "To withdraw from acting due to a conflict between his duty to the client and his personal ethics."}
                    ],
                    "correct_answer": "D",
                    "explanation": "This is a classic test of integrity (Principle 4), which goes beyond mere honesty. It requires fair dealing and not taking unfair advantage of another’s obvious mistake. Liam must point out the error, as to do otherwise would be sharp practice, undermining trust in the profession.",
                    "difficulty": "medium"
                },
                {
                    "id": 4,
                    "title": "",
                    "text": "Mary is acting for Felicity in a divorce. Felicity’s father is paying the legal fees and insists on sitting in on all meetings. He is very aggressive and demands that Mary pursue an extremely hostile litigation strategy against Felicity’s husband, which Mary believes is emotionally damaging to Felicity and will waste matrimonial assets on costs.\nWhich SRA Principle is most directly engaged by the father’s influence over the retainer?",
                    "options": [
                        {"label": "A", "text": "Providing a proper standard of service."},
                        {"label": "B", "text": "Acting with independence."},
                        {"label": "C", "text": "Upholding public trust and confidence."},
                        {"label": "D", "text": "Acting in the best interests of the client."},
                        {"label": "E", "text": "Behaving in a way that promotes equality, diversity, and inclusion."}
                    ],
                    "correct_answer": "B",
                    "explanation": "Principle 8 (Independence) requires a solicitor’s professional judgement to be free from improper influence by third parties, including fee-payers. Mary must ensure her advice is objective and that instructions come from Felicity, not her father.",
                    "difficulty": "medium"
                },
                {
                    "id": 5,
                    "title": "",
                    "text": "Sophie, a junior solicitor, is preparing a complex court application. She is under significant time pressure from a demanding partner. She comes across a Court of Appeal authority that is directly on point but undermines her client’s legal argument. The opposing side has not cited it. Sophie considers omitting it from her submissions, believing the busy judge might not find it.\nWhat is Sophie’s ethical duty regarding this legal authority?",
                    "options": [
                        {"label": "A", "text": "To omit it, as her duty is to present her client’s case as favourably as possible."},
                        {"label": "B", "text": "To cite it but attempt to distinguish it on its facts in her submissions."},
                        {"label": "C", "text": "To disclose it to the court and to the opposing side."},
                        {"label": "D", "text": "To discuss it with the partner and follow their instruction."},
                        {"label": "E", "text": "To withdraw from the case, as she can no longer advance the client’s argument."}
                    ],
                    "correct_answer": "C",
                    "explanation": "This engages the duty of candour to the court, stemming from Principle 1. A solicitor must bring all relevant legal authorities to the court’s attention, whether favourable or not. She must disclose it to the court and the opponent. She can then attempt to distinguish it.",
                    "difficulty": "hard"
                },
                {
                    "id": 6,
                    "title": "",
                    "text": "David, a commercial solicitor, is acting for a developer client who wants to purchase a plot of land. David himself has long been interested in the same plot for a personal investment. He considers making a rival bid for the land in his own name.\nCan David proceed with making a personal bid for the land?",
                    "options": [
                        {"label": "A", "text": "Yes, provided he does not use any of the client’s confidential information."},
                        {"label": "B", "text": "Yes, provided he obtains the client’s informed consent."},
                        {"label": "C", "text": "No, because this is an ‘own interest’ conflict which is virtually impossible to manage."},
                        {"label": "D", "text": "No, but only if his bid would be higher than the client’s."},
                        {"label": "E", "text": "Yes, because his personal finances are separate from his professional role."}
                    ],
                    "correct_answer": "C",
                    "explanation": "This is a clear own interest conflict (SRA Code, Chapter 3). David’s personal interest (acquiring the asset) is directly opposed to his client’s interest (acquiring the same asset). The SRA treats such conflicts as almost always prohibiting acting. Consent is unlikely to be a solution, as he cannot possibly give impartial advice or act in the client’s best interests.",
                    "difficulty": "medium"
                },
                {
                    "id": 7,
                    "title": "",
                    "text": "Aisha runs a high-street law firm. She is asked to act for both the buyer and the seller in a straightforward residential property transaction at an agreed price. Both parties are friends and insist they trust each other and want to save costs by using one solicitor.\nWhat is the most significant ethical risk if Aisha accepts these joint instructions?",
                    "options": [
                        {"label": "A", "text": "She will have to do twice the work for a reduced fee."},
                        {"label": "B", "text": "There is a significant risk that a conflict of interest will arise between the two clients."},
                        {"label": "C", "text": "She will be unable to comply with money laundering regulations for both parties."},
                        {"label": "D", "text": "She will breach her duty to provide a proper standard of service due to the workload."},
                        {"label": "E", "text": "She will be unable to issue a single client care letter."}
                    ],
                    "correct_answer": "B",
                    "explanation": "Acting for both parties in a transaction is a classic client-client conflict risk. Even if they are friendly now, their interests are inherently different (e.g., on title issues, delays, chattels). If a dispute arises, she cannot act for either. The SRA Code generally prohibits this unless strict exceptions (substantially common interest) apply, which they do not here.",
                    "difficulty": "medium"
                },
                {
                    "id": 8,
                    "title": "",
                    "text": "Chloe is advising an elderly client, Eleanor, who wishes to change her will to disinherit her daughter. Eleanor is sometimes confused, forgets her daughter’s name, and cannot recall the value of her estate. Chloe is concerned about Eleanor’s capacity to give instructions.\nWhat is Chloe’s primary ethical duty in this situation?",
                    "options": [
                        {"label": "A", "text": "To follow Eleanor’s instructions promptly to give effect to her wishes."},
                        {"label": "B", "text": "To prepare the will but add a clause stating that Eleanor’s capacity has been questioned."},
                        {"label": "C", "text": "To assess Eleanor’s capacity and, if in doubt, seek a medical opinion before acting."},
                        {"label": "D", "text": "To contact Eleanor’s daughter to verify the family situation."},
                        {"label": "E", "text": "To refuse to act, as any risk means she cannot proceed."}
                    ],
                    "correct_answer": "C",
                    "explanation": "A solicitor must only take instructions from a client with the necessary mental capacity. This is part of acting in the client’s best interests (Principle 5/7) and providing a proper standard of service (Principle 6). Chloe has a duty to assess capacity and, where there are signs of impairment, to take steps (like a medical report) to ensure the client has capacity for the specific transaction.",
                    "difficulty": "hard"
                },
                {
                    "id": 9,
                    "title": "",
                    "text": "Fatima’s law firm acts for a large corporate client, Stable Ltd. Stable Ltd. now wants to sue a former director, Mr. Jones, for breach of fiduciary duty. Mr. Jones is also a client of Fatima’s firm for an unrelated personal tax matter.\nWhat is the nature of the conflict of interest that arises?",
                    "options": [
                        {"label": "A", "text": "An ‘own interest’ conflict for Fatima."},
                        {"label": "B", "text": "A conflict between Fatima’s duty to the court and her duty to Stable Ltd."},
                        {"label": "C", "text": "A client-client conflict between Stable Ltd. and Mr. Jones."},
                        {"label": "D", "text": "A conflict due to Fatima’s personal relationship with Mr. Jones."},
                        {"label": "E", "text": "No conflict arises because the matters are unrelated."}
                    ],
                    "correct_answer": "C",
                    "explanation": "The firm owes duties to two current clients (Stable Ltd. and Mr. Jones) whose interests are now directly adverse in new litigation. This is a client-client conflict. The firm cannot act for Stable Ltd. against Mr. Jones without his informed consent, which is highly unlikely in a litigation context.",
                    "difficulty": "medium"
                },
                {
                    "id": 10,
                    "title": "",
                    "text": "Ben, a partner, discovers that a senior associate in his firm, Mark, has been making sarcastic and belittling comments about a junior solicitor’s religious attire during team meetings, calling it “unprofessional.” The junior solicitor is visibly upset.\nUnder the SRA Principles, what is Ben’s responsibility in this situation?",
                    "options": [
                        {"label": "A", "text": "To speak privately with Mark and advise him to stop to maintain team harmony."},
                        {"label": "B", "text": "To report Mark’s conduct to the Solicitors Regulation Authority immediately."},
                        {"label": "C", "text": "To challenge the inappropriate behaviour as it undermines equality, diversity, and inclusion."},
                        {"label": "D", "text": "To arrange mediation between Mark and the junior solicitor."},
                        {"label": "E", "text": "To document the incident but take no formal action unless a complaint is made."}
                    ],
                    "correct_answer": "C",
                    "explanation": "Principle 6 requires solicitors to actively promote equality, diversity, and inclusion. This includes challenging prejudice and inappropriate behaviour in the workplace. As a partner, Ben has a responsibility to foster an inclusive environment. Ignoring harassment breaches this positive duty.",
                    "difficulty": "medium"
                },
                {
                    "id": 11,
                    "title": "",
                    "text": "Liam is representing a defendant in a fast-track trial. He tells the District Judge his client has no previous convictions. After the hearing, his client informs him he forgot about a speeding conviction from three years ago.\nWhat must Liam do?",
                    "options": [
                        {"label": "A", "text": "Nothing, as the hearing is over and the mistake was not intentional."},
                        {"label": "B", "text": "Inform his firm’s COLP (Compliance Officer for Legal Practice) for internal review."},
                        {"label": "C", "text": "Correct the mistaken impression given to the court at the earliest opportunity."},
                        {"label": "D", "text": "Advise the client to disclose the conviction if asked about it in the future."},
                        {"label": "E", "text": "File an amended witness statement from the client."}
                    ],
                    "correct_answer": "C",
                    "explanation": "This stems from the duty of candour to the court (Principle 1). If a solicitor (or their client) has inadvertently misled the court, they have a positive duty to correct the record as soon as possible, even if it damages the client’s case.",
                    "difficulty": "medium"
                },
                {
                    "id": 12,
                    "title": "",
                    "text": "Sophia is a salaried solicitor at a firm. Her manager instructs her to bill a client for 10 hours of work on a case where she only spent 6, arguing that the client is wealthy and the firm needs to meet its targets. Sophia is uncomfortable but fears for her job if she refuses.\nWhich SRA Principle is most directly breached by the manager’s instruction?",
                    "options": [
                        {"label": "A", "text": "Acting with independence."},
                        {"label": "B", "text": "Acting with honesty."},
                        {"label": "C", "text": "Protecting client money and assets."},
                        {"label": "D", "text": "Upholding public trust and confidence."},
                        {"label": "E", "text": "Providing a proper standard of service."}
                    ],
                    "correct_answer": "B",
                    "explanation": "The instruction is to submit a false and inflated time record, which is fundamentally dishonest (Principle 3). It is a clear-cut breach.",
                    "difficulty": "easy"
                },
                {
                    "id": 13,
                    "title": "",
                    "text": "David is acting for a vulnerable client with learning disabilities in a housing dispute. The client’s support worker attends meetings and often tries to answer questions on the client’s behalf. David needs to ensure he has proper instructions.\nWhat is the key ethical consideration for David in his dealings with this client?",
                    "options": [
                        {"label": "A", "text": "To always communicate through the support worker for clarity."},
                        {"label": "B", "text": "To ensure the client has capacity and that instructions come from the client, free from undue influence."},
                        {"label": "C", "text": "To act in the best interests of the client as perceived by the support worker."},
                        {"label": "D", "text": "To withdraw, as he cannot get clear instructions."},
                        {"label": "E", "text": "To apply to the Court of Protection for a litigation friend."}
                    ],
                    "correct_answer": "B",
                    "explanation": "This engages integrity (Principle 4) and acting in the client’s best interests. With vulnerable clients, a solicitor must take extra care to ensure the client understands, can give genuine instructions, and is not under undue influence from a third party, even a well-meaning one.",
                    "difficulty": "medium"
                },
                {
                    "id": 14,
                    "title": "",
                    "text": "Fatima discovers that a partner in her firm has been using the client account as a temporary overdraft facility for the office account, moving small sums to cover cash flow and replacing them within days.\nWhat is the most serious professional implication of this practice?",
                    "options": [
                        {"label": "A", "text": "It is a prudent financial management technique."},
                        {"label": "B", "text": "It is a breach of the SRA Accounts Rules and demonstrates a lack of integrity."},
                        {"label": "C", "text": "It is permissible if the money is always paid back."},
                        {"label": "D", "text": "It is a minor technical breach if no client suffers a loss."},
                        {"label": "E", "text": "It is a matter for the firm’s finance director, not a solicitor’s ethical concern."}
                    ],
                    "correct_answer": "B",
                    "explanation": "This is “teeming and lading”, using one client’s money as if it were the firm’s. It is a fundamental breach of the SRA Accounts Rules and shows a serious lack of integrity (Principle 4). Client money must be sacrosanct and never used for office purposes.",
                    "difficulty": "hard"
                },
                {
                    "id": 15,
                    "title": "",
                    "text": "Ben is a commercial solicitor. On his public social media profile, he shares a meme mocking a recent high-profile court decision, calling the judge “out of touch” and the ruling “a joke.” His profile identifies him as a solicitor at his firm.\nWhich SRA Principle is most likely breached by this post?",
                    "options": [
                        {"label": "A", "text": "Acting with honesty."},
                        {"label": "B", "text": "Upholding the constitutional principle of the rule of law."},
                        {"label": "C", "text": "Upholding public trust and confidence in the profession."},
                        {"label": "D", "text": "Acting with independence."},
                        {"label": "E", "text": "Providing a proper standard of service."}
                    ],
                    "correct_answer": "C",
                    "explanation": "Principle 2 requires solicitors to uphold public trust. Publicly disrespecting a judge and a court decision, while identified as a solicitor, undermines confidence in the judiciary and the profession. Such conduct can bring the profession into disrepute.",
                    "difficulty": "medium"
                },
                {
                    "id": 16,
                    "title": "",
                    "text": "Chloe is acting for a buyer, Sarah, in a property purchase. The seller’s survey reveals minor dampness. Sarah is emotionally attached to the house and instructs Chloe to “just get it done” and not to raise any enquiries. Chloe is concerned this is a financial risk for Sarah.\nWhat should Chloe do?",
                    "options": [
                        {"label": "A", "text": "Follow Sarah’s clear instruction to proceed without further enquiry."},
                        {"label": "B", "text": "Refuse to act, as the client is being unreasonable."},
                        {"label": "C", "text": "Act in Sarah’s best interests by advising her to get a specialist damp survey."},
                        {"label": "D", "text": "Proceed but note in the file that the client refused advice."},
                        {"label": "E", "text": "Contact Sarah’s family to warn them of her poor decision."}
                    ],
                    "correct_answer": "C",
                    "explanation": "The duty to act in the client’s best interests (Principle 5/7) requires providing objective advice, even if unwelcome. Chloe must advise on the risks of not investigating the dampness. She cannot simply follow an instruction that is clearly against the client’s best interests.",
                    "difficulty": "medium"
                },
                {
                    "id": 17,
                    "title": "",
                    "text": "A firm’s policy is that all solicitors must work full-time from the office to ensure “collaboration and supervision.” A talented solicitor, Aisha, who is a single parent, requests flexible hours to collect her child from school. The firm refuses, citing the blanket policy.\nWhat is the main risk posed by the firm’s refusal?",
                    "options": [
                        {"label": "A", "text": "A breach of the duty to provide a proper standard of service."},
                        {"label": "B", "text": "An act of direct discrimination against Aisha."},
                        {"label": "C", "text": "A potential case of indirect discrimination if the policy disadvantages people with childcare responsibilities."},
                        {"label": "D", "text": "A breach of the duty to act with integrity."},
                        {"label": "E", "text": "No risk, as firms are entitled to set their own working conditions."}
                    ],
                    "correct_answer": "C",
                    "explanation": "A blanket “full-time office” policy is a Provision, Criterion or Practice (PCP). If it puts people with caring responsibilities (disproportionately women) at a disadvantage, it may be indirect discrimination under the Equality Act 2010 and a breach of Principle 6 (promoting equality) unless it can be objectively justified as a proportionate means to a legitimate aim.",
                    "difficulty": "medium"
                },
                {
                    "id": 18,
                    "title": "",
                    "text": "During a negotiation, Liam receives an offer from the other side that is so low it is clearly based on a miscalculation. His client tells him to accept it immediately before they realise. Liam believes the offer is legally binding if accepted.\nAccording to the SRA Principles, what should Liam do?",
                    "options": [
                        {"label": "A", "text": "Accept the offer as instructed, as it is a binding contract."},
                        {"label": "B", "text": "Accept the offer but inform the other side afterwards of their error."},
                        {"label": "C", "text": "Refuse to accept the offer and point out the obvious error to the other side."},
                        {"label": "D", "text": "Seek an adjournment to take more detailed instructions."},
                        {"label": "E", "text": "Withdraw from acting due to the client’s instruction."}
                    ],
                    "correct_answer": "C",
                    "explanation": "This again tests integrity (Principle 4). A solicitor must not take unfair advantage of an opponent’s obvious mistake. Even if a contract might be formed, doing so would be sharp practice and a breach of ethical duty. He must point out the error.",
                    "difficulty": "medium"
                },
                {
                    "id": 19,
                    "text": "Sophie is acting for a claimant in a personal injury case. Her client confides that he was not wearing his seatbelt at the time of the accident, contrary to his witness statement. He says he will stick to his story in court.\nWhat must Sophie do?",
                    "options": [
                        {"label": "A", "text": "Continue to represent him but not call him as a witness."},
                        {"label": "B", "text": "Advise him of the seriousness of perjury and, if he insists, cease acting."},
                        {"label": "C", "text": "Amend the witness statement to reflect the truth."},
                        {"label": "D", "text": "Inform the court immediately of the discrepancy."},
                        {"label": "E", "text": "Continue to act but warn the client about the risks of being caught."}
                    ],
                    "correct_answer": "B",
                    "explanation": "A solicitor must not knowingly allow the court to be misled (Principle 1). If a client indicates they will give false evidence, the solicitor must advise them strongly against it. If the client insists, the solicitor must cease acting, as continuing would make them complicit in a fraud on the court.",
                    "difficulty": "hard"
                },
                {
                    "id": 20,
                    "title": "",
                    "text": "A firm’s marketing material features photos only of young, white, male solicitors. The firm’s actual workforce is more diverse. A candidate from an ethnic minority background decides not to apply, feeling the firm would not be inclusive.\nWhich SRA Principle has the firm most likely failed to uphold through its marketing?",
                    "options": [
                        {"label": "A", "text": "Acting with honesty."},
                        {"label": "B", "text": "Acting with integrity."},
                        {"label": "C", "text": "Behaving in a way that promotes equality, diversity, and inclusion."},
                        {"label": "D", "text": "Upholding public trust and confidence."},
                        {"label": "E", "text": "Providing a proper standard of service."}
                    ],
                    "correct_answer": "C",
                    "explanation": "Principle 6 requires actively promoting EDI. Marketing that presents a non-diverse image of the firm, whether intentional or not, fails to promote inclusion and can deter a diverse range of candidates and clients. It suggests a lack of active commitment to EDI.",
                    "difficulty": "medium"
                }
            ]
            print("-> Patched Professional Ethics Section A with 20 new questions")
            
            # Update Professional Ethics topic question count
            ethics_topic["question_count"] = sum(a["question_count"] for a in ethics_topic["areas"])
            print(f"-> Updated Professional Ethics total: {ethics_topic['question_count']} questions")

            # =====================================================
            # Patch Professional Ethics Section B - Client Care
            # =====================================================
            area_b = next((a for a in ethics_topic["areas"] if a["letter"] == "B"), None)
            if area_b:
                area_b["name"] = "CLIENT CARE AND THE RETAINER"
                area_b["slug"] = "b-client-care-and-the-retainer"
                area_b["question_count"] = 15
            else:
                area_b = {
                    "letter": "B",
                    "name": "CLIENT CARE AND THE RETAINER",
                    "slug": "b-client-care-and-the-retainer",
                    "question_count": 15,
                    "questions": []
                }
                ethics_topic["areas"].insert(1, area_b)
            
            area_b["questions"] = [
                {
                    "id": 1,
                    "title": "",
                    "text": "Eleanor, an elderly client, instructs Liam, a solicitor, to change her will to disinherit her daughter. During their meetings, Eleanor sometimes forgets her daughter's name and cannot explain the value of her estate. Liam is concerned about her ability to understand the consequences of her instructions.\nWhat is Liam's most appropriate first step?",
                    "options": [
                        {"label": "A", "text": "Proceed to draft the will as instructed, as he must follow the client's wishes."},
                        {"label": "B", "text": "Contact Eleanor's daughter to discuss her mother's mental state."},
                        {"label": "C", "text": "Assess Eleanor's mental capacity for this specific transaction and, if in doubt, seek a medical opinion."},
                        {"label": "D", "text": "Refuse to act immediately, as Eleanor clearly lacks capacity."},
                        {"label": "E", "text": "Draft the will but include a clause stating that Eleanor's capacity was uncertain."}
                    ],
                    "correct_answer": "C",
                    "explanation": "A solicitor must only take instructions from a client with the necessary mental capacity. This is part of establishing a valid retainer and acting in the client's best interests. The first step is an assessment. If there are signs of impairment, obtaining a medical opinion is a standard and prudent step to ensure the client's instructions are valid.",
                    "difficulty": "medium"
                },
                {
                    "id": 2,
                    "title": "",
                    "text": "Mr. Chen, a director of \"Apex Ltd,\" instructs Sophia, a solicitor, in a commercial dispute. Mr. Chen demands that Sophia take a highly aggressive stance that she believes is not in the best interests of Apex Ltd and could expose the company to cost penalties.\nWho is Sophia's client in this matter?",
                    "options": [
                        {"label": "A", "text": "Mr. Chen, as he is the director giving instructions."},
                        {"label": "B", "text": "The shareholders of Apex Ltd."},
                        {"label": "C", "text": "The corporate entity, Apex Ltd."},
                        {"label": "D", "text": "Both Mr. Chen and Apex Ltd. jointly."},
                        {"label": "E", "text": "The board of directors of Apex Ltd. collectively."}
                    ],
                    "correct_answer": "C",
                    "explanation": "When acting for a company, the client is the corporate entity itself, not its directors, shareholders, or employees. Sophia must take instructions from the company's duly authorised individuals (usually the directors) but owes her duty to the company. She must advise on what is in the company's best interests, even if the instructing director disagrees.",
                    "difficulty": "medium"
                },
                {
                    "id": 3,
                    "title": "",
                    "text": "David emails Fatima, a solicitor, detailing a potential employment tribunal claim and asking for her view. Fatima replies with a lengthy email analysing the merits of the claim, suggesting specific legal arguments, and outlining the next steps and deadlines. She does not state she is not acting or send a client care letter.\nWhat is the most likely professional consequence of Fatima's email?",
                    "options": [
                        {"label": "A", "text": "No relationship is formed, as there is no formal agreement."},
                        {"label": "B", "text": "An implied retainer may have been created, imposing full professional duties."},
                        {"label": "C", "text": "Only a duty of confidentiality arises, but not a full retainer."},
                        {"label": "D", "text": "Fatima has provided pro bono advice with no ongoing obligation."},
                        {"label": "E", "text": "A conditional fee agreement (CFA) has been formed by conduct."}
                    ],
                    "correct_answer": "B",
                    "explanation": "A retainer can be formed by conduct. By providing detailed, specific legal advice on a particular matter without clarifying she is not instructed, a court or tribunal may find that a solicitor-client relationship exists. This carries all the attendant duties (confidentiality, acting in best interests, etc.). Solicitors must avoid giving substantive advice without first clarifying the terms of engagement.",
                    "difficulty": "hard"
                },
                {
                    "id": 4,
                    "title": "",
                    "text": "Ben is acting for a buyer, Sarah, in a property purchase. The seller's survey reveals minor dampness. Sarah is emotionally attached to the house and instructs Ben to \"just get it done\" and not to raise any enquiries or seek a further survey.\nWhat must Ben do to comply with his duty to act in Sarah's best interests?",
                    "options": [
                        {"label": "A", "text": "Follow Sarah's clear instruction to proceed without further enquiry."},
                        {"label": "B", "text": "Refuse to act, as the client is being unreasonable."},
                        {"label": "C", "text": "Advise Sarah of the risks of not investigating the dampness and recommend a specialist survey."},
                        {"label": "D", "text": "Proceed but note on file that the client refused advice, limiting his liability."},
                        {"label": "E", "text": "Contact Sarah's lender, as they would want to know about the damp."}
                    ],
                    "correct_answer": "C",
                    "explanation": "The duty to act in the client's best interests (a core fiduciary duty) requires providing objective, competent advice to protect the client's position, even if it is unwelcome. Ben must advise on the potential risks and costs of ignoring the dampness. He cannot blindly follow an instruction that is clearly against her financial interests.",
                    "difficulty": "medium"
                },
                {
                    "id": 5,
                    "title": "",
                    "text": "Chloe is advising her client, David, in a bitter child contact dispute. David confides in Chloe that he is so enraged by a recent court decision that he intends to take the children and disappear overseas, in breach of a court order. He has also made credible threats of violence against his former partner.\nUnder the SRA Code of Conduct, is Chloe permitted to disclose this information?",
                    "options": [
                        {"label": "A", "text": "No, as it is protected by strict legal professional privilege."},
                        {"label": "B", "text": "No, unless she has David's express consent."},
                        {"label": "C", "text": "Yes, she is legally compelled to report it under the Proceeds of Crime Act 2002."},
                        {"label": "D", "text": "Yes, she is permitted to disclose it to prevent a crime likely to result in serious bodily harm."},
                        {"label": "E", "text": "Yes, but only to her firm's Compliance Officer for Legal Practice (COLP)."}
                    ],
                    "correct_answer": "D",
                    "explanation": "The duty of confidentiality has an exception where disclosure is permitted to prevent a client (or third party) from committing a criminal act that the solicitor reasonably believes is likely to result in serious bodily harm. Abduction and threats of violence meet this threshold.",
                    "difficulty": "hard"
                },
                {
                    "id": 6,
                    "title": "",
                    "text": "Ruth, a junior solicitor, discovers that a senior partner, Mark, has been routinely transferring small amounts of client money from the client account to the office account to cover temporary cash-flow shortages, replacing it within days. She reports this to the firm's COLP, who is a close friend of Mark and does nothing.\nWhat is Ruth's professional duty?",
                    "options": [
                        {"label": "A", "text": "Nothing further; she has discharged her duty by reporting internally."},
                        {"label": "B", "text": "Report the serious misconduct directly to the SRA."},
                        {"label": "C", "text": "Confront Mark directly about the breach."},
                        {"label": "D", "text": "Anonymously report the firm to the Legal Ombudsman."},
                        {"label": "E", "text": "Resign, as she cannot work in an environment where misconduct occurs."}
                    ],
                    "correct_answer": "B",
                    "explanation": "The SRA Code imposes a duty to report serious misconduct to the regulator. If internal reporting is ineffective (as it is here because the COLP is involved or inactive), the individual's duty to report to the SRA becomes paramount. Misuse of client money is among the most serious breaches.",
                    "difficulty": "hard"
                },
                {
                    "id": 7,
                    "title": "",
                    "text": "When drafting a Client Care Letter, which of the following is NOT a mandatory piece of information that must be provided to the client under the SRA Code of Conduct?",
                    "options": [
                        {"label": "A", "text": "The identity of the client and the matter."},
                        {"label": "B", "text": "Details of charges, expenses, and how they are calculated."},
                        {"label": "C", "text": "The name and contact details of the Legal Ombudsman."},
                        {"label": "D", "text": "A guaranteed total cost for the matter."},
                        {"label": "E", "text": "Information on the firm's internal complaints procedure."}
                    ],
                    "correct_answer": "D",
                    "explanation": "The SRA Code requires you to give the best possible information about costs, which includes a costs estimate, but it does not require a guaranteed or fixed total cost. Estimates must be updated if they change.",
                    "difficulty": "easy"
                },
                {
                    "id": 8,
                    "title": "",
                    "text": "A law firm uses an external cloud-based provider to store all its client files and emails. The firm remains responsible for ensuring the confidentiality and security of this data.\nWhich of the following best describes the firm's responsibility under the UK GDPR and the duty of confidentiality?",
                    "options": [
                        {"label": "A", "text": "The firm is not responsible, as the provider is a separate data controller."},
                        {"label": "B", "text": "The firm must ensure the provider has appropriate security measures and remains ultimately accountable."},
                        {"label": "C", "text": "The firm must obtain individual consent from every client to use the cloud provider."},
                        {"label": "D", "text": "The firm is only responsible if the provider suffers a data breach."},
                        {"label": "E", "text": "Outsourcing data storage is a breach of the duty of confidentiality."}
                    ],
                    "correct_answer": "B",
                    "explanation": "The firm is the data controller and remains accountable for protecting client confidentiality, even when using a processor (the cloud provider). The SRA Code and UK GDPR require the firm to ensure any third-party provider has appropriate technical and organisational security measures in place.",
                    "difficulty": "medium"
                },
                {
                    "id": 9,
                    "title": "",
                    "text": "Fatima is acting for a seller in a property transaction. The buyer's solicitor requests a copy of a document held by Fatima's client. The client has not consented to its disclosure.\nCan Fatima disclose the document?",
                    "options": [
                        {"label": "A", "text": "Yes, as it is a standard request in conveyancing."},
                        {"label": "B", "text": "Yes, but only if she believes it is in her client's best interests."},
                        {"label": "C", "text": "No, not without the client's express or implied consent."},
                        {"label": "D", "text": "No, unless a court orders the disclosure."},
                        {"label": "E", "text": "Yes, if the document is a matter of public record."}
                    ],
                    "correct_answer": "C",
                    "explanation": "The duty of confidentiality prohibits disclosure of client information without consent or another legal justification. In a transaction, the client's instruction to sell the property implies consent to disclose necessary title documents, but for other documents, express consent should be sought. The scenario states consent has not been given.",
                    "difficulty": "medium"
                },
                {
                    "id": 10,
                    "title": "",
                    "text": "A client pays their solicitor £5,000 \"on account of costs and disbursements.\" According to the SRA Accounts Rules 2019, how must this money be treated when received?",
                    "options": [
                        {"label": "A", "text": "It is office money and can be paid into the firm's office account."},
                        {"label": "B", "text": "It is client money and must be paid promptly into a client account."},
                        {"label": "C", "text": "The solicitor can choose whether to treat it as client or office money."},
                        {"label": "D", "text": "It must be placed in a separate designated deposit account."},
                        {"label": "E", "text": "It can be held as cash if it is below £10,000."}
                    ],
                    "correct_answer": "B",
                    "explanation": "Money received from a client for costs yet to be incurred (an advance payment) is client money. It must be paid promptly into a client account. It only becomes office money when a bill is delivered and the client is notified that the money is now held as office money.",
                    "difficulty": "medium"
                },
                {
                    "id": 11,
                    "title": "",
                    "text": "Liam is negotiating a settlement for a client. The other side's solicitor sends a draft agreement by post. Liam signs it and returns it. Later, his client changes their mind and says they never wanted to settle. Liam claims the client is bound because he had apparent authority to sign.\nIn establishing the retainer, what should Liam have done to avoid this dispute?",
                    "options": [
                        {"label": "A", "text": "Nothing; a solicitor always has apparent authority to settle."},
                        {"label": "B", "text": "Obtained the client's specific written authority to sign the settlement agreement."},
                        {"label": "C", "text": "Ensured the Client Care Letter included a clause granting him blanket authority to settle."},
                        {"label": "D", "text": "Phoned the client to check, but a written record was not necessary."},
                        {"label": "E", "text": "Refused to negotiate a settlement without the client present."}
                    ],
                    "correct_answer": "B",
                    "explanation": "A solicitor's authority to compromise a client's claim is not inherent. To bind the client, the solicitor must have express authority. Best practice (and often a requirement) is to obtain clear, written instructions from the client to accept specific terms. This is part of taking proper instructions and acting in the client's best interests.",
                    "difficulty": "medium"
                },
                {
                    "id": 12,
                    "title": "",
                    "text": "A client makes a complaint about their solicitor's service. The firm's internal complaints handler investigates and sends a final written response, but the client remains dissatisfied.\nWhat must the firm have already provided to the client regarding the next step?",
                    "options": [
                        {"label": "A", "text": "A copy of the SRA's enforcement procedures."},
                        {"label": "B", "text": "Information about their right to complain to the Legal Ombudsman, including time limits and contact details."},
                        {"label": "C", "text": "A recommendation to seek independent legal advice for a negligence claim."},
                        {"label": "D", "text": "An offer of financial compensation to settle the complaint."},
                        {"label": "E", "text": "Details of how to apply to the Solicitors Disciplinary Tribunal (SDT)."}
                    ],
                    "correct_answer": "B",
                    "explanation": "The SRA Code mandates that clients must be informed about their right to complain to the Legal Ombudsman, the timeframe for doing so (usually within six months of the firm's final response), and the LeO's contact details. This information must be in the Client Care Letter and reiterated in the final response.",
                    "difficulty": "easy"
                },
                {
                    "id": 13,
                    "title": "",
                    "text": "Sophie, a solicitor, is acting for a claimant in a personal injury case under a Conditional Fee Agreement (CFA). The CFA provides for a \"success fee.\" What must Sophie ensure the client understands?",
                    "options": [
                        {"label": "A", "text": "That the success fee is not recoverable from the opponent."},
                        {"label": "B", "text": "The percentage of the success fee and what happens if they lose (e.g., liability for opponent's costs)."},
                        {"label": "C", "text": "That the success fee is capped at 25% of the damages for personal injury claims."},
                        {"label": "D", "text": "That the success fee is always 100% of the base costs."},
                        {"label": "E", "text": "Both B and C are correct."}
                    ],
                    "correct_answer": "E",
                    "explanation": "CFAs are strictly regulated. The client must receive clear, written explanations of the terms. This includes the success fee percentage (B). For personal injury claims, there is a statutory cap that the success fee cannot exceed 25% of the damages recovered for pain, suffering, and loss of amenity (C). The client must also understand the liability for the opponent's costs if they lose (the 'at-risk' element), which may be covered by After-the-Event (ATE) insurance.",
                    "difficulty": "hard"
                },
                {
                    "id": 14,
                    "title": "",
                    "text": "A firm acts for two large corporate clients, Company A and Company B, who are collaborating on a joint venture. The firms' conflict-checking system flags that another department in the same firm is acting against Company B in an unrelated employment tribunal matter.\nWhat is the most important immediate action?",
                    "options": [
                        {"label": "A", "text": "Nothing, as the matters are unrelated."},
                        {"label": "B", "text": "Establish an information barrier (Chinese Wall) between the two departments."},
                        {"label": "C", "text": "Escalate the issue to the COLP or senior partner for a conflict assessment."},
                        {"label": "D", "text": "Inform Company A of the other case against Company B."},
                        {"label": "E", "text": "Cease acting for Company B in the employment matter immediately."}
                    ],
                    "correct_answer": "C",
                    "explanation": "The firm has a duty to identify and assess conflicts. A system flag must be escalated for proper assessment by a senior person or the COLP. They must determine if there is a conflict (unlikely as the matters are unrelated) or a risk of one, and whether any safeguards are needed.",
                    "difficulty": "medium"
                },
                {
                    "id": 15,
                    "title": "",
                    "text": "When a solicitor's retainer with a client ends, which of the following duties continues indefinitely?",
                    "options": [
                        {"label": "A", "text": "The duty to provide a proper standard of service."},
                        {"label": "B", "text": "The duty to act in the client's best interests."},
                        {"label": "C", "text": "The duty of confidentiality."},
                        {"label": "D", "text": "The duty to keep the client's original documents."},
                        {"label": "E", "text": "The duty to pursue any outstanding legal claims."}
                    ],
                    "correct_answer": "C",
                    "explanation": "The duty of confidentiality is enduring and continues indefinitely after the retainer ends, even after the client's death, unless the client consents to disclosure or another exception applies.",
                    "difficulty": "medium"
                }
            ]
            print("-> Patched Professional Ethics Section B with 15 new questions")
            
            # Update Professional Ethics topic question count
            ethics_topic["question_count"] = sum(a["question_count"] for a in ethics_topic["areas"])
            print(f"-> Updated Professional Ethics total: {ethics_topic['question_count']} questions")

            # =====================================================
            # Patch Professional Ethics Section C - Conflicts of Interest
            # =====================================================
            area_c = next((a for a in ethics_topic["areas"] if a["letter"] == "C"), None)
            if area_c:
                area_c["name"] = "CONFLICTS OF INTEREST"
                area_c["slug"] = "c-conflicts-of-interest"
                area_c["question_count"] = 16
            else:
                area_c = {
                    "letter": "C",
                    "name": "CONFLICTS OF INTEREST",
                    "slug": "c-conflicts-of-interest",
                    "question_count": 16,
                    "questions": []
                }
                ethics_topic["areas"].insert(2, area_c)
            
            area_c["questions"] = [
                {"id": 1, "title": "", "text": "Fatima's law firm is approached by two clients: an employer and an employee, both involved in the same unfair dismissal claim. Each client wishes the firm to represent them in the Employment Tribunal.\nWhat is the fundamental professional barrier to the firm acting for both parties?", "options": [{"label": "A", "text": "The firm will be unable to issue two invoices for the same case."}, {"label": "B", "text": "The firm cannot provide a proper standard of service to two clients simultaneously."}, {"label": "C", "text": "There is an own interest conflict for the solicitor handling the matter."}, {"label": "D", "text": "The clients have a conflict of interest, as their interests are directly adverse."}, {"label": "E", "text": "The Solicitors Regulation Authority prohibits acting in employment tribunal cases."}], "correct_answer": "D", "explanation": "This is a classic client-client conflict of direct adversity.", "difficulty": "medium"},
                {"id": 2, "title": "", "text": "Liam is asked to act for both a husband and wife in drafting the legal documents to set up a joint business venture. The couple are amicable and have aligned goals currently.\nWhy might acting in this situation still be high-risk or prohibited?", "options": [{"label": "A", "text": "The SRA forbids acting for more than one client in a business matter."}, {"label": "B", "text": "The clients are married, which creates a separate conflict under family law."}, {"label": "C", "text": "There is a significant risk that a conflict of interest could arise between them in the future."}, {"label": "D", "text": "The firm will be unable to keep confidential information from one spouse secret from the other."}, {"label": "E", "text": "It is an 'own interest' conflict because the solicitor may invest in the business."}], "correct_answer": "C", "explanation": "This is a classic significant risk of a conflict scenario.", "difficulty": "medium"},
                {"id": 3, "title": "", "text": "Two companies, Company A and Company B, are jointly accused of infringing a patent. They wish to instruct the same firm to defend the claim.\nUnder what condition MIGHT the firm be able to act for both companies?", "options": [{"label": "A", "text": "If the companies are subsidiaries of the same parent group."}, {"label": "B", "text": "If the clients have a substantially common interest in relation to the matter."}, {"label": "C", "text": "If the firm uses different fee-earners for each client."}, {"label": "D", "text": "If the total legal fees are discounted."}, {"label": "E", "text": "If the court gives permission for joint representation."}], "correct_answer": "B", "explanation": "This is a key exception in the SRA Code for substantially common interest.", "difficulty": "medium"},
                {"id": 4, "title": "", "text": "A firm is asked to act for five separate farmers who are all bidding on different lots at the same public auction.\nWhat must the firm ensure to potentially act for all five bidders?", "options": [{"label": "A", "text": "That the clients are bidding on different lots."}, {"label": "B", "text": "That there is no other conflict and that all clients give their informed consent in writing."}, {"label": "C", "text": "That the firm charges a lower success fee."}, {"label": "D", "text": "That the firm does not disclose any client's maximum bid."}, {"label": "E", "text": "That the auction is conducted online."}], "correct_answer": "B", "explanation": "Written informed consent is crucial for competing clients.", "difficulty": "hard"},
                {"id": 5, "title": "", "text": "Sophia acts for Stable Ltd. Stable Ltd. now wants to sue Mr. Jones, who is also a client of the firm for an unrelated tax matter.\nWhy is it highly unlikely the firm can act for Stable Ltd. against Mr. Jones?", "options": [{"label": "A", "text": "Because the firm would have to breach confidentiality towards Mr. Jones."}, {"label": "B", "text": "Because the firm cannot act against a current client in litigation."}, {"label": "C", "text": "Because the legal fees would be too high."}, {"label": "D", "text": "Because Mr. Jones would never give his consent."}, {"label": "E", "text": "Because it would be an own interest conflict for Sophia."}], "correct_answer": "B", "explanation": "The firm owes duties of loyalty to current client Mr. Jones.", "difficulty": "medium"},
                {"id": 6, "title": "", "text": "When seeking to rely on the 'informed consent' exception to a conflict, what must a solicitor ensure?", "options": [{"label": "A", "text": "That the client is told there is a conflict and signs a standard form."}, {"label": "B", "text": "That all affected clients are provided with all relevant information and give their consent freely in writing."}, {"label": "C", "text": "That the solicitor believes the clients are sophisticated enough to understand."}, {"label": "D", "text": "That the consent is obtained after the work has begun."}, {"label": "E", "text": "That the firm's senior partner approves the consent."}], "correct_answer": "B", "explanation": "Informed consent requires full explanation and written consent.", "difficulty": "medium"},
                {"id": 7, "title": "", "text": "A firm acted for Mr. X in a dispute two years ago. A new client, Company Y, now wants to bring a claim against Mr. X.\nWhat is the primary risk the firm must consider?", "options": [{"label": "A", "text": "The risk of an own interest conflict."}, {"label": "B", "text": "The risk of breaching confidentiality by using Mr. X's confidential information."}, {"label": "C", "text": "The risk that Mr. X will not pay his old bill."}, {"label": "D", "text": "The risk that advice to Company Y will be less vigorous."}, {"label": "E", "text": "The risk of a conflict between the two fee-earners involved."}], "correct_answer": "B", "explanation": "The duty of confidentiality continues indefinitely for former clients.", "difficulty": "medium"},
                {"id": 8, "title": "", "text": "A firm's conflict-checking system flags a potential conflict because a proposed new client's opponent is the cousin of an existing client.\nWhat should the firm do?", "options": [{"label": "A", "text": "Refuse to act for the new client immediately."}, {"label": "B", "text": "Proceed to act, as family relationships do not create professional conflicts."}, {"label": "C", "text": "Escalate for an assessment to see if a conflict or risk of one exists."}, {"label": "D", "text": "Ask the existing client for permission to act against their cousin."}, {"label": "E", "text": "Act for the new client but not bill for the work."}], "correct_answer": "C", "explanation": "The flag should trigger an assessment, not automatic refusal or acceptance.", "difficulty": "medium"},
                {"id": 9, "title": "", "text": "Ben is acting for a seller. The buyer's solicitor, who is a close personal friend, makes a serious error in the draft contract that benefits Ben's client.\nCould this personal relationship create a conflict of interest for Ben?", "options": [{"label": "A", "text": "No, because the conflict is with the opposing solicitor, not the client."}, {"label": "B", "text": "No, because Ben's duty is solely to get the best deal for his client."}, {"label": "C", "text": "Yes, because Ben's desire to maintain his friendship could conflict with his duty to his client."}, {"label": "D", "text": "Yes, but only if the buyer is also Ben's friend."}, {"label": "E", "text": "No, because solicitors are expected to be professional."}], "correct_answer": "C", "explanation": "This is a personal interest conflict (lawyer-client conflict).", "difficulty": "medium"},
                {"id": 10, "title": "", "text": "A large firm's Corporate Department acts for MegaCorp. The Litigation Department is asked to bring a claim against MegaCorp for a new client.\nWhy is this still a problem for the firm?", "options": [{"label": "A", "text": "Because the firm's overhead costs will increase."}, {"label": "B", "text": "Because the firm cannot allocate resources fairly between departments."}, {"label": "C", "text": "Because the firm as a whole owes the duty of confidentiality to MegaCorp."}, {"label": "D", "text": "Because the Private Client department might also have connections to MegaCorp."}, {"label": "E", "text": "It is not a problem; different departments are treated as separate firms."}], "correct_answer": "C", "explanation": "The SRA regulates firms, not just individual solicitors.", "difficulty": "medium"},
                {"id": 11, "title": "", "text": "When conducting a conflict check, what is the best practice for search criteria in the firm's database?", "options": [{"label": "A", "text": "Search only for the exact names of the new potential clients."}, {"label": "B", "text": "Search for client names, related parties (directors, subsidiaries), and the subject matter."}, {"label": "C", "text": "Search only for the names of the opposing parties provided by the client."}, {"label": "D", "text": "Search only for matters that are currently open, not closed files."}, {"label": "E", "text": "Delegate the search to an intern to save time."}], "correct_answer": "B", "explanation": "Effective conflict checking requires broad search criteria.", "difficulty": "medium"},
                {"id": 12, "title": "", "text": "Fatima identifies a potential conflict at the outset of a new matter. She is unsure whether it is prohibitive or manageable.\nWhat is the correct internal procedure?", "options": [{"label": "A", "text": "She should make a decision herself to avoid delaying the client."}, {"label": "B", "text": "She should ask the potential client if they think it's a problem."}, {"label": "C", "text": "She should refer the matter to a senior partner or the COLP."}, {"label": "D", "text": "She should proceed but at a lower hourly rate to mitigate risk."}, {"label": "E", "text": "She should inform the other affected client and ask for their consent immediately."}], "correct_answer": "C", "explanation": "Firms must have clear escalation procedures for potential conflicts.", "difficulty": "medium"},
                {"id": 13, "title": "", "text": "A solicitor holds £500 worth of shares in a large publicly-traded company. The firm is asked to act for a claimant bringing a minor claim against that company.\nIs this likely to be a disqualifying conflict?", "options": [{"label": "A", "text": "No, because the shareholding is too small to influence the solicitor."}, {"label": "B", "text": "No, because the company is large and won't be affected."}, {"label": "C", "text": "Yes, because any financial interest in a party creates an own interest conflict."}, {"label": "D", "text": "It requires assessment; a trivial personal interest may not be material."}, {"label": "E", "text": "Yes, the solicitor must immediately sell the shares."}], "correct_answer": "D", "explanation": "Not every personal interest creates a material conflict; assessment is required.", "difficulty": "hard"},
                {"id": 14, "title": "", "text": "Liam is asked to act for a client in negotiating a contract with a third party. Liam's spouse is a senior manager at that third party company.\nWhat is the primary concern here?", "options": [{"label": "A", "text": "Liam's spouse might leak confidential information to him."}, {"label": "B", "text": "Liam's independence and judgement might be affected by his personal relationship."}, {"label": "C", "text": "The client will get a better deal because of the family connection."}, {"label": "D", "text": "Liam will have to charge a lower fee due to the complication."}, {"label": "E", "text": "There is no concern, as the spouse is not directly involved."}], "correct_answer": "B", "explanation": "This is a personal interest conflict affecting independence.", "difficulty": "medium"},
                {"id": 15, "title": "", "text": "A firm acted for a husband and wife jointly in their divorce settlement five years ago. The wife now wants the firm to act for her in a new dispute with her ex-husband.\nCan the firm act for the wife?", "options": [{"label": "A", "text": "Yes, because the original matter is concluded."}, {"label": "B", "text": "Yes, but only with the ex-husband's informed consent."}, {"label": "C", "text": "No, because the firm holds confidential information about the ex-husband from the joint retainer."}, {"label": "D", "text": "No, because it would be an own interest conflict."}, {"label": "E", "text": "Yes, if the solicitor who acted originally is no longer at the firm."}], "correct_answer": "C", "explanation": "The firm owes a continuing duty of confidentiality to both parties from the previous joint retainer.", "difficulty": "hard"},
                {"id": 16, "title": "", "text": "A solicitor is representing a client in a mediation. The other party is unrepresented. The solicitor drafts a settlement agreement with an unusual detrimental clause for the unrepresented party.\nWhat conflict-related issue does this raise?", "options": [{"label": "A", "text": "A conflict between the solicitor's duty to the client and duty to the court."}, {"label": "B", "text": "A conflict between the solicitor's duty to the client and duty to act with integrity towards third parties."}, {"label": "C", "text": "An own interest conflict for the solicitor."}, {"label": "D", "text": "A client-client conflict between the two parties."}, {"label": "E", "text": "No conflict, as the unrepresented party should have sought advice."}], "correct_answer": "B", "explanation": "Solicitors have a duty to act with integrity (Principle 4) which includes not taking unfair advantage of third parties.", "difficulty": "medium"}
            ]
            print("-> Patched Professional Ethics Section C with 16 new questions")
            
            # Update Professional Ethics topic question count
            ethics_topic["question_count"] = sum(a["question_count"] for a in ethics_topic["areas"])
            print(f"-> Updated Professional Ethics total: {ethics_topic['question_count']} questions")

        # =====================================================
        # Patch Torts Section A - Negligence
        # =====================================================
        tort_topic = next((t for t in flk1["topics"] if "Tort" in t["name"]), None)
        if tort_topic:
            area_a = next((a for a in tort_topic["areas"] if a["letter"] == "A"), None)
            if area_a:
                area_a["name"] = "NEGLIGENCE"
                area_a["slug"] = "a-negligence"
                area_a["question_count"] = 21
            else:
                area_a = {"letter": "A", "name": "NEGLIGENCE", "slug": "a-negligence", "question_count": 21, "questions": []}
                tort_topic["areas"].insert(0, area_a)
            
            area_a["questions"] = [
                {"id": 1, "title": "", "text": "Maya, a qualified structural surveyor, was hired by Property Ltd to conduct a full structural survey on a Victorian warehouse. Maya's report stated the foundations were 'sound and typical for the period.' Property Ltd purchased the warehouse for £2 million. Severe latent foundation defects were discovered, requiring £750,000 of remedial work. The defects would have been evident to a competent surveyor.\nWhich best describes the duty of care and standard Maya will be held to?", "options": [{"label": "A", "text": "No duty is owed for pure economic loss; Property Ltd's claim is in contract only."}, {"label": "B", "text": "A duty of care is owed, and Maya will be held to the standard of the ordinary, reasonable surveyor."}, {"label": "C", "text": "A duty is owed, but Maya will only be liable if she was grossly negligent."}, {"label": "D", "text": "A duty is not owed because Property Ltd could have obtained its own independent advice."}, {"label": "E", "text": "A duty is owed, but the standard is that of an average person."}], "correct_answer": "B", "explanation": "This falls within an established category of duty: professionals providing advice to a known client for a known purpose. Following Hedley Byrne and Bolam, a professional is held to the standard of the ordinary skilled professional.", "difficulty": "hard"},
                {"id": 2, "title": "", "text": "David, driving negligently, ran a red light and collided with Sarah's car. Sarah suffered a broken wrist. At hospital, Dr. Lee failed to identify a pre-existing infection in Sarah's wrist. The infection worsened due to lack of treatment, leading to septicaemia. Medical evidence states the septicaemia was caused solely by the untreated infection, not the fracture.\nIs David liable for Sarah's septicaemia?", "options": [{"label": "A", "text": "Yes, under the 'material contribution' principle."}, {"label": "B", "text": "Yes, because David's negligence put Sarah in the hospital."}, {"label": "C", "text": "No, because Dr. Lee's negligence breaks the chain of causation."}, {"label": "D", "text": "No, because the septicaemia was caused by a pre-existing condition."}, {"label": "E", "text": "Yes, but David can claim a contribution from Dr. Lee."}], "correct_answer": "C", "explanation": "Dr. Lee's independent, negligent omission is likely a novus actus interveniens that breaks the chain of causation between David's driving and the septicaemia.", "difficulty": "hard"},
                {"id": 3, "title": "", "text": "Liam, a cyclist, was knocked off his bike by Noah's careless driving. Liam had an undiagnosed rare blood condition preventing normal clotting. The minor cut led to catastrophic internal bleeding and brain damage. A normal person would have suffered only a minor graze.\nWhat is the extent of Noah's liability?", "options": [{"label": "A", "text": "Noah is liable only for the minor cut a normal person would have suffered."}, {"label": "B", "text": "Noah is liable for all of Liam's injuries, including the brain damage."}, {"label": "C", "text": "Noah is not liable for the brain damage because it was caused by a pre-existing condition."}, {"label": "D", "text": "Noah is liable for the brain damage only if he knew of Liam's condition."}, {"label": "E", "text": "Noah is liable for half the damages."}], "correct_answer": "B", "explanation": "The 'eggshell skull' rule applies. A tortfeasor must take their victim as they find them and is liable for the full extent of damage even if severity is unforeseeable due to hidden vulnerability.", "difficulty": "medium"},
                {"id": 4, "title": "", "text": "ConstructCo negligently used the wrong valve on a water main, causing it to burst. The flooding damaged nearby homeowners' property and forced closure of DataHub Ltd's data centre (which relied on the water main for cooling), costing £500,000 in lost revenue. DataHub had no contract with ConstructCo.\nWhat is ConstructCo's strongest argument?", "options": [{"label": "A", "text": "ConstructCo owed a duty of care to DataHub as the risk was foreseeable."}, {"label": "B", "text": "ConstructCo is protected by a clause in its contract."}, {"label": "C", "text": "ConstructCo owes no duty of care to DataHub for pure economic loss unaccompanied by physical damage."}, {"label": "D", "text": "DataHub failed to mitigate its loss."}, {"label": "E", "text": "The operative was an independent contractor."}], "correct_answer": "C", "explanation": "Following Spartan Steel, pure economic loss resulting from a negligent act without physical damage to the claimant's property is not recoverable.", "difficulty": "medium"},
                {"id": 5, "title": "", "text": "A train crash caused by RailCo's negligence killed 10 people. Among claimants: (1) Ava, a passenger unharmed but trapped next to a fatally injured stranger; (2) Ben, a train driver from a following train who assisted rescue; (3) Chloe, who saw TV coverage and later learned her brother died.\nWhich claimant(s) meet the secondary victim criteria?", "options": [{"label": "A", "text": "Ava only."}, {"label": "B", "text": "Ben only."}, {"label": "C", "text": "Ava and Ben only."}, {"label": "D", "text": "All three claimants."}, {"label": "E", "text": "None of the claimants."}], "correct_answer": "E", "explanation": "Ava fails (no close tie with victim). Ben fails (rescuer with no relationship to victims). Chloe fails (seeing broadcasts is not perception through unaided senses).", "difficulty": "hard"},
                {"id": 6, "title": "", "text": "A hospital trust engaged CleanCo to deep-clean its operating theatres. CleanCo's employee left a large box of cables in a dimly lit corridor. Nurse Fatima tripped over the box and suffered a serious back injury. Fatima sues the hospital trust.\nWhich represents the trust's strongest defence?", "options": [{"label": "A", "text": "The trust is not liable because CleanCo was an independent contractor."}, {"label": "B", "text": "The trust owed Fatima a non-delegable duty to provide a safe system of work."}, {"label": "C", "text": "The trust is only liable if negligent in selecting CleanCo."}, {"label": "D", "text": "Fatima was contributorily negligent."}, {"label": "E", "text": "CleanCo's employee was the sole tortfeasor."}], "correct_answer": "B", "explanation": "Employers have a primary, non-delegable duty to their employees to provide a safe system of work, extending to risks created by independent contractors.", "difficulty": "medium"},
                {"id": 7, "title": "", "text": "A chess club's secretary, aware that Mr. Reed had a history of aggressive outbursts, failed to monitor his match. Mr. Reed struck his opponent, Mr. Khan, causing injury.\nWhich is the strongest argument against finding a duty of care?", "options": [{"label": "A", "text": "The club had no control over Mr. Reed's actions."}, {"label": "B", "text": "The injury was caused by a deliberate criminal act."}, {"label": "C", "text": "Imposing a duty would burden voluntary organisations."}, {"label": "D", "text": "Mr. Khan voluntarily participated."}, {"label": "E", "text": "The secretary was not personally at fault."}], "correct_answer": "B", "explanation": "There is generally no duty to prevent the deliberate criminal acts of a third party unless a special relationship exists.", "difficulty": "medium"},
                {"id": 8, "title": "", "text": "A Council's inspection noted a crack in a playground slide, recommending repair 'within 3 months.' Due to administrative error, the report was not actioned. Seven months later, 6-year-old Leo uses the slide, it fractures, and he breaks his arm.\nWhat is the main legal hurdle for establishing a duty of care?", "options": [{"label": "A", "text": "The Council owes no duty as a public body acting under statutory power."}, {"label": "B", "text": "The Council may owe a duty, but it is an omission rather than a positive act."}, {"label": "C", "text": "Leo's mother accepted the risk."}, {"label": "D", "text": "The duty is owed and breach is clear."}, {"label": "E", "text": "The Council is protected by statutory immunity."}], "correct_answer": "B", "explanation": "The general rule is no liability for pure omissions. However, by operating a playground and identifying a specific danger, the Council may have assumed responsibility.", "difficulty": "hard"},
                {"id": 9, "title": "", "text": "Zara, aged 30, is severely injured by negligence and rendered paraplegic. She earned £30,000 net per year and would have worked to age 67.\nWhich best describes the approach to quantifying future loss of earnings?", "options": [{"label": "A", "text": "Award £30,000 x 37 years = £1,110,000."}, {"label": "B", "text": "Apply a multiplier from the Ogden Tables based on age, adjusted for contingencies."}, {"label": "C", "text": "Award a nominal sum and order periodic payments."}, {"label": "D", "text": "Award the sum needed to purchase an annuity."}, {"label": "E", "text": "Defer quantification until retirement age."}], "correct_answer": "B", "explanation": "Future pecuniary loss is calculated using a multiplier-multiplicand method with Ogden Tables, adjusted for contingencies of life.", "difficulty": "medium"},
                {"id": 10, "title": "", "text": "BuildMajor hired CraneCo to provide and operate a crane. CraneCo's employee was injured when a latch failed due to a latent manufacturing defect undetectable by routine maintenance. The employee sues BuildMajor.\nWhat is BuildMajor's strongest argument against a non-delegable duty?", "options": [{"label": "A", "text": "BuildMajor is not the employer of the injured man."}, {"label": "B", "text": "The duty was delegated to a competent specialist contractor, and the defect was latent."}, {"label": "C", "text": "BuildMajor is protected by the doctrine of common employment."}, {"label": "D", "text": "The injured employee was contributorily negligent."}, {"label": "E", "text": "BuildMajor owed a non-delegable duty; the defect makes it liable."}], "correct_answer": "B", "explanation": "A non-delegable duty can be discharged by entrusting to a competent contractor where the defect is latent and undiscoverable.", "difficulty": "hard"},
                {"id": 11, "title": "", "text": "Mr. Davies, with unknown severe osteoporosis, was knocked over by a negligent cyclist. The fall would have caused only bruising to a normal person, but Mr. Davies suffered a complex hip fracture.\nWhich principle secures Mr. Davies' recovery for the fracture?", "options": [{"label": "A", "text": "The 'eggshell skull' rule: a tortfeasor takes their victim as they find them."}, {"label": "B", "text": "The principle of foreseeability: only liable for bruising."}, {"label": "C", "text": "Novus actus interveniens: the pre-existing condition breaks causation."}, {"label": "D", "text": "Volenti: Mr. Davies voluntarily assumed the risk."}, {"label": "E", "text": "The 'thin skull' rule applies only to psychiatric conditions."}], "correct_answer": "A", "explanation": "The eggshell skull rule means the defendant is liable for the full consequences, even if unexpectedly severe due to hidden vulnerability.", "difficulty": "medium"},
                {"id": 12, "title": "", "text": "Mr. Khan was killed in an accident caused solely by Mr. Jones's negligence. His wife (who did not work), 10-year-old son, and elderly mother (to whom he gave £200 weekly) survive him.\nWho can claim as a 'dependant' under the Fatal Accidents Act 1976?", "options": [{"label": "A", "text": "Only the wife and son."}, {"label": "B", "text": "The wife, son, and mother, as all were financially dependent."}, {"label": "C", "text": "Only the wife."}, {"label": "D", "text": "The wife and mother only."}, {"label": "E", "text": "The estate alone."}], "correct_answer": "B", "explanation": "Under the Fatal Accidents Act 1976, a wide range of dependants can claim, including a spouse, children, and any parent being financially supported.", "difficulty": "medium"},
                {"id": 13, "title": "", "text": "A surgeon chose Technique A (a recognised technique with slightly higher risk of a rare complication) from two accepted techniques. The complication materialised. The patient argues Technique B should have been used.\nWhat is the likely outcome regarding breach?", "options": [{"label": "A", "text": "The surgeon is in breach for not choosing the objectively safer technique."}, {"label": "B", "text": "The surgeon is not in breach if Technique A is supported by a responsible body of professional opinion."}, {"label": "C", "text": "The surgeon is in breach only if reckless."}, {"label": "D", "text": "The surgeon is not in breach as a patient cannot dictate technique."}, {"label": "E", "text": "The surgeon is in breach because the court prefers lower-risk options."}], "correct_answer": "B", "explanation": "The Bolam test: a professional is not negligent if acting in accordance with a practice accepted by a responsible body of peers.", "difficulty": "medium"},
                {"id": 14, "title": "", "text": "A utility company negligently severed a fibre optic cable serving only DataFarm Ltd, causing a 24-hour outage and £100,000 lost revenue. DataFarm had no contract with the utility company.\nCan DataFarm recover its loss?", "options": [{"label": "A", "text": "Yes, because the damage was foreseeable."}, {"label": "B", "text": "No, this is pure economic loss without physical damage to DataFarm's property."}, {"label": "C", "text": "Yes, because a duty is owed to all foreseeable users."}, {"label": "D", "text": "No, unless the utility company acted intentionally."}, {"label": "E", "text": "Yes, but only if DataFarm had a contract with Telecom Co."}], "correct_answer": "B", "explanation": "The rule from Spartan Steel is that negligence causing physical damage to a third party's property which causes pure economic loss to another is not recoverable.", "difficulty": "medium"},
                {"id": 15, "title": "", "text": "An accountant prepared audited accounts for Company A, told the accounts were needed to secure a loan from Bank B. The accountant negligently overstated assets. Bank B made a loan which was not repaid.\nWhich principle determines if a duty is owed?", "options": [{"label": "A", "text": "Whether the accountant was in a contractual relationship with Bank B."}, {"label": "B", "text": "Whether the accountant assumed responsibility to Bank B, and Bank B relied on it."}, {"label": "C", "text": "Whether the loss was purely economic."}, {"label": "D", "text": "Whether the accountant acted fraudulently."}, {"label": "E", "text": "Whether the Bank could have conducted due diligence."}], "correct_answer": "B", "explanation": "For negligent misstatement, a duty arises from a 'special relationship' where the defendant assumes responsibility and the claimant reasonably relies.", "difficulty": "medium"},
                {"id": 16, "title": "", "text": "A factory worker was trapped for 30 minutes during a machinery malfunction. He genuinely and reasonably believed he was about to be crushed. He was physically unharmed but developed severe PTSD.\nHow is he best classified?", "options": [{"label": "A", "text": "A secondary victim, as he suffered no physical injury."}, {"label": "B", "text": "Not a claimant, as psychiatric injury alone is never recoverable."}, {"label": "C", "text": "A primary victim, as he was within the zone of physical danger and feared for his own safety."}, {"label": "D", "text": "A secondary victim who can recover as he witnessed his own incident."}, {"label": "E", "text": "A primary victim only if in actual physical peril."}], "correct_answer": "C", "explanation": "A primary victim is someone directly involved, either physically injured or in reasonable fear for their own safety (Page v Smith).", "difficulty": "medium"},
                {"id": 17, "title": "", "text": "A man negligently crashed his car. His wife heard the crash from 100 metres away, ran to the scene, and arrived 8 minutes later to find her husband conscious but badly injured. She developed pathological grief reaction.\nDoes she satisfy the immediate aftermath test?", "options": [{"label": "A", "text": "No, because she did not witness the accident itself."}, {"label": "B", "text": "Yes, because she arrived at the scene while her husband was still in a distressed state."}, {"label": "C", "text": "No, because 8 minutes and 100 metres is too remote."}, {"label": "D", "text": "Yes, because as a spouse she is automatically considered a secondary victim."}, {"label": "E", "text": "No, because her shock came from seeing consequences, not the event."}], "correct_answer": "B", "explanation": "The 'immediate aftermath' can extend to seeing victims at the scene shortly after the event (McLoughlin v O'Brian).", "difficulty": "medium"},
                {"id": 18, "title": "", "text": "A shop manager instructed a 17-year-old sales assistant to use a heavy industrial compactor despite knowing the assistant had only been shown a basic demonstration. The assistant's hand was injured.\nWhat is the core issue in establishing breach?", "options": [{"label": "A", "text": "Whether the assistant was contributorily negligent."}, {"label": "B", "text": "Whether providing the machine constituted a safe system of work for an inexperienced employee."}, {"label": "C", "text": "Whether the injury was caused by a latent defect."}, {"label": "D", "text": "Whether the assistant had signed a waiver."}, {"label": "E", "text": "Whether the manager's instruction was a one-off."}], "correct_answer": "B", "explanation": "The employer's duty to provide a safe system of work includes proper training and supervision, especially for inexperienced young employees.", "difficulty": "medium"},
                {"id": 19, "title": "", "text": "A worker developed chronic bronchitis after 20 years in a dusty environment. The condition was caused by exposure from two employers: current employer's negligence (15 years) and a previous employer's negligence (5 years). The disease is indivisible.\nWhich causation principle applies?", "options": [{"label": "A", "text": "The 'but-for' test fails against the current employer."}, {"label": "B", "text": "The current employer is liable in full if their negligence materially contributed to the disease."}, {"label": "C", "text": "Liability is apportioned between the two employers."}, {"label": "D", "text": "The worker must sue both employers jointly."}, {"label": "E", "text": "The disease is divisible, so the worker must prove which employer caused which part."}], "correct_answer": "B", "explanation": "For an indivisible injury where multiple factors materially contributed, a defendant is liable in full if their negligence made a material contribution.", "difficulty": "hard"},
                {"id": 20, "title": "", "text": "A hospital trust engaged a specialist cleaning company. A cleaner left a slippery patch on the floor. A nurse, hurrying to an emergency, slipped and was injured.\nWhat is the trust's strongest argument?", "options": [{"label": "A", "text": "The cleaner was an independent contractor for whom the trust is not vicariously liable."}, {"label": "B", "text": "The nurse was contributorily negligent for hurrying."}, {"label": "C", "text": "The trust discharged its non-delegable duty by appointing a specialist contractor."}, {"label": "D", "text": "The trust is directly liable for failing to check the contractor's work."}, {"label": "E", "text": "The nurse's claim lies solely against the cleaning company."}], "correct_answer": "C", "explanation": "A non-delegable duty can sometimes be discharged by entrusting work to a competent specialist contractor.", "difficulty": "medium"},
                {"id": 21, "title": "", "text": "Mr. Adams was in a minor rear-end collision caused by Ms. Bell's negligence. His classic car was slightly dented. Upon seeing the damage, Mr. Adams (who had a predisposition to anxiety disorders) suffered a severe stress reaction and major depressive episode.\nWhich remoteness principle presents the greatest obstacle?", "options": [{"label": "A", "text": "The 'eggshell skull' rule ensures he is compensated."}, {"label": "B", "text": "He must prove psychiatric injury was a reasonably foreseeable consequence of a minor car accident."}, {"label": "C", "text": "The claim fails because psychiatric injury from property damage is never recoverable."}, {"label": "D", "text": "He must prove Ms. Bell intended to cause him harm."}, {"label": "E", "text": "The claim is only viable if he feared for his own safety."}], "correct_answer": "B", "explanation": "For a secondary victim suffering shock from property damage, they must prove psychiatric injury was reasonably foreseeable. In a minor collision, this is unlikely.", "difficulty": "hard"}
            ]
            print("-> Patched Torts Section A (Negligence) with 21 new questions")
            
            # Update Tort topic question count
            tort_topic["question_count"] = sum(a["question_count"] for a in tort_topic["areas"])
            print(f"-> Updated Torts total: {tort_topic['question_count']} questions")

            # =====================================================
            # Patch Torts Section B - Defences
            # =====================================================
            area_b = next((a for a in tort_topic["areas"] if a["letter"] == "B"), None)
            if area_b:
                area_b["name"] = "DEFENCES"
                area_b["slug"] = "b-defences"
                area_b["question_count"] = 10
            else:
                area_b = {"letter": "B", "name": "DEFENCES", "slug": "b-defences", "question_count": 10, "questions": []}
                tort_topic["areas"].insert(1, area_b)
            
            area_b["questions"] = [
                {"id": 1, "title": "", "text": "Marcus, an experienced amateur boxer, participated in a licensed boxing match. His opponent, Leo, threw a punch after the referee called a break, striking Marcus on the back of the head. This was a clear breach of the rules and Leo was disqualified. Marcus suffered a serious neck injury. Marcus sues Leo. Leo raises volenti non fit injuria.\nWhich best describes the application of the defence?", "options": [{"label": "A", "text": "The defence succeeds because Marcus consented to all physical contact by participating."}, {"label": "B", "text": "The defence fails because Marcus consented to lawful boxing, not to the specific risk of an illegal blow."}, {"label": "C", "text": "The defence succeeds only if Marcus signed a waiver."}, {"label": "D", "text": "The defence fails because volenti is not available for intentional torts."}, {"label": "E", "text": "The defence succeeds because the injury occurred within the sporting environment."}], "correct_answer": "B", "explanation": "Consent in sport is not blanket consent to all injuries, only to those within the inherent risks of the activity as played according to its rules.", "difficulty": "medium"},
                {"id": 2, "title": "", "text": "Priya was driving carefully. Ben, a pedestrian staring at his phone, suddenly stepped onto a crossing against a red light. Priya could not avoid a collision. The judge finds Priya negligent for not anticipating a jaywalker but that Ben's negligence was the primary cause.\nHow is the court likely to apportion liability?", "options": [{"label": "A", "text": "Priya is 100% liable because drivers owe a high standard to pedestrians."}, {"label": "B", "text": "Ben is 100% liable because he crossed against the light."}, {"label": "C", "text": "Ben's damages will be reduced by a percentage to reflect his share of responsibility."}, {"label": "D", "text": "Ben's damages will be reduced by a small percentage (10-20%)."}, {"label": "E", "text": "Contributory negligence is not available because Ben's act was the sole cause."}], "correct_answer": "C", "explanation": "Contributory negligence applies where the claimant's own fault contributed to their damage. Ben's damages will be substantially reduced (typically 60-80%).", "difficulty": "medium"},
                {"id": 3, "title": "", "text": "Dexter and Julian agreed to steal catalytic converters. Julian provided a faulty saw that short-circuited, severely electrocuting Dexter. Dexter sues Julian in negligence. Julian pleads illegality.\nWhat is the likely outcome based on Gray v Thames Trains and Patel v Mirza?", "options": [{"label": "A", "text": "The claim succeeds because the duty exists independently of the illegal venture."}, {"label": "B", "text": "The claim is barred by illegality because it arises from their joint criminal enterprise."}, {"label": "C", "text": "The claim succeeds only if Dexter proves Julian intended harm."}, {"label": "D", "text": "The claim is barred only if it would be an affront to public conscience."}, {"label": "E", "text": "The claim succeeds because illegality only applies to claims for profit."}], "correct_answer": "B", "explanation": "In cases of joint criminal enterprise where injury is sustained committing the crime, courts bar claims. The parties are par delictum.", "difficulty": "hard"},
                {"id": 4, "title": "", "text": "A train derailed due to the rail company's negligence. Off-duty firefighter Anya, a passenger, saw a trapped child and climbed into wreckage despite warnings. An explosion injured her. She sues the rail company.\nHow will volenti be viewed in this rescue scenario?", "options": [{"label": "A", "text": "It succeeds because Anya voluntarily accepted the risk by ignoring warnings."}, {"label": "B", "text": "It fails because the defence does not apply to rescuers."}, {"label": "C", "text": "It fails. A rescuer acting reasonably is not volens to the risk."}, {"label": "D", "text": "It succeeds because Anya was under no duty to act."}, {"label": "E", "text": "It fails only if Anya was acting in her professional capacity."}], "correct_answer": "C", "explanation": "Courts are reluctant to apply volenti to rescuers. A rescuer who acts reasonably to save others is not treated as consenting to the risk (Haynes v Harwood).", "difficulty": "medium"},
                {"id": 5, "title": "", "text": "Rahul was injured when his car was struck by Farid, who was driving negligently. Rahul was not wearing his seat belt. Medical evidence proves his injuries would have been significantly less severe if belted. The judge finds Farid 100% responsible for the accident occurring.\nWhat is the legal consequence of Rahul's failure to wear a seat belt?", "options": [{"label": "A", "text": "It is irrelevant because Farid caused the collision."}, {"label": "B", "text": "It constitutes contributory negligence. Damages will be reduced by a fixed percentage."}, {"label": "C", "text": "It constitutes contributory negligence with a 50% reduction."}, {"label": "D", "text": "It is a complete defence (volenti)."}, {"label": "E", "text": "It is only relevant if Farid proves the failure was the main cause of injuries."}], "correct_answer": "B", "explanation": "Under Froom v Butcher, failure to wear a seat belt is contributory negligence. Standard reductions are 25% or 15% depending on whether injury would have been avoided or reduced.", "difficulty": "medium"},
                {"id": 6, "title": "", "text": "Elena worked on a factory production line. Her employer failed to repair a safety guard despite repeated complaints. Her supervisor said 'If you want to keep your job, use the machine as it is.' Fearing dismissal, Elena continued and was injured. The employer pleads volenti.\nWhich argument best defeats the volenti defence?", "options": [{"label": "A", "text": "Volenti does not apply in employer-employee relationships."}, {"label": "B", "text": "Elena's consent was not truly voluntary due to economic pressure."}, {"label": "C", "text": "The defence fails because it was a breach of statutory duty."}, {"label": "D", "text": "Elena was contributorily negligent so volenti is irrelevant."}, {"label": "E", "text": "The supervisor's instruction was an assumption of risk."}], "correct_answer": "B", "explanation": "Volenti requires free and voluntary consent. Economic pressure or duress can vitiate voluntariness. Threat of dismissal prevents consent from being 'free'.", "difficulty": "medium"},
                {"id": 7, "title": "", "text": "Jake, aged 7, ran after his ball into a quiet street without looking. Mr. Davies, driving slightly above the speed limit, hit Jake. In a negligence claim, Mr. Davies alleges contributory negligence.\nWhat standard is expected of Jake?", "options": [{"label": "A", "text": "The standard of a reasonable child of the same age. The court is likely to find a young child capable of contributory negligence."}, {"label": "B", "text": "The standard of a reasonable child of the same age. The court is unlikely to find a young child capable of contributory negligence."}, {"label": "C", "text": "No standard; children under 10 can never be contributorily negligent."}, {"label": "D", "text": "The standard is whether his parents were negligent."}, {"label": "E", "text": "The standard is subjective, based on what Jake actually understood."}], "correct_answer": "B", "explanation": "The standard for a child is that of a reasonable child of the same age. Courts are very reluctant to find young children guilty of contributory negligence.", "difficulty": "medium"},
                {"id": 8, "title": "", "text": "Maya, a delivery driver, was momentarily using her mobile phone (a breach of traffic regulations) when she was hit by a van that ran a red light. The van driver pleads illegality.\nWhat is the key question for the court?", "options": [{"label": "A", "text": "Whether Maya's crime was serious enough to bar the claim."}, {"label": "B", "text": "Whether the illegality was inextricably linked to the facts of the tort."}, {"label": "C", "text": "Whether Maya intended to break the law."}, {"label": "D", "text": "Whether the van driver also committed a crime."}, {"label": "E", "text": "Whether Maya's crime caused the accident."}], "correct_answer": "B", "explanation": "Under Patel v Mirza, a minor, unrelated regulatory breach with no causal link to the tort is highly unlikely to engage the defence.", "difficulty": "medium"},
                {"id": 9, "title": "", "text": "Lena signed a waiver for an extreme canyoning adventure: 'I accept all inherent risks and waive claims against ThrillSeekers Ltd.' During the activity, the guide negligently failed to check a rope anchor, which failed, causing Lena to fall and be injured.\nWhat is the strongest argument against the defence?", "options": [{"label": "A", "text": "The waiver is an effective exclusion clause barring the claim."}, {"label": "B", "text": "Volenti cannot apply because Lena did not consent to the guide's negligence; she only consented to inherent risks."}, {"label": "C", "text": "The defence succeeds because Lena gave express consent."}, {"label": "D", "text": "UCTA 1977 automatically renders the waiver void for personal injury."}, {"label": "E", "text": "The defence fails because a safety regulation was breached."}], "correct_answer": "B", "explanation": "Volenti requires acceptance of both physical risk and legal risk. A waiver for 'inherent risks' does not constitute consent to injury from negligence.", "difficulty": "hard"},
                {"id": 10, "title": "", "text": "Mr. Andrews bought a ticket to a motorsport event with terms: 'Spectators attend at their own risk. Motorsport is dangerous.' He stood at a high-speed corner behind a safety fence. A car suffered a catastrophic mechanical failure (unrelated to negligence), breached the fence, and struck him.\nWhich is the strongest basis for the volenti defence?", "options": [{"label": "A", "text": "The defence fails because the ticket terms are an unfair contract term."}, {"label": "B", "text": "The defence fails because Mr. Andrews did not consent to organisational negligence."}, {"label": "C", "text": "The defence succeeds. By attending with notice of the risk, he accepted the inherent risks."}, {"label": "D", "text": "The defence fails because the mechanical failure was unexpected."}, {"label": "E", "text": "The defence only succeeds if Mr. Andrews was warned immediately before."}], "correct_answer": "C", "explanation": "Where the accident was caused by an inherent danger (mechanical failure) not organisational negligence, volenti can apply. The ticket terms reinforce acceptance of inherent risks.", "difficulty": "hard"}
            ]
            print("-> Patched Torts Section B (Defences) with 10 new questions")
            
            # Update Tort topic question count
            tort_topic["question_count"] = sum(a["question_count"] for a in tort_topic["areas"])
            print(f"-> Updated Torts total: {tort_topic['question_count']} questions")


            # =====================================================
            # Patch Torts Section C - Vicarious Liability and Occupiers Liability
            # =====================================================
            area_c = next((a for a in tort_topic["areas"] if a["letter"] == "C"), None)
            if area_c:
                area_c["name"] = "VICARIOUS LIABILITY AND OCCUPIERS LIABILITY"
                area_c["slug"] = "c-vicarious-liability-and-occupiers-liability"
                area_c["question_count"] = 15
            else:
                area_c = {"letter": "C", "name": "VICARIOUS LIABILITY AND OCCUPIERS LIABILITY", "slug": "c-vicarious-liability-and-occupiers-liability", "question_count": 15, "questions": []}
                tort_topic["areas"].insert(2, area_c)
            
            area_c["questions"] = [
                {"id": 1, "title": "", "text": "CleanCo Ltd assigns Mr. Ali to clean Widget Ltd's offices. Mr. Ali wears a CleanCo uniform, uses their equipment, is paid hourly with tax/NI deducted, and receives a weekly schedule. While rushing, he negligently overloads a trolley that topples and damages Widget Ltd's prototype machine. Widget Ltd sues CleanCo.\nIs CleanCo vicariously liable?", "options": [{"label": "A", "text": "No, because Mr. Ali was an independent contractor."}, {"label": "B", "text": "Yes, because the relationship exhibits sufficient elements of control to classify Mr. Ali as an employee."}, {"label": "C", "text": "No, because Mr. Ali was on Widget Ltd's premises, making Widget Ltd his temporary employer."}, {"label": "D", "text": "Yes, but only if CleanCo had specifically prohibited rushing."}, {"label": "E", "text": "No, because the act was not closely connected to his authorised duties."}], "correct_answer": "B", "explanation": "Factors like uniform, equipment, wage payment, tax deduction, and task direction point to Mr. Ali being an employee, not an independent contractor.", "difficulty": "medium"},
                {"id": 2, "title": "", "text": "Dave, a security guard for Shield Security, was assigned to patrol a shopping centre. His employer forbade physical confrontation except in cases of imminent threat. Dave saw a teenager scribbling graffiti and grabbed him violently, dislocating his shoulder. The teenager sues Shield Security.\nIs Shield Security vicariously liable?", "options": [{"label": "A", "text": "No, because Dave acted in clear contravention of an express prohibition."}, {"label": "B", "text": "Yes, because Dave's act, though excessive, was inextricably linked to his security duties."}, {"label": "C", "text": "No, because Dave's actions amounted to a criminal assault."}, {"label": "D", "text": "Yes, but only if Shield Security was primarily negligent in training Dave."}, {"label": "E", "text": "No, because the act was not done for the employer's benefit."}], "correct_answer": "B", "explanation": "The modern test asks if the tort was 'closely connected' to the employment. Dave's assault arose from attempting to deal with damage he was employed to prevent (Mohamud v Morris).", "difficulty": "hard"},
                {"id": 3, "title": "", "text": "A local authority engaged BuildRight Ltd, an independent contractor, to repair a footbridge. A BuildRight employee negligently dropped a steel beam, injuring a driver. The driver sues the local authority.\nWhat is the local authority's best defence against vicarious liability?", "options": [{"label": "A", "text": "They are vicariously liable because the operator was effectively their employee."}, {"label": "B", "text": "They are not vicariously liable for an independent contractor's employee, but may be primarily liable if they owed a non-delegable duty."}, {"label": "C", "text": "They are vicariously liable because the work was inherently dangerous."}, {"label": "D", "text": "They are not liable because the contract assigned safety to BuildRight."}, {"label": "E", "text": "They are only liable if negligent in selecting BuildRight."}], "correct_answer": "B", "explanation": "Vicarious liability requires an employer-employee relationship. They may owe a non-delegable duty for extra-hazardous activities on the highway.", "difficulty": "hard"},
                {"id": 4, "title": "", "text": "Eve, a senior investment advisor at Sterling Bank, devised a fraudulent scheme, convincing a client to transfer £100,000 to an account she controlled using her official email and business cards. The client sues Sterling Bank.\nIs the bank vicariously liable for Eve's fraud?", "options": [{"label": "A", "text": "No, because fraud is a personal criminal act."}, {"label": "B", "text": "Yes, because Eve's fraudulent acts were closely connected to her authorised duties."}, {"label": "C", "text": "No, because the bank did not authorise or benefit from the fraud."}, {"label": "D", "text": "Yes, but only if the bank was negligent in supervising Eve."}, {"label": "E", "text": "No, because Eve was acting for her own benefit."}], "correct_answer": "B", "explanation": "Eve used her position, authority, and the trappings of her job to commit the fraud. The key is the close connection to her authorised role (Dubai Aluminium).", "difficulty": "hard"},
                {"id": 5, "title": "", "text": "Sunrise Foster Care Agency placed Ben with foster carers, the Browns, under a contract. Sunrise provided training, supervision, and had power to remove Ben. Mr. Brown abused Ben. Ben sues Sunrise Agency.\nWhat is the key factor in determining vicarious liability?", "options": [{"label": "A", "text": "The Browns were not employees, automatically excluding vicarious liability."}, {"label": "B", "text": "Whether the relationship was sufficiently analogous to employment, considering control and assumption of risk."}, {"label": "C", "text": "Sunrise is only liable if directly negligent in selection or supervision."}, {"label": "D", "text": "Vicarious liability cannot apply because the abuse was a criminal act."}, {"label": "E", "text": "The Browns were independent contractors, so Sunrise cannot be liable."}], "correct_answer": "B", "explanation": "In Armes, the Supreme Court held vicarious liability can apply to relationships 'akin to employment' considering control, integration, and assumption of risk.", "difficulty": "hard"},
                {"id": 6, "title": "", "text": "Tom, a delivery driver, was expressly prohibited from giving lifts. He offered a lift to Maya during his route. He crashed, injuring Maya. The rules handbook stated: 'Employees must never carry passengers.' Maya sues QuickDrop.\nIs QuickDrop vicariously liable?", "options": [{"label": "A", "text": "No, because Tom was on a 'frolic of his own'."}, {"label": "B", "text": "Yes, because the prohibition only relates to the manner of performing an authorised duty."}, {"label": "C", "text": "No, because Maya was a trespasser in the van."}, {"label": "D", "text": "Yes, but only if the prohibition was not adequately communicated."}, {"label": "E", "text": "No, because giving a lift was not for business purposes."}], "correct_answer": "B", "explanation": "An act done in contravention of an express prohibition can still be in the course of employment if it is a wrongful mode of doing an authorised act (Limpus v London General Omnibus).", "difficulty": "medium"},
                {"id": 7, "title": "", "text": "The Rose & Crown pub is owned by BrewMaster Ltd and managed by Mr. Evans under a tenancy. Mr. Evans has day-to-day control; BrewMaster retains inspection rights. A customer slips on a wet floor left unmarked by a bartender.\nWho owes the common duty of care?", "options": [{"label": "A", "text": "Only BrewMaster Ltd, as the freeholder."}, {"label": "B", "text": "Only Mr. Evans, as he has immediate control."}, {"label": "C", "text": "Both BrewMaster Ltd and Mr. Evans, as both exercise sufficient control to be occupiers."}, {"label": "D", "text": "Neither; the bartender is solely liable."}, {"label": "E", "text": "Only BrewMaster Ltd, because they have the right to inspect."}], "correct_answer": "C", "explanation": "Under Wheat v Lacon, there can be more than one occupier. The test is who has a sufficient degree of control over the premises.", "difficulty": "medium"},
                {"id": 8, "title": "", "text": "Mrs. Khan takes her 4-year-old son, Ali, to a council playground. Climbing equipment has a damaged rung (not obviously broken). Ali uses it, the rung gives way, and he breaks his arm.\nWhat standard of care does the council owe Ali under OLA 1957?", "options": [{"label": "A", "text": "The same standard as an adult."}, {"label": "B", "text": "A lower standard, as children should be supervised by parents."}, {"label": "C", "text": "A higher standard, because an occupier must be prepared for children to be less careful than adults."}, {"label": "D", "text": "No duty, because the danger was not obvious and the council had no knowledge."}, {"label": "E", "text": "A duty only if Ali's parent was also negligent."}], "correct_answer": "C", "explanation": "Section 2(3)(a) OLA 1957 states an occupier must be prepared for children to be less careful than adults.", "difficulty": "medium"},
                {"id": 9, "title": "", "text": "A supermarket displays a sign: 'CAUTION: Floor being cleaned. Slippery when wet.' A large, highly slippery soapy patch is left in the aisle. Mr. Jones, reading a product label, walks into the aisle, sees the sign but forgets it, and slips.\nDoes the warning discharge the supermarket's duty under OLA 1957?", "options": [{"label": "A", "text": "Yes, the warning was clear and prominent."}, {"label": "B", "text": "No, because Mr. Jones did not heed the warning."}, {"label": "C", "text": "No, because the warning was not sufficient to enable the visitor to be reasonably safe given the concealed danger."}, {"label": "D", "text": "Yes, but only if the supermarket proves contributory negligence."}, {"label": "E", "text": "No, because the danger was created by employees."}], "correct_answer": "C", "explanation": "Under s.2(4)(a), a warning does not absolve the occupier unless in all circumstances it was enough to enable the visitor to be reasonably safe.", "difficulty": "medium"},
                {"id": 10, "title": "", "text": "A railway line runs through an area where children often play despite frequent fencing repairs and 'Danger' signs. TrackCo is aware of recurring breaches. Jason, aged 12, climbs through a gap and is injured by a passing train.\nUnder OLA 1984, what must Jason prove to establish a duty?", "options": [{"label": "A", "text": "That TrackCo intended to injure him."}, {"label": "B", "text": "That TrackCo was reckless as to whether he would be injured."}, {"label": "C", "text": "That TrackCo owed the common duty of care under the 1957 Act."}, {"label": "D", "text": "That TrackCo knew of the danger, had reason to know he might be in the vicinity, and the risk was one against which protection was reasonable."}, {"label": "E", "text": "That TrackCo had set a trap."}], "correct_answer": "D", "explanation": "Section 1(3) OLA 1984 sets out preconditions: knowing the danger, knowing the trespasser may come into its vicinity, and reasonableness of protection.", "difficulty": "hard"},
                {"id": 11, "title": "", "text": "Adventure Park has a 'freefall jump.' Mr. Clark signed a form acknowledging inherent risks. The harness, which should have been monthly serviced, had not been checked for six months. A worn latch failed, causing injury. Mr. Clark sues under OLA 1957.\nCan Adventure Park rely on volenti as a defence?", "options": [{"label": "A", "text": "Yes, because Mr. Clark signed the form accepting risk."}, {"label": "B", "text": "No, because volenti requires consent to the specific breach of duty, not just to inherent risks."}, {"label": "C", "text": "Yes, because the form effectively excludes liability under s.2(1)."}, {"label": "D", "text": "No, because volenti is abolished by UCTA 1977."}, {"label": "E", "text": "Yes, but only if the risk was an obvious and inherent part of the activity."}], "correct_answer": "B", "explanation": "Volenti requires full, free consent to both physical risk and legal risk from the defendant's negligence. A general waiver for 'inherent risks' does not constitute consent to faulty maintenance.", "difficulty": "hard"},
                {"id": 12, "title": "", "text": "'Blackwood Gorge' is a dangerous ravine on Lord Ainsworth's estate with 'DANGER - KEEP OUT' signs. Teenager Leo ignores the signs, climbs the fence, and falls when loose rock gives way. There is no evidence Lord Ainsworth knew people were climbing that specific rock face.\nCould Leo successfully claim under OLA 1984?", "options": [{"label": "A", "text": "Yes, because the injury resulted from a danger due to the state of the premises."}, {"label": "B", "text": "No, because Lord Ainsworth is not an 'occupier' of undeveloped natural land."}, {"label": "C", "text": "Yes, because Lord Ainsworth was aware of the general danger."}, {"label": "D", "text": "No, because Lord Ainsworth did not have the required knowledge that Leo, or people like him, might be in the vicinity of that precise danger."}, {"label": "E", "text": "No, because Leo was a trespasser to whom no duty is owed."}], "correct_answer": "D", "explanation": "Under OLA 1984, the occupier must know or have reason to believe the trespasser may be in the vicinity of the specific danger. Lack of such knowledge is fatal to the claim.", "difficulty": "hard"},
                {"id": 13, "title": "", "text": "Elena visits 'HyperFix' DIY superstore. An employee creates a temporary obstruction of three unmarked boxes on the floor. Elena, reading product labels, walks backwards and trips, fracturing her wrist. The boxes were there for less than two minutes.\nWhich is the store's most sustainable defence under OLA 1957?", "options": [{"label": "A", "text": "That Elena was a trespasser in the operational area."}, {"label": "B", "text": "That the store owed no duty for temporary obstructions."}, {"label": "C", "text": "That the store had taken reasonable care by training staff; the obstruction was momentary."}, {"label": "D", "text": "That Elena voluntarily accepted the risk by walking backwards."}, {"label": "E", "text": "That the store's warning signs at the entrance exclude liability."}], "correct_answer": "C", "explanation": "The transient, momentary nature of the obstruction (less than two minutes) during necessary operations may show reasonable care was taken.", "difficulty": "medium"},
                {"id": 14, "title": "", "text": "Kael pays £5 to visit 'Ravenscroft Manor' ruins. The leaflet states: 'The Trust excludes all liability for any injury, howsoever caused.' Kael ignores a 'No Access' sign and climbs an unsafe staircase. A rotten step collapses, injuring him.\nIs the Trust likely to rely on the exclusion clause successfully?", "options": [{"label": "A", "text": "Yes, because Kael paid for entry, forming a contract."}, {"label": "B", "text": "No, because liability for death or personal injury from negligence in business cannot be excluded."}, {"label": "C", "text": "Yes, because Kael voluntarily assumed the risk."}, {"label": "D", "text": "No, because reasonable steps were not taken to bring the clause to Kael's attention."}, {"label": "E", "text": "Yes, because the warning sign reinforces the exclusion."}], "correct_answer": "B", "explanation": "UCTA 1977, s.2(1) makes void any clause excluding liability for death or personal injury resulting from negligence in a business context.", "difficulty": "medium"},
                {"id": 15, "title": "", "text": "A hospital trust engaged a specialist cleaning company. A cleaner left a large slippery patch on the floor. A nurse, hurrying to an emergency, slipped and was injured.\nWhat is the trust's strongest argument?", "options": [{"label": "A", "text": "The cleaner was an independent contractor for whom the trust is not vicariously liable."}, {"label": "B", "text": "The nurse was contributorily negligent for hurrying."}, {"label": "C", "text": "The trust discharged its non-delegable duty by appointing a specialist contractor."}, {"label": "D", "text": "The trust is directly liable for failing to check the contractor's work."}, {"label": "E", "text": "The nurse's claim lies solely against the cleaning company."}], "correct_answer": "C", "explanation": "A non-delegable duty can sometimes be discharged by entrusting work to a competent specialist contractor, particularly for collateral negligence in execution.", "difficulty": "medium"}
            ]
            print("-> Patched Torts Section C (Vicarious Liability and Occupiers Liability) with 15 new questions")
            
            # Update Tort topic question count
            tort_topic["question_count"] = sum(a["question_count"] for a in tort_topic["areas"])
            print(f"-> Updated Torts total: {tort_topic['question_count']} questions")

            # =====================================================
            # Patch Torts Section D - Product Liability
            # =====================================================
            area_d = next((a for a in tort_topic["areas"] if a["letter"] == "D"), None)
            if area_d:
                area_d["name"] = "PRODUCT LIABILITY"
                area_d["slug"] = "d-product-liability"
                area_d["question_count"] = 8
            else:
                area_d = {"letter": "D", "name": "PRODUCT LIABILITY", "slug": "d-product-liability", "question_count": 8, "questions": []}
                tort_topic["areas"].insert(3, area_d)
            
            area_d["questions"] = [
                {"id": 1, "title": "", "text": "HopCraft Ltd designs a bottled stout. A bottling company uses glass bottles from a reputable supplier. One bottle has a microscopic weakness undetectable by reasonable quality control. The bottle shatters, injuring Anya. Anya sues HopCraft Ltd in negligence.\nWhich is the strongest argument for HopCraft Ltd?", "options": [{"label": "A", "text": "They owed no duty of care as Anya was not the ultimate consumer."}, {"label": "B", "text": "The defect was in the component and they reasonably relied on a competent contractor."}, {"label": "C", "text": "The defect was a hidden defect which could not have been discovered by reasonable care."}, {"label": "D", "text": "The ultimate consumer was the pub, not Anya."}, {"label": "E", "text": "Liability rests solely with the bottling company."}], "correct_answer": "C", "explanation": "If the defect was latent and undetectable by reasonable means, a manufacturer with a reasonable quality control system may argue they were not negligent.", "difficulty": "hard"},
                {"id": 2, "title": "", "text": "KiddiSafe manufactures a backpack with a removable whistle. The whistle passes safety regulations but is subsequently identified as a choking hazard for children under three. Leo, aged 2, chokes on it, suffering brain damage. His claim is under CPA 1987.\nWhat is the most significant hurdle?", "options": [{"label": "A", "text": "The product complied with statutory safety regulations."}, {"label": "B", "text": "Leo's aunt, not Leo, was the person to whom it was supplied."}, {"label": "C", "text": "The hazard only became known after the product was put into circulation, invoking the development risks defence."}, {"label": "D", "text": "The whistle was removable, so the product was not defective when used as intended."}, {"label": "E", "text": "The choking was caused by Leo's father's failure to supervise."}], "correct_answer": "C", "explanation": "The development risks defence under s.4(1)(e) applies where the state of knowledge at the time was not such that the producer could have discovered the defect.", "difficulty": "hard"},
                {"id": 3, "title": "", "text": "Medix PLC produces a blood-thinning drug with a known 1% risk of bleeding. A later study reveals an unknown risk of ocular degeneration in patients with a specific genetic marker. Ben, who has the marker, develops the eye condition.\nWhat is the company's most likely successful defence in negligence?", "options": [{"label": "A", "text": "Ben voluntarily accepted the risk (volenti)."}, {"label": "B", "text": "The drug was prescription-only, so the duty lay with the doctor."}, {"label": "C", "text": "The company could not have known of the risk given the state of scientific knowledge at the time."}, {"label": "D", "text": "The benefits of the drug outweigh the risk."}, {"label": "E", "text": "The injury was not to 'consumer property'."}], "correct_answer": "C", "explanation": "If the company met the industry standard and the risk was undiscoverable, it may negate breach of duty in negligence.", "difficulty": "hard"},
                {"id": 4, "title": "", "text": "GourmetGrill manufactures a barbecue. The manual states: 'Never use on a wooden deck.' David ignores this and places it on decking. The grill tips due to an uneven board and poorly designed wheel locks, causing a fire.\nIn a CPA 1987 claim for David's garden furniture, which factor is least relevant to determining if the grill was defective?", "options": [{"label": "A", "text": "The clear and prominent warnings in the manual."}, {"label": "B", "text": "The expectations of the average consumer of an electric barbecue."}, {"label": "C", "text": "Compliance with British Standards."}, {"label": "D", "text": "The fact that David used the grill on a wooden deck."}, {"label": "E", "text": "The existence of the design flaw in the wheel locks."}], "correct_answer": "D", "explanation": "David's misuse is relevant to causation and contributory negligence, but the initial question is whether the product itself was defective. The design flaw exists independently.", "difficulty": "hard"},
                {"id": 5, "title": "", "text": "TechGadgets Ltd imports and sells 'PowerMax' branded laptop chargers. They apply their own UK compliance sticker. A design flaw causes a charger to overheat and start a house fire destroying an antique desk worth £25,000. The customer sues under CPA 1987.\nWhich statement is correct regarding TechGadgets Ltd's liability?", "options": [{"label": "A", "text": "They are not liable as they are not the 'producer', only an importer."}, {"label": "B", "text": "They are liable as the own-brander and can be sued as if they were the producer."}, {"label": "C", "text": "They are only liable if negligence on their part can be proven."}, {"label": "D", "text": "Their liability is limited to damage to property intended for private use only."}, {"label": "E", "text": "They have a complete defence because the design flaw is the foreign manufacturer's responsibility."}], "correct_answer": "B", "explanation": "Under s.1(2)(b) CPA 1987, a 'producer' includes own-branders. By putting their brand on the product, TechGadgets Ltd assumes full producer liability.", "difficulty": "medium"},
                {"id": 6, "title": "", "text": "FreshFare sells pre-packaged salads. A batch is contaminated due to a lapse at the vegetable supplier's washing facility. Connor suffers food poisoning and successfully sues FreshFare under CPA 1987. FreshFare has an indemnity contract with the supplier.\nWhat is the most accurate consequence of the indemnity clause?", "options": [{"label": "A", "text": "It provides FreshFare with a defence against Connor's claim."}, {"label": "B", "text": "It allows FreshFare to seek full reimbursement from the supplier."}, {"label": "C", "text": "It is void as an attempt to exclude liability for personal injury."}, {"label": "D", "text": "It means Connor must sue the supplier directly."}, {"label": "E", "text": "It has no effect because liability is several, not joint."}], "correct_answer": "B", "explanation": "An indemnity clause allows FreshFare to seek reimbursement from the supplier after satisfying liability to Connor. It is a separate contractual matter.", "difficulty": "medium"},
                {"id": 7, "title": "", "text": "BuildRight manufactures 'EverGrip' industrial adhesive, working perfectly at 15-25°C. A construction company uses it at 5°C. The adhesive fails, and a panel detaches, destroying a supervisor's car.\nIn a negligence claim, what is the pivotal issue?", "options": [{"label": "A", "text": "Whether the adhesive was 'defective' within the meaning of CPA 1987."}, {"label": "B", "text": "Whether BuildRight owed a duty of care to the supervisor."}, {"label": "C", "text": "Whether BuildRight took reasonable care in design and instruction, given foreseeable uses."}, {"label": "D", "text": "Whether the construction company's misuse was the sole cause of damage."}, {"label": "E", "text": "Whether the damage was to 'consumer property'."}], "correct_answer": "C", "explanation": "The key question is whether BuildRight met the reasonable manufacturer standard. Was using it in cold weather foreseeable, and were warnings adequate?", "difficulty": "medium"},
                {"id": 8, "title": "", "text": "AutoInnovate releases 'SteadyGuide', a driver-assistance system. Due to time pressures, real-world testing in heavy rain was omitted. In a torrential downpour, the sensors malfunction, causing Maya's car to swerve and hit a barrier.\nUnder CPA 1987, what is the core test for determining if SteadyGuide was defective?", "options": [{"label": "A", "text": "Whether AutoInnovate was negligent in omitting rain testing."}, {"label": "B", "text": "Whether the product's safety was below the level the public is entitled to expect."}, {"label": "C", "text": "Whether the product failed to comply with specific regulatory standards."}, {"label": "D", "text": "Whether the benefits of the system outweighed its risks."}, {"label": "E", "text": "Whether the defect existed when the system left AutoInnovate's control."}], "correct_answer": "B", "explanation": "The central test under s.3(1) CPA 1987 is whether the product's safety was below what persons generally are entitled to expect.", "difficulty": "medium"}
            ]
            print("-> Patched Torts Section D (Product Liability) with 8 new questions")
            
            # Update Tort topic question count
            tort_topic["question_count"] = sum(a["question_count"] for a in tort_topic["areas"])
            print(f"-> Updated Torts total: {tort_topic['question_count']} questions")

            # =====================================================
            # Patch Torts Section E - Nuisance
            # =====================================================
            area_e = next((a for a in tort_topic["areas"] if a["letter"] == "E"), None)
            if area_e:
                area_e["name"] = "NUISANCE"
                area_e["slug"] = "e-nuisance"
                area_e["question_count"] = 13
            else:
                area_e = {"letter": "E", "name": "NUISANCE", "slug": "e-nuisance", "question_count": 13, "questions": []}
                tort_topic["areas"].insert(4, area_e)
            
            area_e["questions"] = [
                {"id": 1, "title": "", "text": "Brenda's neighbour, Frank, converts his garage into a carpentry workshop. For ten years, he worked 9 am - 5 pm weekdays. Last year, he intensified operations, now running 7 am - 7 pm daily including weekends with industrial angle grinders. Vibrations rattle Brenda's pictures and aggravate her chronic migraines.\nWhich is the strongest argument in Frank's defence?", "options": [{"label": "A", "text": "Brenda 'came to the nuisance' before the workshop intensified."}, {"label": "B", "text": "Frank's use is reasonable use of his land."}, {"label": "C", "text": "The neighbourhood is mixed, and some noise is expected."}, {"label": "D", "text": "Frank has acquired a prescriptive right through 20 years of operation."}, {"label": "E", "text": "The interference relates to personal injury, not actionable in nuisance."}], "correct_answer": "D", "explanation": "A prescriptive right requires 20 years of actionable nuisance. The original 10 years were lesser interference; the intensification constitutes a new nuisance.", "difficulty": "hard"},
                {"id": 2, "title": "", "text": "A council's historic landfill generates methane gas that migrates underground and explodes in a new housing estate 500 metres away. The developer knew of the old landfill.\nWhich is the most significant obstacle to a Rylands v Fletcher claim?", "options": [{"label": "A", "text": "The homeowners were not owners at the time the waste was deposited."}, {"label": "B", "text": "The gas escaped through natural subterranean pathways."}, {"label": "C", "text": "The use of land as a landfill was a natural use, not a non-natural use."}, {"label": "D", "text": "The escape was due to the act of a third party (the developer)."}, {"label": "E", "text": "The council has statutory immunity for operations under statutory powers."}], "correct_answer": "C", "explanation": "Rylands v Fletcher requires 'non-natural' use. Modern courts are reluctant to find standard waste disposal activities non-natural.", "difficulty": "hard"},
                {"id": 3, "title": "", "text": "Marcus installs a fully compliant home cinema with professional soundproofing. Despite this, very low-frequency bass notes transmit through the party wall into Leah's house, causing persistent, intrusive vibration. Leah cannot relax in her living room.\nWhat is the most relevant legal principle?", "options": [{"label": "A", "text": "The utility of Marcus's conduct outweighs the harm."}, {"label": "B", "text": "Reasonableness between neighbours includes accepting some interference."}, {"label": "C", "text": "Liability is strict if there is interference; Marcus's efforts are irrelevant."}, {"label": "D", "text": "The interference must be judged by its objective effect on ordinary use of Leah's property."}, {"label": "E", "text": "Leah's hypersensitivity is the real cause."}], "correct_answer": "D", "explanation": "The test for private nuisance is objective: whether the interference is unreasonable, judged by its impact on an ordinary person's use of property.", "difficulty": "medium"},
                {"id": 4, "title": "", "text": "A water utility company carries out 24-hour drilling under statutory powers to repair a major sewer main. The statute is silent on liability for nuisance. Residents seek an interim injunction to stop the night-time works.\nWhat is the most likely outcome?", "options": [{"label": "A", "text": "Granted, as statutory powers do not authorise nuisance."}, {"label": "B", "text": "Refused, as courts will not enjoin works under statutory authority."}, {"label": "C", "text": "Granted unless the company proves an emergency."}, {"label": "D", "text": "Refused, but the court will award damages in lieu of an injunction."}, {"label": "E", "text": "Granted, as public interest in residents' sleep outweighs the utility."}], "correct_answer": "D", "explanation": "For public infrastructure projects, courts are reluctant to halt works. The remedy will likely be damages for the temporary nuisance.", "difficulty": "medium"},
                {"id": 5, "title": "", "text": "A logistics company operates a depot with 150+ HGVs daily. The narrow access lane is constantly congested, blocking Olivia (who lives on the lane) from entering or leaving her property. She files a private nuisance claim.\nWhich is the company's strongest defence?", "options": [{"label": "A", "text": "Olivia's claim is for public nuisance, not private nuisance."}, {"label": "B", "text": "The company is making reasonable use of the highway."}, {"label": "C", "text": "Olivia suffers the same inconvenience as all other highway users."}, {"label": "D", "text": "The local planning authority granted permission for the depot."}, {"label": "E", "text": "The congestion is caused by third-party drivers."}], "correct_answer": "A", "explanation": "Obstruction of a public highway is traditionally a matter of public nuisance, not private nuisance.", "difficulty": "medium"},
                {"id": 6, "title": "", "text": "Jake owns a neglected plot. Japanese knotweed spreads from Jake's land onto Nora's garden (she installs a £5,000 root barrier) and onto Liam's property (he takes no action for five years, and then needs £50,000 underpinning).\nWhich defence is most likely to succeed regarding Liam's claim?", "options": [{"label": "A", "text": "Japanese knotweed is natural, so its growth cannot found an action."}, {"label": "B", "text": "Liam failed to mitigate his loss by taking reasonable steps after knowing of the encroachment."}, {"label": "C", "text": "The damage was too remote."}, {"label": "D", "text": "Liability transferred to Liam when he bought the property."}, {"label": "E", "text": "The cost of underpinning is economic loss, not recoverable."}], "correct_answer": "B", "explanation": "A claimant has a duty to mitigate. Liam's five-year inaction could reduce or extinguish damages for losses that could have been avoided.", "difficulty": "hard"},
                {"id": 7, "title": "", "text": "A chemical plant stores chlorine gas. Terrorists breach security and detonate explosives, releasing a toxic cloud. Residents are injured.\nIn a Rylands v Fletcher claim, which defence is most likely to succeed?", "options": [{"label": "A", "text": "Storing industrial chemicals is dangerous."}, {"label": "B", "text": "The escape was due to the unforeseeable act of a stranger."}, {"label": "C", "text": "Residents suffered personal injury, which is not recoverable under Rylands."}, {"label": "D", "text": "The plant was operated with all reasonable care."}, {"label": "E", "text": "The claim is properly one for public nuisance."}], "correct_answer": "B", "explanation": "The act of a stranger is a defence to Rylands v Fletcher if it is the sole, unforeseeable cause of the escape.", "difficulty": "hard"},
                {"id": 8, "title": "", "text": "A cricket club has operated for 25 years adjacent to farmland. A developer buys the field and builds houses 20 metres from the boundary. Three cricket balls land in the first house's garden in the first month, one breaking a window. The homeowner seeks an injunction.\nWhich is the most relevant consideration?", "options": [{"label": "A", "text": "Whether the club has acquired a prescriptive easement to hit cricket balls."}, {"label": "B", "text": "Whether the developer and homeowner came to the nuisance."}, {"label": "C", "text": "Whether granting an injunction would be in the public interest."}, {"label": "D", "text": "Whether the occasional escape of a cricket ball is an unreasonable interference."}, {"label": "E", "text": "Whether damages would be an adequate remedy."}], "correct_answer": "B", "explanation": "'Coming to the nuisance' is a highly material factor when considering the remedy, especially in established activities (Miller v Jackson).", "difficulty": "medium"},
                {"id": 9, "title": "", "text": "A large, ancient oak tree on Keith's land is healthy. During an unprecedented storm with winds not recorded in 100 years, a branch crashes through Sam's roof. Sam sues Keith in nuisance.\nWhat is the most accurate statement of Keith's liability?", "options": [{"label": "A", "text": "He is strictly liable for damage from trees on his land."}, {"label": "B", "text": "He is liable only if he knew or ought to have known the tree or branch was dangerous before the storm."}, {"label": "C", "text": "He is not liable because the damage was caused by an Act of God."}, {"label": "D", "text": "He is liable only if he was negligent in not inspecting the tree."}, {"label": "E", "text": "He is not liable because the tree was a natural feature."}], "correct_answer": "B", "explanation": "For damage from natural features, a landowner is liable only if they knew or ought to have known of the danger and failed to take reasonable steps (Leakey v National Trust).", "difficulty": "hard"},
                {"id": 10, "title": "", "text": "A nightclub generates powerful sub-bass frequencies that transmit through the ground into adjacent luxury flats. Residents cannot sleep. The nightclub uses professional acoustic dampening but elimination is technically impossible.\nIn deciding whether to grant an injunction, what is the least relevant factor?", "options": [{"label": "A", "text": "Whether the nightclub's operations constitute a private nuisance."}, {"label": "B", "text": "The fact that the nightclub was operating before the flats were built."}, {"label": "C", "text": "The social and economic value of the nightclub."}, {"label": "D", "text": "Whether damages would be an adequate remedy."}, {"label": "E", "text": "The terms and conditions of the nightclub's premises licence."}], "correct_answer": "E", "explanation": "Holding a premises licence does not grant immunity from civil liability. The court will make its own independent assessment.", "difficulty": "medium"},
                {"id": 11, "title": "", "text": "An electricity company's high-voltage lines pass over Hamish's farm. The EMF (within safety limits) allegedly causes his dairy cows to become agitated and reduces milk yields. Scientific evidence is inconclusive.\nWhat is the core legal issue the court must determine?", "options": [{"label": "A", "text": "Whether the electricity company acted negligently in routing."}, {"label": "B", "text": "Whether the interference is unreasonable, based on an objective assessment."}, {"label": "C", "text": "Whether the power lines constitute a non-natural use under Rylands."}, {"label": "D", "text": "Whether Hamish's hypersensitivity is the true cause."}, {"label": "E", "text": "Whether statutory authority provides a complete defence."}], "correct_answer": "B", "explanation": "The essence of private nuisance is determining whether there has been an unreasonable interference with the claimant's use of land.", "difficulty": "medium"},
                {"id": 12, "title": "", "text": "A developer buys a warehouse. Before work begins, vandals set it on fire. Smoke drifts across to neighbouring houses for two days, depositing soot and forcing residents indoors. The residents sue the developer.\nWhat is the developer's strongest defence?", "options": [{"label": "A", "text": "The developer was not in occupation at the time."}, {"label": "B", "text": "The fire was started by third-party vandals."}, {"label": "C", "text": "The smoke interference was temporary."}, {"label": "D", "text": "The residents' loss is pure economic loss."}, {"label": "E", "text": "The developer had taken all reasonable security measures."}], "correct_answer": "A", "explanation": "Private nuisance is a tort against the occupier. If the developer had not taken possession, they may not be liable as they were not in control.", "difficulty": "hard"},
                {"id": 13, "title": "", "text": "Gina has a 2-metre hornbeam hedge along her driveway. Neighbour Tom complains it blocks sunlight to his vegetable garden, stunting his crops. He asks her to lower it. She refuses, and Tom sues in private nuisance.\nWhat is the most likely outcome?", "options": [{"label": "A", "text": "Tom will succeed, as a right to light can be acquired for gardens."}, {"label": "B", "text": "Tom will fail, as there is no natural right to light for gardens, and the hedge is on Gina's land."}, {"label": "C", "text": "Tom will succeed if he can prove the hedge is maliciously maintained."}, {"label": "D", "text": "Tom will succeed under Rylands v Fletcher."}, {"label": "E", "text": "Tom will fail, as he can grow different crops."}], "correct_answer": "B", "explanation": "There is no natural right to sunlight over another's land for gardens. Blocking light to a garden is generally not actionable.", "difficulty": "medium"}
            ]
            print("-> Patched Torts Section E (Nuisance) with 13 new questions")
            
            # Update Tort topic question count
            tort_topic["question_count"] = sum(a["question_count"] for a in tort_topic["areas"])
            print(f"-> Updated Torts total: {tort_topic['question_count']} questions")
                
    except Exception as e:
        print(f"Error applying patches: {e}")





def main():
    print("=" * 60)
    print("Practice Questions Parser (Area Organization)")
    print("=" * 60)
    
    courses = parse_all_questions()
    
    # Apply patches before calculating totals/saving
    apply_manual_patches(courses)
    
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
