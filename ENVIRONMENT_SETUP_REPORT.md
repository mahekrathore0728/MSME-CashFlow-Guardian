# Environment Setup & Configuration Report
**MSME CashFlow Guardian**  
*Tagline: Predict the Risk. Protect the Business.*

---

## 1. Executive Summary

This report outlines the environment configuration and secret management architecture established for MSME CashFlow Guardian. 

The configuration system ensures:
1. Complete isolation of production and development secrets.
2. Prevention of credential leakage to version control.
3. Strict cryptographic secret validation in production environments.
4. Safe, non-wildcard Cross-Origin Resource Sharing (CORS).
5. Robust fallback to offline deterministic rules when optional AI keys (Google Gemini) are absent.

---

## 2. Environment Variables Specification

The system is configured via environment variables loaded dynamically by `python-dotenv` from `.env` or `backend/.env`.

| Environment Variable | Required in Dev | Required in Prod | Default / Recommended Format | Purpose |
|---|---|---|---|---|
| `ENVIRONMENT` | No | **Yes** | `development` / `production` | Governs strict security validation. In `production`, insecure secrets trigger runtime startup failure. |
| `PROJECT_NAME` | No | No | `MSME CashFlow Guardian` | System title used in documentation and logs. |
| `VERSION` | No | No | `1.0.0` | Application release version. |
| `SECRET_KEY` | No (dev fallback provided) | **Yes** | 64-character hex string | Cryptographic key used to sign HMAC-SHA256 JWT access tokens. |
| `ALGORITHM` | No | No | `HS256` | JWT signature algorithm. |
| `ACCESS_TOKEN_EXPIRE_MINUTES` | No | No | `10080` (7 days) | Token expiration duration in minutes. |
| `CORS_ORIGINS` | No | **Yes** | `http://localhost:3000,http://127.0.0.1:3000` | Comma-separated list of allowed origins. Wildcards (`*`) with credentials are strictly prohibited. |
| `DATABASE_URL` | No | **Yes** | `sqlite:///./guardian.db` (local) or PostgreSQL URL | SQLAlchemy connection string. |
| `GEMINI_API_KEY` | Optional | Optional | Blank or Google AI Studio key | Enables AI-synthesized narrative advisory. If empty, the deterministic rule engine runs seamlessly. |
| `GEMINI_MODEL` | No | No | `gemini-2.0-flash` | Selected Gemini model variant. |

---

## 3. Configuration Security Guardrails

### 3.1. Production Secret Enforcement (`backend/app/config.py`)
In `Settings`, a Pydantic model validator actively inspects `SECRET_KEY` when `ENVIRONMENT == "production"`:
```python
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
```
- In development, developers can bootstrap immediately with default development keys.
- In production, attempting to deploy with the default secret or a weak key crashes the process on startup before exposing tokens.

### 3.2. Generating Production Keys
To generate a secure 256-bit random key for production:
```bash
python -c "import secrets; print(secrets.token_hex(32))"
```

### 3.3. Secure CORS Implementation
The API previously used `allow_origins=["*"]` with `allow_credentials=True`. This violates modern browser security policies and creates cross-origin token leak vectors.
In `backend/app/main.py`, CORS now consumes the explicitly parsed origin list:
```python
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```

### 3.4. AI Rule-Based Fallback
MSME CashFlow Guardian operates as a fully self-contained financial analytics platform without external cloud dependencies:
- If `GEMINI_API_KEY` is not provided, the backend seamlessly routes advisory requests through `RecommendationService`.
- The rule engine evaluates:
  - Cash deficit windows and minimum reserve violations.
  - Receivables concentration and chronic late payers.
  - Upcoming vendor payables due within 7, 15, and 30 days.
- It produces structured tactical advice in the identical JSON format as the AI engine, ensuring zero frontend degradation.

---

## 4. Version Control & Git Hygiene

The `.gitignore` file was verified and updated to prevent any secret or local environment file from being committed:
```gitignore
# Environment and secrets
.env
.env.*
backend/.env
backend/.env.*
!.env.example
!backend/.env.example

# Databases
*.db
*.sqlite
*.sqlite3

# Node & Python
node_modules/
dist/
__pycache__/
.pytest_cache/
```

Both `.env.example` at root and `backend/.env.example` are committed as safe templates with sanitized placeholder values.
