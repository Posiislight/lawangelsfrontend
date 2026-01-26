import os
import django
import re

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'lawangels.settings')
django.setup()

from quiz.models import QuestionOption

def fix_double_lettering():
    options = QuestionOption.objects.all()
    count = 0
    updated = 0
    
    print("Checking options for double lettering...")
    
    for opt in options:
        original_text = opt.text
        text = original_text.strip()
        
        # Clean up bullets/dots
        text = re.sub(r'^[\s●\-\.]+', '', text).strip()
        
        # Clean up duplicate label (e.g. "A. ")
        # match strictly the start
        text = re.sub(r'^[A-Ea-e][\.\)]\s*', '', text).strip()
        
        if text != original_text:
            print(f"Fixing Q{opt.question.question_number} Option {opt.label}: '{original_text[:30]}...' -> '{text[:30]}...'")
            opt.text = text
            opt.save()
            updated += 1
        count += 1
        
    print(f"Processed {count} options.")
    print(f"Updated {updated} options.")

if __name__ == '__main__':
    fix_double_lettering()
