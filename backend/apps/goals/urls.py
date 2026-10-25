from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import GoalViewSet, GoalTaskViewSet

router = DefaultRouter()
router.register(r'goals', GoalViewSet, basename='goal')
router.register(r'tasks', GoalTaskViewSet, basename='task')

urlpatterns = [
    path('', include(router.urls)),
]
