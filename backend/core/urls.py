"""
URL configuration for the Productivity Tracker project.
"""
from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static
from drf_spectacular.views import SpectacularAPIView, SpectacularSwaggerView, SpectacularRedocView


urlpatterns = [
    path('admin/', admin.site.urls),
    
    # API v1
    path('api/v1/auth/', include('apps.users.urls')),
    path('api/v1/', include('apps.goals.urls')),
    path('api/v1/', include('apps.study.urls')),
    path('api/v1/', include('apps.sleep.urls')),
    path('api/v1/', include('apps.habits.urls')),
    path('api/v1/', include('apps.plans.urls')),
    path('api/v1/', include('apps.notes.urls')),
    path('api/v1/', include('apps.notifications.urls')),
    path('api/v1/', include('apps.dashboard.urls')),
    path('api/v1/', include('apps.statistics.urls')),
    
    # OAuth (allauth)
    path('accounts/', include('allauth.urls')),
    
    # OpenAPI Schema
    path('api/schema/', SpectacularAPIView.as_view(), name='schema'),
    path('api/docs/', SpectacularSwaggerView.as_view(url_name='schema'), name='swagger-ui'),
    path('api/redoc/', SpectacularRedocView.as_view(url_name='schema'), name='redoc'),
    
    # Health check
    path('health/', include('apps.dashboard.health_urls')),
]

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
