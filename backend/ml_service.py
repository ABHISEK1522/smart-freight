"""
Smart Freight - ML Travel-Time Inference Service
================================================
Isolated inference wrapper for the trained Indian Logistics Transit-Time Prediction Model.

Loads pre-trained Random Forest model and ColumnTransformer preprocessor from ml/models/
to provide empirical transit duration predictions for route optimization.
"""

import json
import logging
from pathlib import Path
from typing import Any, Dict, List, Optional, Union

import joblib
import numpy as np
import pandas as pd

logger = logging.getLogger("smart_freight.ml_service")

# ---------------------------------------------------------------------------
# Path & Configuration Setup
# ---------------------------------------------------------------------------

BASE_DIR = Path(__file__).resolve().parent.parent
ML_MODELS_DIR = BASE_DIR / "ml" / "models"

MODEL_FILE = ML_MODELS_DIR / "travel_time_model.joblib"
PREPROCESSOR_FILE = ML_MODELS_DIR / "preprocessor.joblib"
METADATA_FILE = ML_MODELS_DIR / "model_metadata.json"

EXPECTED_FEATURE_ORDER: List[str] = [
    "osrm_distance",
    "osrm_time",
    "osrm_speed_kmh",
    "num_intermediate_stops",
    "is_ftl",
    "departure_hour",
    "departure_dayofweek",
    "is_weekend",
    "is_night_dispatch",
    "is_interstate",
    "source_state",
    "destination_state",
]

TOP_INDIAN_STATES: List[str] = [
    "Maharashtra",
    "Karnataka",
    "Tamil Nadu",
    "Haryana",
    "Uttar Pradesh",
    "Telangana",
    "Gujarat",
    "West Bengal",
    "Andhra Pradesh",
    "Rajasthan",
    "Delhi",
    "Punjab",
    "Madhya Pradesh",
    "Kerala",
    "Bihar",
    "Odisha",
    "Assam",
]


# ---------------------------------------------------------------------------
# Custom Domain Exceptions
# ---------------------------------------------------------------------------


class MLInferenceError(Exception):
    """Base exception for ML inference failures."""

    def __init__(self, message: str, status_code: int = 500):
        super().__init__(message)
        self.message = message
        self.status_code = status_code


class MLValidationError(MLInferenceError):
    """Raised when inference input features violate validation constraints."""

    def __init__(self, detail: str):
        super().__init__(f"ML feature validation error: {detail}", status_code=400)
        self.detail = detail


class MLModelLoadError(MLInferenceError):
    """Raised when the serialized model artifact or preprocessor cannot be loaded."""

    def __init__(self, detail: str):
        super().__init__(f"Failed to load ML model artifact: {detail}", status_code=503)
        self.detail = detail


# ---------------------------------------------------------------------------
# Inference Engine Singleton
# ---------------------------------------------------------------------------


class TravelTimePredictor:
    """Singleton predictor that lazily loads and holds ML model in memory."""

    _instance: Optional["TravelTimePredictor"] = None

    def __new__(cls, *args, **kwargs):
        if cls._instance is None:
            cls._instance = super(TravelTimePredictor, cls).__new__(cls)
            cls._instance._initialized = False
        return cls._instance

    def __init__(
        self,
        model_path: Path = MODEL_FILE,
        preprocessor_path: Path = PREPROCESSOR_FILE,
        metadata_path: Path = METADATA_FILE,
        auto_load: bool = True,
    ):
        if getattr(self, "_initialized", False):
            return

        self.model_path = Path(model_path)
        self.preprocessor_path = Path(preprocessor_path)
        self.metadata_path = Path(metadata_path)

        self.model: Optional[Any] = None
        self.preprocessor: Optional[Any] = None
        self.metadata: Dict[str, Any] = {}
        self.is_loaded: bool = False
        self.model_version: str = "rf_delhivery_v1.0"

        if auto_load:
            self.load()

        self._initialized = True

    def load(self, force_reload: bool = False) -> None:
        """Load model and preprocessor artifacts from disk."""
        if self.is_loaded and not force_reload:
            return

        if not self.model_path.exists():
            raise MLModelLoadError(f"Model file not found at {self.model_path}")
        if not self.preprocessor_path.exists():
            raise MLModelLoadError(f"Preprocessor file not found at {self.preprocessor_path}")

        try:
            self.model = joblib.load(self.model_path)
            self.preprocessor = joblib.load(self.preprocessor_path)

            if self.metadata_path.exists():
                with open(self.metadata_path, "r", encoding="utf-8") as f:
                    self.metadata = json.load(f)
                    self.model_version = self.metadata.get("model_name", "rf_delhivery_v1.0")

            self.is_loaded = True
            logger.info("Successfully loaded ML Travel Time Model (version: %s)", self.model_version)
        except Exception as e:
            self.is_loaded = False
            self.model = None
            self.preprocessor = None
            raise MLModelLoadError(str(e))

    def validate_inputs(
        self,
        osrm_distance: float,
        osrm_time: float,
        osrm_speed_kmh: float,
        num_intermediate_stops: int,
        is_ftl: int,
        departure_hour: int,
        departure_dayofweek: int,
        is_weekend: int,
        is_night_dispatch: int,
        is_interstate: int,
        source_state: str,
        destination_state: str,
    ) -> Dict[str, Any]:
        """Validate input ranges and types before constructing DataFrame."""
        if not isinstance(osrm_distance, (int, float)) or osrm_distance <= 0:
            raise MLValidationError(f"'osrm_distance' must be a positive number, got: {osrm_distance}")
        if not isinstance(osrm_time, (int, float)) or osrm_time <= 0:
            raise MLValidationError(f"'osrm_time' must be a positive number, got: {osrm_time}")
        if not isinstance(osrm_speed_kmh, (int, float)) or osrm_speed_kmh <= 0:
            raise MLValidationError(f"'osrm_speed_kmh' must be a positive number, got: {osrm_speed_kmh}")
        if not isinstance(num_intermediate_stops, int) or num_intermediate_stops < 0:
            raise MLValidationError(
                f"'num_intermediate_stops' must be a non-negative integer, got: {num_intermediate_stops}"
            )
        if int(is_ftl) not in (0, 1):
            raise MLValidationError(f"'is_ftl' flag must be 0 or 1, got: {is_ftl}")
        if not isinstance(departure_hour, int) or not (0 <= departure_hour <= 23):
            raise MLValidationError(f"'departure_hour' must be between 0 and 23, got: {departure_hour}")
        if not isinstance(departure_dayofweek, int) or not (0 <= departure_dayofweek <= 6):
            raise MLValidationError(
                f"'departure_dayofweek' must be between 0 and 6, got: {departure_dayofweek}"
            )
        if int(is_weekend) not in (0, 1):
            raise MLValidationError(f"'is_weekend' flag must be 0 or 1, got: {is_weekend}")
        if int(is_night_dispatch) not in (0, 1):
            raise MLValidationError(f"'is_night_dispatch' flag must be 0 or 1, got: {is_night_dispatch}")
        if int(is_interstate) not in (0, 1):
            raise MLValidationError(f"'is_interstate' flag must be 0 or 1, got: {is_interstate}")

        if not isinstance(source_state, str) or not source_state.strip():
            raise MLValidationError("Missing or empty 'source_state'")
        if not isinstance(destination_state, str) or not destination_state.strip():
            raise MLValidationError("Missing or empty 'destination_state'")

        # Normalize state names
        src_st = source_state.strip()
        dest_st = destination_state.strip()
        norm_src = src_st if src_st in TOP_INDIAN_STATES else "Other"
        norm_dest = dest_st if dest_st in TOP_INDIAN_STATES else "Other"

        return {
            "osrm_distance": float(osrm_distance),
            "osrm_time": float(osrm_time),
            "osrm_speed_kmh": float(osrm_speed_kmh),
            "num_intermediate_stops": int(num_intermediate_stops),
            "is_ftl": int(is_ftl),
            "departure_hour": int(departure_hour),
            "departure_dayofweek": int(departure_dayofweek),
            "is_weekend": int(is_weekend),
            "is_night_dispatch": int(is_night_dispatch),
            "is_interstate": int(is_interstate),
            "source_state": norm_src,
            "destination_state": norm_dest,
        }

    def predict(
        self,
        osrm_distance: float,
        osrm_time: float,
        osrm_speed_kmh: float,
        num_intermediate_stops: int,
        is_ftl: int,
        departure_hour: int,
        departure_dayofweek: int,
        is_weekend: int,
        is_night_dispatch: int,
        is_interstate: int,
        source_state: str,
        destination_state: str,
    ) -> Dict[str, Any]:
        """Execute model inference and return formatted prediction dictionary."""
        if not self.is_loaded or self.model is None or self.preprocessor is None:
            self.load()

        validated_record = self.validate_inputs(
            osrm_distance=osrm_distance,
            osrm_time=osrm_time,
            osrm_speed_kmh=osrm_speed_kmh,
            num_intermediate_stops=num_intermediate_stops,
            is_ftl=is_ftl,
            departure_hour=departure_hour,
            departure_dayofweek=departure_dayofweek,
            is_weekend=is_weekend,
            is_night_dispatch=is_night_dispatch,
            is_interstate=is_interstate,
            source_state=source_state,
            destination_state=destination_state,
        )

        # Enforce exact feature order in input DataFrame
        input_df = pd.DataFrame([validated_record])[EXPECTED_FEATURE_ORDER]

        try:
            X_transformed = self.preprocessor.transform(input_df)
            raw_prediction_minutes = float(self.model.predict(X_transformed)[0])
        except Exception as e:
            logger.error("ML model execution error: %s", e)
            raise MLInferenceError(f"Prediction execution failed: {str(e)}")

        # Ensure non-negative duration
        predicted_minutes = max(raw_prediction_minutes, float(validated_record["osrm_time"]) * 0.8)
        predicted_hours = predicted_minutes / 60.0

        return {
            "predicted_minutes": float(predicted_minutes),
            "predicted_hours": float(round(predicted_hours, 2)),
            "model_version": self.model_version,
            "prediction_source": "ml_random_forest",
            "osrm_time_minutes": float(validated_record["osrm_time"]),
            "osrm_distance_km": float(validated_record["osrm_distance"]),
        }


# Global singleton instance
_predictor_instance: Optional[TravelTimePredictor] = None


def get_predictor() -> TravelTimePredictor:
    """Retrieve or initialize the singleton TravelTimePredictor instance."""
    global _predictor_instance
    if _predictor_instance is None:
        _predictor_instance = TravelTimePredictor()
    return _predictor_instance


def predict_travel_time(
    osrm_distance: float,
    osrm_time: float,
    osrm_speed_kmh: float,
    num_intermediate_stops: int,
    is_ftl: int,
    departure_hour: int,
    departure_dayofweek: int,
    is_weekend: int,
    is_night_dispatch: int,
    is_interstate: int,
    source_state: str,
    destination_state: str,
) -> Dict[str, Any]:
    """Public convenience function to generate travel-time predictions."""
    predictor = get_predictor()
    return predictor.predict(
        osrm_distance=osrm_distance,
        osrm_time=osrm_time,
        osrm_speed_kmh=osrm_speed_kmh,
        num_intermediate_stops=num_intermediate_stops,
        is_ftl=is_ftl,
        departure_hour=departure_hour,
        departure_dayofweek=departure_dayofweek,
        is_weekend=is_weekend,
        is_night_dispatch=is_night_dispatch,
        is_interstate=is_interstate,
        source_state=source_state,
        destination_state=destination_state,
    )
