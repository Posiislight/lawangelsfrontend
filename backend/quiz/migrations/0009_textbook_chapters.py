# Migration to add chapters field and populate with table of contents

from django.db import migrations, models


# Table of contents data for each textbook
TEXTBOOK_CHAPTERS = {
    'LAW ANGELS- BUSINESS LAW.pdf': [
        {'title': 'Introduction to Business Law', 'page': 1},
        {'title': 'Types of Business Structures', 'page': 8},
        {'title': 'Partnerships', 'page': 18},
        {'title': 'Limited Liability Partnerships', 'page': 28},
        {'title': 'Company Formation', 'page': 38},
        {'title': 'Company Constitution', 'page': 48},
        {'title': 'Directors and Officers', 'page': 58},
        {'title': 'Shareholders and Meetings', 'page': 70},
        {'title': 'Share Capital', 'page': 82},
        {'title': 'Insolvency', 'page': 94},
    ],
    'LAW ANGELS- CONSTITUTIONAL LAW.pdf': [
        {'title': 'Introduction to Constitutional Law', 'page': 1},
        {'title': 'Sources of the Constitution', 'page': 10},
        {'title': 'Parliamentary Sovereignty', 'page': 22},
        {'title': 'Rule of Law', 'page': 34},
        {'title': 'Separation of Powers', 'page': 46},
        {'title': 'The Executive', 'page': 58},
        {'title': 'The Legislature', 'page': 70},
        {'title': 'The Judiciary', 'page': 82},
        {'title': 'Human Rights Act 1998', 'page': 94},
        {'title': 'Judicial Review', 'page': 106},
    ],
    'LAW ANGELS- CONTRACT LAW.pdf': [
        {'title': 'Introduction to Contract Law', 'page': 1},
        {'title': 'Offer and Acceptance', 'page': 12},
        {'title': 'Consideration', 'page': 26},
        {'title': 'Intention to Create Legal Relations', 'page': 38},
        {'title': 'Contractual Terms', 'page': 48},
        {'title': 'Exclusion Clauses', 'page': 62},
        {'title': 'Misrepresentation', 'page': 74},
        {'title': 'Mistake', 'page': 86},
        {'title': 'Duress and Undue Influence', 'page': 98},
        {'title': 'Frustration', 'page': 110},
        {'title': 'Breach and Remedies', 'page': 122},
    ],
    'LAW ANGELS- DISPUTE RESOLUTION.pdf': [
        {'title': 'Introduction to Dispute Resolution', 'page': 1},
        {'title': 'Civil Litigation Overview', 'page': 10},
        {'title': 'Pre-Action Protocols', 'page': 20},
        {'title': 'Commencing Proceedings', 'page': 32},
        {'title': 'Case Management', 'page': 44},
        {'title': 'Disclosure and Evidence', 'page': 56},
        {'title': 'Trial Procedure', 'page': 68},
        {'title': 'Appeals', 'page': 80},
        {'title': 'Alternative Dispute Resolution', 'page': 90},
        {'title': 'Costs', 'page': 102},
    ],
    'LAW ANGELS- LEGAL SERVICES.pdf': [
        {'title': 'Introduction to Legal Services', 'page': 1},
        {'title': 'Regulation of Legal Services', 'page': 10},
        {'title': 'SRA Standards and Regulations', 'page': 20},
        {'title': 'Client Care', 'page': 32},
        {'title': 'Confidentiality', 'page': 42},
        {'title': 'Conflicts of Interest', 'page': 52},
        {'title': 'Money Laundering', 'page': 64},
        {'title': 'Complaints Handling', 'page': 76},
    ],
    'LAW ANGELS- LEGAL SYSTEM.pdf': [
        {'title': 'Sources of Law', 'page': 1},
        {'title': 'Court Structure', 'page': 12},
        {'title': 'Civil Courts', 'page': 24},
        {'title': 'Criminal Courts', 'page': 36},
        {'title': 'Tribunals', 'page': 48},
        {'title': 'Legal Personnel', 'page': 58},
        {'title': 'Precedent and Statutory Interpretation', 'page': 70},
        {'title': 'European Union Law', 'page': 82},
    ],
    'LAW ANGELS- TORTS.pdf': [
        {'title': 'Introduction to Tort Law', 'page': 1},
        {'title': 'Negligence - Duty of Care', 'page': 12},
        {'title': 'Negligence - Breach of Duty', 'page': 26},
        {'title': 'Negligence - Causation', 'page': 38},
        {'title': 'Negligence - Remoteness', 'page': 50},
        {'title': 'Psychiatric Harm', 'page': 62},
        {'title': 'Economic Loss', 'page': 74},
        {'title': 'Occupiers Liability', 'page': 86},
        {'title': 'Nuisance', 'page': 98},
        {'title': 'Defences and Remedies', 'page': 110},
    ],
    'LAW ANGELS- CRIMINAL LAW.pdf': [
        {'title': 'Introduction to Criminal Law', 'page': 1},
        {'title': 'Actus Reus', 'page': 12},
        {'title': 'Mens Rea', 'page': 24},
        {'title': 'Murder', 'page': 36},
        {'title': 'Voluntary Manslaughter', 'page': 48},
        {'title': 'Involuntary Manslaughter', 'page': 60},
        {'title': 'Non-Fatal Offences', 'page': 72},
        {'title': 'Sexual Offences', 'page': 84},
        {'title': 'Theft and Related Offences', 'page': 96},
        {'title': 'Fraud', 'page': 108},
        {'title': 'Defences', 'page': 120},
    ],
    'LAW ANGELS- CRIMINAL PRACTICE.pdf': [
        {'title': 'Introduction to Criminal Practice', 'page': 1},
        {'title': 'Police Powers', 'page': 12},
        {'title': 'Bail', 'page': 26},
        {'title': 'Mode of Trial', 'page': 38},
        {'title': 'Summary Trial', 'page': 50},
        {'title': 'Trial on Indictment', 'page': 62},
        {'title': 'Evidence', 'page': 76},
        {'title': 'Sentencing', 'page': 90},
        {'title': 'Appeals', 'page': 104},
    ],
    'LAW ANGELS- LAND LAW.pdf': [
        {'title': 'Introduction to Land Law', 'page': 1},
        {'title': 'Estates and Interests in Land', 'page': 12},
        {'title': 'Registration of Title', 'page': 26},
        {'title': 'Co-ownership', 'page': 40},
        {'title': 'Trusts of Land', 'page': 54},
        {'title': 'Easements', 'page': 66},
        {'title': 'Covenants', 'page': 80},
        {'title': 'Mortgages', 'page': 94},
        {'title': 'Leases', 'page': 108},
    ],
    'LAW ANGELS- PROPERTY PRACTICE.pdf': [
        {'title': 'Introduction to Property Practice', 'page': 1},
        {'title': 'Taking Instructions', 'page': 10},
        {'title': 'Pre-Contract Stage', 'page': 22},
        {'title': 'Searches and Enquiries', 'page': 36},
        {'title': 'The Contract', 'page': 50},
        {'title': 'Pre-Completion', 'page': 64},
        {'title': 'Completion', 'page': 76},
        {'title': 'Post-Completion', 'page': 88},
        {'title': 'Leasehold Transactions', 'page': 100},
    ],
    "LAW ANGELS- SOLICITORS' ACCOUNT.pdf": [
        {'title': 'Introduction to Solicitors Accounts', 'page': 1},
        {'title': 'SRA Accounts Rules', 'page': 10},
        {'title': 'Client Money', 'page': 22},
        {'title': 'Business Money', 'page': 34},
        {'title': 'Client Bank Account', 'page': 44},
        {'title': 'Business Bank Account', 'page': 54},
        {'title': 'Transfers Between Accounts', 'page': 64},
        {'title': 'Interest on Client Money', 'page': 74},
        {'title': 'Accounting Records', 'page': 84},
        {'title': 'Accountants Reports', 'page': 94},
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
        {'title': 'Introduction to Taxation', 'page': 1},
        {'title': 'Income Tax', 'page': 10},
        {'title': 'Capital Gains Tax', 'page': 24},
        {'title': 'Inheritance Tax', 'page': 38},
        {'title': 'Corporation Tax', 'page': 52},
        {'title': 'VAT', 'page': 64},
        {'title': 'Stamp Duty Land Tax', 'page': 76},
        {'title': 'Tax Planning', 'page': 88},
    ],
    'LAW ANGELS- PROFESSIONAL ETHICS.pdf': [
        {'title': 'Introduction to Professional Ethics', 'page': 1},
        {'title': 'SRA Principles', 'page': 10},
        {'title': 'Code of Conduct for Solicitors', 'page': 22},
        {'title': 'Confidentiality and Disclosure', 'page': 36},
        {'title': 'Conflicts of Interest', 'page': 50},
        {'title': 'Undertakings', 'page': 64},
        {'title': 'Duties to the Court', 'page': 76},
        {'title': 'Client Money and Accounts', 'page': 88},
        {'title': 'Supervision and Accountability', 'page': 100},
    ],
}


def populate_chapters(apps, schema_editor):
    Textbook = apps.get_model('quiz', 'Textbook')
    for textbook in Textbook.objects.all():
        if textbook.file_name in TEXTBOOK_CHAPTERS:
            textbook.chapters = TEXTBOOK_CHAPTERS[textbook.file_name]
            textbook.save()


def clear_chapters(apps, schema_editor):
    Textbook = apps.get_model('quiz', 'Textbook')
    Textbook.objects.update(chapters=[])


class Migration(migrations.Migration):

    dependencies = [
        ('quiz', '0008_textbook'),
    ]

    operations = [
        migrations.AddField(
            model_name='textbook',
            name='chapters',
            field=models.JSONField(blank=True, default=list),
        ),
        migrations.RunPython(populate_chapters, clear_chapters),
    ]
