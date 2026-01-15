"""
Billing views for Stripe subscription management.
Handles checkout sessions, webhooks, and subscription status.
"""
import stripe
from django.conf import settings
from django.http import HttpResponse
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_POST
from django.utils import timezone
from datetime import datetime
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework import status

from .billing_models import Subscription


# Initialize Stripe
stripe.api_key = getattr(settings, 'STRIPE_SECRET_KEY', '')


class SubscriptionStatusView(APIView):
    """Get current user's subscription status."""
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        subscription = Subscription.get_or_create_for_user(request.user)
        
        return Response({
            'status': subscription.status,
            'is_valid': subscription.is_valid,
            'current_period_end': subscription.current_period_end,
            'days_until_expiry': subscription.days_until_expiry,
            'stripe_customer_id': subscription.stripe_customer_id,
            'is_grandfathered': subscription.status == Subscription.STATUS_GRANDFATHERED,
        })


class CreateCheckoutSessionView(APIView):
    """Create Stripe Checkout session for new subscription."""
    permission_classes = [IsAuthenticated]
    
    def post(self, request):
        price_id = getattr(settings, 'STRIPE_PRICE_ID', '')
        success_url = request.data.get('success_url', f"{settings.FRONTEND_URL}/billing?success=true")
        cancel_url = request.data.get('cancel_url', f"{settings.FRONTEND_URL}/billing?cancelled=true")
        
        if not price_id:
            return Response(
                {'error': 'Stripe price not configured'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
        
        try:
            subscription = Subscription.get_or_create_for_user(request.user)
            
            # Create or retrieve Stripe customer
            if subscription.stripe_customer_id:
                customer_id = subscription.stripe_customer_id
            else:
                customer = stripe.Customer.create(
                    email=request.user.email,
                    name=f"{request.user.first_name} {request.user.last_name}".strip() or request.user.username,
                    metadata={'user_id': request.user.id}
                )
                customer_id = customer.id
                subscription.stripe_customer_id = customer_id
                subscription.save(update_fields=['stripe_customer_id'])
            
            # Create checkout session
            checkout_session = stripe.checkout.Session.create(
                customer=customer_id,
                payment_method_types=['card'],
                line_items=[{
                    'price': price_id,
                    'quantity': 1,
                }],
                mode='subscription',
                success_url=success_url,
                cancel_url=cancel_url,
                metadata={'user_id': request.user.id},
            )
            
            return Response({'checkout_url': checkout_session.url})
            
        except stripe.error.StripeError as e:
            return Response(
                {'error': str(e)},
                status=status.HTTP_400_BAD_REQUEST
            )


class CreatePortalSessionView(APIView):
    """Create Stripe Customer Portal session for managing subscription."""
    permission_classes = [IsAuthenticated]
    
    def post(self, request):
        return_url = request.data.get('return_url', f"{settings.FRONTEND_URL}/billing")
        
        try:
            subscription = Subscription.get_or_create_for_user(request.user)
            
            if not subscription.stripe_customer_id:
                return Response(
                    {'error': 'No subscription found'},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            portal_session = stripe.billing_portal.Session.create(
                customer=subscription.stripe_customer_id,
                return_url=return_url,
            )
            
            return Response({'portal_url': portal_session.url})
            
        except stripe.error.StripeError as e:
            return Response(
                {'error': str(e)},
                status=status.HTTP_400_BAD_REQUEST
            )


class SyncSubscriptionView(APIView):
    """
    Sync subscription status from Stripe.
    Called after successful checkout to immediately reflect payment.
    """
    permission_classes = [IsAuthenticated]
    
    def post(self, request):
        try:
            subscription = Subscription.get_or_create_for_user(request.user)
            
            if not subscription.stripe_customer_id:
                return Response({
                    'synced': False,
                    'message': 'No Stripe customer found'
                })
            
            # Query Stripe for active subscriptions for this customer
            stripe_subscriptions = stripe.Subscription.list(
                customer=subscription.stripe_customer_id,
                status='active',
                limit=1
            )
            
            if stripe_subscriptions.data:
                stripe_sub = stripe_subscriptions.data[0]
                # Convert to dict for safer attribute access (Stripe API v14 compatibility)
                sub_data = stripe_sub.to_dict() if hasattr(stripe_sub, 'to_dict') else stripe_sub
                
                subscription.stripe_subscription_id = stripe_sub.id
                subscription.status = Subscription.STATUS_ACTIVE
                
                # Get period timestamps safely
                period_start = sub_data.get('current_period_start')
                period_end = sub_data.get('current_period_end')
                
                if period_start:
                    subscription.current_period_start = datetime.fromtimestamp(
                        period_start, tz=timezone.utc
                    )
                if period_end:
                    subscription.current_period_end = datetime.fromtimestamp(
                        period_end, tz=timezone.utc
                    )
                else:
                    # Fallback: set period to 1 year from now
                    from datetime import timedelta
                    subscription.current_period_start = timezone.now()
                    subscription.current_period_end = timezone.now() + timedelta(days=365)
                
                subscription.save()
                
                return Response({
                    'synced': True,
                    'status': subscription.status,
                    'is_valid': subscription.is_valid,
                    'current_period_end': subscription.current_period_end,
                })
            else:
                return Response({
                    'synced': False,
                    'message': 'No active subscription found in Stripe'
                })
                
        except stripe.error.StripeError as e:
            return Response(
                {'error': str(e)},
                status=status.HTTP_400_BAD_REQUEST
            )


@csrf_exempt
@require_POST
def stripe_webhook(request):
    """Handle Stripe webhook events."""
    payload = request.body
    sig_header = request.META.get('HTTP_STRIPE_SIGNATURE', '')
    webhook_secret = getattr(settings, 'STRIPE_WEBHOOK_SECRET', '')
    
    try:
        event = stripe.Webhook.construct_event(
            payload, sig_header, webhook_secret
        )
    except ValueError:
        return HttpResponse(status=400)
    except stripe.error.SignatureVerificationError:
        return HttpResponse(status=400)
    
    event_type = event['type']
    data = event['data']['object']
    
    # Handle subscription events
    if event_type == 'checkout.session.completed':
        handle_checkout_completed(data)
    elif event_type == 'customer.subscription.updated':
        handle_subscription_updated(data)
    elif event_type == 'customer.subscription.deleted':
        handle_subscription_deleted(data)
    elif event_type == 'invoice.payment_failed':
        handle_payment_failed(data)
    
    return HttpResponse(status=200)


def handle_checkout_completed(session):
    """Handle successful checkout - activate subscription."""
    customer_id = session.get('customer')
    subscription_id = session.get('subscription')
    
    if not customer_id:
        return
    
    try:
        subscription = Subscription.objects.get(stripe_customer_id=customer_id)
        subscription.stripe_subscription_id = subscription_id
        subscription.status = Subscription.STATUS_ACTIVE
        
        # Get subscription details from Stripe
        if subscription_id:
            stripe_sub = stripe.Subscription.retrieve(subscription_id)
            subscription.current_period_start = datetime.fromtimestamp(
                stripe_sub.current_period_start, tz=timezone.utc
            )
            subscription.current_period_end = datetime.fromtimestamp(
                stripe_sub.current_period_end, tz=timezone.utc
            )
        
        subscription.save()
    except Subscription.DoesNotExist:
        pass


def handle_subscription_updated(stripe_sub):
    """Handle subscription updates from Stripe."""
    customer_id = stripe_sub.get('customer')
    
    try:
        subscription = Subscription.objects.get(stripe_customer_id=customer_id)
        subscription.stripe_subscription_id = stripe_sub.get('id')
        
        # Map Stripe status to our status
        stripe_status = stripe_sub.get('status')
        if stripe_status == 'active':
            subscription.status = Subscription.STATUS_ACTIVE
        elif stripe_status == 'past_due':
            subscription.status = Subscription.STATUS_PAST_DUE
        elif stripe_status in ['canceled', 'cancelled']:
            subscription.status = Subscription.STATUS_CANCELLED
        elif stripe_status in ['unpaid', 'incomplete_expired']:
            subscription.status = Subscription.STATUS_EXPIRED
        
        # Update period dates
        subscription.current_period_start = datetime.fromtimestamp(
            stripe_sub.get('current_period_start'), tz=timezone.utc
        )
        subscription.current_period_end = datetime.fromtimestamp(
            stripe_sub.get('current_period_end'), tz=timezone.utc
        )
        
        if stripe_sub.get('canceled_at'):
            subscription.cancelled_at = datetime.fromtimestamp(
                stripe_sub.get('canceled_at'), tz=timezone.utc
            )
        
        subscription.save()
    except Subscription.DoesNotExist:
        pass


def handle_subscription_deleted(stripe_sub):
    """Handle subscription cancellation/deletion."""
    customer_id = stripe_sub.get('customer')
    
    try:
        subscription = Subscription.objects.get(stripe_customer_id=customer_id)
        subscription.status = Subscription.STATUS_EXPIRED
        subscription.cancelled_at = timezone.now()
        subscription.save()
    except Subscription.DoesNotExist:
        pass


def handle_payment_failed(invoice):
    """Handle failed payment - mark as past due."""
    customer_id = invoice.get('customer')
    
    try:
        subscription = Subscription.objects.get(stripe_customer_id=customer_id)
        subscription.status = Subscription.STATUS_PAST_DUE
        subscription.save()
    except Subscription.DoesNotExist:
        pass
