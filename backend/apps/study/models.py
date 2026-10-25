from django.db import models
from django.conf import settings
from django.core.validators import MinValueValidator


class StudyRecord(models.Model):
    owner = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='study_records',
        db_index=True,
    )
    goal = models.ForeignKey(
        'goals.Goal',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='study_records',
        db_index=True,
    )
    date = models.DateField(db_index=True)
    duration_minutes = models.PositiveIntegerField(validators=[MinValueValidator(1)])
    description = models.CharField(max_length=255, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'study_record'
        ordering = ['-date', '-created_at']
        indexes = [
            models.Index(fields=['owner', 'date']),
            models.Index(fields=['owner', 'goal', 'date']),
        ]

    def __str__(self):
        return f"{self.owner.email} - {self.date} - {self.duration_minutes}min"
