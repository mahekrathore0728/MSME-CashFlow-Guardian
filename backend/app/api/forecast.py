from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from datetime import date, datetime
from typing import Optional, Dict, Any

from app.database import get_db
from app.models.business import Business
from app.models.transaction import Transaction
from app.models.invoice import Invoice
from app.models.customer import Customer
from app.auth import get_current_user
from app.api.deps import get_active_business
from app.engine.transaction_engine import TransactionEngine
from app.engine.payment_scoring import PaymentScoringEngine
from app.engine.cashflow_forecast import CashFlowForecastEngine
from app.engine.liquidity_risk import LiquidityRiskEngine

router = APIRouter(prefix="/forecast", tags=["Forecast"])

@router.get("")
def get_30_day_forecast(
    business: Optional[Business] = Depends(get_active_business),
    db: Session = Depends(get_db)
):
    if not business:
        return {
            "has_business": False,
            "message": "No business configured yet.",
            "forecast": None
        }

    transactions = db.query(Transaction).filter(Transaction.business_id == business.id).all()
    invoices = db.query(Invoice).filter(Invoice.business_id == business.id).all()
    customers = db.query(Customer).filter(Customer.business_id == business.id).all()

    bal_res = TransactionEngine.calculate_current_balance(
        opening_balance=business.opening_cash_balance,
        transactions=transactions
    )
    current_cash = bal_res["current_balance"]

    cust_scores = {}
    for c in customers:
        c_invs = [inv for inv in invoices if inv.customer_id == c.id]
        cust_scores[c.id] = PaymentScoringEngine.analyze_customer(c.id, c.name, c_invs)

    rec_invoices = [inv for inv in invoices if inv.invoice_type == "RECEIVABLE"]
    pay_invoices = [inv for inv in invoices if inv.invoice_type == "PAYABLE"]

    forecast = CashFlowForecastEngine.generate_30_day_forecast(
        current_cash_balance=current_cash,
        start_date=date.today(),
        receivable_invoices=rec_invoices,
        payable_invoices=pay_invoices,
        customer_scores=cust_scores,
        minimum_reserve=business.minimum_reserve
    )

    risk_eval = LiquidityRiskEngine.evaluate_risk(forecast)

    return {
        "has_business": True,
        "business_name": business.name,
        "currency": business.currency,
        "risk_evaluation": risk_eval,
        "forecast": forecast
    }

@router.get("/details/{date_str}")
def get_forecast_date_details(
    date_str: str,
    business: Optional[Business] = Depends(get_active_business),
    db: Session = Depends(get_db)
):
    if not business:
        raise HTTPException(status_code=400, detail="No active business.")

    try:
        target_date = datetime.strptime(date_str, "%Y-%m-%d").date()
    except ValueError:
        try:
            target_date = datetime.strptime(date_str, "%d-%m-%Y").date()
        except ValueError:
            raise HTTPException(status_code=400, detail="Invalid date format. Use YYYY-MM-DD.")

    transactions = db.query(Transaction).filter(Transaction.business_id == business.id).all()
    invoices = db.query(Invoice).filter(Invoice.business_id == business.id).all()
    customers = db.query(Customer).filter(Customer.business_id == business.id).all()

    bal_res = TransactionEngine.calculate_current_balance(
        opening_balance=business.opening_cash_balance,
        transactions=transactions
    )

    cust_scores = {}
    for c in customers:
        c_invs = [inv for inv in invoices if inv.customer_id == c.id]
        cust_scores[c.id] = PaymentScoringEngine.analyze_customer(c.id, c.name, c_invs)

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

    for d in forecast["daily_forecast"]:
        if d["date"] == target_date:
            return {
                "date": d["date_str"],
                "iso_date": d["iso_date"],
                "day_number": d["day_number"],
                "opening_balance": d["opening_balance"],
                "inflows": d["inflows"],
                "outflows": d["outflows"],
                "closing_balance": d["closing_balance"],
                "net_change": d["net_change"],
                "is_below_reserve": d["is_below_reserve"],
                "inflow_items": d["inflow_items"],
                "outflow_items": d["outflow_items"]
            }

    raise HTTPException(status_code=404, detail="Date not in 30-day forecast horizon.")
