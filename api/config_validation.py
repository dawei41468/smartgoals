from __future__ import annotations

import os
from typing import Optional
from .exceptions import APIException


class ConfigurationError(APIException):
    """Configuration validation error"""
    
    def __init__(self, message: str, config_key: Optional[str] = None):
        details = {}
        if config_key:
            details["config_key"] = config_key
        
        super().__init__(
            status_code=500,
            message=f"Configuration error: {message}",
            details=details,
            error_code="CONFIGURATION_ERROR"
        )


def validate_required_config() -> None:
    """Validate that all required configuration is present"""
    required_configs = [
        ("JWT_SECRET", "JWT secret key is required for production"),
        ("MONGODB_URI", "MongoDB connection URI is required"),
        ("MONGODB_DB", "MongoDB database name is required"),
    ]
    
    missing_configs = []
    insecure_configs = []
    
    for config_key, error_message in required_configs:
        value = os.getenv(config_key)
        if not value:
            missing_configs.append((config_key, error_message))
        elif config_key == "JWT_SECRET" and value == "change-me-in-prod":
            insecure_configs.append((config_key, "JWT secret must be changed from default value"))
    
    # Check environment-specific requirements
    env = os.getenv("ENV", os.getenv("NODE_ENV", "development"))
    
    if env == "production":
        production_configs = [
            ("CORS_ORIGINS", "CORS origins must be explicitly set in production"),
        ]
        
        for config_key, error_message in production_configs:
            value = os.getenv(config_key)
            if not value:
                missing_configs.append((config_key, error_message))
    
    # Raise errors for missing configurations
    if missing_configs:
        error_messages = [f"{key}: {msg}" for key, msg in missing_configs]
        raise ConfigurationError(
            f"Missing required configuration: {', '.join([key for key, _ in missing_configs])}. "
            f"Details: {'; '.join(error_messages)}"
        )
    
    # Raise errors for insecure configurations
    if insecure_configs:
        error_messages = [f"{key}: {msg}" for key, msg in insecure_configs]
        raise ConfigurationError(
            f"Insecure configuration detected: {', '.join([key for key, _ in insecure_configs])}. "
            f"Details: {'; '.join(error_messages)}"
        )


def validate_optional_services() -> dict[str, bool]:
    """Validate optional service configurations and return availability status"""
    services = {
        "ai_service": bool(os.getenv("DEEPSEEK_API_KEY")),
        "email_service": all([
            os.getenv("SMTP_HOST"),
            os.getenv("SMTP_USERNAME"),
            os.getenv("SMTP_PASSWORD"),
            os.getenv("EMAIL_FROM")
        ]),
        "push_notifications": all([
            os.getenv("VAPID_PUBLIC_KEY"),
            os.getenv("VAPID_PRIVATE_KEY"),
            os.getenv("VAPID_SUBJECT")
        ])
    }
    
    return services
