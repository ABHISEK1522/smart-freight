"""
Test Suite for Step 5 Phase 1: Safe Backend ML Integration
==========================================================
Verifies:
1. Real application optimization flow executes through _build_route() with ML prediction.
2. ML prediction is positive and realistic.
3. Fallback to 50 km/h baseline works seamlessly when ML throws an error.
4. _build_trips consolidation engine runs end-to-end with ML transit duration.
"""

import os
import sys
import unittest
from unittest.mock import patch

import database
from main import AVG_SPEED_KMH, Trip, _build_route, _build_trips


class TestStep5Phase1Integration(unittest.TestCase):

    def setUp(self):
        database.init_db()
        self.sample_shipments = [
            {
                "id": "shp-test-1",
                "pickup_location": "Bhubaneswar",
                "destination": "Kolkata",
                "pickup_date": "2026-08-16",
                "pickup_time": "08:00",
                "weight_kg": 1200,
                "is_refrigerated": False,
                "cargo_type": "Industrial Parts",
                "delivery_deadline": "2026-08-17T20:00:00",
            },
            {
                "id": "shp-test-2",
                "pickup_location": "Cuttack",
                "destination": "Jamshedpur",
                "pickup_date": "2026-08-16",
                "pickup_time": "09:30",
                "weight_kg": 800,
                "is_refrigerated": False,
                "cargo_type": "Hardware",
                "delivery_deadline": "2026-08-17T18:00:00",
            },
        ]

    def test_a_valid_route_uses_ml_prediction(self):
        """Test A: Valid route -> ML prediction is successfully used."""
        route, total_km, duration_hrs = _build_route(self.sample_shipments)
        self.assertGreater(total_km, 0)
        self.assertGreater(duration_hrs, 0)
        print(
            f"\n[Test A] Route: {route} | Distance: {total_km} km | "
            f"ML Duration: {duration_hrs} hrs (vs 50km/h: {total_km/50.0:.1f} hrs)"
        )
        self.assertNotEqual(duration_hrs, round(total_km / AVG_SPEED_KMH, 1))

    def test_b_ml_service_failure_uses_50kmh_fallback(self):
        """Test B: When ML service raises an exception, 50 km/h fallback is used."""
        with patch("main.predict_travel_time", side_effect=RuntimeError("Simulated ML Failure")):
            route, total_km, duration_hrs = _build_route(self.sample_shipments)
            expected_fallback = round(total_km / AVG_SPEED_KMH, 1)
            print(
                f"\n[Test B] Simulated Failure -> Duration: {duration_hrs} hrs | "
                f"Expected Fallback: {expected_fallback} hrs"
            )
            self.assertEqual(duration_hrs, expected_fallback)

    def test_c_ml_prediction_is_positive(self):
        """Test C: ML prediction is strictly positive."""
        route, total_km, duration_hrs = _build_route(self.sample_shipments)
        self.assertIsInstance(duration_hrs, float)
        self.assertGreater(duration_hrs, 0.0)

    def test_d_existing_optimization_runs_end_to_end(self):
        """Test D: Full _build_trips consolidation engine runs with ML prediction."""
        trips = _build_trips(
            all_shipments=self.sample_shipments.copy(),
            user_id="default_user",
        )
        self.assertGreater(len(trips), 0)
        trip = trips[0]
        print(
            f"\n[Test D] Consolidated Trip: ID={trip.trip_id} | Load={trip.total_load_kg} kg | "
            f"Duration={trip.estimated_duration_hours} hrs | Delay Risk={trip.delay_risk_percent}%"
        )
        self.assertGreater(trip.estimated_duration_hours, 0)


if __name__ == "__main__":
    unittest.main(verbosity=2)
