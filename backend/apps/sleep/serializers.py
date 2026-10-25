from rest_framework import serializers
from .models import SleepRecord


class SleepRecordSerializer(serializers.ModelSerializer):
    hours = serializers.SerializerMethodField(read_only=True)
    hours_input = serializers.IntegerField(write_only=True, required=False, min_value=0, max_value=23)
    minutes_input = serializers.IntegerField(write_only=True, required=False, min_value=0, max_value=59)

    class Meta:
        model = SleepRecord
        fields = [
            'id', 'date', 'duration_minutes', 'hours', 'hours_input', 'minutes_input',
            'note', 'created_at', 'updated_at',
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']

    def get_hours(self, obj):
        return {'hours': obj.duration_minutes // 60, 'minutes': obj.duration_minutes % 60}

    def validate(self, data):
        # Support hours+minutes input OR direct duration_minutes
        hours = data.pop('hours_input', None)
        minutes = data.pop('minutes_input', None)
        if hours is not None or minutes is not None:
            total = (hours or 0) * 60 + (minutes or 0)
            if total <= 0:
                raise serializers.ValidationError("Sleep duration must be greater than 0.")
            if total > 1440:
                raise serializers.ValidationError("Sleep duration cannot exceed 24 hours.")
            data['duration_minutes'] = total
        request = self.context.get('request')
        date = data.get('date')
        if request and hasattr(request, 'user') and request.user.is_authenticated and date:
            qs = SleepRecord.objects.filter(owner=request.user, date=date)
            if self.instance:
                qs = qs.exclude(pk=self.instance.pk)
            if qs.exists():
                raise serializers.ValidationError({"date": "A sleep record for this date already exists."})

        return data

    def validate_duration_minutes(self, value):
        if value <= 0:
            raise serializers.ValidationError("Duration must be positive.")
        if value > 1440:
            raise serializers.ValidationError("Duration cannot exceed 1440 minutes.")
        return value
