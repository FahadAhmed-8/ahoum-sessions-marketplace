from django.contrib import admin
from django.contrib.auth.admin import UserAdmin

from .models import User


@admin.register(User)
class CustomUserAdmin(UserAdmin):
    list_display = ("id", "name", "email", "role", "oauth_provider")
    list_filter = ("role", "oauth_provider")
    search_fields = ("name", "email", "username")
    fieldsets = UserAdmin.fieldsets + (
        ("Marketplace", {"fields": ("name", "avatar_url", "role", "oauth_provider", "provider_uid")}),
    )
