import time
import logging
from django.utils.deprecation import MiddlewareMixin

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
