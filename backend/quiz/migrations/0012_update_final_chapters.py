# Migration to add correct chapters for remaining textbooks

from django.db import migrations


def update_final_chapters(apps, schema_editor):
    Textbook = apps.get_model('quiz', 'Textbook')
    
    # Accurate chapter data from actual PDF table of contents
    TEXTBOOK_CHAPTERS = {
        'LAW ANGELS- LEGAL SERVICES.pdf': [
            {'title': "The Solicitors' Regulation Authority and Its Roles", 'page': 18},
            {'title': 'Reserved and Regulated Legal Services', 'page': 27},
            {'title': 'Core Regulatory Obligations', 'page': 35},
            {'title': 'Anti-Money Laundering Regime; Purpose and Scope', 'page': 46},
            {'title': 'AML in Practice: Suspicious Activity Reports', 'page': 63},
            {'title': 'AML Offences, Defences and Due Diligence', 'page': 78},
            {'title': 'Financial Services Regulation', 'page': 94},
            {'title': 'Private Funding and Alternative Fee Structures', 'page': 111},
            {'title': 'Public Funding; Legal Aid', 'page': 120},
            {'title': 'Third-Party and Insurance Funding', 'page': 133},
        ],
        'LAW ANGELS- LEGAL SYSTEM.pdf': [
            {'title': 'Foundations of the Legal System', 'page': 25},
            {'title': 'The Courts of England and Wales', 'page': 57},
            {'title': 'The Judiciary and Court Actors', 'page': 80},
            {'title': 'The Appeal System', 'page': 91},
            {'title': 'The Doctrine of Judicial Precedent', 'page': 100},
            {'title': 'Primary Legislation: The UK Parliament and the Senedd Cymru', 'page': 112},
            {'title': 'Statutory Interpretation; The Traditional Rules', 'page': 131},
            {'title': 'The Modern Approach to Statutory Interpretation', 'page': 143},
            {'title': 'The Application of Law in England and Wales', 'page': 150},
            {'title': 'Other Sources of Law and Institutions', 'page': 157},
        ],
        'LAW ANGELS- TORTS.pdf': [
            {'title': 'Introduction to Tort Law', 'page': 1},
            {'title': 'Negligence - Duty of Care', 'page': 12},
            {'title': 'Negligence - Breach of Duty', 'page': 26},
            {'title': 'Negligence - Causation', 'page': 38},
            {'title': 'Negligence - Remoteness', 'page': 50},
            {'title': 'Psychiatric Harm', 'page': 62},
            {'title': 'Economic Loss', 'page': 74},
            {'title': "Occupiers' Liability", 'page': 86},
            {'title': 'Nuisance', 'page': 98},
            {'title': 'Defences and Remedies', 'page': 110},
        ],
        'LAW ANGELS- PROPERTY PRACTICE.pdf': [
            {'title': 'The Freehold Transaction Roadmap', 'page': 24},
            {'title': 'Ethics and Risk Management in Conveyancing', 'page': 36},
            {'title': 'Title Investigation; Examining Ownership and Rights', 'page': 49},
            {'title': 'Pre-Contract Enquires and Searches', 'page': 66},
            {'title': 'Contract Negotiation, Exchange and Completion', 'page': 75},
            {'title': 'Post-Completion; Requirements and Registration', 'page': 89},
            {'title': 'Finance, Mortgages, and Planning Law', 'page': 98},
            {'title': 'Leasehold Transactions; Grant, Assignment and Enforcement', 'page': 122},
            {'title': 'Taxation in Property Transactions', 'page': 148},
        ],
        "LAW ANGELS- SOLICITORS' ACCOUNT.pdf": [
            {'title': "Introduction to Solicitors' Account and the Regulatory Framework", 'page': 17},
            {'title': 'Client Money', 'page': 30},
            {'title': 'Client Account', 'page': 40},
            {'title': 'Separation of Funds and Accounting Records', 'page': 49},
            {'title': 'Interest on Client Money', 'page': 56},
            {'title': 'Breaches of the SRA Account Rules', 'page': 63},
            {'title': 'Client Ledgers, Bills, and Reconciliation', 'page': 71},
            {'title': 'Specific Account Arrangements', 'page': 85},
            {'title': 'Compliance, Reporting, and Record Retention', 'page': 93},
        ],
        'LAW ANGELS- TRUSTS.pdf': [
            {'title': 'Introduction to Trusts', 'page': 1},
            {'title': 'Express Trusts', 'page': 14},
            {'title': 'Constitution of Trusts', 'page': 28},
            {'title': 'Certainty Requirements', 'page': 42},
            {'title': 'Purpose Trusts', 'page': 56},
            {'title': 'Resulting Trusts', 'page': 68},
            {'title': 'Constructive Trusts', 'page': 80},
            {'title': 'Trustees Powers and Duties', 'page': 94},
            {'title': 'Breach of Trust', 'page': 108},
        ],
        'LAW ANGELS- WILLS.pdf': [
            {'title': 'Introduction to Wills', 'page': 1},
            {'title': 'Formalities for Valid Wills', 'page': 12},
            {'title': 'Revocation of Wills', 'page': 24},
            {'title': 'Interpretation of Wills', 'page': 36},
            {'title': 'Intestacy Rules', 'page': 48},
            {'title': 'Personal Representatives', 'page': 60},
            {'title': 'Obtaining a Grant', 'page': 72},
            {'title': 'Administration of Estates', 'page': 86},
            {'title': 'Distribution of Assets', 'page': 100},
        ],
        'LAW ANGELS- TAXATION.pdf': [
            {'title': 'Introduction to the UK Tax System and Core Principles', 'page': 15},
            {'title': 'Income Tax for Business and Employment', 'page': 26},
            {'title': 'Taxation of Business Structures; Sole Traders and Partnerships', 'page': 34},
            {'title': 'Corporation Tax', 'page': 47},
            {'title': 'Capital Gains Tax in a Business Context', 'page': 55},
            {'title': 'Value Added Tax', 'page': 68},
            {'title': 'Inheritance Tax and Business Succession', 'page': 78},
        ],
        'LAW ANGELS- PROFESSIONAL ETHICS.pdf': [
            {'title': 'Introduction to Professional Ethics and Legal Regulation', 'page': 16},
            {'title': 'The SRA Principles and Fundamental Obligations', 'page': 24},
            {'title': 'Client Care and the Retainer', 'page': 35},
            {'title': 'Conflicts of Interest', 'page': 46},
            {'title': 'Financial Services and Business Management', 'page': 53},
            {'title': 'Duties to the Court, Third Parties and the Administration of Justice', 'page': 64},
            {'title': 'Integrity, Confidentiality, and Disclosure', 'page': 72},
            {'title': 'Equality, Diversity and Inclusion in the Profession', 'page': 82},
            {'title': 'Professional Conduct and Discipline', 'page': 91},
        ],
    }
    
    for textbook in Textbook.objects.all():
        if textbook.file_name in TEXTBOOK_CHAPTERS:
            textbook.chapters = TEXTBOOK_CHAPTERS[textbook.file_name]
            textbook.save()
            print(f"Updated {textbook.file_name} with {len(textbook.chapters)} chapters")


def revert_chapters(apps, schema_editor):
    pass


class Migration(migrations.Migration):

    dependencies = [
        ('quiz', '0011_update_more_chapters'),
    ]

    operations = [
        migrations.RunPython(update_final_chapters, revert_chapters),
    ]
