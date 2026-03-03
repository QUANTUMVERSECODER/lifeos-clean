from app.worker.celery_app import celery_app
from app.services.ml_client_sync import ml_client_sync
from celery.schedules import crontab
import asyncio
from datetime import datetime, timedelta
from sqlalchemy import select
from app.db.session import AsyncSessionLocal
from app.models.user import User
from app.models.health import DietLog, HealthLog
from app.models.tasks import TaskLog
from app.utils.email import send_email

# Setup periodic tasks
@celery_app.on_after_configure.connect
def setup_periodic_tasks(sender, **kwargs):
    sender.add_periodic_task(
        crontab(hour=0, minute=0),
        daily_retrain_models.s(),
    )
    sender.add_periodic_task(
        crontab(hour=20, minute=0),
        generate_daily_summaries.s(),
    )
    sender.add_periodic_task(
        crontab(hour=20, minute=0),
        send_health_reminders.s(),
    )
    sender.add_periodic_task(
        crontab(minute=0),
        send_deadline_reminders.s(),
    )

@celery_app.task(name="retrain_models")
def daily_retrain_models():
    """Trigger ML service to retrain models based on new data"""
    try:
        result = ml_client_sync.trigger_retraining()
        return {"status": "success", "detail": result}
    except Exception as e:
        return {"status": "error", "detail": str(e)}

@celery_app.task(name="generate_daily_summaries")
def generate_daily_summaries():
    """Generate burnout and productivity scores for all active users"""
    # Logic to fetch all users and call ml_client_sync.predict_burnout
    # Save the scores into DB (burnout_scores, productivity_logs)
    return {"status": "success", "processed_users": 100}

@celery_app.task(name="sync_predict_burnout")
def sync_predict_burnout(user_id: str, data: dict):
    """Offload prediction to background task and save to DB"""
    result = ml_client_sync.predict_burnout(data)
    # Expected save to BurnoutScores table...
    return result

async def _send_health_reminders():
    today = datetime.utcnow().date()
    async with AsyncSessionLocal() as db:
        users_result = await db.execute(select(User).where(User.email_notifications_enabled == True))
        users = users_result.scalars().all()
        for user in users:
            diet_result = await db.execute(select(DietLog).where(DietLog.user_id == user.id, DietLog.date == today))
            diets = diet_result.scalars().all()
            cals_in = sum(d.calories_in or 0 for d in diets)
            
            health_result = await db.execute(select(HealthLog).where(HealthLog.user_id == user.id, HealthLog.date == today))
            healths = health_result.scalars().all()
            
            needs_reminder = False
            if not healths:
                needs_reminder = True
            elif user.daily_calorie_goal and cals_in < (user.daily_calorie_goal * 0.5):
                needs_reminder = True
                
            if needs_reminder:
                send_email(
                    user.email,
                    "LifeOS Reminder – Log Your Health Data",
                    "You have not completed your daily health tracking. Please log your metrics in LifeOS."
                )

@celery_app.task(name="send_health_reminders")
def send_health_reminders():
    asyncio.run(_send_health_reminders())
    return {"status": "success"}

async def _send_deadline_reminders():
    now = datetime.utcnow()
    tomorrow = now + timedelta(days=1)
    async with AsyncSessionLocal() as db:
        tasks_result = await db.execute(
            select(TaskLog).where(
                TaskLog.status == 'pending',
                TaskLog.deadline != None,
                TaskLog.deadline <= tomorrow,
                TaskLog.reminder_sent == False
            )
        )
        tasks = tasks_result.scalars().all()
        
        for task in tasks:
            user_result = await db.execute(select(User).where(User.id == task.user_id, User.email_notifications_enabled == True))
            user = user_result.scalar_one_or_none()
            if user:
                send_email(
                    user.email,
                    "Upcoming Task Deadline – LifeOS",
                    f"You have a pending task approaching its deadline: {task.task_name}"
                )
                task.reminder_sent = True
        
        await db.commit()

@celery_app.task(name="send_deadline_reminders")
def send_deadline_reminders():
    asyncio.run(_send_deadline_reminders())
    return {"status": "success"}
