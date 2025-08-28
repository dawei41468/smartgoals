from __future__ import annotations

from datetime import datetime, timedelta, timezone
from typing import List, Dict, Any
from motor.motor_asyncio import AsyncIOMotorDatabase


async def get_user_analytics_aggregated(db: AsyncIOMotorDatabase, user_id: str) -> Dict[str, Any]:
    """Get comprehensive user analytics using optimized aggregation pipeline"""
    
    # Single aggregation pipeline to get all goal and task statistics
    pipeline = [
        {"$match": {"userId": user_id}},
        {
            "$lookup": {
                "from": "daily_tasks",
                "localField": "id",
                "foreignField": "goalId",
                "as": "tasks"
            }
        },
        {
            "$group": {
                "_id": None,
                "totalGoals": {"$sum": 1},
                "activeGoals": {
                    "$sum": {"$cond": [{"$eq": ["$status", "active"]}, 1, 0]}
                },
                "completedGoals": {
                    "$sum": {"$cond": [{"$eq": ["$status", "completed"]}, 1, 0]}
                },
                "pausedGoals": {
                    "$sum": {"$cond": [{"$eq": ["$status", "paused"]}, 1, 0]}
                },
                "totalTasks": {"$sum": {"$size": "$tasks"}},
                "completedTasks": {
                    "$sum": {
                        "$size": {
                            "$filter": {
                                "input": "$tasks",
                                "cond": {"$eq": ["$$this.completed", True]}
                            }
                        }
                    }
                },
                "goals": {"$push": "$$ROOT"}
            }
        }
    ]
    
    result = await db["goals"].aggregate(pipeline).to_list(1)
    
    if not result:
        return {
            "totalGoals": 0,
            "activeGoals": 0,
            "completedGoals": 0,
            "pausedGoals": 0,
            "totalTasks": 0,
            "completedTasks": 0,
            "successRate": 0,
            "avgCompletionTime": 0
        }
    
    stats = result[0]
    success_rate = 0
    if stats["totalTasks"] > 0:
        success_rate = int(round((stats["completedTasks"] / stats["totalTasks"]) * 100))
    
    # Calculate average completion time for completed goals
    avg_completion_time = 0
    completed_goals = [g for g in stats["goals"] if g.get("status") == "completed"]
    if completed_goals:
        total_days = 0
        for goal in completed_goals:
            if goal.get("createdAt") and goal.get("updatedAt"):
                try:
                    created = goal["createdAt"]
                    updated = goal["updatedAt"]
                    if isinstance(created, str):
                        created = datetime.fromisoformat(created.replace("Z", "+00:00"))
                    if isinstance(updated, str):
                        updated = datetime.fromisoformat(updated.replace("Z", "+00:00"))
                    days = max(1, (updated - created).days)
                    total_days += days
                except Exception:
                    continue
        avg_completion_time = total_days // len(completed_goals) if completed_goals else 0
    
    return {
        "totalGoals": stats["totalGoals"],
        "activeGoals": stats["activeGoals"],
        "completedGoals": stats["completedGoals"],
        "pausedGoals": stats["pausedGoals"],
        "totalTasks": stats["totalTasks"],
        "completedTasks": stats["completedTasks"],
        "successRate": success_rate,
        "avgCompletionTime": avg_completion_time
    }


async def get_category_performance(db: AsyncIOMotorDatabase, user_id: str) -> List[Dict[str, Any]]:
    """Get goal performance by category using aggregation"""
    
    pipeline = [
        {"$match": {"userId": user_id}},
        {
            "$lookup": {
                "from": "daily_tasks",
                "localField": "id",
                "foreignField": "goalId",
                "as": "tasks"
            }
        },
        {
            "$group": {
                "_id": "$category",
                "count": {"$sum": 1},
                "completedGoals": {
                    "$sum": {"$cond": [{"$eq": ["$status", "completed"]}, 1, 0]}
                },
                "totalTasks": {"$sum": {"$size": "$tasks"}},
                "completedTasks": {
                    "$sum": {
                        "$size": {
                            "$filter": {
                                "input": "$tasks",
                                "cond": {"$eq": ["$$this.completed", True]}
                            }
                        }
                    }
                },
                "avgCreatedAt": {"$avg": "$createdAt"},
                "avgUpdatedAt": {"$avg": "$updatedAt"}
            }
        },
        {
            "$project": {
                "name": "$_id",
                "count": 1,
                "successRate": {
                    "$cond": [
                        {"$gt": ["$totalTasks", 0]},
                        {"$multiply": [{"$divide": ["$completedTasks", "$totalTasks"]}, 100]},
                        0
                    ]
                },
                "avgTimeToComplete": {
                    "$cond": [
                        {"$gt": ["$completedGoals", 0]},
                        {"$divide": [{"$subtract": ["$avgUpdatedAt", "$avgCreatedAt"]}, 86400000]},
                        0
                    ]
                }
            }
        },
        {"$sort": {"successRate": -1}}
    ]
    
    return await db["goals"].aggregate(pipeline).to_list(None)


async def get_productivity_patterns(db: AsyncIOMotorDatabase, user_id: str) -> List[Dict[str, Any]]:
    """Get productivity patterns by day of week using aggregation"""
    
    # Get goal IDs for the user
    goal_ids = [g["id"] async for g in db["goals"].find({"userId": user_id}, {"id": 1})]
    
    if not goal_ids:
        return []
    
    pipeline = [
        {"$match": {"goalId": {"$in": goal_ids}}},
        {
            "$addFields": {
                "dayOfWeek": {
                    "$dayOfWeek": {
                        "$dateFromString": {
                            "dateString": "$date",
                            "onError": {"$dateFromString": {"dateString": "$createdAt"}}
                        }
                    }
                }
            }
        },
        {
            "$group": {
                "_id": "$dayOfWeek",
                "totalTasks": {"$sum": 1},
                "completedTasks": {
                    "$sum": {"$cond": [{"$eq": ["$completed", True]}, 1, 0]}
                }
            }
        },
        {
            "$project": {
                "dayOfWeek": {
                    "$switch": {
                        "branches": [
                            {"case": {"$eq": ["$_id", 1]}, "then": "Sunday"},
                            {"case": {"$eq": ["$_id", 2]}, "then": "Monday"},
                            {"case": {"$eq": ["$_id", 3]}, "then": "Tuesday"},
                            {"case": {"$eq": ["$_id", 4]}, "then": "Wednesday"},
                            {"case": {"$eq": ["$_id", 5]}, "then": "Thursday"},
                            {"case": {"$eq": ["$_id", 6]}, "then": "Friday"},
                            {"case": {"$eq": ["$_id", 7]}, "then": "Saturday"}
                        ],
                        "default": "Unknown"
                    }
                },
                "tasksCompleted": "$completedTasks",
                "completionRate": {
                    "$cond": [
                        {"$gt": ["$totalTasks", 0]},
                        {"$multiply": [{"$divide": ["$completedTasks", "$totalTasks"]}, 100]},
                        0
                    ]
                }
            }
        },
        {"$sort": {"_id": 1}}
    ]
    
    return await db["daily_tasks"].aggregate(pipeline).to_list(None)


async def calculate_streaks(db: AsyncIOMotorDatabase, user_id: str) -> Dict[str, int]:
    """Calculate current and longest streaks using aggregation"""
    
    # Get goal IDs for the user
    goal_ids = [g["id"] async for g in db["goals"].find({"userId": user_id}, {"id": 1})]
    
    if not goal_ids:
        return {"currentStreak": 0, "longestStreak": 0}
    
    # Get completed tasks ordered by date
    pipeline = [
        {
            "$match": {
                "goalId": {"$in": goal_ids},
                "completed": True,
                "date": {"$exists": True, "$ne": None}
            }
        },
        {
            "$group": {
                "_id": "$date",
                "tasksCompleted": {"$sum": 1}
            }
        },
        {"$sort": {"_id": 1}}
    ]
    
    completed_dates = await db["daily_tasks"].aggregate(pipeline).to_list(None)
    
    if not completed_dates:
        return {"currentStreak": 0, "longestStreak": 0}
    
    # Calculate streaks from the dates
    dates = [datetime.fromisoformat(item["_id"]) for item in completed_dates if item["_id"]]
    dates.sort()
    
    current_streak = 0
    longest_streak = 0
    temp_streak = 1
    
    today = datetime.now(timezone.utc).date()
    
    for i, date in enumerate(dates):
        if i == 0:
            continue
            
        # Check if consecutive days
        if (date.date() - dates[i-1].date()).days == 1:
            temp_streak += 1
        else:
            longest_streak = max(longest_streak, temp_streak)
            temp_streak = 1
    
    longest_streak = max(longest_streak, temp_streak)
    
    # Calculate current streak (must include today or yesterday)
    if dates:
        last_date = dates[-1].date()
        days_since_last = (today - last_date).days
        
        if days_since_last <= 1:  # Today or yesterday
            # Count backwards from the last date
            current_streak = 1
            for i in range(len(dates) - 2, -1, -1):
                if (dates[i+1].date() - dates[i].date()).days == 1:
                    current_streak += 1
                else:
                    break
    
    return {"currentStreak": current_streak, "longestStreak": longest_streak}
