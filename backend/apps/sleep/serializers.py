from rest_framework import serializers
from .models import SleepRecord


class SleepRecordSerializer(serializers.ModelSerializer):
    duration_minutes = serializers.IntegerField(required=False)
    total_sleep_minutes = serializers.SerializerMethodField(read_only=True)
    notes = serializers.SerializerMethodField(read_only=True)
    hours = serializers.SerializerMethodField(read_only=True)
    hours_input = serializers.IntegerField(write_only=True, required=False, min_value=0, max_value=23)
    minutes_input = serializers.IntegerField(write_only=True, required=False, min_value=0, max_value=59)

    class Meta:
        model = SleepRecord
        fields = [
            'id', 'date', 'duration_minutes', 'total_sleep_minutes', 'hours', 'hours_input', 'minutes_input',
            'note', 'notes', 'created_at', 'updated_at',
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']

    def to_internal_value(self, data):
        data = data.copy() if hasattr(data, 'copy') else dict(data)
        if 'sleep_date' in data and 'date' not in data:
            data['date'] = data.get('sleep_date')
        if 'notes' in data and 'note' not in data:
            data['note'] = data.get('notes')
        if 'total_sleep_minutes' in data and 'duration_minutes' not in data:
            data['duration_minutes'] = data.get('total_sleep_minutes')
        
        # Calculate duration if hours/minutes or bedtime/wake_time supplied
        if 'duration_minutes' not in data:
            h = data.get('hours_input')
            m = data.get('minutes_input')
            if h is not None or m is not None:
                data['duration_minutes'] = (int(h or 0) * 60) + int(m or 0)
            elif 'bedtime' in data and 'wake_time' in data:
                try:
                    b_h, b_m = map(int, str(data['bedtime']).split(':'))
                    w_h, w_m = map(int, str(data['wake_time']).split(':'))
                    b_total = b_h * 60 + b_m
                    w_total = w_h * 60 + w_m
                    diff = (w_total - b_total) % 1440
                    data['duration_minutes'] = diff if diff > 0 else 480
                except Exception:
                    data['duration_minutes'] = 480

        return super().to_internal_value(data)

    def get_hours(self, obj):
        return {'hours': obj.duration_minutes // 60, 'minutes': obj.duration_minutes % 60}

    def get_total_sleep_minutes(self, obj):
        return obj.duration_minutes

    def get_notes(self, obj):
        return obj.note

    def validate(self, data):
        hours = data.pop('hours_input', None)
        minutes = data.pop('minutes_input', None)
        if (hours is not None or minutes is not None) and 'duration_minutes' not in data:
            total = (hours or 0) * 60 + (minutes or 0)
            data['duration_minutes'] = total

        duration = data.get('duration_minutes')
        if duration is None or duration <= 0:
            raise serializers.ValidationError({"duration_minutes": "Sleep duration must be greater than 0."})
        if duration > 1440:
            raise serializers.ValidationError({"duration_minutes": "Sleep duration cannot exceed 24 hours."})

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
