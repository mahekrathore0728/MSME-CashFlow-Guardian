from decimal import Decimal, ROUND_HALF_UP
from typing import List, Dict, Any, Optional
from datetime import date, timedelta
from app.engine.payment_scoring import PaymentScoringEngine

TWO_PLACES = Decimal('0.01')

def to_decimal(val) -> Decimal:
    if val is None:
        return Decimal('0.00')
    if isinstance(val, Decimal):
        return val.quantize(TWO_PLACES, rounding=ROUND_HALF_UP)
    return Decimal(str(val)).quantize(TWO_PLACES, rounding=ROUND_HALF_UP)

class CashFlowForecastEngine:
    """
    30-Day Forward Daily Cash Flow Forecasting Engine.
    
    Formula:
    Closing Balance_t = Opening Balance_t + Inflows_t - Outflows_t
    Opening Balance_t = Closing Balance_{t-1}
    
    Item Status Standards:
    - CONFIRMED: Definite obligations or scheduled incoming bank advice.
    - EXPECTED: Modelled collections based on invoice due date + historical customer delay days.
    - UNCERTAIN: High-risk customer dues (score < 60 or overdue > 45 days).
                 NOTE: Excluded from guaranteed daily cash balances to protect against liquidity shocks!
    - OVERDUE: Invoices past contractual due dates.
    """

    FORECAST_DAYS = 30

    @classmethod
    def generate_30_day_forecast(
        cls,
        current_cash_balance: Decimal,
        start_date: date,
        receivable_invoices: List[Any],
        payable_invoices: List[Any],
        customer_scores: Dict[int, Dict[str, Any]],
        recurring_obligations: Optional[List[Dict[str, Any]]] = None,
        minimum_reserve: Decimal = Decimal('100000.00')
    ) -> Dict[str, Any]:
        cur_balance = to_decimal(current_cash_balance)
        min_reserve = to_decimal(minimum_reserve)
        
        # Prepare 30 day daily buckets
        daily_records: List[Dict[str, Any]] = []
        forecast_dates = [start_date + timedelta(days=i) for i in range(cls.FORECAST_DAYS)]
        
        # Maps for quick daily lookup
        day_inflows: Dict[date, List[Dict[str, Any]]] = {d: [] for d in forecast_dates}
        day_outflows: Dict[date, List[Dict[str, Any]]] = {d: [] for d in forecast_dates}
        uncertain_collections: List[Dict[str, Any]] = []

        # 1. Process Receivable Invoices (Inflows)
        for inv in receivable_invoices:
            total_amt = to_decimal(getattr(inv, 'total_amount', inv.get('total_amount') if isinstance(inv, dict) else 0))
            paid_amt = to_decimal(getattr(inv, 'paid_amount', inv.get('paid_amount') if isinstance(inv, dict) else 0))
            outstanding = max(Decimal('0.00'), (total_amt - paid_amt).quantize(TWO_PLACES))
            
            if outstanding <= Decimal('0.00'):
                continue # fully paid

            due_date = getattr(inv, 'due_date', inv.get('due_date') if isinstance(inv, dict) else None)
            cust_id = getattr(inv, 'customer_id', inv.get('customer_id') if isinstance(inv, dict) else None)
            cust_name = getattr(getattr(inv, 'customer', None), 'name', None) or (inv.get('customer_name') if isinstance(inv, dict) else 'Customer')
            inv_num = getattr(inv, 'invoice_number', inv.get('invoice_number') if isinstance(inv, dict) else '')

            if not due_date:
                continue

            cust_profile = customer_scores.get(cust_id, {})
            score = cust_profile.get('reliability_score')
            avg_delay = cust_profile.get('average_delay_days', 0.0)
            risk_tier = cust_profile.get('risk_tier', 'UNKNOWN')

            # Determine expected payment date
            delay_offset = max(0, int(round(avg_delay)))
            expected_date = due_date + timedelta(days=delay_offset)

            # Categorize status
            is_overdue = due_date < start_date
            
            if is_overdue and (start_date - due_date).days > 45:
                # Highly overdue -> UNCERTAIN, do not treat as guaranteed inflow
                uncertain_collections.append({
                    "invoice_number": inv_num,
                    "customer_name": cust_name,
                    "amount": outstanding,
                    "due_date": due_date,
                    "expected_date": expected_date,
                    "status": "UNCERTAIN",
                    "reason": f"Severely overdue by {(start_date - due_date).days} days. Excluded from guaranteed liquidity.",
                    "reliability_score": score
                })
                continue
            elif risk_tier == 'HIGH':
                # High risk customer -> UNCERTAIN
                uncertain_collections.append({
                    "invoice_number": inv_num,
                    "customer_name": cust_name,
                    "amount": outstanding,
                    "due_date": due_date,
                    "expected_date": expected_date,
                    "status": "UNCERTAIN",
                    "reason": f"Customer reliability score is {score}/100 (High Risk). Marked uncertain to protect cashflow.",
                    "reliability_score": score
                })
                continue

            # If expected date is in past (e.g. slight delay already passed), push to next 2-3 business days
            target_date = expected_date
            if target_date < start_date:
                target_date = start_date + timedelta(days=2) # realistic follow-up collection expectation

            # Record if inside 30-day window
            if target_date in day_inflows:
                day_inflows[target_date].append({
                    "id": getattr(inv, 'id', inv.get('id') if isinstance(inv, dict) else None),
                    "invoice_number": inv_num,
                    "entity_name": cust_name,
                    "entity_type": "CUSTOMER",
                    "amount": outstanding,
                    "due_date": due_date,
                    "expected_date": target_date,
                    "status": "CONFIRMED" if cust_profile.get('has_sufficient_history') and score >= 85 else "EXPECTED",
                    "assumptions": f"Based on due date {due_date.strftime('%d/%m/%Y')} + historical delay of {delay_offset} days."
                })

        # 2. Process Payable Invoices (Outflows)
        for bill in payable_invoices:
            total_amt = to_decimal(getattr(bill, 'total_amount', bill.get('total_amount') if isinstance(bill, dict) else 0))
            paid_amt = to_decimal(getattr(bill, 'paid_amount', bill.get('paid_amount') if isinstance(bill, dict) else 0))
            outstanding = max(Decimal('0.00'), (total_amt - paid_amt).quantize(TWO_PLACES))
            
            if outstanding <= Decimal('0.00'):
                continue

            due_date = getattr(bill, 'due_date', bill.get('due_date') if isinstance(bill, dict) else None)
            sup_name = getattr(getattr(bill, 'supplier', None), 'name', None) or (bill.get('supplier_name') if isinstance(bill, dict) else 'Supplier')
            inv_num = getattr(bill, 'invoice_number', bill.get('invoice_number') if isinstance(bill, dict) else '')

            if not due_date:
                continue

            # For contractual payables, never silently shift dates.
            # If already overdue as of start_date, obligate on start_date immediately!
            target_date = due_date if due_date >= start_date else start_date

            if target_date in day_outflows:
                day_outflows[target_date].append({
                    "id": getattr(bill, 'id', bill.get('id') if isinstance(bill, dict) else None),
                    "invoice_number": inv_num,
                    "entity_name": sup_name,
                    "entity_type": "SUPPLIER",
                    "amount": outstanding,
                    "due_date": due_date,
                    "expected_date": target_date,
                    "status": "CONFIRMED",
                    "assumptions": f"Contractual due date {due_date.strftime('%d/%m/%Y')}" if due_date >= start_date else f"OVERDUE obligation defaulted to immediate settlement on {start_date.strftime('%d/%m/%Y')}"
                })

        # 3. Add Recurring Operational Obligations (Payroll, Rent, Utilities)
        if recurring_obligations:
            for ro in recurring_obligations:
                ro_date = ro.get('date')
                if ro_date in day_outflows:
                    day_outflows[ro_date].append({
                        "id": None,
                        "invoice_number": ro.get('ref', 'OP-SCHEDULE'),
                        "entity_name": ro.get('category', 'Operational Expense'),
                        "entity_type": "OPERATING_EXPENSE",
                        "amount": to_decimal(ro.get('amount', 0)),
                        "due_date": ro_date,
                        "expected_date": ro_date,
                        "status": "CONFIRMED",
                        "assumptions": ro.get('description', 'Scheduled recurring business overhead')
                    })

        # 4. Compute Daily Closing Balance Progression
        running_opening_balance = cur_balance
        lowest_projected_balance = cur_balance
        lowest_balance_date = start_date
        shortage_date: Optional[date] = None
        shortage_amount = Decimal('0.00')

        total_30_day_inflows = Decimal('0.00')
        total_30_day_outflows = Decimal('0.00')

        for d in forecast_dates:
            inflows_list = day_inflows[d]
            outflows_list = day_outflows[d]

            daily_inflows = sum((item['amount'] for item in inflows_list), Decimal('0.00')).quantize(TWO_PLACES)
            daily_outflows = sum((item['amount'] for item in outflows_list), Decimal('0.00')).quantize(TWO_PLACES)

            daily_closing = (running_opening_balance + daily_inflows - daily_outflows).quantize(TWO_PLACES)

            total_30_day_inflows += daily_inflows
            total_30_day_outflows += daily_outflows

            is_below_zero = daily_closing < Decimal('0.00')
            is_below_reserve = daily_closing < min_reserve

            if daily_closing < lowest_projected_balance:
                lowest_projected_balance = daily_closing
                lowest_balance_date = d

            if is_below_reserve and shortage_date is None:
                shortage_date = d
                shortage_amount = (min_reserve - daily_closing).quantize(TWO_PLACES)

            daily_records.append({
                "date": d,
                "date_str": d.strftime("%d/%m/%Y"),
                "iso_date": d.isoformat(),
                "day_number": (d - start_date).days + 1,
                "opening_balance": running_opening_balance,
                "inflows": daily_inflows,
                "outflows": daily_outflows,
                "closing_balance": daily_closing,
                "net_change": (daily_inflows - daily_outflows).quantize(TWO_PLACES),
                "is_below_reserve": is_below_reserve,
                "is_below_zero": is_below_zero,
                "inflow_items": inflows_list,
                "outflow_items": outflows_list
            })

            # Roll forward
            running_opening_balance = daily_closing

        return {
            "start_date": start_date,
            "end_date": forecast_dates[-1],
            "initial_cash_balance": cur_balance,
            "minimum_operating_reserve": min_reserve,
            "total_projected_inflows": total_30_day_inflows.quantize(TWO_PLACES),
            "total_projected_outflows": total_30_day_outflows.quantize(TWO_PLACES),
            "projected_closing_balance": running_opening_balance.quantize(TWO_PLACES),
            "lowest_projected_balance": lowest_projected_balance.quantize(TWO_PLACES),
            "lowest_balance_date": lowest_balance_date,
            "shortage_date": shortage_date,
            "shortage_amount": shortage_amount,
            "days_until_shortage": (shortage_date - start_date).days if shortage_date else None,
            "daily_forecast": daily_records,
            "uncertain_collections": uncertain_collections,
            "forecast_assumptions": [
                "Expected collections incorporate customer-specific historical payment delay days.",
                "High-risk customer dues and invoices overdue > 45 days are excluded from guaranteed cash balance.",
                "Supplier obligations are scheduled on contractual due dates without date shifting.",
                "Past-due supplier obligations are assumed settled immediately on the start date.",
                f"Minimum operating reserve threshold is set at ₹ {min_reserve:,.2f}."
            ]
        }
