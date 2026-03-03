from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.api.inference import router as inference_router

app = FastAPI(title="LifeOS ML Service API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # Update for production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/ml/health")
async def health_check():
    return {"status": "ok", "service": "ml-service"}

app.include_router(inference_router, prefix="/ml")
