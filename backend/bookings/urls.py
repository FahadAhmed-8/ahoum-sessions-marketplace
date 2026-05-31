from django.urls import path

from . import views

urlpatterns = [
    path("bookings", views.create_booking, name="booking-create"),
    path("bookings/mine", views.my_bookings, name="booking-mine"),
    path("bookings/<int:pk>/cancel", views.cancel_booking, name="booking-cancel"),
]
