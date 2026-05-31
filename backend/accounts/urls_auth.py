from django.urls import path
from rest_framework_simplejwt.views import TokenRefreshView

from . import views_auth, views

urlpatterns = [
    path("<str:provider>/login", views_auth.oauth_login, name="oauth-login"),
    path("<str:provider>/callback", views_auth.oauth_callback, name="oauth-callback"),
    path("refresh", TokenRefreshView.as_view(), name="token-refresh"),
    path("logout", views.logout, name="logout"),
]
