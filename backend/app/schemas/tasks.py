import uuid
from datetime import datetime
from typing import Optional
from pydantic import BaseModel

class TaskLogBase(BaseModel):
    task_name: str
    tag: Optional[str] = None
    duration_minutes: Optional[int] = None
    priority: Optional[str] = "medium"
    status: Optional[str] = "pending"
    deadline: Optional[datetime] = None
    reminder_sent: Optional[bool] = False

class TaskLogCreate(TaskLogBase):
    pass

class TaskLogUpdate(TaskLogBase):
    task_name: Optional[str] = None
    tag: Optional[str] = None
    duration_minutes: Optional[int] = None
    priority: Optional[str] = None
    status: Optional[str] = None
    completed_at: Optional[datetime] = None
    deadline: Optional[datetime] = None
    reminder_sent: Optional[bool] = None

class TaskLog(TaskLogBase):
    id: uuid.UUID
    user_id: uuid.UUID
    tag: Optional[str]
    created_at: datetime
    completed_at: Optional[datetime]
    deadline: Optional[datetime]
    reminder_sent: Optional[bool]

    class Config:
        from_attributes = True

class HabitTrackingBase(BaseModel):
    habit_name: str
    frequency: str
    streak: int = 0

class HabitTrackingCreate(HabitTrackingBase):
    pass

class HabitTrackingUpdate(HabitTrackingBase):
    habit_name: Optional[str] = None
    frequency: Optional[str] = None
    streak: Optional[int] = None

class HabitTracking(HabitTrackingBase):
    id: uuid.UUID
    user_id: uuid.UUID
    created_at: datetime

    class Config:
        from_attributes = True
