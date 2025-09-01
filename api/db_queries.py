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
                        "$cond": {
                            "if": {
                                "$and": [
                                    {"$eq": [{"$type": "$date"}, "string"]},
                                    {"$ne": ["$date", ""]},
                                    {"$ne": ["$date", None]}
                                ]
                            },
                            "then": {"$dateFromString": {"dateString": "$date"}},
                            "else": {
                                "$cond": {
                                    "if": {"$eq": [{"$type": "$date"}, "date"]},
                                    "then": "$date",
                                    "else": {
                                        "$cond": {
                                            "if": {
                                                "$and": [
                                                    {"$eq": [{"$type": "$createdAt"}, "string"]},
                                                    {"$ne": ["$createdAt", ""]},
                                                    {"$ne": ["$createdAt", None]}
                                                ]
                                            },
                                            "then": {"$dateFromString": {"dateString": "$createdAt"}},
                                            "else": {
                                                "$cond": {
                                                    "if": {"$eq": [{"$type": "$createdAt"}, "date"]},
                                                    "then": "$createdAt",
                                                    "else": {"$dateFromString": {"dateString": "2025-01-01T00:00:00.000Z"}}
                                                }
                                            }
                                        }
                                    }
                                }
                            }
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


# Achievement queries
async def get_user_achievements(db: AsyncIOMotorDatabase, user_id: str) -> List[Dict[str, Any]]:
    """Get all achievements for a user"""
    achievements = await db["achievements"].find({"userId": user_id}).to_list(None)

    # Convert ObjectId to string for JSON serialization
    for achievement in achievements:
        if "_id" in achievement:
            achievement["_id"] = str(achievement["_id"])
        if "createdAt" in achievement and hasattr(achievement["createdAt"], 'isoformat'):
            achievement["createdAt"] = achievement["createdAt"].isoformat()
        if "updatedAt" in achievement and hasattr(achievement["updatedAt"], 'isoformat'):
            achievement["updatedAt"] = achievement["updatedAt"].isoformat()
        if "unlockedAt" in achievement and achievement["unlockedAt"] and hasattr(achievement["unlockedAt"], 'isoformat'):
            achievement["unlockedAt"] = achievement["unlockedAt"].isoformat()

    return achievements


async def get_achievement_definitions(db: AsyncIOMotorDatabase) -> List[Dict[str, Any]]:
    """Get all active achievement definitions"""
    definitions = await db["achievement_definitions"].find({"isActive": True}).to_list(None)

    # Convert ObjectId to string for JSON serialization
    for definition in definitions:
        if "_id" in definition:
            definition["_id"] = str(definition["_id"])
        if "createdAt" in definition and hasattr(definition["createdAt"], 'isoformat'):
            definition["createdAt"] = definition["createdAt"].isoformat()

    return definitions


async def create_or_update_achievement(db: AsyncIOMotorDatabase, user_id: str, achievement_data: Dict[str, Any]) -> Dict[str, Any]:
    """Create or update an achievement for a user"""
    achievement_id = achievement_data["achievementId"]

    # Check if achievement already exists
    existing = await db["achievements"].find_one({"userId": user_id, "achievementId": achievement_id})

    if existing:
        # Update existing achievement
        update_data = {
            "progress": achievement_data.get("progress", existing.get("progress", 0)),
            "updatedAt": datetime.now(timezone.utc)
        }

        # Check if newly unlocked
        was_unlocked = existing.get("unlockedAt") is not None
        is_now_unlocked = achievement_data.get("progress", 0) >= achievement_data.get("target", 1)

        if not was_unlocked and is_now_unlocked:
            update_data["unlockedAt"] = datetime.now(timezone.utc)

        await db["achievements"].update_one(
            {"userId": user_id, "achievementId": achievement_id},
            {"$set": update_data}
        )

        # Return updated achievement
        updated = await db["achievements"].find_one({"userId": user_id, "achievementId": achievement_id})
        if updated:
            # Convert ObjectId to string for JSON serialization
            if "_id" in updated:
                updated["_id"] = str(updated["_id"])
            if "createdAt" in updated and hasattr(updated["createdAt"], 'isoformat'):
                updated["createdAt"] = updated["createdAt"].isoformat()
            if "updatedAt" in updated and hasattr(updated["updatedAt"], 'isoformat'):
                updated["updatedAt"] = updated["updatedAt"].isoformat()
            if "unlockedAt" in updated and updated["unlockedAt"] and hasattr(updated["unlockedAt"], 'isoformat'):
                updated["unlockedAt"] = updated["unlockedAt"].isoformat()
            return updated
        return {}
    else:
        # Create new achievement
        new_achievement = {
            "id": f"{user_id}_{achievement_id}",
            "userId": user_id,
            **achievement_data,
            "createdAt": datetime.now(timezone.utc),
            "updatedAt": datetime.now(timezone.utc)
        }

        # Set unlockedAt if already completed
        if achievement_data.get("progress", 0) >= achievement_data.get("target", 1):
            new_achievement["unlockedAt"] = datetime.now(timezone.utc)

        result = await db["achievements"].insert_one(new_achievement)
        # Add the generated _id to the returned achievement
        new_achievement["_id"] = str(result.inserted_id)
        return new_achievement


async def get_recently_unlocked_achievements(db: AsyncIOMotorDatabase, user_id: str, since: datetime) -> List[Dict[str, Any]]:
    """Get achievements unlocked since a specific time"""
    achievements = await db["achievements"].find({
        "userId": user_id,
        "unlockedAt": {"$gte": since}
    }).to_list(None)

    # Convert ObjectId to string for JSON serialization
    for achievement in achievements:
        if "_id" in achievement:
            achievement["_id"] = str(achievement["_id"])
        if "createdAt" in achievement and hasattr(achievement["createdAt"], 'isoformat'):
            achievement["createdAt"] = achievement["createdAt"].isoformat()
        if "updatedAt" in achievement and hasattr(achievement["updatedAt"], 'isoformat'):
            achievement["updatedAt"] = achievement["updatedAt"].isoformat()
        if "unlockedAt" in achievement and achievement["unlockedAt"] and hasattr(achievement["unlockedAt"], 'isoformat'):
            achievement["unlockedAt"] = achievement["unlockedAt"].isoformat()

    return achievements


async def initialize_achievement_definitions(db: AsyncIOMotorDatabase) -> None:
    """Initialize default achievement definitions if they don't exist"""
    existing_count = await db["achievement_definitions"].count_documents({})

    if existing_count == 0:
        definitions = [
            # Goal-based achievements
            {
                "id": "first_goal",
                "title": "Goal Setter",
                "description": "Created your first SMART goal",
                "icon": "🎯",
                "category": "goals",
                "target": 1,
                "triggerType": "goal_count",
                "triggerValue": 1,
                "isActive": True,
                "createdAt": datetime.now(timezone.utc)
            },
            {
                "id": "goal_achiever",
                "title": "Goal Achiever",
                "description": "Complete your first goal",
                "icon": "🏆",
                "category": "goals",
                "target": 1,
                "triggerType": "completed_goal_count",
                "triggerValue": 1,
                "isActive": True,
                "createdAt": datetime.now(timezone.utc)
            },
            {
                "id": "goal_master",
                "title": "Goal Master",
                "description": "Complete 5 goals",
                "icon": "👑",
                "category": "goals",
                "target": 5,
                "triggerType": "completed_goal_count",
                "triggerValue": 5,
                "isActive": True,
                "createdAt": datetime.now(timezone.utc)
            },
            {
                "id": "perfectionist",
                "title": "Perfectionist",
                "description": "Complete 10 goals with 100% success rate",
                "icon": "💎",
                "category": "goals",
                "target": 10,
                "triggerType": "completed_goal_count",
                "triggerValue": 10,
                "isActive": True,
                "createdAt": datetime.now(timezone.utc)
            },

            # Task-based achievements
            {
                "id": "first_task",
                "title": "First Task Done",
                "description": "Completed your first task",
                "icon": "✅",
                "category": "tasks",
                "target": 1,
                "triggerType": "completed_task_count",
                "triggerValue": 1,
                "isActive": True,
                "createdAt": datetime.now(timezone.utc)
            },
            {
                "id": "task_ninja",
                "title": "Task Ninja",
                "description": "Complete 10 tasks",
                "icon": "🥷",
                "category": "tasks",
                "target": 10,
                "triggerType": "completed_task_count",
                "triggerValue": 10,
                "isActive": True,
                "createdAt": datetime.now(timezone.utc)
            },
            {
                "id": "productive_month",
                "title": "Productive Month",
                "description": "Complete 50 tasks in a month",
                "icon": "💫",
                "category": "tasks",
                "target": 50,
                "triggerType": "monthly_task_count",
                "triggerValue": 50,
                "isActive": True,
                "createdAt": datetime.now(timezone.utc)
            },
            {
                "id": "work_horse",
                "title": "Work Horse",
                "description": "Complete 100 tasks",
                "icon": "🐎",
                "category": "tasks",
                "target": 100,
                "triggerType": "completed_task_count",
                "triggerValue": 100,
                "isActive": True,
                "createdAt": datetime.now(timezone.utc)
            },

            # Streak-based achievements
            {
                "id": "getting_started",
                "title": "Getting Started",
                "description": "Maintain a 3-day streak",
                "icon": "🌱",
                "category": "streaks",
                "target": 3,
                "triggerType": "streak_count",
                "triggerValue": 3,
                "isActive": True,
                "createdAt": datetime.now(timezone.utc)
            },
            {
                "id": "week_warrior",
                "title": "Week Warrior",
                "description": "Complete all tasks for a full week",
                "icon": "⚡",
                "category": "streaks",
                "target": 7,
                "triggerType": "streak_count",
                "triggerValue": 7,
                "isActive": True,
                "createdAt": datetime.now(timezone.utc)
            },
            {
                "id": "consistency_king",
                "title": "Consistency King",
                "description": "Maintain a 14-day streak",
                "icon": "🔥",
                "category": "streaks",
                "target": 14,
                "triggerType": "streak_count",
                "triggerValue": 14,
                "isActive": True,
                "createdAt": datetime.now(timezone.utc)
            },
            {
                "id": "streak_master",
                "title": "Streak Master",
                "description": "Maintain a 30-day streak",
                "icon": "🌟",
                "category": "streaks",
                "target": 30,
                "triggerType": "streak_count",
                "triggerValue": 30,
                "isActive": True,
                "createdAt": datetime.now(timezone.utc)
            },
            {
                "id": "legend",
                "title": "Legend",
                "description": "Maintain a 50-day streak",
                "icon": "👑",
                "category": "streaks",
                "target": 50,
                "triggerType": "streak_count",
                "triggerValue": 50,
                "isActive": True,
                "createdAt": datetime.now(timezone.utc)
            },

            # Time-based achievements
            {
                "id": "early_bird",
                "title": "Early Bird",
                "description": "Complete 5 tasks before 9 AM",
                "icon": "🐦",
                "category": "time",
                "target": 5,
                "triggerType": "early_morning_tasks",
                "triggerValue": 5,
                "isActive": True,
                "createdAt": datetime.now(timezone.utc)
            },
            {
                "id": "night_owl",
                "title": "Night Owl",
                "description": "Complete 5 tasks after 10 PM",
                "icon": "🦉",
                "category": "time",
                "target": 5,
                "triggerType": "late_night_tasks",
                "triggerValue": 5,
                "isActive": True,
                "createdAt": datetime.now(timezone.utc)
            },

            # Special achievements
            {
                "id": "speed_demon",
                "title": "Speed Demon",
                "description": "Complete a goal in under 24 hours",
                "icon": "💨",
                "category": "special",
                "target": 1,
                "triggerType": "fast_goal_completion",
                "triggerValue": 1,
                "isActive": True,
                "createdAt": datetime.now(timezone.utc)
            },
            {
                "id": "marathon_runner",
                "title": "Marathon Runner",
                "description": "Work on goals for 100 days",
                "icon": "🏃",
                "category": "special",
                "target": 100,
                "triggerType": "active_days",
                "triggerValue": 100,
                "isActive": True,
                "createdAt": datetime.now(timezone.utc)
            }
        ]

        result = await db["achievement_definitions"].insert_many(definitions)
        # The definitions don't need to be returned, so we don't need to convert ObjectIds here


async def calculate_goal_progress(db: AsyncIOMotorDatabase, goal_id: str) -> int:
    """
    Calculate and return the progress percentage for a goal based on completed tasks.
    Returns an integer percentage (0-100).
    """
    # Count total tasks for this goal
    total_tasks = await db["daily_tasks"].count_documents({"goalId": goal_id})

    if total_tasks == 0:
        return 0

    # Count completed tasks for this goal
    completed_tasks = await db["daily_tasks"].count_documents({
        "goalId": goal_id,
        "completed": True
    })

    # Calculate progress as percentage
    progress_percentage = int(round((completed_tasks / total_tasks) * 100))

    return progress_percentage


async def calculate_weekly_goal_progress(db: AsyncIOMotorDatabase, weekly_goal_id: str) -> int:
    """
    Calculate and return the progress percentage for a weekly goal based on completed tasks.
    Returns an integer percentage (0-100).
    """
    # Count total tasks for this weekly goal
    total_tasks = await db["daily_tasks"].count_documents({"weeklyGoalId": weekly_goal_id})

    if total_tasks == 0:
        return 0

    # Count completed tasks for this weekly goal
    completed_tasks = await db["daily_tasks"].count_documents({
        "weeklyGoalId": weekly_goal_id,
        "completed": True
    })

    # Calculate progress as percentage
    progress_percentage = int(round((completed_tasks / total_tasks) * 100))

    return progress_percentage


async def update_goal_progress(db: AsyncIOMotorDatabase, goal_id: str) -> None:
    """
    Recalculate and update the progress for a specific goal.
    """
    progress = await calculate_goal_progress(db, goal_id)

    await db["goals"].update_one(
        {"id": goal_id},
        {
            "$set": {
                "progress": progress,
                "updatedAt": datetime.now(timezone.utc)
            }
        }
    )


async def update_weekly_goal_progress(db: AsyncIOMotorDatabase, weekly_goal_id: str) -> None:
    """
    Recalculate and update the progress for a specific weekly goal.
    """
    progress = await calculate_weekly_goal_progress(db, weekly_goal_id)

    await db["weekly_goals"].update_one(
        {"id": weekly_goal_id},
        {
            "$set": {
                "progress": progress,
                "updatedAt": datetime.now(timezone.utc)
            }
        }
    )


async def update_goal_and_weekly_progress(db: AsyncIOMotorDatabase, task: dict) -> None:
    """
    Update progress for both the goal and weekly goal when a task is updated.
    This should be called whenever a task's completion status changes.
    """
    goal_id = task.get("goalId")
    weekly_goal_id = task.get("weeklyGoalId")

    if goal_id:
        await update_goal_progress(db, goal_id)

    if weekly_goal_id:
        await update_weekly_goal_progress(db, weekly_goal_id)
