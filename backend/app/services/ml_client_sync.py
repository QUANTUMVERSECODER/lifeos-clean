import requests
from app.core.config import settings

class SyncMLServiceClient:
    def __init__(self):
        self.base_url = settings.ML_SERVICE_URL

    def predict_burnout(self, data: dict):
        response = requests.post(f"{self.base_url}/ml/predict/burnout", json=data)
        response.raise_for_status()
        return response.json()
        
    def trigger_retraining(self):
        # We can simulate hitting a theoretical /ml/retrain endpoint
        return {"status": "retraining started"}

ml_client_sync = SyncMLServiceClient()
