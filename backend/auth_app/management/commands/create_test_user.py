from django.core.management.base import BaseCommand
from django.contrib.auth.models import User


class Command(BaseCommand):
    help = 'Create a test user for demo purposes'

    def handle(self, *args, **options):
        user, created = User.objects.get_or_create(
            username='testuser',
            defaults={
                'email': 'test@example.com',
                'first_name': 'Test',
                'last_name': 'User',
            }
        )
        if created:
            user.set_password('testpass123')
            user.save()
            self.stdout.write(self.style.SUCCESS(f'✓ Test user created: {user.username}'))
        else:
            self.stdout.write(self.style.WARNING(f'⚠ Test user already exists: {user.username}'))
