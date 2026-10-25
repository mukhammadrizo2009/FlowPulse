from django.db import models
from django.conf import settings


class Notification(models.Model):
    TYPE_STUDY_REMINDER = 'study_reminder'
    TYPE_HABIT_REMINDER = 'habit_reminder'
    TYPE_GOAL_DEADLINE = 'goal_deadline'
    TYPE_SYSTEM = 'system'
    TYPE_CHOICES = [
        (TYPE_STUDY_REMINDER, 'Study Reminder'),
        (TYPE_HABIT_REMINDER, 'Habit Reminder'),
        (TYPE_GOAL_DEADLINE, 'Goal Deadline'),
        (TYPE_SYSTEM, 'System'),
    ]

    owner = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='notifications',
        db_index=True,
    )
    notification_type = models.CharField(max_length=30, choices=TYPE_CHOICES, db_index=True)
    title = models.CharField(max_length=255)
    message = models.TextField()
    is_read = models.BooleanField(default=False, db_index=True)
    related_object_type = models.CharField(max_length=50, blank=True)
    related_object_id = models.PositiveIntegerField(null=True, blank=True)
    dedup_key = models.CharField(max_length=255, blank=True, db_index=True)
    created_at = models.DateTimeField(auto_now_add=True, db_index=True)

    class Meta:
        db_table = 'notifications_notification'
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['owner', 'is_read']),
            models.Index(fields=['owner', 'created_at']),
        ]
        # Prevent duplicate notifications with the same dedup_key per owner
        constraints = [
            models.UniqueConstraint(
                fields=['owner', 'dedup_key'],
                condition=models.Q(dedup_key__gt=''),
                name='unique_notification_dedup'
            )
        ]

    def __str__(self):
        return f"{self.notification_type}: {self.title} ({self.owner.email})"

    @classmethod
    def create_if_not_duplicate(cls, owner, notification_type, title, message,
                                 dedup_key='', **kwargs):
        """Create a notification only if dedup_key hasn't been used."""
        if dedup_key:
            existing = cls.objects.filter(owner=owner, dedup_key=dedup_key).exists()
            if existing:
                return None, False
        return cls.objects.get_or_create(
            owner=owner,
            dedup_key=dedup_key,
            defaults={
                'notification_type': notification_type,
                'title': title,
                'message': message,
                **kwargs,
            }
        ) if dedup_key else (cls.objects.create(
            owner=owner,
            notification_type=notification_type,
            title=title,
            message=message,
            **kwargs,
        ), True)
