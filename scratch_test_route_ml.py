import logging
import sys
from pathlib import Path

# Setup path
sys.path.append(str(Path(__file__).resolve().parent / "backend"))

from ml_service import predict_travel_time

CITY_STATE_MAP = {
    "Puri": "Odisha",
    "Bhubaneswar": "Odisha",
    "Cuttack": "Odisha",
    "Jamshedpur": "Jharkhand",
    "Kolkata": "West Bengal",
    "Howrah": "West Bengal",
}

def predict_route_transit(trip_shipments, route, total_km):
    AVG_SPEED_KMH = 50.0
    fallback_hrs = round(total_km / AVG_SPEED_KMH, 1)
    
    if not route or total_km <= 0:
        return fallback_hrs, False
    
    first_shipment = trip_shipments[0] if trip_shipments else {}
    
    # Parse departure time
    dep_time_str = first_shipment.get("pickup_time", "09:00")
    try:
        dep_hour = int(str(dep_time_str).split(":")[0])
    except Exception:
        dep_hour = 9
        
    # Parse departure date
    dep_date_str = first_shipment.get("pickup_date", "2026-08-16")
    try:
        from datetime import datetime
        dep_dow = datetime.fromisoformat(str(dep_date_str)).weekday()
    except Exception:
        dep_dow = 0
        
    is_weekend = 1 if dep_dow >= 5 else 0
    is_night = 1 if (dep_hour >= 21 or dep_hour <= 5) else 0
    
    # States
    src_city = route[0] if route else "Bhubaneswar"
    dst_city = route[-1] if route else "Kolkata"
    source_state = CITY_STATE_MAP.get(src_city, "Odisha")
    dest_state = CITY_STATE_MAP.get(dst_city, "West Bengal")
    is_interstate = 1 if source_state != dest_state else 0
    
    # Estimated OSRM time (at ~78.5 km/h highway speed)
    osrm_time = max((total_km / 78.5) * 60.0, 1.0)
    osrm_speed = total_km / (osrm_time / 60.0)
    
    try:
        pred = predict_travel_time(
            osrm_distance=float(total_km),
            osrm_time=float(osrm_time),
            osrm_speed_kmh=float(osrm_speed),
            num_intermediate_stops=len(route),
            is_ftl=1,
            departure_hour=dep_hour,
            departure_dayofweek=dep_dow,
            is_weekend=is_weekend,
            is_night_dispatch=is_night,
            is_interstate=is_interstate,
            source_state=source_state,
            destination_state=dest_state,
        )
        return pred["predicted_hours"], True, pred
    except Exception as e:
        print(f"Fallback triggered: {e}")
        return fallback_hrs, False, None

# Test realistic corridor
trip = [
    {"pickup_location": "Bhubaneswar", "destination": "Kolkata", "pickup_date": "2026-08-16", "pickup_time": "08:00"}
]
route = ["Bhubaneswar", "Cuttack", "Jamshedpur", "Kolkata"]
total_km = 380.0

dur, ml_used, details = predict_route_transit(trip, route, total_km)
print(f"Route: {' -> '.join(route)} ({total_km} km)")
print(f"ML Used: {ml_used}")
print(f"Predicted Duration: {dur} hrs ({details['predicted_minutes']:.1f} mins)")
print(f"50 km/h Heuristic: {total_km / 50.0:.1f} hrs")
