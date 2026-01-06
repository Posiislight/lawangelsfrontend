"""
Practice Questions API Views

Provides endpoints for practice questions organized by course, topic, and area.
No timer or speed reader - just immediate feedback on answers.
"""
import json
import os
from pathlib import Path
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework import status


# Load practice questions data from JSON file
def get_practice_questions_data():
    """Load practice questions data - reads fresh each time during dev"""
    data_path = Path(__file__).parent / "practice_questions_data.json"
    if data_path.exists():
        with open(data_path, 'r', encoding='utf-8') as f:
            return json.load(f)
    return {}


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def practice_questions_list(request):
    """
    GET /api/practice-questions/
    
    List all courses with their topics (including areas) and question counts.
    """
    data = get_practice_questions_data()
    
    courses = []
    for course_slug, course_data in data.items():
        topics = []
        for topic in course_data.get("topics", []):
            # Include areas summary
            areas = []
            for area in topic.get("areas", []):
                areas.append({
                    "letter": area["letter"],
                    "name": area["name"],
                    "slug": area["slug"],
                    "question_count": area["question_count"]
                })
            
            topics.append({
                "name": topic["name"],
                "slug": topic["slug"],
                "area_count": topic.get("area_count", len(areas)),
                "question_count": topic["question_count"],
                "areas": areas
            })
        
        courses.append({
            "name": course_data["name"],
            "slug": course_data["slug"],
            "topic_count": len(topics),
            "question_count": sum(t["question_count"] for t in topics),
            "topics": topics
        })
    
    return Response({
        "courses": courses,
        "total_courses": len(courses),
        "total_topics": sum(c["topic_count"] for c in courses),
        "total_questions": sum(c["question_count"] for c in courses)
    })


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def course_topics(request, course_slug):
    """
    GET /api/practice-questions/{course_slug}/
    
    Get topics with areas for a specific course.
    """
    data = get_practice_questions_data()
    
    course = data.get(course_slug)
    if not course:
        return Response(
            {"error": f"Course '{course_slug}' not found"},
            status=status.HTTP_404_NOT_FOUND
        )
    
    topics = []
    for topic in course.get("topics", []):
        areas = []
        for area in topic.get("areas", []):
            areas.append({
                "letter": area["letter"],
                "name": area["name"],
                "slug": area["slug"],
                "question_count": area["question_count"]
            })
        
        topics.append({
            "name": topic["name"],
            "slug": topic["slug"],
            "area_count": len(areas),
            "question_count": topic["question_count"],
            "areas": areas
        })
    
    return Response({
        "course": {
            "name": course["name"],
            "slug": course["slug"]
        },
        "topics": topics,
        "total_questions": sum(t["question_count"] for t in topics)
    })


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def topic_questions(request, course_slug, topic_slug):
    """
    GET /api/practice-questions/{course_slug}/{topic_slug}/
    
    Get all areas with questions for a specific topic.
    Returns the areas structure with questions inside each area.
    """
    data = get_practice_questions_data()
    
    course = data.get(course_slug)
    if not course:
        return Response(
            {"error": f"Course '{course_slug}' not found"},
            status=status.HTTP_404_NOT_FOUND
        )
    
    # Find topic
    topic = None
    for t in course.get("topics", []):
        if t["slug"] == topic_slug:
            topic = t
            break
    
    if not topic:
        return Response(
            {"error": f"Topic '{topic_slug}' not found in course '{course_slug}'"},
            status=status.HTTP_404_NOT_FOUND
        )
    
    # Return areas with their questions
    areas = topic.get("areas", [])
    
    return Response({
        "course": {
            "name": course["name"],
            "slug": course["slug"]
        },
        "topic": {
            "name": topic["name"],
            "slug": topic["slug"]
        },
        "areas": areas,
        "total_areas": len(areas),
        "total_questions": sum(a["question_count"] for a in areas)
    })
