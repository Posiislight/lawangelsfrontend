# Gunicorn configuration for Render deployment
# Place this in the backend/lawangels directory or root

import os
from multiprocessing import cpu_count

# Server socket
bind = f"0.0.0.0:{os.getenv('PORT', '8000')}"
backlog = 2048

# Worker processes
# For Render free tier, use fewer workers (1-2)
# Formula for production: (2 × CPU) + 1, but capped at resources
workers = int(os.getenv('GUNICORN_WORKERS', 2))
worker_class = 'sync'  # Use sync for Django (faster than async for most cases)
worker_connections = 1000
timeout = 30
keepalive = 2

# Server mechanics
daemon = False
pidfile = None
umask = 0
user = None
group = None
tmp_upload_dir = None

# Logging
accesslog = '-'  # Log to stdout (Render captures this)
errorlog = '-'   # Log errors to stderr
loglevel = os.getenv('LOG_LEVEL', 'info')
access_log_format = '%(h)s %(l)s %(u)s %(t)s "%(r)s" %(s)s %(b)s "%(f)s" "%(a)s" %(D)s'

# Process naming
proc_name = 'lawangels'

# Server hooks
def on_starting(server):
    """Called before the master process is initialized."""
    print(f"Starting Gunicorn with {workers} workers")

def when_ready(server):
    """Called just after the server is started."""
    print("Gunicorn server is ready. Spawning workers")

# SSL/TLS (handled by Render reverse proxy, not needed here)
# keyfile = None
# certfile = None
# ssl_version = SSL_VERSION_TLS
# cert_reqs = ssl.CERT_NONE
# ca_certs = None
# suppress_ragged_eof = True

# Application
wsgi_app = 'lawangels.wsgi:application'
