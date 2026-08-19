from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from typing import List
import uuid

from models import Shipment, ShipmentCreate, ConsolidatedTrip, DashboardMetrics
from mock_data import MOCK_SHIPMENTS
from optimizer import consolidate_shipments, calculate_separate_cost
from risk_engine import calculate_delay_risk, calculate_spoilage_risk

app = FastAPI(title="Smart Freight API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

shipments_db = MOCK_SHIPMENTS.copy()

@app.get("/api/shipments", response_model=List[Shipment])
def get_shipments():
    return shipments_db

@app.post("/api/shipments", response_model=Shipment)
def add_shipment(shipment: ShipmentCreate):
    new_shipment = shipment.dict()
    new_shipment["id"] = str(uuid.uuid4())
    new_shipment["status"] = "Planned"
    shipments_db.append(new_shipment)
    return new_shipment

@app.get("/api/consolidation", response_model=List[ConsolidatedTrip])
def get_consolidation():
    planned_shipments = [s for s in shipments_db if s["status"] == "Planned"]
    trips = consolidate_shipments(planned_shipments)
    return trips

@app.get("/api/dashboard", response_model=DashboardMetrics)
def get_dashboard():
    active_shipments = sum(1 for s in shipments_db if s["status"] != "Delivered")
    planned_shipments = [s for s in shipments_db if s["status"] == "Planned"]
    trips = consolidate_shipments(planned_shipments)
    
    consolidated_trips = len(trips)
    estimated_savings = sum(t.savings for t in trips)
    high_risk_shipments = sum(1 for t in trips if t.delay_risk > 60 or t.spoilage_risk > 60)
    
    sep_cost = calculate_separate_cost(planned_shipments)
    
    comparison = {
        "separate": {
            "cost": sep_cost,
            "delay_risk": 50.0,
            "spoilage_risk": 50.0,
            "utilization": 40.0
        },
        "recommended": {
            "cost": sum(t.cost for t in trips),
            "delay_risk": sum(t.delay_risk for t in trips) / len(trips) if trips else 0,
            "spoilage_risk": sum(t.spoilage_risk for t in trips) / len(trips) if trips else 0,
            "utilization": 85.0
        }
    }
    
    return DashboardMetrics(
        active_shipments=active_shipments,
        consolidated_trips=consolidated_trips,
        estimated_savings=estimated_savings,
        high_risk_shipments=high_risk_shipments,
        comparison=comparison
    )

@app.get("/api/tracking/{shipment_id}", response_model=Shipment)
def get_tracking(shipment_id: str):
    for s in shipments_db:
        if s["id"] == shipment_id:
            return s
    raise HTTPException(status_code=404, detail="Shipment not found")

@app.patch("/api/tracking/{shipment_id}/advance", response_model=Shipment)
def advance_tracking(shipment_id: str):
    transitions = {
        "Planned": "Picked Up",
        "Picked Up": "In Transit",
        "In Transit": "Delivered",
        "Delivered": "Delivered"
    }
    for s in shipments_db:
        if s["id"] == shipment_id:
            s["status"] = transitions.get(s["status"], s["status"])
            return s
    raise HTTPException(status_code=404, detail="Shipment not found")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
