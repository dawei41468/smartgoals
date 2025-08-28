"""
Centralized response formatting utilities for consistent API responses
"""
from __future__ import annotations

from typing import Any, Dict, List, Optional, Union
from datetime import datetime
from pydantic import BaseModel
from fastapi import status


class APIResponse(BaseModel):
    """Standard API response format"""
    success: bool
    message: str
    data: Optional[Any] = None
    meta: Optional[Dict[str, Any]] = None
    timestamp: datetime


class ErrorResponse(BaseModel):
    """Standard error response format"""
    success: bool = False
    message: str
    error_code: str
    details: Optional[Dict[str, Any]] = None
    timestamp: datetime


class PaginatedResponse(BaseModel):
    """Paginated response format"""
    success: bool = True
    message: str
    data: List[Any]
    meta: Dict[str, Any]
    timestamp: datetime


def success_response(
    data: Any = None,
    message: str = "Success",
    meta: Optional[Dict[str, Any]] = None
) -> Dict[str, Any]:
    """Create a standardized success response"""
    return {
        "success": True,
        "message": message,
        "data": data,
        "meta": meta or {},
        "timestamp": datetime.utcnow()
    }


def error_response(
    message: str,
    error_code: str,
    details: Optional[Dict[str, Any]] = None,
    status_code: int = status.HTTP_400_BAD_REQUEST
) -> Dict[str, Any]:
    """Create a standardized error response"""
    return {
        "success": False,
        "message": message,
        "error_code": error_code,
        "details": details or {},
        "timestamp": datetime.utcnow(),
        "status_code": status_code
    }


def paginated_response(
    data: List[Any],
    total: int,
    page: int = 1,
    per_page: int = 10,
    message: str = "Data retrieved successfully"
) -> Dict[str, Any]:
    """Create a standardized paginated response"""
    total_pages = (total + per_page - 1) // per_page
    
    return {
        "success": True,
        "message": message,
        "data": data,
        "meta": {
            "pagination": {
                "page": page,
                "per_page": per_page,
                "total": total,
                "total_pages": total_pages,
                "has_next": page < total_pages,
                "has_prev": page > 1
            }
        },
        "timestamp": datetime.utcnow()
    }


def created_response(
    data: Any,
    message: str = "Resource created successfully"
) -> Dict[str, Any]:
    """Create a standardized creation response"""
    return success_response(data=data, message=message)


def updated_response(
    data: Any,
    message: str = "Resource updated successfully"
) -> Dict[str, Any]:
    """Create a standardized update response"""
    return success_response(data=data, message=message)


def deleted_response(
    message: str = "Resource deleted successfully"
) -> Dict[str, Any]:
    """Create a standardized deletion response"""
    return success_response(message=message)


def validation_error_response(
    field: str,
    value: Any,
    message: str = "Validation failed"
) -> Dict[str, Any]:
    """Create a standardized validation error response"""
    return error_response(
        message=message,
        error_code="VALIDATION_ERROR",
        details={
            "field": field,
            "invalid_value": str(value) if value is not None else None
        },
        status_code=status.HTTP_422_UNPROCESSABLE_ENTITY
    )


def not_found_response(
    resource: str,
    identifier: Optional[str] = None
) -> Dict[str, Any]:
    """Create a standardized not found error response"""
    message = f"{resource} not found"
    details = {"resource_type": resource}
    
    if identifier:
        message += f" with id: {identifier}"
        details["resource_id"] = identifier
    
    return error_response(
        message=message,
        error_code="RESOURCE_NOT_FOUND",
        details=details,
        status_code=status.HTTP_404_NOT_FOUND
    )


def unauthorized_response(
    message: str = "Authentication required"
) -> Dict[str, Any]:
    """Create a standardized unauthorized error response"""
    return error_response(
        message=message,
        error_code="AUTHENTICATION_REQUIRED",
        status_code=status.HTTP_401_UNAUTHORIZED
    )


def forbidden_response(
    message: str = "Access denied"
) -> Dict[str, Any]:
    """Create a standardized forbidden error response"""
    return error_response(
        message=message,
        error_code="ACCESS_DENIED",
        status_code=status.HTTP_403_FORBIDDEN
    )


def conflict_response(
    message: str,
    resource: Optional[str] = None
) -> Dict[str, Any]:
    """Create a standardized conflict error response"""
    details = {}
    if resource:
        details["resource_type"] = resource
    
    return error_response(
        message=message,
        error_code="RESOURCE_CONFLICT",
        details=details,
        status_code=status.HTTP_409_CONFLICT
    )


def internal_error_response(
    message: str = "Internal server error"
) -> Dict[str, Any]:
    """Create a standardized internal error response"""
    return error_response(
        message=message,
        error_code="INTERNAL_ERROR",
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR
    )


# Response wrapper decorators
def format_response(func):
    """Decorator to automatically format endpoint responses"""
    async def wrapper(*args, **kwargs):
        try:
            result = await func(*args, **kwargs)
            
            # If result is already formatted, return as-is
            if isinstance(result, dict) and "success" in result:
                return result
            
            # Otherwise, wrap in success response
            return success_response(data=result)
            
        except Exception as e:
            # Let FastAPI handle the exception
            raise e
    
    return wrapper
