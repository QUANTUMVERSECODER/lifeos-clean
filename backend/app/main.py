from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.api.api_v1.api import api_router
from app.core.config import settings

app = FastAPI(title="LifeOS Backend API")

# ✅ FIXED CORS CONFIG
origins = [
    "http://localhost:3000",                 # local dev
    "https://lifeos-clean.vercel.app",       # production frontend
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=False,  # MUST be False unless you fully configure cookies
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
async def root():
    return {"status": "running"}

@app.get("/api/health")
async def health_check():
    return {"status": "ok", "service": "backend"}

app.include_router(api_router, prefix=settings.API_V1_STR)