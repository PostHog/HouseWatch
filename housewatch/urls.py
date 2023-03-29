from django.contrib import admin
from django.contrib.auth import views as auth_views
from django.urls import include, path
from rest_framework_extensions.routers import ExtendedDefaultRouter
from housewatch.api.instance import InstanceViewset
from housewatch.api.analyze import AnalyzeViewset
from housewatch.views import healthz

class DefaultRouterPlusPlus(ExtendedDefaultRouter):
    """DefaultRouter with optional trailing slash and drf-extensions nesting."""

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self.trailing_slash = r"/?"


router = DefaultRouterPlusPlus()
router.register(r"api/instance", InstanceViewset, basename="instance")
router.register(r"api/analyze", AnalyzeViewset, basename="instance")
urlpatterns = [
    path("admin/", admin.site.urls),
    path("healthz", healthz, name="healthz"),
    path("logout", auth_views.LogoutView.as_view()),
    *router.urls,
]
