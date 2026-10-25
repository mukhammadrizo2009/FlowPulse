from django.db import models
from django.conf import settings
from django.core.validators import MinValueValidator, MaxValueValidator


class SleepRecord(models.Model):
    owner = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='sleep_records',
        db_index=True,
    )
    date = models.DateField(db_index=True, help_text="The calendar date this sleep record is for.")
    duration_minutes = models.PositiveIntegerField(
        validators=[MinValueValidator(1), MaxValueValidator(1440)],
        help_text="Sleep duration in minutes."
    )
    note = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'sleep_record'
        ordering = ['-date']
        # One sleep record per user per date
        unique_together = [('owner', 'date')]
        indexes = [
            models.Index(fields=['owner', 'date']),
        ]

    def __str__(self):
        return f"{self.owner.email} - {self.date} - {self.duration_minutes}min"
