"""Smart Freight - Future Cargo Damage-Risk ML Architecture & Operational Feedback Pipeline
===========================================================================================
Closed-loop architecture for predictive cargo damage risk modeling.

Architecture:
    Driver reports incident -> Incident stored in SQLite -> Driver verifies/resolves
    -> Verified incident becomes historical operational training record -> Feature extraction
    -> Damage-risk ML training dataset -> Future damage-risk prediction.

Note:
    The existing Random Forest model (Model 1) strictly predicts FREIGHT TRANSIT TIME.
    This module implements the separate architecture for CARGO DAMAGE-RISK PREDICTION (Model 2).
    Model 1's predicted transit duration is utilized as ONE predictive feature inside Model 2.
"""

import json
import logging
from datetime import datetime
from pathlib import Path
from typing import Any, Dict, List, Optional, Tuple

import database

logger = logging.getLogger("smart_freight.damage_ml")

# Minimum verified positive/negative operational records needed to trigger automated retraining
MIN_SAMPLES_FOR_SUPERVISED_TRAINING = 50

# Product fragility & damage sensitivity baseline index (0.0 to 1.0)
PRODUCT_FRAGILITY_INDEX = {
    "Pharmaceutical Vaccines": 0.85,
    "Pharmaceuticals": 0.80,
    "Fresh Tomatoes": 0.65,
    "Chilled Dairy / Milk": 0.75,
    "Fresh Citrus & Produce": 0.50,
    "Electronic Equipment": 0.70,
    "Industrial Steel": 0.15,
    "Normal Freight": 0.25,
}
DEFAULT_FRAGILITY = 0.35


class DamageRiskMLService:
    """Service managing damage risk telemetry, verified operational data collection,
    explainable damage scoring, and dataset export for future model training."""

    def __init__(self):
        self.model_status = "COLLECTING DATA"
        self.model_name = "Cargo Damage-Risk Operational Learning Pipeline"
        self.target_label = "is_verified_damage"

    def get_pipeline_status(self) -> Dict[str, Any]:
        """Return the current training readiness and operational feedback statistics."""
        verified_records = database.get_all_verified_incidents_for_ml()
        verified_count = len(verified_records)

        stats = database.get_damage_statistics()
        total_incidents = stats.get("total_incidents", 0)

        is_ready = verified_count >= MIN_SAMPLES_FOR_SUPERVISED_TRAINING
        status = "TRAINING READY" if is_ready else "COLLECTING DATA"

        message = (
            f"Damage-risk model is currently in the data-collection phase ({verified_count}/{MIN_SAMPLES_FOR_SUPERVISED_TRAINING} verified incidents). "
            "Verified driver incidents are being accumulated to train and validate the predictive model."
            if not is_ready
            else f"Operational dataset threshold reached ({verified_count} verified samples). Ready for supervised training."
        )

        return {
            "model_status": status,
            "pipeline_name": self.model_name,
            "verified_damage_samples": verified_count,
            "total_reported_incidents": total_incidents,
            "threshold_required": MIN_SAMPLES_FOR_SUPERVISED_TRAINING,
            "is_training_ready": is_ready,
            "status_message": message,
            "input_features": [
                "product_type",
                "cargo_weight_kg",
                "ml_predicted_transit_hours",
                "route_distance_km",
                "intermediate_stops_count",
                "vehicle_type",
                "vehicle_is_refrigerated",
                "vehicle_historical_incidents",
                "telemetry_temp_excursions",
                "telemetry_harsh_braking_events",
            ],
        }

    def assess_damage_risk(
        self,
        product_type: str,
        weight_kg: float,
        route_distance_km: float,
        ml_predicted_transit_hours: float,
        intermediate_stops_count: int = 1,
        vehicle_type: str = "Standard Freight Truck",
        vehicle_id: Optional[str] = None,
        telemetry_anomalies: int = 0,
        temp_excursions: int = 0,
    ) -> Dict[str, Any]:
        """Compute an explainable damage-risk score (0-100) and risk tier based on
        product fragility, ML highway duration, route stops, and historical vehicle incidents."""
        explanations: List[str] = []
        score = 15.0  # Baseline handling risk

        # 1. Product Fragility Factor
        fragility = PRODUCT_FRAGILITY_INDEX.get(product_type, DEFAULT_FRAGILITY)
        fragility_score = fragility * 35.0
        score += fragility_score
        if fragility >= 0.70:
            explanations.append(f"High product fragility for '{product_type}' increases cargo handling risk.")
        elif fragility <= 0.20:
            explanations.append(f"Sturdy cargo profile for '{product_type}' reduces mechanical damage risk.")

        # 2. ML Predicted Highway Duration
        if ml_predicted_transit_hours > 12.0:
            score += 20.0
            explanations.append(f"Prolonged transit time ({ml_predicted_transit_hours:.1f} hrs) elevates cargo vibration fatigue.")
        elif ml_predicted_transit_hours > 6.0:
            score += 10.0
            explanations.append(f"Moderate transit duration ({ml_predicted_transit_hours:.1f} hrs) on highway corridor.")
        else:
            score += 4.0
            explanations.append(f"Short transit duration ({ml_predicted_transit_hours:.1f} hrs) keeps transit exposure low.")

        # 3. Intermediate Stops / Multi-drop handling
        if intermediate_stops_count > 2:
            score += 15.0
            explanations.append(f"Multiple intermediate hubs ({intermediate_stops_count} stops) introduce loading/unloading disturbance.")
        elif intermediate_stops_count == 2:
            score += 8.0
            explanations.append("Two corridor waypoints require careful cargo staging.")

        # 4. Vehicle Historical Damage Incidents from SQLite
        if vehicle_id:
            veh_stats = database.get_vehicle_damage_history(vehicle_id)
            total_veh_inc = veh_stats.get("total_incidents", 0)
            if total_veh_inc > 0:
                inc_penalty = min(total_veh_inc * 6.0, 18.0)
                score += inc_penalty
                explanations.append(f"Vehicle {vehicle_id} has {total_veh_inc} previous recorded incident(s).")

        # 5. Telemetry Anomalies (Harsh braking / Temp spikes)
        if temp_excursions > 0:
            score += min(temp_excursions * 10.0, 20.0)
            explanations.append(f"Telemetry detected {temp_excursions} temperature excursion event(s).")
        if telemetry_anomalies > 0:
            score += min(telemetry_anomalies * 8.0, 16.0)
            explanations.append(f"Telemetry detected {telemetry_anomalies} dynamic impact/braking event(s).")

        final_score = round(min(max(score, 5.0), 95.0), 1)

        if final_score < 35.0:
            risk_tier = "LOW"
        elif final_score <= 65.0:
            risk_tier = "MEDIUM"
        else:
            risk_tier = "HIGH"

        return {
            "damage_risk_score": final_score,
            "damage_risk_tier": risk_tier,
            "model_status": self.model_status,
            "pipeline_name": self.model_name,
            "explanations": explanations,
        }

    def export_damage_training_dataset(self) -> List[Dict[str, Any]]:
        """Export tabular dataset extracted from verified operational incidents joined with shipments."""
        verified = database.get_all_verified_incidents_for_ml()
        dataset = []
        for row in verified:
            dataset.append({
                "incident_id": row["id"],
                "shipment_id": row["shipment_id"],
                "product_type": row.get("product_type"),
                "cargo_weight_kg": row.get("weight_kg"),
                "pickup_location": row.get("pickup_location"),
                "destination": row.get("destination"),
                "incident_type": row.get("incident_type"),
                "severity": row.get("severity"),
                "status": row.get("status"),
                "is_verified_damage": 1,
                "created_at": row.get("created_at"),
                "resolved_at": row.get("resolved_at"),
            })
        return dataset


# Global singleton instance
damage_ml_service = DamageRiskMLService()
