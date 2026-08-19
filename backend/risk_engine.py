from typing import List, Tuple, Dict, Any
from mock_data import ROUTE_RELIABILITY, PERISHABILITY_INDEX

def calculate_delay_risk(distance: float, route_cities: List[str], total_weight: float) -> float:
    base = min(distance / 10, 50.0)
    rels = [ROUTE_RELIABILITY.get((route_cities[i], route_cities[i+1]), 0.8) for i in range(len(route_cities)-1)]
    avg_rel = sum(rels) / len(rels) if rels else 0.8
    
    risk = base + (1 - avg_rel) * 100
    
    if total_weight > 4000:
        risk += 10
    elif total_weight > 2000:
        risk += 5
        
    return min(risk, 100.0)

def calculate_spoilage_risk(products: List[str], temp_ranges: List[Tuple[float, float]], journey_hours: float) -> float:
    max_perishability = max([PERISHABILITY_INDEX.get(p, 0.5) for p in products] + [0])
    base = max_perishability * 40
    
    risk = base
    if journey_hours > 12:
        risk += 25
    elif journey_hours > 8:
        risk += 15
        
    if any(t_max < 5.0 for t_min, t_max in temp_ranges):
        risk += 20
        
    return min(risk, 100.0)

def generate_risk_explanations(trip_data: Dict[str, Any]) -> List[str]:
    explanations = []
    dist = trip_data.get("distance", 0)
    if dist > 300:
        explanations.append(f"Long journey of {dist} km increases delay probability.")
    
    route = trip_data.get("route_cities", [])
    if "Kolkata" in route:
        explanations.append("Route via Kolkata has historically higher traffic delays.")
        
    journey_hours = trip_data.get("journey_hours", 0)
    temp_ranges = trip_data.get("temp_ranges", [])
    if journey_hours > 8 and any(t_max < 5 for t_min, t_max in temp_ranges):
        explanations.append("Products require cold chain; journey exceeds 8 hours — cold chain integrity at risk.")
        
    products = trip_data.get("products", [])
    if any("Frozen" in p for p in products):
        explanations.append("Mixed load with frozen items; ensure reefer unit maintains sub-zero temperatures.")
        
    if any(PERISHABILITY_INDEX.get(p, 0) > 0.8 for p in products) and journey_hours > 10:
        explanations.append("High perishability cargo on a long-duration route.")
        
    if not explanations:
        explanations.append("Standard trip with normal conditions.")
        
    return explanations[:4]
