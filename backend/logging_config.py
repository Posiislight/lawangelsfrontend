"""
Logging configuration for Django application
Add this to your settings.py LOGGING configuration
"""

LOGGING_CONFIG = {
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
        'json': {
            '()': 'pythonjsonlogger.jsonlogger.JsonFormatter',
            'format': '%(asctime)s %(name)s %(levelname)s %(message)s'
        }
    },
    'filters': {
        'require_debug_true': {
            '()': 'django.utils.log.RequireDebugTrue',
        },
        'require_debug_false': {
            '()': 'django.utils.log.RequireDebugFalse',
        },
    },
    'handlers': {
        'console': {
            'level': 'DEBUG',
            'class': 'logging.StreamHandler',
            'formatter': 'simple',
        },
        'console_verbose': {
            'level': 'DEBUG',
            'class': 'logging.StreamHandler',
            'formatter': 'verbose',
        },
        'file': {
            'level': 'INFO',
            'class': 'logging.handlers.RotatingFileHandler',
            'filename': 'logs/django.log',
            'maxBytes': 1024 * 1024 * 10,  # 10 MB
            'backupCount': 5,
            'formatter': 'verbose',
        },
        'request_file': {
            'level': 'INFO',
            'class': 'logging.handlers.RotatingFileHandler',
            'filename': 'logs/requests.log',
            'maxBytes': 1024 * 1024 * 10,  # 10 MB
            'backupCount': 5,
            'formatter': 'verbose',
        },
        'error_file': {
            'level': 'ERROR',
            'class': 'logging.handlers.RotatingFileHandler',
            'filename': 'logs/errors.log',
            'maxBytes': 1024 * 1024 * 10,  # 10 MB
            'backupCount': 5,
            'formatter': 'verbose',
        },
    },
    'loggers': {
        'django': {
            'handlers': ['console_verbose', 'file'],
            'level': 'INFO',
            'propagate': False,
        },
        'quiz': {
            'handlers': ['console_verbose', 'file'],
            'level': 'DEBUG',
            'propagate': False,
        },
        'quiz.requests': {
            'handlers': ['console', 'request_file'],
            'level': 'INFO',
            'propagate': False,
        },
        'quiz.errors': {
            'handlers': ['console_verbose', 'error_file'],
            'level': 'ERROR',
            'propagate': False,
        },
        'django.db.backends': {
            'handlers': ['console_verbose'],
            'level': 'DEBUG',
            'propagate': False,
        },
    },
}
