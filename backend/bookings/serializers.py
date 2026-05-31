from django.utils import timezone
from datetime import timedelta
from rest_framework import serializers

from accounts.serializers import UserPublicSerializer
from catalog.models import Session
from .models import Booking


class BookingSessionSummary(serializers.ModelSerializer):
    creator = UserPublicSerializer(read_only=True)

    class Meta:
        model = Session
        fields = (
            "id", "title", "price", "start_time",
            "duration_minutes", "creator",
        )


class BookingSerializer(serializers.ModelSerializer):
    session = BookingSessionSummary(read_only=True)
    user = UserPublicSerializer(read_only=True)
    is_past = serializers.SerializerMethodField()

    class Meta:
        model = Booking
        fields = ("id", "status", "created_at", "session", "user", "is_past")

    def get_is_past(self, obj):
        end = obj.session.start_time + timedelta(minutes=obj.session.duration_minutes)
        return end < timezone.now()


class BookingCreateSerializer(serializers.Serializer):
    session = serializers.PrimaryKeyRelatedField(queryset=Session.objects.all())
