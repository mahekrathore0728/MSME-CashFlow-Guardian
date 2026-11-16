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

class TransactionEngine:
    """
    Deterministic transaction balance and reconciliation engine.
    Uses Python Decimal exclusively to prevent binary floating-point drift.
    """

    @staticmethod
    def calculate_current_balance(
        opening_balance: Decimal,
        transactions: List[Any]
    ) -> Dict[str, Any]:
        """
        Reconciles opening balance with all recorded transactions:
        Current Balance = Opening Balance + Total Inflows - Total Outflows
        """
        op_bal = to_decimal(opening_balance)
        total_inflows = Decimal('0.00')
        total_outflows = Decimal('0.00')
        
        inflow_count = 0
        outflow_count = 0
        
        inflow_by_type: Dict[str, Decimal] = {}
        outflow_by_type: Dict[str, Decimal] = {}

        for tx in transactions:
            amt = to_decimal(getattr(tx, 'amount', tx.get('amount') if isinstance(tx, dict) else 0))
            direction = getattr(tx, 'direction', tx.get('direction') if isinstance(tx, dict) else '')
            tx_type = getattr(tx, 'transaction_type', tx.get('transaction_type') if isinstance(tx, dict) else 'OTHER')
            
            if direction == 'INFLOW':
                total_inflows += amt
                inflow_count += 1
                inflow_by_type[tx_type] = inflow_by_type.get(tx_type, Decimal('0.00')) + amt
            elif direction == 'OUTFLOW':
                total_outflows += amt
                outflow_count += 1
                outflow_by_type[tx_type] = outflow_by_type.get(tx_type, Decimal('0.00')) + amt

        current_balance = (op_bal + total_inflows - total_outflows).quantize(TWO_PLACES, rounding=ROUND_HALF_UP)
        
        # Invariant Verification
        reconciliation_check = (current_balance == (op_bal + total_inflows - total_outflows))

        return {
            "opening_balance": op_bal,
            "total_inflows": total_inflows.quantize(TWO_PLACES),
            "total_outflows": total_outflows.quantize(TWO_PLACES),
            "current_balance": current_balance,
            "net_cashflow": (total_inflows - total_outflows).quantize(TWO_PLACES),
            "inflow_count": inflow_count,
            "outflow_count": outflow_count,
            "inflows_by_type": {k: v.quantize(TWO_PLACES) for k, v in inflow_by_type.items()},
            "outflows_by_type": {k: v.quantize(TWO_PLACES) for k, v in outflow_by_type.items()},
            "is_reconciled": reconciliation_check
        }

    @staticmethod
    def calculate_profit_vs_cash(
        transactions: List[Any],
        invoices: List[Any],
        current_cash_balance: Decimal
    ) -> Dict[str, Any]:
        """
        Calculates Accrual Accounting Profit vs Real Available Cash.
        Explains why a business can be profitable on paper but face cash insolvency.
        
        Accounting Revenue = Invoices issued to customers (billed revenue)
        Accounting Operating Expenses = Supplier bills recorded + Payroll + Rent + Utilities
        Accounting Net Profit = Accounting Revenue - Accounting Expenses
        
        Available Cash = Physical bank balance available to deploy right now.
        """
        billed_revenue = Decimal('0.00')
        uncollected_receivables = Decimal('0.00')
        billed_expenses = Decimal('0.00')
        unpaid_payables = Decimal('0.00')

        for inv in invoices:
            total = to_decimal(getattr(inv, 'total_amount', inv.get('total_amount') if isinstance(inv, dict) else 0))
            paid = to_decimal(getattr(inv, 'paid_amount', inv.get('paid_amount') if isinstance(inv, dict) else 0))
            inv_type = getattr(inv, 'invoice_type', inv.get('invoice_type') if isinstance(inv, dict) else '')
            outstanding = (total - paid).quantize(TWO_PLACES)

            if inv_type == 'RECEIVABLE':
                billed_revenue += total
                uncollected_receivables += max(Decimal('0.00'), outstanding)
            elif inv_type == 'PAYABLE':
                billed_expenses += total
                unpaid_payables += max(Decimal('0.00'), outstanding)

        # Include direct expenses from transactions that weren't invoice-based (like direct payroll or utilities)
        direct_operating_expenses = Decimal('0.00')
        for tx in transactions:
            tx_type = getattr(tx, 'transaction_type', tx.get('transaction_type') if isinstance(tx, dict) else '')
            direction = getattr(tx, 'direction', tx.get('direction') if isinstance(tx, dict) else '')
            amt = to_decimal(getattr(tx, 'amount', tx.get('amount') if isinstance(tx, dict) else 0))
            
            if direction == 'OUTFLOW' and tx_type in ['PAYROLL', 'RENT', 'UTILITIES', 'EXPENSE']:
                direct_operating_expenses += amt

        total_accounting_expenses = (billed_expenses + direct_operating_expenses).quantize(TWO_PLACES)
        accounting_net_profit = (billed_revenue - total_accounting_expenses).quantize(TWO_PLACES)
        available_cash = to_decimal(current_cash_balance)

        difference = (accounting_net_profit - available_cash).quantize(TWO_PLACES)

        # Build clear explanation of the divergence
        explanations = []
        if uncollected_receivables > 0:
            explanations.append(
                f"₹ {uncollected_receivables:,.2f} of recognized revenue is tied up in outstanding customer receivables and has not entered your bank account."
            )
        if unpaid_payables > 0:
            explanations.append(
                f"₹ {unpaid_payables:,.2f} of supplier expenses have been billed but not yet paid, temporarily keeping cash higher."
            )
        if difference > 0:
            conclusion = f"Accounting profit is ₹ {difference:,.2f} higher than available cash. Your business appears profitable, but liquidity is constrained by customer payment delays."
        elif difference < 0:
            conclusion = f"Available cash is ₹ {abs(difference):,.2f} higher than accounting profit, reflecting unearned advance receipts or deferred supplier settlements."
        else:
            conclusion = "Accounting profit and available cash are perfectly aligned."

        return {
            "accounting_revenue": billed_revenue.quantize(TWO_PLACES),
            "total_accounting_expenses": total_accounting_expenses.quantize(TWO_PLACES),
            "accounting_net_profit": accounting_net_profit,
            "available_cash": available_cash,
            "cash_vs_profit_gap": difference,
            "uncollected_receivables": uncollected_receivables,
            "unpaid_payables": unpaid_payables,
            "explanations": explanations,
            "conclusion": conclusion
        }
