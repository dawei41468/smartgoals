from __future__ import annotations

from datetime import datetime, timezone
from typing import List, Optional
from pydantic import BaseModel, EmailStr, Field
import uuid


# Helpers

def now() -> datetime:
    return datetime.now(timezone.utc)


def new_id() -> str:
    return str(uuid.uuid4())


# User models
class User(BaseModel):
    id: str
    username: str
    password: str
    firstName: Optional[str] = None
    lastName: Optional[str] = None
    email: Optional[EmailStr] = None
    bio: Optional[str] = None
    createdAt: Optional[datetime] = None
    updatedAt: Optional[datetime] = None


class UserPublic(BaseModel):
    id: str
    username: str
    firstName: Optional[str] = None
    lastName: Optional[str] = None
    email: Optional[EmailStr] = None
    bio: Optional[str] = None
    createdAt: Optional[datetime] = None
    updatedAt: Optional[datetime] = None


class RegisterData(BaseModel):
    firstName: str
    lastName: str
    email: EmailStr
    password: str


class LoginData(BaseModel):
    email: EmailStr
    password: str


class UserSettings(BaseModel):
    id: str
    userId: str
    emailNotifications: bool = True
    pushNotifications: bool = False
    weeklyDigest: bool = True
    goalReminders: bool = True
    defaultGoalDuration: str = "3-months"
    aiBreakdownDetail: str = "detailed"
    theme: str = "light"
    language: str = "en"
    createdAt: Optional[datetime] = None
    updatedAt: Optional[datetime] = None


class UpdateUserProfile(BaseModel):
    firstName: Optional[str] = None
    lastName: Optional[str] = None
    email: Optional[EmailStr] = None
    bio: Optional[str] = None


class UpdateUserSettings(BaseModel):
    emailNotifications: Optional[bool] = None
    pushNotifications: Optional[bool] = None
    weeklyDigest: Optional[bool] = None
    goalReminders: Optional[bool] = None
    defaultGoalDuration: Optional[str] = None
    aiBreakdownDetail: Optional[str] = None
    theme: Optional[str] = None
    language: Optional[str] = None


# Goal models
class Goal(BaseModel):
    id: str
    userId: str
    title: str
    description: Optional[str] = None
    category: str
    specific: str
    measurable: str
    achievable: str
    relevant: str
    timebound: str
    exciting: str
    deadline: str
    progress: int = 0
    status: str = "active"
    createdAt: Optional[datetime] = None
    updatedAt: Optional[datetime] = None


class InsertGoal(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    category: str
    specific: str
    measurable: str
    achievable: str
    relevant: str
    timebound: str
    exciting: str
    deadline: str


class WeeklyGoal(BaseModel):
    id: str
    goalId: str
    title: str
    description: Optional[str] = None
    weekNumber: int
    startDate: str
    endDate: str
    progress: int = 0
    status: str = "pending"
    createdAt: Optional[datetime] = None


class InsertWeeklyGoal(BaseModel):
    goalId: str
    title: str
    description: Optional[str] = None
    weekNumber: int
    startDate: str
    endDate: str


class DailyTask(BaseModel):
    id: str
    weeklyGoalId: str
    goalId: str
    title: str
    description: Optional[str] = None
    day: int
    date: Optional[str] = None
    completed: bool = False
    priority: str = "medium"
    estimatedHours: int = 1
    createdAt: Optional[datetime] = None


class InsertDailyTask(BaseModel):
    weeklyGoalId: str
    goalId: str
    title: str
    description: Optional[str] = None
    day: int
    date: Optional[str] = None
    priority: Optional[str] = None
    estimatedHours: Optional[int] = None


class Activity(BaseModel):
    id: str
    userId: str
    type: str
    description: str
    metadata: Optional[dict] = None
    createdAt: Optional[datetime] = None


class InsertActivity(BaseModel):
    userId: str
    type: str
    description: str
    metadata: Optional[dict] = None


class GoalWithBreakdown(Goal):
    weeklyGoals: List[WeeklyGoal]


# AI request/response models
class AIBreakdownRequest(BaseModel):
    specific: str
    measurable: str
    achievable: str
    relevant: str
    timebound: str
    exciting: str
    deadline: str


class AITask(BaseModel):
    title: str
    description: str
    day: int
    priority: str
    estimatedHours: int


class AIWeeklyGoal(BaseModel):
    title: str
    description: str
    weekNumber: int
    tasks: List[AITask]


class AIBreakdownResponse(BaseModel):
    weeklyGoals: List[AIWeeklyGoal]
