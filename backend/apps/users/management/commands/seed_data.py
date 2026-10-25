import datetime
from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model
from apps.goals.models import Goal, GoalTask
from apps.study.models import StudyRecord
from apps.sleep.models import SleepRecord
from apps.habits.models import Habit, HabitCompletion
from apps.plans.models import Plan, PlanItem
from apps.notes.models import QuickNote
from apps.notifications.models import Notification

User = get_user_model()

class Command(BaseCommand):
    help = 'Seeds database with realistic demo user and activity data'

    def handle(self, *args, **options):
        email = 'demo@example.com'
        password = 'Password123!'
        
        user, created = User.objects.get_or_create(
            email=email,
            defaults={
                'display_name': 'Alex Rivera',
                'timezone': 'UTC',
                'theme': 'dark',
                'has_password': True,
                'email_notifications_enabled': True,
                'study_reminder_enabled': True,
                'habit_reminder_enabled': True,
                'goal_deadline_reminder_enabled': True,
            }
        )
        if created:
            user.set_password(password)
            user.save()
            self.stdout.write(self.style.SUCCESS(f'Created demo user: {email} / {password}'))
        else:
            self.stdout.write(self.style.NOTICE(f'Demo user exists: {email}'))

        today = datetime.date.today()

        # 1. Goals & Tasks
        if not Goal.objects.filter(owner=user).exists():
            g1 = Goal.objects.create(
                owner=user,
                title='Master System Design & Distributed Systems',
                category='learning',
                target_date=today + datetime.timedelta(days=45),
                status=Goal.STATUS_ACTIVE,
                description='Read Designing Data-Intensive Applications and practice 10 architectural interview problems.',
                desired_outcome='Confident with consensus algorithms, sharding, and real-time streaming architectures.'
            )
            GoalTask.objects.create(goal=g1, title='Finish Chapter 5: Replication', is_completed=True, position=1)
            GoalTask.objects.create(goal=g1, title='Finish Chapter 6: Partitioning', is_completed=True, position=2)
            GoalTask.objects.create(goal=g1, title='Design Distributed Cache System', is_completed=False, position=3)
            GoalTask.objects.create(goal=g1, title='Design Rate Limiter with Redis & Token Bucket', is_completed=False, position=4)

            g2 = Goal.objects.create(
                owner=user,
                title='Run Half-Marathon (21.1 km)',
                category='health',
                target_date=today + datetime.timedelta(days=90),
                status=Goal.STATUS_ACTIVE,
                description='Build cardiovascular endurance up to 18 km weekly long run.',
                desired_outcome='Finish the event in under 1 hour 50 minutes.'
            )
            GoalTask.objects.create(goal=g2, title='Complete 10 km base run at sub 5:30/km', is_completed=True, position=1)
            GoalTask.objects.create(goal=g2, title='Buy new gel running shoes', is_completed=True, position=2)
            GoalTask.objects.create(goal=g2, title='Hit 15 km long run this Sunday', is_completed=False, position=3)

            g3 = Goal.objects.create(
                owner=user,
                title='Launch Productivity & Learning SaaS Platform',
                category='career',
                target_date=today + datetime.timedelta(days=30),
                status=Goal.STATUS_ACTIVE,
                description='Deploy MVP to Render and onboard initial beta users.',
                desired_outcome='Production deployment live with 100+ daily active records.'
            )
            GoalTask.objects.create(goal=g3, title='Build Django backend with JWT and Allauth', is_completed=True, position=1)
            GoalTask.objects.create(goal=g3, title='Build React TypeScript Vite frontend', is_completed=False, position=2)
            GoalTask.objects.create(goal=g3, title='End-to-end integration tests & CI/CD', is_completed=False, position=3)
        else:
            g1 = Goal.objects.filter(owner=user).first()

        # 2. Study Records (Last 14 days)
        if not StudyRecord.objects.filter(owner=user).exists():
            study_data = [
                (14, 120, 'Python Concurrency: asyncio event loops and task groups.'),
                (13, 90, 'System Design: Replication lag and Paxos consensus algorithm.'),
                (12, 150, 'React 19 & TypeScript: Server components and concurrent rendering hooks.'),
                (11, 60, 'Algorithms: Dijkstra and A* shortest path problems on LeetCode.'),
                (10, 180, 'System Design: Kafka partitions, consumer groups, offset commits.'),
                (9, 120, 'Database Indexing: B-Tree vs LSM-Tree deep dive.'),
                (8, 45, 'Algorithms: Sliding window problems.'),
                (7, 135, 'System Design: Consistent hashing ring and virtual nodes.'),
                (6, 150, 'React & Vite: Vite bundle optimization and code splitting.'),
                (5, 180, 'Fullstack Dev: Django REST Framework custom permissions.'),
                (4, 90, 'Algorithms: Trie prefix trees and autocomplete design.'),
                (3, 120, 'System Design: CDN architecture and cache invalidation strategies.'),
                (2, 210, 'Fullstack Dev: Building dashboard metrics and analytics aggregation.'),
                (1, 160, 'Fullstack Dev: Habit streak calculations and notification triggers.'),
                (0, 120, 'System Design: Preparing for architecture review.'),
            ]
            for days_ago, mins, desc in study_data:
                d = today - datetime.timedelta(days=days_ago)
                StudyRecord.objects.create(
                    owner=user,
                    goal=g1,
                    date=d,
                    duration_minutes=mins,
                    description=desc
                )

        # 3. Sleep Records (Last 14 days)
        if not SleepRecord.objects.filter(owner=user).exists():
            sleep_data = [
                (14, 450, 'Good deep sleep, woke up energized.'),
                (13, 420, 'Woke up once around 3am.'),
                (12, 480, '8 hours solid sleep.'),
                (11, 390, 'Slightly tired, stayed up reading.'),
                (10, 460, 'Consistent sleep schedule.'),
                (9, 440, 'Deep REM cycle recorded.'),
                (8, 480, 'Relaxing weekend sleep.'),
                (7, 490, 'Great recovery sleep.'),
                (6, 430, 'Normal workday sleep.'),
                (5, 450, 'Felt refreshed.'),
                (4, 420, 'Moderate energy.'),
                (3, 470, 'Very calm, no screen before bed.'),
                (2, 460, 'Solid 7h40m.'),
                (1, 480, 'Woke up naturally at 6:30 AM.'),
                (0, 450, 'Ready for high focus workday.'),
            ]
            for days_ago, mins, note in sleep_data:
                d = today - datetime.timedelta(days=days_ago)
                SleepRecord.objects.create(
                    owner=user,
                    date=d,
                    duration_minutes=mins,
                    note=note
                )

        # 4. Habits & Completions
        if not Habit.objects.filter(owner=user).exists():
            h1 = Habit.objects.create(
                owner=user,
                name='Morning Deep Work (2 Hours)',
                description='Focus with zero social media or messaging notifications before 11 AM',
                is_active=True
            )
            h2 = Habit.objects.create(
                owner=user,
                name='Read 20 Pages Non-Fiction',
                description='Books on engineering, business, or philosophy',
                is_active=True
            )
            h3 = Habit.objects.create(
                owner=user,
                name='10,000 Daily Steps / Running',
                description='Keep body active and take walking calls',
                is_active=True
            )
            h4 = Habit.objects.create(
                owner=user,
                name='Night Wind-Down Routine',
                description='No screens after 10:30 PM, journal thoughts for 10 minutes',
                is_active=True
            )

            # Add completions for past 10 days to establish streaks
            for i in range(10):
                d = today - datetime.timedelta(days=i)
                HabitCompletion.objects.create(habit=h1, completion_date=d)
                if i % 2 == 0:
                    HabitCompletion.objects.create(habit=h2, completion_date=d)
                if i < 7:
                    HabitCompletion.objects.create(habit=h3, completion_date=d)
                if i < 5:
                    HabitCompletion.objects.create(habit=h4, completion_date=d)

        # 5. Daily Plans
        if not Plan.objects.filter(owner=user, period_type='daily').exists():
            plan = Plan.objects.create(
                owner=user,
                title=f"Daily Plan — {today.strftime('%B %d, %Y')}",
                period_type='daily',
                start_date=today,
                end_date=today
            )
            PlanItem.objects.create(
                plan=plan,
                title='Review system design architecture doc',
                description='Review high availability and failover specs',
                is_completed=True,
                position=1
            )
            PlanItem.objects.create(
                plan=plan,
                title='Implement React frontend dashboard & study tracker',
                description='Complete all UI pages and link with Axios client',
                is_completed=False,
                position=2
            )
            PlanItem.objects.create(
                plan=plan,
                title='30-minute afternoon cardio jog',
                description='Keep heart rate in Zone 2',
                is_completed=False,
                position=3
            )

        # 6. Quick Notes
        if not QuickNote.objects.filter(owner=user).exists():
            QuickNote.objects.create(
                owner=user,
                title='Event-Driven Architecture Idea',
                content='Consider using Redis Streams or RabbitMQ for handling notification fanouts rather than synchronous DB writes.',
            )
            QuickNote.objects.create(
                owner=user,
                title='Book Recommendations 2026',
                content='1. Designing Data-Intensive Applications\n2. Staff Engineer by Will Larson\n3. Atomic Habits by James Clear\n4. Thinking Fast and Slow',
            )
            QuickNote.objects.create(
                owner=user,
                title='Pomodoro Efficiency Findings',
                content='25 min focus + 5 min rest is ideal for bug hunting, but 50 min + 10 min break is significantly better for deep coding & architecture work.',
            )

        # 7. Notifications
        if not Notification.objects.filter(owner=user).exists():
            Notification.objects.create(
                owner=user,
                title='🔥 10-Day Streak Reached!',
                message='You completed "Morning Deep Work" 10 days in a row. Incredible consistency!',
                notification_type='system',
                is_read=False,
                dedup_key='streak_deep_work_10'
            )
            Notification.objects.create(
                owner=user,
                title='Goal Deadline Upcoming',
                message='Your goal "Launch Productivity & Learning SaaS Platform" is due in 30 days.',
                notification_type='goal_deadline',
                is_read=False,
                dedup_key='goal_deadline_saas_30'
            )
            Notification.objects.create(
                owner=user,
                title='Study Milestone Achieved',
                message='You logged over 25 hours of study this week. Keep up the great pace!',
                notification_type='study_reminder',
                is_read=True,
                dedup_key='study_milestone_week_25h'
            )

        self.stdout.write(self.style.SUCCESS('Successfully seeded all sample data!'))
