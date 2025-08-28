from __future__ import annotations

import asyncio
import logging
from typing import Optional

from apscheduler.schedulers.asyncio import AsyncIOScheduler
from apscheduler.triggers.cron import CronTrigger

from .db import connect
from .services.notifications import send_email, broadcast_web_push

logger = logging.getLogger(__name__)

_scheduler: Optional[AsyncIOScheduler] = None


async def _job_weekly_digest() -> None:
    """Send a simple weekly digest email to users who enabled it.
    Runs on Mondays at 09:00 CST (01:00 UTC).
    """
    try:
        db = await connect()
        cursor = db["user_settings"].find({
            "weeklyDigest": True,
            "emailNotifications": True,
        })
        async for us in cursor:
            user = await db["users"].find_one({"id": us["userId"]})
            if not user or not user.get("email"):
                continue
            subject = "Your SMART Goals weekly digest"
            body_text = "Here is your weekly digest. Keep pushing your goals!"
            body_html = "<p>Here is your <strong>weekly digest</strong>. Keep pushing your goals!</p>"
            ok = await send_email(to_email=user["email"], subject=subject, body_text=body_text, body_html=body_html)
            if not ok:
                logger.info("Digest email skipped or failed for user %s", user.get("id"))
    except Exception as e:
        logger.exception("Weekly digest job failed: %s", e)


async def _job_daily_goal_reminders() -> None:
    """Send a gentle daily reminder via push (and email if enabled). Runs daily at 09:00 CST (01:00 UTC)."""
    try:
        db = await connect()
        cursor = db["user_settings"].find({
            "goalReminders": True,
        })
        async for us in cursor:
            user_id = us["userId"]
            payload = {
                "title": "SmartGoals",
                "body": "Daily reminder: review today\'s tasks and goals.",
            }
            # Push if enabled
            if us.get("pushNotifications"):
                try:
                    await broadcast_web_push(db, user_id, payload)
                except Exception:
                    logger.info("Push reminder failed for user %s", user_id)
            # Email if enabled
            if us.get("emailNotifications"):
                user = await db["users"].find_one({"id": user_id})
                if user and user.get("email"):
                    await send_email(
                        to_email=user["email"],
                        subject="SmartGoals daily reminder",
                        body_text="Review today's tasks and goals in SmartGoals.",
                        body_html="<p>Review today's tasks and goals in <strong>SmartGoals</strong>.</p>",
                    )
    except Exception as e:
        logger.exception("Daily reminders job failed: %s", e)


def start_scheduler() -> None:
    global _scheduler
    if _scheduler is not None:
        return

    scheduler = AsyncIOScheduler()

    # APScheduler defaults to UTC. 01:00 UTC ~= 09:00 China Standard Time.
    scheduler.add_job(_job_weekly_digest, CronTrigger(day_of_week="mon", hour=1, minute=0))
    scheduler.add_job(_job_daily_goal_reminders, CronTrigger(hour=1, minute=0))

    scheduler.start()
    _scheduler = scheduler
    logger.info("Scheduler started: jobs registered -> weekly_digest (Mon 01:00 UTC), daily_goal_reminders (01:00 UTC)")


def shutdown_scheduler() -> None:
    global _scheduler
    if _scheduler is not None:
        try:
            _scheduler.shutdown(wait=False)
        finally:
            _scheduler = None


# Thin wrappers to allow dev-only API endpoints to trigger jobs immediately
async def run_weekly_digest_now() -> None:
    await _job_weekly_digest()


async def run_daily_goal_reminders_now() -> None:
    await _job_daily_goal_reminders()
