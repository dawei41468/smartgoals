from __future__ import annotations
from datetime import datetime, timedelta
from typing import Dict, List, Any

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


@router.get("/progress/stats")
async def get_progress_stats(current_user=Depends(get_current_user), db: AsyncIOMotorDatabase = Depends(get_db)):
    user_id = current_user["id"]
    
    # Get all goals for this user
    goals = await db["goals"].find({"userId": user_id}).to_list(None)
    goal_ids = [g["id"] for g in goals]
    
    if not goal_ids:
        return {
            "totalGoals": 0,
            "completedGoals": 0,
            "activeGoals": 0,
            "totalTasks": 0,
            "completedTasks": 0,
            "currentStreak": 0,
            "longestStreak": 0,
            "thisWeekProgress": 0,
            "avgCompletionTime": 0,
        }
    
    # Basic goal counts
    total_goals = len(goals)
    completed_goals = len([g for g in goals if g.get("status") == "completed"])
    active_goals = len([g for g in goals if g.get("status") == "active"])
    
    # Task counts
    total_tasks = await db["daily_tasks"].count_documents({"goalId": {"$in": goal_ids}})
    completed_tasks = await db["daily_tasks"].count_documents({
        "goalId": {"$in": goal_ids},
        "completed": True
    })
    
    # Calculate streaks and weekly progress
    current_streak = await _calculate_current_streak(db, goal_ids)
    longest_streak = await _calculate_longest_streak(db, goal_ids)
    this_week_progress = await _calculate_this_week_progress(db, goal_ids)
    
    # Calculate average completion time for completed goals
    avg_completion_time = 0
    if completed_goals > 0:
        completed_goal_docs = [g for g in goals if g.get("status") == "completed"]
        total_days = 0
        for goal in completed_goal_docs:
            if goal.get("createdAt") and goal.get("updatedAt"):
                created = datetime.fromisoformat(goal["createdAt"].replace("Z", "+00:00"))
                updated = datetime.fromisoformat(goal["updatedAt"].replace("Z", "+00:00"))
                days = max(1, (updated - created).days)
                total_days += days
        avg_completion_time = total_days // completed_goals if completed_goals > 0 else 0
    
    return {
        "totalGoals": total_goals,
        "completedGoals": completed_goals,
        "activeGoals": active_goals,
        "totalTasks": total_tasks,
        "completedTasks": completed_tasks,
        "currentStreak": current_streak,
        "longestStreak": longest_streak,
        "thisWeekProgress": this_week_progress,
        "avgCompletionTime": avg_completion_time,
    }


@router.get("/analytics/summary")
async def get_analytics_summary(current_user=Depends(get_current_user), db: AsyncIOMotorDatabase = Depends(get_db)):
    user_id = current_user["id"]
    
    # Get all goals for this user
    goals = await db["goals"].find({"userId": user_id}).to_list(None)
    goal_ids = [g["id"] for g in goals]
    
    if not goal_ids:
        return {
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
        }
    
    # Basic metrics
    total_goals = len(goals)
    completed_goals = len([g for g in goals if g.get("status") == "completed"])
    active_goals = len([g for g in goals if g.get("status") == "active"])
    paused_goals = len([g for g in goals if g.get("status") == "paused"])
    
    goal_success_rate = int((completed_goals / total_goals) * 100) if total_goals > 0 else 0
    
    # Task metrics
    completed_tasks = await db["daily_tasks"].count_documents({
        "goalId": {"$in": goal_ids},
        "completed": True
    })
    
    # Calculate streaks
    current_streak = await _calculate_current_streak(db, goal_ids)
    longest_streak = await _calculate_longest_streak(db, goal_ids)
    
    # Calculate weekly progress trend (last 7 days)
    weekly_trend = await _calculate_weekly_trend(db, goal_ids)
    
    # Calculate monthly comparison
    monthly_comparison = await _calculate_monthly_comparison(db, goal_ids)
    
    # Calculate average completion time
    avg_completion_time = 0
    if completed_goals > 0:
        completed_goal_docs = [g for g in goals if g.get("status") == "completed"]
        total_days = 0
        for goal in completed_goal_docs:
            if goal.get("createdAt") and goal.get("updatedAt"):
                created = datetime.fromisoformat(goal["createdAt"].replace("Z", "+00:00"))
                updated = datetime.fromisoformat(goal["updatedAt"].replace("Z", "+00:00"))
                days = max(1, (updated - created).days)
                total_days += days
        avg_completion_time = total_days // completed_goals
    
    # Best performing day and hour (simplified for now)
    best_day = await _calculate_best_performing_day(db, goal_ids)
    
    return {
        "goalSuccessRate": goal_success_rate,
        "avgCompletionTime": avg_completion_time,
        "totalGoalsCreated": total_goals,
        "completedGoals": completed_goals,
        "activeGoals": active_goals,
        "pausedGoals": paused_goals,
        "totalTasksCompleted": completed_tasks,
        "currentStreak": current_streak,
        "longestStreak": longest_streak,
        "bestPerformingDay": best_day,
        "mostProductiveHour": 10,  # Placeholder
        "weeklyProgressTrend": weekly_trend,
        "monthlyComparison": monthly_comparison,
    }


@router.get("/analytics/patterns")
async def get_productivity_patterns(current_user=Depends(get_current_user), db: AsyncIOMotorDatabase = Depends(get_db)):
    user_id = current_user["id"]
    
    # Get all goals for this user
    goal_ids = [g["id"] async for g in db["goals"].find({"userId": user_id}, {"id": 1})]
    
    if not goal_ids:
        return []
    
    # Calculate productivity by day of week
    patterns = []
    days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"]
    
    for i, day in enumerate(days):
        # Get tasks for this day of week (simplified calculation)
        day_tasks = await db["daily_tasks"].count_documents({
            "goalId": {"$in": goal_ids},
            "day": i + 1  # Assuming day field maps 1-7 to Mon-Sun
        })
        
        completed_day_tasks = await db["daily_tasks"].count_documents({
            "goalId": {"$in": goal_ids},
            "day": i + 1,
            "completed": True
        })
        
        completion_rate = int((completed_day_tasks / day_tasks) * 100) if day_tasks > 0 else 0
        
        patterns.append({
            "dayOfWeek": day,
            "completionRate": completion_rate,
            "tasksCompleted": completed_day_tasks
        })
    
    return patterns


@router.get("/analytics/categories")
async def get_category_performance(current_user=Depends(get_current_user), db: AsyncIOMotorDatabase = Depends(get_db)):
    user_id = current_user["id"]
    
    # Get all goals grouped by category
    goals = await db["goals"].find({"userId": user_id}).to_list(None)
    
    categories = {}
    for goal in goals:
        category = goal.get("category", "Other")
        if category not in categories:
            categories[category] = {"goals": [], "completed": 0}
        categories[category]["goals"].append(goal)
        if goal.get("status") == "completed":
            categories[category]["completed"] += 1
    
    result = []
    for category, data in categories.items():
        total_goals = len(data["goals"])
        completed_goals = data["completed"]
        success_rate = int((completed_goals / total_goals) * 100) if total_goals > 0 else 0
        
        # Calculate average completion time for this category
        avg_time = 0
        if completed_goals > 0:
            completed_category_goals = [g for g in data["goals"] if g.get("status") == "completed"]
            total_days = 0
            for goal in completed_category_goals:
                if goal.get("createdAt") and goal.get("updatedAt"):
                    created = datetime.fromisoformat(goal["createdAt"].replace("Z", "+00:00"))
                    updated = datetime.fromisoformat(goal["updatedAt"].replace("Z", "+00:00"))
                    days = max(1, (updated - created).days)
                    total_days += days
            avg_time = total_days // completed_goals if completed_goals > 0 else 0
        
        result.append({
            "name": category,
            "count": total_goals,
            "successRate": success_rate,
            "avgTimeToComplete": avg_time
        })
    
    return result


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
