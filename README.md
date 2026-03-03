# LifeOS – AI Personal Life Operating System

A production-ready SaaS platform built with a microservices architecture to optimize diet, predict burnout, plan tasks, and simulate life trajectories.

## Architecture Stack

- **Frontend**: Next.js 14 (App Router), TypeScript, TailwindCSS, Recharts
- **Core API**: FastAPI (Python 3.11), Async SQLAlchemy, PostgreSQL, JWT Auth
- **ML Service**: FastAPI, Scikit-Learn, XGBoost, Monte Carlo Simulations
- **Background Tasks**: Celery, Redis Broker
- **Infrastructure**: Docker Compose, Nginx Reverse Proxy

## Initial Setup

1. Copy the example environment variables:
   ```bash
   cp .env.example .env
   ```

2. Build and start the services using Docker:
   ```bash
   docker-compose up --build -d
   ```

3. Run database migrations:
   ```bash
   docker-compose exec backend alembic upgrade head
   ```

## Services & Ports

- **Frontend**: http://localhost:3000 (if running Next.js dev server outside docker `npm run dev`)
- **API Gateway (Nginx)**: http://localhost:80
- **Backend API Docs (Swagger)**: http://localhost:8000/docs
- **ML Service Docs**: http://localhost:8001/docs
- **PostgreSQL Database**: `localhost:5432`
- **Redis Cache**: `localhost:6379`

## Available AI Features

1. **Burnout Prediction**: XGBoost model incorporating sleep, workload, and screen time.
2. **Diet Intelligence**: Regression models calculating BMR and predicting weight change.
3. **Time-Series Productivity**: Pattern matching for deep work windows.
4. **Life Trajectory**: 90-day Monte Carlo simulation forecasting health and finances.
