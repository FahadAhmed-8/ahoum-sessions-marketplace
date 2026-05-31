import uuid

from django.contrib.auth.models import AbstractUser
from django.db import models


class User(AbstractUser):
    """
    Custom user. We keep Django's default `username` field (auto-generated and
    invisible to end-users) since login is OAuth-only. Accounts are matched on
    (oauth_provider, provider_uid), never on email alone.
    """

    class Role(models.TextChoices):
        USER = "user", "User"
        CREATOR = "creator", "Creator"

    class Provider(models.TextChoices):
        GOOGLE = "google", "Google"
        GITHUB = "github", "GitHub"

    # email may be blank: GitHub lets users hide it.
    email = models.EmailField(blank=True, null=True)
    name = models.CharField(max_length=255, blank=True)
    avatar_url = models.URLField(blank=True)
    role = models.CharField(
        max_length=10, choices=Role.choices, default=Role.USER
    )
    oauth_provider = models.CharField(
        max_length=10, choices=Provider.choices
    )
    provider_uid = models.CharField(max_length=255)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        constraints = [
            models.UniqueConstraint(
                fields=["oauth_provider", "provider_uid"],
                name="uniq_provider_identity",
            )
        ]

    @property
    def is_creator(self):
        return self.role == self.Role.CREATOR

    @staticmethod
    def generate_username(provider, provider_uid):
        return f"{provider}_{provider_uid}_{uuid.uuid4().hex[:6]}"

    def __str__(self):
        return f"{self.name or self.username} ({self.role})"
