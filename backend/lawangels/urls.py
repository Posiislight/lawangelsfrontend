"""
URL configuration for lawangels project.

The `urlpatterns` list routes URLs to views. For more information please see:
    https://docs.djangoproject.com/en/5.2/topics/http/urls/
"""
from django.contrib import admin
from django.urls import path, include

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/', include('quiz.urls')),
    path('api/', include('auth_app.urls')),
    path('api-auth/', include('rest_framework.urls')),
]
