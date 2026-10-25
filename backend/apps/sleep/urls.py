from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import SleepRecordViewSet

router = DefaultRouter()
router.register(r'sleep-records', SleepRecordViewSet, basename='sleep-record')
urlpatterns = [path('', include(router.urls))]
