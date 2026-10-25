from rest_framework import serializers
from django.core.validators import MinValueValidator
from .models import StudyRecord


class StudyRecordSerializer(serializers.ModelSerializer):
    goal_title = serializers.SerializerMethodField()

    class Meta:
        model = StudyRecord
        fields = [
            'id', 'date', 'duration_minutes', 'goal', 'goal_title',
            'description', 'created_at', 'updated_at',
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']

    def get_goal_title(self, obj):
        return obj.goal.title if obj.goal else None

    def validate_goal(self, value):
        if value and value.owner != self.context['request'].user:
            raise serializers.ValidationError("You can only assign your own goals.")
        return value

    def validate_duration_minutes(self, value):
        if value <= 0:
            raise serializers.ValidationError("Duration must be a positive integer.")
        if value > 1440:  # 24 hours
            raise serializers.ValidationError("Duration cannot exceed 1440 minutes (24 hours).")
        return value
