from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import PlanViewSet, PlanItemViewSet

router = DefaultRouter()
router.register(r'plans', PlanViewSet, basename='plan')
router.register(r'plan-items', PlanItemViewSet, basename='plan-item')
urlpatterns = [path('', include(router.urls))]
