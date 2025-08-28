from __future__ import annotations

from datetime import datetime, timedelta, timezone
from typing import Optional, Dict, Any
import secrets

from fastapi import Depends, HTTPException, status, Response, Request
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from jose import JWTError, jwt
from passlib.context import CryptContext

from .config import get_settings
from .db import get_db

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
reusable_oauth2 = HTTPBearer(auto_error=False)


def hash_password(password: str) -> str:
    return pwd_context.hash(password)


def verify_password(plain_password: str, hashed_password: str) -> bool:
    return pwd_context.verify(plain_password, hashed_password)


def create_access_token(user_id: str, email: str) -> str:
    settings = get_settings()
    to_encode = {"userId": user_id, "email": email, "type": "access"}
    expire = datetime.now(timezone.utc) + timedelta(minutes=settings.JWT_EXPIRES_MIN)
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, settings.JWT_SECRET, algorithm=settings.JWT_ALG)


def create_refresh_token(user_id: str) -> str:
    settings = get_settings()
    to_encode = {"userId": user_id, "type": "refresh"}
    # Refresh tokens last 7 days
    expire = datetime.now(timezone.utc) + timedelta(days=7)
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, settings.JWT_SECRET, algorithm=settings.JWT_ALG)


def create_token_pair(user_id: str, email: str) -> Dict[str, str]:
    """Create both access and refresh tokens"""
    return {
        "access_token": create_access_token(user_id, email),
        "refresh_token": create_refresh_token(user_id),
        "token_type": "bearer"
    }


async def get_current_user(
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(reusable_oauth2),
    db=Depends(get_db),
):
    # Use header-based authentication for backward compatibility
    token = None
    if credentials and credentials.scheme.lower() == "bearer":
        token = credentials.credentials
    
    if not token:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Access token required")
    
    settings = get_settings()
    try:
        payload = jwt.decode(token, settings.JWT_SECRET, algorithms=[settings.JWT_ALG])
        user_id: str = payload.get("userId")
        email: str = payload.get("email")
        token_type: str = payload.get("type")
        
        # For backward compatibility, allow tokens without type field
        if user_id is None or email is None:
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token")
        if token_type and token_type != "access":
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token type")
    except JWTError:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Invalid or expired token")

    user = await db["users"].find_one({"id": user_id})
    if not user:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="User not found")

    # Remove password before returning
    user.pop("password", None)
    user.pop("_id", None)
    return user


async def get_current_user_with_cookies(
    request: Request,
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(reusable_oauth2),
    db=Depends(get_db),
):
    """Enhanced authentication that supports both cookies and headers"""
    token = get_token_from_cookie_or_header(request, credentials)
    
    if not token:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Access token required")
    
    settings = get_settings()
    try:
        payload = jwt.decode(token, settings.JWT_SECRET, algorithms=[settings.JWT_ALG])
        user_id: str = payload.get("userId")
        email: str = payload.get("email")
        token_type: str = payload.get("type")
        
        if user_id is None or email is None:
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token")
        if token_type and token_type != "access":
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token type")
    except JWTError:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Invalid or expired token")

    user = await db["users"].find_one({"id": user_id})
    if not user:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="User not found")

    # Remove password before returning
    user.pop("password", None)
    user.pop("_id", None)
    return user


async def get_optional_user(
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(reusable_oauth2),
    db=Depends(get_db),
):
    if credentials is None or credentials.scheme.lower() != "bearer":
        return None
    token = credentials.credentials
    settings = get_settings()
    try:
        payload = jwt.decode(token, settings.JWT_SECRET, algorithms=[settings.JWT_ALG])
        user_id: str = payload.get("userId")
        if not user_id:
            return None
    except JWTError:
        return None

    user = await db["users"].find_one({"id": user_id})
    if user:
        user.pop("password", None)
        user.pop("_id", None)
    return user


def set_auth_cookies(response: Response, tokens: Dict[str, str], secure: bool = False) -> None:
    """Set httpOnly cookies for tokens in production"""
    settings = get_settings()
    is_production = settings.ENV == "production"
    
    # Access token cookie (shorter expiry)
    response.set_cookie(
        key="access_token",
        value=tokens["access_token"],
        httponly=True,
        secure=secure or is_production,
        samesite="strict",
        max_age=settings.JWT_EXPIRES_MIN * 60  # Convert minutes to seconds
    )
    
    # Refresh token cookie (longer expiry)
    response.set_cookie(
        key="refresh_token", 
        value=tokens["refresh_token"],
        httponly=True,
        secure=secure or is_production,
        samesite="strict",
        max_age=7 * 24 * 60 * 60  # 7 days in seconds
    )


def clear_auth_cookies(response: Response) -> None:
    """Clear authentication cookies"""
    response.delete_cookie("access_token", httponly=True, samesite="strict")
    response.delete_cookie("refresh_token", httponly=True, samesite="strict")


def get_token_from_cookie_or_header(request: Request, credentials: Optional[HTTPAuthorizationCredentials]) -> Optional[str]:
    """Get token from cookie (production) or Authorization header (development)"""
    settings = get_settings()
    
    # In production, prefer httpOnly cookies
    if settings.ENV == "production":
        return request.cookies.get("access_token")
    
    # In development, allow both cookies and headers
    cookie_token = request.cookies.get("access_token")
    if cookie_token:
        return cookie_token
    
    # Fallback to Authorization header
    if credentials and credentials.scheme.lower() == "bearer":
        return credentials.credentials
    
    return None


async def verify_refresh_token(token: str, db) -> Optional[Dict[str, Any]]:
    """Verify refresh token and return user data"""
    settings = get_settings()
    try:
        payload = jwt.decode(token, settings.JWT_SECRET, algorithms=[settings.JWT_ALG])
        user_id: str = payload.get("userId")
        token_type: str = payload.get("type")
        
        if user_id is None or token_type != "refresh":
            return None
            
    except JWTError:
        return None

    user = await db["users"].find_one({"id": user_id})
    if user:
        user.pop("password", None)
        user.pop("_id", None)
    return user
