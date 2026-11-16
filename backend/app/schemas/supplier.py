from pydantic import BaseModel
from decimal import Decimal
from datetime import datetime
from typing import Optional, List, Any

class SupplierCreate(BaseModel):
    name: str
    category: Optional[str] = "Raw Materials"
    contact_email: Optional[str] = None
    contact_phone: Optional[str] = None
    payment_terms_days: int = 30

class SupplierUpdate(BaseModel):
    name: Optional[str] = None
    category: Optional[str] = None
    contact_email: Optional[str] = None
    contact_phone: Optional[str] = None
    payment_terms_days: Optional[int] = None

class SupplierResponse(BaseModel):
    id: int
    business_id: int
    name: str
    category: Optional[str] = None
    contact_email: Optional[str] = None
    contact_phone: Optional[str] = None
    payment_terms_days: int
    created_at: Optional[datetime] = None

    class Config:
        from_attributes = True

class SupplierDetailResponse(SupplierResponse):
    total_billed: Decimal
    total_settled: Decimal
    total_outstanding: Decimal
    total_overdue: Decimal
    due_next_7_days: Decimal
    due_next_15_days: Decimal
    due_next_30_days: Decimal
    invoices: List[Any] = []
