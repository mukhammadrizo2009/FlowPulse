from rest_framework import viewsets, status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from django.db.models import Sum
import datetime
from .models import StudyRecord
from .serializers import StudyRecordSerializer


class StudyRecordViewSet(viewsets.ModelViewSet):
    permission_classes = [IsAuthenticated]
    serializer_class = StudyRecordSerializer

    def get_queryset(self):
        qs = StudyRecord.objects.filter(owner=self.request.user).select_related('goal')
        
        date_from = self.request.query_params.get('date_from')
        date_to = self.request.query_params.get('date_to')
        goal_id = self.request.query_params.get('goal')

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
        if goal_id:
            qs = qs.filter(goal_id=goal_id)

        return qs

    def perform_create(self, serializer):
        serializer.save(owner=self.request.user)
