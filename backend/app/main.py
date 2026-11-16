from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.config import settings
from app.database import engine, Base
import app.models # ensure all models are imported

# Create database tables
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title=settings.PROJECT_NAME,
    description="MSME CashFlow Guardian - Predict the Risk. Protect the Business. Financial Intelligence Engine.",
    version=settings.VERSION,
    docs_url="/api/docs",
    redoc_url="/api/redoc",
    openapi_url="/api/openapi.json"
)

# CORS configuration with explicit origins (strictly non-wildcard for credential safety)
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include Routers under /api
from app.api.auth import router as auth_router
from app.api.business import router as business_router
from app.api.dashboard import router as dashboard_router
from app.api.transactions import router as transactions_router
from app.api.customers import router as customers_router
from app.api.suppliers import router as suppliers_router
from app.api.forecast import router as forecast_router
from app.api.scenarios import router as scenarios_router
from app.api.ai import router as ai_router
from app.api.demo import router as demo_router
from app.api.health import router as health_router

app.include_router(auth_router, prefix=settings.API_PREFIX)
app.include_router(business_router, prefix=settings.API_PREFIX)
app.include_router(dashboard_router, prefix=settings.API_PREFIX)
app.include_router(transactions_router, prefix=settings.API_PREFIX)
app.include_router(customers_router, prefix=settings.API_PREFIX)
app.include_router(suppliers_router, prefix=settings.API_PREFIX)
app.include_router(forecast_router, prefix=settings.API_PREFIX)
app.include_router(scenarios_router, prefix=settings.API_PREFIX)
app.include_router(ai_router, prefix=settings.API_PREFIX)
app.include_router(demo_router, prefix=settings.API_PREFIX)
app.include_router(health_router, prefix=settings.API_PREFIX)

@app.get("/")
def root():
    return {
        "message": "MSME CashFlow Guardian API is operational.",
        "docs": "/api/docs",
        "tagline": "Predict the Risk. Protect the Business."
    }
