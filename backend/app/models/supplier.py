from sqlalchemy import Column, Integer, String, DateTime, ForeignKey
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from app.database import Base

class Supplier(Base):
    __tablename__ = "suppliers"

    id = Column(Integer, primary_key=True, index=True)
    business_id = Column(Integer, ForeignKey("businesses.id", ondelete="CASCADE"), nullable=False, index=True)
    name = Column(String(255), nullable=False)
    category = Column(String(100), default="Raw Materials")
    contact_email = Column(String(255), nullable=True)
    contact_phone = Column(String(50), nullable=True)
    payment_terms_days = Column(Integer, default=30, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    business = relationship("Business", back_populates="suppliers")
    invoices = relationship("Invoice", back_populates="supplier", cascade="all, delete-orphan")
    transactions = relationship("Transaction", back_populates="supplier")
