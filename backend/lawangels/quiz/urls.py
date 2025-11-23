from django.urls import path, include, re_path
from rest_framework.routers import DefaultRouter
from . import views

router = DefaultRouter()
router.register(r'exams', views.ExamViewSet, basename='exam')
router.register(r'questions', views.QuestionViewSet, basename='question')
router.register(r'exam-attempts', views.ExamAttemptViewSet, basename='exam-attempt')

urlpatterns = [
    path('', include(router.urls)),
    # Custom route to handle hyphenated submit-answer endpoint
    re_path(r'^exam-attempts/(?P<pk>[^/.]+)/submit-answer/$', views.ExamAttemptViewSet.as_view({'post': 'submit_answer'}), name='exam-attempt-submit-answer'),
    re_path(r'^exam-attempts/(?P<pk>[^/.]+)/review/$', views.ExamAttemptViewSet.as_view({'get': 'review'}), name='exam-attempt-review'),
    re_path(r'^exam-attempts/(?P<pk>[^/.]+)/questions/$', views.ExamAttemptViewSet.as_view({'get': 'questions'}), name='exam-attempt-questions'),
]
