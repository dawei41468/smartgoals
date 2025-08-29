from __future__ import annotations

from datetime import datetime, timezone
from typing import Any, Dict

from fastapi import APIRouter, Depends, HTTPException
from motor.motor_asyncio import AsyncIOMotorDatabase
from pymongo import ReturnDocument

from ..db import get_db
from ..auth_utils import get_current_user
from ..models import new_id
from ..exceptions import NotFoundError, AuthorizationError
from ..validation import UpdateTaskRequest, validate_object_id
from ..db_queries import get_user_analytics_aggregated, calculate_streaks, get_achievement_definitions, create_or_update_achievement, initialize_achievement_definitions

router = APIRouter()


def _clean(doc: dict | None) -> dict | None:
    if doc is None:
        return None
    d = dict(doc)
    d.pop("_id", None)
    return d


@router.patch("/tasks/{task_id}")
async def update_task(task_id: str, updates: UpdateTaskRequest, current_user=Depends(get_current_user), db: AsyncIOMotorDatabase = Depends(get_db)):
    validate_object_id(task_id, "task_id")
    
    existing = await db["daily_tasks"].find_one({"id": task_id})
    if not existing:
        raise NotFoundError("Task", task_id)

    # Verify user owns the goal that contains this task
    goal = await db["goals"].find_one({"id": existing["goalId"]})
    if not goal or goal["userId"] != current_user["id"]:
        raise AuthorizationError("Access denied to task")

    was_completed = bool(existing.get("completed", False))
    
    # Convert to dict and filter out None values
    update_dict = {k: v for k, v in updates.model_dump(exclude_none=True).items()}
    
    if update_dict:
        update_dict["updatedAt"] = datetime.now(timezone.utc)

    # Ensure required fields have defaults when creating new tasks
    # For updates, only set defaults if the task doesn't exist yet
    existing_task = await db["daily_tasks"].find_one({"id": task_id})
    if not existing_task:
        # Set defaults for new tasks
        update_dict.setdefault("completed", False)
        update_dict.setdefault("priority", "medium")
        update_dict.setdefault("estimatedHours", 1)

    updated = await db["daily_tasks"].find_one_and_update(
        {"id": task_id},
        {"$set": update_dict},
        return_document=ReturnDocument.AFTER,
    )

    if not updated:
        raise NotFoundError("Task", task_id)

    # Log activity if completed transitioned to True
    if update_dict.get("completed") is True and not was_completed and updated.get("completed") is True:
        await db["activities"].insert_one({
            "id": new_id(),
            "userId": current_user["id"],
            "type": "task_completed",
            "description": f"Completed task: {updated.get('title', '')}",
            "metadata": {"taskId": updated.get("id"), "taskTitle": updated.get("title")},
            "createdAt": datetime.now(timezone.utc),
        })

        # Check for newly unlocked achievements
        await _check_achievements_after_task_completion(db, current_user["id"])

    return _clean(updated)


async def _check_achievements_after_task_completion(db: AsyncIOMotorDatabase, user_id: str) -> None:
    """Check for newly unlocked achievements after task completion"""
    try:
        # Initialize achievement definitions if needed
        await initialize_achievement_definitions(db)

        # Get current user stats and streaks
        stats = await get_user_analytics_aggregated(db, user_id)
        streaks = await calculate_streaks(db, user_id)

        # Get achievement definitions
        definitions = await get_achievement_definitions(db)

        # Check each achievement definition
        for definition in definitions:
            achievement_id = definition["id"]
            trigger_type = definition["triggerType"]
            trigger_value = definition["triggerValue"]

            # Calculate current progress
            progress = 0

            if trigger_type == "goal_count":
                progress = stats["totalGoals"]
            elif trigger_type == "completed_goal_count":
                progress = stats["completedGoals"]
            elif trigger_type == "completed_task_count":
                progress = stats["completedTasks"]
            elif trigger_type == "streak_count":
                progress = streaks["currentStreak"]
            elif trigger_type == "monthly_task_count":
                progress = stats["completedTasks"]

            # Check if achievement should be unlocked
            if progress >= trigger_value:
                # Check if already unlocked
                existing = await db["achievements"].find_one({
                    "userId": user_id,
                    "achievementId": achievement_id,
                    "unlockedAt": {"$ne": None}
                })

                if not existing:
                    # Create/update achievement
                    achievement_data = {
                        "achievementId": achievement_id,
                        "title": definition["title"],
                        "description": definition["description"],
                        "icon": definition["icon"],
                        "category": definition["category"],
                        "progress": progress,
                        "target": trigger_value
                    }

                    await create_or_update_achievement(db, user_id, achievement_data)

    except Exception as e:
        # Log error but don't fail the task update
        print(f"Error checking achievements: {e}")
