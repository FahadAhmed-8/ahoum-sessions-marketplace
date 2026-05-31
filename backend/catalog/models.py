from django.conf import settings
from django.db import models


class Session(models.Model):
    """A bookable session offered by a creator."""

    creator = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="sessions",
    )
    title = models.CharField(max_length=255)
    description = models.TextField(blank=True)
    price = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    start_time = models.DateTimeField()
    duration_minutes = models.PositiveIntegerField(default=60)
    capacity = models.PositiveIntegerField(default=10)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["start_time"]

    @property
    def booked_count(self):
        return self.bookings.filter(status="confirmed").count()

    @property
    def spots_left(self):
        return max(self.capacity - self.booked_count, 0)

    @property
    def is_free(self):
        return self.price == 0

    def __str__(self):
        return self.title
