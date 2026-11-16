import secrets
from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.user import User
from app.models.business import Business
from app.schemas.auth import UserRegister, UserLogin, TokenResponse, UserResponse
from app.auth import get_password_hash, verify_password, create_access_token, get_current_user
from app.services.demo_service import DemoService

router = APIRouter(prefix="/auth", tags=["Authentication"])

@router.post("/register", response_model=TokenResponse)
def register(user_in: UserRegister, db: Session = Depends(get_db)):
    existing = db.query(User).filter(User.email == user_in.email).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="An account with this email already exists."
        )

    user = User(
        email=user_in.email,
        hashed_password=get_password_hash(user_in.password),
        full_name=user_in.full_name
    )
    db.add(user)
    db.commit()
    db.refresh(user)

    token = create_access_token(data={"sub": user.email})
    return {
        "access_token": token,
        "token_type": "bearer",
        "user": user
    }

@router.post("/login", response_model=TokenResponse)
def login(login_in: UserLogin, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == login_in.email).first()
    if not user or not verify_password(login_in.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password."
        )

    token = create_access_token(data={"sub": user.email})
    return {
        "access_token": token,
        "token_type": "bearer",
        "user": user
    }

@router.post("/demo-session", response_model=TokenResponse)
def create_demo_session(db: Session = Depends(get_db)):
    """
    Securely provisions or authenticates an isolated demo user session in the backend.
    Eliminates hardcoded plaintext credentials from client-side code.
    Ensures the Sharma & Co. fictional dataset is initialized and tied to this demo user.
    """
    demo_email = "demo.sandbox@cashflowguardian.internal"
    
    # Retrieve or securely initialize demo user
    demo_user = db.query(User).filter(User.email == demo_email).first()
    if not demo_user:
        # Generate a strong cryptographically random internal password
        random_secret = secrets.token_urlsafe(32)
        demo_user = User(
            email=demo_email,
            hashed_password=get_password_hash(random_secret),
            full_name="Sharma & Co. (Demo Account)"
        )
        db.add(demo_user)
        db.commit()
        db.refresh(demo_user)

    # Ensure demo business and fictional data are initialized for this user
    demo_biz = db.query(Business).filter(
        Business.user_id == demo_user.id,
        Business.is_demo == True
    ).first()
    
    if not demo_biz:
        DemoService.load_demo_data(db=db, user_id=demo_user.id)

    token = create_access_token(data={"sub": demo_user.email})
    return {
        "access_token": token,
        "token_type": "bearer",
        "user": demo_user
    }

@router.get("/me", response_model=UserResponse)
def get_current_user_profile(current_user: User = Depends(get_current_user)):
    return current_user
