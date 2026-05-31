"""
Throttles with fixed scopes for sensitive endpoints.

NOTE: we subclass SimpleRateThrottle (not ScopedRateThrottle) because
ScopedRateThrottle overwrites its scope from the view's `throttle_scope`
attribute, which function-based views with @throttle_classes don't set —
that silently disables throttling. SimpleRateThrottle reads the rate from
DEFAULT_THROTTLE_RATES[scope] in __init__ and keeps our fixed scope.
"""
from rest_framework.throttling import SimpleRateThrottle


class AuthRateThrottle(SimpleRateThrottle):
    scope = "auth"

    def get_cache_key(self, request, view):
        # Anonymous OAuth endpoints: throttle by client IP.
        ident = self.get_ident(request)
        return self.cache_format % {"scope": self.scope, "ident": ident}


class BookingRateThrottle(SimpleRateThrottle):
    scope = "booking"

    def get_cache_key(self, request, view):
        # Authenticated: throttle per user; fall back to IP if anonymous.
        if request.user and request.user.is_authenticated:
            ident = request.user.pk
        else:
            ident = self.get_ident(request)
        return self.cache_format % {"scope": self.scope, "ident": ident}
