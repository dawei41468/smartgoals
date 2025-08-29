from __future__ import annotations
from datetime import datetime, timedelta
from typing import Dict, List, Any

from fastapi import APIRouter, Depends
from motor.motor_asyncio import AsyncIOMotorDatabase

from ..db import get_db
from ..auth_utils import get_current_user
from ..db_queries import (
    get_user_analytics_aggregated,
    get_category_performance,
    get_productivity_patterns,
    calculate_streaks,
    get_user_achievements,
    get_achievement_definitions,
    create_or_update_achievement,
    initialize_achievement_definitions
)
from ..response_utils import success_response

router = APIRouter()


@router.get("/analytics/stats")
async def get_stats(current_user=Depends(get_current_user), db: AsyncIOMotorDatabase = Depends(get_db)):
    user_id = current_user["id"]
    
    # Use optimized aggregation query
    stats = await get_user_analytics_aggregated(db, user_id)
    
    return success_response(
        data={
            "activeGoalsCount": stats["activeGoals"],
            "completedTasksCount": stats["completedTasks"],
            "successRate": stats["successRate"],
        },
        message="Analytics stats retrieved successfully"
    )


@router.get("/progress/stats")
async def get_progress_stats(current_user=Depends(get_current_user), db: AsyncIOMotorDatabase = Depends(get_db)):
    user_id = current_user["id"]
    
    # Use optimized aggregation queries
    stats = await get_user_analytics_aggregated(db, user_id)
    streaks = await calculate_streaks(db, user_id)
    
    # Calculate this week's progress (simplified for now)
    this_week_progress = 0
    if stats["totalTasks"] > 0:
        this_week_progress = int((stats["completedTasks"] / stats["totalTasks"]) * 100)
    
    return success_response(
        data={
            "totalGoals": stats["totalGoals"],
            "completedGoals": stats["completedGoals"],
            "activeGoals": stats["activeGoals"],
            "totalTasks": stats["totalTasks"],
            "completedTasks": stats["completedTasks"],
            "currentStreak": streaks["currentStreak"],
            "longestStreak": streaks["longestStreak"],
            "thisWeekProgress": this_week_progress,
            "avgCompletionTime": stats["avgCompletionTime"],
        },
        message="Progress stats retrieved successfully"
    )


@router.get("/progress/achievements")
async def get_achievements(current_user=Depends(get_current_user), db: AsyncIOMotorDatabase = Depends(get_db)):
    user_id = current_user["id"]

    # Initialize achievement definitions if needed
    await initialize_achievement_definitions(db)

    # Get current user stats and streaks
    stats = await get_user_analytics_aggregated(db, user_id)
    streaks = await calculate_streaks(db, user_id)

    # Get achievement definitions
    definitions = await get_achievement_definitions(db)

    # Get existing user achievements
    existing_achievements = await get_user_achievements(db, user_id)
    existing_ids = {ach["achievementId"] for ach in existing_achievements}

    achievements = []

    # Process each achievement definition
    for definition in definitions:
        achievement_id = definition["id"]
        trigger_type = definition["triggerType"]
        trigger_value = definition["triggerValue"]

        # Calculate current progress based on trigger type
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
            # For monthly tasks, we'd need to calculate this month's completed tasks
            # For now, use total completed tasks as approximation
            progress = stats["completedTasks"]

        # Create or update achievement
        achievement_data = {
            "achievementId": achievement_id,
            "title": definition["title"],
            "description": definition["description"],
            "icon": definition["icon"],
            "category": definition["category"],
            "progress": progress,
            "target": trigger_value
        }

        updated_achievement = await create_or_update_achievement(db, user_id, achievement_data)
        achievements.append(updated_achievement)

    # Add any existing achievements not in definitions (for backwards compatibility)
    for existing in existing_achievements:
        if existing["achievementId"] not in {d["id"] for d in definitions}:
            achievements.append(existing)

    return success_response(
        data={
            "achievements": achievements,
            "totalUnlocked": len([a for a in achievements if a.get("unlockedAt")]),
            "categories": list(set(a.get("category", "general") for a in achievements))
        },
        message="Achievements retrieved successfully"
    )


@router.post("/progress/check-achievements")
async def check_achievements(current_user=Depends(get_current_user), db: AsyncIOMotorDatabase = Depends(get_db)):
    """Check for newly unlocked achievements and return them"""
    user_id = current_user["id"]

    # Get current stats and streaks
    stats = await get_user_analytics_aggregated(db, user_id)
    streaks = await calculate_streaks(db, user_id)

    # Get achievement definitions
    definitions = await get_achievement_definitions(db)

    newly_unlocked = []

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
                # Create/update achievement and mark as newly unlocked
                achievement_data = {
                    "achievementId": achievement_id,
                    "title": definition["title"],
                    "description": definition["description"],
                    "icon": definition["icon"],
                    "category": definition["category"],
                    "progress": progress,
                    "target": trigger_value
                }

                updated_achievement = await create_or_update_achievement(db, user_id, achievement_data)

                if updated_achievement.get("unlockedAt"):
                    newly_unlocked.append(updated_achievement)

    return success_response(
        data={
            "newlyUnlocked": newly_unlocked,
            "totalNew": len(newly_unlocked)
        },
        message="Achievement check completed"
    )


@router.get("/analytics/summary")
async def get_analytics_summary(current_user=Depends(get_current_user), db: AsyncIOMotorDatabase = Depends(get_db)):
    user_id = current_user["id"]
    
    # Use optimized aggregation queries
    stats = await get_user_analytics_aggregated(db, user_id)
    streaks = await calculate_streaks(db, user_id)
    patterns = await get_productivity_patterns(db, user_id)
    
    if stats["totalGoals"] == 0:
        return success_response(
            data={
                "goalSuccessRate": 0,
                "avgCompletionTime": 0,
                "totalGoalsCreated": 0,
                "completedGoals": 0,
                "activeGoals": 0,
                "pausedGoals": 0,
                "totalTasksCompleted": 0,
                "currentStreak": 0,
                "longestStreak": 0,
                "bestPerformingDay": "Monday",
                "mostProductiveHour": 10,
                "weeklyProgressTrend": [0, 0, 0, 0, 0, 0, 0],
                "monthlyComparison": {"thisMonth": 0, "lastMonth": 0, "change": 0},
            },
            message="Analytics summary retrieved successfully"
        )
    
    # Find best performing day
    best_day = "Monday"
    if patterns:
        best_pattern = max(patterns, key=lambda x: x.get("completionRate", 0))
        best_day = best_pattern.get("dayOfWeek", "Monday")
    
    goal_success_rate = int((stats["completedGoals"] / stats["totalGoals"]) * 100) if stats["totalGoals"] > 0 else 0
    
    return success_response(
        data={
            "goalSuccessRate": goal_success_rate,
            "avgCompletionTime": stats["avgCompletionTime"],
            "totalGoalsCreated": stats["totalGoals"],
            "completedGoals": stats["completedGoals"],
            "activeGoals": stats["activeGoals"],
            "pausedGoals": stats["pausedGoals"],
            "totalTasksCompleted": stats["completedTasks"],
            "currentStreak": streaks["currentStreak"],
            "longestStreak": streaks["longestStreak"],
            "bestPerformingDay": best_day,
            "mostProductiveHour": 10,  # Placeholder - could be calculated from task completion times
            "weeklyProgressTrend": [0, 0, 0, 0, 0, 0, 0],  # Placeholder - could be calculated
            "monthlyComparison": {"thisMonth": 0, "lastMonth": 0, "change": 0},  # Placeholder
        },
        message="Analytics summary retrieved successfully"
    )


@router.get("/analytics/categories")
async def get_category_analytics(current_user=Depends(get_current_user), db: AsyncIOMotorDatabase = Depends(get_db)):
    user_id = current_user["id"]
    data = await get_category_performance(db, user_id)
    return success_response(
        data=data,
        message="Category performance retrieved successfully"
    )


@router.get("/analytics/patterns")
async def get_productivity_patterns_route(current_user=Depends(get_current_user), db: AsyncIOMotorDatabase = Depends(get_db)):
    user_id = current_user["id"]
    data = await get_productivity_patterns(db, user_id)
    return success_response(
        data=data,
        message="Productivity patterns retrieved successfully"
    )


# Helper functions
async def _calculate_current_streak(db: AsyncIOMotorDatabase, goal_ids: List[str]) -> int:
    """Calculate current consecutive days with completed tasks"""
    if not goal_ids:
        return 0
    
    # Get tasks from last 30 days, ordered by date desc
    thirty_days_ago = datetime.now() - timedelta(days=30)
    
    # For simplicity, we'll calculate based on task completion dates
    # This is a simplified version - in production you'd want more sophisticated streak logic
    recent_tasks = await db["daily_tasks"].find({
        "goalId": {"$in": goal_ids},
        "completed": True,
        "date": {"$gte": thirty_days_ago.isoformat()}
    }).sort("date", -1).to_list(None)
    
    if not recent_tasks:
        return 0
    
    # Simple streak calculation - count consecutive days with completed tasks
    streak = 0
    current_date = datetime.now().date()
    
    for i in range(30):  # Check last 30 days
        check_date = current_date - timedelta(days=i)
        has_completed_task = any(
            task.get("date") and datetime.fromisoformat(task["date"]).date() == check_date
            for task in recent_tasks
        )
        
        if has_completed_task:
            streak += 1
        else:
            break
    
    return streak


async def _calculate_longest_streak(db: AsyncIOMotorDatabase, goal_ids: List[str]) -> int:
    """Calculate longest streak ever"""
    # Simplified - return current streak * 2 as placeholder
    current = await _calculate_current_streak(db, goal_ids)
    return max(current * 2, current + 7)  # Placeholder logic


async def _calculate_this_week_progress(db: AsyncIOMotorDatabase, goal_ids: List[str]) -> int:
    """Calculate this week's task completion percentage"""
    if not goal_ids:
        return 0
    
    # Get start of current week (Monday)
    today = datetime.now()
    start_of_week = today - timedelta(days=today.weekday())
    
    week_tasks = await db["daily_tasks"].count_documents({
        "goalId": {"$in": goal_ids},
        "date": {"$gte": start_of_week.isoformat()}
    })
    
    completed_week_tasks = await db["daily_tasks"].count_documents({
        "goalId": {"$in": goal_ids},
        "completed": True,
        "date": {"$gte": start_of_week.isoformat()}
    })
    
    return int((completed_week_tasks / week_tasks) * 100) if week_tasks > 0 else 0


async def _calculate_weekly_trend(db: AsyncIOMotorDatabase, goal_ids: List[str]) -> List[int]:
    """Calculate daily completion rates for last 7 days"""
    if not goal_ids:
        return [0] * 7
    
    trend = []
    for i in range(7):
        day = datetime.now() - timedelta(days=6-i)
        day_start = day.replace(hour=0, minute=0, second=0, microsecond=0)
        day_end = day.replace(hour=23, minute=59, second=59, microsecond=999999)
        
        day_tasks = await db["daily_tasks"].count_documents({
            "goalId": {"$in": goal_ids},
            "date": {"$gte": day_start.isoformat(), "$lte": day_end.isoformat()}
        })
        
        completed_day_tasks = await db["daily_tasks"].count_documents({
            "goalId": {"$in": goal_ids},
            "completed": True,
            "date": {"$gte": day_start.isoformat(), "$lte": day_end.isoformat()}
        })
        
        rate = int((completed_day_tasks / day_tasks) * 100) if day_tasks > 0 else 0
        trend.append(rate)
    
    return trend


async def _calculate_monthly_comparison(db: AsyncIOMotorDatabase, goal_ids: List[str]) -> Dict[str, int]:
    """Compare this month vs last month task completion"""
    if not goal_ids:
        return {"thisMonth": 0, "lastMonth": 0, "change": 0}
    
    now = datetime.now()
    
    # This month
    this_month_start = now.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
    this_month_completed = await db["daily_tasks"].count_documents({
        "goalId": {"$in": goal_ids},
        "completed": True,
        "date": {"$gte": this_month_start.isoformat()}
    })
    
    # Last month
    if now.month == 1:
        last_month_start = now.replace(year=now.year-1, month=12, day=1, hour=0, minute=0, second=0, microsecond=0)
    else:
        last_month_start = now.replace(month=now.month-1, day=1, hour=0, minute=0, second=0, microsecond=0)
    
    last_month_completed = await db["daily_tasks"].count_documents({
        "goalId": {"$in": goal_ids},
        "completed": True,
        "date": {"$gte": last_month_start.isoformat(), "$lt": this_month_start.isoformat()}
    })
    
    change = int(((this_month_completed - last_month_completed) / last_month_completed) * 100) if last_month_completed > 0 else 0
    
    return {
        "thisMonth": this_month_completed,
        "lastMonth": last_month_completed,
        "change": change
    }


async def _calculate_best_performing_day(db: AsyncIOMotorDatabase, goal_ids: List[str]) -> str:
    """Find the day of week with highest completion rate"""
    if not goal_ids:
        return "Monday"
    
    days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"]
    best_day = "Monday"
    best_rate = 0
    
    for i, day in enumerate(days):
        day_tasks = await db["daily_tasks"].count_documents({
            "goalId": {"$in": goal_ids},
            "day": i + 1
        })
        
        completed_day_tasks = await db["daily_tasks"].count_documents({
            "goalId": {"$in": goal_ids},
            "day": i + 1,
            "completed": True
        })
        
        rate = (completed_day_tasks / day_tasks) * 100 if day_tasks > 0 else 0
        
        if rate > best_rate:
            best_rate = rate
            best_day = day
    
    return best_day
