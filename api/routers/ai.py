from __future__ import annotations

import json
from datetime import datetime, timedelta
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException
from motor.motor_asyncio import AsyncIOMotorDatabase

from ..db import get_db
from ..models import AIBreakdownRequest
from ..config import get_settings
from ..models import new_id
from ..auth_utils import get_current_user

try:
    from openai import OpenAI  # type: ignore
except Exception:  # pragma: no cover
    OpenAI = None  # type: ignore

router = APIRouter()


def _weeks_until(deadline_iso: str) -> int:
    try:
        deadline = datetime.fromisoformat(deadline_iso.replace("Z", "+00:00"))
    except Exception:
        # fallback parse
        deadline = datetime.strptime(deadline_iso.split(".")[0], "%Y-%m-%dT%H:%M:%S")
    now = datetime.utcnow()
    diff = deadline - now
    weeks = int((diff.days + (1 if diff.seconds or diff.microseconds else 0)) / 7)
    return max(1, weeks)


@router.post("/goals/breakdown")
async def generate_breakdown(payload: AIBreakdownRequest, current_user=Depends(get_current_user)):
    settings = get_settings()
    if not settings.DEEPSEEK_API_KEY or OpenAI is None:
        raise HTTPException(status_code=500, detail="DeepSeek API not configured")

    total_weeks = _weeks_until(payload.deadline)

    prompt = f"""
You are an expert goal coach and project manager. Break down the following SMART(ER) goal into a detailed weekly plan with daily tasks.

GOAL DETAILS:
- Specific: {payload.specific}
- Measurable: {payload.measurable}
- Achievable: {payload.achievable}
- Relevant: {payload.relevant}
- Time-bound: {payload.timebound}
- Exciting: {payload.exciting}
- Deadline: {payload.deadline}
- Total weeks available: {total_weeks}

Please create a breakdown with the following structure:
1. Divide the goal into logical weekly milestones (use all {total_weeks} weeks)
2. For each week, provide 3-7 specific daily tasks
3. Each task should be actionable, measurable, and realistic
4. Assign appropriate priority levels (low, medium, high)
5. Estimate time required for each task (1-8 hours)
6. Ensure tasks build upon each other progressively

Return the response in this exact JSON format:
{{
  "weeklyGoals": [
    {{
      "title": "Week title",
      "description": "What will be accomplished this week",
      "weekNumber": 1,
      "tasks": [
        {{
          "title": "Specific task title",
          "description": "Detailed task description",
          "day": 1,
          "priority": "medium",
          "estimatedHours": 2
        }}
      ]
    }}
  ]
}}

Make sure the breakdown is realistic, actionable, and directly aligned with achieving the specified goal by the deadline.
"""

    client = OpenAI(api_key=settings.DEEPSEEK_API_KEY, base_url=settings.DEEPSEEK_BASE_URL)
    resp = client.chat.completions.create(
        model="deepseek-chat",
        messages=[
            {"role": "system", "content": "You are an expert goal coach and project manager. Provide detailed, actionable goal breakdowns in JSON format."},
            {"role": "user", "content": prompt},
        ],
        response_format={"type": "json_object"},
        temperature=0.7,
        max_tokens=4000,
    )
    try:
        content = resp.choices[0].message.content or "{}"
        data = json.loads(content)
    except Exception as e:
        raise HTTPException(status_code=502, detail=f"Invalid response from DeepSeek: {e}")

    if not isinstance(data, dict) or "weeklyGoals" not in data or not isinstance(data["weeklyGoals"], list):
        raise HTTPException(status_code=502, detail="Invalid response format from DeepSeek")

    return data


@router.post("/goals/breakdown/regenerate")
async def regenerate_breakdown(body: dict, current_user=Depends(get_current_user)):
    settings = get_settings()
    if not settings.DEEPSEEK_API_KEY or OpenAI is None:
        raise HTTPException(status_code=500, detail="DeepSeek API not configured")

    goal_data = body.get("goalData")
    feedback: Optional[str] = body.get("feedback")
    if not goal_data:
        raise HTTPException(status_code=400, detail="goalData is required")

    request = AIBreakdownRequest(**goal_data)
    total_weeks = _weeks_until(request.deadline)

    prompt = f"""
You are an expert goal coach and project manager. I need you to regenerate a breakdown for this SMART(ER) goal with improvements.

GOAL DETAILS:
- Specific: {request.specific}
- Measurable: {request.measurable}
- Achievable: {request.achievable}
- Relevant: {request.relevant}
- Time-bound: {request.timebound}
- Exciting: {request.exciting}
- Deadline: {request.deadline}
- Total weeks available: {total_weeks}

{f'USER FEEDBACK: {feedback}' if feedback else 'Please provide a different approach with alternative task sequencing and timing.'}

Create an improved breakdown that addresses any feedback and provides a fresh perspective on achieving this goal.

Return the response in this exact JSON format:
{{
  "weeklyGoals": [
    {{
      "title": "Week title",
      "description": "What will be accomplished this week",
      "weekNumber": 1,
      "tasks": [
        {{
          "title": "Specific task title",
          "description": "Detailed task description",
          "day": 1,
          "priority": "medium",
          "estimatedHours": 2
        }}
      ]
    }}
  ]
}}

Make sure the breakdown is realistic, actionable, and directly aligned with achieving the specified goal by the deadline.
"""

    client = OpenAI(api_key=settings.DEEPSEEK_API_KEY, base_url=settings.DEEPSEEK_BASE_URL)
    resp = client.chat.completions.create(
        model="deepseek-chat",
        messages=[
            {"role": "system", "content": "You are an expert goal coach and project manager. Provide detailed, actionable goal breakdowns in JSON format."},
            {"role": "user", "content": prompt},
        ],
        response_format={"type": "json_object"},
        temperature=0.8,
        max_tokens=4000,
    )
    try:
        content = resp.choices[0].message.content or "{}"
        data = json.loads(content)
    except Exception as e:
        raise HTTPException(status_code=502, detail=f"Invalid response from DeepSeek: {e}")

    if not isinstance(data, dict) or "weeklyGoals" not in data or not isinstance(data["weeklyGoals"], list):
        raise HTTPException(status_code=502, detail="Invalid response format from DeepSeek")

    return data


@router.post("/goals/complete")
async def save_complete_goal(body: dict, current_user=Depends(get_current_user), db: AsyncIOMotorDatabase = Depends(get_db)):
    goal_data = body.get("goalData")
    breakdown = body.get("breakdown")
    if not goal_data or not breakdown:
        raise HTTPException(status_code=400, detail="goalData and breakdown are required")

    now = datetime.utcnow()
    # create main goal
    goal_id = new_id()
    goal_doc = {
        **goal_data,
        "id": goal_id,
        "userId": current_user["id"],
        "progress": 0,
        "status": "active",
        "createdAt": now,
        "updatedAt": now,
    }
    await db["goals"].insert_one(goal_doc)

    # create weekly goals & tasks
    for wg in breakdown.get("weeklyGoals", []):
        weekly_id = new_id()
        weekly_doc = {
            "id": weekly_id,
            "goalId": goal_id,
            "title": wg.get("title"),
            "description": wg.get("description"),
            "weekNumber": wg.get("weekNumber"),
            "startDate": wg.get("startDate", ""),
            "endDate": wg.get("endDate", ""),
            "progress": 0,
            "status": "pending",
            "createdAt": now,
        }
        await db["weekly_goals"].insert_one(weekly_doc)

        for task in wg.get("tasks", []):
            task_doc = {
                "id": new_id(),
                "weeklyGoalId": weekly_id,
                "goalId": goal_id,
                "title": task.get("title"),
                "description": task.get("description"),
                "day": task.get("day"),
                "date": task.get("date", ""),
                "completed": False,
                "priority": task.get("priority", "medium"),
                "estimatedHours": task.get("estimatedHours", 1),
                "createdAt": now,
            }
            await db["daily_tasks"].insert_one(task_doc)

    # return the full goal with breakdown
    def _clean(doc: dict | None) -> dict | None:
        if doc is None:
            return None
        d = dict(doc)
        d.pop("_id", None)
        return d
    weekly_cursor = db["weekly_goals"].find({"goalId": goal_id}).sort("weekNumber")
    weekly = [wg async for wg in weekly_cursor]
    result_weekly = []
    for wg in weekly:
        tasks = [t async for t in db["daily_tasks"].find({"weeklyGoalId": wg["id"]}).sort("day")]
        result_weekly.append({**(_clean(wg) or {}), "tasks": [(_clean(t) or {}) for t in tasks]})

    goal_doc = _clean(goal_doc) or {}
    goal_doc["weeklyGoals"] = result_weekly
    return goal_doc
