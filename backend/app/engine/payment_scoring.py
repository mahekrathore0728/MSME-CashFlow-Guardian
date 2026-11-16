from decimal import Decimal, ROUND_HALF_UP
from typing import List, Dict, Any, Optional
from datetime import date

TWO_PLACES = Decimal('0.01')

def to_decimal(val) -> Decimal:
    if val is None:
        return Decimal('0.00')
    if isinstance(val, Decimal):
        return val.quantize(TWO_PLACES, rounding=ROUND_HALF_UP)
    return Decimal(str(val)).quantize(TWO_PLACES, rounding=ROUND_HALF_UP)

class PaymentScoringEngine:
    """
    Deterministic Customer Payment Behaviour and Reliability Scoring Engine.
    
    Formula Specifications:
    - Delay Days = Actual Payment Date - Invoice Due Date
      * > 0: Late payment
      * < 0: Early payment
      * = 0: On-time payment
    
    Weights for 0-100 Score:
    1. On-Time Payment Ratio (Weight: 40%): Ratio of payments completed on or before due date.
    2. Average Delay Penalty (Weight: 30%): Scaled penalty where 0 days delay = 100 pts, 30+ days = 0 pts.
    3. Late Payment Frequency (Weight: 15%): Percentage of payments that incurred any delay.
    4. Outstanding Overdue Ratio (Weight: 15%): Current overdue balance as a ratio of total invoiced amount.
    
    Risk Thresholds:
    - 80 to 100: Low Risk
    - 60 to 79: Moderate Risk
    - Below 60: High Risk
    
    Guard Rule:
    Requires at least 2 settled/partial payment records to produce a reliable score.
    If < 2 records, score is None with message:
    'Insufficient payment history to calculate a reliable score.'
    """

    MIN_PAYMENT_RECORDS_REQUIRED = 2
    LOW_RISK_THRESHOLD = 80
    MODERATE_RISK_THRESHOLD = 60

    @classmethod
    def analyze_customer(
        cls,
        customer_id: int,
        customer_name: str,
        invoices: List[Any],
        as_of_date: Optional[date] = None
    ) -> Dict[str, Any]:
        ref_date = as_of_date or date.today()
        
        total_invoiced = Decimal('0.00')
        total_collected = Decimal('0.00')
        total_outstanding = Decimal('0.00')
        total_overdue = Decimal('0.00')
        
        overdue_invoices_count = 0
        total_invoices_count = len(invoices)
        
        # Payment delays collected across settled invoice portions
        delay_records: List[Dict[str, Any]] = []
        
        for inv in invoices:
            total_amt = to_decimal(getattr(inv, 'total_amount', inv.get('total_amount') if isinstance(inv, dict) else 0))
            paid_amt = to_decimal(getattr(inv, 'paid_amount', inv.get('paid_amount') if isinstance(inv, dict) else 0))
            due_date = getattr(inv, 'due_date', inv.get('due_date') if isinstance(inv, dict) else None)
            inv_number = getattr(inv, 'invoice_number', inv.get('invoice_number') if isinstance(inv, dict) else '')
            payments = getattr(inv, 'payments', inv.get('payments', []) if isinstance(inv, dict) else [])

            total_invoiced += total_amt
            total_collected += paid_amt
            outstanding = (total_amt - paid_amt).quantize(TWO_PLACES)
            if outstanding > Decimal('0.00'):
                total_outstanding += outstanding
                if due_date and due_date < ref_date:
                    total_overdue += outstanding
                    overdue_invoices_count += 1

            # Analyze individual payment portions
            for p in payments:
                pay_date = getattr(p, 'payment_date', p.get('payment_date') if isinstance(p, dict) else None)
                pay_amt = to_decimal(getattr(p, 'amount', p.get('amount') if isinstance(p, dict) else 0))
                
                if pay_date and due_date:
                    delay_days = (pay_date - due_date).days
                    delay_records.append({
                        "invoice_number": inv_number,
                        "payment_date": pay_date,
                        "due_date": due_date,
                        "amount": pay_amt,
                        "delay_days": delay_days,
                        "is_late": delay_days > 0,
                        "is_on_time": delay_days <= 0
                    })

        payment_count = len(delay_records)

        # Check sufficiency guard
        if payment_count < cls.MIN_PAYMENT_RECORDS_REQUIRED:
            return {
                "customer_id": customer_id,
                "customer_name": customer_name,
                "has_sufficient_history": False,
                "reliability_score": None,
                "risk_tier": "UNKNOWN",
                "risk_label": "Insufficient Data",
                "message": "Insufficient payment history to calculate a reliable score.",
                "total_invoiced": total_invoiced,
                "total_collected": total_collected,
                "total_outstanding": total_outstanding,
                "total_overdue": total_overdue,
                "overdue_invoices_count": overdue_invoices_count,
                "total_invoices_count": total_invoices_count,
                "average_delay_days": 0.0,
                "payment_records_analyzed": payment_count,
                "delay_records": delay_records,
                "formula_breakdown": None
            }

        # Calculate metrics
        total_delay_days = sum(r["delay_days"] for r in delay_records)
        avg_delay = round(total_delay_days / payment_count, 1)
        on_time_count = sum(1 for r in delay_records if r["is_on_time"])
        late_count = sum(1 for r in delay_records if r["is_late"])
        
        on_time_ratio = on_time_count / payment_count
        late_frequency = late_count / payment_count

        # Component 1: On-Time Ratio (0 - 100), Weight 40%
        c1_on_time = on_time_ratio * 100.0
        
        # Component 2: Average Delay Factor (0 - 100), Weight 30%
        # If avg delay <= 0 (always early/on-time) -> 100
        # If avg delay >= 30 days late -> 0
        if avg_delay <= 0:
            c2_delay = 100.0
        else:
            c2_delay = max(0.0, 100.0 - (avg_delay / 30.0 * 100.0))
            
        # Component 3: Delay Frequency Factor (0 - 100), Weight 15%
        c3_freq = max(0.0, (1.0 - late_frequency) * 100.0)
        
        # Component 4: Overdue Ratio Factor (0 - 100), Weight 15%
        if total_invoiced > Decimal('0.00'):
            overdue_ratio = float(total_overdue / total_invoiced)
            c4_overdue = max(0.0, (1.0 - overdue_ratio) * 100.0)
        else:
            c4_overdue = 100.0

        # Weighted aggregate score
        raw_score = (c1_on_time * 0.40) + (c2_delay * 0.30) + (c3_freq * 0.15) + (c4_overdue * 0.15)
        reliability_score = round(max(0.0, min(100.0, raw_score)), 1)

        # Risk Classification
        if reliability_score >= cls.LOW_RISK_THRESHOLD:
            risk_tier = "LOW"
            risk_label = "Low Risk"
        elif reliability_score >= cls.MODERATE_RISK_THRESHOLD:
            risk_tier = "MODERATE"
            risk_label = "Moderate Risk"
        else:
            risk_tier = "HIGH"
            risk_label = "High Risk"

        return {
            "customer_id": customer_id,
            "customer_name": customer_name,
            "has_sufficient_history": True,
            "reliability_score": reliability_score,
            "risk_tier": risk_tier,
            "risk_label": risk_label,
            "message": f"Reliability score: {reliability_score}/100 ({risk_label}).",
            "total_invoiced": total_invoiced,
            "total_collected": total_collected,
            "total_outstanding": total_outstanding,
            "total_overdue": total_overdue,
            "overdue_invoices_count": overdue_invoices_count,
            "total_invoices_count": total_invoices_count,
            "average_delay_days": avg_delay,
            "payment_records_analyzed": payment_count,
            "delay_records": delay_records,
            "formula_breakdown": {
                "on_time_component": round(c1_on_time * 0.40, 2),
                "delay_component": round(c2_delay * 0.30, 2),
                "frequency_component": round(c3_freq * 0.15, 2),
                "overdue_component": round(c4_overdue * 0.15, 2),
                "weights": {
                    "on_time_weight": 0.40,
                    "avg_delay_weight": 0.30,
                    "delay_frequency_weight": 0.15,
                    "overdue_ratio_weight": 0.15
                }
            }
        }
