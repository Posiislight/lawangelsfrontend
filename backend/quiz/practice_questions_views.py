"""
Practice Questions API Views

Provides endpoints for practice questions organized by course, topic, and area.
Optimized with caching and efficient queries.
"""
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework import status
from django.db.models import Prefetch, Count
from django.views.decorators.cache import cache_page
from django.utils.decorators import method_decorator
from functools import wraps
from .practice_question_models import (
    PracticeQuestionCourse,
    PracticeQuestionTopic,
    PracticeQuestionArea,
    PracticeQuestion
)


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
@cache_api_view(300)  # Cache for 5 minutes
def practice_questions_list(request):
    """
    GET /api/practice-questions/
    
    List all courses with their topics (including areas) and question counts.
    Uses annotations for efficient counting.
    """
    # Use annotations to get counts in single query
    courses = PracticeQuestionCourse.objects.prefetch_related(
        Prefetch(
            'topics',
            queryset=PracticeQuestionTopic.objects.annotate(
                actual_area_count=Count('areas')
            ).prefetch_related(
                Prefetch(
                    'areas',
                    queryset=PracticeQuestionArea.objects.annotate(
                        actual_question_count=Count('questions')
                    ).only('letter', 'name', 'slug')
                )
            ).only('name', 'slug')
        )
    ).only('name', 'slug')
    
    courses_data = []
    for course in courses:
        topics = []
        course_question_count = 0
        
        for topic in course.topics.all():
            areas = []
            topic_question_count = 0
            
            for area in topic.areas.all():
                area_q_count = getattr(area, 'actual_question_count', area.question_count)
                topic_question_count += area_q_count
                areas.append({
                    "letter": area.letter,
                    "name": area.name,
                    "slug": area.slug,
                    "question_count": area_q_count
                })
            
            course_question_count += topic_question_count
            topics.append({
                "name": topic.name,
                "slug": topic.slug,
                "area_count": getattr(topic, 'actual_area_count', len(areas)),
                "question_count": topic_question_count,
                "areas": areas
            })
        
        courses_data.append({
            "name": course.name,
            "slug": course.slug,
            "topic_count": len(topics),
            "question_count": course_question_count,
            "topics": topics
        })
    
    return Response({
        "courses": courses_data,
        "total_courses": len(courses_data),
        "total_topics": sum(c["topic_count"] for c in courses_data),
        "total_questions": sum(c["question_count"] for c in courses_data)
    })


@api_view(['GET'])
@permission_classes([IsAuthenticated])
@cache_api_view(300)  # Cache for 5 minutes
def course_topics(request, course_slug):
    """
    GET /api/practice-questions/{course_slug}/
    
    Get topics with areas for a specific course.
    """
    try:
        course = PracticeQuestionCourse.objects.prefetch_related(
            Prefetch(
                'topics',
                queryset=PracticeQuestionTopic.objects.annotate(
                    actual_area_count=Count('areas')
                ).prefetch_related(
                    Prefetch(
                        'areas',
                        queryset=PracticeQuestionArea.objects.annotate(
                            actual_question_count=Count('questions')
                        ).only('letter', 'name', 'slug')
                    )
                ).only('name', 'slug')
            )
        ).only('name', 'slug').get(slug=course_slug)
    except PracticeQuestionCourse.DoesNotExist:
        return Response(
            {"error": f"Course '{course_slug}' not found"},
            status=status.HTTP_404_NOT_FOUND
        )
    
    topics = []
    total_questions = 0
    
    for topic in course.topics.all():
        areas = []
        topic_question_count = 0
        
        for area in topic.areas.all():
            area_q_count = getattr(area, 'actual_question_count', area.question_count)
            topic_question_count += area_q_count
            areas.append({
                "letter": area.letter,
                "name": area.name,
                "slug": area.slug,
                "question_count": area_q_count
            })
        
        total_questions += topic_question_count
        topics.append({
            "name": topic.name,
            "slug": topic.slug,
            "area_count": getattr(topic, 'actual_area_count', len(areas)),
            "question_count": topic_question_count,
            "areas": areas
        })
    
    return Response({
        "course": {
            "name": course.name,
            "slug": course.slug
        },
        "topics": topics,
        "total_questions": total_questions
    })


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
