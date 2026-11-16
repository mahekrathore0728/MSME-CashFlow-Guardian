from pydantic import BaseModel
from decimal import Decimal
from datetime import date, datetime
from typing import Optional, List

class TransactionCreate(BaseModel):
    transaction_date: date
    amount: Decimal
    direction: str # 'INFLOW' or 'OUTFLOW'
    transaction_type: str # 'INCOME', 'EXPENSE', 'CUSTOMER_COLLECTION', 'SUPPLIER_PAYMENT', 'PAYROLL', 'RENT', 'UTILITIES', 'OTHER'
    customer_id: Optional[int] = None
    supplier_id: Optional[int] = None
    description: str
    payment_mode: Optional[str] = "Bank Transfer"
    reference_number: Optional[str] = None
    category: Optional[str] = None

class TransactionUpdate(BaseModel):
    transaction_date: Optional[date] = None
    amount: Optional[Decimal] = None
    direction: Optional[str] = None
    transaction_type: Optional[str] = None
    customer_id: Optional[int] = None
    supplier_id: Optional[int] = None
    description: Optional[str] = None
    payment_mode: Optional[str] = None
    reference_number: Optional[str] = None
    category: Optional[str] = None

class TransactionResponse(BaseModel):
    id: int
    business_id: int
    transaction_date: date
    amount: Decimal
    direction: str
    transaction_type: str
    customer_id: Optional[int] = None
    customer_name: Optional[str] = None
    supplier_id: Optional[int] = None
    supplier_name: Optional[str] = None
    description: str
    payment_mode: Optional[str] = None
    reference_number: Optional[str] = None
    category: Optional[str] = None
    is_reconciled: bool
    created_at: Optional[datetime] = None

    class Config:
        from_attributes = True

class TransactionImportItem(BaseModel):
    transaction_date: str
    amount: Decimal
    direction: str
    transaction_type: str
    description: str
    reference_number: Optional[str] = None
    payment_mode: Optional[str] = "Bank Transfer"
    selected: bool = True

class TransactionCommitRequest(BaseModel):
    items: List[TransactionImportItem]
