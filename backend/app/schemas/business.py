from pydantic import BaseModel
from decimal import Decimal
from datetime import date, datetime
from typing import Optional

class BusinessCreate(BaseModel):
    name: str
    business_type: str = "Wholesale Distribution"
    currency: str = "INR"
    opening_cash_balance: Decimal = Decimal('0.00')
    opening_balance_date: date
    minimum_reserve: Decimal = Decimal('100000.00')

class BusinessUpdate(BaseModel):
    name: Optional[str] = None
    business_type: Optional[str] = None
    currency: Optional[str] = None
    opening_cash_balance: Optional[Decimal] = None
    opening_balance_date: Optional[date] = None
    minimum_reserve: Optional[Decimal] = None

class BusinessResponse(BaseModel):
    id: int
    user_id: int
    name: str
    business_type: str
    currency: str
    opening_cash_balance: Decimal
    opening_balance_date: date
    minimum_reserve: Decimal
    is_demo: bool
    created_at: Optional[datetime] = None

    class Config:
        from_attributes = True
