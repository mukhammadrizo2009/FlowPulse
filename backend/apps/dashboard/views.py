from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.response import Response
from django.utils import timezone
from django.db.models import Sum
import datetime

from ..study.models import StudyRecord
from ..sleep.models import SleepRecord
from ..habits.models import Habit
from ..plans.models import Plan
from ..goals.models import Goal


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def dashboard(request):
    """Return a summary of the user's activity for the dashboard."""
    user = request.user
    today = timezone.now().date()
    
    # Today's study time
    today_study = StudyRecord.objects.filter(
        owner=user, date=today
    ).aggregate(total=Sum('duration_minutes'))['total'] or 0

    # Study trends for the last 7 days (including today)
    seven_days_ago = today - datetime.timedelta(days=6)
    recent_records = StudyRecord.objects.filter(
        owner=user,
        date__gte=seven_days_ago,
        date__lte=today,
    ).values('date').annotate(total_minutes=Sum('duration_minutes'))

    study_map = {r['date']: r['total_minutes'] for r in recent_records}
    study_trends_7d = []
    curr = seven_days_ago
    while curr <= today:
        day_minutes = study_map.get(curr, 0)
        study_trends_7d.append({
            'date': str(curr),
            'day': curr.strftime('%a'),
            'minutes': day_minutes,
            'hours': round(day_minutes / 60, 1),
        })
        curr += datetime.timedelta(days=1)

    # Today's sleep
    today_sleep = None
    sleep_record = SleepRecord.objects.filter(owner=user, date=today).first()
    if sleep_record:
        today_sleep = {
            'duration_minutes': sleep_record.duration_minutes,
            'hours': sleep_record.duration_minutes // 60,
            'minutes': sleep_record.duration_minutes % 60,
        }

    # Active habits and today's completion
    active_habits = Habit.objects.filter(owner=user, is_active=True).prefetch_related('completions')
    habit_list = []
    completed_count = 0
    for h in active_habits:
        is_done = h.completions.filter(completion_date=today).exists()
        if is_done:
            completed_count += 1
        habit_list.append({
            'id': h.id,
            'name': h.name,
            'description': h.description,
            'completed_today': is_done,
            'current_streak': h.current_streak,
        })
    habits_data = {
        'total': len(active_habits),
        'completed': completed_count,
        'completed_today': completed_count,
        'habits': habit_list,
    }

    # Today's plan
    today_plan = Plan.objects.filter(
        owner=user,
        period_type='daily',
        start_date=today,
    ).prefetch_related('items').first()
    
    today_plan_data = None
    if today_plan:
        items_list = []
        for it in today_plan.items.all():
            items_list.append({
                'id': it.id,
                'title': it.title,
                'description': it.description,
                'is_completed': it.is_completed,
                'position': it.position,
            })
        today_plan_data = {
            'id': today_plan.id,
            'title': today_plan.title,
            'progress': today_plan.progress,
            'completed_items': today_plan.completed_items_count,
            'completed_count': today_plan.completed_items_count,
            'total_items': today_plan.total_items_count,
            'total_count': today_plan.total_items_count,
            'items': items_list,
        }

    # Active goals (limit to 5 nearest deadline)
    active_goals = Goal.objects.filter(
        owner=user, status='active'
    ).prefetch_related('tasks', 'study_records').order_by(
        'target_date'
    )[:5]
    
    goals_data = []
    for g in active_goals:
        goals_data.append({
            'id': g.id,
            'title': g.title,
            'progress': g.progress,
            'days_remaining': g.days_remaining,
            'status': g.status,
        })

    # Nearest upcoming deadline
    nearest_deadline = Goal.objects.filter(
        owner=user,
        status='active',
        target_date__isnull=False,
        target_date__gte=today,
    ).order_by('target_date').first()

    deadline_data = None
    if nearest_deadline:
        days_left = (nearest_deadline.target_date - today).days
        deadline_data = {
            'id': nearest_deadline.id,
            'title': nearest_deadline.title,
            'target_date': nearest_deadline.target_date,
            'days_remaining': days_left,
        }

    return Response({
        'today': str(today),
        'study_time_today_minutes': today_study,
        'study_trends_7d': study_trends_7d,
        'sleep_today': today_sleep,
        'habits': habits_data,
        'today_plan': today_plan_data,
        'active_goals': goals_data,
        'nearest_deadline': deadline_data,
    })


@api_view(['GET'])
@permission_classes([AllowAny])
def health_check(request):
    return Response({'status': 'ok', 'timestamp': timezone.now().isoformat()})
