from fastapi import APIRouter
from app.api.api_v1.endpoints import auth, users, health, tasks, metrics

api_router = APIRouter()
api_router.include_router(auth.router, tags=["login"])
api_router.include_router(users.router, prefix="/users", tags=["users"])
api_router.include_router(health.router, prefix="/health", tags=["health"])
api_router.include_router(tasks.router, prefix="/tasks", tags=["tasks"])
api_router.include_router(metrics.router, prefix="/metrics", tags=["metrics"])
