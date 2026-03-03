import xgboost as xgb
import numpy as np
import os

MODEL_PATH = os.path.join(os.path.dirname(__file__), "..", "models_store", "burnout_model_v1.json")

def train_burnout_model():
    # Dummy data: [sleep_hours, workload_hours, mood_score(1-10), screen_time_minutes]
    X_train = np.array([
        [8.0, 6.0, 8, 120],
        [5.0, 12.0, 3, 400],
        [6.5, 9.0, 5, 250],
        [7.5, 8.0, 7, 200]
    ])
    # y: burnout probability (using classification labels for binary logistic)
    y_train = np.array([0, 1, 1, 0])
    
    model = xgb.XGBClassifier(objective="binary:logistic", eval_metric="logloss")
    model.fit(X_train, y_train)
    
    os.makedirs(os.path.dirname(MODEL_PATH), exist_ok=True)
    model.save_model(MODEL_PATH)
    print(f"Burnout XGBoost model saved to {MODEL_PATH}")

def predict_burnout(sleep_hours: float, workload_hours: float, mood_score: int, screen_time_minutes: int) -> float:
    if not os.path.exists(MODEL_PATH):
        train_burnout_model()
    model = xgb.XGBClassifier()
    model.load_model(MODEL_PATH)
    
    X_infer = np.array([[sleep_hours, workload_hours, mood_score, screen_time_minutes]])
    # Predict probability of class 1
    prob = model.predict_proba(X_infer)[0][1]
    return float(prob)

def interpret_burnout_score(score: float, sleep_hours: float, workload_hours: float) -> str:
    """
    Deterministic rule-based interpretation replacing generative AI.
    """
    if score > 0.75:
        message = "High burnout risk. Reduce workload and prioritize rest."
    elif score > 0.4:
        message = "Moderate burnout risk. Maintain balance."
    else:
        message = "Low burnout risk. Maintain consistency."

    if sleep_hours < 6:
        message += " Sleep is insufficient."
        
    if workload_hours > 50: # Adjusting workload context logically to 'hours'
        message += " Workload is heavy."

    return message
