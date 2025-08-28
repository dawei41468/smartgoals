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
from ..exceptions import NotFoundError, ValidationError, AuthorizationError
from ..validation import UpdateGoalRequest, validate_object_id, validate_user_ownership
from ..response_utils import (
    success_response, created_response, updated_response, deleted_response
)

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
    # Fallback: if no title provided, derive from 'specific'
    derived_title = (payload.title or (payload.specific[:50] + ("..." if len(payload.specific) > 50 else "")))

    doc = {
        "id": new_id(),
        "userId": user_id,
        "title": derived_title,
        "description": payload.description,
        "category": payload.category,
        "specific": payload.specific,
        "measurable": payload.measurable,
        "achievable": payload.achievable,
        "relevant": payload.relevant,
        "timebound": payload.timebound,
        "exciting": payload.exciting,
        "deadline": payload.deadline,
        "progress": 0,  # Always ensure progress is set
        "status": "paused" if draft else "active",  # Always ensure status is set
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

    return created_response(
        data=_clean(doc),
        message="Goal draft created successfully" if draft else "Goal created successfully"
    )


@router.get("/goals")
async def list_goals(current_user=Depends(get_current_user), db: AsyncIOMotorDatabase = Depends(get_db)):
    user_id = current_user["id"]
    cursor = db["goals"].find({"userId": user_id})
    goals = [_clean(doc) for doc in [doc async for doc in cursor]]
    return success_response(
        data=goals,
        message=f"Retrieved {len(goals)} goals successfully"
    )


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

    return success_response(
        data=results,
        message=f"Retrieved {len(results)} detailed goals successfully"
    )


@router.get("/goals/{goal_id}")
async def get_goal(goal_id: str, current_user=Depends(get_current_user), db: AsyncIOMotorDatabase = Depends(get_db)):
    validate_object_id(goal_id, "goal_id")
    
    goal = await db["goals"].find_one({"id": goal_id, "userId": current_user["id"]})
    if not goal:
        raise NotFoundError("Goal", goal_id)

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
    return success_response(
        data=goal,
        message="Goal retrieved successfully"
    )


@router.patch("/goals/{goal_id}")
async def update_goal(goal_id: str, updates: UpdateGoalRequest, current_user=Depends(get_current_user), db: AsyncIOMotorDatabase = Depends(get_db)):
    validate_object_id(goal_id, "goal_id")
    
    # Check if goal exists and user owns it
    existing_goal = await db["goals"].find_one({"id": goal_id})
    if not existing_goal:
        raise NotFoundError("Goal", goal_id)
    
    validate_user_ownership(current_user["id"], existing_goal["userId"], "goal")
    
    # Convert to dict and filter out None values
    update_dict = {k: v for k, v in updates.model_dump(exclude_none=True).items()}
    
    if not update_dict:
        return _clean(existing_goal)
    
    update_dict["updatedAt"] = datetime.now(timezone.utc)
    res = await db["goals"].find_one_and_update(
        {"id": goal_id, "userId": current_user["id"]},
        {"$set": update_dict},
        return_document=ReturnDocument.AFTER,
    )
    if not res:
        raise NotFoundError("Goal", goal_id)
    return updated_response(
        data=_clean(res),
        message="Goal updated successfully"
    )


@router.delete("/goals/{goal_id}")
async def delete_goal(goal_id: str, current_user=Depends(get_current_user), db: AsyncIOMotorDatabase = Depends(get_db)):
    validate_object_id(goal_id, "goal_id")
    user_id = current_user["id"]
    
    goal = await db["goals"].find_one({"id": goal_id, "userId": user_id})
    if not goal:
        raise NotFoundError("Goal", goal_id)
    
    res = await db["goals"].delete_one({"id": goal_id, "userId": user_id})
    if res.deleted_count == 0:
        raise NotFoundError("Goal", goal_id)

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

    return deleted_response("Goal deleted successfully")
