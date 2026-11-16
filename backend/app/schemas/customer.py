from pydantic import BaseModel
from decimal import Decimal
from datetime import datetime
from typing import Optional, List, Any, Dict

class CustomerCreate(BaseModel):
    name: str
    contact_email: Optional[str] = None
    contact_phone: Optional[str] = None
    payment_terms_days: int = 30

class CustomerUpdate(BaseModel):
    name: Optional[str] = None
    contact_email: Optional[str] = None
    contact_phone: Optional[str] = None
    payment_terms_days: Optional[int] = None

class CustomerResponse(BaseModel):
    id: int
    business_id: int
    name: str
    contact_email: Optional[str] = None
    contact_phone: Optional[str] = None
    payment_terms_days: int
    created_at: Optional[datetime] = None

    class Config:
        from_attributes = True

class CustomerDetailResponse(CustomerResponse):
    total_invoiced: Decimal
    total_collected: Decimal
    total_outstanding: Decimal
    total_overdue: Decimal
    overdue_invoices_count: int
    total_invoices_count: int
    average_delay_days: float
    reliability_score: Optional[float] = None
    risk_tier: str
    risk_label: str
    has_sufficient_history: bool
    message: str
    formula_breakdown: Optional[Dict[str, Any]] = None
    invoices: List[Any] = []
