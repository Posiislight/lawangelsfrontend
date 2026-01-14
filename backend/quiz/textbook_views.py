import os
import re
import logging
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.http import FileResponse, StreamingHttpResponse, Http404
from django.conf import settings

from .textbook_models import Textbook
from .textbook_serializers import TextbookSerializer, TextbookListSerializer

logger = logging.getLogger(__name__)


def add_cache_headers(response, max_age=3600, public=True):
    """Add Cache-Control headers to a response for edge caching."""
    cache_type = 'public' if public else 'private'
    response['Cache-Control'] = f'{cache_type}, max-age={max_age}, stale-while-revalidate=60'
    return response


def file_iterator(file_path, start=0, end=None, chunk_size=8192):
    """
    Generator that yields chunks of a file for streaming.
    Supports range requests for progressive loading.
    """
    with open(file_path, 'rb') as f:
        f.seek(start)
        remaining = (end - start + 1) if end else None
        
        while True:
            if remaining is not None:
                chunk = f.read(min(chunk_size, remaining))
                remaining -= len(chunk)
            else:
                chunk = f.read(chunk_size)
            
            if not chunk:
                break
            yield chunk
            
            if remaining is not None and remaining <= 0:
                break


def serve_file_with_range_support(request, file_path, content_type='application/pdf', filename=None):
    """
    Serve a file with HTTP Range request support for progressive loading.
    This allows browsers to start displaying content before the full file is downloaded.
    """
    file_size = os.path.getsize(file_path)
    
    # Parse Range header if present
    range_header = request.META.get('HTTP_RANGE', '').strip()
    range_match = re.match(r'bytes=(\d*)-(\d*)', range_header)
    
    if range_match:
        # Handle range request
        start = int(range_match.group(1)) if range_match.group(1) else 0
        end = int(range_match.group(2)) if range_match.group(2) else file_size - 1
        
        # Validate range
        if start >= file_size:
            start = 0
        if end >= file_size:
            end = file_size - 1
        if start > end:
            start = 0
            end = file_size - 1
        
        content_length = end - start + 1
        
        response = StreamingHttpResponse(
            file_iterator(file_path, start, end),
            status=206,  # Partial Content
            content_type=content_type
        )
        response['Content-Length'] = content_length
        response['Content-Range'] = f'bytes {start}-{end}/{file_size}'
    else:
        # Full file response
        response = FileResponse(
            open(file_path, 'rb'),
            content_type=content_type
        )
        response['Content-Length'] = file_size
    
    # Always indicate we accept range requests
    response['Accept-Ranges'] = 'bytes'
    
    if filename:
        response['Content-Disposition'] = f'inline; filename="{filename}"'
    
    return response


class TextbookViewSet(viewsets.ReadOnlyModelViewSet):
    """
    ViewSet for textbooks.
    
    Endpoints:
    - GET /textbooks/ - List all textbooks
    - GET /textbooks/{id}/ - Get textbook details
    - GET /textbooks/{id}/pdf/ - Download/stream PDF file with range support
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
        response = Response(serializer.data)
        
        # Cache textbook list for 1 hour (content rarely changes)
        return add_cache_headers(response, max_age=3600, public=False)
    
    @action(detail=True, methods=['get'])
    def pdf(self, request, pk=None):
        """
        Stream or download the PDF file for a textbook.
        Supports HTTP Range requests for progressive loading.
        """
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
            
            # Use range-aware file serving
            response = serve_file_with_range_support(
                request,
                file_path,
                content_type='application/pdf',
                filename=textbook.file_name
            )
            
            if download:
                response['Content-Disposition'] = f'attachment; filename="{textbook.file_name}"'
            
            # Allow CORS for PDF viewing
            response['Access-Control-Allow-Origin'] = '*'
            response['Access-Control-Expose-Headers'] = 'Content-Disposition, Content-Range, Accept-Ranges, Content-Length'
            
            # Cache PDFs for 24 hours (static content)
            response['Cache-Control'] = 'private, max-age=86400, stale-while-revalidate=3600'
            
            logger.info(f"Serving PDF: {textbook.title} to user {request.user.username}")
            return response
            
        except Exception as e:
            logger.error(f"Error serving PDF {textbook.title}: {str(e)}")
            return Response(
                {'error': 'Failed to load PDF file'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
