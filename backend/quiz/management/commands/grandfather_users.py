"""
Management command to grandfather existing users with lifetime subscription access.
Run after deploying billing feature to grant existing users free access.
"""
from django.core.management.base import BaseCommand
from django.contrib.auth.models import User
from quiz.billing_models import Subscription


class Command(BaseCommand):
    help = 'Grandfather existing users by creating lifetime subscriptions for them'
    
    def add_arguments(self, parser):
        parser.add_argument(
            '--dry-run',
            action='store_true',
            help='Show what would be done without making changes'
        )
    
    def handle(self, *args, **options):
        dry_run = options['dry_run']
        
        # Get all users who don't have a subscription yet
        users_without_subscription = User.objects.exclude(
            subscription__isnull=False
        )
        
        self.stdout.write(f"Found {users_without_subscription.count()} users without subscriptions")
        
        if dry_run:
            self.stdout.write(self.style.WARNING("DRY RUN - No changes will be made"))
        
        grandfathered = 0
        
        for user in users_without_subscription:
            if dry_run:
                self.stdout.write(f"  Would grandfather: {user.username} ({user.email})")
            else:
                Subscription.objects.create(
                    user=user,
                    status=Subscription.STATUS_GRANDFATHERED
                )
                self.stdout.write(f"  ✓ Grandfathered: {user.username}")
            grandfathered += 1
        
        if dry_run:
            self.stdout.write(self.style.SUCCESS(f"\nWould grandfather {grandfathered} users"))
        else:
            self.stdout.write(self.style.SUCCESS(f"\n✓ Grandfathered {grandfathered} users"))
