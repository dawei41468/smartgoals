import pytest
from unittest.mock import AsyncMock, MagicMock
from fastapi.testclient import TestClient
from fastapi import HTTPException

from api.main import create_app
from api.models import InsertGoal


class TestGoalsAPI:
    """Test cases for Goals API endpoints."""

    def test_create_goal_success(self, test_client, test_user, auth_headers, monkeypatch):
        """Test successful goal creation."""
        # Mock the database operations
        mock_db = AsyncMock()
        mock_goals_collection = AsyncMock()
        mock_activities_collection = AsyncMock()

        mock_db.__getitem__.side_effect = lambda key: {
            "goals": mock_goals_collection,
            "activities": mock_activities_collection
        }[key]

        # Mock the get_db dependency
        monkeypatch.setattr("api.routers.goals.get_db", lambda: mock_db)

        # Mock the current user dependency
        monkeypatch.setattr("api.routers.goals.get_current_user", lambda: test_user)

        goal_data = {
            "title": "Test Goal",
            "description": "Test description",
            "category": "Health",
            "specific": "Test specific",
            "measurable": "Test measurable",
            "achievable": "Test achievable",
            "relevant": "Test relevant",
            "timebound": "Test timebound",
            "exciting": "Test exciting"
        }

        response = test_client.post("/api/goals", json=goal_data, headers=auth_headers)

        assert response.status_code == 201
        response_data = response.json()
        assert response_data["success"] is True
        assert response_data["data"]["title"] == "Test Goal"
        assert response_data["data"]["status"] == "active"

        # Verify database calls
        mock_goals_collection.insert_one.assert_called_once()
        mock_activities_collection.insert_one.assert_called_once()

    def test_create_goal_draft(self, test_client, test_user, auth_headers, monkeypatch):
        """Test goal creation as draft."""
        # Mock the database operations
        mock_db = AsyncMock()
        mock_goals_collection = AsyncMock()
        mock_activities_collection = AsyncMock()

        mock_db.__getitem__.side_effect = lambda key: {
            "goals": mock_goals_collection,
            "activities": mock_activities_collection
        }[key]

        # Mock the dependencies
        monkeypatch.setattr("api.routers.goals.get_db", lambda: mock_db)
        monkeypatch.setattr("api.routers.goals.get_current_user", lambda: test_user)

        goal_data = {
            "title": "Draft Goal",
            "description": "Draft description",
            "category": "Career",
            "specific": "Draft specific",
            "measurable": "Draft measurable",
            "achievable": "Draft achievable",
            "relevant": "Draft relevant",
            "timebound": "Draft timebound",
            "exciting": "Draft exciting"
        }

        response = test_client.post("/api/goals?draft=true", json=goal_data, headers=auth_headers)

        assert response.status_code == 201
        response_data = response.json()
        assert response_data["data"]["status"] == "paused"  # Draft status

    def test_list_goals(self, test_client, test_user, auth_headers, monkeypatch):
        """Test listing user's goals."""
        # Mock the database operations
        mock_db = AsyncMock()
        mock_goals_collection = AsyncMock()

        # Mock find method to return async iterator
        mock_cursor = AsyncMock()
        mock_cursor.__aiter__.return_value = [
            {
                "id": "goal1",
                "userId": test_user["id"],
                "title": "Goal 1",
                "status": "active"
            },
            {
                "id": "goal2",
                "userId": test_user["id"],
                "title": "Goal 2",
                "status": "completed"
            }
        ]

        mock_goals_collection.find.return_value = mock_cursor
        mock_db.__getitem__.return_value = mock_goals_collection

        # Mock the dependencies
        monkeypatch.setattr("api.routers.goals.get_db", lambda: mock_db)
        monkeypatch.setattr("api.routers.goals.get_current_user", lambda: test_user)

        response = test_client.get("/api/goals", headers=auth_headers)

        assert response.status_code == 200
        response_data = response.json()
        assert response_data["success"] is True
        assert len(response_data["data"]) == 2
        assert response_data["data"][0]["title"] == "Goal 1"
        assert response_data["data"][1]["title"] == "Goal 2"

    def test_get_goal_success(self, test_client, test_user, auth_headers, monkeypatch):
        """Test retrieving a specific goal."""
        # Mock the database operations
        mock_db = AsyncMock()
        mock_goals_collection = AsyncMock()
        mock_weekly_collection = AsyncMock()
        mock_tasks_collection = AsyncMock()

        # Mock goal data
        goal_data = {
            "id": "goal1",
            "userId": test_user["id"],
            "title": "Test Goal",
            "status": "active"
        }

        mock_goals_collection.find_one.return_value = goal_data
        mock_weekly_collection.find.return_value = AsyncMock()
        mock_tasks_collection.find.return_value = AsyncMock()

        mock_db.__getitem__.side_effect = lambda key: {
            "goals": mock_goals_collection,
            "weekly_goals": mock_weekly_collection,
            "daily_tasks": mock_tasks_collection
        }[key]

        # Mock the dependencies
        monkeypatch.setattr("api.routers.goals.get_db", lambda: mock_db)
        monkeypatch.setattr("api.routers.goals.get_current_user", lambda: test_user)

        response = test_client.get("/api/goals/goal1", headers=auth_headers)

        assert response.status_code == 200
        response_data = response.json()
        assert response_data["success"] is True
        assert response_data["data"]["title"] == "Test Goal"

    def test_get_goal_not_found(self, test_client, test_user, auth_headers, monkeypatch):
        """Test retrieving a non-existent goal."""
        # Mock the database operations
        mock_db = AsyncMock()
        mock_goals_collection = AsyncMock()

        mock_goals_collection.find_one.return_value = None
        mock_db.__getitem__.return_value = mock_goals_collection

        # Mock the dependencies
        monkeypatch.setattr("api.routers.goals.get_db", lambda: mock_db)
        monkeypatch.setattr("api.routers.goals.get_current_user", lambda: test_user)

        response = test_client.get("/api/goals/nonexistent", headers=auth_headers)

        assert response.status_code == 404

    def test_update_goal_success(self, test_client, test_user, auth_headers, monkeypatch):
        """Test successful goal update."""
        # Mock the database operations
        mock_db = AsyncMock()
        mock_goals_collection = AsyncMock()

        existing_goal = {
            "id": "goal1",
            "userId": test_user["id"],
            "title": "Old Title",
            "status": "active"
        }

        updated_goal = {
            "id": "goal1",
            "userId": test_user["id"],
            "title": "Updated Title",
            "status": "active",
            "updatedAt": "2023-01-02T00:00:00Z"
        }

        mock_goals_collection.find_one.return_value = existing_goal
        mock_goals_collection.find_one_and_update.return_value = updated_goal
        mock_db.__getitem__.return_value = mock_goals_collection

        # Mock the dependencies
        monkeypatch.setattr("api.routers.goals.get_db", lambda: mock_db)
        monkeypatch.setattr("api.routers.goals.get_current_user", lambda: test_user)

        update_data = {"title": "Updated Title"}

        response = test_client.patch("/api/goals/goal1", json=update_data, headers=auth_headers)

        assert response.status_code == 200
        response_data = response.json()
        assert response_data["success"] is True
        assert response_data["data"]["title"] == "Updated Title"

    def test_delete_goal_success(self, test_client, test_user, auth_headers, monkeypatch):
        """Test successful goal deletion."""
        # Mock the database operations
        mock_db = AsyncMock()
        mock_goals_collection = AsyncMock()
        mock_activities_collection = AsyncMock()

        goal_data = {
            "id": "goal1",
            "userId": test_user["id"],
            "title": "Test Goal",
            "status": "active"
        }

        mock_goals_collection.find_one.return_value = goal_data
        mock_goals_collection.delete_one.return_value = MagicMock(deleted_count=1)

        mock_db.__getitem__.side_effect = lambda key: {
            "goals": mock_goals_collection,
            "activities": mock_activities_collection
        }[key]

        # Mock the dependencies
        monkeypatch.setattr("api.routers.goals.get_db", lambda: mock_db)
        monkeypatch.setattr("api.routers.goals.get_current_user", lambda: test_user)

        response = test_client.delete("/api/goals/goal1", headers=auth_headers)

        assert response.status_code == 200
        response_data = response.json()
        assert response_data["success"] is True
        assert "deleted" in response_data["message"].lower()

        # Verify activity logging
        mock_activities_collection.insert_one.assert_called_once()

    def test_unauthorized_access(self, test_client, monkeypatch):
        """Test accessing goals without authentication."""
        # Don't mock auth - should fail
        response = test_client.get("/api/goals")

        assert response.status_code == 401