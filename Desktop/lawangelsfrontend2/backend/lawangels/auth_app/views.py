from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import AllowAny, IsAuthenticated
from django.contrib.auth.models import User
from .serializers import RegisterSerializer, LoginSerializer, UserSerializer
import logging

logger = logging.getLogger(__name__)


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
