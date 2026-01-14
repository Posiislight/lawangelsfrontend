from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import AllowAny, IsAuthenticated
from django.contrib.auth.models import User
from django.http import JsonResponse
from django.views.decorators.csrf import ensure_csrf_cookie
from django.middleware.csrf import get_token
from django.contrib.auth.tokens import default_token_generator
from django.utils.http import urlsafe_base64_encode, urlsafe_base64_decode
from django.utils.encoding import force_bytes, force_str
from django.core.mail import send_mail
from django.conf import settings
from .serializers import RegisterSerializer, LoginSerializer, UserSerializer
import logging
import os

logger = logging.getLogger(__name__)


@ensure_csrf_cookie
def get_csrf_token(request):
    """
    GET /api/csrf/ -> sets the csrftoken cookie and returns token
    Explicitly sets the CSRF cookie even for anonymous users
    """
    return JsonResponse({'csrfToken': get_token(request)})


class AuthViewSet(viewsets.ViewSet):
    permission_classes = [AllowAny]

    @action(detail=False, methods=['post'], permission_classes=[AllowAny])
    def register(self, request):
        """Register a new user"""
        try:
            serializer = RegisterSerializer(data=request.data)
            if serializer.is_valid():
                user = serializer.save()
                logger.info(f"User registered successfully: {user.username}")
                return Response(
                    {
                        'success': True,
                        'user': UserSerializer(user).data,
                        'message': 'User registered successfully. Please login.'
                    },
                    status=status.HTTP_201_CREATED
                )
            logger.warning(f"Registration validation failed: {serializer.errors}")
            return Response(
                {
                    'success': False,
                    'errors': serializer.errors,
                    'message': 'Registration failed. Please check your input.'
                },
                status=status.HTTP_400_BAD_REQUEST
            )
        except Exception as e:
            logger.error(f"Registration error: {str(e)}")
            return Response(
                {
                    'success': False,
                    'message': 'An error occurred during registration.',
                    'error': str(e)
                },
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

    @action(detail=False, methods=['post'], permission_classes=[AllowAny])
    def login(self, request):
        """Login user and return user data"""
        try:
            serializer = LoginSerializer(data=request.data)
            if serializer.is_valid():
                user = serializer.validated_data['user']
                # Create session for authenticated user
                from django.contrib.auth import login
                login(request, user)
                logger.info(f"User logged in successfully: {user.username}")
                return Response(
                    {
                        'success': True,
                        'user': UserSerializer(user).data,
                        'message': 'Login successful'
                    },
                    status=status.HTTP_200_OK
                )
            logger.warning(f"Login validation failed: {serializer.errors}")
            return Response(
                {
                    'success': False,
                    'errors': serializer.errors,
                    'message': 'Invalid username or password.'
                },
                status=status.HTTP_401_UNAUTHORIZED
            )
        except Exception as e:
            logger.error(f"Login error: {str(e)}")
            return Response(
                {
                    'success': False,
                    'message': 'An error occurred during login.',
                    'error': str(e)
                },
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

    @action(detail=False, methods=['post'], permission_classes=[IsAuthenticated])
    def logout(self, request):
        """Logout user"""
        try:
            from django.contrib.auth import logout
            user_id = request.user.id
            logout(request)
            logger.info(f"User logged out: {user_id}")
            return Response(
                {
                    'success': True,
                    'message': 'Logout successful'
                },
                status=status.HTTP_200_OK
            )
        except Exception as e:
            logger.error(f"Logout error: {str(e)}")
            return Response(
                {
                    'success': False,
                    'message': 'An error occurred during logout.',
                    'error': str(e)
                },
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

    @action(detail=False, methods=['get'], permission_classes=[AllowAny])
    def me(self, request):
        """Get current user info"""
        try:
            if request.user.is_authenticated:
                logger.debug(f"Current user info requested: {request.user.username}")
                return Response(
                    {
                        'success': True,
                        'user': UserSerializer(request.user).data,
                        'isAuthenticated': True
                    },
                    status=status.HTTP_200_OK
                )
            return Response(
                {
                    'success': True,
                    'user': None,
                    'isAuthenticated': False
                },
                status=status.HTTP_200_OK
            )
        except Exception as e:
            logger.error(f"Get user info error: {str(e)}")
            return Response(
                {
                    'success': False,
                    'message': 'An error occurred.',
                    'error': str(e)
                },
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

    @action(detail=False, methods=['post'], permission_classes=[AllowAny])
    def forgot_password(self, request):
        """
        Send password reset email.
        POST /api/auth/forgot_password/
        Body: { "email": "user@example.com" }
        """
        try:
            email = request.data.get('email', '').strip().lower()
            
            if not email:
                return Response(
                    {'success': False, 'message': 'Email is required.'},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            # Find user by email
            try:
                user = User.objects.get(email__iexact=email)
            except User.DoesNotExist:
                # Don't reveal if email exists - return success anyway
                logger.info(f"Password reset requested for non-existent email: {email}")
                return Response(
                    {
                        'success': True,
                        'message': 'If an account with that email exists, we sent a password reset link.'
                    },
                    status=status.HTTP_200_OK
                )
            
            # Generate password reset token
            token = default_token_generator.make_token(user)
            uid = urlsafe_base64_encode(force_bytes(user.pk))
            
            # Build reset URL
            frontend_url = os.environ.get('FRONTEND_URL', 'https://lawangelsuk.com')
            reset_url = f"{frontend_url}/reset-password?uid={uid}&token={token}"
            
            # Send email
            subject = 'Reset Your Law Angels Password'
            message = f"""Hi {user.first_name or user.username},

You requested to reset your password for Law Angels.

Click the link below to set a new password:
{reset_url}

This link will expire in 24 hours.

If you didn't request this, you can safely ignore this email.

Best regards,
The Law Angels Team
"""
            html_message = f"""
<!DOCTYPE html>
<html>
<head>
    <style>
        body {{ font-family: 'Segoe UI', Arial, sans-serif; line-height: 1.6; color: #333; }}
        .container {{ max-width: 600px; margin: 0 auto; padding: 20px; }}
        .header {{ text-align: center; padding: 20px 0; }}
        .logo {{ font-size: 24px; font-weight: bold; color: #0089FF; }}
        .button {{ display: inline-block; background: #0089FF; color: white; padding: 12px 30px; text-decoration: none; border-radius: 25px; margin: 20px 0; }}
        .footer {{ margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee; font-size: 12px; color: #666; }}
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <div class="logo">👼 Law Angels</div>
        </div>
        <h2>Reset Your Password</h2>
        <p>Hi {user.first_name or user.username},</p>
        <p>You requested to reset your password for Law Angels. Click the button below to set a new password:</p>
        <p style="text-align: center;">
            <a href="{reset_url}" class="button">Reset Password</a>
        </p>
        <p>Or copy this link: <br><small>{reset_url}</small></p>
        <p>This link will expire in <strong>24 hours</strong>.</p>
        <p>If you didn't request this, you can safely ignore this email.</p>
        <div class="footer">
            <p>Best regards,<br>The Law Angels Team</p>
        </div>
    </div>
</body>
</html>
"""
            
            try:
                send_mail(
                    subject=subject,
                    message=message,
                    from_email=settings.DEFAULT_FROM_EMAIL,
                    recipient_list=[email],
                    html_message=html_message,
                    fail_silently=False,
                )
                logger.info(f"Password reset email sent to: {email}")
            except Exception as mail_error:
                logger.error(f"Failed to send password reset email: {str(mail_error)}")
                return Response(
                    {'success': False, 'message': 'Failed to send email. Please try again later.'},
                    status=status.HTTP_500_INTERNAL_SERVER_ERROR
                )
            
            return Response(
                {
                    'success': True,
                    'message': 'If an account with that email exists, we sent a password reset link.'
                },
                status=status.HTTP_200_OK
            )
            
        except Exception as e:
            logger.error(f"Forgot password error: {str(e)}")
            return Response(
                {'success': False, 'message': 'An error occurred. Please try again.'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

    @action(detail=False, methods=['post'], permission_classes=[AllowAny])
    def reset_password(self, request):
        """
        Reset password with token.
        POST /api/auth/reset_password/
        Body: { "uid": "...", "token": "...", "password": "...", "password2": "..." }
        """
        try:
            uid = request.data.get('uid')
            token = request.data.get('token')
            password = request.data.get('password')
            password2 = request.data.get('password2')
            
            # Validate inputs
            if not all([uid, token, password, password2]):
                return Response(
                    {'success': False, 'message': 'All fields are required.'},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            if password != password2:
                return Response(
                    {'success': False, 'message': 'Passwords do not match.'},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            if len(password) < 8:
                return Response(
                    {'success': False, 'message': 'Password must be at least 8 characters.'},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            # Decode uid and get user
            try:
                user_id = force_str(urlsafe_base64_decode(uid))
                user = User.objects.get(pk=user_id)
            except (TypeError, ValueError, OverflowError, User.DoesNotExist):
                return Response(
                    {'success': False, 'message': 'Invalid reset link.'},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            # Validate token
            if not default_token_generator.check_token(user, token):
                return Response(
                    {'success': False, 'message': 'Reset link has expired or is invalid.'},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            # Set new password
            user.set_password(password)
            user.save()
            
            logger.info(f"Password reset successful for user: {user.username}")
            
            return Response(
                {
                    'success': True,
                    'message': 'Password has been reset successfully. You can now login with your new password.'
                },
                status=status.HTTP_200_OK
            )
            
        except Exception as e:
            logger.error(f"Reset password error: {str(e)}")
            return Response(
                {'success': False, 'message': 'An error occurred. Please try again.'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

