from django.core.management.base import BaseCommand
from quiz.models import Exam, Question, QuestionOption


class Command(BaseCommand):
    help = 'Populate database with sample legal exam questions'

    def handle(self, *args, **options):
        # Create exam
        exam, created = Exam.objects.get_or_create(
            title='Mock Test 1',
            defaults={
                'description': 'Complete practice exam covering SDLT, VAT, CGT, IHT, and Solicitors Accounts',
                'subject': 'mixed',
                'duration_minutes': 60,
                'speed_reader_seconds': 70,
                'passing_score_percentage': 70,
                'is_active': True,
            }
        )

        if created:
            self.stdout.write(self.style.SUCCESS(f'Created exam: {exam.title}'))

        # Sample questions
        questions_data = [
            {
                'question_number': 1,
                'text': 'A client is purchasing a large, detached property in England for £850,000. The property consists of a main house and a separate, self-contained annexe with its own entrance. The annexe has been rented out to a tenant on a commercial lease for the last five years. The client intends to use the main house as their primary residence but will continue to rent out the annexe. The client\'s solicitor is advising on the Stamp Duty Land Tax (SDLT) liability. What is the correct basis for calculating the SDLT on this purchase?',
                'explanation': 'C is correct. For SDLT purposes, a property is "mixed-use" if it consists of both residential and non-residential elements. A dwelling that is let on a commercial lease constitutes a non-residential element. The law requires the purchase price to be apportioned on a just and reasonable basis, and the residential and non-residential SDLT rates applied to their respective portions.',
                'difficulty': 'medium',
                'correct_answer': 'C',
                'options': [
                    {'label': 'A', 'text': 'The entire purchase price should be treated as residential property, and SDLT calculated using the residential rates and bands.'},
                    {'label': 'B', 'text': 'The entire purchase price should be treated as non-residential property, and SDLT calculated using the non-residential rates and bands.'},
                    {'label': 'C', 'text': 'A "mixed-use" appraisal is required, and SDLT must be calculated by apportioning the purchase price between the residential and non-residential elements and applying the respective rates to each portion.'},
                    {'label': 'D', 'text': 'The purchase qualifies for multiple dwellings relief, and SDLT should be calculated based on the average value of the two dwellings.'},
                    {'label': 'E', 'text': 'As the client will occupy part of the property, the entire purchase qualifies for first-time buyer\'s relief, provided the client is a first-time buyer.'},
                ]
            },
            {
                'question_number': 2,
                'text': 'A solicitor is acting for a client who is purchasing the freehold of a vacant commercial office building in England from a developer. The developer has notified the client that they have exercised an option to tax the building. The client\'s business makes only exempt supplies for VAT purposes. The client is concerned about the financial impact of this. What is the effect of the developer\'s option to tax on this transaction?',
                'explanation': 'A is correct. Where a seller has opted to tax a commercial property, the sale becomes a standard-rated supply, and VAT at 20% is added to the price. A purchaser who makes only exempt supplies is not registered for VAT or is partially exempt and cannot recover all input VAT. Consequently, they cannot reclaim the VAT charged on the purchase, making it a real cost.',
                'difficulty': 'medium',
                'correct_answer': 'A',
                'options': [
                    {'label': 'A', 'text': 'The purchase price will be subject to VAT at 20%, and the client will be unable to recover this VAT as input tax.'},
                    {'label': 'B', 'text': 'The purchase price will be subject to VAT at 0%, which the client can disregard.'},
                    {'label': 'C', 'text': 'The purchase price will be subject to VAT at 20%, which the client will be able to recover in full as input tax.'},
                    {'label': 'D', 'text': 'The option to tax is invalid because the building is vacant, so the sale will be exempt from VAT.'},
                    {'label': 'E', 'text': 'The client can require the developer to revoke the option to tax prior to completion to avoid the VAT charge.'},
                ]
            },
            {
                'question_number': 3,
                'text': 'A woman bought a house in England ten years ago and lived in it as her only residence for the first seven years. She then moved in with her partner and began renting out the entire house for the final three years of ownership. She has now sold the house, making a capital gain of £150,000. During the final three years of ownership, she did not live in the property at all, but she had once listed it for sale two years ago before taking it off the market. What is the position regarding Private Residence Relief (PRR) on the gain of £150,000?',
                'explanation': 'C is correct. Private Residence Relief is given for periods of actual occupation as the taxpayer\'s only or main residence. The relief is also available for the final 9 months of ownership, even if the taxpayer was not in residence during that period. Therefore, the gain must be apportioned. Relief will cover the 7 years of actual occupation plus the final 9 months, with the remaining period of letting being taxable.',
                'difficulty': 'hard',
                'correct_answer': 'C',
                'options': [
                    {'label': 'A', 'text': 'The entire gain is exempt because she lived in the property as her main residence for more than half the period of ownership.'},
                    {'label': 'B', 'text': 'No relief is due because the property was not her main residence at the date of sale.'},
                    {'label': 'C', 'text': 'The gain must be apportioned on a time basis, with relief available for the period of actual occupation plus the final nine months of ownership, regardless of use.'},
                    {'label': 'D', 'text': 'The gain must be apportioned, but she can claim relief for the entire period of ownership because she intended to sell it two years ago.'},
                    {'label': 'E', 'text': 'The gain is fully taxable because the property was a rental investment at the time of sale, and the last 36 months rule does not apply.'},
                ]
            },
        ]

        # Create questions and options
        for q_data in questions_data:
            question, created = Question.objects.get_or_create(
                exam=exam,
                question_number=q_data['question_number'],
                defaults={
                    'text': q_data['text'],
                    'explanation': q_data['explanation'],
                    'difficulty': q_data['difficulty'],
                    'correct_answer': q_data['correct_answer'],
                }
            )

            if created:
                # Create options
                for option_data in q_data['options']:
                    QuestionOption.objects.create(
                        question=question,
                        label=option_data['label'],
                        text=option_data['text'],
                    )
                self.stdout.write(self.style.SUCCESS(f'Created question {question.question_number} with options'))

        # Update exam question count
        exam.total_questions = exam.questions.count()
        exam.save()

        self.stdout.write(self.style.SUCCESS(f'Successfully populated {exam.questions.count()} questions for {exam.title}'))
