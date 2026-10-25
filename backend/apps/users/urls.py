from django.urls import path
from . import views

urlpatterns = [
    path('register/', views.user_register, name='user-register'),
    path('google/', views.google_auth_initiate, name='google-auth-initiate'),
    path('me/', views.get_current_user, name='current-user'),
    path('login/', views.email_login, name='email-login'),
    path('logout/', views.user_logout, name='logout'),
    path('password/set/', views.set_password, name='set-password'),
    path('password/change/', views.change_password, name='change-password'),
    path('settings/', views.user_settings, name='user-settings'),
    path('csrf/', views.get_csrf_token, name='csrf-token'),
]
