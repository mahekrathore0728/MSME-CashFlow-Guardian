import os
from pathlib import Path
from typing import Optional, List
from pydantic import BaseModel, model_validator
from dotenv import load_dotenv

# Search for .env in backend/ or root directory
env_path = Path(__file__).resolve().parent.parent / ".env"
root_env_path = Path(__file__).resolve().parent.parent.parent / ".env"

if env_path.is_file():
    load_dotenv(dotenv_path=env_path)
elif root_env_path.is_file():
    load_dotenv(dotenv_path=root_env_path)
else:
    load_dotenv()

DEFAULT_DEV_SECRET = "msme-guardian-dev-secret-key-change-in-prod-2026"

def parse_cors_origins() -> List[str]:
    raw = os.getenv(
        "CORS_ORIGINS",
        "http://localhost:3000,http://127.0.0.1:3000,http://localhost:5173,http://127.0.0.1:5173"
    )
    origins = [orig.strip() for orig in raw.split(",") if orig.strip()]
    return origins

class Settings(BaseModel):
    PROJECT_NAME: str = "MSME CashFlow Guardian"
    VERSION: str = "1.0.0"
    API_PREFIX: str = "/api"
    ENVIRONMENT: str = os.getenv("ENVIRONMENT", "development")
    
    # Security
    SECRET_KEY: str = os.getenv("SECRET_KEY", DEFAULT_DEV_SECRET)
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24 * 7  # 7 days
    
    # CORS
    CORS_ORIGINS: List[str] = parse_cors_origins()
    
    # Database
    DATABASE_URL: str = os.getenv("DATABASE_URL", "sqlite:///./guardian.db")
    
    # Gemini AI (Optional - falls back to deterministic rule-based analysis)
    GEMINI_API_KEY: Optional[str] = os.getenv("GEMINI_API_KEY", None)
    GEMINI_MODEL: str = os.getenv("GEMINI_MODEL", "gemini-2.0-flash")

    @model_validator(mode="after")
    def validate_production_security(self):
        if self.ENVIRONMENT.lower() == "production":
            if (
                not self.SECRET_KEY
                or self.SECRET_KEY == DEFAULT_DEV_SECRET
                or len(self.SECRET_KEY) < 32
            ):
                raise ValueError(
                    "Production deployment requires an explicit, cryptographically secure SECRET_KEY "
                    "with at least 32 characters."
                )
        return self

settings = Settings()
