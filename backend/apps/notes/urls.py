from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import QuickNoteViewSet

router = DefaultRouter()
router.register(r'notes', QuickNoteViewSet, basename='note')
urlpatterns = [path('', include(router.urls))]
