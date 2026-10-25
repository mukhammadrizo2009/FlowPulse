
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from .models import Plan, PlanItem
from .serializers import PlanSerializer, PlanListSerializer, PlanItemSerializer


class PlanViewSet(viewsets.ModelViewSet):
    permission_classes = [IsAuthenticated]

    def get_serializer_class(self):
        if self.action == 'list':
            return PlanListSerializer
        return PlanSerializer

    def get_queryset(self):
        qs = Plan.objects.filter(owner=self.request.user).prefetch_related('items')
        period_type = self.request.query_params.get('period_type') or self.request.query_params.get('plan_type')
        date = self.request.query_params.get('date')
        year = self.request.query_params.get('year')
        month = self.request.query_params.get('month')

        if period_type:
            qs = qs.filter(period_type=period_type)
        if date:
            try:
                import datetime
                d = datetime.date.fromisoformat(date)
                qs = qs.filter(start_date__lte=d, end_date__gte=d)
            except ValueError:
                pass
        if year:
            qs = qs.filter(start_date__year=year)
        if month:
            qs = qs.filter(start_date__month=month)
        return qs

    def perform_create(self, serializer):
        serializer.save(owner=self.request.user)

    @action(detail=True, methods=['get', 'post'], url_path='items')
    def items(self, request, pk=None):
        plan = self.get_object()
        if request.method == 'GET':
            items = plan.items.all()
            return Response(PlanItemSerializer(items, many=True, context={'request': request}).data)
        serializer = PlanItemSerializer(data=request.data, context={'request': request})
        if serializer.is_valid():
            serializer.save(plan=plan)
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class PlanItemViewSet(viewsets.ModelViewSet):
    permission_classes = [IsAuthenticated]
    serializer_class = PlanItemSerializer

    def get_queryset(self):
        return PlanItem.objects.filter(plan__owner=self.request.user)

    def get_serializer_context(self):
        context = super().get_serializer_context()
        context['request'] = self.request
        return context

    @action(detail=True, methods=['post'], url_path='complete')
    def complete(self, request, pk=None):
        item = self.get_object()
        item.is_completed = True
        item.save(update_fields=['is_completed', 'updated_at'])
        return Response(PlanItemSerializer(item, context={'request': request}).data)

    @action(detail=True, methods=['post'], url_path='reopen')
    def reopen(self, request, pk=None):
        item = self.get_object()
        item.is_completed = False
        item.save(update_fields=['is_completed', 'updated_at'])
        return Response(PlanItemSerializer(item, context={'request': request}).data)
