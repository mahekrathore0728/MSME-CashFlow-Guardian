from pydantic import BaseModel
from decimal import Decimal
from datetime import date, datetime
from typing import Optional, List

class InvoicePaymentCreate(BaseModel):
    amount: Decimal
    payment_date: date
    notes: Optional[str] = None

class InvoiceCreate(BaseModel):
    customer_id: Optional[int] = None
    supplier_id: Optional[int] = None
    invoice_type: str # 'RECEIVABLE' or 'PAYABLE'
    invoice_number: str
    issue_date: date
    due_date: date
    total_amount: Decimal
    notes: Optional[str] = None

class InvoiceResponse(BaseModel):
    id: int
    business_id: int
    customer_id: Optional[int] = None
    customer_name: Optional[str] = None
    supplier_id: Optional[int] = None
    supplier_name: Optional[str] = None
    invoice_type: str
    invoice_number: str
    issue_date: date
    due_date: date
    total_amount: Decimal
    paid_amount: Decimal
    outstanding_amount: Decimal
    status: str
    is_overdue: bool
    days_overdue: int
    notes: Optional[str] = None
    created_at: Optional[datetime] = None

    class Config:
        from_attributes = True
