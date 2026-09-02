"""
Unit Tests for Smart Freight ML Travel-Time Inference Service
=============================================================
Tests all 8 required verification scenarios for backend/ml_service.py.
"""

import json
import os
import sys
import unittest
from pathlib import Path

# Add backend directory to sys.path
BASE_DIR = Path(__file__).resolve().parent
sys.path.append(str(BASE_DIR / "backend"))

import ml_service
from ml_service import (
    EXPECTED_FEATURE_ORDER,
    MLInferenceError,
    MLModelLoadError,
    MLValidationError,
    TravelTimePredictor,
    get_predictor,
    predict_travel_time,
)


class TestMLTravelTimeService(unittest.TestCase):
    """Test suite verifying ML model inference contract and fail-safe properties."""

    def setUp(self):
        TravelTimePredictor._instance = None
        ml_service._predictor_instance = None
        self.predictor = TravelTimePredictor(auto_load=True)
        self.valid_payload = {
            "osrm_distance": 440.0,
            "osrm_time": 336.0,
            "osrm_speed_kmh": 440.0 / (336.0 / 60.0),
            "num_intermediate_stops": 3,
            "is_ftl": 1,
            "departure_hour": 8,
            "departure_dayofweek": 0,
            "is_weekend": 0,
            "is_night_dispatch": 0,
            "is_interstate": 1,
            "source_state": "Odisha",
            "destination_state": "West Bengal",
        }

    def tearDown(self):
        TravelTimePredictor._instance = None
        ml_service._predictor_instance = None

    def test_1_valid_prediction_returns_positive_duration(self):
        """Test 1: Valid feature vector returns a positive predicted duration."""
        res = predict_travel_time(**self.valid_payload)
        self.assertIn("predicted_minutes", res)
        self.assertIn("predicted_hours", res)
        self.assertGreater(res["predicted_minutes"], 0.0)
        self.assertGreater(res["predicted_hours"], 0.0)

    def test_2_prediction_is_numeric(self):
        """Test 2: Prediction is numeric (float)."""
        res = predict_travel_time(**self.valid_payload)
        self.assertIsInstance(res["predicted_minutes"], float)
        self.assertIsInstance(res["predicted_hours"], float)
        self.assertEqual(res["model_version"], "Random Forest Regressor")

    def test_3_missing_or_empty_feature_rejected(self):
        """Test 3: Missing required feature is rejected with clear validation error."""
        invalid_payload = self.valid_payload.copy()
        invalid_payload["source_state"] = ""
        with self.assertRaises(MLValidationError):
            predict_travel_time(**invalid_payload)

    def test_4_negative_distance_rejected(self):
        """Test 4: Invalid negative distance is rejected."""
        invalid_payload = self.valid_payload.copy()
        invalid_payload["osrm_distance"] = -50.0
        with self.assertRaises(MLValidationError):
            predict_travel_time(**invalid_payload)

    def test_5_invalid_departure_hour_rejected(self):
        """Test 5: Invalid departure hour (e.g. 25) is rejected."""
        invalid_payload = self.valid_payload.copy()
        invalid_payload["departure_hour"] = 25
        with self.assertRaises(MLValidationError):
            predict_travel_time(**invalid_payload)

    def test_6_model_artifact_failure_handled_safely(self):
        """Test 6: Model artifact failure is handled safely without unhandled crashes."""
        dummy = object.__new__(TravelTimePredictor)
        dummy.model_path = Path("ml/models/non_existent_model.joblib")
        dummy.preprocessor_path = Path("ml/models/non_existent_preproc.joblib")
        dummy.metadata_path = Path("ml/models/non_existent_meta.json")
        dummy.is_loaded = False
        dummy.model = None
        dummy.preprocessor = None

        with self.assertRaises(MLModelLoadError):
            dummy.load(force_reload=True)

    def test_7_repeated_predictions_consistent(self):
        """Test 7: Repeated predictions work consistently and identically (deterministic)."""
        res1 = predict_travel_time(**self.valid_payload)
        res2 = predict_travel_time(**self.valid_payload)
        res3 = predict_travel_time(**self.valid_payload)

        self.assertAlmostEqual(res1["predicted_minutes"], res2["predicted_minutes"], places=2)
        self.assertAlmostEqual(res2["predicted_minutes"], res3["predicted_minutes"], places=2)
        self.assertAlmostEqual(res1["predicted_hours"], res3["predicted_hours"], places=2)

    def test_8_feature_order_matches_training_pipeline(self):
        """Test 8: The inference feature order exactly matches the training pipeline."""
        training_metadata_path = BASE_DIR / "ml" / "models" / "model_metadata.json"
        with open(training_metadata_path, "r", encoding="utf-8") as f:
            meta = json.load(f)

        training_features = meta["input_features"]
        self.assertEqual(
            EXPECTED_FEATURE_ORDER,
            training_features,
            "Feature order in ml_service.py must exactly match model_metadata.json",
        )


if __name__ == "__main__":
    unittest.main(verbosity=2)
