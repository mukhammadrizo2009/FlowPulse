from django.db import models
from django.conf import settings
from django.utils import timezone


class Goal(models.Model):
    STATUS_ACTIVE = 'active'
    STATUS_COMPLETED = 'completed'
    STATUS_ARCHIVED = 'archived'
    STATUS_CHOICES = [
        (STATUS_ACTIVE, 'Active'),
        (STATUS_COMPLETED, 'Completed'),
        (STATUS_ARCHIVED, 'Archived'),
    ]

    owner = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='goals',
        db_index=True,
    )
    title = models.CharField(max_length=255)
    description = models.TextField(blank=True)
    category = models.CharField(max_length=100, blank=True)
    target_date = models.DateField(null=True, blank=True)
    desired_outcome = models.TextField(blank=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default=STATUS_ACTIVE, db_index=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'goals_goal'
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['owner', 'status']),
            models.Index(fields=['owner', 'target_date']),
        ]

    def __str__(self):
        return f"{self.title} ({self.owner.email})"

    @property
    def progress(self):
        """Calculate progress as percentage of completed tasks."""
        total = self.tasks.count()
        if total == 0:
            return 0
        completed = self.tasks.filter(is_completed=True).count()
        return round((completed / total) * 100)

    @property
    def completed_tasks_count(self):
        return self.tasks.filter(is_completed=True).count()

    @property
    def total_tasks_count(self):
        return self.tasks.count()

    @property
    def days_remaining(self):
        if self.target_date is None:
            return None
        today = timezone.now().date()
        delta = (self.target_date - today).days
        return delta


class GoalTask(models.Model):
    goal = models.ForeignKey(
        Goal,
        on_delete=models.CASCADE,
        related_name='tasks',
        db_index=True,
    )
    title = models.CharField(max_length=255)
    description = models.TextField(blank=True)
    is_completed = models.BooleanField(default=False, db_index=True)
    due_date = models.DateField(null=True, blank=True)
    position = models.PositiveIntegerField(default=0)
    completed_at = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'goals_task'
        ordering = ['position', 'created_at']
        indexes = [
            models.Index(fields=['goal', 'is_completed']),
        ]

    def __str__(self):
        return f"{self.title} - {self.goal.title}"

    def complete(self):
        self.is_completed = True
        self.completed_at = timezone.now()
        self.save(update_fields=['is_completed', 'completed_at', 'updated_at'])

    def reopen(self):
        self.is_completed = False
        self.completed_at = None
        self.save(update_fields=['is_completed', 'completed_at', 'updated_at'])
