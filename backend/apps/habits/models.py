from django.db import models
from django.conf import settings
from django.utils import timezone
import datetime


class Habit(models.Model):
    owner = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='habits',
        db_index=True,
    )
    name = models.CharField(max_length=255)
    description = models.TextField(blank=True)
    is_active = models.BooleanField(default=True, db_index=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'habits_habit'
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['owner', 'is_active']),
        ]

    def __str__(self):
        return f"{self.name} ({self.owner.email})"

    @property
    def current_streak(self):
        """Calculate current consecutive completion streak."""
        completions = set(
            self.completions.values_list('completion_date', flat=True)
        )
        if not completions:
            return 0
        
        today = timezone.now().date()
        streak = 0
        check_date = today
        
        # Allow today or yesterday to count as "current"
        if check_date not in completions:
            check_date = today - datetime.timedelta(days=1)
            if check_date not in completions:
                return 0
        
        while check_date in completions:
            streak += 1
            check_date -= datetime.timedelta(days=1)
        
        return streak

    @property
    def best_streak(self):
        """Calculate the best consecutive completion streak."""
        completions = sorted(self.completions.values_list('completion_date', flat=True))
        if not completions:
            return 0
        
        best = 1
        current = 1
        for i in range(1, len(completions)):
            if (completions[i] - completions[i - 1]).days == 1:
                current += 1
                best = max(best, current)
            else:
                current = 1
        
        return best


class HabitCompletion(models.Model):
    habit = models.ForeignKey(
        Habit,
        on_delete=models.CASCADE,
        related_name='completions',
        db_index=True,
    )
    completion_date = models.DateField(db_index=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'habits_completion'
        ordering = ['-completion_date']
        unique_together = [('habit', 'completion_date')]
        indexes = [
            models.Index(fields=['habit', 'completion_date']),
        ]

    def __str__(self):
        return f"{self.habit.name} - {self.completion_date}"
