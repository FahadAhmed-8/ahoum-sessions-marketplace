from datetime import timedelta

from django.db import IntegrityError, transaction
from django.utils import timezone
from rest_framework import status
from rest_framework.decorators import api_view, permission_classes, throttle_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.throttling import ScopedRateThrottle

from catalog.models import Session
from .models import Booking
from .serializers import BookingSerializer, BookingCreateSerializer


class BookingThrottle(ScopedRateThrottle):
    scope = "booking"


@api_view(["POST"])
@permission_classes([IsAuthenticated])
@throttle_classes([BookingThrottle])
def create_booking(request):
    serializer = BookingCreateSerializer(data=request.data)
    serializer.is_valid(raise_exception=True)
    session = serializer.validated_data["session"]

    try:
        with transaction.atomic():
            # Lock the session row so concurrent bookings can't overbook.
            locked = Session.objects.select_for_update().get(pk=session.pk)
            confirmed = locked.bookings.filter(status="confirmed").count()
            if confirmed >= locked.capacity:
                return Response(
                    {"detail": "This session is fully booked."},
                    status=status.HTTP_409_CONFLICT,
                )
            booking = Booking.objects.create(
                user=request.user, session=locked, status="confirmed"
            )
    except IntegrityError:
        # Partial unique constraint: already has an active booking.
        return Response(
            {"detail": "You already have a booking for this session."},
            status=status.HTTP_409_CONFLICT,
        )

    return Response(
        BookingSerializer(booking, context={"request": request}).data,
        status=status.HTTP_201_CREATED,
    )


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def my_bookings(request):
    qs = Booking.objects.filter(user=request.user).select_related(
        "session", "session__creator"
    )
    bucket = request.query_params.get("status")
    if bucket in ("upcoming", "past"):
        now = timezone.now()
        result = []
        for b in qs:
            end = b.session.start_time + timedelta(minutes=b.session.duration_minutes)
            is_past = end < now
            if (bucket == "past") == is_past:
                result.append(b)
        qs = result
    data = BookingSerializer(qs, many=True, context={"request": request}).data
    return Response(data)


@api_view(["PATCH"])
@permission_classes([IsAuthenticated])
def cancel_booking(request, pk):
    try:
        booking = Booking.objects.get(pk=pk)
    except Booking.DoesNotExist:
        return Response({"detail": "Not found."}, status=404)
    if booking.user_id != request.user.id:
        return Response({"detail": "Not your booking."}, status=403)
    booking.status = "cancelled"
    booking.save(update_fields=["status"])
    return Response(BookingSerializer(booking, context={"request": request}).data)
