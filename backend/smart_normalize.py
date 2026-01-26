import re
import os

def smart_normalize(filepath):
    with open(filepath, 'r', encoding='utf-8', errors='replace') as f:
        lines = f.readlines()

    new_lines = []
    
    # We want to identify blocks of options.
    # Pattern for option-like line: starts with A-E, optional dot/paren, space.
    opt_regex = re.compile(r'^([A-E])([.)]?)\s+(.*)', re.IGNORECASE)
    
    i = 0
    while i < len(lines):
        line = lines[i]
        line_stripped = line.strip()
        m = opt_regex.match(line_stripped)
        
        if m:
            # Possible start of options. Check ahead for B, C...
            # We look for a sequence A, B, C... or at least A, B.
            # Letters must be sequential.
            
            letter = m.group(1).upper()
            if letter == 'A':
                # detailed check ahead
                sequence = [i]
                current_letter_ord = ord('A')
                
                # Look ahead
                j = i + 1
                while j < len(lines):
                    next_line = lines[j].strip()
                    if not next_line: 
                        j += 1
                        continue # skip empty lines? (options usually contiguous)
                        # But sometimes space between options?
                        
                    m2 = opt_regex.match(next_line)
                    if m2:
                        next_letter = m2.group(1).upper()
                        expected = chr(current_letter_ord + 1)
                        if next_letter == expected:
                            sequence.append(j)
                            current_letter_ord += 1
                            if next_letter == 'E': # Stop at E usually
                                break
                        else:
                            # Out of sequence or duplicate?
                            break
                    else:
                        break
                    j += 1
                
                # If we found at least A and B, treat as options
                if len(sequence) >= 2:
                    # Transform these lines
                    for idx in sequence:
                        old_l = lines[idx].strip()
                        mm = opt_regex.match(old_l)
                        new_l = f"{mm.group(1).upper()}. {mm.group(3)}\n"
                        # We append to new_lines later? 
                        # No, we can't skip simply.
                        # We need to process sequentially.
                        pass # handled below
                    
                    # We will process them as we iterate.
                    # Just mark them?
                    pass

        # Easier approach:
        # Buffer potential block.
        # If block is valid sequence, flush as fixed.
        # Else flush as original.
        
        m = opt_regex.match(line_stripped)
        if m and m.group(1).upper() == 'A':
            # Start gathering
            block = [(i, line, m)]
            current_ord = ord('A')
            j = i + 1
            while j < len(lines):
                nl = lines[j]
                nls = nl.strip()
                if not nls:
                    block.append((j, nl, None)) # Empty line, keep
                    j += 1
                    continue
                
                m2 = opt_regex.match(nls)
                if m2:
                    if ord(m2.group(1).upper()) == current_ord + 1:
                        block.append((j, nl, m2))
                        current_ord += 1
                    else:
                        break
                else:
                    break
                j += 1
            
            # Analyze block
            # Filter out non-option items (empty lines) to count options
            options_count = sum(1 for x in block if x[2])
            
            if options_count >= 2:
                # Apply fix
                for idx, text, match_obj in block:
                    if match_obj:
                        new_lines.append(f"{match_obj.group(1).upper()}. {match_obj.group(3)}\n")
                    else:
                        new_lines.append(text)
                i = j
                continue
            else:
                # Not a valid block (just "A client" or similar). 
                # Append line i as is
                new_lines.append(line)
                i += 1
                continue
        else:
            new_lines.append(line)
            i += 1

    # Save
    new_filepath = filepath.replace('.txt', '_fixed.txt')
    with open(new_filepath, 'w', encoding='utf-8') as f:
        f.writelines(new_lines)
    print(f"Processed {filepath} -> {new_filepath}")

files = [
    'mock2_flk2_raw.txt',
    'mock3_flk2_raw.txt', 
    'mock3_raw.txt'
]
base_dir = r'c:\Users\adele\lawangelsfrontend\backend\mockexam\txt files'

for fname in files:
    fpath = os.path.join(base_dir, fname)
    if os.path.exists(fpath):
        smart_normalize(fpath)
