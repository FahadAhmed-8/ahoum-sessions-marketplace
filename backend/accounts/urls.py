from django.urls import path

from . import views

urlpatterns = [
    path("me", views.me, name="me"),
    path("me/become-creator", views.become_creator, name="become-creator"),
]
