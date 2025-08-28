from __future__ import annotations

from datetime import datetime, timezone
from typing import Any, Dict

from fastapi import APIRouter, Depends, HTTPException
from motor.motor_asyncio import AsyncIOMotorDatabase
from pymongo import ReturnDocument

from ..db import get_db
from ..auth_utils import get_current_user
from ..models import InsertGoal, Goal
from ..models import new_id

router = APIRouter()


def _clean(doc: Dict[str, Any] | None) -> Dict[str, Any] | None:
    if doc is None:
        return None
    d = dict(doc)
    d.pop("_id", None)
    return d


@router.post("/goals")
async def create_goal(payload: InsertGoal, draft: bool = False, current_user=Depends(get_current_user), db: AsyncIOMotorDatabase = Depends(get_db)):
    user_id = current_user["id"]
    now = datetime.now(timezone.utc)
    doc: Dict[str, Any] = {
        **payload.model_dump(),
        "id": new_id(),
        "userId": user_id,
        "description": payload.description,
        "progress": 0,
        "status": "paused" if draft else "active",
        "createdAt": now,
        "updatedAt": now,
    }
    await db["goals"].insert_one(doc)

    # Log activity
    await db["activities"].insert_one({
        "id": new_id(),
        "userId": user_id,
        "type": "goal_draft_created" if draft else "goal_created",
        "description": (f"Saved draft goal: {doc['title']}" if draft else f"Created new goal: {doc['title']}"),
        "metadata": {"goalId": doc["id"], "goalTitle": doc["title"], "status": doc["status"]},
        "createdAt": now,
    })

    return _clean(doc)


@router.get("/goals")
async def list_goals(current_user=Depends(get_current_user), db: AsyncIOMotorDatabase = Depends(get_db)):
    user_id = current_user["id"]
    cursor = db["goals"].find({"userId": user_id})
    return [_clean(doc) for doc in [doc async for doc in cursor]]


@router.get("/goals/detailed")
async def list_goals_detailed(current_user=Depends(get_current_user), db: AsyncIOMotorDatabase = Depends(get_db)):
    user_id = current_user["id"]
    cursor = db["goals"].find({"userId": user_id})
    goals = [doc async for doc in cursor]

    results = []
    for goal in goals:
        goal_id = goal["id"]

        weekly_cursor = db["weekly_goals"].find({"goalId": goal_id}).sort("weekNumber")
        weekly = [wg async for wg in weekly_cursor]

        # attach tasks to weekly goals
        result_weekly = []
        for wg in weekly:
            tasks = [t async for t in db["daily_tasks"].find({"weeklyGoalId": wg["id"]}).sort("day")]
            wg_with_tasks = {**(_clean(wg) or {}), "tasks": [(_clean(t) or {}) for t in tasks]}
            result_weekly.append(wg_with_tasks)

        goal_with_weekly = {**(_clean(goal) or {}), "weeklyGoals": result_weekly}
        results.append(goal_with_weekly)

    return results


@router.get("/goals/{goal_id}")
async def get_goal(goal_id: str, current_user=Depends(get_current_user), db: AsyncIOMotorDatabase = Depends(get_db)):
    goal = await db["goals"].find_one({"id": goal_id, "userId": current_user["id"]})
    if not goal:
        raise HTTPException(status_code=404, detail="Goal not found")

    weekly_cursor = db["weekly_goals"].find({"goalId": goal_id}).sort("weekNumber")
    weekly = [wg async for wg in weekly_cursor]

    # attach tasks to weekly goals
    result_weekly = []
    for wg in weekly:
        tasks = [t async for t in db["daily_tasks"].find({"weeklyGoalId": wg["id"]}).sort("day")]
        wg_with_tasks = {**(_clean(wg) or {}), "tasks": [(_clean(t) or {}) for t in tasks]}
        result_weekly.append(wg_with_tasks)

    goal = _clean(goal) or {}
    goal["weeklyGoals"] = result_weekly
    return goal


@router.patch("/goals/{goal_id}")
async def update_goal(goal_id: str, updates: Dict[str, Any], current_user=Depends(get_current_user), db: AsyncIOMotorDatabase = Depends(get_db)):
    updates = {k: v for k, v in updates.items() if k not in {"id", "userId", "createdAt"}}
    if not updates:
        doc = await db["goals"].find_one({"id": goal_id, "userId": current_user["id"]})
        if not doc:
            raise HTTPException(status_code=404, detail="Goal not found")
        return _clean(doc)
    updates["updatedAt"] = datetime.now(timezone.utc)
    res = await db["goals"].find_one_and_update(
        {"id": goal_id, "userId": current_user["id"]},
        {"$set": updates},
        return_document=ReturnDocument.AFTER,
    )
    if not res:
        raise HTTPException(status_code=404, detail="Goal not found")
    return _clean(res)


@router.delete("/goals/{goal_id}")
async def delete_goal(goal_id: str, current_user=Depends(get_current_user), db: AsyncIOMotorDatabase = Depends(get_db)):
    user_id = current_user["id"]
    goal = await db["goals"].find_one({"id": goal_id, "userId": user_id})
    if not goal:
        raise HTTPException(status_code=404, detail="Goal not found")
    res = await db["goals"].delete_one({"id": goal_id, "userId": user_id})
    if res.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Goal not found")

    # Log delete activity
    now = datetime.now(timezone.utc)
    await db["activities"].insert_one({
        "id": new_id(),
        "userId": user_id,
        "type": "goal_deleted",
        "description": f"Deleted goal: {goal.get('title', '')}",
        "metadata": {"goalId": goal_id, "goalTitle": goal.get("title"), "status": goal.get("status")},
        "createdAt": now,
    })

    return {"message": "Goal deleted successfully"}
