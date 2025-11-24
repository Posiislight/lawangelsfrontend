#!/usr/bin/env python
"""
Local production settings verification
Tests Django settings file syntax and imports before pushing to Render
"""

import os
import sys

os.chdir('backend')
sys.path.insert(0, os.getcwd())

try:
    print("=" * 70)
    print("TESTING DJANGO PRODUCTION CONFIGURATION")
    print("=" * 70)
    
    # Test 1: Import dev settings
    print("\n✓ Testing dev settings import...")
    from lawangels import settings as dev_settings
    print("  ✅ Dev settings imported successfully!")
    
    # Test 2: Check INSTALLED_APPS
    print("\n✓ Checking INSTALLED_APPS...")
    print(f"  Apps configured: {dev_settings.INSTALLED_APPS[-2:]}")
    assert 'quiz' in dev_settings.INSTALLED_APPS, "quiz app not found!"
    assert 'auth_app' in dev_settings.INSTALLED_APPS, "auth_app not found!"
    print("  ✅ All required apps configured!")
    
    # Test 3: Check MIDDLEWARE
    print("\n✓ Checking MIDDLEWARE...")
    for middleware in dev_settings.MIDDLEWARE:
        if middleware.startswith('django.') or middleware.startswith('corsheaders.') or middleware.startswith('whitenoise.'):
            print(f"  ✓ {middleware}")
        elif middleware in ['middleware.RequestTimingMiddleware', 'logging_utils.DetailedRequestLoggingMiddleware']:
            print(f"  ✓ {middleware}")
        else:
            print(f"  ✗ {middleware} - INVALID")
            sys.exit(1)
    print("  ✅ All middleware paths valid!")
    
    # Test 4: Check ROOT_URLCONF
    print("\n✓ Checking URL configuration...")
    assert dev_settings.ROOT_URLCONF == 'lawangels.urls', f"Invalid ROOT_URLCONF: {dev_settings.ROOT_URLCONF}"
    print(f"  ✓ ROOT_URLCONF = {dev_settings.ROOT_URLCONF}")
    print("  ✅ URL configuration valid!")
    
    # Test 5: Load WSGI
    print("\n✓ Loading WSGI application...")
    os.environ['DJANGO_SETTINGS_MODULE'] = 'lawangels.settings'
    import django
    django.setup()
    from lawangels.wsgi import application
    print("  ✅ WSGI application loaded!")
    
    # Test 6: Check that manage.py can be called
    print("\n✓ Testing Django management commands...")
    from django.core.management import call_command
    call_command('check')
    print("  ✅ Django system check passed!")
    
    print("\n" + "=" * 70)
    print("✅ ALL CONFIGURATION TESTS PASSED!")
    print("Safe to push to Render.")
    print("=" * 70)
    
except Exception as e:
    print(f"\n❌ ERROR: {e}")
    import traceback
    traceback.print_exc()
    sys.exit(1)
