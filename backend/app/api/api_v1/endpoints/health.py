from typing import Any, List
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from datetime import datetime, timedelta

from app.api import deps
from app.models.user import User
from app.models.health import HealthLog, DietLog
from app.schemas.health import (
    HealthLog as HealthLogSchema, HealthLogCreate,
    DietLog as DietLogSchema, DietLogCreate
)

router = APIRouter()

@router.post("/health-logs", response_model=HealthLogSchema)
async def create_health_log(
    *,
    db: AsyncSession = Depends(deps.get_db),
    health_in: HealthLogCreate,
    current_user: User = Depends(deps.get_current_active_user),
) -> Any:
    """Create a health log."""
    log_data = health_in.model_dump(exclude={"sleep_time", "wake_time"})
    
    if health_in.sleep_time and health_in.wake_time:
        try:
            time_fmt = "%H:%M"
            sleep_dt = datetime.strptime(health_in.sleep_time, time_fmt)
            wake_dt = datetime.strptime(health_in.wake_time, time_fmt)
            
            if wake_dt < sleep_dt:
                wake_dt += timedelta(days=1)
                
            calculated_hours = (wake_dt - sleep_dt).total_seconds() / 3600.0
            log_data["sleep_hours"] = round(calculated_hours, 2)
        except ValueError:
            pass
            
    log = HealthLog(**log_data, user_id=current_user.id)
    db.add(log)
    await db.commit()
    await db.refresh(log)
    return log

@router.get("/health-logs", response_model=List[HealthLogSchema])
async def read_health_logs(
    db: AsyncSession = Depends(deps.get_db),
    skip: int = 0,
    limit: int = 100,
    current_user: User = Depends(deps.get_current_active_user),
) -> Any:
    """Retrieve health logs."""
    result = await db.execute(select(HealthLog).where(HealthLog.user_id == current_user.id).offset(skip).limit(limit))
    logs = result.scalars().all()
    return logs

@router.post("/diet-logs", response_model=DietLogSchema)
async def create_diet_log(
    *,
    db: AsyncSession = Depends(deps.get_db),
    diet_in: DietLogCreate,
    current_user: User = Depends(deps.get_current_active_user),
) -> Any:
    """Create a diet log."""
    log = DietLog(**diet_in.model_dump(), user_id=current_user.id)
    db.add(log)
    await db.commit()
    await db.refresh(log)
    return log

@router.get("/diet-logs", response_model=List[DietLogSchema])
async def read_diet_logs(
    db: AsyncSession = Depends(deps.get_db),
    skip: int = 0,
    limit: int = 100,
    current_user: User = Depends(deps.get_current_active_user),
) -> Any:
    """Retrieve diet logs."""
    result = await db.execute(select(DietLog).where(DietLog.user_id == current_user.id).offset(skip).limit(limit))
    logs = result.scalars().all()
    return logs
