from rest_framework.routers import DefaultRouter

from .views import SessionViewSet

router = DefaultRouter(trailing_slash=False)
router.register(r"sessions", SessionViewSet, basename="session")

urlpatterns = router.urls
