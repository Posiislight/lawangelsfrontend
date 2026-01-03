"""
Search API endpoint for global search functionality.
Searches across textbooks, videos, quizzes, and courses.
"""
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.db.models import Q
import logging

logger = logging.getLogger(__name__)


class SearchViewSet(viewsets.ViewSet):
    """
    Global search API - searches across all content types.
    
    GET /search/?q=query - Search for content
    """
    permission_classes = [IsAuthenticated]

    def list(self, request):
        """
        Search across textbooks, video courses, and subjects.
        Returns up to 10 results.
        """
        query = request.query_params.get('q', '').strip()
        
        if not query or len(query) < 2:
            return Response({'results': []})
        
        results = []
        
        # Search textbooks
        try:
            from .textbook_models import Textbook
            textbooks = Textbook.objects.filter(
                Q(title__icontains=query) | Q(subject__icontains=query)
            )[:3]
            for tb in textbooks:
                results.append({
                    'id': tb.id,
                    'title': tb.title,
                    'type': 'textbook',
                    'category': tb.category,
                    'href': f'/textbook/{tb.id}',
                })
        except Exception as e:
            logger.warning(f"Textbook search error: {e}")
        
        # Search video courses
        try:
            from .video_models import VideoCourse
            courses = VideoCourse.objects.filter(
                Q(title__icontains=query) | Q(description__icontains=query)
            )[:3]
            for course in courses:
                results.append({
                    'id': course.id,
                    'title': course.title,
                    'type': 'video',
                    'category': course.category,
                    'href': '/video-tutorials',
                })
        except Exception as e:
            logger.warning(f"Video search error: {e}")
        
        # Search exams
        try:
            from .models import Exam
            exams = Exam.objects.filter(
                Q(title__icontains=query) | Q(description__icontains=query),
                is_active=True
            )[:3]
            for exam in exams:
                results.append({
                    'id': exam.id,
                    'title': exam.title,
                    'type': 'quiz',
                    'category': exam.subject.replace('_', ' ').title() if exam.subject else None,
                    'href': '/mock-questions',
                })
        except Exception as e:
            logger.warning(f"Exam search error: {e}")
        
        # Add static page matches
        static_pages = [
            ('My Courses', '/my-courses', 'course'),
            ('Progress', '/progress', 'course'),
            ('Practice Questions', '/practice', 'quiz'),
            ('Flashcards', '/flashcards', 'course'),
            ('Angel AI', '/angel-ai', 'course'),
            ('Video Tutorials', '/video-tutorials', 'video'),
            ('SQE Tips', '/sqe-tips', 'course'),
            ('Key Timeframes', '/key-timeframes', 'course'),
        ]
        
        q_lower = query.lower()
        for title, href, type_ in static_pages:
            if q_lower in title.lower():
                results.append({
                    'id': f'page-{href}',
                    'title': title,
                    'type': type_,
                    'category': 'Page',
                    'href': href,
                })
        
        # Limit to 10 results
        return Response({'results': results[:10]})
