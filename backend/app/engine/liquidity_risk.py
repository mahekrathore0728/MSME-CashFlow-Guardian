from decimal import Decimal, ROUND_HALF_UP
from typing import Dict, Any, Optional
from datetime import date

TWO_PLACES = Decimal('0.01')

def to_decimal(val) -> Decimal:
    if val is None:
        return Decimal('0.00')
    if isinstance(val, Decimal):
        return val.quantize(TWO_PLACES, rounding=ROUND_HALF_UP)
    return Decimal(str(val)).quantize(TWO_PLACES, rounding=ROUND_HALF_UP)

class LiquidityRiskEngine:
    """
    Transparent Liquidity Risk Assessment & Reserve Breach Detection.
    Eliminates arbitrary percentage risks in favor of exact dates, balances, and shortfalls.
    """

    @staticmethod
    def evaluate_risk(forecast_result: Dict[str, Any]) -> Dict[str, Any]:
        lowest_balance = to_decimal(forecast_result.get("lowest_projected_balance", 0))
        lowest_date = forecast_result.get("lowest_balance_date")
        min_reserve = to_decimal(forecast_result.get("minimum_operating_reserve", 100000))
        shortage_date = forecast_result.get("shortage_date")
        days_until_shortage = forecast_result.get("days_until_shortage")

        if lowest_balance < Decimal('0.00'):
            status = "CRITICAL"
            severity = "High Liquidity Crisis"
            deficit_amount = abs(lowest_balance)
            explanation = (
                f"Critical Liquidity Deficit: Projected cash balance drops to -₹ {deficit_amount:,.2f} "
                f"on {lowest_date.strftime('%d/%m/%Y') if lowest_date else 'upcoming date'}. "
                f"The business faces an immediate cash shortfall of ₹ {deficit_amount:,.2f} without external financing or accelerated customer collections."
            )
            action_urgency = "IMMEDIATE (Action required within 24-48 hours)"
        elif lowest_balance < min_reserve:
            status = "WARNING"
            severity = "Operating Reserve Breach"
            reserve_gap = (min_reserve - lowest_balance).quantize(TWO_PLACES)
            explanation = (
                f"Liquidity Buffer Warning: Cash balance drops to ₹ {lowest_balance:,.2f} "
                f"on {lowest_date.strftime('%d/%m/%Y') if lowest_date else 'upcoming date'}, "
                f"falling ₹ {reserve_gap:,.2f} below your configured minimum operating reserve of ₹ {min_reserve:,.2f}."
            )
            action_urgency = "HIGH (Action recommended within 7 days)"
        else:
            status = "HEALTHY"
            severity = "Adequate Liquidity"
            cushion = (lowest_balance - min_reserve).quantize(TWO_PLACES)
            explanation = (
                f"Healthy Liquidity: Projected lowest cash balance stays at ₹ {lowest_balance:,.2f} "
                f"on {lowest_date.strftime('%d/%m/%Y') if lowest_date else 'upcoming date'}, "
                f"maintaining a safety buffer of ₹ {cushion:,.2f} above your minimum reserve."
            )
            action_urgency = "NORMAL (Monitor weekly)"

        return {
            "risk_status": status,
            "severity_label": severity,
            "lowest_projected_balance": lowest_balance,
            "lowest_balance_date": lowest_date,
            "minimum_reserve": min_reserve,
            "shortage_date": shortage_date,
            "days_until_shortage": days_until_shortage,
            "action_urgency": action_urgency,
            "risk_explanation": explanation
        }
