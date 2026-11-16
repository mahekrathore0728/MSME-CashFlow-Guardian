from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from app.database import Base

class AuditLog(Base):
    __tablename__ = "audit_logs"

    id = Column(Integer, primary_key=True, index=True)
    business_id = Column(Integer, ForeignKey("businesses.id", ondelete="CASCADE"), nullable=False, index=True)
    action = Column(String(100), nullable=False) # 'CREATE', 'UPDATE', 'DELETE', 'IMPORT', 'SIMULATION'
    entity_type = Column(String(50), nullable=False) # 'TRANSACTION', 'INVOICE', 'CUSTOMER', 'SUPPLIER'
    entity_id = Column(Integer, nullable=True)
    details = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    business = relationship("Business", back_populates="audit_logs")
