"""
Unified My Courses API - Aggregates progress across all content types by subject.
"""
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.db.models import Count, Sum, Q
import logging

from .models import Exam, ExamAttempt, Question
from .topic_models import TopicQuizAttempt
from .textbook_models import Textbook
from .video_models import VideoCourse, VideoProgress

logger = logging.getLogger(__name__)

# Subject/Topic mapping - canonical names and their connections across different systems
SUBJECT_MAP = {
    'business_law': {
        'display_name': 'Business Law',
        'category': 'FLK1',
        'video_titles': ['Business Law'],
        'quiz_topics': [],
        'textbook_subjects': ['Business Law'],
    },
    'constitutional_law': {
        'display_name': 'Constitutional Law',
        'category': 'FLK1',
        'video_titles': ['Constitutional Law'],
        'quiz_topics': [],
        'textbook_subjects': ['Constitutional Law'],
    },
    'contract_law': {
        'display_name': 'Contract Law',
        'category': 'FLK1',
        'video_titles': ['Contract Law'],
        'quiz_topics': [],
        'textbook_subjects': ['Contract Law'],
    },
    'dispute_resolution': {
        'display_name': 'Dispute Resolution',
        'category': 'FLK1',
        'video_titles': ['Dispute Resolution'],
        'quiz_topics': [],
        'textbook_subjects': ['Dispute Resolution'],
    },
    'legal_service': {
        'display_name': 'Legal Service',
        'category': 'FLK1',
        'video_titles': ['Legal Service'],
        'quiz_topics': [],
        'textbook_subjects': ['Legal Services'],
    },
    'torts': {
        'display_name': 'Torts',
        'category': 'FLK1',
        'video_titles': ['Torts'],
        'quiz_topics': [],
        'textbook_subjects': ['Tort Law'],
    },
    'criminal_practice': {
        'display_name': 'Criminal Practice',
        'category': 'FLK2',
        'video_titles': ['Criminal Practice'],
        'quiz_topics': ['criminal_law', 'criminal_practice'],
        'textbook_subjects': ['Criminal Law', 'Criminal Practice'],
    },
    'land_law': {
        'display_name': 'Land Law',
        'category': 'FLK2',
        'video_titles': ['Land Law'],
        'quiz_topics': ['land_law'],
        'textbook_subjects': ['Land Law'],
    },
    'property_practice': {
        'display_name': 'Property Practice',
        'category': 'FLK2',
        'video_titles': ['Property Practice'],
        'quiz_topics': [],
        'textbook_subjects': ['Property Practice'],
    },
    'professional_ethics': {
        'display_name': 'Professional Ethics',
        'category': 'FLK2',
        'video_titles': ['Professional Ethics'],
        'quiz_topics': ['professional_ethics'],
        'textbook_subjects': ['Professional Ethics'],
    },
    'solicitors_account': {
        'display_name': 'Solicitors Account',
        'category': 'FLK2',
        'video_titles': ['Solicitors Account'],
        'quiz_topics': ['solicitors_accounts'],
        'textbook_subjects': ['Solicitors Accounts'],
    },
    'tax_law': {
        'display_name': 'Tax Law',
        'category': 'FLK2',
        'video_titles': ['Tax Law'],
        'quiz_topics': ['taxation'],
        'textbook_subjects': ['Tax Law', 'Taxation'],
    },
    'trusts': {
        'display_name': 'Trusts',
        'category': 'FLK2',
        'video_titles': ['Trusts'],
        'quiz_topics': ['trusts', 'wills'],
        'textbook_subjects': ['Trusts', 'Trusts Law'],
    },
}


class MyCoursesViewSet(viewsets.ViewSet):
    """
    Unified My Courses ViewSet - Aggregates progress across all content types.
    
    Endpoints:
    - GET /my-courses/ - Get all courses with unified progress
    - GET /my-courses/{subject}/ - Get detail for a specific subject
    """
    permission_classes = [IsAuthenticated]
    
    def list(self, request):
        """Get all courses with unified progress data."""
        user = request.user
        
        try:
            # OPTIMIZED: Fetch all data in minimal queries using annotations
            # Query 1: Get video courses with video counts (single query)
            video_courses = list(VideoCourse.objects.filter(is_active=True).annotate(
                active_video_count=Count('videos', filter=Q(videos__is_active=True))
            ).values('id', 'title', 'active_video_count'))
            
            # Build lookup map for courses
            course_map = {vc['title']: vc for vc in video_courses}
            
            # Query 2: Get video progress for user (single query)
            video_progress = {}
            if user.is_authenticated:
                progress_data = VideoProgress.objects.filter(
                    user=user,
                    is_completed=True
                ).values('video__course_id').annotate(
                    completed_count=Count('id')
                )
                for p in progress_data:
                    video_progress[p['video__course_id']] = p['completed_count']
            
            # Query 3: Get quiz progress by topic (single query)
            quiz_progress = {}
            if user.is_authenticated:
                quiz_data = TopicQuizAttempt.objects.filter(
                    user=user,
                    status='completed'
                ).values('topic').annotate(
                    completed_count=Count('id'),
                    total_correct=Sum('correct_count')
                )
                for q in quiz_data:
                    quiz_progress[q['topic']] = {
                        'completed': q['completed_count'],
                        'correct': q['total_correct'] or 0
                    }
            
            # Query 4: Get mock exam progress (single query)
            exam_progress = 0
            if user.is_authenticated:
                exam_progress = ExamAttempt.objects.filter(
                    user=user,
                    status='completed'
                ).count()
            
            # Query 5: Get textbooks (single query)
            textbooks = list(Textbook.objects.values('id', 'title', 'subject'))
            textbook_by_subject = {}
            for tb in textbooks:
                if tb['subject'] not in textbook_by_subject:
                    textbook_by_subject[tb['subject']] = tb
            
            # Build unified course data (no additional queries)
            courses = []
            for subject_key, subject_info in SUBJECT_MAP.items():
                course_data = {
                    'id': subject_key,
                    'title': subject_info['display_name'],
                    'category': subject_info['category'],
                    'status': 'not_started',
                    'overall_progress': 0,
                    'videos': {
                        'completed': 0,
                        'total': 0,
                        'progress': 0
                    },
                    'quizzes': {
                        'completed': 0,
                        'correct': 0,
                        'progress': 0
                    },
                    'textbook': {
                        'available': False,
                        'title': None,
                        'id': None
                    },
                    'mock_exams': {
                        'completed': 0,
                        'progress': 0
                    }
                }
                
                # Video progress - use lookup map (O(1) instead of O(n))
                for video_title in subject_info['video_titles']:
                    if video_title in course_map:
                        vc = course_map[video_title]
                        total_videos = vc['active_video_count']
                        completed_videos = video_progress.get(vc['id'], 0)
                        course_data['videos']['total'] = total_videos
                        course_data['videos']['completed'] = completed_videos
                        if total_videos > 0:
                            course_data['videos']['progress'] = int((completed_videos / total_videos) * 100)
                        break
                
                # Quiz progress
                for quiz_topic in subject_info['quiz_topics']:
                    if quiz_topic in quiz_progress:
                        course_data['quizzes']['completed'] += quiz_progress[quiz_topic]['completed']
                        course_data['quizzes']['correct'] += quiz_progress[quiz_topic]['correct']
                
                # Estimate quiz progress (completed quizzes out of expected ~10)
                if course_data['quizzes']['completed'] > 0:
                    course_data['quizzes']['progress'] = min(100, course_data['quizzes']['completed'] * 10)
                
                # Textbook availability
                for tb_subject in subject_info['textbook_subjects']:
                    if tb_subject in textbook_by_subject:
                        tb = textbook_by_subject[tb_subject]
                        course_data['textbook']['available'] = True
                        course_data['textbook']['title'] = tb['title']
                        course_data['textbook']['id'] = tb['id']
                        break
                
                # Calculate overall progress (weighted average)
                weights = {'videos': 0.4, 'quizzes': 0.4, 'textbook': 0.2}
                overall = (
                    course_data['videos']['progress'] * weights['videos'] +
                    course_data['quizzes']['progress'] * weights['quizzes']
                )
                course_data['overall_progress'] = int(overall)
                
                # Determine status
                if course_data['overall_progress'] >= 100:
                    course_data['status'] = 'completed'
                elif course_data['overall_progress'] > 0 or course_data['videos']['completed'] > 0 or course_data['quizzes']['completed'] > 0:
                    course_data['status'] = 'in_progress'
                else:
                    course_data['status'] = 'not_started'
                
                courses.append(course_data)
            
            # Sort by category then progress
            courses.sort(key=lambda x: (x['category'], -x['overall_progress']))
            
            # Calculate summary stats
            total_courses = len(courses)
            in_progress = len([c for c in courses if c['status'] == 'in_progress'])
            completed = len([c for c in courses if c['status'] == 'completed'])
            avg_progress = sum(c['overall_progress'] for c in courses) // total_courses if total_courses > 0 else 0
            
            return Response({
                'courses': courses,
                'stats': {
                    'total': total_courses,
                    'in_progress': in_progress,
                    'completed': completed,
                    'not_started': total_courses - in_progress - completed,
                    'average_progress': avg_progress
                }
            })
            
        except Exception as e:
            logger.error(f"Error fetching my courses: {str(e)}")
            return Response(
                {'error': 'Failed to fetch courses'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
