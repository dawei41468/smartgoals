import pytest
import asyncio
from httpx import AsyncClient
from motor.motor_asyncio import AsyncIOMotorClient
from pymongo.errors import ServerSelectionTimeoutError
import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

from api.main import app
from api.config import get_settings


@pytest.fixture(scope="session")
def event_loop():
    """Create an instance of the default event loop for the test session."""
    loop = asyncio.get_event_loop_policy().new_event_loop()
    yield loop
    loop.close()


@pytest.fixture(scope="session")
async def test_client():
    """Create a test client for the FastAPI app."""
    from fastapi.testclient import TestClient
    client = TestClient(app)
    yield client


@pytest.fixture(scope="session")
async def test_db():
    """Create a test database connection."""
    settings = get_settings()

    # Use test database
    test_db_name = f"{settings.MONGODB_DB}_test"
    test_mongo_url = settings.MONGODB_URI

    try:
        client = AsyncIOMotorClient(test_mongo_url)
        db = client[test_db_name]

        # Wait for connection
        await client.admin.command('ping')

        yield db

        # Cleanup: drop test database
        await client.drop_database(test_db_name)
        client.close()

    except ServerSelectionTimeoutError:
        pytest.skip("MongoDB is not available")


@pytest.fixture
async def test_user():
    """Create a test user data."""
    return {
        "id": "test-user-id",
        "username": "testuser",
        "firstName": "Test",
        "lastName": "User",
        "email": "test@example.com",
        "bio": "Test bio",
        "createdAt": "2023-01-01T00:00:00Z",
        "updatedAt": "2023-01-01T00:00:00Z"
    }


@pytest.fixture
async def test_goal():
    """Create a test goal data."""
    return {
        "id": "test-goal-id",
        "userId": "test-user-id",
        "title": "Test Goal",
        "description": "Test description",
        "category": "Health",
        "specific": "Test specific",
        "measurable": "Test measurable",
        "achievable": "Test achievable",
        "relevant": "Test relevant",
        "timebound": "Test timebound",
        "exciting": "Test exciting",
        "status": "active",
        "createdAt": "2023-01-01T00:00:00Z",
        "updatedAt": "2023-01-01T00:00:00Z"
    }


@pytest.fixture
async def auth_headers(test_user):
    """Create authorization headers for authenticated requests."""
    # This would typically create a JWT token
    # For now, return empty headers - implement based on your auth system
    return {"Authorization": "Bearer test-token"}


@pytest.fixture(autouse=True)
async def cleanup_test_data(test_db):
    """Clean up test data before each test."""
    collections = await test_db.list_collection_names()
    for collection in collections:
        await test_db[collection].delete_many({})