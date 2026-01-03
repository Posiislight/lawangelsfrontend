from django.urls import path, include, re_path
from rest_framework.routers import DefaultRouter
from . import views
from . import topic_views
from . import textbook_views
from . import progress_views
from . import dashboard_views
from . import quizzes_page_views
from . import ai_views
from . import video_views
from . import my_courses_views
from . import search_views
from . import health_views

router = DefaultRouter()
router.register(r'exams', views.ExamViewSet, basename='exam')
router.register(r'questions', views.QuestionViewSet, basename='question')
router.register(r'exam-attempts', views.ExamAttemptViewSet, basename='exam-attempt')
router.register(r'reviews', views.ReviewViewSet, basename='review')

# Topic quiz routers
router.register(r'topics', topic_views.TopicViewSet, basename='topic')
router.register(r'topic-attempts', topic_views.TopicQuizAttemptViewSet, basename='topic-attempt')
router.register(r'game-profile', topic_views.UserGameProfileViewSet, basename='game-profile')

# Textbook router
router.register(r'textbooks', textbook_views.TextbookViewSet, basename='textbook')

# Progress tracker router
router.register(r'progress', progress_views.UserProgressViewSet, basename='progress')

# Dashboard router (optimized single-call endpoint)
router.register(r'dashboard', dashboard_views.DashboardViewSet, basename='dashboard')

# Quizzes page router (optimized single-call endpoint)
router.register(r'quizzes-page', quizzes_page_views.QuizzesPageViewSet, basename='quizzes-page')

# Angel AI router
router.register(r'ai', ai_views.AngelAIViewSet, basename='ai')

# Video router
router.register(r'video-courses', video_views.VideoCourseViewSet, basename='video-course')
router.register(r'videos', video_views.VideoViewSet, basename='video')
router.register(r'video-progress', video_views.VideoProgressViewSet, basename='video-progress')

# My Courses unified router
router.register(r'my-courses', my_courses_views.MyCoursesViewSet, basename='my-courses')

# Search router
router.register(r'search', search_views.SearchViewSet, basename='search')

urlpatterns = [
    # Custom route for start endpoint (must come BEFORE router.urls for proper precedence)
    # Using the viewset's create action directly
    path('exam-attempts/start/', views.ExamAttemptViewSet.as_view({'post': 'create'}), name='exam-attempt-start'),
    # Custom route to handle hyphenated submit-answer endpoint
    re_path(r'^exam-attempts/(?P<pk>[^/.]+)/submit-answer/$', views.ExamAttemptViewSet.as_view({'post': 'submit_answer'}), name='exam-attempt-submit-answer'),
    re_path(r'^exam-attempts/(?P<pk>[^/.]+)/review/$', views.ExamAttemptViewSet.as_view({'get': 'review'}), name='exam-attempt-review'),
    re_path(r'^exam-attempts/(?P<pk>[^/.]+)/questions/$', views.ExamAttemptViewSet.as_view({'get': 'questions'}), name='exam-attempt-questions'),
    
    # Topic quiz custom routes
    re_path(r'^topic-attempts/(?P<pk>[^/.]+)/submit-answer/$', topic_views.TopicQuizAttemptViewSet.as_view({'post': 'submit_answer'}), name='topic-attempt-submit-answer'),
    re_path(r'^topic-attempts/(?P<pk>[^/.]+)/current-question/$', topic_views.TopicQuizAttemptViewSet.as_view({'get': 'current_question'}), name='topic-attempt-current-question'),
    re_path(r'^topic-attempts/(?P<pk>[^/.]+)/summary/$', topic_views.TopicQuizAttemptViewSet.as_view({'get': 'summary'}), name='topic-attempt-summary'),
    re_path(r'^topic-attempts/(?P<pk>[^/.]+)/use-powerup/$', topic_views.TopicQuizAttemptViewSet.as_view({'post': 'use_powerup'}), name='topic-attempt-use-powerup'),
    re_path(r'^topics/(?P<pk>[^/.]+)/questions/$', topic_views.TopicViewSet.as_view({'get': 'questions'}), name='topic-questions'),
    
    # Angel AI streaming endpoint
    path('ai/stream/', ai_views.AngelAIViewSet.as_view({'post': 'stream'}), name='ai-stream'),
    path('ai/chat/', ai_views.AngelAIViewSet.as_view({'post': 'chat'}), name='ai-chat'),
    # Angel AI conversation endpoints
    path('ai/conversations/', ai_views.AngelAIViewSet.as_view({'get': 'conversations', 'post': 'conversations'}), name='ai-conversations'),
    path('ai/conversations/<int:conversation_id>/', ai_views.AngelAIViewSet.as_view({'get': 'conversation_detail', 'delete': 'conversation_detail'}), name='ai-conversation-detail'),
    path('ai/conversations/<int:conversation_id>/message/', ai_views.AngelAIViewSet.as_view({'post': 'add_message'}), name='ai-conversation-message'),
    
    # Health check for warm-up pings (no auth required)
    path('health/', health_views.health_check, name='health-check'),
    
    # Router must come AFTER custom routes
    path('', include(router.urls)),
]

