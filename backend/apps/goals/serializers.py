from rest_framework import serializers
from django.utils import timezone
from django.db.models import Sum
from .models import Goal, GoalTask


class GoalTaskSerializer(serializers.ModelSerializer):
    goal = serializers.PrimaryKeyRelatedField(queryset=Goal.objects.all(), required=False)

    class Meta:
        model = GoalTask
        fields = [
            'id', 'goal', 'title', 'description', 'is_completed', 'due_date',
            'position', 'completed_at', 'created_at', 'updated_at',
        ]
        read_only_fields = ['id', 'completed_at', 'created_at', 'updated_at']

    def validate_due_date(self, value):
        return value

    def validate_goal(self, value):
        request = self.context.get('request')
        if request and value and value.owner != request.user:
            raise serializers.ValidationError("You can only add tasks to your own goals.")
        return value


class GoalSerializer(serializers.ModelSerializer):
    tasks = GoalTaskSerializer(many=True, read_only=True)
    progress = serializers.IntegerField(read_only=True)
    completed_tasks_count = serializers.IntegerField(read_only=True)
    total_tasks_count = serializers.IntegerField(read_only=True)
    days_remaining = serializers.IntegerField(read_only=True, allow_null=True)
    study_time_minutes = serializers.SerializerMethodField()

    class Meta:
        model = Goal
        fields = [
            'id', 'title', 'description', 'category', 'target_date',
            'desired_outcome', 'status', 'progress', 'completed_tasks_count',
            'total_tasks_count', 'days_remaining', 'study_time_minutes',
            'tasks', 'created_at', 'updated_at',
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']

    def to_internal_value(self, data):
        data = data.copy() if hasattr(data, 'copy') else dict(data)
        if data.get('status') == 'in_progress':
            data['status'] = 'active'
        if 'deadline' in data and 'target_date' not in data:
            data['target_date'] = data.get('deadline')
        return super().to_internal_value(data)

    def get_study_time_minutes(self, obj):
        result = obj.study_records.aggregate(total=Sum('duration_minutes'))
        return result['total'] or 0


class GoalListSerializer(serializers.ModelSerializer):
    """Serializer for listing goals with tasks and progress."""
    tasks = GoalTaskSerializer(many=True, read_only=True)
    progress = serializers.IntegerField(read_only=True)
    completed_tasks_count = serializers.IntegerField(read_only=True)
    total_tasks_count = serializers.IntegerField(read_only=True)
    days_remaining = serializers.IntegerField(read_only=True, allow_null=True)
    study_time_minutes = serializers.SerializerMethodField()

    class Meta:
        model = Goal
        fields = [
            'id', 'title', 'description', 'category', 'target_date',
            'desired_outcome', 'status', 'progress', 'completed_tasks_count',
            'total_tasks_count', 'days_remaining', 'study_time_minutes',
            'tasks', 'created_at', 'updated_at',
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']

    def to_internal_value(self, data):
        data = data.copy() if hasattr(data, 'copy') else dict(data)
        if data.get('status') == 'in_progress':
            data['status'] = 'active'
        if 'deadline' in data and 'target_date' not in data:
            data['target_date'] = data.get('deadline')
        return super().to_internal_value(data)

    def get_study_time_minutes(self, obj):
        result = obj.study_records.aggregate(total=Sum('duration_minutes'))
        return result['total'] or 0
