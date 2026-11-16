import json
import logging
from typing import Dict, Any, List, Optional
from app.config import settings
from app.services.recommendation_service import RecommendationService

logger = logging.getLogger(__name__)

class AIService:
    """
    AI Financial Intelligence & Action Planner powered by Google Gemini.
    Strictly explains backend-calculated financial metrics and generates
    customized, prioritized action plans.
    Falls back to deterministic RecommendationService when API key is unset or unreachable.
    """

    @classmethod
    async def generate_financial_insights(
        cls,
        summary: Dict[str, Any],
        forecast: Dict[str, Any],
        customer_analyses: List[Dict[str, Any]],
        payables_analysis: Dict[str, Any]
    ) -> Dict[str, Any]:
        # Fallback if no API key is provided
        if not settings.GEMINI_API_KEY or settings.GEMINI_API_KEY.strip() == "":
            fallback_res = RecommendationService.generate_recommendations(
                summary, forecast, customer_analyses, payables_analysis
            )
            fallback_res["ai_status"] = "API_KEY_NOT_CONFIGURED"
            fallback_res["note"] = "Operating on deterministic financial rules. Add GEMINI_API_KEY in environment for generative financial commentary."
            return fallback_res

        # Attempt Gemini call
        try:
            from google import genai
            from google.genai import types

            client = genai.Client(api_key=settings.GEMINI_API_KEY)

            # Build structured context payload strictly with backend numbers
            financial_context = {
                "current_cash_balance": str(summary.get("current_cash_balance")),
                "total_receivables": str(summary.get("total_receivables")),
                "total_payables": str(summary.get("total_payables")),
                "projected_lowest_balance": str(forecast.get("lowest_projected_balance")),
                "lowest_balance_date": str(forecast.get("lowest_balance_date")),
                "shortage_date": str(forecast.get("shortage_date")),
                "minimum_operating_reserve": str(forecast.get("minimum_operating_reserve")),
                "risk_status": str(summary.get("risk_status", "WARNING")),
                "customers": [
                    {
                        "name": c.get("customer_name"),
                        "reliability_score": c.get("reliability_score"),
                        "risk_tier": c.get("risk_tier"),
                        "outstanding": str(c.get("total_outstanding")),
                        "overdue": str(c.get("total_overdue")),
                        "average_delay_days": c.get("average_delay_days")
                    }
                    for c in customer_analyses[:8]
                ],
                "payables": {
                    "due_next_7_days": str(payables_analysis.get("due_next_7_days")),
                    "due_next_15_days": str(payables_analysis.get("due_next_15_days")),
                    "total_overdue": str(payables_analysis.get("total_overdue"))
                }
            }

            prompt = f"""
You are the MSME CashFlow Guardian Financial Advisor.
Analyse the following verified financial records calculated by the backend financial engine:

{json.dumps(financial_context, indent=2)}

STRICT RULES:
1. NEVER invent or fabricate balances, dates, scores, or names. Use ONLY the data provided.
2. Clearly explain WHY any liquidity risk exists (e.g. gap between customer collections and supplier due dates).
3. Identify specific customers to follow up with based on overdue amounts and reliability scores.
4. Provide concrete 7-day, 15-day, and 30-day tactical working capital actions.
5. Return strictly valid JSON adhering to the following structure:

{{
  "headline": "Short executive summary of financial health",
  "summary_statement": "Concise paragraph explaining actual cash vs obligations",
  "main_risks": [
    {{
      "severity": "CRITICAL" | "WARNING" | "HEALTHY",
      "title": "Risk title",
      "detail": "Fact-based explanation of the calculated risk",
      "remedy": "Concrete actionable mitigation step"
    }}
  ],
  "customer_followups": [
    {{
      "customer_name": "Customer Name",
      "priority": "HIGH" | "MEDIUM" | "LOW",
      "overdue_amount": 0.0,
      "total_outstanding": 0.0,
      "reliability_score": 0.0,
      "recommended_action": "Specific collection tactic"
    }}
  ],
  "upcoming_obligations": [
    "Fact-based summary of supplier payables or overheads"
  ],
  "tactical_action_plans": {{
    "seven_day_plan": ["action 1", "action 2"],
    "fifteen_day_plan": ["action 1", "action 2"],
    "thirty_day_plan": ["action 1", "action 2"]
  }}
}}
"""

            response = client.models.generate_content(
                model=settings.GEMINI_MODEL,
                contents=prompt,
                config=types.GenerateContentConfig(
                    response_mime_type="application/json",
                    temperature=0.2
                )
            )

            result_json = json.loads(response.text)
            result_json["source"] = "GOOGLE_GEMINI_AI"
            result_json["is_ai_generated"] = True
            result_json["ai_status"] = "SUCCESS"
            return result_json

        except Exception as e:
            logger.warning(f"Gemini API call failed, falling back to deterministic rules: {str(e)}")
            fallback = RecommendationService.generate_recommendations(
                summary, forecast, customer_analyses, payables_analysis
            )
            fallback["ai_status"] = "FALLBACK_TRIGGERED"
            fallback["error_reason"] = str(e)
            return fallback
