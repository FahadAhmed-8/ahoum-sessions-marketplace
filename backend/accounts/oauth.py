"""
OAuth helpers for Google and GitHub.

Each provider implements the Authorization Code flow:
  1. build_authorize_url() -> where to send the user's browser
  2. exchange_code(code)   -> swap the code for an access token
  3. fetch_profile(token)  -> normalized dict: uid, email, name, avatar_url
"""
import requests
from django.conf import settings

GOOGLE_AUTH = "https://accounts.google.com/o/oauth2/v2/auth"
GOOGLE_TOKEN = "https://oauth2.googleapis.com/token"
GOOGLE_USERINFO = "https://openidconnect.googleapis.com/v1/userinfo"

GITHUB_AUTH = "https://github.com/login/oauth/authorize"
GITHUB_TOKEN = "https://github.com/login/oauth/access_token"
GITHUB_USER = "https://api.github.com/user"
GITHUB_EMAILS = "https://api.github.com/user/emails"

TIMEOUT = 10


def callback_url(provider):
    return f"{settings.BACKEND_BASE_URL}/api/auth/{provider}/callback"


class OAuthError(Exception):
    pass


def build_authorize_url(provider, state):
    if provider == "google":
        if not settings.GOOGLE_CLIENT_ID:
            raise OAuthError("Google OAuth is not configured")
        params = {
            "client_id": settings.GOOGLE_CLIENT_ID,
            "redirect_uri": callback_url("google"),
            "response_type": "code",
            "scope": "openid email profile",
            "state": state,
            "access_type": "online",
            "prompt": "select_account",
        }
        return _with_query(GOOGLE_AUTH, params)
    if provider == "github":
        if not settings.GITHUB_CLIENT_ID:
            raise OAuthError("GitHub OAuth is not configured")
        params = {
            "client_id": settings.GITHUB_CLIENT_ID,
            "redirect_uri": callback_url("github"),
            "scope": "read:user user:email",
            "state": state,
        }
        return _with_query(GITHUB_AUTH, params)
    raise OAuthError(f"Unknown provider: {provider}")


def exchange_code(provider, code):
    if provider == "google":
        resp = requests.post(
            GOOGLE_TOKEN,
            data={
                "client_id": settings.GOOGLE_CLIENT_ID,
                "client_secret": settings.GOOGLE_CLIENT_SECRET,
                "code": code,
                "grant_type": "authorization_code",
                "redirect_uri": callback_url("google"),
            },
            timeout=TIMEOUT,
        )
        _raise_for(resp, "Google token exchange failed")
        return resp.json()["access_token"]
    if provider == "github":
        resp = requests.post(
            GITHUB_TOKEN,
            headers={"Accept": "application/json"},
            data={
                "client_id": settings.GITHUB_CLIENT_ID,
                "client_secret": settings.GITHUB_CLIENT_SECRET,
                "code": code,
                "redirect_uri": callback_url("github"),
            },
            timeout=TIMEOUT,
        )
        _raise_for(resp, "GitHub token exchange failed")
        token = resp.json().get("access_token")
        if not token:
            raise OAuthError("GitHub did not return an access token")
        return token
    raise OAuthError(f"Unknown provider: {provider}")


def fetch_profile(provider, token):
    if provider == "google":
        resp = requests.get(
            GOOGLE_USERINFO,
            headers={"Authorization": f"Bearer {token}"},
            timeout=TIMEOUT,
        )
        _raise_for(resp, "Could not fetch Google profile")
        data = resp.json()
        return {
            "uid": str(data["sub"]),
            "email": data.get("email"),
            "name": data.get("name") or data.get("given_name") or "",
            "avatar_url": data.get("picture", ""),
        }
    if provider == "github":
        headers = {
            "Authorization": f"Bearer {token}",
            "Accept": "application/vnd.github+json",
        }
        resp = requests.get(GITHUB_USER, headers=headers, timeout=TIMEOUT)
        _raise_for(resp, "Could not fetch GitHub profile")
        data = resp.json()
        email = data.get("email")
        # GitHub may hide the email; fetch primary verified one if needed.
        if not email:
            email = _github_primary_email(headers)
        return {
            "uid": str(data["id"]),
            "email": email,
            "name": data.get("name") or data.get("login") or "",
            "avatar_url": data.get("avatar_url", ""),
        }
    raise OAuthError(f"Unknown provider: {provider}")


def _github_primary_email(headers):
    try:
        resp = requests.get(GITHUB_EMAILS, headers=headers, timeout=TIMEOUT)
        if resp.ok:
            for e in resp.json():
                if e.get("primary") and e.get("verified"):
                    return e.get("email")
    except requests.RequestException:
        pass
    return None  # acceptable: email is optional in our schema


def _with_query(url, params):
    from urllib.parse import urlencode

    return f"{url}?{urlencode(params)}"


def _raise_for(resp, msg):
    if not resp.ok:
        raise OAuthError(f"{msg} ({resp.status_code})")
