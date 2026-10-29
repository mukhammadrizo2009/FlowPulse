from rest_framework import serializers
from django.core.validators import MinValueValidator
from .models import StudyRecord


class StudyRecordSerializer(serializers.ModelSerializer):
    goal_title = serializers.SerializerMethodField()
    subject_name = serializers.SerializerMethodField()
    notes = serializers.CharField(source='description', read_only=True)
    started_at = serializers.SerializerMethodField()

    class Meta:
        model = StudyRecord
        fields = [
            'id', 'date', 'duration_minutes', 'goal', 'goal_title',
            'description', 'subject_name', 'notes', 'started_at',
            'created_at', 'updated_at',
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']

    def to_internal_value(self, data):
        data = data.copy() if hasattr(data, 'copy') else dict(data)
        if 'study_date' in data and 'date' not in data:
            data['date'] = data.get('study_date')
        if 'subject' in data and 'description' not in data:
            data['description'] = data.get('subject')
        if 'notes' in data and 'description' not in data:
            data['description'] = data.get('notes')
        return super().to_internal_value(data)

    def get_goal_title(self, obj):
        return obj.goal.title if obj.goal else None

    def get_subject_name(self, obj):
        return obj.description or (obj.goal.title if obj.goal else '')

    def get_started_at(self, obj):
        return str(obj.date)

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
