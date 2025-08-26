from __future__ import annotations

import asyncio
from typing import Any, Dict, List, Optional

from aiosmtplib import SMTP
from email.message import EmailMessage
from pywebpush import webpush, WebPushException

from ..config import get_settings


async def send_email(to_email: str, subject: str, body_text: str, body_html: Optional[str] = None) -> bool:
    """Send an email using SMTP settings. Returns True if attempted successfully.
    If SMTP is not configured, returns False gracefully.
    """
    settings = get_settings()
    if not settings.SMTP_HOST or not settings.EMAIL_FROM:
        return False

    msg = EmailMessage()
    msg["From"] = settings.EMAIL_FROM
    msg["To"] = to_email
    msg["Subject"] = subject
    msg.set_content(body_text)
    if body_html:
        msg.add_alternative(body_html, subtype="html")

    try:
        # Use implicit TLS if connecting to SMTPS port (465). Otherwise, optionally upgrade via STARTTLS.
        implicit_tls = settings.SMTP_PORT == 465
        async with SMTP(hostname=settings.SMTP_HOST, port=settings.SMTP_PORT, use_tls=implicit_tls) as client:
            if settings.SMTP_USE_TLS and not implicit_tls:
                await client.starttls()
            if settings.SMTP_USERNAME and settings.SMTP_PASSWORD:
                await client.login(settings.SMTP_USERNAME, settings.SMTP_PASSWORD)
            await client.send_message(msg)
        return True
    except Exception:
        return False


async def send_web_push_to_subscription(subscription: Dict[str, Any], payload: Dict[str, Any]) -> bool:
    """Send a web push notification to a single subscription. Returns True on success."""
    settings = get_settings()
    if not settings.VAPID_PUBLIC_KEY or not settings.VAPID_PRIVATE_KEY:
        return False

    def _send():
        try:
            webpush(
                subscription_info=subscription,
                data=json_dumps(payload),
                vapid_private_key=settings.VAPID_PRIVATE_KEY,
                vapid_claims={"sub": settings.VAPID_SUBJECT},
                timeout=10,
            )
            return True
        except WebPushException:
            return False
        except Exception:
            return False

    return await asyncio.to_thread(_send)


def json_dumps(data: Dict[str, Any]) -> str:
    # Small wrapper to avoid importing heavy json libraries here if unnecessary
    import json

    return json.dumps(data)


async def broadcast_web_push(db, user_id: str, payload: Dict[str, Any]) -> int:
    """Send a push notification to all subscriptions for a user.
    Returns the count of successful deliveries. Cleans up invalid subscriptions.
    """
    subs_cursor = db["push_subscriptions"].find({"userId": user_id})
    successes = 0
    to_delete: List[str] = []
    async for sub in subs_cursor:
        ok = await send_web_push_to_subscription(sub["subscription"], payload)
        if ok:
            successes += 1
        else:
            # mark invalid endpoint for cleanup
            to_delete.append(sub.get("endpoint") or sub["subscription"].get("endpoint"))

    for endpoint in to_delete:
        await db["push_subscriptions"].delete_many({"userId": user_id, "endpoint": endpoint})

    return successes
