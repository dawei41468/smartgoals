import pytest
from fastapi.testclient import TestClient

from api.main import create_app


class TestMainApp:
    """Test cases for the main FastAPI application."""

    def test_create_app(self):
        """Test that the app can be created successfully."""
        app = create_app()
        assert app.title == "SmartGoals API"
        assert app.version == "1.0.0"

    def test_app_has_cors_middleware(self):
        """Test that CORS middleware is properly configured."""
        app = create_app()
        cors_middleware = None
        for middleware in app.user_middleware:
            if hasattr(middleware, 'cls') and 'CORSMiddleware' in str(middleware.cls):
                cors_middleware = middleware
                break

        assert cors_middleware is not None

    def test_app_includes_routers(self):
        """Test that all routers are included in the app."""
        app = create_app()

        # Check that we have routes (routers are included)
        assert len(app.routes) > 0

        # Check that we have more than just the default routes
        # (indicating routers have been included)
        assert len(app.routes) > 5  # Default FastAPI routes + our API routes

    def test_health_check_endpoint(self, test_client):
        """Test a basic health check endpoint."""
        # This assumes there's a health check endpoint - adjust based on your actual endpoints
        response = test_client.get("/docs")  # FastAPI docs endpoint
        assert response.status_code == 200

    def test_openapi_schema(self, test_client):
        """Test that OpenAPI schema is generated correctly."""
        response = test_client.get("/openapi.json")
        assert response.status_code == 200

        schema = response.json()
        assert "openapi" in schema
        assert "info" in schema
        assert "paths" in schema


class TestCORS:
    """Test cases for CORS configuration."""

    def test_cors_headers(self, test_client):
        """Test that CORS headers are present in responses."""
        response = test_client.options("/docs",
                                    headers={"Origin": "http://localhost:5173"})
        assert response.status_code in [200, 404]  # 404 is ok, CORS headers should still be present

        # Check for CORS headers
        cors_headers = [
            "access-control-allow-origin",
            "access-control-allow-methods",
            "access-control-allow-headers"
        ]

        response_headers = {k.lower(): v for k, v in response.headers.items()}
        for header in cors_headers:
            assert header in response_headers