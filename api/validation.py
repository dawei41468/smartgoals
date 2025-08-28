from __future__ import annotations

from typing import Dict, Any, Optional, List
from pydantic import BaseModel, Field, field_validator
from .exceptions import ValidationError


class UpdateGoalRequest(BaseModel):
    """Validated goal update request"""
    title: Optional[str] = Field(None, min_length=1, max_length=200)
    description: Optional[str] = Field(None, max_length=1000)
    category: Optional[str] = Field(None, pattern="^(Health|Work|Family|Personal)$")
    specific: Optional[str] = Field(None, min_length=1, max_length=500)
    measurable: Optional[str] = Field(None, min_length=1, max_length=500)
    achievable: Optional[str] = Field(None, min_length=1, max_length=500)
    relevant: Optional[str] = Field(None, min_length=1, max_length=500)
    timebound: Optional[str] = Field(None, min_length=1, max_length=500)
    exciting: Optional[str] = Field(None, min_length=1, max_length=500)
    deadline: Optional[str] = Field(None, min_length=1)
    status: Optional[str] = Field(None, pattern="^(active|completed|paused)$")
    progress: Optional[int] = Field(None, ge=0, le=100)

    @field_validator('progress')
    @classmethod
    def validate_progress(cls, v):
        if v is not None and (v < 0 or v > 100):
            raise ValidationError("Progress must be between 0 and 100", "progress", v)
        return v


class UpdateTaskRequest(BaseModel):
    """Validated task update request"""
    title: Optional[str] = Field(None, min_length=1, max_length=200)
    description: Optional[str] = Field(None, max_length=500)
    completed: Optional[bool] = None
    priority: Optional[str] = Field(None, pattern="^(low|medium|high)$")
    estimatedHours: Optional[int] = Field(None, ge=1, le=24)
    date: Optional[str] = None

    @field_validator('estimatedHours')
    @classmethod
    def validate_hours(cls, v):
        if v is not None and (v < 1 or v > 24):
            raise ValidationError("Estimated hours must be between 1 and 24", "estimatedHours", v)
        return v


class PaginationParams(BaseModel):
    """Standardized pagination parameters"""
    limit: int = Field(default=50, ge=1, le=100)
    offset: int = Field(default=0, ge=0)
    
    @field_validator('limit')
    @classmethod
    def validate_limit(cls, v):
        if v > 100:
            raise ValidationError("Limit cannot exceed 100", "limit", v)
        return v


def validate_object_id(obj_id: str, field_name: str = "id") -> str:
    """Validate object ID format"""
    if not obj_id or not isinstance(obj_id, str):
        raise ValidationError(f"Invalid {field_name} format", field_name, obj_id)
    
    if len(obj_id) < 10 or len(obj_id) > 50:
        raise ValidationError(f"{field_name} must be between 10 and 50 characters", field_name, obj_id)
    
    return obj_id


def validate_user_ownership(user_id: str, resource_user_id: str, resource_type: str) -> None:
    """Validate that user owns the resource"""
    if user_id != resource_user_id:
        from .exceptions import AuthorizationError
        raise AuthorizationError(f"Access denied to {resource_type}")


def sanitize_update_fields(updates: Dict[str, Any], allowed_fields: List[str]) -> Dict[str, Any]:
    """Sanitize update dictionary to only include allowed fields"""
    blocked_fields = {"id", "userId", "createdAt", "_id"}
    
    sanitized = {}
    for key, value in updates.items():
        if key in blocked_fields:
            continue
        if key not in allowed_fields:
            raise ValidationError(f"Field '{key}' is not allowed for updates", key, value)
        sanitized[key] = value
    
    return sanitized
