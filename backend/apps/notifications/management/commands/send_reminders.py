"""
Management command: send_reminders
Run this daily (e.g., via Render Cron Job) to send email reminders.

Render Cron Job command example:
  python manage.py send_reminders

Render cron schedule: 0 7 * * *  (runs at 7:00 UTC daily)
"""
from django.core.management.base import BaseCommand
from django.utils import timezone
from django.core.mail import send_mail
from django.conf import settings
from django.contrib.auth import get_user_model
# pyrefly: ignore[missing-import]
from apps.goals.models import Goal
# pyrefly: ignore[missing-import]
from apps.notifications.models import Notification
import datetime

User = get_user_model()


class Command(BaseCommand):
    help = 'Send daily study and habit reminders and goal deadline alerts'

    def handle(self, *args, **options):
        today = timezone.now().date()
        sent_count = 0

        for user in User.objects.filter(is_active=True):
            sent_count += self._process_study_reminder(user, today)
            sent_count += self._process_habit_reminder(user, today)
            sent_count += self._process_goal_deadlines(user, today)

        self.stdout.write(self.style.SUCCESS(f'send_reminders: {sent_count} notifications created/sent.'))

    def _process_study_reminder(self, user, today):
        if not user.study_reminder_enabled:
            return 0
        
        dedup_key = f'study_reminder_{user.id}_{today}'
        notification, created = Notification.objects.get_or_create(
            owner=user,
            dedup_key=dedup_key,
            defaults={
                'notification_type': Notification.TYPE_STUDY_REMINDER,
                'title': 'Time to study!',
                'message': f'Don\'t forget your study session today ({today}).',
            }
        )
        
        if created and user.email_notifications_enabled:
            self._send_email(
                user,
                subject='Your daily study reminder',
                body=f'Hi {user.get_short_name()},\n\nThis is your daily reminder to log your study time.\n\nStay consistent!'
            )
            return 1
        return 0

    def _process_habit_reminder(self, user, today):
        if not user.habit_reminder_enabled:
            return 0
        
        dedup_key = f'habit_reminder_{user.id}_{today}'
        notification, created = Notification.objects.get_or_create(
            owner=user,
            dedup_key=dedup_key,
            defaults={
                'notification_type': Notification.TYPE_HABIT_REMINDER,
                'title': 'Check your habits!',
                'message': f'Mark your habits complete for today ({today}).',
            }
        )
        
        if created and user.email_notifications_enabled:
            self._send_email(
                user,
                subject='Your daily habit reminder',
                body=f'Hi {user.get_short_name()},\n\nDon\'t forget to mark your habits complete for today!\n\nKeep the streak going!'
            )
            return 1
        return 0

    def _process_goal_deadlines(self, user, today):
        if not user.goal_deadline_reminder_enabled:
            return 0
        
        days_ahead = user.goal_deadline_reminder_days
        deadline_date = today + datetime.timedelta(days=days_ahead)
        
        upcoming_goals = Goal.objects.filter(
            owner=user,
            status='active',
            target_date=deadline_date,
        )
        
        count = 0
        for goal in upcoming_goals:
            dedup_key = f'goal_deadline_{user.id}_{goal.id}_{deadline_date}'
            notification, created = Notification.objects.get_or_create(
                owner=user,
                dedup_key=dedup_key,
                defaults={
                    'notification_type': Notification.TYPE_GOAL_DEADLINE,
                    'title': f'Goal deadline approaching: {goal.title}',
                    'message': f'Your goal "{goal.title}" is due in {days_ahead} days ({goal.target_date}).',
                    'related_object_type': 'goal',
                    'related_object_id': goal.id,
                }
            )
            if created and user.email_notifications_enabled:
                self._send_email(
                    user,
                    subject=f'Goal deadline in {days_ahead} days: {goal.title}',
                    body=(
                        f'Hi {user.get_short_name()},\n\n'
                        f'Your goal "{goal.title}" is due on {goal.target_date} '
                        f'({days_ahead} days from now).\n\n'
                        f'Current progress: {goal.progress}%\n\n'
                        f'Keep going!'
                    )
                )
                count += 1
        return count

    def _send_email(self, user, subject, body):
        try:
            send_mail(
                subject=subject,
                message=body,
                from_email=settings.DEFAULT_FROM_EMAIL,
                recipient_list=[user.email],
                fail_silently=True,
            )
        except Exception as e:
            self.stderr.write(f'Failed to send email to {user.email}: {e}')
