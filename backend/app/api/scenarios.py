from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from datetime import date
from typing import Optional

from app.database import get_db
from app.models.business import Business
from app.models.transaction import Transaction
from app.models.invoice import Invoice
from app.models.customer import Customer
from app.schemas.simulation import SimulationRequest
from app.api.deps import get_active_business
from app.engine.transaction_engine import TransactionEngine
from app.engine.payment_scoring import PaymentScoringEngine
from app.engine.cashflow_forecast import CashFlowForecastEngine
from app.engine.scenario_simulator import ScenarioSimulator

router = APIRouter(prefix="/scenarios", tags=["Scenarios & Stress Simulation"])

@router.post("/simulate")
def run_simulation(
    req: SimulationRequest,
    business: Optional[Business] = Depends(get_active_business),
    db: Session = Depends(get_db)
):
    if not business:
        raise HTTPException(status_code=400, detail="No active business.")

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

    # 1. Baseline 30-day forecast
    baseline = CashFlowForecastEngine.generate_30_day_forecast(
        current_cash_balance=current_cash,
        start_date=date.today(),
        receivable_invoices=rec_invoices,
        payable_invoices=pay_invoices,
        customer_scores=cust_scores,
        minimum_reserve=business.minimum_reserve
    )

    # 2. Run non-destructive scenario simulation
    sim_result = ScenarioSimulator.simulate_scenario(
        baseline_forecast=baseline,
        current_cash_balance=current_cash,
        start_date=date.today(),
        receivable_invoices=rec_invoices,
        payable_invoices=pay_invoices,
        customer_scores=cust_scores,
        scenario_type=req.scenario_type,
        parameters=req.parameters,
        minimum_reserve=business.minimum_reserve
    )

    return sim_result
