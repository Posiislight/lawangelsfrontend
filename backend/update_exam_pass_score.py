
from quiz.models import Exam

exams = Exam.objects.all()
count = 0
for exam in exams:
    if exam.passing_score_percentage != 60:
        print(f"Updating '{exam.title}' from {exam.passing_score_percentage}% to 60%")
        exam.passing_score_percentage = 60
        exam.save()
        count += 1
    else:
        print(f"'{exam.title}' is already 60%")

print(f"Updated {count} exams.")
