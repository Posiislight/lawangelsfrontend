"""
Practice Questions API Views

Provides endpoints for practice questions organized by course, topic, and area.
Optimized with aggressive caching for fast loading.
"""
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework import status
from django.db.models import Prefetch, Count
from django.views.decorators.cache import cache_page
from django.utils.decorators import method_decorator
from django.core.cache import cache
from functools import wraps
from .practice_question_models import (
    PracticeQuestionCourse,
    PracticeQuestionTopic,
    PracticeQuestionArea,
    PracticeQuestion
)


def add_cache_headers(response, max_age=1800):
    """Add Cache-Control headers for edge caching."""
    response['Cache-Control'] = f'public, max-age={max_age}, stale-while-revalidate=300'
    return response


def cache_api_view(timeout):
    """Decorator to cache API view responses"""
    def decorator(view_func):
        @wraps(view_func)
        def wrapped_view(request, *args, **kwargs):
            # Use cache_page functionality
            cached_view = cache_page(timeout)(view_func)
            return cached_view(request, *args, **kwargs)
        return wrapped_view
    return decorator


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def practice_questions_list(request):
    """
    GET /api/practice-questions/
    
    List all courses with their topics and question counts.
    OPTIMIZED: Uses direct database aggregations, no N+1 queries.
    """
    # Try cache first (30 min cache for static content)
    cache_key = 'practice_questions_courses_v2'
    cached_data = cache.get(cache_key)
    
    if cached_data is not None:
        response = Response(cached_data)
        return add_cache_headers(response, max_age=1800)
    
    # OPTIMIZED: Single query with aggregations at each level
    courses_raw = list(PracticeQuestionCourse.objects.values('id', 'name', 'slug').order_by('name'))
    
    # Get all topic counts in ONE query
    topic_counts = dict(
        PracticeQuestionTopic.objects.values('course_id').annotate(
            count=Count('id')
        ).values_list('course_id', 'count')
    )
    
    # Get all question counts per course in ONE query (through topic -> area -> question)
    question_counts = dict(
        PracticeQuestionCourse.objects.annotate(
            q_count=Count('topics__areas__questions')
        ).values_list('id', 'q_count')
    )
    
    # Get topics with their question and area counts in ONE query
    topics_data = list(
        PracticeQuestionTopic.objects.annotate(
            q_count=Count('areas__questions'),
            a_count=Count('areas')
        ).values('id', 'course_id', 'name', 'slug', 'q_count', 'a_count').order_by('name')
    )
    
    # Group topics by course in Python (fast, no DB)
    topics_by_course = {}
    for t in topics_data:
        cid = t['course_id']
        if cid not in topics_by_course:
            topics_by_course[cid] = []
        topics_by_course[cid].append({
            'name': t['name'],
            'slug': t['slug'],
            'question_count': t['q_count'],
            'area_count': t['a_count']
        })
    
    # Build response
    courses_data = []
    total_q = 0
    total_t = 0
    
    for course in courses_raw:
        cid = course['id']
        topics = topics_by_course.get(cid, [])
        q_count = question_counts.get(cid, 0)
        
        courses_data.append({
            'name': course['name'],
            'slug': course['slug'],
            'topic_count': len(topics),
            'question_count': q_count,
            'topics': topics
        })
        total_q += q_count
        total_t += len(topics)
    
    result = {
        'courses': courses_data,
        'total_courses': len(courses_data),
        'total_topics': total_t,
        'total_questions': total_q
    }
    
    # Cache for 30 minutes
    cache.set(cache_key, result, 1800)
    
    response = Response(result)
    return add_cache_headers(response, max_age=1800)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def course_topics(request, course_slug):
    """
    GET /api/practice-questions/{course_slug}/
    
    Get topics with areas for a specific course.
    OPTIMIZED: Uses direct database aggregations.
    """
    # Try cache first
    cache_key = f'practice_course_topics_{course_slug}'
    cached_data = cache.get(cache_key)
    
    if cached_data is not None:
        response = Response(cached_data)
        return add_cache_headers(response, max_age=1800)
    
    # Get course
    try:
        course = PracticeQuestionCourse.objects.values('id', 'name', 'slug').get(slug=course_slug)
    except PracticeQuestionCourse.DoesNotExist:
        return Response(
            {"error": f"Course '{course_slug}' not found"},
            status=status.HTTP_404_NOT_FOUND
        )
    
    # Get topics with question counts in ONE query
    topics_raw = list(
        PracticeQuestionTopic.objects.filter(course_id=course['id']).annotate(
            q_count=Count('areas__questions'),
            a_count=Count('areas')
        ).values('name', 'slug', 'q_count', 'a_count').order_by('name')
    )
    
    # Get areas with counts in ONE query
    areas_raw = list(
        PracticeQuestionArea.objects.filter(
            topic__course_id=course['id']
        ).annotate(
            q_count=Count('questions')
        ).values('topic__slug', 'letter', 'name', 'slug', 'q_count').order_by('letter')
    )
    
    # Group areas by topic
    areas_by_topic = {}
    for area in areas_raw:
        topic_slug = area['topic__slug']
        if topic_slug not in areas_by_topic:
            areas_by_topic[topic_slug] = []
        areas_by_topic[topic_slug].append({
            'letter': area['letter'],
            'name': area['name'],
            'slug': area['slug'],
            'question_count': area['q_count']
        })
    
    # Build topics list
    topics = []
    total_questions = 0
    
    for t in topics_raw:
        areas = areas_by_topic.get(t['slug'], [])
        topics.append({
            'name': t['name'],
            'slug': t['slug'],
            'area_count': t['a_count'],
            'question_count': t['q_count'],
            'areas': areas
        })
        total_questions += t['q_count']
    
    result = {
        'course': {
            'name': course['name'],
            'slug': course['slug']
        },
        'topics': topics,
        'total_questions': total_questions
    }
    
    # Cache for 30 minutes
    cache.set(cache_key, result, 1800)
    
    response = Response(result)
    return add_cache_headers(response, max_age=1800)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
@cache_api_view(300)  # Cache for 5 minutes
def topic_questions(request, course_slug, topic_slug):
    """
    GET /api/practice-questions/{course_slug}/{topic_slug}/
    
    Get all areas with questions for a specific topic.
    Returns the areas structure with questions inside each area.
    """
    try:
        course = PracticeQuestionCourse.objects.only('name', 'slug').get(slug=course_slug)
    except PracticeQuestionCourse.DoesNotExist:
        return Response(
            {"error": f"Course '{course_slug}' not found"},
            status=status.HTTP_404_NOT_FOUND
        )
    
    try:
        topic = PracticeQuestionTopic.objects.prefetch_related(
            Prefetch(
                'areas',
                queryset=PracticeQuestionArea.objects.prefetch_related(
                    Prefetch(
                        'questions',
                        queryset=PracticeQuestion.objects.only(
                            'question_id', 'title', 'text', 'options',
                            'correct_answer', 'explanation', 'difficulty', 'area_id'
                        )
                    )
                ).only('letter', 'name', 'slug', 'topic_id')
            )
        ).only('name', 'slug', 'course_id').get(course=course, slug=topic_slug)
    except PracticeQuestionTopic.DoesNotExist:
        return Response(
            {"error": f"Topic '{topic_slug}' not found in course '{course_slug}'"},
            status=status.HTTP_404_NOT_FOUND
        )
    
    # Build areas with questions
    areas = []
    total_questions = 0
    
    for area in topic.areas.all():
        questions = [
            {
                "id": q.question_id,
                "title": q.title,
                "text": q.text,
                "options": q.options,
                "correct_answer": q.correct_answer,
                "explanation": q.explanation,
                "difficulty": q.difficulty
            }
            for q in area.questions.all()
        ]
        
        question_count = len(questions)
        total_questions += question_count
        
        areas.append({
            "letter": area.letter,
            "name": area.name,
            "slug": area.slug,
            "question_count": question_count,
            "questions": questions
        })
    
    return Response({
        "course": {
            "name": course.name,
            "slug": course.slug
        },
        "topic": {
            "name": topic.name,
            "slug": topic.slug
        },
        "areas": areas,
        "total_areas": len(areas),
        "total_questions": total_questions
    })
