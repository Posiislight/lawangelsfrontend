import time
import logging
from django.utils.deprecation import MiddlewareMixin
from django.views.decorators.csrf import csrf_exempt
from django.http import HttpRequest

logger = logging.getLogger(__name__)


class RequestTimingMiddleware(MiddlewareMixin):
    """Middleware to log the time taken for each request."""

    def process_request(self, request):
        request._start_time = time.time()
        return None

    def process_response(self, request, response):
        if hasattr(request, '_start_time'):
            duration = (time.time() - request._start_time) * 1000  # Convert to milliseconds
            method = request.method
            path = request.path
            status = response.status_code
            
            log_message = f"[API] {method} {path} - {status} - {duration:.2f}ms"
            
            # Log slower requests at higher log level
            if duration > 500:
                logger.warning(log_message)
            else:
                logger.info(log_message)
        
        return response


class CSRFExemptAPIMiddleware(MiddlewareMixin):
    """
    Middleware to exempt API endpoints from CSRF validation.
    For API endpoints, we rely on session authentication + CORS.
    """
    
    # Paths that should be exempt from CSRF checks
    EXEMPT_PATHS = [
        '/api/',
    ]
    
    def process_request(self, request: HttpRequest):
        # Check if the request path starts with an exempt path
        for exempt_path in self.EXEMPT_PATHS:
            if request.path.startswith(exempt_path):
                # Mark request as CSRF exempt
                request._dont_enforce_csrf_checks = True
                logger.debug(f'[CSRF] Exempted {request.method} {request.path}')
                break
        return None

