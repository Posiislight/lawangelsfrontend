# Generated migration for performance optimization

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('quiz', '0003_examattempt_quiz_examat_user_id_437be5_idx_and_more'),
    ]

    operations = [
        # Add indexes to M2M through table
        migrations.RunSQL(
            sql="""
            CREATE INDEX IF NOT EXISTS 
            quiz_examattempt_selected_questions_examattempt_id 
            ON quiz_examattempt_selected_questions(examattempt_id);
            """,
            reverse_sql="""
            DROP INDEX IF EXISTS quiz_examattempt_selected_questions_examattempt_id;
            """
        ),
        migrations.RunSQL(
            sql="""
            CREATE INDEX IF NOT EXISTS 
            quiz_examattempt_selected_questions_question_id 
            ON quiz_examattempt_selected_questions(question_id);
            """,
            reverse_sql="""
            DROP INDEX IF EXISTS quiz_examattempt_selected_questions_question_id;
            """
        ),
        # Add composite index for fast lookups
        migrations.RunSQL(
            sql="""
            CREATE INDEX IF NOT EXISTS 
            quiz_examattempt_user_exam_status 
            ON quiz_examattempt(user_id, exam_id, status);
            """,
            reverse_sql="""
            DROP INDEX IF EXISTS quiz_examattempt_user_exam_status;
            """
        ),
        # Add index for question random sampling
        migrations.RunSQL(
            sql="""
            CREATE INDEX IF NOT EXISTS 
            quiz_question_exam_id 
            ON quiz_question(exam_id);
            """,
            reverse_sql="""
            DROP INDEX IF EXISTS quiz_question_exam_id;
            """
        ),
    ]
