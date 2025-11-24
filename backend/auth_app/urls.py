from django.urls import path
from rest_framework.routers import DefaultRouter
from .views import AuthViewSet, get_csrf_token

router = DefaultRouter()
router.register(r'auth', AuthViewSet, basename='auth')

urlpatterns = [
    path('csrf/', get_csrf_token, name='get-csrf'),
] + router.urls
