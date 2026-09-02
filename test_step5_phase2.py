"""
Test Suite for Step 5 Phase 2: ML-Powered Delivery-Window Feasibility & Consolidation
=====================================================================================
Comprehensive tests for:
1. ML ETA before deadline -> Accepted
2. ML ETA after deadline -> Rejected
3. Multi-shipment deadline feasibility (both must pass)
4. Multi-stop progressive deadline check (first passes, second fails -> rejected)
5. ML failure fallback to 50 km/h
6. Cold-chain temperature compatibility enforcement
7. Vehicle capacity enforcement
8. Cost & savings calculations
9. ML duration fed into risk scoring
10. Single-shipment optimization flow
"""

import os
import sys
import unittest
from datetime import datetime, timedelta
from unittest.mock import patch

import database
from main import (
    AVG_SPEED_KMH,
    Trip,
    _assess_risk,
    _build_route,
    _build_trips,
    _is_compatible_with_trip,
    _is_trip_deadline_feasible,
)


class TestStep5Phase2MLFeasibility(unittest.TestCase):

    def setUp(self):
        database.init_db()
        self.departure_str = "2026-08-16T08:00:00"

    def test_1_ml_eta_before_deadline_accepted(self):
        """Test 1: ML ETA arrives comfortably before deadline -> Consolidation accepted."""
        shipment_a = {
            "id": "shp-sla-1",
            "pickup_location": "Bhubaneswar",
            "destination": "Kolkata",
            "pickup_date": "2026-08-16",
            "pickup_time": "08:00",
            "weight_kg": 1000,
            "delivery_deadline": "2026-08-17T12:00:00",
        }
        shipment_b = {
            "id": "shp-sla-2",
            "pickup_location": "Cuttack",
            "destination": "Kolkata",
            "pickup_date": "2026-08-16",
            "pickup_time": "08:00",
            "weight_kg": 1200,
            "delivery_deadline": "2026-08-17T18:00:00",
        }

        is_compat = _is_compatible_with_trip(shipment_b, [shipment_a], current_load=1000.0, vehicle_capacity=5000.0)
        self.assertTrue(is_compat, "Should accept consolidation when all shipments arrive well before deadline")

    def test_2_ml_eta_after_deadline_rejected(self):
        """Test 2: ML ETA arrives after deadline -> Candidate consolidation rejected."""
        shipment_a = {
            "id": "shp-sla-early",
            "pickup_location": "Bhubaneswar",
            "destination": "Kolkata",
            "pickup_date": "2026-08-16",
            "pickup_time": "08:00",
            "weight_kg": 1000,
            "delivery_deadline": "2026-08-17T18:00:00",
        }
        shipment_b_tight = {
            "id": "shp-sla-tight",
            "pickup_location": "Cuttack",
            "destination": "Kolkata",
            "pickup_date": "2026-08-16",
            "pickup_time": "08:00",
            "weight_kg": 1200,
            "delivery_deadline": "2026-08-16T12:00:00",  # Only 4 hrs allotted!
        }

        is_compat = _is_compatible_with_trip(shipment_b_tight, [shipment_a], current_load=1000.0, vehicle_capacity=5000.0)
        self.assertFalse(is_compat, "Must REJECT candidate consolidation when realistic ML ETA exceeds deadline")

    def test_3_two_shipments_both_deadlines_must_pass(self):
        """Test 3: Both shipments must pass their respective deadlines."""
        shipment_1 = {
            "id": "shp-1",
            "pickup_location": "Bhubaneswar",
            "destination": "Kolkata",
            "pickup_date": "2026-08-16",
            "pickup_time": "08:00",
            "weight_kg": 800,
            "delivery_deadline": "2026-08-17T10:00:00",
        }
        shipment_2 = {
            "id": "shp-2",
            "pickup_location": "Bhubaneswar",
            "destination": "Kolkata",
            "pickup_date": "2026-08-16",
            "pickup_time": "08:00",
            "weight_kg": 800,
            "delivery_deadline": "2026-08-17T14:00:00",
        }
        feasible, reason = _is_trip_deadline_feasible([shipment_1, shipment_2])
        self.assertTrue(feasible)
        self.assertIsNone(reason)

    def test_4_first_stop_passes_second_stop_fails_rejected(self):
        """Test 4: Multi-stop route where intermediate stop passes but final destination fails -> Rejected."""
        shipment_cuttack = {
            "id": "shp-cuttack",
            "pickup_location": "Bhubaneswar",
            "destination": "Cuttack",
            "pickup_date": "2026-08-16",
            "pickup_time": "08:00",
            "weight_kg": 500,
            "delivery_deadline": "2026-08-16T11:00:00",  # Feasible (~45 mins transit)
        }
        shipment_kolkata = {
            "id": "shp-kolkata",
            "pickup_location": "Bhubaneswar",
            "destination": "Kolkata",
            "pickup_date": "2026-08-16",
            "pickup_time": "08:00",
            "weight_kg": 1500,
            "delivery_deadline": "2026-08-16T13:00:00",  # Infeasible (requires ~11 hrs)
        }

        is_compat = _is_compatible_with_trip(shipment_kolkata, [shipment_cuttack], current_load=500.0, vehicle_capacity=5000.0)
        self.assertFalse(is_compat, "Should reject consolidation when downstream destination deadline is missed")

    def test_5_ml_failure_uses_50kmh_fallback(self):
        """Test 5: Fallback to 50 km/h baseline when ML encounters runtime failure."""
        with patch("main.predict_travel_time", side_effect=RuntimeError("ML Service Offline")):
            shipment = {
                "id": "shp-fb",
                "pickup_location": "Bhubaneswar",
                "destination": "Kolkata",
                "pickup_date": "2026-08-16",
                "pickup_time": "08:00",
                "weight_kg": 1000,
            }
            route, total_km, duration_hrs = _build_route([shipment])
            self.assertEqual(duration_hrs, round(total_km / AVG_SPEED_KMH, 1))

    def test_6_cold_chain_compatibility_enforced(self):
        """Test 6: Incompatible temperature ranges (e.g. 2-8°C vs 20-25°C) are rejected."""
        cold_shipment = {
            "id": "shp-cold",
            "pickup_location": "Bhubaneswar",
            "destination": "Kolkata",
            "pickup_date": "2026-08-16",
            "pickup_time": "08:00",
            "weight_kg": 1000,
            "special_requirement": "2-8°C",
            "delivery_deadline": "2026-08-20T18:00:00",
        }
        ambient_shipment = {
            "id": "shp-ambient",
            "pickup_location": "Bhubaneswar",
            "destination": "Kolkata",
            "pickup_date": "2026-08-16",
            "pickup_time": "08:00",
            "weight_kg": 1000,
            "special_requirement": "20-25°C",
            "delivery_deadline": "2026-08-20T18:00:00",
        }

        is_compat = _is_compatible_with_trip(ambient_shipment, [cold_shipment], current_load=1000.0, vehicle_capacity=5000.0)
        self.assertFalse(is_compat, "Incompatible temperature ranges (2-8°C vs 20-25°C) must be rejected")

    def test_7_vehicle_capacity_enforced(self):
        """Test 7: Overweight candidate is rejected even if deadlines match."""
        shipment_1 = {
            "id": "shp-heavy-1",
            "pickup_location": "Bhubaneswar",
            "destination": "Kolkata",
            "pickup_date": "2026-08-16",
            "pickup_time": "08:00",
            "weight_kg": 3500,
            "delivery_deadline": "2026-08-20T18:00:00",
        }
        shipment_2 = {
            "id": "shp-heavy-2",
            "pickup_location": "Bhubaneswar",
            "destination": "Kolkata",
            "pickup_date": "2026-08-16",
            "pickup_time": "08:00",
            "weight_kg": 2000,
            "delivery_deadline": "2026-08-20T18:00:00",
        }
        # Total = 5500 kg > vehicle capacity 5000 kg
        is_compat = _is_compatible_with_trip(shipment_2, [shipment_1], current_load=3500.0, vehicle_capacity=5000.0)
        self.assertFalse(is_compat, "Exceeding vehicle capacity must be rejected")

    def test_8_cost_and_savings_calculation_intact(self):
        """Test 8: Cost and savings arithmetic remains preserved."""
        trips = _build_trips(
            all_shipments=[
                {"id": "s1", "pickup_location": "Bhubaneswar", "destination": "Kolkata", "weight_kg": 500, "delivery_deadline": "2026-08-20T18:00:00"},
                {"id": "s2", "pickup_location": "Bhubaneswar", "destination": "Kolkata", "weight_kg": 600, "delivery_deadline": "2026-08-20T18:00:00"},
            ],
            user_id="default_user",
        )
        self.assertEqual(len(trips), 1)
        trip = trips[0]
        self.assertEqual(trip.separate_cost, 2 * 18000.0)
        self.assertEqual(trip.consolidated_cost, 18000.0)
        self.assertEqual(trip.savings, 18000.0)
        self.assertEqual(trip.savings_percent, 50.0)

    def test_9_risk_calculation_receives_ml_duration(self):
        """Test 9: Risk calculation uses ML predicted duration."""
        route = ["Bhubaneswar", "Cuttack", "Jamshedpur", "Kolkata"]
        risk = _assess_risk(
            trip_shipments=[{"pickup_location": "Bhubaneswar", "destination": "Kolkata", "weight_kg": 500}],
            route=route,
            distance_km=380.0,
            duration_hrs=10.57,  # ML duration
            is_refrigerated=True,
        )
        self.assertIn("delay_risk_percent", risk)
        self.assertIn("spoilage_risk_percent", risk)
        self.assertGreater(risk["delay_risk_percent"], 0.0)

    def test_10_single_shipment_optimization_works(self):
        """Test 10: Single shipment trips are produced seamlessly."""
        trips = _build_trips(
            all_shipments=[
                {"id": "single-1", "pickup_location": "Puri", "destination": "Bhubaneswar", "weight_kg": 300, "delivery_deadline": "2026-08-20T18:00:00"}
            ],
            user_id="default_user",
        )
        self.assertEqual(len(trips), 1)
        self.assertEqual(trips[0].route_distance_km, 60.0)
        self.assertGreater(trips[0].estimated_duration_hours, 0.0)


if __name__ == "__main__":
    unittest.main(verbosity=2)
