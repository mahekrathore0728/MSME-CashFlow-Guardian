from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from datetime import date, timedelta
from decimal import Decimal
from typing import Dict, Any, Optional

from app.database import get_db
from app.models.user import User
from app.models.business import Business
from app.models.transaction import Transaction
from app.models.invoice import Invoice
from app.models.customer import Customer
from app.models.supplier import Supplier
from app.auth import get_current_user
from app.api.deps import get_active_business
from app.engine.transaction_engine import TransactionEngine, to_decimal
from app.engine.payment_scoring import PaymentScoringEngine
from app.engine.receivables import ReceivablesEngine
from app.engine.payables import PayablesEngine
from app.engine.cashflow_forecast import CashFlowForecastEngine
from app.engine.liquidity_risk import LiquidityRiskEngine

router = APIRouter(prefix="/dashboard", tags=["Dashboard"])

@router.get("/summary")
def get_dashboard_summary(
    business: Optional[Business] = Depends(get_active_business),
    db: Session = Depends(get_db)
):
    if not business:
        return {
            "has_business": False,
            "message": "No business configured yet. Complete business setup to view financial intelligence.",
            "metrics": None
        }

    # Fetch transactions and invoices
    transactions = db.query(Transaction).filter(Transaction.business_id == business.id).order_by(Transaction.transaction_date.desc()).all()
    invoices = db.query(Invoice).filter(Invoice.business_id == business.id).all()
    customers = db.query(Customer).filter(Customer.business_id == business.id).all()
    suppliers = db.query(Supplier).filter(Supplier.business_id == business.id).all()

    # 1. Current Cash Balance (Reconciled from Opening Balance + Inflows - Outflows)
    bal_analysis = TransactionEngine.calculate_current_balance(
        opening_balance=business.opening_cash_balance,
        transactions=transactions
    )
    current_cash = bal_analysis["current_balance"]

    # 2. Receivables & Payables
    rec_analysis = ReceivablesEngine.analyze_receivables(invoices)
    pay_analysis = PayablesEngine.analyze_payables(invoices)

    # 3. Customer Scoring
    cust_scores = {}
    high_risk_customers = []
    moderate_risk_customers = []
    low_risk_customers = []

    for c in customers:
        cust_invoices = [inv for inv in invoices if inv.customer_id == c.id]
        score_data = PaymentScoringEngine.analyze_customer(c.id, c.name, cust_invoices)
        cust_scores[c.id] = score_data
        
        if score_data["risk_tier"] == "HIGH":
            high_risk_customers.append(score_data)
        elif score_data["risk_tier"] == "MODERATE":
            moderate_risk_customers.append(score_data)
        elif score_data["risk_tier"] == "LOW":
            low_risk_customers.append(score_data)

    # 4. 30-Day Liquidity Forecast
    rec_invoices = [inv for inv in invoices if inv.invoice_type == "RECEIVABLE"]
    pay_invoices = [inv for inv in invoices if inv.invoice_type == "PAYABLE"]

    forecast_res = CashFlowForecastEngine.generate_30_day_forecast(
        current_cash_balance=current_cash,
        start_date=date.today(),
        receivable_invoices=rec_invoices,
        payable_invoices=pay_invoices,
        customer_scores=cust_scores,
        minimum_reserve=business.minimum_reserve
    )

    # 5. Liquidity Risk Assessment
    risk_res = LiquidityRiskEngine.evaluate_risk(forecast_res)

    # 6. Accounting Profit vs Available Cash Analysis
    profit_vs_cash = TransactionEngine.calculate_profit_vs_cash(
        transactions=transactions,
        invoices=invoices,
        current_cash_balance=current_cash
    )

    # 7. Financial Alerts List
    alerts = []
    if risk_res["risk_status"] == "CRITICAL":
        alerts.append({
            "type": "CRITICAL",
            "title": "Immediate Liquidity Deficit Alert",
            "message": risk_res["risk_explanation"],
            "urgency": risk_res["action_urgency"]
        })
    elif risk_res["risk_status"] == "WARNING":
        alerts.append({
            "type": "WARNING",
            "title": "Operating Reserve Breach Alert",
            "message": risk_res["risk_explanation"],
            "urgency": risk_res["action_urgency"]
        })

    if rec_analysis["total_overdue"] > Decimal('0.00'):
        alerts.append({
            "type": "WARNING",
            "title": "Overdue Customer Receivables",
            "message": f"₹ {rec_analysis['total_overdue']:,.2f} is currently overdue from customers. Accelerating collection on these accounts will restore liquidity buffers.",
            "urgency": "Review debtor list"
        })

    if pay_analysis["total_overdue"] > Decimal('0.00'):
        alerts.append({
            "type": "CRITICAL",
            "title": "Past-Due Vendor Obligations",
            "message": f"₹ {pay_analysis['total_overdue']:,.2f} in supplier bills has crossed contractual due dates.",
            "urgency": "Immediate payment or terms extension"
        })

    # Recent Transactions for dashboard preview (last 6)
    recent_txs = [
        {
            "id": t.id,
            "date": t.transaction_date.strftime("%d/%m/%Y"),
            "description": t.description,
            "amount": t.amount,
            "direction": t.direction,
            "type": t.transaction_type,
            "payment_mode": t.payment_mode
        }
        for t in transactions[:6]
    ]

    return {
        "has_business": True,
        "business": {
            "id": business.id,
            "name": business.name,
            "business_type": business.business_type,
            "currency": business.currency,
            "is_demo": business.is_demo,
            "minimum_reserve": business.minimum_reserve
        },
        "metrics": {
            "current_cash_balance": current_cash,
            "total_receivables": rec_analysis["total_outstanding"],
            "total_overdue_receivables": rec_analysis["total_overdue"],
            "total_payables": pay_analysis["total_outstanding"],
            "total_overdue_payables": pay_analysis["total_overdue"],
            "expected_30_day_inflows": forecast_res["total_projected_inflows"],
            "expected_30_day_outflows": forecast_res["total_projected_outflows"],
            "projected_lowest_balance": forecast_res["lowest_projected_balance"],
            "lowest_balance_date": forecast_res["lowest_balance_date"],
            "shortage_date": forecast_res["shortage_date"],
            "days_until_shortage": forecast_res["days_until_shortage"],
            "liquidity_risk_status": risk_res["risk_status"],
            "severity_label": risk_res["severity_label"],
            "risk_explanation": risk_res["risk_explanation"]
        },
        "profit_vs_cash": profit_vs_cash,
        "cashflow_chart_data": [
            {
                "date": d["date_str"],
                "day": d["day_number"],
                "closing_balance": d["closing_balance"],
                "inflows": d["inflows"],
                "outflows": d["outflows"],
                "minimum_reserve": business.minimum_reserve,
                "is_below_reserve": d["is_below_reserve"]
            }
            for d in forecast_res["daily_forecast"]
        ],
        "receivables_aging": rec_analysis["aging_buckets"],
        "customer_risk_summary": {
            "high_risk_count": len(high_risk_customers),
            "moderate_risk_count": len(moderate_risk_customers),
            "low_risk_count": len(low_risk_customers),
            "high_risk_customers": high_risk_customers
        },
        "payables_summary": {
            "due_next_7_days": pay_analysis["due_next_7_days"],
            "due_next_15_days": pay_analysis["due_next_15_days"],
            "due_next_30_days": pay_analysis["due_next_30_days"],
            "total_overdue": pay_analysis["total_overdue"],
            "upcoming_bills": pay_analysis["bills"][:5]
        },
        "recent_transactions": recent_txs,
        "alerts": alerts
    }
