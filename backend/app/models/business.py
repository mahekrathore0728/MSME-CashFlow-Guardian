from sqlalchemy import Column, Integer, String, Numeric, Date, Boolean, DateTime, ForeignKey
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from app.database import Base

class Business(Base):
    __tablename__ = "businesses"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    name = Column(String(255), nullable=False)
    business_type = Column(String(100), default="Wholesale Distribution")
    currency = Column(String(10), default="INR")
    opening_cash_balance = Column(Numeric(15, 2), default=0.00, nullable=False)
    opening_balance_date = Column(Date, nullable=False)
    minimum_reserve = Column(Numeric(15, 2), default=100000.00, nullable=False)
    is_demo = Column(Boolean, default=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    owner = relationship("User", back_populates="businesses")
    customers = relationship("Customer", back_populates="business", cascade="all, delete-orphan")
    suppliers = relationship("Supplier", back_populates="business", cascade="all, delete-orphan")
    transactions = relationship("Transaction", back_populates="business", cascade="all, delete-orphan")
    invoices = relationship("Invoice", back_populates="business", cascade="all, delete-orphan")
    audit_logs = relationship("AuditLog", back_populates="business", cascade="all, delete-orphan")
