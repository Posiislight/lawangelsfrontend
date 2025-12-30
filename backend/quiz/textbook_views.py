import os
import logging
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.http import FileResponse, Http404
from django.conf import settings

from .textbook_models import Textbook
from .textbook_serializers import TextbookSerializer, TextbookListSerializer

logger = logging.getLogger(__name__)


class TextbookViewSet(viewsets.ReadOnlyModelViewSet):
    """
    ViewSet for textbooks.
    
    Endpoints:
    - GET /textbooks/ - List all textbooks
    - GET /textbooks/{id}/ - Get textbook details
    - GET /textbooks/{id}/pdf/ - Download/stream PDF file
    """
    queryset = Textbook.objects.all()
    permission_classes = [IsAuthenticated]
    
    def get_serializer_class(self):
        if self.action == 'list':
            return TextbookListSerializer
        return TextbookSerializer
    
    def list(self, request):
        """List all textbooks, optionally filtered by category."""
        queryset = self.get_queryset()
        
        # Filter by category if provided
        category = request.query_params.get('category')
        if category and category.upper() in ['FLK1', 'FLK2', 'BOTH']:
            queryset = queryset.filter(category__in=[category.upper(), 'BOTH'])
        
        serializer = self.get_serializer(queryset, many=True)
        return Response(serializer.data)
    
    @action(detail=True, methods=['get'])
    def pdf(self, request, pk=None):
        """Stream or download the PDF file for a textbook."""
        try:
            textbook = self.get_object()
        except Textbook.DoesNotExist:
            raise Http404("Textbook not found")
        
        file_path = textbook.file_path
        
        if not os.path.exists(file_path):
            logger.error(f"PDF file not found: {file_path}")
            return Response(
                {'error': 'PDF file not found'},
                status=status.HTTP_404_NOT_FOUND
            )
        
        try:
            # Check if download is requested
            download = request.query_params.get('download', 'false').lower() == 'true'
            
            response = FileResponse(
                open(file_path, 'rb'),
                content_type='application/pdf'
            )
            
            if download:
                response['Content-Disposition'] = f'attachment; filename="{textbook.file_name}"'
            else:
                response['Content-Disposition'] = f'inline; filename="{textbook.file_name}"'
            
            # Allow CORS for PDF viewing
            response['Access-Control-Allow-Origin'] = '*'
            response['Access-Control-Expose-Headers'] = 'Content-Disposition'
            
            logger.info(f"Serving PDF: {textbook.title} to user {request.user.username}")
            return response
            
        except Exception as e:
            logger.error(f"Error serving PDF {textbook.title}: {str(e)}")
            return Response(
                {'error': 'Failed to load PDF file'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
