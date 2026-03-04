from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from app.api.api_v1.api import api_router
from app.core.config import settings

# Create FastAPI app
app = FastAPI(title="LifeOS Backend API")

# Allowed frontend domains
origins = [
    "http://localhost:3000",                # Local development
    "https://lifeos-clean.vercel.app",      # Production frontend
]

# CORS Middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],      # Allowed domains
    allow_credentials=True,     # Required for authentication
    allow_methods=["*"],        # Allow GET, POST, PUT, DELETE, OPTIONS
    allow_headers=["*"],        # Allow all headers
)

# Handle preflight requests (important for browsers)
@app.options("/{full_path:path}")
async def preflight_handler(request: Request, full_path: str):
    return JSONResponse({"message": "OK"})

# Root route
@app.get("/")
async def root():
    return {
        "status": "running",
        "service": "LifeOS Backend API"
    }

# Health check endpoint
@app.get("/api/health")
async def health_check():
    return {
        "status": "ok",
        "service": "backend"
    }

# Include API routes
app.include_router(api_router, prefix=settings.API_V1_STR)
