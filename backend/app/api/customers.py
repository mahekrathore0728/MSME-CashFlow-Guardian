from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import date
from decimal import Decimal

from app.database import get_db
from app.models.business import Business
from app.models.customer import Customer
from app.models.invoice import Invoice
from app.schemas.customer import CustomerCreate, CustomerUpdate, CustomerResponse, CustomerDetailResponse
from app.api.deps import get_active_business
from app.engine.payment_scoring import PaymentScoringEngine

router = APIRouter(prefix="/customers", tags=["Customers"])

@router.get("", response_model=List[CustomerDetailResponse])
def get_customers(
    business: Optional[Business] = Depends(get_active_business),
    db: Session = Depends(get_db)
):
    if not business:
        return []

    customers = db.query(Customer).filter(Customer.business_id == business.id).all()
    invoices = db.query(Invoice).filter(Invoice.business_id == business.id, Invoice.invoice_type == "RECEIVABLE").all()

    result = []
    for c in customers:
        cust_invs = [inv for inv in invoices if inv.customer_id == c.id]
        analysis = PaymentScoringEngine.analyze_customer(c.id, c.name, cust_invs, as_of_date=date.today())

        inv_list = [
            {
                "id": inv.id,
                "invoice_number": inv.invoice_number,
                "issue_date": inv.issue_date,
                "due_date": inv.due_date,
                "total_amount": inv.total_amount,
                "paid_amount": inv.paid_amount,
                "outstanding_amount": max(Decimal('0.00'), inv.total_amount - inv.paid_amount),
                "status": inv.status,
                "is_overdue": inv.due_date < date.today() and (inv.total_amount - inv.paid_amount) > Decimal('0.00')
            }
            for inv in cust_invs
        ]

        result.append(CustomerDetailResponse(
            id=c.id,
            business_id=c.business_id,
            name=c.name,
            contact_email=c.contact_email,
            contact_phone=c.contact_phone,
            payment_terms_days=c.payment_terms_days,
            created_at=c.created_at,
            total_invoiced=analysis["total_invoiced"],
            total_collected=analysis["total_collected"],
            total_outstanding=analysis["total_outstanding"],
            total_overdue=analysis["total_overdue"],
            overdue_invoices_count=analysis["overdue_invoices_count"],
            total_invoices_count=analysis["total_invoices_count"],
            average_delay_days=analysis["average_delay_days"],
            reliability_score=analysis["reliability_score"],
            risk_tier=analysis["risk_tier"],
            risk_label=analysis["risk_label"],
            has_sufficient_history=analysis["has_sufficient_history"],
            message=analysis["message"],
            formula_breakdown=analysis.get("formula_breakdown"),
            invoices=inv_list
        ))

    return sorted(result, key=lambda x: (x.risk_tier != "HIGH", -x.total_outstanding))

@router.get("/{id}", response_model=CustomerDetailResponse)
def get_customer_detail(
    id: int,
    business: Optional[Business] = Depends(get_active_business),
    db: Session = Depends(get_db)
):
    if not business:
        raise HTTPException(status_code=400, detail="No active business.")

    customer = db.query(Customer).filter(Customer.id == id, Customer.business_id == business.id).first()
    if not customer:
        raise HTTPException(status_code=404, detail="Customer not found.")

    cust_invs = db.query(Invoice).filter(
        Invoice.business_id == business.id,
        Invoice.customer_id == customer.id,
        Invoice.invoice_type == "RECEIVABLE"
    ).all()

    analysis = PaymentScoringEngine.analyze_customer(customer.id, customer.name, cust_invs, as_of_date=date.today())

    inv_list = [
        {
            "id": inv.id,
            "invoice_number": inv.invoice_number,
            "issue_date": inv.issue_date,
            "due_date": inv.due_date,
            "total_amount": inv.total_amount,
            "paid_amount": inv.paid_amount,
            "outstanding_amount": max(Decimal('0.00'), inv.total_amount - inv.paid_amount),
            "status": inv.status,
            "is_overdue": inv.due_date < date.today() and (inv.total_amount - inv.paid_amount) > Decimal('0.00')
        }
        for inv in cust_invs
    ]

    return CustomerDetailResponse(
        id=customer.id,
        business_id=customer.business_id,
        name=customer.name,
        contact_email=customer.contact_email,
        contact_phone=customer.contact_phone,
        payment_terms_days=customer.payment_terms_days,
        created_at=customer.created_at,
        total_invoiced=analysis["total_invoiced"],
        total_collected=analysis["total_collected"],
        total_outstanding=analysis["total_outstanding"],
        total_overdue=analysis["total_overdue"],
        overdue_invoices_count=analysis["overdue_invoices_count"],
        total_invoices_count=analysis["total_invoices_count"],
        average_delay_days=analysis["average_delay_days"],
        reliability_score=analysis["reliability_score"],
        risk_tier=analysis["risk_tier"],
        risk_label=analysis["risk_label"],
        has_sufficient_history=analysis["has_sufficient_history"],
        message=analysis["message"],
        formula_breakdown=analysis.get("formula_breakdown"),
        invoices=inv_list
    )

@router.post("", response_model=CustomerResponse)
def create_customer(
    cust_in: CustomerCreate,
    business: Optional[Business] = Depends(get_active_business),
    db: Session = Depends(get_db)
):
    if not business:
        raise HTTPException(status_code=400, detail="No active business.")

    cust = Customer(
        business_id=business.id,
        name=cust_in.name,
        contact_email=cust_in.contact_email,
        contact_phone=cust_in.contact_phone,
        payment_terms_days=cust_in.payment_terms_days
    )
    db.add(cust)
    db.commit()
    db.refresh(cust)
    return cust
