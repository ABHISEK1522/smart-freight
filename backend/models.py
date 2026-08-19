from pydantic import BaseModel
from typing import List, Optional, Dict, Any

class ShipmentCreate(BaseModel):
    product: str
    weight: float
    pickup: str
    destination: str
    deadline: str
    temp_min: float
    temp_max: float

class Shipment(ShipmentCreate):
    id: str
    status: str = "Planned"

class ConsolidatedTrip(BaseModel):
    id: str
    shipment_ids: List[str]
    vehicle_type: str
    total_load: float
    route: List[str]
    cost: float
    savings: float
    delay_risk: float
    spoilage_risk: float
    risk_explanations: List[str]

class DashboardMetrics(BaseModel):
    active_shipments: int
    consolidated_trips: int
    estimated_savings: float
    high_risk_shipments: int
    comparison: Dict[str, Any]
