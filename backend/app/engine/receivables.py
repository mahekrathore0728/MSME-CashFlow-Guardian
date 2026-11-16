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

class ReceivablesEngine:
    """
    Deterministic customer invoice receivables and aging analysis engine.
    Ensures Invoice Amount - Total Payments = Outstanding Amount for every invoice.
    """

    @staticmethod
    def analyze_receivables(
        invoices: List[Any],
        as_of_date: Optional[date] = None
    ) -> Dict[str, Any]:
        ref_date = as_of_date or date.today()
        
        total_receivables = Decimal('0.00')
        total_collected = Decimal('0.00')
        total_outstanding = Decimal('0.00')
        total_overdue = Decimal('0.00')
        
        aging_buckets = {
            "current": Decimal('0.00'),       # Not yet due
            "overdue_1_30": Decimal('0.00'),   # 1-30 days late
            "overdue_31_60": Decimal('0.00'),  # 31-60 days late
            "overdue_61_90": Decimal('0.00'),  # 61-90 days late
            "overdue_90_plus": Decimal('0.00') # 90+ days late
        }
        
        reconciled_invoices = []
        
        for inv in invoices:
            inv_type = getattr(inv, 'invoice_type', inv.get('invoice_type') if isinstance(inv, dict) else 'RECEIVABLE')
            if inv_type != 'RECEIVABLE':
                continue

            inv_id = getattr(inv, 'id', inv.get('id') if isinstance(inv, dict) else None)
            inv_num = getattr(inv, 'invoice_number', inv.get('invoice_number') if isinstance(inv, dict) else '')
            cust_id = getattr(inv, 'customer_id', inv.get('customer_id') if isinstance(inv, dict) else None)
            cust_name = getattr(getattr(inv, 'customer', None), 'name', None) or (inv.get('customer_name') if isinstance(inv, dict) else 'Unknown')
            
            issue_date = getattr(inv, 'issue_date', inv.get('issue_date') if isinstance(inv, dict) else None)
            due_date = getattr(inv, 'due_date', inv.get('due_date') if isinstance(inv, dict) else None)
            
            total_amt = to_decimal(getattr(inv, 'total_amount', inv.get('total_amount') if isinstance(inv, dict) else 0))
            paid_amt = to_decimal(getattr(inv, 'paid_amount', inv.get('paid_amount') if isinstance(inv, dict) else 0))
            
            # Reconciliation Invariant
            outstanding = max(Decimal('0.00'), (total_amt - paid_amt).quantize(TWO_PLACES))
            
            total_receivables += total_amt
            total_collected += paid_amt
            total_outstanding += outstanding
            
            days_overdue = 0
            is_overdue = False
            bucket_key = "current"

            if due_date and due_date < ref_date and outstanding > Decimal('0.00'):
                is_overdue = True
                days_overdue = (ref_date - due_date).days
                total_overdue += outstanding

                if 1 <= days_overdue <= 30:
                    bucket_key = "overdue_1_30"
                elif 31 <= days_overdue <= 60:
                    bucket_key = "overdue_31_60"
                elif 61 <= days_overdue <= 90:
                    bucket_key = "overdue_61_90"
                else:
                    bucket_key = "overdue_90_plus"
            
            if outstanding > Decimal('0.00'):
                aging_buckets[bucket_key] += outstanding

            status = getattr(inv, 'status', inv.get('status') if isinstance(inv, dict) else 'UNPAID')
            if outstanding == Decimal('0.00'):
                status = 'PAID'
            elif is_overdue:
                status = 'OVERDUE'
            elif paid_amt > Decimal('0.00'):
                status = 'PARTIALLY_PAID'
            else:
                status = 'UNPAID'

            reconciled_invoices.append({
                "id": inv_id,
                "invoice_number": inv_num,
                "customer_id": cust_id,
                "customer_name": cust_name,
                "issue_date": issue_date,
                "due_date": due_date,
                "total_amount": total_amt,
                "paid_amount": paid_amt,
                "outstanding_amount": outstanding,
                "is_overdue": is_overdue,
                "days_overdue": days_overdue,
                "status": status,
                "aging_bucket": bucket_key
            })

        return {
            "total_receivables": total_receivables.quantize(TWO_PLACES),
            "total_collected": total_collected.quantize(TWO_PLACES),
            "total_outstanding": total_outstanding.quantize(TWO_PLACES),
            "total_overdue": total_overdue.quantize(TWO_PLACES),
            "aging_buckets": {k: v.quantize(TWO_PLACES) for k, v in aging_buckets.items()},
            "invoices": sorted(reconciled_invoices, key=lambda x: (not x['is_overdue'], x['due_date'] or date.max))
        }
