"""Current-user (/me) endpoints."""
from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework_simplejwt.exceptions import TokenError

from .models import User
from .serializers import UserSerializer


@api_view(["GET", "PATCH"])
@permission_classes([IsAuthenticated])
def me(request):
    if request.method == "PATCH":
        serializer = UserSerializer(request.user, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(serializer.data)
    return Response(UserSerializer(request.user).data)


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def become_creator(request):
    user = request.user
    if user.role != User.Role.CREATOR:
        user.role = User.Role.CREATOR
        user.save(update_fields=["role"])
    return Response(UserSerializer(user).data)


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def logout(request):
    """Blacklist the refresh token (best-effort)."""
    token = request.data.get("refresh")
    if not token:
        return Response({"detail": "refresh token required"}, status=400)
    try:
        RefreshToken(token).blacklist()
    except TokenError:
        return Response({"detail": "invalid token"}, status=400)
    except AttributeError:
        # blacklist app not installed; treat logout as client-side only
        pass
    return Response(status=status.HTTP_205_RESET_CONTENT)
