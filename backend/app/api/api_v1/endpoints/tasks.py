from typing import Any, List
from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.api import deps
from app.models.user import User
from app.models.tasks import TaskLog, HabitTracking
from app.schemas.tasks import (
    TaskLog as TaskLogSchema, TaskLogCreate, TaskLogUpdate,
    HabitTracking as HabitTrackingSchema, HabitTrackingCreate
)

router = APIRouter()

@router.post("/", response_model=TaskLogSchema)
async def create_task_log(
    *,
    db: AsyncSession = Depends(deps.get_db),
    task_in: TaskLogCreate,
    current_user: User = Depends(deps.get_current_active_user),
) -> Any:
    task_data = task_in.model_dump()
    
    # Strip timezone bounds explicitly because PostgreSQL TIMESTAMP WITHOUT TIMEZONE
    # will crash when combining naive `created_at` with aware `deadline`
    if task_data.get("deadline"):
        task_data["deadline"] = task_data["deadline"].replace(tzinfo=None)
        
    log = TaskLog(**task_data, user_id=current_user.id)
    db.add(log)
    await db.commit()
    await db.refresh(log)
    return log

@router.get("/", response_model=List[TaskLogSchema])
async def read_task_logs(
    db: AsyncSession = Depends(deps.get_db),
    skip: int = 0,
    limit: int = 100,
    current_user: User = Depends(deps.get_current_active_user),
) -> Any:
    # Adding order_by explicitly to complement pagination and limit
    result = await db.execute(
        select(TaskLog)
        .where(TaskLog.user_id == current_user.id)
        .order_by(TaskLog.created_at.desc())
        .offset(skip)
        .limit(limit)
    )
    return result.scalars().all()

@router.put("/{task_id}", response_model=TaskLogSchema)
async def update_task_log(
    *,
    db: AsyncSession = Depends(deps.get_db),
    task_id: Any,
    task_in: TaskLogUpdate,
    current_user: User = Depends(deps.get_current_active_user),
) -> Any:
    result = await db.execute(select(TaskLog).where(TaskLog.id == task_id, TaskLog.user_id == current_user.id))
    log = result.scalars().first()
    if not log:
        from fastapi import HTTPException
        raise HTTPException(status_code=404, detail="Task not found")
    
    update_data = task_in.model_dump(exclude_unset=True)
    
    if update_data.get("deadline"):
        update_data["deadline"] = update_data["deadline"].replace(tzinfo=None)
        
    for field, value in update_data.items():
        setattr(log, field, value)
        
    if "status" in update_data:
        if update_data["status"] == "completed" and not log.completed_at:
            from datetime import datetime
            log.completed_at = datetime.utcnow()
        elif update_data["status"] == "pending":
            log.completed_at = None
        
    await db.commit()
    await db.refresh(log)
    return log

@router.delete("/{task_id}", response_model=TaskLogSchema)
async def delete_task_log(
    *,
    db: AsyncSession = Depends(deps.get_db),
    task_id: Any,
    current_user: User = Depends(deps.get_current_active_user),
) -> Any:
    result = await db.execute(select(TaskLog).where(TaskLog.id == task_id, TaskLog.user_id == current_user.id))
    log = result.scalars().first()
    if not log:
        from fastapi import HTTPException
        raise HTTPException(status_code=404, detail="Task not found")
    
    await db.delete(log)
    await db.commit()
    return log
