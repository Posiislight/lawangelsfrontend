# Generated data migration for Textbook model

from django.db import migrations, models


def create_textbooks(apps, schema_editor):
    Textbook = apps.get_model('quiz', 'Textbook')
    
    textbooks_data = [
        # FLK1 Textbooks
        {
            'title': 'Business Law and Practice',
            'subject': 'Business Law',
            'category': 'FLK1',
            'file_name': 'LAW ANGELS- BUSINESS LAW.pdf',
            'description': 'Comprehensive guide to business law principles for SQE preparation.',
            'icon': '💼',
            'order': 1,
        },
        {
            'title': 'Constitutional and Administrative Law',
            'subject': 'Constitutional Law',
            'category': 'FLK1',
            'file_name': 'LAW ANGELS- CONSTITUTIONAL LAW.pdf',
            'description': 'Study of constitutional principles and administrative law.',
            'icon': '🏛️',
            'order': 2,
        },
        {
            'title': 'Contract Law',
            'subject': 'Contract Law',
            'category': 'FLK1',
            'file_name': 'LAW ANGELS- CONTRACT LAW.pdf',
            'description': 'Essential contract law concepts and case studies.',
            'icon': '📝',
            'order': 3,
        },
        {
            'title': 'Dispute Resolution',
            'subject': 'Dispute Resolution',
            'category': 'FLK1',
            'file_name': 'LAW ANGELS- DISPUTE RESOLUTION.pdf',
            'description': 'Methods and procedures for resolving legal disputes.',
            'icon': '⚖️',
            'order': 4,
        },
        {
            'title': 'Legal Services',
            'subject': 'Legal Services',
            'category': 'FLK1',
            'file_name': 'LAW ANGELS- LEGAL SERVICES.pdf',
            'description': 'Overview of legal services and professional practice.',
            'icon': '📋',
            'order': 5,
        },
        {
            'title': 'Legal System of England and Wales',
            'subject': 'Legal System',
            'category': 'FLK1',
            'file_name': 'LAW ANGELS- LEGAL SYSTEM.pdf',
            'description': 'Structure and operation of the English legal system.',
            'icon': '🏴',
            'order': 6,
        },
        {
            'title': 'Tort Law',
            'subject': 'Tort',
            'category': 'FLK1',
            'file_name': 'LAW ANGELS- TORTS.pdf',
            'description': 'Principles of tort law including negligence and liability.',
            'icon': '⚠️',
            'order': 7,
        },
        
        # FLK2 Textbooks
        {
            'title': 'Criminal Law and Practice',
            'subject': 'Criminal Law',
            'category': 'FLK2',
            'file_name': 'LAW ANGELS- CRIMINAL LAW.pdf',
            'description': 'Criminal law principles and procedures.',
            'icon': '🔒',
            'order': 1,
        },
        {
            'title': 'Criminal Practice',
            'subject': 'Criminal Practice',
            'category': 'FLK2',
            'file_name': 'LAW ANGELS- CRIMINAL PRACTICE.pdf',
            'description': 'Practical aspects of criminal law practice.',
            'icon': '👮',
            'order': 2,
        },
        {
            'title': 'Land Law',
            'subject': 'Land Law',
            'category': 'FLK2',
            'file_name': 'LAW ANGELS- LAND LAW.pdf',
            'description': 'Property rights and land registration concepts.',
            'icon': '🏠',
            'order': 3,
        },
        {
            'title': 'Property Practice',
            'subject': 'Property Practice',
            'category': 'FLK2',
            'file_name': 'LAW ANGELS- PROPERTY PRACTICE.pdf',
            'description': 'Practical property transactions and conveyancing.',
            'icon': '🏘',
            'order': 4,
        },
        {
            'title': "Solicitors' Accounts",
            'subject': 'Solicitors Accounts',
            'category': 'FLK2',
            'file_name': "LAW ANGELS- SOLICITORS' ACCOUNT.pdf",
            'description': 'Financial regulations for solicitors and client accounts.',
            'icon': '💰',
            'order': 5,
        },
        {
            'title': 'Trusts Law',
            'subject': 'Trusts',
            'category': 'FLK2',
            'file_name': 'LAW ANGELS- TRUSTS.pdf',
            'description': 'Trust creation, administration, and beneficiary rights.',
            'icon': '🤝',
            'order': 6,
        },
        {
            'title': 'Wills and Administration of Estates',
            'subject': 'Wills',
            'category': 'FLK2',
            'file_name': 'LAW ANGELS- WILLS.pdf',
            'description': 'Will drafting and estate administration.',
            'icon': '📜',
            'order': 7,
        },
        {
            'title': 'Taxation',
            'subject': 'Taxation',
            'category': 'FLK2',
            'file_name': 'LAW ANGELS- TAXATION.pdf',
            'description': 'Tax law principles relevant to legal practice.',
            'icon': '📊',
            'order': 8,
        },
        
        # Both FLK1 and FLK2
        {
            'title': 'Professional Ethics and Conduct',
            'subject': 'Professional Ethics',
            'category': 'BOTH',
            'file_name': 'LAW ANGELS- PROFESSIONAL ETHICS.pdf',
            'description': 'Ethical obligations and professional conduct for solicitors.',
            'icon': '⚖️',
            'order': 1,
        },
    ]
    
    for data in textbooks_data:
        Textbook.objects.create(**data)


def remove_textbooks(apps, schema_editor):
    Textbook = apps.get_model('quiz', 'Textbook')
    Textbook.objects.all().delete()


class Migration(migrations.Migration):

    dependencies = [
        ('quiz', '0007_topicquizattempt_topicquizanswer_usergameprofile_and_more'),
    ]

    operations = [
        migrations.CreateModel(
            name='Textbook',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('title', models.CharField(max_length=255)),
                ('subject', models.CharField(max_length=100)),
                ('description', models.TextField(blank=True)),
                ('category', models.CharField(choices=[('FLK1', 'FLK1 - Functioning Legal Knowledge 1'), ('FLK2', 'FLK2 - Functioning Legal Knowledge 2'), ('BOTH', 'Both FLK1 and FLK2')], default='FLK1', max_length=10)),
                ('file_name', models.CharField(max_length=255)),
                ('icon', models.CharField(default='📚', max_length=10)),
                ('order', models.IntegerField(default=0)),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('updated_at', models.DateTimeField(auto_now=True)),
            ],
            options={
                'ordering': ['category', 'order', 'title'],
            },
        ),
        migrations.RunPython(create_textbooks, remove_textbooks),
    ]
