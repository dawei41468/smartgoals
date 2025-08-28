from __future__ import annotations

from fastapi import HTTPException, status
from typing import Optional, Dict, Any


class APIException(HTTPException):
    """Standardized API exception with consistent error format"""
    
    def __init__(
        self,
        status_code: int,
        message: str,
        details: Optional[Dict[str, Any]] = None,
        error_code: Optional[str] = None
    ):
        detail = {
            "message": message,
            "error_code": error_code or self._get_default_error_code(status_code),
            "details": details or {}
        }
        super().__init__(status_code=status_code, detail=detail)
    
    @staticmethod
    def _get_default_error_code(status_code: int) -> str:
        """Generate default error codes based on HTTP status"""
        error_codes = {
            400: "BAD_REQUEST",
            401: "UNAUTHORIZED", 
            403: "FORBIDDEN",
            404: "NOT_FOUND",
            409: "CONFLICT",
            422: "VALIDATION_ERROR",
            500: "INTERNAL_ERROR"
        }
        return error_codes.get(status_code, "UNKNOWN_ERROR")


class ValidationError(APIException):
    """Validation-specific error"""
    
    def __init__(self, message: str, field: Optional[str] = None, value: Optional[Any] = None):
        details = {}
        if field:
            details["field"] = field
        if value is not None:
            details["invalid_value"] = str(value)
        
        super().__init__(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            message=message,
            details=details,
            error_code="VALIDATION_ERROR"
        )


class NotFoundError(APIException):
    """Resource not found error"""
    
    def __init__(self, resource: str, identifier: Optional[str] = None):
        message = f"{resource} not found"
        details = {}
        if identifier:
            message += f" with id: {identifier}"
            details["resource_id"] = identifier
        details["resource_type"] = resource
        
        super().__init__(
            status_code=status.HTTP_404_NOT_FOUND,
            message=message,
            details=details,
            error_code="RESOURCE_NOT_FOUND"
        )


class ConflictError(APIException):
    """Resource conflict error"""
    
    def __init__(self, message: str, resource: Optional[str] = None):
        details = {}
        if resource:
            details["resource_type"] = resource
            
        super().__init__(
            status_code=status.HTTP_409_CONFLICT,
            message=message,
            details=details,
            error_code="RESOURCE_CONFLICT"
        )


class AuthenticationError(APIException):
    """Authentication-related error"""
    
    def __init__(self, message: str = "Authentication failed"):
        super().__init__(
            status_code=status.HTTP_401_UNAUTHORIZED,
            message=message,
            error_code="AUTHENTICATION_FAILED"
        )


class AuthorizationError(APIException):
    """Authorization-related error"""
    
    def __init__(self, message: str = "Access denied"):
        super().__init__(
            status_code=status.HTTP_403_FORBIDDEN,
            message=message,
            error_code="ACCESS_DENIED"
        )


class ExternalServiceError(APIException):
    """External service integration error"""
    
    def __init__(self, service: str, message: str = "External service unavailable"):
        super().__init__(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            message=f"{service}: {message}",
            details={"service": service},
            error_code="EXTERNAL_SERVICE_ERROR"
        )
