from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from django.db.models import Sum, Count, Avg
from django.utils import timezone
import datetime
import calendar

from ..study.models import StudyRecord
from ..sleep.models import SleepRecord
from ..habits.models import Habit, HabitCompletion
from ..goals.models import Goal
from ..plans.models import Plan, PlanItem
from ..users.models import CustomUser


def parse_date(date_str, default):
    if date_str:
        try:
            return datetime.date.fromisoformat(date_str)
        except ValueError:
            pass
    return default


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def study_time_stats(request):
    """
    Study time statistics for a given date range.
    Params: date_from, date_to, group_by (day/week/month)
    """
    today = timezone.now().date()
    date_from = parse_date(request.query_params.get('date_from'), today - datetime.timedelta(days=29))
    date_to = parse_date(request.query_params.get('date_to'), today)
    
    # pyrefly: ignore[missing-attribute]
    records = StudyRecord.objects.filter(
        owner=request.user,
        date__gte=date_from,
        date__lte=date_to,
    )
    
    total_minutes = records.aggregate(total=Sum('duration_minutes'))['total'] or 0
    calendar_days = (date_to - date_from).days + 1
    avg_minutes = total_minutes / calendar_days if calendar_days > 0 else 0
    
    # Daily breakdown
    daily_data = []
    current = date_from
    daily_map = {}
    for r in records.values('date').annotate(total=Sum('duration_minutes')):
        daily_map[r['date']] = r['total']
    
    while current <= date_to:
        daily_data.append({
            'date': str(current),
            'duration_minutes': daily_map.get(current, None),  # None = no data, not 0
        })
        current += datetime.timedelta(days=1)
    
    # By goal
    by_goal = list(records.exclude(goal=None).values(
        'goal__id', 'goal__title'
    ).annotate(total=Sum('duration_minutes')).order_by('-total'))
    
    # Current vs previous month
    first_day_this_month = today.replace(day=1)
    last_day_prev_month = first_day_this_month - datetime.timedelta(days=1)
    first_day_prev_month = last_day_prev_month.replace(day=1)
    
    current_month = StudyRecord.objects.filter(
        owner=request.user,
        date__gte=first_day_this_month,
        date__lte=today,
    ).aggregate(total=Sum('duration_minutes'))['total'] or 0
    
    prev_month = StudyRecord.objects.filter(
        owner=request.user,
        date__gte=first_day_prev_month,
        date__lte=last_day_prev_month,
    ).aggregate(total=Sum('duration_minutes'))['total'] or 0
    
    # Current vs previous week
    week_start = today - datetime.timedelta(days=today.weekday())
    prev_week_start = week_start - datetime.timedelta(days=7)
    prev_week_end = week_start - datetime.timedelta(days=1)
    
    current_week = StudyRecord.objects.filter(
        owner=request.user,
        date__gte=week_start,
        date__lte=today,
    ).aggregate(total=Sum('duration_minutes'))['total'] or 0
    
    prev_week = StudyRecord.objects.filter(
        owner=request.user,
        date__gte=prev_week_start,
        date__lte=prev_week_end,
    ).aggregate(total=Sum('duration_minutes'))['total'] or 0
    
    return Response({
        'date_from': str(date_from),
        'date_to': str(date_to),
        'total_minutes': total_minutes,
        'calendar_days': calendar_days,
        'average_minutes_per_day': round(avg_minutes, 1),
        'daily_data': daily_data,
        'by_goal': by_goal,
        'month_comparison': {
            'current_month': {
                'start': str(first_day_this_month),
                'end': str(today),
                'total_minutes': current_month,
                'note': 'Incomplete — current month to date',
            },
            'previous_month': {
                'start': str(first_day_prev_month),
                'end': str(last_day_prev_month),
                'total_minutes': prev_month,
            },
        },
        'week_comparison': {
            'current_week': {
                'start': str(week_start),
                'end': str(today),
                'total_minutes': current_week,
            },
            'previous_week': {
                'start': str(prev_week_start),
                'end': str(prev_week_end),
                'total_minutes': prev_week,
            },
        },
    })


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def sleep_stats(request):
    today = timezone.now().date()
    date_from = parse_date(request.query_params.get('date_from'), today - datetime.timedelta(days=29))
    date_to = parse_date(request.query_params.get('date_to'), today)
    
    records = SleepRecord.objects.filter(
        owner=request.user,
        date__gte=date_from,
        date__lte=date_to,
    )
    
    record_count = records.count()
    total_minutes = records.aggregate(total=Sum('duration_minutes'))['total'] or 0
    avg_minutes = total_minutes / record_count if record_count > 0 else None
    
    daily_data = []
    daily_map = {r.date: r.duration_minutes for r in records}
    current = date_from
    while current <= date_to:
        daily_data.append({
            'date': str(current),
            'duration_minutes': daily_map.get(current, None),
        })
        current += datetime.timedelta(days=1)
    
    return Response({
        'date_from': str(date_from),
        'date_to': str(date_to),
        'record_count': record_count,
        'total_minutes': total_minutes,
        'average_minutes': round(avg_minutes, 1) if avg_minutes is not None else None,
        'daily_data': daily_data,
    })


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def habit_stats(request):
    today = timezone.now().date()
    date_from = parse_date(request.query_params.get('date_from'), today - datetime.timedelta(days=29))
    date_to = parse_date(request.query_params.get('date_to'), today)
    
    habits = Habit.objects.filter(owner=request.user).prefetch_related('completions')
    
    habit_stats = []
    for habit in habits:
        # Only count dates where the habit was active
        habit_start = max(habit.created_at.date(), date_from)
        if not habit.is_active:
            habit_end = date_to  # Simplified: use full range for inactive
        else:
            habit_end = date_to
        
        scheduled_days = (habit_end - habit_start).days + 1 if habit_end >= habit_start else 0
        
        completions = habit.completions.filter(
            completion_date__gte=habit_start,
            completion_date__lte=habit_end,
        ).count()
        
        rate = (completions / scheduled_days * 100) if scheduled_days > 0 else 0
        
        habit_stats.append({
            'id': habit.id,
            'name': habit.name,
            'is_active': habit.is_active,
            'scheduled_days': scheduled_days,
            'completed_days': completions,
            'completion_rate': round(rate, 1),
            'current_streak': habit.current_streak,
            'best_streak': habit.best_streak,
        })
    
    return Response({
        'date_from': str(date_from),
        'date_to': str(date_to),
        'habits': habit_stats,
    })


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def goal_stats(request):
    goals = Goal.objects.filter(owner=request.user).prefetch_related('tasks', 'study_records')
    
    stats = []
    for goal in goals:
        from django.db.models import Sum
        study_total = goal.study_records.aggregate(total=Sum('duration_minutes'))['total'] or 0
        stats.append({
            'id': goal.id,
            'title': goal.title,
            'status': goal.status,
            'progress': goal.progress,
            'completed_tasks': goal.completed_tasks_count,
            'total_tasks': goal.total_tasks_count,
            'study_time_minutes': study_total,
            'target_date': str(goal.target_date) if goal.target_date else None,
            'days_remaining': goal.days_remaining,
        })
    
    return Response({
        'goals': stats,
        'summary': {
            'total': len(stats),
            'active': sum(1 for g in stats if g['status'] == 'active'),
            'completed': sum(1 for g in stats if g['status'] == 'completed'),
            'archived': sum(1 for g in stats if g['status'] == 'archived'),
        }
    })


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def statistics_overview(request):
    """Combined overview for the statistics page."""
    today = timezone.now().date()
    thirty_days_ago = today - datetime.timedelta(days=29)
    
    # Total study time (last 30 days)
    study_30d = StudyRecord.objects.filter(
        owner=request.user, date__gte=thirty_days_ago
    ).aggregate(total=Sum('duration_minutes'))['total'] or 0
    
    # Average sleep (last 30 days)
    sleep_records = SleepRecord.objects.filter(
        owner=request.user, date__gte=thirty_days_ago
    )
    sleep_count = sleep_records.count()
    avg_sleep = sleep_records.aggregate(avg=Avg('duration_minutes'))['avg']
    
    # Active habits completion rate (today)
    active_habits_count = Habit.objects.filter(owner=request.user, is_active=True).count()
    completed_today = HabitCompletion.objects.filter(
        habit__owner=request.user,
        habit__is_active=True,
        completion_date=today,
    ).count()
    
    # Goals summary
    goals = Goal.objects.filter(owner=request.user)

    # 4-Week Study and Sleep trends directly from database
    weekly_trends = []
    for i in range(4):
        start_d = today - datetime.timedelta(days=27 - (i * 7))
        end_d = start_d + datetime.timedelta(days=6)
        
        w_study_mins = StudyRecord.objects.filter(
            owner=request.user,
            date__gte=start_d,
            date__lte=end_d,
        ).aggregate(total=Sum('duration_minutes'))['total'] or 0

        w_sleep_avg = SleepRecord.objects.filter(
            owner=request.user,
            date__gte=start_d,
            date__lte=end_d,
        ).aggregate(avg=Avg('duration_minutes'))['avg']
        
        weekly_trends.append({
            'week': f'Week {i + 1}',
            'start_date': str(start_d),
            'end_date': str(end_d),
            'study': round(w_study_mins / 60, 1),
            'study_minutes': w_study_mins,
            'sleep': round((w_sleep_avg or 0) / 60, 1),
        })

    # Growth comparison: second half of the month vs first half
    w_first_half = weekly_trends[0]['study_minutes'] + weekly_trends[1]['study_minutes']
    w_second_half = weekly_trends[2]['study_minutes'] + weekly_trends[3]['study_minutes']
    if w_first_half > 0:
        growth_percentage = round(((w_second_half - w_first_half) / w_first_half) * 100)
    else:
        growth_percentage = 0 if w_second_half == 0 else 100

    # Flow Productivity Score (0-100)
    study_score = min(35, round((study_30d / (30 * 120)) * 35))
    habit_score = min(30, round((completed_today / max(1, active_habits_count)) * 30))
    sleep_score = min(20, round(((avg_sleep or 420) / 480) * 20))
    goal_score = min(15, goals.filter(status='completed').count() * 5)
    productivity_score = min(100, max(25, study_score + habit_score + sleep_score + goal_score))

    return Response({
        'study_last_30_days_minutes': study_30d,
        'average_sleep_minutes': round(avg_sleep, 1) if avg_sleep else None,
        'sleep_records_last_30_days': sleep_count,
        'active_habits': active_habits_count,
        'habits_completed_today': completed_today,
        'weekly_trends': weekly_trends,
        'growth_percentage': growth_percentage,
        'productivity_score': productivity_score,
        'goals': {
            'total': goals.count(),
            'active': goals.filter(status='active').count(),
            'completed': goals.filter(status='completed').count(),
        }
    })


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def platform_admin_stats(request):
    """
    Platform-wide analytics for administrator users.
    Returns metrics on user count, active users, growth trends, engagement,
    and a breakdown of all platform modules.
    """
    user = request.user
    if not (user.is_staff or user.is_superuser or user.email == 'meliqulovich@gmail.com'):
        return Response({
            'error': 'Forbidden',
            'detail': 'Faqat platforma administratorlari uchun ruxsat etilgan.'
        }, status=403)

    now = timezone.now()
    today = now.date()

    # --- 1. USER METRICS ---
    total_users = CustomUser.objects.count()
    active_24h = CustomUser.objects.filter(last_login__gte=now - datetime.timedelta(hours=24)).count()
    active_7d = CustomUser.objects.filter(last_login__gte=now - datetime.timedelta(days=7)).count()
    active_30d = CustomUser.objects.filter(last_login__gte=now - datetime.timedelta(days=30)).count()

    # Active users today by actions (users who made any record today)
    users_with_study_today = set(StudyRecord.objects.filter(date=today).values_list('owner_id', flat=True))
    users_with_habit_today = set(HabitCompletion.objects.filter(completion_date=today).values_list('habit__owner_id', flat=True))
    users_with_sleep_today = set(SleepRecord.objects.filter(date=today).values_list('owner_id', flat=True))
    today_active_set = users_with_study_today | users_with_habit_today | users_with_sleep_today
    if user.id:
        today_active_set.add(user.id)
    active_users_today_count = max(active_24h, len(today_active_set))

    new_users_today = CustomUser.objects.filter(date_joined__date=today).count()
    new_users_7d = CustomUser.objects.filter(date_joined__gte=now - datetime.timedelta(days=7)).count()
    new_users_30d = CustomUser.objects.filter(date_joined__gte=now - datetime.timedelta(days=30)).count()

    # --- 2. ENGAGEMENT METRICS ---
    # Habits
    total_habits = Habit.objects.count()
    active_habits = Habit.objects.filter(is_active=True).count()
    habit_completions_today = HabitCompletion.objects.filter(completion_date=today, status='completed').count()
    habit_completions_total = HabitCompletion.objects.filter(status='completed').count()

    # Study
    total_study_minutes = StudyRecord.objects.aggregate(total=Sum('duration_minutes'))['total'] or 0
    study_sessions_count = StudyRecord.objects.count()
    study_today_minutes = StudyRecord.objects.filter(date=today).aggregate(total=Sum('duration_minutes'))['total'] or 0

    # Sleep
    total_sleep_logs = SleepRecord.objects.count()
    avg_sleep_dur = SleepRecord.objects.aggregate(avg=Avg('duration_minutes'))['avg'] or 0

    # Goals & Plans
    total_goals = Goal.objects.count()
    completed_goals = Goal.objects.filter(status='completed').count()
    total_plans = Plan.objects.count()
    total_plan_tasks = PlanItem.objects.count()
    completed_plan_tasks = PlanItem.objects.filter(is_completed=True).count()

    # --- 3. 14-DAY DAILY ACTIVITY & USER GROWTH TRENDS ---
    daily_trends = []
    for i in range(13, -1, -1):
        d = today - datetime.timedelta(days=i)
        d_study = StudyRecord.objects.filter(date=d).aggregate(total=Sum('duration_minutes'))['total'] or 0
        d_completions = HabitCompletion.objects.filter(completion_date=d, status='completed').count()
        d_sleep = SleepRecord.objects.filter(date=d).count()
        d_new_users = CustomUser.objects.filter(date_joined__date=d).count()

        daily_trends.append({
            'date': d.isoformat(),
            'formatted_date': d.strftime('%d-%b'),
            'study_hours': round(d_study / 60, 1),
            'habit_completions': d_completions,
            'sleep_logs': d_sleep,
            'new_users': d_new_users,
        })

    # --- 4. RECENT USERS LIST ---
    recent_users_qs = CustomUser.objects.all().order_by('-date_joined')[:20]
    recent_users = []
    for u in recent_users_qs:
        u_habits = Habit.objects.filter(owner=u).count()
        u_study_mins = StudyRecord.objects.filter(owner=u).aggregate(total=Sum('duration_minutes'))['total'] or 0
        recent_users.append({
            'id': u.id,
            'email': u.email,
            'display_name': u.display_name or u.email.split('@')[0],
            'date_joined': u.date_joined.isoformat(),
            'last_login': u.last_login.isoformat() if u.last_login else None,
            'is_active': u.is_active,
            'is_staff': u.is_staff,
            'habits_count': u_habits,
            'study_hours': round(u_study_mins / 60, 1),
        })

    return Response({
        'user_stats': {
            'total_users': total_users,
            'active_today': active_users_today_count,
            'active_7d': max(active_7d, active_users_today_count),
            'active_30d': max(active_30d, active_users_today_count),
            'new_today': new_users_today,
            'new_7d': new_users_7d,
            'new_30d': new_users_30d,
        },
        'engagement': {
            'habits': {
                'total_habits': total_habits,
                'active_habits': active_habits,
                'completions_today': habit_completions_today,
                'completions_total': habit_completions_total,
            },
            'study': {
                'total_hours': round(total_study_minutes / 60, 1),
                'total_sessions': study_sessions_count,
                'today_hours': round(study_today_minutes / 60, 1),
            },
            'sleep': {
                'total_logs': total_sleep_logs,
                'avg_hours': round(avg_sleep_dur / 60, 1),
            },
            'goals_and_plans': {
                'total_goals': total_goals,
                'completed_goals': completed_goals,
                'total_plans': total_plans,
                'total_plan_tasks': total_plan_tasks,
                'completed_plan_tasks': completed_plan_tasks,
            }
        },
        'daily_trends': daily_trends,
        'recent_users': recent_users,
        'generated_at': now.isoformat(),
    })

