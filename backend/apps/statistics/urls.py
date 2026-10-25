from django.urls import path
from . import views

urlpatterns = [
    path('statistics/study-time/', views.study_time_stats, name='stats-study'),
    path('statistics/sleep/', views.sleep_stats, name='stats-sleep'),
    path('statistics/habits/', views.habit_stats, name='stats-habits'),
    path('statistics/goals/', views.goal_stats, name='stats-goals'),
    path('statistics/overview/', views.statistics_overview, name='stats-overview'),
]
