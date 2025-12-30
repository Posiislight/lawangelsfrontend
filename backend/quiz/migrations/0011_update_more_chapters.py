# Migration to add correct chapters for Contract, Criminal, Criminal Practice, Dispute Resolution, and Land Law

from django.db import migrations


def update_more_chapters(apps, schema_editor):
    Textbook = apps.get_model('quiz', 'Textbook')
    
    # Accurate chapter data from actual PDF table of contents
    TEXTBOOK_CHAPTERS = {
        'LAW ANGELS- CONTRACT LAW.pdf': [
            {'title': 'The Nature and Foundation of a Contract', 'page': 26},
            {'title': 'The Formation of a Contract I: Agreement and Certainty', 'page': 30},
            {'title': 'The Formation of a Contract II: Consideration and Intention', 'page': 39},
            {'title': 'The Parties to the Contract: Privity and Third-Party Rights', 'page': 51},
            {'title': 'The Terms of the Contract I: Express and Implied Terms', 'page': 58},
            {'title': 'The Terms of the Contract II: Exemption Clauses and Interpretation', 'page': 71},
            {'title': 'Vitiating Factors: Misrepresentation and Mistake', 'page': 80},
            {'title': 'Vitiating Factors II: Duress, Undue Influence, and Illegality', 'page': 95},
            {'title': 'Discharge of a Contract I: Performance, Breach, and Frustration', 'page': 112},
            {'title': 'Discharge of a Contract II: Restitution and Unjust Enrichment', 'page': 124},
            {'title': 'Remedies for Breach of Contract I: Damages and Mitigation', 'page': 133},
            {'title': 'Remedies for Breach of Contract II: Specific Remedies, Indemnities and Guarantees', 'page': 144},
        ],
        'LAW ANGELS- CRIMINAL LAW.pdf': [
            {'title': 'Foundations of Criminal Liability', 'page': 20},
            {'title': 'Property and Theft Offences', 'page': 34},
            {'title': 'Criminal Damage', 'page': 50},
            {'title': 'Non-Fatal Offences Against the Person', 'page': 62},
            {'title': 'Homicide Offences', 'page': 83},
            {'title': 'Principal and Secondary Offenders', 'page': 95},
            {'title': 'Fraud and Dishonesty Offences', 'page': 104},
            {'title': 'General and Partial Defences', 'page': 115},
            {'title': 'Attempted Offences', 'page': 127},
        ],
        'LAW ANGELS- CRIMINAL PRACTICE.pdf': [
            {'title': 'Initial Client Engagement and Police Station Advice', 'page': 18},
            {'title': 'Identification and Interview Procedures', 'page': 27},
            {'title': 'Classification of Offences and First Hearing', 'page': 41},
            {'title': 'Bail', 'page': 55},
            {'title': 'Allocation, Plea Before Venue, and Case Management', 'page': 68},
            {'title': 'The Admissibility of Evidence 1: Silence, Identification and Hearsay', 'page': 78},
            {'title': 'The Admissibility of Evidence 2: Confessions and Bad Character', 'page': 88},
            {'title': 'Trial Procedure and Sentencing', 'page': 95},
            {'title': 'Appeals and Youth Justice', 'page': 126},
        ],
        'LAW ANGELS- DISPUTE RESOLUTION.pdf': [
            {'title': 'Foundations of Dispute Resolution', 'page': 22},
            {'title': 'Preliminary Considerations and Pre-Action Conduct', 'page': 40},
            {'title': 'Jurisdiction, Applicable Law, and Commencing Proceedings', 'page': 59},
            {'title': 'Service of Proceedings and Responding to a Claim', 'page': 81},
            {'title': 'Drafting and Managing Statements of Case', 'page': 104},
            {'title': 'Interim Applications and Injunctions', 'page': 122},
            {'title': 'Case Management and the Overriding Objective', 'page': 135},
            {'title': 'Disclosure and Privilege', 'page': 152},
            {'title': 'Evidence for Trial', 'page': 168},
            {'title': 'Trial, Judgment, Appeals, and Costs', 'page': 189},
            {'title': 'Enforcement of Money Judgments', 'page': 217},
        ],
        'LAW ANGELS- LAND LAW.pdf': [
            {'title': 'Foundations of Land Law', 'page': 24},
            {'title': 'Registered vs Unregistered Land; Principles and Practice', 'page': 36},
            {'title': 'Principles of Co-Ownership', 'page': 53},
            {'title': 'Easements', 'page': 67},
            {'title': 'Leasehold Land; Legal Framework and Practice', 'page': 77},
            {'title': 'Secured Lending; The Law of Mortgages', 'page': 104},
            {'title': 'Covenants Affecting Freehold Land', 'page': 116},
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
        ('quiz', '0010_update_chapters_correct_pages'),
    ]

    operations = [
        migrations.RunPython(update_more_chapters, revert_chapters),
    ]
