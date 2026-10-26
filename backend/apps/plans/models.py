from django.db import models
from django.conf import settings
import datetime


class Plan(models.Model):
    PERIOD_DAILY = 'daily'
    PERIOD_WEEKLY = 'weekly'
    PERIOD_MONTHLY = 'monthly'
    PERIOD_YEARLY = 'yearly'
    PERIOD_CHOICES = [
        (PERIOD_DAILY, 'Daily'),
        (PERIOD_WEEKLY, 'Weekly'),
        (PERIOD_MONTHLY, 'Monthly'),
        (PERIOD_YEARLY, 'Yearly'),
    ]

    owner = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='plans',
        db_index=True,
    )
    title = models.CharField(max_length=255)
    description = models.TextField(blank=True)
    period_type = models.CharField(max_length=10, choices=PERIOD_CHOICES, db_index=True)  # noqa: max_length covers 'weekly'
    start_date = models.DateField()
    end_date = models.DateField()
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'plans_plan'
        ordering = ['-start_date']
        indexes = [
            models.Index(fields=['owner', 'period_type', 'start_date']),
        ]

    def __str__(self):
        return f"{self.title} ({self.period_type})"

    @property
    def progress(self):
        total = self.items.count()
        if total == 0:
            return 0
        completed = self.items.filter(is_completed=True).count()
        return round((completed / total) * 100)

    @property
    def completed_items_count(self):
        return self.items.filter(is_completed=True).count()

    @property
    def total_items_count(self):
        return self.items.count()

    @classmethod
    def get_or_create_daily(cls, owner, date):
        plan, _ = cls.objects.get_or_create(
            owner=owner,
            period_type=cls.PERIOD_DAILY,
            start_date=date,
            defaults={
                'title': f"Daily Plan — {date.strftime('%B %d, %Y')}",
                'end_date': date,
            }
        )
        return plan

    @classmethod
    def get_or_create_monthly(cls, owner, year, month):
        start = datetime.date(year, month, 1)
        import calendar
        end = datetime.date(year, month, calendar.monthrange(year, month)[1])
        plan, _ = cls.objects.get_or_create(
            owner=owner,
            period_type=cls.PERIOD_MONTHLY,
            start_date=start,
            defaults={
                'title': f"Monthly Plan — {start.strftime('%B %Y')}",
                'end_date': end,
            }
        )
        return plan

    @classmethod
    def get_or_create_yearly(cls, owner, year):
        start = datetime.date(year, 1, 1)
        end = datetime.date(year, 12, 31)
        plan, _ = cls.objects.get_or_create(
            owner=owner,
            period_type=cls.PERIOD_YEARLY,
            start_date=start,
            defaults={
                'title': f"Yearly Plan — {year}",
                'end_date': end,
            }
        )
        return plan

    @classmethod
    def get_or_create_weekly(cls, owner, date):
        """Get or create a weekly plan for the ISO week containing `date`."""
        # Find Monday (start) and Sunday (end) of the week
        start = date - datetime.timedelta(days=date.weekday())  # Monday
        end = start + datetime.timedelta(days=6)                # Sunday
        plan, _ = cls.objects.get_or_create(
            owner=owner,
            period_type=cls.PERIOD_WEEKLY,
            start_date=start,
            defaults={
                'title': f"Weekly Plan — {start.strftime('%b %d')} – {end.strftime('%b %d, %Y')}",
                'end_date': end,
            }
        )
        return plan


class PlanItem(models.Model):
    plan = models.ForeignKey(
        Plan,
        on_delete=models.CASCADE,
        related_name='items',
        db_index=True,
    )
    related_goal = models.ForeignKey(
        'goals.Goal',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='plan_items',
    )
    title = models.CharField(max_length=255)
    description = models.TextField(blank=True)
    is_completed = models.BooleanField(default=False, db_index=True)
    position = models.PositiveIntegerField(default=0)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'plans_item'
        ordering = ['position', 'created_at']

    def __str__(self):
        return f"{self.title} ({self.plan})"
