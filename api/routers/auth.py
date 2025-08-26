from __future__ import annotations

from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from motor.motor_asyncio import AsyncIOMotorDatabase

from ..db import get_db
from ..models import RegisterData, LoginData, User, UserPublic, UserSettings
from ..auth_utils import hash_password, verify_password, create_access_token, get_current_user
from ..models import new_id

router = APIRouter()


class AuthResponse(BaseModel):
    user: UserPublic
    token: str
    message: str


@router.post("/auth/register", response_model=AuthResponse, status_code=201)
async def register(user_data: RegisterData, db: AsyncIOMotorDatabase = Depends(get_db)):
    existing = await db["users"].find_one({"email": user_data.email})
    if existing:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="User with this email already exists")

    user_id = new_id()
    now = datetime.utcnow()
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
    return AuthResponse(user=public, token=token, message="User registered successfully")


@router.post("/auth/login", response_model=AuthResponse)
async def login(payload: LoginData, db: AsyncIOMotorDatabase = Depends(get_db)):
    user_doc = await db["users"].find_one({"email": payload.email})
    if not user_doc:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid email or password")

    if not verify_password(payload.password, user_doc.get("password", "")):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid email or password")

    token = create_access_token(user_doc["id"], user_doc.get("email") or user_doc.get("username"))
    user_doc.pop("password", None)
    user_doc.pop("_id", None)
    return AuthResponse(user=UserPublic(**user_doc), token=token, message="Login successful")


@router.post("/auth/logout")
async def logout():
    return {"message": "Logout successful"}


@router.get("/auth/me", response_model=UserPublic)
async def me(current_user=Depends(get_current_user)):
    return current_user
