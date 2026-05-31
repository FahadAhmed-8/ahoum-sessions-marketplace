"""OAuth login/callback + JWT issuance."""
from urllib.parse import urlencode

from django.conf import settings
from django.shortcuts import redirect
from rest_framework import status
from rest_framework.decorators import api_view, permission_classes, throttle_classes
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework.throttling import ScopedRateThrottle
from rest_framework_simplejwt.tokens import RefreshToken

from .models import User
from . import oauth

PROVIDERS = ("google", "github")


class AuthThrottle(ScopedRateThrottle):
    scope = "auth"


@api_view(["GET"])
@permission_classes([AllowAny])
@throttle_classes([AuthThrottle])
def oauth_login(request, provider):
    """Redirect the browser to the provider's consent screen."""
    if provider not in PROVIDERS:
        return Response({"detail": "Unknown provider"}, status=404)
    try:
        url = oauth.build_authorize_url(provider, state=provider)
    except oauth.OAuthError as exc:
        return _fail_redirect(str(exc))
    return redirect(url)


@api_view(["GET"])
@permission_classes([AllowAny])
@throttle_classes([AuthThrottle])
def oauth_callback(request, provider):
    """Handle provider redirect: exchange code, upsert user, issue JWT."""
    if provider not in PROVIDERS:
        return Response({"detail": "Unknown provider"}, status=404)

    error = request.GET.get("error")
    if error:
        return _fail_redirect(f"Provider error: {error}")

    code = request.GET.get("code")
    if not code:
        return _fail_redirect("Missing authorization code")

    try:
        token = oauth.exchange_code(provider, code)
        profile = oauth.fetch_profile(provider, token)
    except oauth.OAuthError as exc:
        return _fail_redirect(str(exc))

    user = _get_or_create_user(provider, profile)
    refresh = RefreshToken.for_user(user)

    # Redirect back to the frontend with tokens in the URL fragment.
    fragment = urlencode({"access": str(refresh.access_token), "refresh": str(refresh)})
    return redirect(f"{settings.FRONTEND_URL}/auth/callback#{fragment}")


def _get_or_create_user(provider, profile):
    uid = profile["uid"]
    user, created = User.objects.get_or_create(
        oauth_provider=provider,
        provider_uid=uid,
        defaults={
            "username": User.generate_username(provider, uid),
            "email": profile.get("email"),
            "name": profile.get("name", ""),
            "avatar_url": profile.get("avatar_url", ""),
        },
    )
    if not created:
        # Refresh basic profile data on each login (but never role).
        changed = False
        for field in ("email", "name", "avatar_url"):
            val = profile.get(field)
            if val and getattr(user, field) != val:
                setattr(user, field, val)
                changed = True
        if changed:
            user.save()
    return user


def _fail_redirect(message):
    return redirect(f"{settings.FRONTEND_URL}/auth/callback#{urlencode({'error': message})}")
