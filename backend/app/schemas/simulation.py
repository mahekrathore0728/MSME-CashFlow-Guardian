from pydantic import BaseModel
from decimal import Decimal
from typing import Optional, Dict, Any

class SimulationRequest(BaseModel):
    scenario_type: str # 'CUSTOMER_DELAY_15', 'CUSTOMER_DELAY_30', 'SUPPLIER_HIKE_20', 'UNEXPECTED_EXPENSE', 'PARTIAL_PAYMENT_50', 'MULTIPLE_CUSTOMER_DELAYS', 'CUSTOM_SHOCK'
    parameters: Optional[Dict[str, Any]] = None
