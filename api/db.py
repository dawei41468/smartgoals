from __future__ import annotations

import asyncio
from motor.motor_asyncio import AsyncIOMotorClient, AsyncIOMotorDatabase
from typing import Optional
from .config import get_settings

_client: Optional[AsyncIOMotorClient] = None
_db: Optional[AsyncIOMotorDatabase] = None


async def connect() -> AsyncIOMotorDatabase:
    global _client, _db
    if _db is not None:
        return _db
    settings = get_settings()
    _client = AsyncIOMotorClient(settings.MONGODB_URI)
    _db = _client[settings.MONGODB_DB]

    # Ensure indexes (fire-and-forget)
    async def _ensure_indexes():
        await _db["users"].create_index("email", unique=True)
        await _db["goals"].create_index([("userId", 1)])
        await _db["weekly_goals"].create_index([("goalId", 1)])
        await _db["daily_tasks"].create_index([("weeklyGoalId", 1)])
        await _db["activities"].create_index([("userId", 1), ("createdAt", -1)])
        # Avoid duplicate subscriptions per endpoint per user
        await _db["push_subscriptions"].create_index(
            [("userId", 1), ("endpoint", 1)], unique=True
        )

    asyncio.create_task(_ensure_indexes())
    return _db


async def get_db() -> AsyncIOMotorDatabase:
    return await connect()


async def disconnect() -> None:
    global _client, _db
    if _client is not None:
        _client.close()
    _client = None
    _db = None
