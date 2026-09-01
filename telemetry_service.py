"""
Rule-Based Telemetry Safety Detection Service for Smart Freight.

Evaluates vehicle and cold-chain telemetry readings against shipment-specific safety policies.
Identifies potential risk events:
  - Temperature Breach
  - Sudden Impact
  - Harsh Braking / Deceleration
  - Abnormal Vibration (Disabled per fleet spec)

Safety Rule:
  These rules detect POTENTIAL incidents. They do NOT prove actual cargo damage.
  The driver must inspect and confirm before any incident is stored or sent to the customer.
"""

from typing import Any, Dict, Optional, Tuple

# ---------------------------------------------------------------------------
# Configurable Rule Thresholds & Constants
# ---------------------------------------------------------------------------
TELEMETRY_CONFIG = {
    # Temperature Thresholds (in Celsius)
    "temperature": {
        "reefer_min_c": 2.0,
        "reefer_max_c": 8.0,
        "ambient_max_c": 35.0,
        "low_breach_delta_c": 2.0,       # e.g., 8.1°C to 10.0°C -> LOW
        "medium_breach_delta_c": 5.0,    # e.g., 10.1°C to 13.0°C -> MEDIUM
        "high_breach_delta_c": 8.0,      # e.g., > 16.0°C -> HIGH
        "persistence_seconds": 8,        # Must exceed range for >= 8s to trigger
    },
    # Impact / Accelerometer Sensor (in G-force units)
    "impact": {
        "low_g": 1.8,                    # 1.8g to 2.4g: minor jolt
        "medium_g": 2.5,                 # 2.5g to 3.7g: substantial shock / curb strike
        "high_g": 3.8,                   # >= 3.8g: severe shock / potential cargo displacement
    },
    # Harsh Braking / Rapid Deceleration (in m/s²)
    "braking": {
        "medium_decel_mps2": -4.5,       # -4.5 to -6.5 m/s²: harsh braking
        "high_decel_mps2": -6.5,         # < -6.5 m/s²: emergency stop / violent deceleration
    },
    # Abnormal Vibration Sensor
    "vibration": {
        "enabled": False,
        "reason": "Vehicle vibration telemetry sensor hardware not present in current fleet specification.",
    },
}


def evaluate_telemetry(
    shipment_id: str,
    special_requirement: Optional[str] = "Normal",
    current_temp_c: Optional[float] = None,
    temp_duration_seconds: int = 0,
    impact_g: Optional[float] = 0.0,
    decel_mps2: Optional[float] = 0.0,
    vehicle_type: Optional[str] = "Refrigerated Van",
) -> Dict[str, Any]:
    """
    Evaluate telemetry stream against safety rules.
    Returns potential incident event if safety thresholds are breached.
    """
    cfg = TELEMETRY_CONFIG
    is_reefer = special_requirement and "refrigerated" in special_requirement.lower()

    # 1. Check Sudden Impact Rule (Highest Priority)
    if impact_g is not None and impact_g >= cfg["impact"]["low_g"]:
        if impact_g >= cfg["impact"]["high_g"]:
            sev = "HIGH"
            desc = (
                f"[AUTOMATIC_TELEMETRY] Sudden severe vehicle impact of {impact_g:.1f}g detected. "
                f"Exceeds critical safety threshold ({cfg['impact']['high_g']}g). "
                f"Driver inspection recommended for crate integrity and cargo displacement."
            )
        elif impact_g >= cfg["impact"]["medium_g"]:
            sev = "MEDIUM"
            desc = (
                f"[AUTOMATIC_TELEMETRY] Moderate impact force of {impact_g:.1f}g registered by telemetry. "
                f"Exceeds baseline threshold ({cfg['impact']['medium_g']}g). "
                f"Driver inspection recommended for pallet shift or packaging damage."
            )
        else:
            sev = "LOW"
            desc = (
                f"[AUTOMATIC_TELEMETRY] Minor road shock / jolt of {impact_g:.1f}g logged by accelerometer. "
                f"Potential minor cargo disturbance."
            )

        return {
            "triggered": True,
            "rule_type": "SUDDEN_IMPACT",
            "title": "POTENTIAL IMPACT DETECTED",
            "message": f"A sudden impact of {impact_g:.1f}g was detected by vehicle telemetry.",
            "severity": sev,
            "suggested_incident_type": "Accident / Impact",
            "suggested_description": desc,
            "shipment_id": shipment_id,
            "vehicle": vehicle_type,
            "telemetry_snapshot": {
                "impact_g": impact_g,
                "current_temp_c": current_temp_c,
                "decel_mps2": decel_mps2,
            },
        }

    # 2. Check Harsh Braking Rule
    if decel_mps2 is not None and decel_mps2 <= cfg["braking"]["medium_decel_mps2"]:
        if decel_mps2 <= cfg["braking"]["high_decel_mps2"]:
            sev = "HIGH"
            desc = (
                f"[AUTOMATIC_TELEMETRY] Severe emergency deceleration of {decel_mps2:.1f} m/s² detected. "
                f"High risk of pallet momentum shift and package crushing."
            )
        else:
            sev = "MEDIUM"
            desc = (
                f"[AUTOMATIC_TELEMETRY] Harsh braking event of {decel_mps2:.1f} m/s² logged by vehicle telemetry. "
                f"Driver verification recommended to check cargo strap tension."
            )

        return {
            "triggered": True,
            "rule_type": "HARSH_BRAKING",
            "title": "POTENTIAL DECELERATION BREACH",
            "message": f"Harsh braking ({decel_mps2:.1f} m/s²) detected. Cargo may have shifted.",
            "severity": sev,
            "suggested_incident_type": "Package Damage",
            "suggested_description": desc,
            "shipment_id": shipment_id,
            "vehicle": vehicle_type,
            "telemetry_snapshot": {
                "decel_mps2": decel_mps2,
                "current_temp_c": current_temp_c,
                "impact_g": impact_g,
            },
        }

    # 3. Check Temperature Breach Rule
    if current_temp_c is not None:
        if is_reefer:
            min_t = cfg["temperature"]["reefer_min_c"]
            max_t = cfg["temperature"]["reefer_max_c"]
            persistence_needed = cfg["temperature"]["persistence_seconds"]

            is_out_of_range = (current_temp_c < min_t) or (current_temp_c > max_t)

            # Trigger only if out of range AND has persisted for configured duration
            if is_out_of_range and temp_duration_seconds >= persistence_needed:
                delta = max(current_temp_c - max_t, min_t - current_temp_c)
                if delta >= cfg["temperature"]["high_breach_delta_c"]:
                    sev = "HIGH"
                elif delta >= cfg["temperature"]["medium_breach_delta_c"]:
                    sev = "MEDIUM"
                else:
                    sev = "LOW"

                desc = (
                    f"[AUTOMATIC_TELEMETRY] Cold-chain temperature breach: reading of {current_temp_c:.1f}°C "
                    f"persisted for {temp_duration_seconds}s outside required 2.0°C–8.0°C safe envelope. "
                    f"Chiller door seal or refrigeration compressor failure suspected."
                )

                return {
                    "triggered": True,
                    "rule_type": "TEMPERATURE_BREACH",
                    "title": "POTENTIAL INCIDENT DETECTED",
                    "message": "Temperature has exceeded the safe range for this shipment.",
                    "severity": sev,
                    "suggested_incident_type": "Temperature Issue",
                    "suggested_description": desc,
                    "shipment_id": shipment_id,
                    "vehicle": vehicle_type,
                    "telemetry_snapshot": {
                        "current_temp_c": current_temp_c,
                        "required_range": "2.0°C - 8.0°C",
                        "duration_seconds": temp_duration_seconds,
                    },
                }

    # Baseline: Normal telemetry
    return {
        "triggered": False,
        "rule_type": None,
        "severity": None,
        "title": None,
        "message": "Telemetry within normal operational bounds.",
        "shipment_id": shipment_id,
        "vehicle": vehicle_type,
        "telemetry_snapshot": {
            "current_temp_c": current_temp_c,
            "impact_g": impact_g,
            "decel_mps2": decel_mps2,
        },
    }
