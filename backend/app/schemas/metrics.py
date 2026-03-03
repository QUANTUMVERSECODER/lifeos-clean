import uuid
from datetime import date
from typing import Optional
from pydantic import BaseModel

class ProductivityLogBase(BaseModel):
    date: date
    focus_score: Optional[float] = None
    deep_work_minutes: Optional[int] = None
    screen_time_minutes: Optional[int] = None

class ProductivityLogCreate(ProductivityLogBase):
    pass

class ProductivityLogUpdate(ProductivityLogBase):
    date: Optional[date] = None

class ProductivityLog(ProductivityLogBase):
    id: uuid.UUID
    user_id: uuid.UUID

    class Config:
        from_attributes = True

class MoodLogBase(BaseModel):
    date: date
    mood_score: int
    stress_level: int
    notes: Optional[str] = None

class MoodLogCreate(MoodLogBase):
    pass

class MoodLogUpdate(MoodLogBase):
    date: Optional[date] = None
    mood_score: Optional[int] = None
    stress_level: Optional[int] = None

class MoodLog(MoodLogBase):
    id: uuid.UUID
    user_id: uuid.UUID

    class Config:
        from_attributes = True

from typing import List, Dict, Any

class DashboardMetrics(BaseModel):
    total_tasks_7d: int
    completed_tasks_7d: int
    pending_tasks_total: int
    completion_percentage_7d: float
    
    latest_burnout_score: Optional[float] = None
    has_sufficient_data: bool = False
    
    cals_today: float = 0
    cals_target: float = 0
    cals_remaining: float = 0
    protein_today: float = 0
    protein_target: float = 0
    
    sleep_last_night: Optional[float] = None
    sleep_weekly_avg: Optional[float] = None
    
    
    weekly_sleep_trend: List[Dict[str, Any]] = []
    weekly_task_completion_trend: List[Dict[str, Any]] = []
    productivity_insight: Optional[str] = None
    burnout_forecast_trend: List[Dict[str, Any]] = []
