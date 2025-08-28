from __future__ import annotations

from datetime import datetime, timezone
from typing import Any, Dict, Optional

from fastapi import APIRouter, Depends, HTTPException
from motor.motor_asyncio import AsyncIOMotorDatabase

from ..auth_utils import get_current_user
from ..config import get_settings
from ..db import get_db
from ..services.notifications import (
    broadcast_web_push,
    send_email,
)
from ..scheduler import run_daily_goal_reminders_now, run_weekly_digest_now

router = APIRouter()


@router.get("/notifications/vapid-public-key")
async def get_vapid_public_key():
    settings = get_settings()
    if not settings.VAPID_PUBLIC_KEY:
        raise HTTPException(status_code=404, detail="VAPID public key not configured")
    return {"publicKey": settings.VAPID_PUBLIC_KEY}


@router.post("/notifications/subscribe")
async def subscribe_push(
    payload: Dict[str, Any],
    current_user=Depends(get_current_user),
    db: AsyncIOMotorDatabase = Depends(get_db),
):
    subscription: Dict[str, Any] = payload.get("subscription") or payload
    endpoint: Optional[str] = subscription.get("endpoint") if isinstance(subscription, dict) else None
    if not endpoint:
        raise HTTPException(status_code=400, detail="Invalid subscription payload")

    doc = {
        "userId": current_user["id"],
        "endpoint": endpoint,
        "subscription": subscription,
        "createdAt": datetime.now(timezone.utc),
    }

    # Upsert by userId+endpoint
    await db["push_subscriptions"].update_one(
        {"userId": current_user["id"], "endpoint": endpoint},
        {"$set": doc},
        upsert=True,
    )
    return {"ok": True}


@router.post("/notifications/unsubscribe")
async def unsubscribe_push(
    payload: Dict[str, Any],
    current_user=Depends(get_current_user),
    db: AsyncIOMotorDatabase = Depends(get_db),
):
    endpoint: Optional[str] = payload.get("endpoint")
    if not endpoint and isinstance(payload.get("subscription"), dict):
        endpoint = payload["subscription"].get("endpoint")

    if not endpoint:
        raise HTTPException(status_code=400, detail="Endpoint required")

    await db["push_subscriptions"].delete_many({"userId": current_user["id"], "endpoint": endpoint})
    return {"ok": True}


@router.post("/notifications/push/test")
async def test_push(
    current_user=Depends(get_current_user),
    db: AsyncIOMotorDatabase = Depends(get_db),
):
    payload = {
        "title": "SmartGoals",
        "body": "Push notifications are working.",
    }
    delivered = await broadcast_web_push(db, current_user["id"], payload)
    return {"delivered": delivered}


@router.post("/notifications/email/test")
async def test_email(current_user=Depends(get_current_user)):
    if not current_user.get("email"):
        raise HTTPException(status_code=400, detail="User has no email on file")

    ok = await send_email(
        to_email=current_user["email"],
        subject="SmartGoals test email",
        body_text="This is a test email from SmartGoals.",
        body_html="<strong>This is a test email from SmartGoals.</strong>",
    )
    if not ok:
        raise HTTPException(status_code=503, detail="Email service not configured or unreachable")
    return {"ok": True}


# Dev-only manual triggers for scheduled jobs
settings = get_settings()
if settings.DEBUG:
    @router.post("/notifications/jobs/daily-now")
    async def trigger_daily_now(current_user=Depends(get_current_user)):
        await run_daily_goal_reminders_now()
        return {"ok": True}

    @router.post("/notifications/jobs/weekly-now")
    async def trigger_weekly_now(current_user=Depends(get_current_user)):
        await run_weekly_digest_now()
        return {"ok": True}
