"""
WSGI config for lawangels project.

It exposes the WSGI callable as a module-level variable named ``application``.

For more information on this file, see
https://docs.djangoproject.com/en/5.2/howto/deployment/wsgi/
"""

import os

from django.core.wsgi import get_wsgi_application

# Use environment variable to switch between settings files
# Default to development settings, but allow production to override
settings_module = os.getenv('DJANGO_SETTINGS_MODULE', 'lawangels.settings')
os.environ.setdefault('DJANGO_SETTINGS_MODULE', settings_module)

application = get_wsgi_application()
