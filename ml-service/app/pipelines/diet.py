import numpy as np
from sklearn.linear_model import LinearRegression
import joblib
import os

MODEL_PATH = os.path.join(os.path.dirname(__file__), "..", "models_store", "diet_model_v1.joblib")

def calculate_bmr(weight_kg: float, height_cm: float, age_years: int, gender: str) -> float:
    # Mifflin-St Jeor Equation
    if gender.lower() == 'male':
        return 10 * weight_kg + 6.25 * height_cm - 5 * age_years + 5
    else:
        return 10 * weight_kg + 6.25 * height_cm - 5 * age_years - 161

def train_diet_model():
    # Dummy training data: [calories_in, BMR, physical_activity_minutes]
    X_train = np.array([
        [2000, 1800, 30],
        [2500, 1800, 0],
        [1500, 1600, 60],
        [3000, 2000, 120]
    ])
    # y: weight_change_kg_per_week
    y_train = np.array([-0.2, 0.5, -0.8, 0.1])
    
    model = LinearRegression()
    model.fit(X_train, y_train)
    
    os.makedirs(os.path.dirname(MODEL_PATH), exist_ok=True)
    joblib.dump(model, MODEL_PATH)
    print(f"Diet regression model saved to {MODEL_PATH}")

def predict_weight_change(calories_in: float, bmr: float, activity_mins: int) -> float:
    if not os.path.exists(MODEL_PATH):
        train_diet_model()
    model = joblib.load(MODEL_PATH)
    return model.predict(np.array([[calories_in, bmr, activity_mins]]))[0]
