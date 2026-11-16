import copy
from decimal import Decimal, ROUND_HALF_UP
from typing import List, Dict, Any, Optional
from datetime import date, timedelta
from app.engine.cashflow_forecast import CashFlowForecastEngine, to_decimal

TWO_PLACES = Decimal('0.01')

class ScenarioSimulator:
    """
    Interactive What-If Financial Stress Simulator.
    Clones baseline inputs in memory, applies hypothetical shocks,
    and recalculates true cash-flow trajectories using the deterministic engine.
    Never alters original database records.
    """

    @classmethod
    def simulate_scenario(
        cls,
        baseline_forecast: Dict[str, Any],
        current_cash_balance: Decimal,
        start_date: date,
        receivable_invoices: List[Any],
        payable_invoices: List[Any],
        customer_scores: Dict[int, Dict[str, Any]],
        scenario_type: str,
        parameters: Optional[Dict[str, Any]] = None,
        recurring_obligations: Optional[List[Dict[str, Any]]] = None,
        minimum_reserve: Decimal = Decimal('100000.00')
    ) -> Dict[str, Any]:
        params = parameters or {}
        
        # In-memory deep copies of invoices
        sim_receivables: List[Dict[str, Any]] = []
        for inv in receivable_invoices:
            inv_dict = {
                "id": getattr(inv, 'id', inv.get('id') if isinstance(inv, dict) else None),
                "customer_id": getattr(inv, 'customer_id', inv.get('customer_id') if isinstance(inv, dict) else None),
                "customer_name": getattr(getattr(inv, 'customer', None), 'name', None) or (inv.get('customer_name') if isinstance(inv, dict) else 'Customer'),
                "invoice_number": getattr(inv, 'invoice_number', inv.get('invoice_number') if isinstance(inv, dict) else ''),
                "total_amount": to_decimal(getattr(inv, 'total_amount', inv.get('total_amount') if isinstance(inv, dict) else 0)),
                "paid_amount": to_decimal(getattr(inv, 'paid_amount', inv.get('paid_amount') if isinstance(inv, dict) else 0)),
                "due_date": getattr(inv, 'due_date', inv.get('due_date') if isinstance(inv, dict) else None),
                "invoice_type": "RECEIVABLE"
            }
            sim_receivables.append(inv_dict)

        sim_payables: List[Dict[str, Any]] = []
        for bill in payable_invoices:
            bill_dict = {
                "id": getattr(bill, 'id', bill.get('id') if isinstance(bill, dict) else None),
                "supplier_id": getattr(bill, 'supplier_id', bill.get('supplier_id') if isinstance(bill, dict) else None),
                "supplier_name": getattr(getattr(bill, 'supplier', None), 'name', None) or (bill.get('supplier_name') if isinstance(bill, dict) else 'Supplier'),
                "invoice_number": getattr(bill, 'invoice_number', bill.get('invoice_number') if isinstance(bill, dict) else ''),
                "total_amount": to_decimal(getattr(bill, 'total_amount', bill.get('total_amount') if isinstance(bill, dict) else 0)),
                "paid_amount": to_decimal(getattr(bill, 'paid_amount', bill.get('paid_amount') if isinstance(bill, dict) else 0)),
                "due_date": getattr(bill, 'due_date', bill.get('due_date') if isinstance(bill, dict) else None),
                "invoice_type": "PAYABLE"
            }
            sim_payables.append(bill_dict)

        sim_recurring = copy.deepcopy(recurring_obligations or [])
        sim_scores = copy.deepcopy(customer_scores)

        scenario_description = ""
        applied_shocks = []

        # Apply specific scenario shock
        if scenario_type == "CUSTOMER_DELAY_15":
            target_cust_id = params.get("customer_id")
            days = 15
            for r in sim_receivables:
                if target_cust_id is None or r["customer_id"] == target_cust_id:
                    if r["due_date"]:
                        r["due_date"] = r["due_date"] + timedelta(days=days)
            scenario_description = f"Delayed customer payment collections by {days} days."
            applied_shocks.append(scenario_description)

        elif scenario_type == "CUSTOMER_DELAY_30":
            target_cust_id = params.get("customer_id")
            days = 30
            for r in sim_receivables:
                if target_cust_id is None or r["customer_id"] == target_cust_id:
                    if r["due_date"]:
                        r["due_date"] = r["due_date"] + timedelta(days=days)
            scenario_description = f"Major customer collections delayed by {days} days beyond due date."
            applied_shocks.append(scenario_description)

        elif scenario_type == "SUPPLIER_HIKE_20":
            target_sup_id = params.get("supplier_id")
            multiplier = Decimal('1.20')
            for p in sim_payables:
                if target_sup_id is None or p["supplier_id"] == target_sup_id:
                    p["total_amount"] = (p["total_amount"] * multiplier).quantize(TWO_PLACES)
            scenario_description = "Supplier payment obligations increased by 20% due to cost inflation."
            applied_shocks.append(scenario_description)

        elif scenario_type == "UNEXPECTED_EXPENSE":
            exp_amount = to_decimal(params.get("amount", 50000.00))
            exp_date_offset = int(params.get("delay_days", 7))
            target_exp_date = start_date + timedelta(days=exp_date_offset)
            sim_recurring.append({
                "date": target_exp_date,
                "ref": "SHOCK-EXP-01",
                "category": "Emergency Outflow",
                "amount": exp_amount,
                "description": f"Unexpected emergency expense of ₹ {exp_amount:,.2f} on {target_exp_date.strftime('%d/%m/%Y')}."
            })
            scenario_description = f"Unexpected capital or breakdown expense of ₹ {exp_amount:,.2f} on day {exp_date_offset}."
            applied_shocks.append(scenario_description)

        elif scenario_type == "PARTIAL_PAYMENT_50":
            target_cust_id = params.get("customer_id")
            for r in sim_receivables:
                if target_cust_id is None or r["customer_id"] == target_cust_id:
                    outstanding = r["total_amount"] - r["paid_amount"]
                    # Customer only pays half of outstanding
                    haircut = (outstanding * Decimal('0.50')).quantize(TWO_PLACES)
                    r["total_amount"] = (r["paid_amount"] + haircut).quantize(TWO_PLACES)
            scenario_description = "Key customer pays only 50% of outstanding dues, withholding remainder."
            applied_shocks.append(scenario_description)

        elif scenario_type == "MULTIPLE_CUSTOMER_DELAYS":
            # 20-day delay on all receivables
            days = int(params.get("delay_days", 20))
            for r in sim_receivables:
                if r["due_date"]:
                    r["due_date"] = r["due_date"] + timedelta(days=days)
            scenario_description = f"Widespread industry credit squeeze: all customer collections delayed by {days} days."
            applied_shocks.append(scenario_description)

        elif scenario_type == "CUSTOM_SHOCK":
            cust_delay = int(params.get("customer_delay_days", 0))
            if cust_delay > 0:
                cust_id = params.get("customer_id")
                for r in sim_receivables:
                    if cust_id is None or r["customer_id"] == cust_id:
                        if r["due_date"]:
                            r["due_date"] = r["due_date"] + timedelta(days=cust_delay)
                applied_shocks.append(f"Customer delay: +{cust_delay} days")

            sup_increase_pct = Decimal(str(params.get("supplier_increase_pct", 0)))
            if sup_increase_pct > Decimal('0.00'):
                mult = Decimal('1.00') + (sup_increase_pct / Decimal('100.00'))
                for p in sim_payables:
                    p["total_amount"] = (p["total_amount"] * mult).quantize(TWO_PLACES)
                applied_shocks.append(f"Supplier obligations increased by {sup_increase_pct}%")

            extra_exp = to_decimal(params.get("unexpected_expense", 0))
            if extra_exp > Decimal('0.00'):
                exp_offset = int(params.get("expense_day_offset", 5))
                t_date = start_date + timedelta(days=exp_offset)
                sim_recurring.append({
                    "date": t_date,
                    "ref": "CUSTOM-EXP",
                    "category": "Custom Expense Shock",
                    "amount": extra_exp,
                    "description": f"Custom expense of ₹ {extra_exp:,.2f}"
                })
                applied_shocks.append(f"Emergency expense of ₹ {extra_exp:,.2f} on day {exp_offset}")
            scenario_description = "Custom composite stress scenario."
        else:
            scenario_description = "Baseline projection (no shocks applied)."

        # Recalculate true forecast with the simulated parameters
        sim_forecast = CashFlowForecastEngine.generate_30_day_forecast(
            current_cash_balance=current_cash_balance,
            start_date=start_date,
            receivable_invoices=sim_receivables,
            payable_invoices=sim_payables,
            customer_scores=sim_scores,
            recurring_obligations=sim_recurring,
            minimum_reserve=minimum_reserve
        )

        # Baseline metrics
        base_lowest = to_decimal(baseline_forecast.get("lowest_projected_balance", 0))
        base_shortage_date = baseline_forecast.get("shortage_date")
        base_closing = to_decimal(baseline_forecast.get("projected_closing_balance", 0))

        # Simulated metrics
        sim_lowest = to_decimal(sim_forecast.get("lowest_projected_balance", 0))
        sim_shortage_date = sim_forecast.get("shortage_date")
        sim_closing = to_decimal(sim_forecast.get("projected_closing_balance", 0))

        # Comparative Impact
        delta_lowest = (sim_lowest - base_lowest).quantize(TWO_PLACES)
        delta_closing = (sim_closing - base_closing).quantize(TWO_PLACES)

        # Additional liquidity needed to prevent deficit or stay above reserve
        min_res = to_decimal(minimum_reserve)
        additional_liquidity_required = Decimal('0.00')
        if sim_lowest < min_res:
            additional_liquidity_required = (min_res - sim_lowest).quantize(TWO_PLACES)

        # Build side-by-side daily timeline comparison for chart
        comparison_timeline = []
        base_daily = baseline_forecast.get("daily_forecast", [])
        sim_daily = sim_forecast.get("daily_forecast", [])

        for b, s in zip(base_daily, sim_daily):
            comparison_timeline.append({
                "date": b["date_str"],
                "iso_date": b["iso_date"],
                "baseline_balance": b["closing_balance"],
                "simulated_balance": s["closing_balance"],
                "variance": (s["closing_balance"] - b["closing_balance"]).quantize(TWO_PLACES),
                "is_stress_breached": s["is_below_reserve"]
            })

        return {
            "scenario_type": scenario_type,
            "scenario_description": scenario_description,
            "applied_shocks": applied_shocks,
            "baseline": {
                "lowest_balance": base_lowest,
                "lowest_balance_date": baseline_forecast.get("lowest_balance_date"),
                "shortage_date": base_shortage_date,
                "closing_balance": base_closing,
                "total_inflows": baseline_forecast.get("total_projected_inflows"),
                "total_outflows": baseline_forecast.get("total_projected_outflows")
            },
            "simulated": {
                "lowest_balance": sim_lowest,
                "lowest_balance_date": sim_forecast.get("lowest_balance_date"),
                "shortage_date": sim_shortage_date,
                "closing_balance": sim_closing,
                "total_inflows": sim_forecast.get("total_projected_inflows"),
                "total_outflows": sim_forecast.get("total_projected_outflows")
            },
            "impact": {
                "delta_lowest_balance": delta_lowest,
                "delta_closing_balance": delta_closing,
                "additional_liquidity_required": additional_liquidity_required,
                "shortage_accelerated_days": (
                    (base_shortage_date - sim_shortage_date).days
                    if (base_shortage_date and sim_shortage_date)
                    else (0 if not sim_shortage_date else None)
                )
            },
            "comparison_timeline": comparison_timeline,
            "simulated_daily_forecast": sim_forecast.get("daily_forecast", [])
        }
