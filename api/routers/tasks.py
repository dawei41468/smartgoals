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

    return _clean(updated)
