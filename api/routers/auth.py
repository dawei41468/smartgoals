from __future__ import annotations

from datetime import datetime, timezone
from typing import Dict, Any
from fastapi import APIRouter, Depends, HTTPException, status, Response, Request
from pydantic import BaseModel
from motor.motor_asyncio import AsyncIOMotorDatabase

from ..db import get_db
from ..models import RegisterData, LoginData, User, UserPublic, UserSettings
from ..auth_utils import (
    hash_password, verify_password, create_access_token, get_current_user,
    create_token_pair, set_auth_cookies, clear_auth_cookies, verify_refresh_token
)
from ..models import new_id
from ..response_utils import (
    success_response, created_response, conflict_response, unauthorized_response
)

router = APIRouter()


class AuthResponseData(BaseModel):
    user: UserPublic
    token: str

class AuthResponse(BaseModel):
    success: bool
    message: str
    data: AuthResponseData
    meta: Dict[str, Any]
    timestamp: datetime


class TokenResponse(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str
    message: str


@router.post("/auth/register", response_model=AuthResponse, status_code=201)
async def register(user_data: RegisterData, db: AsyncIOMotorDatabase = Depends(get_db)):
    existing = await db["users"].find_one({"email": user_data.email})
    if existing:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="User with this email already exists")

    user_id = new_id()
    now = datetime.now(timezone.utc)
    user: User = User(
        id=user_id,
        username=user_data.email.split("@")[0],
        password=hash_password(user_data.password),
        firstName=user_data.firstName,
        lastName=user_data.lastName,
        email=user_data.email,
        bio=None,
        createdAt=now,
        updatedAt=now,
    )
    await db["users"].insert_one(user.model_dump())

    settings = UserSettings(
        id=new_id(),
        userId=user_id,
        createdAt=now,
        updatedAt=now,
    )
    await db["user_settings"].insert_one(settings.model_dump())

    token = create_access_token(user_id, user.email)  # type: ignore[arg-type]
    public = UserPublic(**user.model_dump(exclude={"password"}))
    return created_response(
        data={"user": public.model_dump(), "token": token},
        message="User registered successfully"
    )


@router.post("/auth/login", response_model=AuthResponse)
async def login(payload: LoginData, response: Response, db: AsyncIOMotorDatabase = Depends(get_db)):
    user_doc = await db["users"].find_one({"email": payload.email})
    if not user_doc:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid email or password")

    if not verify_password(payload.password, user_doc.get("password", "")):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid email or password")

    # Create token pair for enhanced security
    tokens = create_token_pair(user_doc["id"], user_doc.get("email") or user_doc.get("username"))
    
    # Set httpOnly cookies in production
    set_auth_cookies(response, tokens)
    
    user_doc.pop("password", None)
    user_doc.pop("_id", None)
    return success_response(
        data={"user": UserPublic(**user_doc).model_dump(), "token": tokens["access_token"]},
        message="Login successful"
    )


@router.post("/auth/logout")
async def logout(response: Response):
    clear_auth_cookies(response)
    return success_response(message="Logout successful")


@router.post("/auth/refresh", response_model=TokenResponse)
async def refresh_token(request: Request, response: Response, db: AsyncIOMotorDatabase = Depends(get_db)):
    # Get refresh token from cookie or header
    refresh_token = request.cookies.get("refresh_token")
    if not refresh_token:
        # Fallback to Authorization header for development
        auth_header = request.headers.get("authorization")
        if auth_header and auth_header.startswith("Bearer "):
            refresh_token = auth_header.split(" ")[1]
    
    if not refresh_token:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Refresh token required")
    
    # Verify refresh token
    user = await verify_refresh_token(refresh_token, db)
    if not user:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid or expired refresh token")
    
    # Create new token pair
    tokens = create_token_pair(user["id"], user["email"])
    
    # Set new httpOnly cookies
    set_auth_cookies(response, tokens)
    
    return success_response(
        data=tokens,
        message="Tokens refreshed successfully"
    )


@router.get("/auth/me", response_model=UserPublic)
async def me(current_user=Depends(get_current_user)):
    return success_response(
        data=current_user,
        message="User profile retrieved successfully"
    )
