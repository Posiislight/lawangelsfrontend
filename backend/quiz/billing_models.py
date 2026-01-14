"""
Billing models for Stripe subscription management.
Handles user subscriptions at £750/year with 7-day grace period.
"""
from django.db import models
from django.contrib.auth.models import User
from django.utils import timezone
from datetime import timedelta


class Subscription(models.Model):
    """
    User subscription linked to Stripe.
    Existing users before billing implementation are grandfathered.
    """
    STATUS_ACTIVE = 'active'
    STATUS_PAST_DUE = 'past_due'
    STATUS_CANCELLED = 'cancelled'
    STATUS_EXPIRED = 'expired'
    STATUS_GRANDFATHERED = 'grandfathered'  # For existing users
    
    STATUS_CHOICES = [
        (STATUS_ACTIVE, 'Active'),
        (STATUS_PAST_DUE, 'Past Due'),
        (STATUS_CANCELLED, 'Cancelled'),
        (STATUS_EXPIRED, 'Expired'),
        (STATUS_GRANDFATHERED, 'Grandfathered'),
    ]
    
    user = models.OneToOneField(
        User, 
        on_delete=models.CASCADE, 
        related_name='subscription'
    )
    stripe_customer_id = models.CharField(
        max_length=255, 
        blank=True, 
        null=True,
        help_text="Stripe Customer ID (cus_xxx)"
    )
    stripe_subscription_id = models.CharField(
        max_length=255, 
        blank=True, 
        null=True,
        help_text="Stripe Subscription ID (sub_xxx)"
    )
    status = models.CharField(
        max_length=20, 
        choices=STATUS_CHOICES, 
        default=STATUS_EXPIRED
    )
    current_period_start = models.DateTimeField(null=True, blank=True)
    current_period_end = models.DateTimeField(null=True, blank=True)
    cancelled_at = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    # Grace period: 7 days after subscription ends
    GRACE_PERIOD_DAYS = 7
    
    class Meta:
        verbose_name = "Subscription"
        verbose_name_plural = "Subscriptions"
    
    def __str__(self):
        return f"{self.user.username} - {self.status}"
    
    @property
    def is_valid(self) -> bool:
        """
        Check if subscription allows access to the platform.
        Returns True if:
        - Status is 'active' or 'grandfathered'
        - Status is 'past_due' or 'cancelled' but still within grace period
        """
        if self.status == self.STATUS_GRANDFATHERED:
            return True
        
        if self.status == self.STATUS_ACTIVE:
            return True
        
        # Allow access during grace period
        if self.status in [self.STATUS_PAST_DUE, self.STATUS_CANCELLED, self.STATUS_EXPIRED]:
            if self.current_period_end:
                grace_end = self.current_period_end + timedelta(days=self.GRACE_PERIOD_DAYS)
                if timezone.now() < grace_end:
                    return True
        
        return False
    
    @property
    def days_until_expiry(self) -> int:
        """Days remaining until subscription expires (including grace period)."""
        if self.status == self.STATUS_GRANDFATHERED:
            return 999  # Effectively never expires
        
        if not self.current_period_end:
            return 0
        
        grace_end = self.current_period_end + timedelta(days=self.GRACE_PERIOD_DAYS)
        delta = grace_end - timezone.now()
        return max(0, delta.days)
    
    @classmethod
    def get_or_create_for_user(cls, user: User) -> 'Subscription':
        """Get or create subscription for a user."""
        subscription, created = cls.objects.get_or_create(user=user)
        return subscription
