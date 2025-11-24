"""
Enhanced request/response logging with model data tracking
Logs incoming requests, which models are accessed, and outgoing responses
"""

import logging
import json
import time
from typing import Dict, List, Any, Optional
from django.http import HttpRequest, HttpResponse
from django.db import connection
from django.utils.decorators import decorator_from_middleware
from django.conf import settings
from functools import wraps
import traceback

# Configure logger
logger = logging.getLogger('quiz.requests')


class RequestContext:
    """Thread-safe context for tracking request-specific data"""
    
    def __init__(self):
        self.reset()
    
    def reset(self):
        self.start_time = None
        self.models_accessed: Dict[str, List[Dict]] = {}
        self.initial_query_count = 0
        self.final_query_count = 0
        self.request_method = None
        self.request_path = None
        self.user_id = None
        self.user_username = None
    
    def add_model_access(self, model_name: str, action: str, pk: Optional[int] = None, 
                        data: Optional[Dict] = None, count: Optional[int] = None):
        """Record model access during request"""
        if model_name not in self.models_accessed:
            self.models_accessed[model_name] = []
        
        access_info = {
            'action': action,  # CREATE, READ, UPDATE, DELETE, LIST
            'pk': pk,
            'count': count,  # For LIST operations
            'fields_touched': list(data.keys()) if data else [],
        }
        self.models_accessed[model_name].append(access_info)
    
    def get_model_summary(self) -> str:
        """Get formatted model access summary"""
        if not self.models_accessed:
            return "No models accessed"
        
        summary_lines = []
        for model_name, accesses in self.models_accessed.items():
            actions = {}
            for access in accesses:
                action = access['action']
                actions[action] = actions.get(action, 0) + 1
            
            action_str = ', '.join([f"{action}({count})" for action, count in actions.items()])
            summary_lines.append(f"  {model_name}: {action_str}")
        
        return '\n'.join(summary_lines)


# Global request context
_request_context = RequestContext()


def get_request_context() -> RequestContext:
    """Get current request context"""
    return _request_context


class DetailedRequestLoggingMiddleware:
    """
    Middleware to log all HTTP requests and responses with model data access tracking
    
    Output format:
    [22/Nov/2025 13:02:34] "POST /api/exam-attempts/ HTTP/1.1" 201 - 145ms - user:john - queries:8
    Models: quiz.ExamAttempt: CREATE(1), quiz.Question: LIST(40)
    """
    
    def __init__(self, get_response):
        self.get_response = get_response
    
    def __call__(self, request: HttpRequest) -> HttpResponse:
        # Initialize context
        _request_context.reset()
        _request_context.start_time = time.time()
        _request_context.request_method = request.method
        _request_context.request_path = request.path
        _request_context.user_id = request.user.id if request.user.is_authenticated else None
        _request_context.user_username = request.user.username if request.user.is_authenticated else 'anonymous'
        
        # Get initial query count
        _request_context.initial_query_count = len(connection.queries)
        
        # Log incoming request
        self._log_request_start(request)
        
        try:
            response = self.get_response(request)
            status_code = response.status_code
        except Exception as e:
            # Log error
            duration_ms = (time.time() - _request_context.start_time) * 1000
            query_count = len(connection.queries) - _request_context.initial_query_count
            
            logger.error(
                f"[{_request_context.request_method}] {_request_context.request_path} - "
                f"ERROR ({type(e).__name__}) - {duration_ms:.2f}ms - "
                f"user:{_request_context.user_username} - queries:{query_count}",
                exc_info=True,
                extra={
                    'request_method': request.method,
                    'request_path': request.path,
                    'user_id': _request_context.user_id,
                    'user_username': _request_context.user_username,
                    'error_type': type(e).__name__,
                    'error_message': str(e),
                    'models_accessed': _request_context.models_accessed,
                    'query_count': query_count,
                }
            )
            raise
        
        # Log response with model data
        self._log_request_end(request, response)
        
        return response
    
    def _log_request_start(self, request: HttpRequest):
        """Log incoming request details"""
        body_preview = ""
        if request.method in ['POST', 'PUT', 'PATCH']:
            try:
                if hasattr(request, 'body'):
                    body_str = request.body.decode('utf-8')
                    body_data = json.loads(body_str)
                    # Get keys only, not full data
                    body_preview = f" [data keys: {list(body_data.keys())}]"
            except:
                pass
        
        logger.info(
            f"[{request.method}] {request.path}{body_preview}",
            extra={
                'request_method': request.method,
                'request_path': request.path,
                'user_id': _request_context.user_id,
                'user_username': _request_context.user_username,
                'ip_address': self._get_client_ip(request),
            }
        )
    
    def _log_request_end(self, request: HttpRequest, response: HttpResponse):
        """Log response with model data access info"""
        duration_ms = (time.time() - _request_context.start_time) * 1000
        query_count = len(connection.queries) - _request_context.initial_query_count
        _request_context.final_query_count = query_count
        
        # Main log line
        status_code = response.status_code
        status_indicator = "OK" if 200 <= status_code < 300 else "ERR" if status_code >= 400 else "---"
        
        main_log = (
            f"[{_request_context.request_method}] {_request_context.request_path} - "
            f"{status_code} {status_indicator} - {duration_ms:.2f}ms - "
            f"user:{_request_context.user_username} - queries:{query_count}"
        )
        
        # Log level based on status code
        if status_code >= 500:
            log_func = logger.error
        elif status_code >= 400:
            log_func = logger.warning
        else:
            log_func = logger.info
        
        log_func(
            main_log,
            extra={
                'request_method': request.method,
                'request_path': request.path,
                'status_code': status_code,
                'user_id': _request_context.user_id,
                'user_username': _request_context.user_username,
                'duration_ms': duration_ms,
                'query_count': query_count,
                'models_accessed': _request_context.models_accessed,
            }
        )
        
        # Log model access if any
        if _request_context.models_accessed:
            model_summary = _request_context.get_model_summary()
            logger.info(
                f"  Models accessed:\n{model_summary}",
                extra={
                    'models_accessed': _request_context.models_accessed,
                }
            )
    
    @staticmethod
    def _get_client_ip(request: HttpRequest) -> str:
        """Extract client IP from request"""
        x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')
        if x_forwarded_for:
            return x_forwarded_for.split(',')[0].strip()
        return request.META.get('REMOTE_ADDR', 'unknown')


def log_model_access(model_name: str):
    """
    Decorator to log model access in serializers
    
    Usage:
        @log_model_access('quiz.Question')
        def get_queryset(self):
            return Question.objects.all()
    """
    def decorator(func):
        @wraps(func)
        def wrapper(*args, **kwargs):
            result = func(*args, **kwargs)
            
            # Determine action type
            if hasattr(result, 'model'):  # QuerySet
                count = result.count() if hasattr(result, 'count') else len(result)
                action = 'LIST'
                _request_context.add_model_access(model_name, action, count=count)
            elif hasattr(result, 'pk'):  # Single instance
                action = 'READ'
                _request_context.add_model_access(model_name, action, pk=result.pk)
            
            return result
        return wrapper
    return decorator


def log_model_create(model_class):
    """
    Log model creation
    
    Usage in signals or models:
        from django.db.models.signals import post_save
        
        @receiver(post_save, sender=Question)
        def log_question_create(sender, instance, created, **kwargs):
            if created:
                log_model_create(Question)
    """
    model_name = f"{model_class._meta.app_label}.{model_class.__name__}"
    _request_context.add_model_access(model_name, 'CREATE')


def log_model_update(model_class, pk: int, changed_fields: Dict = None):
    """Log model update with changed fields"""
    model_name = f"{model_class._meta.app_label}.{model_class.__name__}"
    _request_context.add_model_access(model_name, 'UPDATE', pk=pk, data=changed_fields)


def log_model_delete(model_class, pk: int):
    """Log model deletion"""
    model_name = f"{model_class._meta.app_label}.{model_class.__name__}"
    _request_context.add_model_access(model_name, 'DELETE', pk=pk)


def log_queryset_access(queryset, action: str = 'LIST'):
    """
    Log queryset access
    
    Usage:
        questions = Question.objects.filter(exam_id=1)
        log_queryset_access(questions, 'LIST')
    """
    model = queryset.model
    model_name = f"{model._meta.app_label}.{model.__name__}"
    count = queryset.count()
    _request_context.add_model_access(model_name, action, count=count)


class ViewLoggingMixin:
    """Mixin for DRF views to automatically log model access"""
    
    def get_queryset(self):
        """Override to log queryset access"""
        queryset = super().get_queryset()
        
        # Log the access
        model = queryset.model
        model_name = f"{model._meta.app_label}.{model.__name__}"
        
        # Determine action based on view action
        action = 'LIST'
        if hasattr(self, 'action'):
            if self.action == 'retrieve':
                action = 'READ'
            elif self.action == 'create':
                action = 'CREATE'
            elif self.action in ['update', 'partial_update']:
                action = 'UPDATE'
            elif self.action == 'destroy':
                action = 'DELETE'
        
        _request_context.add_model_access(model_name, action)
        
        return queryset
    
    def perform_create(self, serializer):
        """Override to log creation"""
        instance = serializer.save()
        model = instance.__class__
        model_name = f"{model._meta.app_label}.{model.__name__}"
        _request_context.add_model_access(model_name, 'CREATE', pk=instance.pk)
    
    def perform_update(self, serializer):
        """Override to log update"""
        instance = serializer.save()
        model = instance.__class__
        model_name = f"{model._meta.app_label}.{model.__name__}"
        changed_fields = set(serializer.validated_data.keys())
        _request_context.add_model_access(model_name, 'UPDATE', pk=instance.pk, 
                                         data=dict(zip(changed_fields, [None] * len(changed_fields))))
    
    def perform_destroy(self, instance):
        """Override to log deletion"""
        model = instance.__class__
        model_name = f"{model._meta.app_label}.{model.__name__}"
        pk = instance.pk
        instance.delete()
        _request_context.add_model_access(model_name, 'DELETE', pk=pk)
