from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.user import User
from app.models.business import Business
from app.auth import get_current_user
from app.services.demo_service import DemoService

router = APIRouter(prefix="/demo", tags=["Demo Dataset"])

@router.post("/load")
def load_demo_dataset(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    demo_biz = DemoService.load_demo_data(db=db, user_id=current_user.id)
    return {
        "success": True,
        "business_id": demo_biz.id,
        "business_name": demo_biz.name,
        "message": "Demo data loaded successfully for Sharma & Co. Demo data represents a fictional business and does not contain real financial records."
    }

@router.post("/reset")
def reset_demo_dataset(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    demo_biz = db.query(Business).filter(
        Business.user_id == current_user.id,
        Business.is_demo == True
    ).first()

    if not demo_biz:
        return {"success": False, "message": "No demo business found for current user."}

    DemoService.reset_demo_data(db=db, business_id=demo_biz.id)
    return {
        "success": True,
        "message": "Demo dataset has been safely reset."
    }
