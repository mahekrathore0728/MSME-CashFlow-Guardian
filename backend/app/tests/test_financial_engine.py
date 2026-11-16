import pytest
from decimal import Decimal
from datetime import date, timedelta
from app.engine.transaction_engine import TransactionEngine
from app.engine.payment_scoring import PaymentScoringEngine
from app.engine.receivables import ReceivablesEngine
from app.engine.payables import PayablesEngine
from app.engine.cashflow_forecast import CashFlowForecastEngine
from app.engine.liquidity_risk import LiquidityRiskEngine
from app.engine.scenario_simulator import ScenarioSimulator

# 1. Opening balance & Transaction Reconciliation Tests
def test_transaction_engine_reconciliation():
    opening = Decimal('500000.00')
    transactions = [
        {"amount": Decimal('150000.00'), "direction": "INFLOW", "transaction_type": "CUSTOMER_COLLECTION"},
        {"amount": Decimal('75000.50'), "direction": "INFLOW", "transaction_type": "INCOME"},
        {"amount": Decimal('120000.00'), "direction": "OUTFLOW", "transaction_type": "SUPPLIER_PAYMENT"},
        {"amount": Decimal('45000.25'), "direction": "OUTFLOW", "transaction_type": "PAYROLL"},
        {"amount": Decimal('20000.00'), "direction": "OUTFLOW", "transaction_type": "RENT"},
    ]
    res = TransactionEngine.calculate_current_balance(opening, transactions)
    
    assert res["is_reconciled"] is True
    assert res["total_inflows"] == Decimal('225000.50')
    assert res["total_outflows"] == Decimal('185000.25')
    assert res["current_balance"] == Decimal('540000.25')
    assert res["net_cashflow"] == Decimal('40000.25')

def test_profit_vs_cash_gap():
    # 5L in sales invoices, 2L collected, 3L pending
    invoices = [
        {"invoice_type": "RECEIVABLE", "total_amount": Decimal('500000.00'), "paid_amount": Decimal('200000.00')},
        {"invoice_type": "PAYABLE", "total_amount": Decimal('150000.00'), "paid_amount": Decimal('150000.00')},
    ]
    transactions = [
        {"amount": Decimal('50000.00'), "direction": "OUTFLOW", "transaction_type": "PAYROLL"}
    ]
    current_cash = Decimal('100000.00')
    
    analysis = TransactionEngine.calculate_profit_vs_cash(transactions, invoices, current_cash)
    
    # Accounting Revenue: 500,000
    # Accounting Expenses: 150,000 (bills) + 50,000 (payroll) = 200,000
    # Net Accounting Profit: 300,000
    # Available Cash: 100,000
    assert analysis["accounting_revenue"] == Decimal('500000.00')
    assert analysis["total_accounting_expenses"] == Decimal('200000.00')
    assert analysis["accounting_net_profit"] == Decimal('300000.00')
    assert analysis["available_cash"] == Decimal('100000.00')
    assert analysis["cash_vs_profit_gap"] == Decimal('200000.00')
    assert analysis["uncollected_receivables"] == Decimal('300000.00')

# 2. Customer Payment Delay & Reliability Scoring Tests
def test_payment_scoring_on_time_customer():
    base_due = date(2026, 1, 15)
    invoices = [
        {
            "invoice_number": "INV-01",
            "total_amount": Decimal('100000.00'),
            "paid_amount": Decimal('100000.00'),
            "due_date": base_due,
            "payments": [{"payment_date": base_due, "amount": Decimal('100000.00')}]
        },
        {
            "invoice_number": "INV-02",
            "total_amount": Decimal('150000.00'),
            "paid_amount": Decimal('150000.00'),
            "due_date": base_due + timedelta(days=30),
            "payments": [{"payment_date": base_due + timedelta(days=28), "amount": Decimal('150000.00')}] # Early by 2 days
        }
    ]
    score_res = PaymentScoringEngine.analyze_customer(1, "Prompt Payer Ltd", invoices, as_of_date=date(2026, 3, 1))
    
    assert score_res["has_sufficient_history"] is True
    assert score_res["reliability_score"] >= Decimal('90.0')
    assert score_res["risk_tier"] == "LOW"
    assert score_res["average_delay_days"] <= 0.0

def test_payment_scoring_chronic_late_customer():
    base_due = date(2026, 1, 1)
    invoices = [
        {
            "invoice_number": "INV-L1",
            "total_amount": Decimal('200000.00'),
            "paid_amount": Decimal('200000.00'),
            "due_date": base_due,
            "payments": [{"payment_date": base_due + timedelta(days=35), "amount": Decimal('200000.00')}] # 35 days late
        },
        {
            "invoice_number": "INV-L2",
            "total_amount": Decimal('300000.00'),
            "paid_amount": Decimal('100000.00'),
            "due_date": base_due + timedelta(days=20),
            "payments": [{"payment_date": base_due + timedelta(days=50), "amount": Decimal('100000.00')}] # 30 days late
        }
    ]
    # As of 2026-03-01, INV-L2 has 200,000 overdue
    score_res = PaymentScoringEngine.analyze_customer(2, "Late Payer Enterprises", invoices, as_of_date=date(2026, 3, 1))
    
    assert score_res["has_sufficient_history"] is True
    assert score_res["reliability_score"] < Decimal('60.0')
    assert score_res["risk_tier"] == "HIGH"
    assert score_res["average_delay_days"] > 25.0
    assert score_res["total_overdue"] == Decimal('200000.00')

def test_payment_scoring_insufficient_history_guard():
    # Only 1 payment record
    invoices = [
        {
            "invoice_number": "INV-NEW",
            "total_amount": Decimal('50000.00'),
            "paid_amount": Decimal('50000.00'),
            "due_date": date(2026, 1, 10),
            "payments": [{"payment_date": date(2026, 1, 10), "amount": Decimal('50000.00')}]
        }
    ]
    score_res = PaymentScoringEngine.analyze_customer(3, "Brand New Customer", invoices)
    assert score_res["has_sufficient_history"] is False
    assert score_res["reliability_score"] is None
    assert "Insufficient payment history" in score_res["message"]

# 3. Receivables & Payables Aging Engine Tests
def test_receivables_aging_buckets():
    today = date(2026, 4, 1)
    invoices = [
        {"invoice_type": "RECEIVABLE", "invoice_number": "INV-CURR", "total_amount": Decimal('100000.00'), "paid_amount": Decimal('0.00'), "due_date": today + timedelta(days=10)},
        {"invoice_type": "RECEIVABLE", "invoice_number": "INV-OV1", "total_amount": Decimal('50000.00'), "paid_amount": Decimal('10000.00'), "due_date": today - timedelta(days=15)},
        {"invoice_type": "RECEIVABLE", "invoice_number": "INV-OV2", "total_amount": Decimal('80000.00'), "paid_amount": Decimal('0.00'), "due_date": today - timedelta(days=45)},
        {"invoice_type": "RECEIVABLE", "invoice_number": "INV-OV3", "total_amount": Decimal('60000.00'), "paid_amount": Decimal('0.00'), "due_date": today - timedelta(days=75)},
        {"invoice_type": "RECEIVABLE", "invoice_number": "INV-OV4", "total_amount": Decimal('90000.00'), "paid_amount": Decimal('0.00'), "due_date": today - timedelta(days=120)},
    ]
    res = ReceivablesEngine.analyze_receivables(invoices, as_of_date=today)
    
    assert res["total_outstanding"] == Decimal('370000.00') # 100k + 40k + 80k + 60k + 90k
    assert res["aging_buckets"]["current"] == Decimal('100000.00')
    assert res["aging_buckets"]["overdue_1_30"] == Decimal('40000.00')
    assert res["aging_buckets"]["overdue_31_60"] == Decimal('80000.00')
    assert res["aging_buckets"]["overdue_61_90"] == Decimal('60000.00')
    assert res["aging_buckets"]["overdue_90_plus"] == Decimal('90000.00')

def test_payables_upcoming_horizons():
    today = date(2026, 4, 1)
    bills = [
        {"invoice_type": "PAYABLE", "invoice_number": "BILL-1", "total_amount": Decimal('50000.00'), "paid_amount": Decimal('0.00'), "due_date": today + timedelta(days=3)}, # within 7
        {"invoice_type": "PAYABLE", "invoice_number": "BILL-2", "total_amount": Decimal('70000.00'), "paid_amount": Decimal('0.00'), "due_date": today + timedelta(days=10)}, # within 15
        {"invoice_type": "PAYABLE", "invoice_number": "BILL-3", "total_amount": Decimal('100000.00'), "paid_amount": Decimal('0.00'), "due_date": today + timedelta(days=25)}, # within 30
        {"invoice_type": "PAYABLE", "invoice_number": "BILL-4", "total_amount": Decimal('30000.00'), "paid_amount": Decimal('0.00'), "due_date": today - timedelta(days=5)}, # overdue
    ]
    res = PayablesEngine.analyze_payables(bills, as_of_date=today)
    
    assert res["total_overdue"] == Decimal('30000.00')
    assert res["due_next_7_days"] == Decimal('50000.00')
    assert res["due_next_15_days"] == Decimal('120000.00') # 50k + 70k
    assert res["due_next_30_days"] == Decimal('220000.00') # 50k + 70k + 100k

# 4. 30-Day Cash Flow Forecast Engine & Invariant Verification
def test_30_day_cashflow_daily_invariants():
    start = date(2026, 5, 1)
    opening_balance = Decimal('300000.00')
    
    receivables = [
        {"customer_id": 1, "customer_name": "Reliable Corp", "total_amount": Decimal('200000.00'), "paid_amount": Decimal('0.00'), "due_date": start + timedelta(days=5)},
        {"customer_id": 2, "customer_name": "Late Guy", "total_amount": Decimal('150000.00'), "paid_amount": Decimal('0.00'), "due_date": start + timedelta(days=8)},
    ]
    payables = [
        {"supplier_id": 1, "supplier_name": "Agro Suppliers", "total_amount": Decimal('250000.00'), "paid_amount": Decimal('0.00'), "due_date": start + timedelta(days=10)},
    ]
    scores = {
        1: {"reliability_score": 92.0, "average_delay_days": 1.0, "risk_tier": "LOW", "has_sufficient_history": True},
        2: {"reliability_score": 65.0, "average_delay_days": 12.0, "risk_tier": "MODERATE", "has_sufficient_history": True},
    }
    recurring = [
        {"date": start + timedelta(days=4), "ref": "PAYROLL", "category": "Payroll", "amount": Decimal('80000.00'), "description": "Monthly salaries"}
    ]
    
    forecast = CashFlowForecastEngine.generate_30_day_forecast(
        current_cash_balance=opening_balance,
        start_date=start,
        receivable_invoices=receivables,
        payable_invoices=payables,
        customer_scores=scores,
        recurring_obligations=recurring,
        minimum_reserve=Decimal('100000.00')
    )
    
    daily = forecast["daily_forecast"]
    assert len(daily) == 30
    
    # Verify daily continuity invariant:
    # Opening_t == Closing_{t-1} and Closing_t == Opening_t + Inflows_t - Outflows_t
    for idx, d in enumerate(daily):
        if idx > 0:
            assert d["opening_balance"] == daily[idx - 1]["closing_balance"]
        assert d["closing_balance"] == (d["opening_balance"] + d["inflows"] - d["outflows"])
        
    # Check overall cumulative invariant:
    # Final closing = initial + total inflows - total outflows
    assert forecast["projected_closing_balance"] == (
        opening_balance + forecast["total_projected_inflows"] - forecast["total_projected_outflows"]
    )

# 5. Liquidity Risk Engine Tests
def test_liquidity_risk_classification():
    # Test critical shortage (< 0)
    critical_data = {
        "lowest_projected_balance": Decimal('-25000.00'),
        "lowest_balance_date": date(2026, 5, 12),
        "minimum_operating_reserve": Decimal('100000.00'),
        "shortage_date": date(2026, 5, 10),
        "days_until_shortage": 9
    }
    crit_eval = LiquidityRiskEngine.evaluate_risk(critical_data)
    assert crit_eval["risk_status"] == "CRITICAL"
    assert "Critical Liquidity Deficit" in crit_eval["risk_explanation"]

    # Test reserve warning (0 to Reserve)
    warning_data = {
        "lowest_projected_balance": Decimal('40000.00'),
        "lowest_balance_date": date(2026, 5, 15),
        "minimum_operating_reserve": Decimal('100000.00'),
        "shortage_date": date(2026, 5, 15),
        "days_until_shortage": 14
    }
    warn_eval = LiquidityRiskEngine.evaluate_risk(warning_data)
    assert warn_eval["risk_status"] == "WARNING"
    assert "Operating Reserve Breach" in warn_eval["severity_label"]

    # Test healthy (>= Reserve)
    healthy_data = {
        "lowest_projected_balance": Decimal('180000.00'),
        "lowest_balance_date": date(2026, 5, 20),
        "minimum_operating_reserve": Decimal('100000.00'),
        "shortage_date": None,
        "days_until_shortage": None
    }
    health_eval = LiquidityRiskEngine.evaluate_risk(healthy_data)
    assert health_eval["risk_status"] == "HEALTHY"

# 6. Scenario Simulator Stress Tests
def test_scenario_simulator_customer_delay():
    start = date(2026, 6, 1)
    opening = Decimal('200000.00')
    receivables = [
        {"customer_id": 10, "customer_name": "Big Buyer", "total_amount": Decimal('300000.00'), "paid_amount": Decimal('0.00'), "due_date": start + timedelta(days=5)}
    ]
    payables = [
        {"supplier_id": 20, "supplier_name": "Heavy Supplier", "total_amount": Decimal('250000.00'), "paid_amount": Decimal('0.00'), "due_date": start + timedelta(days=10)}
    ]
    scores = {
        10: {"reliability_score": 90.0, "average_delay_days": 0.0, "risk_tier": "LOW", "has_sufficient_history": True}
    }
    
    baseline = CashFlowForecastEngine.generate_30_day_forecast(
        current_cash_balance=opening,
        start_date=start,
        receivable_invoices=receivables,
        payable_invoices=payables,
        customer_scores=scores
    )
    
    # In baseline: Day 5 gets +300k, Day 10 pays -250k. Balance stays positive (lowest >= 200k).
    assert baseline["lowest_projected_balance"] >= Decimal('200000.00')

    # Simulate 15-day delay for Big Buyer: Collection shifts to Day 20!
    # On Day 10, payables (-250k) hit while opening is 200k => cash drops to -50,000!
    sim_res = ScenarioSimulator.simulate_scenario(
        baseline_forecast=baseline,
        current_cash_balance=opening,
        start_date=start,
        receivable_invoices=receivables,
        payable_invoices=payables,
        customer_scores=scores,
        scenario_type="CUSTOMER_DELAY_15",
        parameters={"customer_id": 10}
    )
    
    assert sim_res["simulated"]["lowest_balance"] == Decimal('-50000.00')
    assert sim_res["impact"]["delta_lowest_balance"] < Decimal('0.00')
    assert sim_res["impact"]["additional_liquidity_required"] == Decimal('150000.00') # to reach 100k reserve
