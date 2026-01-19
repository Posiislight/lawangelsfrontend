
import os
import django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'lawangels.settings')
django.setup()

from quiz.models import Exam, Question, QuestionOption

def fix_data():
    try:
        exam = Exam.objects.get(title='FLK2 Mock Test 1')
        print(f"Exam found: {exam.title}")
    except Exam.DoesNotExist:
        print("Exam not found!")
        return

    # 1. Insert missing questions Q84-90
    missing_questions = [
        {
            'number': 84,
            'text': 'The firm, in a conveyancing transaction, issues an invoice to a client, Emily, for £5,000 in legal fees. Emily has already transferred money into the client bank account on account of these fees. The firm now applies the funds held on account to settle her invoice. Using double-entry bookkeeping, what is the correct way to record this transaction?',
            'options': {
                'A': 'Debit Client Bank Account £5,000; Credit Client Ledger £5,000',
                'B': 'Debit Client Ledger £5,000; Credit Client Bank Account £5,000',
                'C': 'Debit Office Bank Account £5,000; Credit Client Ledger £5,000',
                'D': 'Debit Client Ledger £5,000; Credit Office Bank Account £5,000',
                'E': 'Debit Profit Costs £5,000; Credit Client Bank Account £5,000'
            },
            'correct': 'B',
            'explanation': 'Liability ↓ Debit Client Ledger; Asset ↓ Credit Client Bank.'
        },
        {
            'number': 85,
            'text': 'Lydia, acting for a buyer, receives an inadvertent confidential strategy note from the seller’s solicitor, revealing the seller would accept a £15,000 reduction. The client instructs her to use this information but hide its source. What must Lydia do?',
            'options': {
                'A': 'Follow instructions; secure the reduction.',
                'B': 'Refuse but advise the client to find another solicitor.',
                'C': 'Notify the opposing solicitor, return or destroy the document.',
                'D': 'Use the information without mentioning the document.',
                'E': 'Withdraw from acting due to a conflict.'
            },
            'correct': 'C',
            'explanation': 'Integrity requires notifying sender and not exploiting mistake (SRA Principle 4).'
        },
        {
            'number': 86,
            'text': 'An elderly client instructs a solicitor to sell her house. Her son, who is her attorney under a Lasting Power of Attorney (Property and Financial Affairs), attends the meeting. He insists the property must be sold quickly and at a lower price than market value to a friend of his. The client seems hesitant but defers to her son. What should the solicitor do?',
            'options': {
                'A': 'Follow the attorney’s instructions as he has legal authority.',
                'B': 'Proceed with the sale as the client appears to agree.',
                'C': 'Exercise independent judgment and act in the client’s best interests, not the attorney’s.',
                'D': 'Report the attorney to the Office of the Public Guardian immediately.',
                'E': 'Withdraw from acting.'
            },
            'correct': 'C',
            'explanation': 'Duty to act in client’s best interests & maintain independence (SRA Principles 5 & 8).'
        },
        {
            'number': 87,
            'text': 'David is a solicitor who also sits on the board of a local property development company. A client, Emma, asks David to act for her in purchasing a plot of land from a developer, which happens to be owned by the company where David is a director. David does not disclose his directorship to Emma but proceeds to act for her. Has David complied with his professional obligations regarding conflicts of interest?',
            'options': {
                'A': 'Yes; his role as a director is unrelated to the transaction, so no conflict arises.',
                'B': 'Yes; conflicts only matter if David benefits personally from the transaction.',
                'C': 'No; acting creates an own conflict of interest.',
                'D': 'No; solicitors may never act for clients in property matters.',
                'E': 'Yes; client consent is assumed unless the conflict is obvious.'
            },
            'correct': 'C',
            'explanation': 'Own interest conflict (SRA Standards).'
        },
        {
            'number': 88,
            'text': 'Olivia, a solicitor, has been asked by her client, Mr. Clarke, to prepare his will. Olivia’s brother is one of the potential beneficiaries under the will. Mr. Clarke explicitly instructs Olivia to include her brother in the inheritance and insists she drafts the will herself. What is the most appropriate course of action for Olivia?',
            'options': {
                'A': 'Accept the instructions and draft the will',
                'B': 'Decline to act',
                'C': 'Draft the will but ensure her brother receives only a small token gift.',
                'D': 'Act for the client after obtaining written consent from the client acknowledging the conflict.',
                'E': 'Ask another solicitor in the firm to approve the draft to resolve the conflict internally.'
            },
            'correct': 'B',
            'explanation': 'Own conflict (close relative beneficiary) – cannot act (SRA Principle 6).'
        },
        {
            'number': 89,
            'text': 'A 78-year-old client asks a solicitor to sell her home and gift the entire proceeds to her grandson, leaving nothing for her own care. The client appears confused, forgets details discussed minutes earlier, and deferred all questions to her grandson during the initial call. She has recently been diagnosed with early-stage dementia. What is the solicitor’s most appropriate initial step?',
            'options': {
                'A': 'Proceed with the transaction as the client has identified the asset and beneficiary.',
                'B': 'Proceed, as capacity is presumed unless proven otherwise.',
                'C': 'Do not proceed at this time; the red flags require further assessment of capacity and undue influence.',
                'D': 'Do not proceed unless the grandson signs a declaration of no influence.',
                'E': 'Refuse to act immediately as dementia automatically invalidates capacity.'
            },
            'correct': 'C',
            'explanation': 'Red flags require further assessment – do not proceed until capacity confirmed.'
        },
        {
            'number': 90,
            'text': 'Richard instructs Victoria, a solicitor, to purchase a property for £320,000. He tells her that he is using £180,000 of cash savings which he has “kept under the mattress” to avoid paying tax on it. He asks her to proceed with the transaction without mentioning the cash source. What must Victoria do?',
            'options': {
                'A': 'Maintain client confidentiality and proceed with the purchase.',
                'B': 'Withdraw from the retainer but say nothing further.',
                'C': 'Make an authorised disclosure to the National Crime Agency (NCA).',
                'D': 'Advise the client to disclose the funds to HMRC voluntarily.',
                'E': 'Report the client to the SRA.'
            },
            'correct': 'C',
            'explanation': 'Criminal property → statutory duty to disclose to NCA (POCA 2002).'
        }
    ]

    print("Inserting missing questions...")
    for q in missing_questions:
        question, created = Question.objects.get_or_create(
            exam=exam,
            question_number=q['number'],
            defaults={
                'text': q['text'],
                'explanation': q['explanation'],
                'topic': 'mixed', # simplified
                'correct_answer': q['correct'],
                'difficulty': 'medium'
            }
        )
        if created:
            print(f"Created Q{q['number']}")
            for label, text in q['options'].items():
                QuestionOption.objects.create(question=question, label=label, text=text)
        else:
            print(f"Q{q['number']} already exists, updating...")
            question.text = q['text']
            question.explanation = q['explanation']
            question.correct_answer = q['correct']
            question.save()
            question.questionoption_set.all().delete()
            for label, text in q['options'].items():
                QuestionOption.objects.create(question=question, label=label, text=text)

    # 2. Fix incorrect answers
    corrections = {
        7: 'C',
        27: 'D',
        29: 'C',
        30: 'D',
        46: 'C'
    }
    
    print("\nCorrecting specific answers...")
    for q_num, correct_ans in corrections.items():
        try:
            q = Question.objects.get(exam=exam, question_number=q_num)
            if q.correct_answer != correct_ans:
                print(f"Correcting Q{q_num}: {q.correct_answer} -> {correct_ans}")
                q.correct_answer = correct_ans
                q.save()
            else:
                print(f"Q{q_num} already correct ({correct_ans})")
        except Question.DoesNotExist:
            print(f"Q{q_num} not found!")

    # Final check
    count = Question.objects.filter(exam=exam).count()
    print(f"\nFinal Count: {count}")
    
fix_data()
