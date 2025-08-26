from __future__ import annotations

from datetime import datetime
from typing import Any, Dict

from fastapi import APIRouter, Depends, HTTPException
from motor.motor_asyncio import AsyncIOMotorDatabase
from pymongo import ReturnDocument

from ..db import get_db
from ..auth_utils import get_current_user
from ..models import new_id

router = APIRouter()


def _clean(doc: dict | None) -> dict | None:
    if doc is None:
        return None
    d = dict(doc)
    d.pop("_id", None)
    return d


@router.patch("/tasks/{task_id}")
async def update_task(task_id: str, updates: Dict[str, Any], current_user=Depends(get_current_user), db: AsyncIOMotorDatabase = Depends(get_db)):
    # sanitize updates (do not allow id fields to change)
    blocked = {"id", "goalId", "weeklyGoalId", "createdAt"}
    updates = {k: v for k, v in updates.items() if k not in blocked}

    existing = await db["daily_tasks"].find_one({"id": task_id})
    if not existing:
        raise HTTPException(status_code=404, detail="Task not found")

    was_completed = bool(existing.get("completed", False))

    if updates:
        updates["updatedAt"] = datetime.utcnow()

    updated = await db["daily_tasks"].find_one_and_update(
        {"id": task_id},
        {"$set": updates},
        return_document=ReturnDocument.AFTER,
    )

    if not updated:
        raise HTTPException(status_code=404, detail="Task not found")

    # Log activity if completed transitioned to True
    if updates.get("completed") is True and not was_completed and updated.get("completed") is True:
        await db["activities"].insert_one({
            "id": new_id(),
            "userId": current_user["id"],
            "type": "task_completed",
            "description": f"Completed task: {updated.get('title', '')}",
            "metadata": {"taskId": updated.get("id"), "taskTitle": updated.get("title")},
            "createdAt": datetime.utcnow(),
        })

    return _clean(updated)
