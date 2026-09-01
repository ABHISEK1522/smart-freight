/**
 * Incident Service for Driver Cargo Incident Reporting
 *
 * Communicates with the FastAPI backend:
 * - POST /incidents : Submits and persists incident in backend SQLite database.
 * - GET /incidents/{shipment_id} : Retrieves all incidents for the shipment.
 * - GET /incidents/{shipment_id}/latest : Retrieves latest incident report.
 */

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";

/**
 * Fetch all incidents across all shipments belonging to the authenticated customer
 * @param {Object} [authHeaders]
 * @returns {Promise<Array>}
 */
export async function getCustomerIncidents(authHeaders = {}) {
  try {
    const res = await fetch(`${API_BASE_URL}/customer/incidents`, {
      headers: {
        "Content-Type": "application/json",
        ...authHeaders,
      },
    });
    if (res.ok) {
      const data = await res.json();
      return Array.isArray(data) ? data : [];
    }
    return [];
  } catch (err) {
    console.error("Failed to fetch customer incidents:", err);
    return [];
  }
}

/**
 * Fetch all incidents for a specific shipment directly from FastAPI
 * @param {string} shipmentId
 * @param {Object} [authHeaders]
 * @returns {Promise<Array>}
 */
export async function getShipmentIncidents(shipmentId, authHeaders = {}) {
  if (!shipmentId) return [];
  try {
    const res = await fetch(`${API_BASE_URL}/incidents/${encodeURIComponent(shipmentId)}`, {
      headers: {
        "Content-Type": "application/json",
        ...authHeaders,
      },
    });
    if (res.ok) {
      const data = await res.json();
      return Array.isArray(data) ? data : [];
    }
    return [];
  } catch (err) {
    console.error(`Failed to fetch incidents for shipment ${shipmentId}:`, err);
    return [];
  }
}

/**
 * Fetch the most recent incident for a shipment directly from FastAPI
 * @param {string} shipmentId
 * @returns {Promise<Object|null>}
 */
export async function getLatestShipmentIncident(shipmentId) {
  if (!shipmentId) return null;
  try {
    const res = await fetch(`${API_BASE_URL}/incidents/${encodeURIComponent(shipmentId)}/latest`);
    if (res.ok) {
      return await res.json();
    }
    return null;
  } catch (err) {
    return null;
  }
}

/**
 * Submit an incident report to FastAPI
 *
 * Strictly requires a successful response from FastAPI before returning success.
 * If backend fails or is unreachable, returns an explicit failure without mock success.
 *
 * @param {Object} payload
 * @param {string} payload.shipmentId - Manifest/Shipment ID
 * @param {string} payload.incidentType - Incident category
 * @param {string} payload.severity - Low | Medium | High
 * @param {string} payload.description - Incident explanation
 * @param {string|null} [payload.photo] - Local photo data (preserved in UI preview)
 * @param {string|null} [payload.photoName] - Optional photo file name
 * @param {Object} [authHeaders] - Authorization headers
 * @returns {Promise<{success: boolean, data?: Object, message?: string, error?: string}>}
 */
export async function submitCargoIncident(payload, authHeaders = {}) {
  const timestampISO = new Date().toISOString();

  const requestBody = {
    shipment_id: payload.shipmentId,
    incident_type: payload.incidentType,
    severity: payload.severity,
    description: payload.description.trim(),
    timestamp: timestampISO,
    status: "REPORTED",
    photo_data: payload.photo || null,
    photo_name: payload.photoName || null,
  };

  try {
    const headers = {
      "Content-Type": "application/json",
      ...authHeaders,
    };

    const res = await fetch(`${API_BASE_URL}/incidents`, {
      method: "POST",
      headers,
      body: JSON.stringify(requestBody),
    });

    if (!res.ok) {
      let errorDetail = "Unable to report incident. Please try again.";
      try {
        const errorJson = await res.json();
        if (errorJson.detail) {
          errorDetail = Array.isArray(errorJson.detail)
            ? errorJson.detail.map((d) => d.msg || d).join(", ")
            : String(errorJson.detail);
        }
      } catch {
        // Fall back to default error detail
      }
      return {
        success: false,
        error: errorDetail,
      };
    }

    const backendIncident = await res.json();

    const now = new Date(backendIncident.timestamp || timestampISO);
    const reportedAtIST =
      now.toLocaleTimeString("en-IN", {
        timeZone: "Asia/Kolkata",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
        hour12: false,
      }) +
      " IST, " +
      now.toLocaleDateString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      });

    const confirmedRecord = {
      incident_id: backendIncident.incident_id,
      shipment_id: backendIncident.shipment_id,
      incident_type: backendIncident.incident_type,
      severity: backendIncident.severity,
      description: backendIncident.description,
      status: backendIncident.status || "REPORTED",
      timestamp: backendIncident.timestamp,
      reportedAtIST,
      photo_name: backendIncident.photo_name || payload.photoName || null,
      local_photo_preview: payload.photo || null,
      storageNotice: "Permanently stored in central SQLite database",
    };

    return {
      success: true,
      data: confirmedRecord,
      message: "Your incident has been recorded successfully.",
    };
  } catch (networkErr) {
    console.error("Incident submission network error:", networkErr);
    return {
      success: false,
      error: "Unable to report incident. Please check server connectivity and try again.",
    };
  }
}

/**
 * Update incident status through lifecycle (REPORTED -> UNDER INSPECTION -> RESOLVED)
 *
 * @param {string} incidentId
 * @param {"REPORTED" | "UNDER INSPECTION" | "RESOLVED"} newStatus
 * @param {string} [resolutionNote]
 * @param {Object} [authHeaders]
 * @returns {Promise<Object|null>}
 */
export async function updateIncidentStatus(incidentId, newStatus, resolutionNote = null, authHeaders = {}) {
  if (!incidentId || !newStatus) return null;
  try {
    const res = await fetch(`${API_BASE_URL}/incidents/${encodeURIComponent(incidentId)}/status`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        ...authHeaders,
      },
      body: JSON.stringify({
        status: newStatus,
        resolution_note: resolutionNote || null,
      }),
    });
    if (res.ok) {
      return await res.json();
    }
    const errData = await res.json().catch(() => ({}));
    console.error("Failed to update incident status:", errData);
    return null;
  } catch (err) {
    console.error(`Error updating incident status for ${incidentId}:`, err);
    return null;
  }
}
