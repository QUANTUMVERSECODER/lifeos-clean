from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.api.api_v1.api import api_router
from app.core.config import settings

app = FastAPI(title="LifeOS Backend API")

# Allowed frontend domains
origins = [
    "http://localhost:3000",          # Local development
    "https://lifeos-clean.vercel.app" # Production frontend
]

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,   # REQUIRED for auth requests
    allow_methods=["*"],
    allow_headers=["*"],
)

# Root route
@app.get("/")
async def root():
    return {"status": "running"}

# Health check
@app.get("/api/health")
async def health_check():
    return {"status": "ok", "service": "backend"}

# Include API routes
app.include_router(api_router, prefix=settings.API_V1_STR)
