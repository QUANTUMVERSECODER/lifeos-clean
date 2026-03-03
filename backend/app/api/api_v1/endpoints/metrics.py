from typing import Any, List
from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.api import deps
from app.models.user import User
from app.models.tasks import ProductivityLog, TaskLog
from app.models.health import MoodLog, HealthLog
from app.schemas.metrics import (
    ProductivityLog as ProductivityLogSchema, ProductivityLogCreate,
    MoodLog as MoodLogSchema, MoodLogCreate, DashboardMetrics
)
from datetime import datetime, timedelta
from sqlalchemy import func

router = APIRouter()

@router.post("/productivity", response_model=ProductivityLogSchema)
async def create_productivity_log(
    *,
    db: AsyncSession = Depends(deps.get_db),
    prod_in: ProductivityLogCreate,
    current_user: User = Depends(deps.get_current_active_user),
) -> Any:
    log = ProductivityLog(**prod_in.model_dump(), user_id=current_user.id)
    db.add(log)
    await db.commit()
    await db.refresh(log)
    return log

@router.post("/mood", response_model=MoodLogSchema)
async def create_mood_log(
    *,
    db: AsyncSession = Depends(deps.get_db),
    mood_in: MoodLogCreate,
    current_user: User = Depends(deps.get_current_active_user),
) -> Any:
    log = MoodLog(**mood_in.model_dump(), user_id=current_user.id)
    db.add(log)
    await db.commit()
    await db.refresh(log)
    return log

@router.get("/dashboard", response_model=DashboardMetrics)
async def get_dashboard_metrics(
    db: AsyncSession = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_active_user),
) -> Any:
    today = datetime.utcnow().date()
    seven_days_ago = today - timedelta(days=7)

    # 1. Weekly Tasks (Last 7 days)
    recent_tasks_query = await db.execute(
        select(TaskLog).where(
            TaskLog.user_id == current_user.id,
            TaskLog.created_at >= datetime.combine(seven_days_ago, datetime.min.time())
        )
    )
    recent_tasks = recent_tasks_query.scalars().all()
    total_tasks_7d = len(recent_tasks)
    completed_tasks_7d = sum(1 for t in recent_tasks if t.status == 'completed')
    completion_percentage_7d = (completed_tasks_7d / total_tasks_7d * 100) if total_tasks_7d > 0 else 0.0

    all_pending_query = await db.execute(select(TaskLog).where(TaskLog.user_id == current_user.id, TaskLog.status == 'pending'))
    pending_tasks_total = len(all_pending_query.scalars().all())

    # 2. Calorie targets from explicit user goals
    cals_target = float(current_user.daily_calorie_goal) if current_user.daily_calorie_goal else 0.0
    protein_target = float(current_user.daily_protein_goal) if current_user.daily_protein_goal else 0.0

    # 3. Diet logs for today
    from app.models.health import DietLog
    diet_query = await db.execute(
        select(DietLog).where(DietLog.user_id == current_user.id, DietLog.date == today)
    )
    diet_logs = diet_query.scalars().all()
    cals_today = sum(d.calories_in or 0 for d in diet_logs)
    protein_today = sum(d.protein_g or 0 for d in diet_logs)
    cals_remaining = max(0, cals_target - cals_today) if cals_target > 0 else 0

    # 4. Sleep & Health grouping
    health_query = await db.execute(
        select(HealthLog).where(HealthLog.user_id == current_user.id, HealthLog.date >= seven_days_ago).order_by(HealthLog.date.asc())
    )
    health_logs = health_query.scalars().all()
    
    weekly_sleep_trend = []
    sleep_total = 0
    sleep_count = 0
    sleep_last_night = None
    
    for log in health_logs:
        if log.sleep_hours is not None:
            weekly_sleep_trend.append({"day": log.date.strftime("%b %d"), "hours": log.sleep_hours})
            sleep_total += log.sleep_hours
            sleep_count += 1
            if log.date == today or log.date == today - timedelta(days=1):
                sleep_last_night = log.sleep_hours
                
    sleep_weekly_avg = round(sleep_total / sleep_count, 1) if sleep_count > 0 else None

    # 5. Task completion grouping by day
    task_trend_query = await db.execute(
        select(func.date(TaskLog.completed_at).label('cdate'), func.count(TaskLog.id).label('ccount'))
        .where(
            TaskLog.user_id == current_user.id, 
            TaskLog.status == 'completed',
            TaskLog.completed_at >= datetime.combine(seven_days_ago, datetime.min.time())
        )
        .group_by('cdate')
        .order_by('cdate')
    )
    weekly_task_trend = [{"day": row.cdate.strftime("%b %d"), "tasks": row.ccount} for row in task_trend_query.all() if row.cdate]

    # 6. Burnout / Sufficient Data validation
    has_sufficient_data = bool(sleep_last_night is not None and total_tasks_7d > 0)
    latest_burnout_score = None
    
    if has_sufficient_data:
        import httpx
        import os
        ml_url = os.getenv("ML_SERVICE_URL", "http://ml-service:8001")
        try:
            async with httpx.AsyncClient() as client:
                ml_res = await client.post(f"{ml_url}/ml/predict/burnout", json={
                    "sleep_hours": float(sleep_last_night) if sleep_last_night else 7.0,
                    "workload_hours": float(completed_tasks_7d),
                    "mood_score": 5,
                    "screen_time_minutes": 120
                }, timeout=5.0)
                if ml_res.status_code == 200:
                    prob = ml_res.json().get("burnout_probability", 0)
                    latest_burnout_score = max(0.0, min(1.0, prob))
        except Exception as e:
            print("Failed ML Burnout Inference:", e)

    # 7. Productivity Insight
    prod_query = await db.execute(select(ProductivityLog).where(ProductivityLog.user_id == current_user.id).order_by(ProductivityLog.date.desc()).limit(1))
    latest_prod = prod_query.scalar_one_or_none()
    deep_work = latest_prod.deep_work_minutes if latest_prod and latest_prod.deep_work_minutes else 0
    
    mood_query = await db.execute(select(MoodLog).where(MoodLog.user_id == current_user.id).order_by(MoodLog.date.desc()).limit(1))
    latest_mood = mood_query.scalar_one_or_none()
    mood_val = latest_mood.mood_score if latest_mood and latest_mood.mood_score else 5
    
    sleep_val = sleep_last_night if sleep_last_night else 7.0
    
    def estimate_peak_productivity(dw: int, sl: float, m: int) -> str:
        if sl >= 7 and dw >= 120:
            return "Your peak productivity window is likely 9AM–12PM."
        elif sl < 7:
            return "Your peak productivity window is likely late afternoon (slump recovery)."
        elif m >= 7:
            return "Your peak productivity window is stable throughout the day."
        else:
            return "Your peak productivity window is variable based on rest and mood."
            
    productivity_insight = estimate_peak_productivity(deep_work, sleep_val, mood_val)

    # 8. Burnout Forecast (regression 3 days)
    burnout_forecast_trend = []
    if latest_burnout_score is not None:
        task_vals = [t['tasks'] for t in weekly_task_trend]
        if len(task_vals) > 1:
            slope = (task_vals[-1] - task_vals[0]) / len(task_vals)
        else:
            slope = 0
            
        current_score = latest_burnout_score
        for i in range(1, 4):
            delta = 0.05 * slope
            proj = max(0.0, min(1.0, current_score + (delta * i)))
            future_date = today + timedelta(days=i)
            burnout_forecast_trend.append({"day": future_date.strftime("%b %d"), "score": round(proj * 100, 1)})

    return DashboardMetrics(
        total_tasks_7d=total_tasks_7d,
        completed_tasks_7d=completed_tasks_7d,
        pending_tasks_total=pending_tasks_total,
        completion_percentage_7d=round(completion_percentage_7d, 1),
        latest_burnout_score=latest_burnout_score,
        has_sufficient_data=has_sufficient_data,
        cals_today=cals_today,
        cals_target=cals_target,
        cals_remaining=cals_remaining,
        protein_today=protein_today,
        protein_target=protein_target,
        sleep_last_night=sleep_last_night,
        sleep_weekly_avg=sleep_weekly_avg,
        weekly_sleep_trend=weekly_sleep_trend,
        weekly_task_completion_trend=weekly_task_trend,
        productivity_insight=productivity_insight,
        burnout_forecast_trend=burnout_forecast_trend
    )
