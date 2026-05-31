from rest_framework import serializers

from accounts.serializers import UserPublicSerializer
from .models import Session


class SessionSerializer(serializers.ModelSerializer):
    creator = UserPublicSerializer(read_only=True)
    booked_count = serializers.IntegerField(read_only=True)
    spots_left = serializers.IntegerField(read_only=True)
    is_booked_by_me = serializers.SerializerMethodField()

    class Meta:
        model = Session
        fields = (
            "id", "title", "description", "price", "start_time",
            "duration_minutes", "capacity", "is_active",
            "creator", "booked_count", "spots_left", "is_booked_by_me",
            "created_at", "updated_at",
        )
        read_only_fields = ("id", "creator", "created_at", "updated_at")

    def get_is_booked_by_me(self, obj):
        request = self.context.get("request")
        if not request or not request.user.is_authenticated:
            return False
        return obj.bookings.filter(user=request.user, status="confirmed").exists()

    def validate_price(self, value):
        if value < 0:
            raise serializers.ValidationError("Price cannot be negative.")
        return value

    def validate_capacity(self, value):
        if value < 1:
            raise serializers.ValidationError("Capacity must be at least 1.")
        return value
