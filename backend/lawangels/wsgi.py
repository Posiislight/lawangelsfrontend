"""
WSGI config for lawangels project.

It exposes the WSGI callable as a module-level variable named ``application``.

For more information on this file, see
https://docs.djangoproject.com/en/5.2/howto/deployment/wsgi/
"""

import os

from django.core.wsgi import get_wsgi_application

# Use environment variable to switch between settings files
# On Render (has DATABASE_URL), default to production settings
# Otherwise default to development settings
if os.getenv('DATABASE_URL') and not os.getenv('DJANGO_SETTINGS_MODULE'):
    # Running on Render with DATABASE_URL set - use production settings
    os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'settings_production')
else:
    # Use explicit env var or fall back to development settings
    settings_module = os.getenv('DJANGO_SETTINGS_MODULE', 'lawangels.settings')
    os.environ.setdefault('DJANGO_SETTINGS_MODULE', settings_module)

application = get_wsgi_application()
