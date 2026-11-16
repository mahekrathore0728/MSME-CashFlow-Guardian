import pytest
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from datetime import date
from decimal import Decimal

from app.database import Base
from app.models.user import User
from app.models.business import Business
from app.schemas.auth import UserRegister, UserLogin
from app.schemas.transaction import TransactionCreate
from app.schemas.customer import CustomerCreate
from app.schemas.supplier import SupplierCreate
from app.schemas.simulation import SimulationRequest

from app.api.auth import register, login
from app.api.business import list_businesses, create_business
from app.api.demo import load_demo_dataset, reset_demo_dataset
from app.api.dashboard import get_dashboard_summary
from app.api.customers import get_customers
from app.api.suppliers import get_suppliers
from app.api.forecast import get_30_day_forecast
from app.api.scenarios import run_simulation
from app.api.health import health_check

# In-memory SQLite for tests
SQLALCHEMY_DATABASE_URL = "sqlite:///:memory:"
engine = create_engine(SQLALCHEMY_DATABASE_URL, connect_args={"check_same_thread": False})
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

@pytest.fixture
def db():
    Base.metadata.create_all(bind=engine)
    session = TestingSessionLocal()
    yield session
    session.close()
    Base.metadata.drop_all(bind=engine)

def test_full_api_workflow(db):
    # 1. Health check
    h = health_check()
    assert h["status"] == "healthy"

    # 2. Register user
    reg_in = UserRegister(
        email="ramesh@sharma.in",
        password="SecurePassword123!",
        full_name="Ramesh Sharma"
    )
    reg_res = register(user_in=reg_in, db=db)
    assert reg_res["access_token"] is not None
    assert reg_res["user"].email == "ramesh@sharma.in"
    user = reg_res["user"]

    # 3. Login user
    log_in = UserLogin(email="ramesh@sharma.in", password="SecurePassword123!")
    log_res = login(login_in=log_in, db=db)
    assert log_res["access_token"] is not None

    # 4. Load Demo Dataset
    demo_res = load_demo_dataset(current_user=user, db=db)
    assert demo_res["success"] is True
    biz_id = demo_res["business_id"]

    biz = db.query(Business).filter(Business.id == biz_id).first()
    assert biz is not None
    assert biz.name == "Sharma & Co."

    # 5. Dashboard Summary
    dash = get_dashboard_summary(business=biz, db=db)
    assert dash["has_business"] is True
    assert dash["metrics"]["current_cash_balance"] > Decimal('0.00')
    assert "profit_vs_cash" in dash
    assert len(dash["cashflow_chart_data"]) == 30

    # 6. Customer Intelligence
    custs = get_customers(business=biz, db=db)
    assert len(custs) == 6
    sharma_traders = next(c for c in custs if c.name == "Sharma Traders")
    assert sharma_traders.reliability_score is not None
    assert sharma_traders.risk_tier in ["LOW", "MODERATE"]
    assert sharma_traders.reliability_score >= 60.0

    # 7. Suppliers List
    sups = get_suppliers(business=biz, db=db)
    assert len(sups) == 4

    # 8. 30-Day Liquidity Forecast
    fc = get_30_day_forecast(business=biz, db=db)
    assert fc["has_business"] is True
    assert len(fc["forecast"]["daily_forecast"]) == 30

    # 9. Scenario Stress Simulation
    sim_req = SimulationRequest(
        scenario_type="CUSTOMER_DELAY_15",
        parameters={"customer_id": sharma_traders.id}
    )
    sim_res = run_simulation(req=sim_req, business=biz, db=db)
    assert "baseline" in sim_res
    assert "simulated" in sim_res
    assert "impact" in sim_res
    assert len(sim_res["comparison_timeline"]) == 30

    # 10. Demo Reset
    reset_res = reset_demo_dataset(current_user=user, db=db)
    assert reset_res["success"] is True

def test_demo_session_endpoint(db):
    from app.api.auth import create_demo_session
    res = create_demo_session(db=db)
    assert "access_token" in res
    assert res["token_type"] == "bearer"
    assert res["user"] is not None
    assert res["user"].email.startswith("demo.")
    
    # Verify the demo business exists and is seeded
    demo_biz = db.query(Business).filter(Business.user_id == res["user"].id, Business.is_demo == True).first()
    assert demo_biz is not None
    assert demo_biz.name == "Sharma & Co."
    assert demo_biz.is_demo is True

def test_business_data_isolation_and_authorization(db):
    from app.api.deps import get_active_business
    from fastapi import HTTPException
    
    # Create User 1 and Business 1
    u1 = User(email="user1@corp.in", hashed_password="hashedpassword1", full_name="User One")
    db.add(u1)
    db.commit()
    db.refresh(u1)
    
    b1 = Business(
        user_id=u1.id,
        name="Corp One",
        business_type="Retail",
        opening_cash_balance=Decimal('100000.00'),
        opening_balance_date=date.today()
    )
    db.add(b1)
    db.commit()
    db.refresh(b1)

    # Create User 2 and Business 2
    u2 = User(email="user2@corp.in", hashed_password="hashedpassword2", full_name="User Two")
    db.add(u2)
    db.commit()
    db.refresh(u2)
    
    b2 = Business(
        user_id=u2.id,
        name="Corp Two",
        business_type="Wholesale",
        opening_cash_balance=Decimal('200000.00'),
        opening_balance_date=date.today()
    )
    db.add(b2)
    db.commit()
    db.refresh(b2)

    # User 1 requesting their own business -> succeeds
    resolved_b1 = get_active_business(x_business_id=str(b1.id), business_id=None, current_user=u1, db=db)
    assert resolved_b1.id == b1.id

    # User 1 requesting User 2's business -> strictly forbidden (403)
    with pytest.raises(HTTPException) as exc_info_403:
        get_active_business(x_business_id=str(b2.id), business_id=None, current_user=u1, db=db)
    assert exc_info_403.value.status_code == 403
    assert "Access denied" in exc_info_403.value.detail

    # User 1 requesting non-existent business -> 404
    with pytest.raises(HTTPException) as exc_info_404:
        get_active_business(x_business_id="999999", business_id=None, current_user=u1, db=db)
    assert exc_info_404.value.status_code == 404

    # User 1 sending malformed header -> 400
    with pytest.raises(HTTPException) as exc_info_400:
        get_active_business(x_business_id="not-an-integer", business_id=None, current_user=u1, db=db)
    assert exc_info_400.value.status_code == 400

    # User 1 without explicit ID -> automatically resolves User 1's business
    default_biz = get_active_business(x_business_id=None, business_id=None, current_user=u1, db=db)
    assert default_biz.id == b1.id

def test_csv_upload_validation_and_size_limits(db):
    from fastapi import HTTPException
    from app.api.transactions import validate_csv_upload_metadata
    from app.services.ingestion_service import IngestionService
    
    # Create test user & business
    u = User(email="uploader@msme.in", hashed_password="hash", full_name="Uploader")
    db.add(u)
    db.commit()
    b = Business(
        user_id=u.id,
        name="Upload Test Biz",
        business_type="Trading",
        opening_cash_balance=Decimal('50000.00'),
        opening_balance_date=date.today()
    )
    db.add(b)
    db.commit()

    # 1. Non-CSV extension test
    with pytest.raises(HTTPException) as exc_info_ext:
        validate_csv_upload_metadata("malicious_script.exe", 1024)
    assert exc_info_ext.value.status_code == 400
    assert "Invalid file type" in exc_info_ext.value.detail

    # 2. Oversized file test (> 5MB)
    with pytest.raises(HTTPException) as exc_info_size:
        validate_csv_upload_metadata("huge_dump.csv", 6 * 1024 * 1024)
    assert exc_info_size.value.status_code == 413
    assert "File too large" in exc_info_size.value.detail

    # 3. Valid CSV metadata passes
    validate_csv_upload_metadata("normal_transactions.CSV", 5000)

    # 4. Ingestion service parses valid CSV stream cleanly
    sample_csv = b"Date,Description,Amount,Direction,Category\n15/05/2026,Client Settlement,15000.00,INFLOW,CUSTOMER_COLLECTION\n"
    preview = IngestionService.parse_and_preview_csv(sample_csv, db=db, business_id=b.id)
    assert preview["total_rows"] == 1
    assert preview["valid_rows"] == 1

def test_production_security_settings_validation():
    from app.config import Settings
    
    # 1. Production with default secret should fail validation
    with pytest.raises(ValueError) as exc_info_default:
        Settings(
            ENVIRONMENT="production",
            SECRET_KEY="msme-guardian-dev-secret-key-change-in-prod-2026"
        )
    assert "Production deployment requires an explicit, cryptographically secure SECRET_KEY" in str(exc_info_default.value)

    # 2. Production with short secret should fail validation
    with pytest.raises(ValueError) as exc_info_short:
        Settings(
            ENVIRONMENT="production",
            SECRET_KEY="insecure-short-key"
        )
    assert "at least 32 characters" in str(exc_info_short.value)

    # 3. Production with proper 32+ character key succeeds
    valid_prod = Settings(
        ENVIRONMENT="production",
        SECRET_KEY="a"*64
    )
    assert valid_prod.ENVIRONMENT == "production"

    # 4. Development mode allows dev default key
    dev_settings = Settings(
        ENVIRONMENT="development",
        SECRET_KEY="msme-guardian-dev-secret-key-change-in-prod-2026"
    )
    assert dev_settings.ENVIRONMENT == "development"

