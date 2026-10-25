from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.shortcuts import get_object_or_404
from .models import Goal, GoalTask
from .serializers import GoalSerializer, GoalListSerializer, GoalTaskSerializer


class GoalViewSet(viewsets.ModelViewSet):
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        qs = Goal.objects.filter(owner=self.request.user).prefetch_related('tasks', 'study_records')
        status_filter = self.request.query_params.get('status')
        if status_filter:
            qs = qs.filter(status=status_filter)
        return qs

    def get_serializer_class(self):
        if self.action == 'list':
            return GoalListSerializer
        return GoalSerializer

    def perform_create(self, serializer):
        serializer.save(owner=self.request.user)

    @action(detail=True, methods=['post'], url_path='complete')
    def mark_completed(self, request, pk=None):
        goal = self.get_object()
        goal.status = Goal.STATUS_COMPLETED
        goal.save(update_fields=['status', 'updated_at'])
        return Response(GoalSerializer(goal).data)

    @action(detail=True, methods=['post'], url_path='archive')
    def mark_archived(self, request, pk=None):
        goal = self.get_object()
        goal.status = Goal.STATUS_ARCHIVED
        goal.save(update_fields=['status', 'updated_at'])
        return Response(GoalSerializer(goal).data)

    @action(detail=True, methods=['post'], url_path='reactivate')
    def mark_active(self, request, pk=None):
        goal = self.get_object()
        goal.status = Goal.STATUS_ACTIVE
        goal.save(update_fields=['status', 'updated_at'])
        return Response(GoalSerializer(goal).data)

    @action(detail=True, methods=['get', 'post'], url_path='tasks')
    def tasks(self, request, pk=None):
        goal = self.get_object()
        if request.method == 'GET':
            tasks = goal.tasks.all()
            serializer = GoalTaskSerializer(tasks, many=True)
            return Response(serializer.data)
        else:
            serializer = GoalTaskSerializer(data=request.data)
            if serializer.is_valid():
                serializer.save(goal=goal)
                return Response(serializer.data, status=status.HTTP_201_CREATED)
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class GoalTaskViewSet(viewsets.ModelViewSet):
    permission_classes = [IsAuthenticated]
    serializer_class = GoalTaskSerializer

    def get_queryset(self):
        return GoalTask.objects.filter(goal__owner=self.request.user)

    @action(detail=True, methods=['post'], url_path='complete')
    def complete(self, request, pk=None):
        task = self.get_object()
        task.complete()
        return Response(GoalTaskSerializer(task).data)

    @action(detail=True, methods=['post'], url_path='reopen')
    def reopen(self, request, pk=None):
        task = self.get_object()
        task.reopen()
        return Response(GoalTaskSerializer(task).data)
