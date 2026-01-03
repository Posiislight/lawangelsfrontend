"""
Health check endpoint for warm-up pings and monitoring.
"""
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny
from rest_framework.response import Response


@api_view(['GET'])
@permission_classes([AllowAny])
def health_check(request):
    """
    Simple health check endpoint.
    Used by:
    - Frontend warm-up service to wake backend from cold start
    - Render's health checks
    - UptimeRobot or similar monitoring
    
    Returns 200 OK if server is running.
    """
    return Response({'status': 'ok'})
