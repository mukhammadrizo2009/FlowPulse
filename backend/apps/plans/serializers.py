from rest_framework import serializers
from .models import Plan, PlanItem


class PlanItemSerializer(serializers.ModelSerializer):
    goal_title = serializers.SerializerMethodField()
    plan = serializers.PrimaryKeyRelatedField(queryset=Plan.objects.all(), required=False)

    class Meta:
        model = PlanItem
        fields = [
            'id', 'plan', 'title', 'description', 'related_goal', 'goal_title',
            'is_completed', 'position', 'created_at', 'updated_at',
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']

    def get_goal_title(self, obj):
        return obj.related_goal.title if obj.related_goal else None

    def validate_related_goal(self, value):
        if value and value.owner != self.context['request'].user:
            raise serializers.ValidationError("You can only link your own goals.")
        return value

    def validate_plan(self, value):
        if value and value.owner != self.context['request'].user:
            raise serializers.ValidationError("You can only add items to your own plans.")
        return value


class PlanSerializer(serializers.ModelSerializer):
    items = PlanItemSerializer(many=True, read_only=True)
    tasks = PlanItemSerializer(source='items', many=True, read_only=True)
    progress = serializers.IntegerField(read_only=True)
    completed_items_count = serializers.IntegerField(read_only=True)
    total_items_count = serializers.IntegerField(read_only=True)
    date = serializers.DateField(write_only=True, required=False)

    class Meta:
        model = Plan
        fields = [
            'id', 'title', 'description', 'period_type', 'start_date', 'end_date',
            'date', 'progress', 'completed_items_count', 'total_items_count',
            'items', 'tasks', 'created_at', 'updated_at',
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']
        extra_kwargs = {
            'title': {'required': False},
            'period_type': {'required': False},
            'start_date': {'required': False},
            'end_date': {'required': False},
        }

    def validate(self, attrs):
        date = attrs.pop('date', None)
        if date:
            if not attrs.get('start_date'):
                attrs['start_date'] = date
            if not attrs.get('end_date'):
                attrs['end_date'] = date
        if not attrs.get('period_type'):
            attrs['period_type'] = Plan.PERIOD_DAILY
        if not attrs.get('start_date'):
            from django.utils import timezone
            attrs['start_date'] = timezone.now().date()
        if not attrs.get('end_date'):
            attrs['end_date'] = attrs['start_date']
        if not attrs.get('title'):
            attrs['title'] = f"{attrs['period_type'].capitalize()} Plan — {attrs['start_date']}"
        return attrs


class PlanListSerializer(serializers.ModelSerializer):
    items = PlanItemSerializer(many=True, read_only=True)
    tasks = PlanItemSerializer(source='items', many=True, read_only=True)
    progress = serializers.IntegerField(read_only=True)
    completed_items_count = serializers.IntegerField(read_only=True)
    total_items_count = serializers.IntegerField(read_only=True)

    class Meta:
        model = Plan
        fields = [
            'id', 'title', 'description', 'period_type', 'start_date', 'end_date',
            'progress', 'completed_items_count', 'total_items_count',
            'items', 'tasks', 'created_at', 'updated_at',
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']
