from __future__ import annotations

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from .config import get_settings
from .db import connect, disconnect
from .scheduler import start_scheduler, shutdown_scheduler
from .routers import auth, user, goals, tasks, activities, analytics, ai, notifications


def create_app() -> FastAPI:
    settings = get_settings()
    app = FastAPI(title="GoalForge API", version="1.0.0")

    # CORS
    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.CORS_ORIGINS,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    # Routers
    app.include_router(auth.router, prefix="/api")
    app.include_router(user.router, prefix="/api")
    app.include_router(goals.router, prefix="/api")
    app.include_router(tasks.router, prefix="/api")
    app.include_router(activities.router, prefix="/api")
    app.include_router(analytics.router, prefix="/api")
    app.include_router(ai.router, prefix="/api")
    app.include_router(notifications.router, prefix="/api")

    @app.on_event("startup")
    async def _startup():
        await connect()
        # Start background scheduler for digests and reminders
        start_scheduler()

    @app.on_event("shutdown")
    async def _shutdown():
        await disconnect()
        shutdown_scheduler()

    return app


app = create_app()
