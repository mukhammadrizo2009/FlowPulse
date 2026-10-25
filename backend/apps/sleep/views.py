from rest_framework import viewsets
from rest_framework.permissions import IsAuthenticated
import datetime
from .models import SleepRecord
from .serializers import SleepRecordSerializer


class SleepRecordViewSet(viewsets.ModelViewSet):
    permission_classes = [IsAuthenticated]
    serializer_class = SleepRecordSerializer

    def get_queryset(self):
        qs = SleepRecord.objects.filter(owner=self.request.user)
        date_from = self.request.query_params.get('date_from')
        date_to = self.request.query_params.get('date_to')
        if date_from:
            try:
                qs = qs.filter(date__gte=datetime.date.fromisoformat(date_from))
            except ValueError:
                pass
        if date_to:
            try:
                qs = qs.filter(date__lte=datetime.date.fromisoformat(date_to))
            except ValueError:
                pass
        return qs

    def perform_create(self, serializer):
        from rest_framework.exceptions import ValidationError
        date = serializer.validated_data.get('date')
        if SleepRecord.objects.filter(owner=self.request.user, date=date).exists():
            raise ValidationError({"date": "A sleep record for this date already exists."})
        serializer.save(owner=self.request.user)
