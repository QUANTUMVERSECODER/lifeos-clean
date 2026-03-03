from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import List, Dict

from app.pipelines.diet import calculate_bmr, predict_weight_change
from app.pipelines.burnout import predict_burnout
from app.pipelines.productivity import analyze_productivity_patterns
from app.pipelines.life_sim import run_monte_carlo_simulation

import os
import json

router = APIRouter()

class DietRequest(BaseModel):
    weight_kg: float
    height_cm: float
    age_years: int
    gender: str
    calories_in: float
    activity_mins: int

class BurnoutRequest(BaseModel):
    sleep_hours: float
    workload_hours: float
    mood_score: int
    screen_time_minutes: int

class ProductivityRequest(BaseModel):
    focus_logs: List[Dict]

class LifeSimRequest(BaseModel):
    initial_health: float
    initial_finances: float
    days: int = 90



@router.post("/predict/diet")
async def diet_prediction(req: DietRequest):
    bmr = calculate_bmr(req.weight_kg, req.height_cm, req.age_years, req.gender)
    weight_change = predict_weight_change(req.calories_in, bmr, req.activity_mins)
    return {"bmr": bmr, "predicted_weight_change_per_week": weight_change}

from app.pipelines.burnout import predict_burnout, interpret_burnout_score

@router.post("/predict/burnout")
async def burnout_prediction(req: BurnoutRequest):
    prob = predict_burnout(req.sleep_hours, req.workload_hours, req.mood_score, req.screen_time_minutes)
    interpretation = interpret_burnout_score(prob, req.sleep_hours, req.workload_hours)
    
    return {
        "burnout_probability": prob,
        "interpretation": interpretation
    }

@router.post("/analyze/productivity")
async def productivity_analysis(req: ProductivityRequest):
    peak_start, peak_end, conf = analyze_productivity_patterns(req.focus_logs)
    return {"peak_start": peak_start, "peak_end": peak_end, "confidence": conf}

@router.post("/simulate/life")
async def life_simulation(req: LifeSimRequest):
    result = run_monte_carlo_simulation(req.initial_health, req.initial_finances, req.days)
    return result

