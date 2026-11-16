from fastapi import APIRouter
from datetime import datetime, timezone
from app.config import settings

router = APIRouter(tags=["System"])

@router.get("/health")
def health_check():
    return {
        "status": "healthy",
        "service": settings.PROJECT_NAME,
        "version": settings.VERSION,
        "timestamp": datetime.now(timezone.utc).isoformat()
    }
