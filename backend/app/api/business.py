from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from app.database import get_db
from app.models.user import User
from app.models.business import Business
from app.schemas.business import BusinessCreate, BusinessUpdate, BusinessResponse
from app.auth import get_current_user

router = APIRouter(prefix="/business", tags=["Business"])

@router.get("", response_model=List[BusinessResponse])
def list_businesses(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    return db.query(Business).filter(Business.user_id == current_user.id).all()

@router.post("", response_model=BusinessResponse)
def create_business(biz_in: BusinessCreate, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    biz = Business(
        user_id=current_user.id,
        name=biz_in.name,
        business_type=biz_in.business_type,
        currency=biz_in.currency,
        opening_cash_balance=biz_in.opening_cash_balance,
        opening_balance_date=biz_in.opening_balance_date,
        minimum_reserve=biz_in.minimum_reserve,
        is_demo=False
    )
    db.add(biz)
    db.commit()
    db.refresh(biz)
    return biz

@router.get("/{id}", response_model=BusinessResponse)
def get_business(id: int, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    biz = db.query(Business).filter(Business.id == id, Business.user_id == current_user.id).first()
    if not biz:
        raise HTTPException(status_code=404, detail="Business not found")
    return biz

@router.put("/{id}", response_model=BusinessResponse)
def update_business(id: int, biz_in: BusinessUpdate, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    biz = db.query(Business).filter(Business.id == id, Business.user_id == current_user.id).first()
    if not biz:
        raise HTTPException(status_code=404, detail="Business not found")
    
    if biz_in.name is not None:
        biz.name = biz_in.name
    if biz_in.business_type is not None:
        biz.business_type = biz_in.business_type
    if biz_in.currency is not None:
        biz.currency = biz_in.currency
    if biz_in.opening_cash_balance is not None:
        biz.opening_cash_balance = biz_in.opening_cash_balance
    if biz_in.opening_balance_date is not None:
        biz.opening_balance_date = biz_in.opening_balance_date
    if biz_in.minimum_reserve is not None:
        biz.minimum_reserve = biz_in.minimum_reserve

    db.commit()
    db.refresh(biz)
    return biz
