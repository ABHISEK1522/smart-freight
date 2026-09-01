/**
 * Telemetry Safety Rules and Evaluation Service for Smart Freight
 *
 * Configurable safety detection rules:
 * - Temperature Breach: Safe range check with persistence requirement
 * - Sudden Impact: Accelerometer G-force threshold detection
 * - Harsh Braking: Rapid deceleration rate detection
 * - Abnormal Vibration: Disabled (hardware sensor not present in current fleet spec)
 */

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";

export const TELEMETRY_CONFIG = {
  // Temperature Thresholds (Celsius)
  temperature: {
    reeferMinC: 2.0,
    reeferMaxC: 8.0,
    ambientMaxC: 35.0,
    lowBreachDeltaC: 2.0,     // 8.1°C to 10.0°C -> LOW
    mediumBreachDeltaC: 5.0,  // 10.1°C to 13.0°C -> MEDIUM
    highBreachDeltaC: 8.0,    // > 16.0°C -> HIGH
    persistenceSeconds: 8,    // Must persist for >= 8s before alerting
  },
  // Accelerometer / Impact Sensor (G-force)
  impact: {
    lowG: 1.8,                // 1.8g - 2.4g: minor bump -> LOW
    mediumG: 2.5,             // 2.5g - 3.7g: substantial shock -> MEDIUM
    highG: 3.8,               // >= 3.8g: severe shock -> HIGH
  },
  // Deceleration / Harsh Braking (m/s²)
  braking: {
    mediumDecelMps2: -4.5,    // -4.5 to -6.5 m/s² -> MEDIUM
    highDecelMps2: -6.5,      // < -6.5 m/s² -> HIGH
  },
  // Vibration Sensor Rule: Explicitly disabled per fleet specification
  vibration: {
    enabled: false,
    reason: "Vehicle vibration telemetry sensor hardware not present in current fleet specification.",
  },
};

/**
 * Evaluate telemetry stream with FastAPI backend
 *
 * @param {Object} payload
 * @param {string} payload.shipmentId
 * @param {number} [payload.currentTempC]
 * @param {number} [payload.tempDurationSeconds]
 * @param {number} [payload.impactG]
 * @param {number} [payload.decelMps2]
 * @param {string} [payload.vehicleType]
 * @param {Object} [authHeaders]
 * @returns {Promise<Object>}
 */
export async function evaluateTelemetry(payload, authHeaders = {}) {
  try {
    const res = await fetch(`${API_BASE_URL}/telemetry/evaluate`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...authHeaders,
      },
      body: JSON.stringify({
        shipment_id: payload.shipmentId,
        current_temp_c: payload.currentTempC ?? null,
        temp_duration_seconds: payload.tempDurationSeconds || 0,
        impact_g: payload.impactG || 0.0,
        decel_mps2: payload.decelMps2 || 0.0,
        vehicle_type: payload.vehicleType || null,
      }),
    });

    if (res.ok) {
      return await res.json();
    }
  } catch (err) {
    console.error("Failed to evaluate telemetry with backend:", err);
  }

  // Fallback client-side rule evaluation if network drops
  return clientSideEvaluate(payload);
}

/**
 * Record dismissal of a potential telemetry alert
 *
 * @param {Object} payload
 * @param {string} payload.shipmentId
 * @param {string} payload.ruleType
 * @param {string} payload.telemetrySummary
 * @param {Object} [authHeaders]
 * @returns {Promise<boolean>}
 */
export async function dismissTelemetryAlert(payload, authHeaders = {}) {
  try {
    const res = await fetch(`${API_BASE_URL}/telemetry/dismiss`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...authHeaders,
      },
      body: JSON.stringify({
        shipment_id: payload.shipmentId,
        rule_type: payload.ruleType,
        telemetry_summary: payload.telemetrySummary,
      }),
    });
    return res.ok;
  } catch (err) {
    console.error("Failed to persist alert dismissal:", err);
    return false;
  }
}

/**
 * Local fallback evaluation in case of offline terminal connectivity
 */
function clientSideEvaluate(payload) {
  const cfg = TELEMETRY_CONFIG;
  const { shipmentId, currentTempC, tempDurationSeconds = 0, impactG = 0, decelMps2 = 0, vehicleType = "Refrigerated Van" } = payload;

  if (impactG >= cfg.impact.lowG) {
    const sev = impactG >= cfg.impact.highG ? "HIGH" : impactG >= cfg.impact.mediumG ? "MEDIUM" : "LOW";
    return {
      triggered: true,
      rule_type: "SUDDEN_IMPACT",
      title: "POTENTIAL IMPACT DETECTED",
      message: `A sudden impact of ${impactG.toFixed(1)}g was detected by vehicle telemetry.`,
      severity: sev,
      suggested_incident_type: "Accident / Impact",
      suggested_description: `[AUTOMATIC_TELEMETRY] Sudden impact of ${impactG.toFixed(1)}g detected. Driver inspection recommended.`,
      shipment_id: shipmentId,
      vehicle: vehicleType,
      telemetry_snapshot: { impact_g: impactG, current_temp_c: currentTempC, decel_mps2: decelMps2 },
    };
  }

  if (decelMps2 <= cfg.braking.mediumDecelMps2) {
    const sev = decelMps2 <= cfg.braking.highDecelMps2 ? "HIGH" : "MEDIUM";
    return {
      triggered: true,
      rule_type: "HARSH_BRAKING",
      title: "POTENTIAL DECELERATION BREACH",
      message: `Harsh braking (${decelMps2.toFixed(1)} m/s²) detected. Cargo may have shifted.`,
      severity: sev,
      suggested_incident_type: "Package Damage",
      suggested_description: `[AUTOMATIC_TELEMETRY] Harsh braking of ${decelMps2.toFixed(1)} m/s² detected by vehicle telemetry.`,
      shipment_id: shipmentId,
      vehicle: vehicleType,
      telemetry_snapshot: { decel_mps2: decelMps2, current_temp_c: currentTempC, impact_g: impactG },
    };
  }

  if (currentTempC != null && (currentTempC < cfg.temperature.reeferMinC || currentTempC > cfg.temperature.reeferMaxC)) {
    if (tempDurationSeconds >= cfg.temperature.persistenceSeconds) {
      const delta = Math.max(currentTempC - cfg.temperature.reeferMaxC, cfg.temperature.reeferMinC - currentTempC);
      const sev = delta >= cfg.temperature.highBreachDeltaC ? "HIGH" : delta >= cfg.temperature.mediumBreachDeltaC ? "MEDIUM" : "LOW";
      return {
        triggered: true,
        rule_type: "TEMPERATURE_BREACH",
        title: "POTENTIAL INCIDENT DETECTED",
        message: "Temperature has exceeded the safe range for this shipment.",
        severity: sev,
        suggested_incident_type: "Temperature Issue",
        suggested_description: `[AUTOMATIC_TELEMETRY] Cold-chain temperature breach: reading of ${currentTempC.toFixed(1)}°C persisted for ${tempDurationSeconds}s outside safe 2.0°C–8.0°C range.`,
        shipment_id: shipmentId,
        vehicle: vehicleType,
        telemetry_snapshot: { current_temp_c: currentTempC, duration_seconds: tempDurationSeconds },
      };
    }
  }

  return {
    triggered: false,
    rule_type: null,
    severity: null,
    title: null,
    message: "Telemetry within normal bounds.",
    shipment_id: shipmentId,
  };
}
