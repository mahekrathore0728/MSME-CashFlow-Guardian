from sqlalchemy import Column, Integer, String, Numeric, Date, Boolean, DateTime, ForeignKey
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from app.database import Base

class Transaction(Base):
    __tablename__ = "transactions"

    id = Column(Integer, primary_key=True, index=True)
    business_id = Column(Integer, ForeignKey("businesses.id", ondelete="CASCADE"), nullable=False, index=True)
    transaction_date = Column(Date, nullable=False, index=True)
    amount = Column(Numeric(15, 2), nullable=False) # positive number
    direction = Column(String(20), nullable=False) # 'INFLOW' or 'OUTFLOW'
    transaction_type = Column(String(50), nullable=False) # 'INCOME', 'EXPENSE', 'CUSTOMER_COLLECTION', 'SUPPLIER_PAYMENT', 'PAYROLL', 'RENT', 'UTILITIES', 'OTHER'
    customer_id = Column(Integer, ForeignKey("customers.id", ondelete="SET NULL"), nullable=True, index=True)
    supplier_id = Column(Integer, ForeignKey("suppliers.id", ondelete="SET NULL"), nullable=True, index=True)
    description = Column(String(500), nullable=False)
    payment_mode = Column(String(50), default="Bank Transfer") # 'Bank Transfer', 'UPI', 'Cheque', 'Cash', 'NEFT/RTGS'
    reference_number = Column(String(100), nullable=True) # UTR or Cheque no.
    category = Column(String(100), nullable=True)
    is_reconciled = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    business = relationship("Business", back_populates="transactions")
    customer = relationship("Customer", back_populates="transactions")
    supplier = relationship("Supplier", back_populates="transactions")
    invoice_payments = relationship("InvoicePayment", back_populates="transaction")
