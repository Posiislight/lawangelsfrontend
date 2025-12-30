# Migration to update chapters with correct page numbers from actual PDFs

from django.db import migrations


def update_chapters_with_correct_pages(apps, schema_editor):
    Textbook = apps.get_model('quiz', 'Textbook')
    
    # Accurate chapter data from actual PDF table of contents
    TEXTBOOK_CHAPTERS = {
        'LAW ANGELS- BUSINESS LAW.pdf': [
            {'title': 'Introduction to Business Organisations', 'page': 24},
            {'title': 'Legal Personality, Limited Liability, and Corporate Personality', 'page': 45},
            {'title': 'Forming a Company: Incorporation and Constitution', 'page': 58},
            {'title': 'Forming Partnerships and Limited Liability Partnerships', 'page': 94},
            {'title': 'Corporate Finance: Equity and Debt', 'page': 111},
            {'title': 'Security for Lending', 'page': 140},
            {'title': 'Corporate Governance: Directors and Their Duties', 'page': 163},
            {'title': 'Corporate Governance: Shareholders and Decision Making', 'page': 183},
            {'title': 'Partnership and LLP Governance and Decision Making', 'page': 205},
            {'title': 'Protecting the Shareholders and Minority Rights', 'page': 221},
            {'title': 'Insolvency Law and Procedure', 'page': 242},
        ],
        'LAW ANGELS- CONSTITUTIONAL LAW.pdf': [
            {'title': 'The UK Constitution: Foundations and Fundamental Principles', 'page': 21},
            {'title': 'The Core Institutions of a State and Their Interrelationship', 'page': 34},
            {'title': 'Executive Power: Prerogative and Accountability', 'page': 49},
            {'title': 'The Legislative Process and the Hierarchy of Law', 'page': 61},
            {'title': 'Public Order Law', 'page': 77},
            {'title': 'Judicial Review: Nature, Process and Access', 'page': 89},
            {'title': 'The Grounds and Remedies in Judicial Review', 'page': 101},
            {'title': 'The Human Rights Act 1998 and the European Convention on Human Rights', 'page': 113},
            {'title': 'The Place of EU Law in the UK Constitution', 'page': 134},
        ],
    }
    
    for textbook in Textbook.objects.all():
        if textbook.file_name in TEXTBOOK_CHAPTERS:
            textbook.chapters = TEXTBOOK_CHAPTERS[textbook.file_name]
            textbook.save()
            print(f"Updated {textbook.file_name} with {len(textbook.chapters)} chapters")


def revert_chapters(apps, schema_editor):
    # Revert is handled by the previous migration
    pass


class Migration(migrations.Migration):

    dependencies = [
        ('quiz', '0009_textbook_chapters'),
    ]

    operations = [
        migrations.RunPython(update_chapters_with_correct_pages, revert_chapters),
    ]
