import uuid
from typing import List, Dict, Any
from models import ConsolidatedTrip
from mock_data import DISTANCE_MATRIX
from risk_engine import calculate_delay_risk, calculate_spoilage_risk, generate_risk_explanations

VEHICLES = [
    {"name": "Mini Van", "capacity": 500, "cost_per_km": 15},
    {"name": "Tempo", "capacity": 1500, "cost_per_km": 25},
    {"name": "Reefer Truck", "capacity": 3000, "cost_per_km": 40},
    {"name": "Open Truck", "capacity": 5000, "cost_per_km": 22},
]

def are_cities_close(city1: str, city2: str) -> bool:
    if city1 == city2:
        return True
    dist = DISTANCE_MATRIX.get((city1, city2), 9999)
    return dist <= 50

def is_temp_compatible(t_min1: float, t_max1: float, t_min2: float, t_max2: float) -> bool:
    return not (t_max1 + 2 < t_min2 or t_max2 + 2 < t_min1)

def get_distance(route: List[str]) -> float:
    dist = 0.0
    for i in range(len(route) - 1):
        dist += DISTANCE_MATRIX.get((route[i], route[i+1]), 100)
    return dist

def select_vehicle(weight: float, needs_reefer: bool) -> Dict[str, Any]:
    for v in VEHICLES:
        if v["capacity"] >= weight:
            if needs_reefer and v["name"] != "Reefer Truck":
                continue
            return v
    return VEHICLES[2] if needs_reefer else VEHICLES[3]

def calculate_separate_cost(shipments: List[Dict[str, Any]]) -> float:
    total_cost = 0.0
    for s in shipments:
        dist = get_distance([s["pickup"], s["destination"]])
        needs_reefer = s["temp_max"] < 10.0
        v = select_vehicle(s["weight"], needs_reefer)
        total_cost += dist * v["cost_per_km"]
    return total_cost

def consolidate_shipments(shipments: List[Dict[str, Any]]) -> List[ConsolidatedTrip]:
    groups: Dict[str, List[Dict]] = {}
    for s in shipments:
        dest = s["destination"]
        found = False
        for g_dest in groups:
            if are_cities_close(dest, g_dest):
                groups[g_dest].append(s)
                found = True
                break
        if not found:
            groups[dest] = [s]

    trips = []
    
    for dest, group_shipments in groups.items():
        sub_groups: List[List[Dict]] = []
        for s in group_shipments:
            added = False
            for sg in sub_groups:
                compatible = all(is_temp_compatible(s["temp_min"], s["temp_max"], x["temp_min"], x["temp_max"]) for x in sg)
                if compatible:
                    sg.append(s)
                    added = True
                    break
            if not added:
                sub_groups.append([s])
                
        for sg in sub_groups:
            if not sg: continue
            
            total_weight = sum(s["weight"] for s in sg)
            needs_reefer = any(s["temp_max"] < 10.0 for s in sg)
            v = select_vehicle(total_weight, needs_reefer)
            
            pickups = list(set([s["pickup"] for s in sg]))
            route = pickups + [dest]
            
            dist = get_distance(route)
            cost = dist * v["cost_per_km"]
            
            sep_cost = calculate_separate_cost(sg)
            savings = sep_cost - cost
            
            delay_risk = calculate_delay_risk(dist, route, total_weight)
            spoilage_risk = calculate_spoilage_risk([s["product"] for s in sg], [(s["temp_min"], s["temp_max"]) for s in sg], dist / 40)
            
            trip_data = {
                "distance": dist,
                "route_cities": route,
                "total_weight": total_weight,
                "products": [s["product"] for s in sg],
                "temp_ranges": [(s["temp_min"], s["temp_max"]) for s in sg],
                "journey_hours": dist / 40
            }
            risk_exps = generate_risk_explanations(trip_data)
            
            trip = ConsolidatedTrip(
                id=str(uuid.uuid4()),
                shipment_ids=[s["id"] for s in sg],
                vehicle_type=v["name"],
                total_load=total_weight,
                route=route,
                cost=cost,
                savings=savings,
                delay_risk=delay_risk,
                spoilage_risk=spoilage_risk,
                risk_explanations=risk_exps
            )
            trips.append(trip)
            
    return trips
