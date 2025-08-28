from __future__ import annotations

import json
import asyncio
from datetime import datetime, timezone, timedelta
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import StreamingResponse
from motor.motor_asyncio import AsyncIOMotorDatabase

from ..db import get_db
from ..models import AIBreakdownRequest
from ..config import get_settings
from ..models import new_id
from ..auth_utils import get_current_user

try:
    from openai import OpenAI, AsyncOpenAI  # type: ignore
except Exception:  # pragma: no cover
    OpenAI = None  # type: ignore
    AsyncOpenAI = None  # type: ignore

router = APIRouter()


def _get_detail_instructions(detail_level: str) -> str:
    """Get task detail instructions based on user preference"""
    if detail_level == "basic":
        return """For each week, provide:
1. A high-level weekly milestone/goal
2. 1-2 key actionable tasks (keep it simple)
3. Priority levels (medium, high only)
4. Time estimates (2-4 hours per task)"""
    elif detail_level == "granular":
        return """For each week, provide:
1. A detailed weekly milestone/goal with specific outcomes
2. 4-5 specific actionable tasks with clear deliverables
3. Priority levels (low, medium, high)
4. Time estimates (30 minutes to 6 hours per task)
5. Dependencies between tasks where relevant"""
    else:  # detailed (default)
        return """For each week, provide:
1. A clear weekly milestone/goal
2. 2-3 key actionable tasks (keep it simple)
3. Priority levels (medium, high only)
4. Time estimates (1-4 hours per task)"""


def _weeks_until(deadline_iso: str) -> int:
    try:
        deadline = datetime.fromisoformat(deadline_iso.replace("Z", "+00:00"))
    except Exception:
        # fallback parse - make timezone aware
        deadline = datetime.strptime(deadline_iso.split(".")[0], "%Y-%m-%dT%H:%M:%S")
        deadline = deadline.replace(tzinfo=timezone.utc)
    
    # Ensure deadline is timezone aware
    if deadline.tzinfo is None:
        deadline = deadline.replace(tzinfo=timezone.utc)
    
    now = datetime.now(timezone.utc)
    diff = deadline - now
    weeks = int((diff.days + (1 if diff.seconds or diff.microseconds else 0)) / 7)
    return max(1, weeks)


@router.get("/test-deepseek")
async def test_deepseek(current_user=Depends(get_current_user)):
    """Test endpoint to verify DeepSeek API connectivity"""
    settings = get_settings()
    if not settings.DEEPSEEK_API_KEY or OpenAI is None:
        raise HTTPException(status_code=500, detail="DeepSeek API not configured")
    
    print("Testing DeepSeek API connectivity...")
    client = OpenAI(api_key=settings.DEEPSEEK_API_KEY, base_url=settings.DEEPSEEK_BASE_URL, timeout=10.0)
    
    try:
        resp = client.chat.completions.create(
            model="deepseek-chat",
            messages=[
                {"role": "user", "content": "Hello, this is a test message. Please respond with 'Test successful'."}
            ],
            max_tokens=50,
        )
        content = resp.choices[0].message.content
        print(f"DeepSeek test response: {content}")
        return {"status": "success", "response": content}
    except Exception as e:
        print(f"DeepSeek test failed: {e}")
        raise HTTPException(status_code=502, detail=f"DeepSeek API test failed: {str(e)}")


async def _generate_chunk(client, payload: AIBreakdownRequest, start_week: int, end_week: int, total_weeks: int, detail_level: str = "detailed"):
    """Generate a chunk of weeks for the breakdown"""
    chunk_weeks = end_week - start_week + 1
    
    prompt = f"""
Create a weekly breakdown for weeks {start_week} to {end_week} of this {total_weeks}-week SMART(ER) goal:

- Specific: {payload.specific}
- Measurable: {payload.measurable}
- Achievable: {payload.achievable}
- Relevant: {payload.relevant}
- Time-bound: {payload.timebound}
- Exciting: {payload.exciting}
- Deadline: {payload.deadline}

Context: This is part {start_week//2 + 1} of a {total_weeks}-week plan. Focus on weeks {start_week}-{end_week}.

{_get_detail_instructions(detail_level)}

Return in this exact JSON format:
{{
  "weeklyGoals": [
    {{
      "title": "Week {start_week} title",
      "description": "What will be accomplished this week",
      "weekNumber": {start_week},
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
"""
    
    resp = await client.chat.completions.create(
        model="deepseek-chat",
        messages=[
            {"role": "system", "content": "You are an expert goal coach. Create focused, actionable weekly breakdowns."},
            {"role": "user", "content": prompt},
        ],
        response_format={"type": "json_object"},
        temperature=0.7,
        max_tokens=800,
    )
    
    content = resp.choices[0].message.content or "{}"
    return json.loads(content)


@router.post("/goals/breakdown/stream")
async def generate_breakdown_stream(payload: AIBreakdownRequest, current_user=Depends(get_current_user), db: AsyncIOMotorDatabase = Depends(get_db)):
    settings = get_settings()
    if not settings.DEEPSEEK_API_KEY or AsyncOpenAI is None:
        raise HTTPException(status_code=500, detail="DeepSeek API not configured")

    print(f"Streaming breakdown request received for user {current_user['id']}")
    
    # Get user settings for AI breakdown detail level
    user_settings = await db.user_settings.find_one({"userId": current_user["id"]})
    detail_level = "detailed"  # default
    if user_settings:
        detail_level = user_settings.get("aiBreakdownDetail", "detailed")
    print(f"Using AI detail level: {detail_level}")
    
    total_weeks = _weeks_until(payload.deadline)
    print(f"Calculated weeks until deadline: {total_weeks}")

    async def generate_stream():
        client = AsyncOpenAI(api_key=settings.DEEPSEEK_API_KEY, base_url=settings.DEEPSEEK_BASE_URL, timeout=60.0)
        
        try:
            chunk_size = 2
            all_weekly_goals = []
            
            # Send initial progress
            yield f"data: {json.dumps({'type': 'progress', 'message': f'Starting generation for {total_weeks} weeks...', 'totalChunks': (total_weeks + chunk_size - 1) // chunk_size, 'currentChunk': 0})}\n\n"
            
            chunk_number = 0
            for start_week in range(1, total_weeks + 1, chunk_size):
                end_week = min(start_week + chunk_size - 1, total_weeks)
                chunk_number += 1
                
                # Send progress update
                yield f"data: {json.dumps({'type': 'progress', 'message': f'Generating weeks {start_week}-{end_week}...', 'currentChunk': chunk_number})}\n\n"
                
                chunk_data = await _generate_chunk(client, payload, start_week, end_week, total_weeks, detail_level)
                
                if "weeklyGoals" in chunk_data and isinstance(chunk_data["weeklyGoals"], list):
                    all_weekly_goals.extend(chunk_data["weeklyGoals"])
                    
                    # Send partial results
                    yield f"data: {json.dumps({'type': 'chunk', 'weeks': chunk_data['weeklyGoals']})}\n\n"
                
            # Send final complete result
            print(f"Sending complete result with {len(all_weekly_goals)} weeks")
            yield f"data: {json.dumps({'type': 'complete', 'weeklyGoals': all_weekly_goals})}\n\n"
            yield f"data: [DONE]\n\n"
            
        except Exception as e:
            print(f"DeepSeek API error: {e}")
            error_msg = "AI service timeout - please try again." if "timeout" in str(e).lower() else f"DeepSeek API error: {str(e)}"
            yield f"data: {json.dumps({'type': 'error', 'message': error_msg})}\n\n"

    return StreamingResponse(generate_stream(), media_type="text/plain")


@router.post("/goals/breakdown")
async def generate_breakdown(payload: AIBreakdownRequest, current_user=Depends(get_current_user)):
    settings = get_settings()
    if not settings.DEEPSEEK_API_KEY or AsyncOpenAI is None:
        raise HTTPException(status_code=500, detail="DeepSeek API not configured")

    print(f"Breakdown request received for user {current_user['id']}")
    total_weeks = _weeks_until(payload.deadline)
    print(f"Calculated weeks until deadline: {total_weeks}")

    client = AsyncOpenAI(api_key=settings.DEEPSEEK_API_KEY, base_url=settings.DEEPSEEK_BASE_URL, timeout=60.0)
    
    try:
        # Generate in chunks of 2 weeks for faster processing
        chunk_size = 2
        all_weekly_goals = []
        
        for start_week in range(1, total_weeks + 1, chunk_size):
            end_week = min(start_week + chunk_size - 1, total_weeks)
            print(f"Generating weeks {start_week}-{end_week}...")
            
            chunk_data = await _generate_chunk(client, payload, start_week, end_week, total_weeks)
            
            if "weeklyGoals" in chunk_data and isinstance(chunk_data["weeklyGoals"], list):
                all_weekly_goals.extend(chunk_data["weeklyGoals"])
            
        print(f"Generated {len(all_weekly_goals)} weeks successfully")
        return {"weeklyGoals": all_weekly_goals}
        
    except Exception as e:
        print(f"DeepSeek API error: {e}")
        if "timeout" in str(e).lower() or "timed out" in str(e).lower():
            raise HTTPException(status_code=504, detail="AI service timeout - please try again.")
        raise HTTPException(status_code=502, detail=f"DeepSeek API error: {str(e)}")


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

    client = OpenAI(
        api_key=settings.DEEPSEEK_API_KEY,
        base_url=settings.DEEPSEEK_BASE_URL,
        timeout=60.0,
    )
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

    now = datetime.now(timezone.utc)
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
