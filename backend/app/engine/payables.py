from decimal import Decimal, ROUND_HALF_UP
from typing import List, Dict, Any, Optional
from datetime import date, timedelta

TWO_PLACES = Decimal('0.01')

def to_decimal(val) -> Decimal:
    if val is None:
        return Decimal('0.00')
    if isinstance(val, Decimal):
        return val.quantize(TWO_PLACES, rounding=ROUND_HALF_UP)
    return Decimal(str(val)).quantize(TWO_PLACES, rounding=ROUND_HALF_UP)

class PayablesEngine:
    """
    Deterministic supplier obligations and payables tracker.
    Reconciles bills, upcoming commitments, and overdue vendor payments.
    """

    @staticmethod
    def analyze_payables(
        invoices: List[Any],
        as_of_date: Optional[date] = None
    ) -> Dict[str, Any]:
        ref_date = as_of_date or date.today()
        
        total_payables = Decimal('0.00')
        total_settled = Decimal('0.00')
        total_outstanding = Decimal('0.00')
        total_overdue = Decimal('0.00')
        
        due_next_7_days = Decimal('0.00')
        due_next_15_days = Decimal('0.00')
        due_next_30_days = Decimal('0.00')

        reconciled_bills = []

        for inv in invoices:
            inv_type = getattr(inv, 'invoice_type', inv.get('invoice_type') if isinstance(inv, dict) else 'PAYABLE')
            if inv_type != 'PAYABLE':
                continue

            inv_id = getattr(inv, 'id', inv.get('id') if isinstance(inv, dict) else None)
            inv_num = getattr(inv, 'invoice_number', inv.get('invoice_number') if isinstance(inv, dict) else '')
            sup_id = getattr(inv, 'supplier_id', inv.get('supplier_id') if isinstance(inv, dict) else None)
            sup_name = getattr(getattr(inv, 'supplier', None), 'name', None) or (inv.get('supplier_name') if isinstance(inv, dict) else 'Unknown')
            
            issue_date = getattr(inv, 'issue_date', inv.get('issue_date') if isinstance(inv, dict) else None)
            due_date = getattr(inv, 'due_date', inv.get('due_date') if isinstance(inv, dict) else None)
            
            total_amt = to_decimal(getattr(inv, 'total_amount', inv.get('total_amount') if isinstance(inv, dict) else 0))
            paid_amt = to_decimal(getattr(inv, 'paid_amount', inv.get('paid_amount') if isinstance(inv, dict) else 0))
            
            outstanding = max(Decimal('0.00'), (total_amt - paid_amt).quantize(TWO_PLACES))
            
            total_payables += total_amt
            total_settled += paid_amt
            total_outstanding += outstanding
            
            days_overdue = 0
            is_overdue = False
            days_until_due = 0

            if due_date:
                if due_date < ref_date and outstanding > Decimal('0.00'):
                    is_overdue = True
                    days_overdue = (ref_date - due_date).days
                    total_overdue += outstanding
                elif due_date >= ref_date and outstanding > Decimal('0.00'):
                    days_until_due = (due_date - ref_date).days
                    if days_until_due <= 7:
                        due_next_7_days += outstanding
                    if days_until_due <= 15:
                        due_next_15_days += outstanding
                    if days_until_due <= 30:
                        due_next_30_days += outstanding

            status = getattr(inv, 'status', inv.get('status') if isinstance(inv, dict) else 'UNPAID')
            if outstanding == Decimal('0.00'):
                status = 'PAID'
            elif is_overdue:
                status = 'OVERDUE'
            elif paid_amt > Decimal('0.00'):
                status = 'PARTIALLY_PAID'
            else:
                status = 'UNPAID'

            reconciled_bills.append({
                "id": inv_id,
                "invoice_number": inv_num,
                "supplier_id": sup_id,
                "supplier_name": sup_name,
                "issue_date": issue_date,
                "due_date": due_date,
                "total_amount": total_amt,
                "paid_amount": paid_amt,
                "outstanding_amount": outstanding,
                "is_overdue": is_overdue,
                "days_overdue": days_overdue,
                "days_until_due": days_until_due if not is_overdue else None,
                "status": status
            })

        return {
            "total_payables": total_payables.quantize(TWO_PLACES),
            "total_settled": total_settled.quantize(TWO_PLACES),
            "total_outstanding": total_outstanding.quantize(TWO_PLACES),
            "total_overdue": total_overdue.quantize(TWO_PLACES),
            "due_next_7_days": due_next_7_days.quantize(TWO_PLACES),
            "due_next_15_days": due_next_15_days.quantize(TWO_PLACES),
            "due_next_30_days": due_next_30_days.quantize(TWO_PLACES),
            "bills": sorted(reconciled_bills, key=lambda x: (not x['is_overdue'], x['due_date'] or date.max))
        }
