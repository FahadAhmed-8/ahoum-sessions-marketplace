from django.conf import settings
from django.db import models
from django.db.models import Q

from catalog.models import Session


class Booking(models.Model):
    """A user's reservation of a session."""

    class Status(models.TextChoices):
        CONFIRMED = "confirmed", "Confirmed"
        CANCELLED = "cancelled", "Cancelled"

    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="bookings",
    )
    session = models.ForeignKey(
        Session,
        on_delete=models.CASCADE,
        related_name="bookings",
    )
    status = models.CharField(
        max_length=10, choices=Status.choices, default=Status.CONFIRMED
    )
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-created_at"]
        constraints = [
            # No two *active* bookings of the same session by the same user.
            # Re-booking after cancellation is still allowed.
            models.UniqueConstraint(
                fields=["user", "session"],
                condition=Q(status="confirmed"),
                name="uniq_active_booking",
            )
        ]

    def __str__(self):
        return f"{self.user} -> {self.session} [{self.status}]"
