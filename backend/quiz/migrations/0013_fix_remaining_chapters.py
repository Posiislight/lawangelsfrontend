# Migration to fix Torts, Trusts, and Wills chapters with correct page numbers

from django.db import migrations


def fix_remaining_chapters(apps, schema_editor):
    Textbook = apps.get_model('quiz', 'Textbook')
    
    # Accurate chapter data from actual PDF table of contents
    TEXTBOOK_CHAPTERS = {
        'LAW ANGELS- TORTS.pdf': [
            {'title': 'Foundations of Torts Law', 'page': 34},
            {'title': 'The Duty of Care in Negligence', 'page': 45},
            {'title': 'Breach of Duty; The Standard of Care', 'page': 65},
            {'title': 'Causation and Remoteness of Damages', 'page': 82},
            {'title': 'Specific Duty of Care Scenarios', 'page': 104},
            {'title': "Employers' Liability and Vicarious Liability", 'page': 117},
            {'title': 'Defences to Negligence', 'page': 138},
            {'title': "Occupiers' Liability", 'page': 150},
            {'title': 'Product Liability', 'page': 164},
            {'title': 'Nuisance and the Rule in Rylands v Fletcher', 'page': 176},
            {'title': 'Remedies and Principles of Compensation', 'page': 198},
        ],
        'LAW ANGELS- TRUSTS.pdf': [
            {'title': 'The Foundations of Trusts and Equity', 'page': 21},
            {'title': 'Creating an Express Trust', 'page': 35},
            {'title': 'Constitution of Trusts and Gifts; Perfecting the Transfer', 'page': 48},
            {'title': 'Beneficial Entitlement: Interests and Exit Rights', 'page': 59},
            {'title': 'Purpose Trusts: Charitable and Non-Charitable', 'page': 67},
            {'title': 'Resulting Trusts: Presumption and Automatic Operation', 'page': 78},
            {'title': 'Trusts of the Family Home: Establishing a Beneficial Interest', 'page': 95},
            {'title': 'Fiduciary Obligations and the Office of Trustee', 'page': 107},
            {'title': "Trustees' Powers, Duties, and Liability for Breach", 'page': 123},
            {'title': 'Third Party Liability and Equitable Remedies', 'page': 138},
        ],
        'LAW ANGELS- WILLS.pdf': [
            {'title': 'Essentials for the Proper Execution of Wills', 'page': 24},
            {'title': 'Intestacy; What Happens When Someone Dies Without a Valid Will?', 'page': 40},
            {'title': 'Precision in Will Drafting', 'page': 50},
            {'title': 'Understanding Alterations and Revocation', 'page': 60},
            {'title': 'Inheritance Tax (IHT)', 'page': 73},
            {'title': 'Claims Against Estates Under the Inheritance (Provision for Family and Dependants) Act 1975', 'page': 91},
            {'title': 'Securing Authority to Administer the Estate', 'page': 109},
            {'title': 'Managing the Estate: Fiduciary Framework and Initial Steps', 'page': 122},
            {'title': 'Managing the Estate: Financial Settlement & Distribution Mechanics', 'page': 134},
            {'title': 'Managing the Estate: Finalising the Estate & Formal Conclusion', 'page': 146},
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
        ('quiz', '0012_update_final_chapters'),
    ]

    operations = [
        migrations.RunPython(fix_remaining_chapters, revert_chapters),
    ]
