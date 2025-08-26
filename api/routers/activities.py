from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException, Query
from motor.motor_asyncio import AsyncIOMotorDatabase

from ..db import get_db
from ..auth_utils import get_current_user

router = APIRouter()


def _clean(doc: dict | None) -> dict | None:
    if doc is None:
        return None
    d = dict(doc)
    d.pop("_id", None)
    return d


@router.get("/activities")
async def get_activities(
    limit: int = Query(10, ge=1, le=100),
    current_user=Depends(get_current_user),
    db: AsyncIOMotorDatabase = Depends(get_db),
):
    user_id = current_user["id"]
    cursor = (
        db["activities"]
        .find({"userId": user_id})
        .sort("createdAt", -1)
        .limit(int(limit))
    )
    return [_clean(doc) for doc in [doc async for doc in cursor]]
