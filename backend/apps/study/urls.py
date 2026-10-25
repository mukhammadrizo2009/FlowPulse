from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import StudyRecordViewSet

router = DefaultRouter()
router.register(r'study-records', StudyRecordViewSet, basename='study-record')

urlpatterns = [path('', include(router.urls))]
