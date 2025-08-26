from __future__ import annotations

import os
from functools import lru_cache
from typing import Optional

from dotenv import load_dotenv

# Load .env if present but do not overwrite process env
load_dotenv(override=False)


class Settings:
    ENV: str = os.getenv("ENV", os.getenv("NODE_ENV", "development"))
    DEBUG: bool = ENV != "production"

    MONGODB_URI: str = os.getenv("MONGODB_URI", "mongodb://127.0.0.1:27017/goalforge")
    MONGODB_DB: str = os.getenv("MONGODB_DB", "goalforge")

    JWT_SECRET: str = os.getenv("JWT_SECRET", "change-me-in-prod")
    JWT_ALG: str = "HS256"
    JWT_EXPIRES_MIN: int = int(os.getenv("JWT_EXPIRES_MIN", "10080"))  # 7 days

    DEEPSEEK_API_KEY: Optional[str] = os.getenv("DEEPSEEK_API_KEY")
    DEEPSEEK_BASE_URL: str = os.getenv("DEEPSEEK_BASE_URL", "https://api.deepseek.com")

    CORS_ORIGINS: list[str] = (
        os.getenv("CORS_ORIGINS", "http://localhost:5173,http://127.0.0.1:5173")
        .split(",")
        if os.getenv("CORS_ORIGINS") is not None
        else ["http://localhost:5173", "http://127.0.0.1:5173"]
    )

    # SMTP email settings (choose a China-friendly provider; do not hardcode secrets)
    SMTP_HOST: Optional[str] = os.getenv("SMTP_HOST")
    SMTP_PORT: int = int(os.getenv("SMTP_PORT", "587"))
    SMTP_USERNAME: Optional[str] = os.getenv("SMTP_USERNAME")
    SMTP_PASSWORD: Optional[str] = os.getenv("SMTP_PASSWORD")
    SMTP_USE_TLS: bool = os.getenv("SMTP_USE_TLS", "true").lower() == "true"
    EMAIL_FROM: Optional[str] = os.getenv("EMAIL_FROM")

    # Web Push VAPID settings
    VAPID_PUBLIC_KEY: Optional[str] = os.getenv("VAPID_PUBLIC_KEY")
    VAPID_PRIVATE_KEY: Optional[str] = os.getenv("VAPID_PRIVATE_KEY")
    VAPID_SUBJECT: str = os.getenv("VAPID_SUBJECT", "mailto:admin@example.com")


@lru_cache
def get_settings() -> Settings:
    return Settings()
