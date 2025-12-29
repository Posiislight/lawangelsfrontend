from django.urls import path, include, re_path
from rest_framework.routers import DefaultRouter
from . import views
from . import topic_views

router = DefaultRouter()
router.register(r'exams', views.ExamViewSet, basename='exam')
router.register(r'questions', views.QuestionViewSet, basename='question')
router.register(r'exam-attempts', views.ExamAttemptViewSet, basename='exam-attempt')
router.register(r'reviews', views.ReviewViewSet, basename='review')

# Topic quiz routers
router.register(r'topics', topic_views.TopicViewSet, basename='topic')
router.register(r'topic-attempts', topic_views.TopicQuizAttemptViewSet, basename='topic-attempt')
router.register(r'game-profile', topic_views.UserGameProfileViewSet, basename='game-profile')

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
    
    # Router must come AFTER custom routes
    path('', include(router.urls)),
]

