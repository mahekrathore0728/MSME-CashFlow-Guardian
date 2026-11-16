from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import date
from decimal import Decimal

from app.database import get_db
from app.models.business import Business
from app.models.supplier import Supplier
from app.models.invoice import Invoice
from app.schemas.supplier import SupplierCreate, SupplierUpdate, SupplierResponse, SupplierDetailResponse
from app.api.deps import get_active_business

router = APIRouter(prefix="/suppliers", tags=["Suppliers"])

@router.get("", response_model=List[SupplierDetailResponse])
def get_suppliers(
    business: Optional[Business] = Depends(get_active_business),
    db: Session = Depends(get_db)
):
    if not business:
        return []

    suppliers = db.query(Supplier).filter(Supplier.business_id == business.id).all()
    invoices = db.query(Invoice).filter(Invoice.business_id == business.id, Invoice.invoice_type == "PAYABLE").all()
    today = date.today()

    result = []
    for s in suppliers:
        sup_invs = [inv for inv in invoices if inv.supplier_id == s.id]
        
        total_billed = sum((inv.total_amount for inv in sup_invs), Decimal('0.00'))
        total_settled = sum((inv.paid_amount for inv in sup_invs), Decimal('0.00'))
        total_outstanding = sum((max(Decimal('0.00'), inv.total_amount - inv.paid_amount) for inv in sup_invs), Decimal('0.00'))
        
        total_overdue = Decimal('0.00')
        due_7 = Decimal('0.00')
        due_15 = Decimal('0.00')
        due_30 = Decimal('0.00')

        inv_list = []
        for inv in sup_invs:
            outstanding = max(Decimal('0.00'), inv.total_amount - inv.paid_amount)
            is_overdue = False
            days_overdue = 0
            
            if inv.due_date and outstanding > Decimal('0.00'):
                if inv.due_date < today:
                    is_overdue = True
                    days_overdue = (today - inv.due_date).days
                    total_overdue += outstanding
                else:
                    days_ahead = (inv.due_date - today).days
                    if days_ahead <= 7:
                        due_7 += outstanding
                    if days_ahead <= 15:
                        due_15 += outstanding
                    if days_ahead <= 30:
                        due_30 += outstanding

            inv_list.append({
                "id": inv.id,
                "invoice_number": inv.invoice_number,
                "issue_date": inv.issue_date,
                "due_date": inv.due_date,
                "total_amount": inv.total_amount,
                "paid_amount": inv.paid_amount,
                "outstanding_amount": outstanding,
                "status": inv.status,
                "is_overdue": is_overdue,
                "days_overdue": days_overdue
            })

        result.append(SupplierDetailResponse(
            id=s.id,
            business_id=s.business_id,
            name=s.name,
            category=s.category,
            contact_email=s.contact_email,
            contact_phone=s.contact_phone,
            payment_terms_days=s.payment_terms_days,
            created_at=s.created_at,
            total_billed=total_billed,
            total_settled=total_settled,
            total_outstanding=total_outstanding,
            total_overdue=total_overdue,
            due_next_7_days=due_7,
            due_next_15_days=due_15,
            due_next_30_days=due_30,
            invoices=inv_list
        ))

    return sorted(result, key=lambda x: -x.total_outstanding)

@router.get("/{id}", response_model=SupplierDetailResponse)
def get_supplier_detail(
    id: int,
    business: Optional[Business] = Depends(get_active_business),
    db: Session = Depends(get_db)
):
    if not business:
        raise HTTPException(status_code=400, detail="No active business.")

    supplier = db.query(Supplier).filter(Supplier.id == id, Supplier.business_id == business.id).first()
    if not supplier:
        raise HTTPException(status_code=404, detail="Supplier not found.")

    sup_invs = db.query(Invoice).filter(
        Invoice.business_id == business.id,
        Invoice.supplier_id == supplier.id,
        Invoice.invoice_type == "PAYABLE"
    ).all()
    today = date.today()

    total_billed = sum((inv.total_amount for inv in sup_invs), Decimal('0.00'))
    total_settled = sum((inv.paid_amount for inv in sup_invs), Decimal('0.00'))
    total_outstanding = sum((max(Decimal('0.00'), inv.total_amount - inv.paid_amount) for inv in sup_invs), Decimal('0.00'))

    total_overdue = Decimal('0.00')
    due_7 = Decimal('0.00')
    due_15 = Decimal('0.00')
    due_30 = Decimal('0.00')

    inv_list = []
    for inv in sup_invs:
        outstanding = max(Decimal('0.00'), inv.total_amount - inv.paid_amount)
        is_overdue = False
        days_overdue = 0
        if inv.due_date and outstanding > Decimal('0.00'):
            if inv.due_date < today:
                is_overdue = True
                days_overdue = (today - inv.due_date).days
                total_overdue += outstanding
            else:
                days_ahead = (inv.due_date - today).days
                if days_ahead <= 7:
                    due_7 += outstanding
                if days_ahead <= 15:
                    due_15 += outstanding
                if days_ahead <= 30:
                    due_30 += outstanding

        inv_list.append({
            "id": inv.id,
            "invoice_number": inv.invoice_number,
            "issue_date": inv.issue_date,
            "due_date": inv.due_date,
            "total_amount": inv.total_amount,
            "paid_amount": inv.paid_amount,
            "outstanding_amount": outstanding,
            "status": inv.status,
            "is_overdue": is_overdue,
            "days_overdue": days_overdue
        })

    return SupplierDetailResponse(
        id=supplier.id,
        business_id=supplier.business_id,
        name=supplier.name,
        category=supplier.category,
        contact_email=supplier.contact_email,
        contact_phone=supplier.contact_phone,
        payment_terms_days=supplier.payment_terms_days,
        created_at=supplier.created_at,
        total_billed=total_billed,
        total_settled=total_settled,
        total_outstanding=total_outstanding,
        total_overdue=total_overdue,
        due_next_7_days=due_7,
        due_next_15_days=due_15,
        due_next_30_days=due_30,
        invoices=inv_list
    )

@router.post("", response_model=SupplierResponse)
def create_supplier(
    sup_in: SupplierCreate,
    business: Optional[Business] = Depends(get_active_business),
    db: Session = Depends(get_db)
):
    if not business:
        raise HTTPException(status_code=400, detail="No active business.")

    sup = Supplier(
        business_id=business.id,
        name=sup_in.name,
        category=sup_in.category or "Raw Materials",
        contact_email=sup_in.contact_email,
        contact_phone=sup_in.contact_phone,
        payment_terms_days=sup_in.payment_terms_days
    )
    db.add(sup)
    db.commit()
    db.refresh(sup)
    return sup
