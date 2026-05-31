from rest_framework import status, viewsets
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from bookings.models import Booking
from bookings.serializers import BookingSerializer
from .models import Session
from .permissions import IsCreatorOrReadOnly
from .serializers import SessionSerializer


class SessionViewSet(viewsets.ModelViewSet):
    serializer_class = SessionSerializer
    permission_classes = [IsCreatorOrReadOnly]

    def get_queryset(self):
        qs = Session.objects.select_related("creator")
        # /sessions/mine is handled separately; default list = public catalog.
        if self.action == "list":
            qs = qs.filter(is_active=True)
            search = self.request.query_params.get("search")
            if search:
                from django.db.models import Q
                qs = qs.filter(Q(title__icontains=search) | Q(description__icontains=search))
            price = self.request.query_params.get("price")
            if price == "free":
                qs = qs.filter(price=0)
            elif price == "paid":
                qs = qs.filter(price__gt=0)
            ordering = self.request.query_params.get("ordering")
            if ordering in ("start_time", "price", "-price"):
                qs = qs.order_by(ordering)
        return qs

    def perform_create(self, serializer):
        serializer.save(creator=self.request.user)

    @action(detail=False, methods=["get"], permission_classes=[IsAuthenticated])
    def mine(self, request):
        if request.user.role != "creator":
            return Response({"detail": "Only creators have sessions."}, status=403)
        qs = Session.objects.filter(creator=request.user).select_related("creator")
        page = self.paginate_queryset(qs)
        ser = self.get_serializer(page if page is not None else qs, many=True)
        return self.get_paginated_response(ser.data) if page is not None else Response(ser.data)

    @action(detail=True, methods=["get"], permission_classes=[IsAuthenticated])
    def bookings(self, request, pk=None):
        """Creator views who booked this session (owner only)."""
        session = self.get_object()
        if session.creator_id != request.user.id:
            return Response({"detail": "Not your session."}, status=403)
        qs = Booking.objects.filter(session=session).select_related("user", "session")
        return Response(BookingSerializer(qs, many=True, context={"request": request}).data)
