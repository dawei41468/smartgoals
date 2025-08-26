from __future__ import annotations

from fastapi import APIRouter, Depends
from motor.motor_asyncio import AsyncIOMotorDatabase

from ..db import get_db
from ..auth_utils import get_current_user

router = APIRouter()


@router.get("/analytics/stats")
async def get_stats(current_user=Depends(get_current_user), db: AsyncIOMotorDatabase = Depends(get_db)):
    user_id = current_user["id"]

    # active goals count
    active_goals_count = await db["goals"].count_documents({"userId": user_id, "status": "active"})

    # all goals ids for this user
    goal_ids = [g["id"] async for g in db["goals"].find({"userId": user_id}, {"id": 1})]

    if not goal_ids:
        return {
            "activeGoalsCount": 0,
            "completedTasksCount": 0,
            "successRate": 0,
        }

    # tasks counts using goalId present on tasks
    total_tasks_count = await db["daily_tasks"].count_documents({"goalId": {"$in": goal_ids}})
    completed_tasks_count = await db["daily_tasks"].count_documents({
        "goalId": {"$in": goal_ids},
        "completed": True,
    })

    success_rate = int(round((completed_tasks_count / total_tasks_count) * 100)) if total_tasks_count > 0 else 0

    return {
        "activeGoalsCount": active_goals_count,
        "completedTasksCount": completed_tasks_count,
        "successRate": success_rate,
    }
