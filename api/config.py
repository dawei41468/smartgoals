from __future__ import annotations

import os
from functools import lru_cache
from typing import Optional

from dotenv import load_dotenv
from .config_validation import validate_required_config, validate_optional_services

# Load .env if present but do not overwrite process env
load_dotenv(override=False)


class Settings:
    def __init__(self):
        # Validate configuration on initialization
        validate_required_config()
        self.service_availability = validate_optional_services()
        
        self.ENV: str = os.getenv("ENV", os.getenv("NODE_ENV", "development"))
        self.DEBUG: bool = self.ENV != "production"

        # Required configurations (no fallbacks)
        self.MONGODB_URI: str = os.environ["MONGODB_URI"]
        self.MONGODB_DB: str = os.environ["MONGODB_DB"]
        self.JWT_SECRET: str = os.environ["JWT_SECRET"]
        
        # Configuration with safe defaults
        self.JWT_ALG: str = "HS256"
        self.JWT_EXPIRES_MIN: int = int(os.getenv("JWT_EXPIRES_MIN", "10080"))  # 7 days

        # Optional AI service configuration
        self.DEEPSEEK_API_KEY: Optional[str] = os.getenv("DEEPSEEK_API_KEY")
        self.DEEPSEEK_BASE_URL: str = os.getenv("DEEPSEEK_BASE_URL", "https://api.deepseek.com")

        # CORS configuration
        cors_origins_env = os.getenv("CORS_ORIGINS")
        if cors_origins_env:
            self.CORS_ORIGINS: list[str] = [origin.strip() for origin in cors_origins_env.split(",")]
        elif self.ENV == "development":
            self.CORS_ORIGINS = ["http://localhost:5173", "http://127.0.0.1:5173"]
        else:
            # Production requires explicit CORS configuration
            raise ValueError("CORS_ORIGINS must be explicitly set in production environment")

        # SMTP email settings (optional service)
        self.SMTP_HOST: Optional[str] = os.getenv("SMTP_HOST")
        self.SMTP_PORT: int = int(os.getenv("SMTP_PORT", "587"))
        self.SMTP_USERNAME: Optional[str] = os.getenv("SMTP_USERNAME")
        self.SMTP_PASSWORD: Optional[str] = os.getenv("SMTP_PASSWORD")
        self.SMTP_USE_TLS: bool = os.getenv("SMTP_USE_TLS", "true").lower() == "true"
        self.EMAIL_FROM: Optional[str] = os.getenv("EMAIL_FROM")

        # Web Push VAPID settings (optional service)
        self.VAPID_PUBLIC_KEY: Optional[str] = os.getenv("VAPID_PUBLIC_KEY")
        self.VAPID_PRIVATE_KEY: Optional[str] = os.getenv("VAPID_PRIVATE_KEY")
        self.VAPID_SUBJECT: str = os.getenv("VAPID_SUBJECT", "mailto:admin@example.com")


@lru_cache
def get_settings() -> Settings:
    return Settings()
