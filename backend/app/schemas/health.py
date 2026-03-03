import uuid
from datetime import date
from typing import Optional
from pydantic import BaseModel

class HealthLogBase(BaseModel):
    date: date
    weight_kg: Optional[float] = None
    sleep_hours: Optional[float] = None
    physical_activity_minutes: Optional[int] = None

class HealthLogCreate(HealthLogBase):
    sleep_time: Optional[str] = None
    wake_time: Optional[str] = None

class HealthLogUpdate(HealthLogBase):
    date: Optional[date] = None

class HealthLog(HealthLogBase):
    id: uuid.UUID
    user_id: uuid.UUID

    class Config:
        from_attributes = True

class DietLogBase(BaseModel):
    date: date
    calories_in: Optional[float] = None
    protein_g: Optional[float] = None
    carbs_g: Optional[float] = None
    fat_g: Optional[float] = None
    water_ml: Optional[float] = None

class DietLogCreate(DietLogBase):
    pass

class DietLogUpdate(DietLogBase):
    date: Optional[date] = None

class DietLog(DietLogBase):
    id: uuid.UUID
    user_id: uuid.UUID

    class Config:
        from_attributes = True
