from __future__ import annotations

from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException, Query
from motor.motor_asyncio import AsyncIOMotorDatabase
from pymongo import ReturnDocument

from ..db import get_db
from ..auth_utils import get_current_user
from ..models import UpdateUserProfile, UpdateUserSettings, UserSettings, InsertActivity
from ..models import new_id

router = APIRouter()


def _clean(doc: dict | None) -> dict | None:
    if doc is None:
        return None
    d = dict(doc)
    d.pop("_id", None)
    return d


@router.get("/user/profile")
async def get_profile(current_user=Depends(get_current_user), db: AsyncIOMotorDatabase = Depends(get_db)):
    return _clean(current_user)


@router.patch("/user/profile")
async def update_profile(payload: UpdateUserProfile, current_user=Depends(get_current_user), db: AsyncIOMotorDatabase = Depends(get_db)):
    user_id = current_user["id"]
    update_doc = {k: v for k, v in payload.model_dump(exclude_none=True).items()}
    update_doc["updatedAt"] = datetime.now(timezone.utc)

    res = await db["users"].find_one_and_update(
        {"id": user_id},
        {"$set": update_doc},
        return_document=ReturnDocument.AFTER,
    )
    if not res:
        raise HTTPException(status_code=404, detail="User not found")

    # Log activity
    activity = {
        "id": new_id(),
        "userId": user_id,
        "type": "profile_updated",
        "description": "Updated profile information",
        "metadata": {"updatedFields": list(update_doc.keys())},
        "createdAt": datetime.now(timezone.utc),
    }
    await db["activities"].insert_one(activity)

    res.pop("password", None)
    return _clean(res)


@router.get("/user/settings")
async def get_settings_route(current_user=Depends(get_current_user), db: AsyncIOMotorDatabase = Depends(get_db)):
    settings = await db["user_settings"].find_one({"userId": current_user["id"]})
    if not settings:
        raise HTTPException(status_code=404, detail="User settings not found")
    return _clean(settings)


@router.patch("/user/settings")
async def update_settings(payload: UpdateUserSettings, current_user=Depends(get_current_user), db: AsyncIOMotorDatabase = Depends(get_db)):
    user_id = current_user["id"]
    existing = await db["user_settings"].find_one({"userId": user_id})
    now = datetime.now(timezone.utc)

    if not existing:
        new_settings = UserSettings(id=new_id(), userId=user_id, createdAt=now, updatedAt=now, **payload.model_dump(exclude_none=True))
        await db["user_settings"].insert_one(new_settings.model_dump())
        return new_settings

    update_doc = {k: v for k, v in payload.model_dump(exclude_none=True).items()}
    update_doc["updatedAt"] = now
    res = await db["user_settings"].find_one_and_update(
        {"userId": user_id},
        {"$set": update_doc},
        return_document=ReturnDocument.AFTER,
    )

    # Log activity
    activity = {
        "id": new_id(),
        "userId": user_id,
        "type": "settings_updated",
        "description": "Updated account settings",
        "metadata": {"updatedSettings": list(update_doc.keys())},
        "createdAt": now,
    }
    await db["activities"].insert_one(activity)

    return _clean(res)
