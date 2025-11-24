"""
Django settings for lawangels project - PRODUCTION READY

This is the production-ready settings file with Supabase PostgreSQL integration
and dynamic environment-based configuration.

For development, use the default settings.py
"""

import os
from pathlib import Path
from dotenv import load_dotenv

# Build paths inside the project like this: BASE_DIR / 'subdir'.
BASE_DIR = Path(__file__).resolve().parent.parent

# Load environment variables from .env file
load_dotenv(BASE_DIR.parent / '.env')

# ============================================================================
# SECURITY SETTINGS - PRODUCTION
# ============================================================================

# SECURITY WARNING: keep the secret key used in production secret!
# Generate a new SECRET_KEY and set it in environment variables
SECRET_KEY = os.getenv(
    'SECRET_KEY',
    'django-insecure-jjukq=b0!nx!wt%v89aan8**(kloh)ow88=d$8=$3i-6u98mzp'  # MUST be overridden in production
)

# SECURITY WARNING: don't run with debug turned on in production!
DEBUG = os.getenv('DEBUG', 'False') == 'True'

# Allowed hosts - can be set via environment variable or use defaults
ALLOWED_HOSTS_STR = os.getenv('ALLOWED_HOSTS', 'quiz-backend.onrender.com,localhost,127.0.0.1')
ALLOWED_HOSTS = [host.strip() for host in ALLOWED_HOSTS_STR.split(',')]

# ============================================================================
# FRONTEND CONFIGURATION - DYNAMIC CORS SETUP
# ============================================================================

# Frontend URLs - set via environment variables for flexibility
FRONTEND_URL_PRODUCTION = os.getenv('FRONTEND_URL_PRODUCTION', 'https://lawangelsfrontend-wy6w.vercel.app')
FRONTEND_URL_STAGING = os.getenv('FRONTEND_URL_STAGING', 'https://lawangelsfrontend-staging.vercel.app')
FRONTEND_URL_DEVELOPMENT = os.getenv('FRONTEND_URL_DEVELOPMENT', 'http://localhost:5173,http://localhost:3000,http://127.0.0.1:5173,http://127.0.0.1:3000')

# Build CORS allowed origins - all frontend URLs combined
CORS_ALLOWED_ORIGINS = [
    FRONTEND_URL_PRODUCTION,
    FRONTEND_URL_STAGING,
]

# Add development URLs if in DEBUG mode
if DEBUG:
    dev_urls = [url.strip() for url in FRONTEND_URL_DEVELOPMENT.split(',')]
    CORS_ALLOWED_ORIGINS.extend(dev_urls)

# CSRF trusted origins - same as CORS for simplicity
CSRF_TRUSTED_ORIGINS = CORS_ALLOWED_ORIGINS.copy()

CORS_ALLOW_CREDENTIALS = True

# CSRF Configuration - Allow cross-domain requests with credentials
CSRF_COOKIE_SECURE = not DEBUG  # HTTPS only in production
CSRF_COOKIE_HTTPONLY = False  # Allow JavaScript access for API requests
CSRF_COOKIE_SAMESITE = 'Lax'  # Allow requests from cross-site frontend

# Session cookies - secure in production
SESSION_COOKIE_SECURE = not DEBUG  # HTTPS only in production
SESSION_COOKIE_HTTPONLY = True  # Never expose to JavaScript
SESSION_COOKIE_SAMESITE = 'Lax'

# ============================================================================
# DATABASE - SUPABASE POSTGRESQL
# ============================================================================

# DATABASE_URL format: postgresql://user:password@host:port/database
# Example: postgresql://postgres.xxxxx:password@aws-1-eu-west-2.pooler.supabase.com:5432/postgres

DATABASE_URL = os.getenv('DATABASE_URL')

if DATABASE_URL:
    # Parse DATABASE_URL if provided (for Render automatic setup)
    import dj_database_url
    DATABASES = {
        'default': dj_database_url.config(
            default=DATABASE_URL,
            conn_max_age=600,
            conn_health_checks=True,
        )
    }
    # Add SSL requirement for Supabase
    DATABASES['default']['OPTIONS'] = {
        'sslmode': 'require',
        'connect_timeout': 30,
        'keepalives': 1,
        'keepalives_idle': 30,
    }
else:
    # Fallback to individual environment variables
    DATABASES = {
        'default': {
            'ENGINE': 'django.db.backends.postgresql',
            'NAME': os.getenv('DB_NAME', 'postgres'),
            'USER': os.getenv('DB_USER', 'postgres.kfviwdoyiknsnnnadkpe'),
            'PASSWORD': os.getenv('DB_PASSWORD'),
            'HOST': os.getenv('DB_HOST', 'aws-1-eu-west-2.pooler.supabase.com'),
            'PORT': os.getenv('DB_PORT', '5432'),
            'CONN_MAX_AGE': 600,
            'CONN_HEALTH_CHECKS': True,
            'OPTIONS': {
                'sslmode': 'require',
                'connect_timeout': 30,
                'keepalives': 1,
                'keepalives_idle': 30,
                'statement_timeout': 30000,  # 30 seconds
            }
        }
    }

# ============================================================================
# CACHE CONFIGURATION - PRODUCTION
# ============================================================================

# Use in-memory cache for development, Redis for production if available
CACHE_BACKEND = os.getenv('CACHE_BACKEND', 'django.core.cache.backends.locmem.LocMemCache')

if CACHE_BACKEND == 'django.core.cache.backends.redis.RedisCache':
    CACHES = {
        'default': {
            'BACKEND': 'django.core.cache.backends.redis.RedisCache',
            'LOCATION': os.getenv('REDIS_URL', 'redis://127.0.0.1:6379/1'),
            'OPTIONS': {
                'CLIENT_CLASS': 'redis.StrictRedis',
            }
        }
    }
else:
    CACHES = {
        'default': {
            'BACKEND': 'django.core.cache.backends.locmem.LocMemCache',
            'LOCATION': 'lawangels-cache',
            'OPTIONS': {
                'MAX_ENTRIES': 1000
            }
        }
    }

# ============================================================================
# SESSION CONFIGURATION - USE CACHE TO REDUCE DB LOAD
# ============================================================================

SESSION_ENGINE = 'django.contrib.sessions.backends.cache'
SESSION_CACHE_ALIAS = 'default'
SESSION_COOKIE_AGE = 3600  # 1 hour
SESSION_EXPIRE_AT_BROWSER_CLOSE = True

# ============================================================================
# REST FRAMEWORK CONFIGURATION
# ============================================================================

REST_FRAMEWORK = {
    'DEFAULT_PAGINATION_CLASS': 'rest_framework.pagination.PageNumberPagination',
    'PAGE_SIZE': 10,
    'DEFAULT_FILTER_BACKENDS': [
        'rest_framework.filters.SearchFilter',
        'rest_framework.filters.OrderingFilter',
    ],
    'DEFAULT_PERMISSION_CLASSES': [
        'rest_framework.permissions.AllowAny',
    ],
    'DEFAULT_AUTHENTICATION_CLASSES': [
        'rest_framework.authentication.SessionAuthentication',
    ],
}

# ============================================================================
# APPLICATION DEFINITION
# ============================================================================

INSTALLED_APPS = [
    'django.contrib.admin',
    'django.contrib.auth',
    'django.contrib.contenttypes',
    'django.contrib.sessions',
    'django.contrib.messages',
    'django.contrib.staticfiles',
    
    # Third-party
    'rest_framework',
    'corsheaders',
    
    # Local
    'lawangels.quiz',
    'lawangels.auth_app',
]

MIDDLEWARE = [
    'django.middleware.security.SecurityMiddleware',
    # WhiteNoise for static files in production
    'whitenoise.middleware.WhiteNoiseMiddleware' if not DEBUG else 'django.contrib.staticfiles.finders.FileSystemFinder',
    'corsheaders.middleware.CorsMiddleware',
    'django.contrib.sessions.middleware.SessionMiddleware',
    'django.middleware.common.CommonMiddleware',
    'django.middleware.csrf.CsrfViewMiddleware',
    'django.contrib.auth.middleware.AuthenticationMiddleware',
    'django.contrib.messages.middleware.MessageMiddleware',
    'django.middleware.clickjacking.XFrameOptionsMiddleware',
    'lawangels.middleware.RequestTimingMiddleware',
    'lawangels.logging_utils.DetailedRequestLoggingMiddleware',
]

ROOT_URLCONF = 'lawangels.lawangels.urls'

TEMPLATES = [
    {
        'BACKEND': 'django.template.backends.django.DjangoTemplates',
        'DIRS': [],
        'APP_DIRS': True,
        'OPTIONS': {
            'context_processors': [
                'django.template.context_processors.request',
                'django.contrib.auth.context_processors.auth',
                'django.contrib.messages.context_processors.messages',
            ],
        },
    },
]

WSGI_APPLICATION = 'lawangels.wsgi.application'

# ============================================================================
# PASSWORD VALIDATION
# ============================================================================

AUTH_PASSWORD_VALIDATORS = [
    {
        'NAME': 'django.contrib.auth.password_validation.UserAttributeSimilarityValidator',
    },
    {
        'NAME': 'django.contrib.auth.password_validation.MinimumLengthValidator',
    },
    {
        'NAME': 'django.contrib.auth.password_validation.CommonPasswordValidator',
    },
    {
        'NAME': 'django.contrib.auth.password_validation.NumericPasswordValidator',
    },
]

# ============================================================================
# INTERNATIONALIZATION
# ============================================================================

LANGUAGE_CODE = 'en-us'
TIME_ZONE = os.getenv('TIME_ZONE', 'UTC')
USE_I18N = True
USE_TZ = True

# ============================================================================
# STATIC FILES & MEDIA
# ============================================================================

STATIC_URL = '/static/'
STATIC_ROOT = os.path.join(BASE_DIR, 'staticfiles')

# WhiteNoise configuration for efficient static file serving
STATICFILES_STORAGE = 'whitenoise.storage.CompressedManifestStaticFilesStorage' if not DEBUG else 'django.contrib.staticfiles.storage.StaticFilesStorage'

DEFAULT_AUTO_FIELD = 'django.db.models.BigAutoField'

# ============================================================================
# SECURITY HEADERS - PRODUCTION
# ============================================================================

if not DEBUG:
    # HTTPS enforcement
    SECURE_SSL_REDIRECT = True
    SESSION_COOKIE_SECURE = True
    CSRF_COOKIE_SECURE = True
    
    # HSTS - tell browsers to always use HTTPS
    SECURE_HSTS_SECONDS = 31536000  # 1 year
    SECURE_HSTS_INCLUDE_SUBDOMAINS = True
    SECURE_HSTS_PRELOAD = True
    
    # Other security headers
    SECURE_BROWSER_XSS_FILTER = True
    X_FRAME_OPTIONS = 'DENY'
    SECURE_CONTENT_SECURITY_POLICY = {
        'default-src': ("'self'",),
    }

# ============================================================================
# LOGGING CONFIGURATION - PRODUCTION
# ============================================================================

# Use console logging (stdout/stderr) for production environments
# Render captures all console output automatically
# This avoids file system issues on ephemeral file systems

LOGGING = {
    'version': 1,
    'disable_existing_loggers': False,
    'formatters': {
        'verbose': {
            'format': '[{asctime}] {levelname} [{name}] {message}',
            'style': '{',
            'datefmt': '%d/%b/%Y %H:%M:%S',
        },
        'simple': {
            'format': '[{asctime}] {levelname} {message}',
            'style': '{',
            'datefmt': '%d/%b/%Y %H:%M:%S',
        },
    },
    'handlers': {
        'console': {
            'level': 'INFO' if not DEBUG else 'DEBUG',
            'class': 'logging.StreamHandler',
            'formatter': 'verbose',
        },
    },
    'loggers': {
        'django': {
            'handlers': ['console'],
            'level': 'INFO',
            'propagate': False,
        },
        'quiz': {
            'handlers': ['console'],
            'level': 'DEBUG' if DEBUG else 'INFO',
            'propagate': False,
        },
        'quiz.requests': {
            'handlers': ['console'],
            'level': 'INFO',
            'propagate': False,
        },
    },
}
