import pytest
from httpx import AsyncClient
from fastapi.testclient import TestClient
from motor.motor_asyncio import AsyncIOMotorDatabase
import json


@pytest.mark.api
class TestGoalsAPI:
    """Test cases for Goals API endpoints."""

    async def test_create_goal_success(self, test_client, test_user, test_db):
        """Test successful goal creation."""
        # First create a user in the database
        await test_db.users.insert_one(test_user)

        # Create goal data
        goal_data = {
            "title": "Test Goal",
            "description": "Test goal description",
            "category": "Health",
            "specific": "Specific test criteria",
            "measurable": "Measurable test criteria",
            "achievable": "Achievable test criteria",
            "relevant": "Relevant test criteria",
            "timebound": "Timebound test criteria",
            "exciting": "Exciting test criteria",
            "deadline": "2024-02-01T00:00:00Z"
        }

        # Make request with auth headers
        response = test_client.post(
            "/api/goals",
            json=goal_data,
            headers={"Authorization": f"Bearer mock-token-{test_user['id']}"}
        )

        assert response.status_code == 201
        response_data = response.json()
        assert response_data["success"] is True
        assert response_data["data"]["title"] == goal_data["title"]
        assert response_data["data"]["category"] == goal_data["category"]
        assert "id" in response_data["data"]

    async def test_create_goal_validation_error(self, test_client, test_user, test_db):
        """Test goal creation with validation errors."""
        await test_db.users.insert_one(test_user)

        # Create invalid goal data (missing required fields)
        invalid_goal_data = {
            "title": "",  # Empty title
            "category": "Health",
            "specific": "Specific criteria"
            # Missing other required fields
        }

        response = test_client.post(
            "/api/goals",
            json=invalid_goal_data,
            headers={"Authorization": f"Bearer mock-token-{test_user['id']}"}
        )

        assert response.status_code == 422
        response_data = response.json()
        assert response_data["success"] is False
        assert "errors" in response_data["data"]

    async def test_get_goals_success(self, test_client, test_user, test_goal, test_db):
        """Test successful goals retrieval."""
        # Create user and goal in database
        await test_db.users.insert_one(test_user)
        await test_db.goals.insert_one(test_goal)

        response = test_client.get(
            "/api/goals",
            headers={"Authorization": f"Bearer mock-token-{test_user['id']}"}
        )

        assert response.status_code == 200
        response_data = response.json()
        assert response_data["success"] is True
        assert len(response_data["data"]) >= 1
        assert response_data["data"][0]["title"] == test_goal["title"]

    async def test_get_goals_empty(self, test_client, test_user, test_db):
        """Test goals retrieval when no goals exist."""
        await test_db.users.insert_one(test_user)

        response = test_client.get(
            "/api/goals",
            headers={"Authorization": f"Bearer mock-token-{test_user['id']}"}
        )

        assert response.status_code == 200
        response_data = response.json()
        assert response_data["success"] is True
        assert response_data["data"] == []
        assert response_data["message"] == "Goals retrieved successfully"

    async def test_get_goal_by_id_success(self, test_client, test_user, test_goal, test_db):
        """Test successful single goal retrieval."""
        await test_db.users.insert_one(test_user)
        await test_db.goals.insert_one(test_goal)

        response = test_client.get(
            f"/api/goals/{test_goal['id']}",
            headers={"Authorization": f"Bearer mock-token-{test_user['id']}"}
        )

        assert response.status_code == 200
        response_data = response.json()
        assert response_data["success"] is True
        assert response_data["data"]["id"] == test_goal["id"]
        assert response_data["data"]["title"] == test_goal["title"]

    async def test_get_goal_by_id_not_found(self, test_client, test_user, test_db):
        """Test goal retrieval with non-existent ID."""
        await test_db.users.insert_one(test_user)

        response = test_client.get(
            "/api/goals/non-existent-id",
            headers={"Authorization": f"Bearer mock-token-{test_user['id']}"}
        )

        assert response.status_code == 404
        response_data = response.json()
        assert response_data["success"] is False
        assert "not found" in response_data["message"].lower()

    async def test_update_goal_success(self, test_client, test_user, test_goal, test_db):
        """Test successful goal update."""
        await test_db.users.insert_one(test_user)
        await test_db.goals.insert_one(test_goal)

        update_data = {
            "title": "Updated Goal Title",
            "status": "completed",
            "description": "Updated description"
        }

        response = test_client.patch(
            f"/api/goals/{test_goal['id']}",
            json=update_data,
            headers={"Authorization": f"Bearer mock-token-{test_user['id']}"}
        )

        assert response.status_code == 200
        response_data = response.json()
        assert response_data["success"] is True
        assert response_data["data"]["title"] == update_data["title"]
        assert response_data["data"]["status"] == update_data["status"]

    async def test_update_goal_not_found(self, test_client, test_user, test_db):
        """Test goal update with non-existent ID."""
        await test_db.users.insert_one(test_user)

        update_data = {"title": "Updated Title"}

        response = test_client.patch(
            "/api/goals/non-existent-id",
            json=update_data,
            headers={"Authorization": f"Bearer mock-token-{test_user['id']}"}
        )

        assert response.status_code == 404
        response_data = response.json()
        assert response_data["success"] is False

    async def test_delete_goal_success(self, test_client, test_user, test_goal, test_db):
        """Test successful goal deletion."""
        await test_db.users.insert_one(test_user)
        await test_db.goals.insert_one(test_goal)

        response = test_client.delete(
            f"/api/goals/{test_goal['id']}",
            headers={"Authorization": f"Bearer mock-token-{test_user['id']}"}
        )

        assert response.status_code == 200
        response_data = response.json()
        assert response_data["success"] is True
        assert "deleted" in response_data["message"].lower()

        # Verify goal is actually deleted
        goal_in_db = await test_db.goals.find_one({"id": test_goal["id"]})
        assert goal_in_db is None

    async def test_delete_goal_not_found(self, test_client, test_user, test_db):
        """Test goal deletion with non-existent ID."""
        await test_db.users.insert_one(test_user)

        response = test_client.delete(
            "/api/goals/non-existent-id",
            headers={"Authorization": f"Bearer mock-token-{test_user['id']}"}
        )

        assert response.status_code == 404
        response_data = response.json()
        assert response_data["success"] is False


@pytest.mark.api
class TestGoalsAPIEdgeCases:
    """Test edge cases for Goals API."""

    async def test_create_goal_with_minimal_data(self, test_client, test_user, test_db):
        """Test goal creation with minimal valid data."""
        await test_db.users.insert_one(test_user)

        minimal_goal_data = {
            "title": "Minimal Goal",
            "category": "Personal",
            "specific": "Be specific",
            "measurable": "Measure progress",
            "achievable": "Make it achievable",
            "relevant": "Keep it relevant",
            "timebound": "Set time limits",
            "exciting": "Make it exciting",
            "deadline": "2024-12-31T23:59:59Z"
        }

        response = test_client.post(
            "/api/goals",
            json=minimal_goal_data,
            headers={"Authorization": f"Bearer mock-token-{test_user['id']}"}
        )

        assert response.status_code == 201
        response_data = response.json()
        assert response_data["success"] is True

    async def test_create_goal_with_past_deadline(self, test_client, test_user, test_db):
        """Test goal creation with past deadline."""
        await test_db.users.insert_one(test_user)

        past_deadline_data = {
            "title": "Past Deadline Goal",
            "category": "Work",
            "specific": "Be specific",
            "measurable": "Measure progress",
            "achievable": "Make it achievable",
            "relevant": "Keep it relevant",
            "timebound": "Set time limits",
            "exciting": "Make it exciting",
            "deadline": "2020-01-01T00:00:00Z"  # Past date
        }

        response = test_client.post(
            "/api/goals",
            json=past_deadline_data,
            headers={"Authorization": f"Bearer mock-token-{test_user['id']}"}
        )

        # Should still create the goal but validation might warn
        assert response.status_code in [201, 422]

    async def test_get_detailed_goals(self, test_client, test_user, test_goal, test_db):
        """Test detailed goals retrieval."""
        await test_db.users.insert_one(test_user)
        await test_db.goals.insert_one(test_goal)

        response = test_client.get(
            "/api/goals/detailed",
            headers={"Authorization": f"Bearer mock-token-{test_user['id']}"}
        )

        assert response.status_code == 200
        response_data = response.json()
        assert response_data["success"] is True
        assert isinstance(response_data["data"], list)
