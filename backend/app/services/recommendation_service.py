from decimal import Decimal
from typing import Dict, Any, List
from datetime import date
from app.engine.transaction_engine import to_decimal

class RecommendationService:
    """
    Deterministic Financial Rule Advisory Engine.
    Operates 100% locally and offline without external dependencies or API keys.
    Generates actionable 7-day, 15-day, and 30-day working capital tactical playbooks.
    """

    @classmethod
    def generate_recommendations(
        cls,
        summary: Dict[str, Any],
        forecast: Dict[str, Any],
        customer_analyses: List[Dict[str, Any]],
        payables_analysis: Dict[str, Any]
    ) -> Dict[str, Any]:
        cash_balance = to_decimal(summary.get("current_cash_balance", 0))
        lowest_balance = to_decimal(forecast.get("lowest_projected_balance", 0))
        min_reserve = to_decimal(forecast.get("minimum_operating_reserve", 100000))
        shortage_date = forecast.get("shortage_date")
        days_until_shortage = forecast.get("days_until_shortage")

        # 1. Main Financial Risks
        risks = []
        if lowest_balance < Decimal('0.00'):
            risks.append({
                "severity": "CRITICAL",
                "title": f"Projected Cash Deficit of ₹ {abs(lowest_balance):,.2f}",
                "detail": f"Your bank account will dip into a negative balance on {forecast.get('lowest_balance_date', 'upcoming date')} due to a bunching of supplier dues before expected customer collections arrive.",
                "remedy": "Immediate collection acceleration on overdue accounts or temporary vendor payment rescheduling required."
            })
        elif lowest_balance < min_reserve:
            reserve_gap = (min_reserve - lowest_balance)
            risks.append({
                "severity": "WARNING",
                "title": f"Operating Buffer Breach of ₹ {reserve_gap:,.2f}",
                "detail": f"Projected cash drops to ₹ {lowest_balance:,.2f}, below your required safety buffer of ₹ {min_reserve:,.2f} on {forecast.get('lowest_balance_date', 'upcoming date')}.",
                "remedy": "Prioritize follow-ups with customers who have pending dues within the next 10 days."
            })
        else:
            risks.append({
                "severity": "HEALTHY",
                "title": "Comfortable Liquidity Cushion",
                "detail": f"Cash position is projected to remain at least ₹ {(lowest_balance - min_reserve):,.2f} above your minimum reserve across the next 30 days.",
                "remedy": "Maintain current collection cadence and monitor high-volume customer accounts."
            })

        # 2. Customers Requiring Urgent Follow-up
        customer_followups = []
        for cust in customer_analyses:
            score = cust.get("reliability_score")
            overdue = to_decimal(cust.get("total_overdue", 0))
            outstanding = to_decimal(cust.get("total_outstanding", 0))
            name = cust.get("customer_name")
            
            if overdue > Decimal('0.00'):
                customer_followups.append({
                    "customer_name": name,
                    "priority": "HIGH",
                    "overdue_amount": overdue,
                    "total_outstanding": outstanding,
                    "reliability_score": score,
                    "recommended_action": f"Issue immediate demand notice for overdue balance of ₹ {overdue:,.2f}. Place temporary hold on fresh dispatches."
                })
            elif score is not None and score < 70 and outstanding > Decimal('0.00'):
                customer_followups.append({
                    "customer_name": name,
                    "priority": "MEDIUM",
                    "overdue_amount": Decimal('0.00'),
                    "total_outstanding": outstanding,
                    "reliability_score": score,
                    "recommended_action": f"Contact accounts team 5 days ahead of due date to confirm RTGS scheduling for ₹ {outstanding:,.2f}."
                })

        # 3. Upcoming Obligations
        obligations = []
        due_7 = to_decimal(payables_analysis.get("due_next_7_days", 0))
        due_15 = to_decimal(payables_analysis.get("due_next_15_days", 0))
        overdue_pay = to_decimal(payables_analysis.get("total_overdue", 0))

        if overdue_pay > Decimal('0.00'):
            obligations.append(f"₹ {overdue_pay:,.2f} in past-due vendor payables requires immediate settlement or communication to preserve trade credit.")
        if due_7 > Decimal('0.00'):
            obligations.append(f"₹ {due_7:,.2f} in supplier bills maturing within the next 7 calendar days.")
        if due_15 > due_7:
            obligations.append(f"An additional ₹ {(due_15 - due_7):,.2f} maturing in days 8 to 15.")

        # 4. Action Plans (7-day, 15-day, 30-day)
        action_plan_7d = [
            "Send formal payment reminders with attached statements of account to all overdue customers.",
            "Verify bank credit advice for receivables due this week.",
            "Schedule payment runs for critical freight and primary raw material vendors."
        ]
        if lowest_balance < min_reserve:
            action_plan_7d.insert(0, "Initiate phone follow-ups with top 2 overdue debtors to secure immediate partial settlements.")

        action_plan_15d = [
            "Reconcile customer ledgers and issue credit notes for any contested quality or price differences.",
            "Negotiate 10-day staggered settlement terms on major upcoming supplier invoices.",
            "Review non-essential operational expenditure before the mid-month payroll cycle."
        ]

        action_plan_30d = [
            "Review credit limits for customers with reliability scores below 65.",
            "Establish 2% early payment discounts (cash discount terms) for fast-paying trade accounts.",
            "Re-assess minimum operating reserve in light of seasonal working capital cycle."
        ]

        return {
            "source": "DETERMINISTIC_RULES_ENGINE",
            "is_ai_generated": False,
            "headline": "Working Capital & Liquidity Action Blueprint",
            "summary_statement": (
                f"Currently holding ₹ {cash_balance:,.2f} in cash with a 30-day projected lowest balance of "
                f"₹ {lowest_balance:,.2f}. "
                + ("A liquidity deficit is projected on " + str(forecast.get('lowest_balance_date')) if lowest_balance < Decimal('0.00') else "Liquidity is currently viable.")
            ),
            "main_risks": risks,
            "customer_followups": sorted(customer_followups, key=lambda x: (x["priority"] != "HIGH", -x["total_outstanding"])),
            "upcoming_obligations": obligations,
            "tactical_action_plans": {
                "seven_day_plan": action_plan_7d,
                "fifteen_day_plan": action_plan_15d,
                "thirty_day_plan": action_plan_30d
            }
        }
