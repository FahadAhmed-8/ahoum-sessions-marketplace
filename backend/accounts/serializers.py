from rest_framework import serializers

from .models import User


class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ("id", "email", "name", "avatar_url", "role", "oauth_provider")
        read_only_fields = ("id", "email", "role", "oauth_provider")


class UserPublicSerializer(serializers.ModelSerializer):
    """Trimmed view used when nesting a user inside sessions/bookings."""

    class Meta:
        model = User
        fields = ("id", "name", "avatar_url")
