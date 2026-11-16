from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from datetime import date
from typing import Optional

from app.database import get_db
from app.models.business import Business
from app.models.transaction import Transaction
from app.models.invoice import Invoice
from app.models.customer import Customer
from app.api.deps import get_active_business
from app.engine.transaction_engine import TransactionEngine
from app.engine.payment_scoring import PaymentScoringEngine
from app.engine.receivables import ReceivablesEngine
from app.engine.payables import PayablesEngine
from app.engine.cashflow_forecast import CashFlowForecastEngine
from app.engine.liquidity_risk import LiquidityRiskEngine
from app.services.ai_service import AIService

router = APIRouter(prefix="/ai", tags=["AI & Advisory Intelligence"])

@router.get("/insights")
@router.post("/insights")
async def get_ai_insights(
    business: Optional[Business] = Depends(get_active_business),
    db: Session = Depends(get_db)
):
    if not business:
        raise HTTPException(status_code=400, detail="No active business.")

    transactions = db.query(Transaction).filter(Transaction.business_id == business.id).all()
    invoices = db.query(Invoice).filter(Invoice.business_id == business.id).all()
    customers = db.query(Customer).filter(Customer.business_id == business.id).all()

    # 1. Financial summary
    bal_res = TransactionEngine.calculate_current_balance(
        opening_balance=business.opening_cash_balance,
        transactions=transactions
    )
    rec_res = ReceivablesEngine.analyze_receivables(invoices)
    pay_res = PayablesEngine.analyze_payables(invoices)

    cust_scores = {}
    customer_analyses = []
    for c in customers:
        c_invs = [inv for inv in invoices if inv.customer_id == c.id]
        score_data = PaymentScoringEngine.analyze_customer(c.id, c.name, c_invs)
        cust_scores[c.id] = score_data
        customer_analyses.append(score_data)

    rec_invoices = [inv for inv in invoices if inv.invoice_type == "RECEIVABLE"]
    pay_invoices = [inv for inv in invoices if inv.invoice_type == "PAYABLE"]

    forecast = CashFlowForecastEngine.generate_30_day_forecast(
        current_cash_balance=bal_res["current_balance"],
        start_date=date.today(),
        receivable_invoices=rec_invoices,
        payable_invoices=pay_invoices,
        customer_scores=cust_scores,
        minimum_reserve=business.minimum_reserve
    )

    risk_eval = LiquidityRiskEngine.evaluate_risk(forecast)

    summary = {
        "current_cash_balance": bal_res["current_balance"],
        "total_receivables": rec_res["total_outstanding"],
        "total_payables": pay_res["total_outstanding"],
        "risk_status": risk_eval["risk_status"]
    }

    insights = await AIService.generate_financial_insights(
        summary=summary,
        forecast=forecast,
        customer_analyses=customer_analyses,
        payables_analysis=pay_res
    )

    return insights
