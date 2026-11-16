from sqlalchemy import Column, Integer, String, Numeric, Date, DateTime, ForeignKey
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from app.database import Base

class Invoice(Base):
    __tablename__ = "invoices"

    id = Column(Integer, primary_key=True, index=True)
    business_id = Column(Integer, ForeignKey("businesses.id", ondelete="CASCADE"), nullable=False, index=True)
    customer_id = Column(Integer, ForeignKey("customers.id", ondelete="CASCADE"), nullable=True, index=True)
    supplier_id = Column(Integer, ForeignKey("suppliers.id", ondelete="CASCADE"), nullable=True, index=True)
    invoice_type = Column(String(20), nullable=False) # 'RECEIVABLE' (Customer) or 'PAYABLE' (Supplier)
    invoice_number = Column(String(100), nullable=False)
    issue_date = Column(Date, nullable=False)
    due_date = Column(Date, nullable=False, index=True)
    total_amount = Column(Numeric(15, 2), nullable=False)
    paid_amount = Column(Numeric(15, 2), default=0.00, nullable=False)
    status = Column(String(30), default="UNPAID", nullable=False) # 'UNPAID', 'PARTIALLY_PAID', 'PAID', 'OVERDUE'
    notes = Column(String(500), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    business = relationship("Business", back_populates="invoices")
    customer = relationship("Customer", back_populates="invoices")
    supplier = relationship("Supplier", back_populates="invoices")
    payments = relationship("InvoicePayment", back_populates="invoice", cascade="all, delete-orphan")
