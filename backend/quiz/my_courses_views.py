"""
Unified My Courses API - Aggregates progress across all content types by subject.
"""
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.db.models import Count, Sum, Q
from django.core.cache import cache
import logging

from .models import Exam, ExamAttempt, Question
from .topic_models import TopicQuizAttempt
from .textbook_models import Textbook
from .video_models import VideoCourse, VideoProgress
from .flashcard_models import FlashcardDeck, FlashcardProgress
from .practice_question_models import PracticeQuestionCourse, PracticeQuestionTopic
from .summary_notes_models import SummaryNotes, SummaryNotesProgress

logger = logging.getLogger(__name__)

# Subject/Topic mapping - canonical names and their connections across different systems
SUBJECT_MAP = {
    'business_law': {
        'display_name': 'Business Law',
        'category': 'FLK1',
        'video_titles': ['Business Law'],
        'quiz_topics': [],
        'textbook_subjects': ['Business Law'],
        'flashcard_subjects': ['Business Law'],
        'practice_course': 'flk-1',
        'practice_topic': 'business-law',
    },
    'constitutional_law': {
        'display_name': 'Constitutional Law',
        'category': 'FLK1',
        'video_titles': ['Constitutional Law'],
        'quiz_topics': [],
        'textbook_subjects': ['Constitutional Law'],
        'flashcard_subjects': ['Constitutional Law'],
        'practice_course': 'flk-1',
        'practice_topic': 'constitutional-law',
    },
    'contract_law': {
        'display_name': 'Contract Law',
        'category': 'FLK1',
        'video_titles': ['Contract Law'],
        'quiz_topics': [],
        'textbook_subjects': ['Contract Law'],
        'flashcard_subjects': ['Contract Law'],
        'practice_course': 'flk-1',
        'practice_topic': 'contract',
    },
    'dispute_resolution': {
        'display_name': 'Dispute Resolution',
        'category': 'FLK1',
        'video_titles': ['Dispute Resolution'],
        'quiz_topics': [],
        'textbook_subjects': ['Dispute Resolution'],
        'flashcard_subjects': ['Dispute Resolution'],
        'practice_course': 'flk-1',
        'practice_topic': 'dispute-resolution',
    },
    'legal_service': {
        'display_name': 'Legal Service',
        'category': 'FLK1',
        'video_titles': ['Legal Service'],
        'quiz_topics': [],
        'textbook_subjects': ['Legal Services'],
        'flashcard_subjects': ['Legal Services'],
        'practice_course': 'flk-1',
        'practice_topic': 'legal-services',
    },
    'torts': {
        'display_name': 'Torts',
        'category': 'FLK1',
        'video_titles': ['Torts'],
        'quiz_topics': [],
        'textbook_subjects': ['Tort Law'],
        'flashcard_subjects': ['Tort Law', 'Torts'],
        'practice_course': 'flk-1',
        'practice_topic': 'tort-',
    },
    'criminal_practice': {
        'display_name': 'Criminal Practice',
        'category': 'FLK2',
        'video_titles': ['Criminal Practice'],
        'quiz_topics': ['criminal_law', 'criminal_practice'],
        'textbook_subjects': ['Criminal Law', 'Criminal Practice'],
        'flashcard_subjects': ['Criminal Law', 'Criminal Practice'],
        'practice_course': 'flk-2',
        'practice_topic': 'criminal',
    },
    'land_law': {
        'display_name': 'Land Law',
        'category': 'FLK2',
        'video_titles': ['Land Law'],
        'quiz_topics': ['land_law'],
        'textbook_subjects': ['Land Law'],
        'flashcard_subjects': ['Land Law'],
        'practice_course': 'flk-2',
        'practice_topic': 'land-law',
    },
    'property_practice': {
        'display_name': 'Property Practice',
        'category': 'FLK2',
        'video_titles': ['Property Practice'],
        'quiz_topics': [],
        'textbook_subjects': ['Property Practice'],
        'flashcard_subjects': ['Property Practice'],
        'practice_course': 'flk-2',
        'practice_topic': 'property-law',
    },
    'professional_ethics': {
        'display_name': 'Professional Ethics',
        'category': 'FLK2',
        'video_titles': ['Professional Ethics'],
        'quiz_topics': ['professional_ethics'],
        'textbook_subjects': ['Professional Ethics'],
        'flashcard_subjects': ['Professional Ethics'],
        'practice_course': 'flk-1',
        'practice_topic': 'professional-ethics',
    },
    'solicitors_account': {
        'display_name': 'Solicitors Account',
        'category': 'FLK2',
        'video_titles': ['Solicitors Account'],
        'quiz_topics': ['solicitors_accounts'],
        'textbook_subjects': ['Solicitors Accounts'],
        'flashcard_subjects': ['Solicitors Accounts'],
        'practice_course': 'flk-2',
        'practice_topic': '',
    },
    'tax_law': {
        'display_name': 'Tax Law',
        'category': 'FLK2',
        'video_titles': ['Tax Law'],
        'quiz_topics': ['taxation'],
        'textbook_subjects': ['Tax Law', 'Taxation'],
        'flashcard_subjects': ['Tax Law', 'Taxation'],
        'practice_course': 'flk-2',
        'practice_topic': '',
    },
    'trusts': {
        'display_name': 'Trusts',
        'category': 'FLK2',
        'video_titles': ['Trusts'],
        'quiz_topics': ['trusts', 'wills'],
        'textbook_subjects': ['Trusts', 'Trusts Law'],
        'flashcard_subjects': ['Trusts', 'Trusts Law'],
        'practice_course': 'flk-2',
        'practice_topic': '',
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
            # CACHE KEY for static course data (shared across all users)
            static_cache_key = 'my_courses_static_data_v2'
            
            # Try to get static data from cache first
            static_data = cache.get(static_cache_key)
            
            if static_data is None:
                # OPTIMIZED: Fetch all static data in minimal queries
                # Query 1: Get video courses with video counts (single query)
                video_courses = list(VideoCourse.objects.filter(is_active=True).annotate(
                    active_video_count=Count('videos', filter=Q(videos__is_active=True))
                ).values('id', 'title', 'active_video_count'))
                
                # Build lookup map for courses
                course_map = {vc['title']: vc for vc in video_courses}
                
                # Query 2: Get textbooks (single query)
                textbooks = list(Textbook.objects.values('id', 'title', 'subject'))
                textbook_by_subject = {}
                for tb in textbooks:
                    if tb['subject'] not in textbook_by_subject:
                        textbook_by_subject[tb['subject']] = tb
                
                # Query 3: Get flashcard decks by subject (single query)
                flashcard_decks = list(FlashcardDeck.objects.filter(is_active=True).annotate(
                    card_count=Count('cards', filter=Q(cards__is_active=True))
                ).values('id', 'subject', 'card_count'))
                flashcard_by_subject = {}
                for fd in flashcard_decks:
                    subj = fd['subject']
                    if subj not in flashcard_by_subject:
                        flashcard_by_subject[subj] = {'total_decks': 0, 'total_cards': 0}
                    flashcard_by_subject[subj]['total_decks'] += 1
                    flashcard_by_subject[subj]['total_cards'] += fd['card_count']
                
                # Query 4: Get practice question courses (single query)
                practice_courses = list(PracticeQuestionCourse.objects.annotate(
                    q_count=Count('topics__areas__questions')
                ).values('slug', 'q_count'))
                practice_by_slug = {pc['slug']: pc['q_count'] for pc in practice_courses}
                
                # Store static data in cache for 30 minutes
                static_data = {
                    'course_map': course_map,
                    'textbook_by_subject': textbook_by_subject,
                    'flashcard_by_subject': flashcard_by_subject,
                    'practice_by_slug': practice_by_slug,
                }
                cache.set(static_cache_key, static_data, 1800)  # 30 min
            
            # Unpack static data
            course_map = static_data['course_map']
            textbook_by_subject = static_data['textbook_by_subject']
            flashcard_by_subject = static_data['flashcard_by_subject']
            practice_by_slug = static_data['practice_by_slug']
            
            # USER-SPECIFIC DATA (not cached as long, or use user-specific cache key)
            user_cache_key = f'my_courses_user_{user.id}' if user.is_authenticated else None
            user_data = cache.get(user_cache_key) if user_cache_key else None
            
            if user_data is None:
                video_progress = {}
                quiz_progress = {}
                flashcard_progress = {}
                summary_notes_progress = {}
                exam_progress = 0
                
                if user.is_authenticated:
                    # Query: Get video progress for user
                    progress_data = VideoProgress.objects.filter(
                        user=user,
                        is_completed=True
                    ).values('video__course_id').annotate(
                        completed_count=Count('id')
                    )
                    for p in progress_data:
                        video_progress[p['video__course_id']] = p['completed_count']
                    
                    # Query: Get quiz progress by topic
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
                    
                    # Query: Get mock exam progress
                    exam_progress = ExamAttempt.objects.filter(
                        user=user,
                        status='completed'
                    ).count()
                    
                    # Query: Get flashcard progress by deck
                    fp_data = FlashcardProgress.objects.filter(user=user).values('deck__subject').annotate(
                        studied=Sum('cards_studied'),
                        correct=Sum('correct_answers')
                    )
                    for fp in fp_data:
                        if fp['deck__subject']:
                            flashcard_progress[fp['deck__subject']] = {
                                'studied': fp['studied'] or 0,
                                'correct': fp['correct'] or 0
                            }
                    
                    # Query: Get summary notes progress by subject
                    summary_notes_progress_list = SummaryNotesProgress.objects.filter(
                        user=user
                    ).select_related('summary_notes').values(
                        'summary_notes__subject',
                        'summary_notes__id'
                    ).annotate(
                        total_chapters=Count('summary_notes__chapters', filter=Q(summary_notes__chapters__is_active=True))
                    )
                    for snp in summary_notes_progress_list:
                        subject = snp['summary_notes__subject']
                        if subject:
                            # Get completed chapters from JSONField
                            progress_obj = SummaryNotesProgress.objects.filter(
                                user=user,
                                summary_notes_id=snp['summary_notes__id']
                            ).first()
                            if progress_obj:
                                completed = len(progress_obj.completed_chapters) if progress_obj.completed_chapters else 0
                                total = snp['total_chapters']
                                summary_notes_progress[subject] = {
                                    'completed': completed,
                                    'total': total,
                                    'percentage': round((completed / total) * 100) if total > 0 else 0
                                }
                
                user_data = {
                    'video_progress': video_progress,
                    'quiz_progress': quiz_progress,
                    'flashcard_progress': flashcard_progress,
                    'exam_progress': exam_progress,
                    'summary_notes_progress': summary_notes_progress,
                }
                # Cache user data for 2 minutes
                if user_cache_key:
                    cache.set(user_cache_key, user_data, 120)
            
            # Unpack user data
            video_progress = user_data['video_progress']
            quiz_progress = user_data['quiz_progress']
            flashcard_progress = user_data['flashcard_progress']
            summary_notes_progress = user_data.get('summary_notes_progress', {})
            
            # Build unified course data (no additional queries)
            courses = []
            for subject_key, subject_info in SUBJECT_MAP.items():
                # Track progress values for each learning mode
                video_prog = 0
                quiz_prog = 0
                flashcard_prog = 0
                summary_notes_prog = 0
                has_activity = False
                
                # Video progress
                for video_title in subject_info['video_titles']:
                    if video_title in course_map:
                        vc = course_map[video_title]
                        total_videos = vc['active_video_count']
                        completed_videos = video_progress.get(vc['id'], 0)
                        if total_videos > 0:
                            video_prog = int((completed_videos / total_videos) * 100)
                            if completed_videos > 0:
                                has_activity = True
                        break
                
                # Quiz progress (cap at 100%)
                for quiz_topic in subject_info['quiz_topics']:
                    if quiz_topic in quiz_progress:
                        quiz_prog = min(100, quiz_progress[quiz_topic]['completed'] * 10)
                        has_activity = True
                        break
                
                # Flashcard progress
                fc_total = 0
                fc_studied = 0
                for fc_subject in subject_info.get('flashcard_subjects', []):
                    if fc_subject in flashcard_by_subject:
                        fc_total += flashcard_by_subject[fc_subject]['total_cards']
                    if fc_subject in flashcard_progress:
                        fc_studied += flashcard_progress[fc_subject]['studied']
                        has_activity = True
                if fc_total > 0:
                    flashcard_prog = min(100, int((fc_studied / fc_total) * 100))
                
                # Summary notes progress (check textbook_subjects which often match summary notes subjects)
                for tb_subject in subject_info['textbook_subjects']:
                    if tb_subject in summary_notes_progress:
                        summary_notes_prog = summary_notes_progress[tb_subject]['percentage']
                        has_activity = True
                        break
                
                # Textbook data
                textbook_data = {'available': False, 'id': None}
                for tb_subject in subject_info['textbook_subjects']:
                    if tb_subject in textbook_by_subject:
                        tb = textbook_by_subject[tb_subject]
                        textbook_data = {'available': True, 'id': tb['id']}
                        break
                
                # Flashcard card count for availability check
                fc_cards = 0
                fc_topic = ''
                for fc_subject in subject_info.get('flashcard_subjects', []):
                    if fc_subject in flashcard_by_subject:
                        fc_cards += flashcard_by_subject[fc_subject]['total_cards']
                        fc_topic = fc_subject
                
                # Calculate overall progress as average of all active learning modes
                modes_with_data = []
                if video_prog > 0 or any(v in course_map for v in subject_info['video_titles']):
                    modes_with_data.append(video_prog)
                if quiz_prog > 0 or subject_info['quiz_topics']:
                    modes_with_data.append(quiz_prog)
                if flashcard_prog > 0 or fc_total > 0:
                    modes_with_data.append(flashcard_prog)
                if summary_notes_prog > 0:
                    modes_with_data.append(summary_notes_prog)
                
                overall_progress = int(sum(modes_with_data) / len(modes_with_data)) if modes_with_data else 0
                
                # Determine status
                if overall_progress >= 100:
                    status = 'completed'
                elif has_activity:
                    status = 'in_progress'
                else:
                    status = 'not_started'
                
                course_data = {
                    'id': subject_key,
                    'title': subject_info['display_name'],
                    'category': subject_info['category'],
                    'status': status,
                    'overall_progress': overall_progress,
                    'textbook': textbook_data,
                    'flashcards': {
                        'total_cards': fc_cards,
                        'topic': fc_topic
                    },
                    'practice_questions': {
                        'course_slug': subject_info.get('practice_course', ''),
                        'topic_slug': subject_info.get('practice_topic', '')
                    }
                }
                
                courses.append(course_data)
            
            # Sort by category then progress
            courses.sort(key=lambda x: (x['category'], -x['overall_progress']))
            
            # Calculate summary stats
            total_courses = len(courses)
            in_progress = len([c for c in courses if c['status'] == 'in_progress'])
            completed = len([c for c in courses if c['status'] == 'completed'])
            avg_progress = sum(c['overall_progress'] for c in courses) // total_courses if total_courses > 0 else 0
            
            response = Response({
                'courses': courses,
                'stats': {
                    'total': total_courses,
                    'in_progress': in_progress,
                    'completed': completed,
                    'not_started': total_courses - in_progress - completed,
                    'average_progress': avg_progress
                }
            })
            # Add cache headers for edge caching (private since it's user-specific)
            response['Cache-Control'] = 'private, max-age=60, stale-while-revalidate=120'
            return response
            
        except Exception as e:
            logger.error(f"Error fetching my courses: {str(e)}")
            return Response(
                {'error': 'Failed to fetch courses'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
