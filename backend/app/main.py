from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.api.api_v1.api import api_router
from app.core.config import settings

app = FastAPI(title="LifeOS Backend API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ADD THIS
@app.get("/")
async def root():
    return {"status": "running"}

@app.get("/api/health")
async def health_check():
    return {"status": "ok", "service": "backend"}

app.include_router(api_router, prefix=settings.API_V1_STR)