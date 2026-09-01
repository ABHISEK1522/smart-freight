"use client";

import React, { useState, useEffect, useRef } from "react";
import {
  AlertTriangle,
  AlertCircle,
  Clock,
  X,
  Eye,
  ShieldAlert,
  CheckCircle2,
  Package,
  ArrowRight,
  Info,
  Camera,
} from "lucide-react";
import { getCustomerIncidents } from "@/services/incidentService";
import { useAuth } from "@/context/AuthContext";

/**
 * Format ISO timestamp to human-friendly Indian Standard Time (IST)
 */
function formatTimeIST(timestamp) {
  if (!timestamp) return "Just now";
  try {
    const d = new Date(timestamp);
    if (isNaN(d.getTime())) return timestamp;
    return (
      d.toLocaleTimeString("en-IN", {
        timeZone: "Asia/Kolkata",
        hour: "2-digit",
        minute: "2-digit",
        hour12: true,
      }) +
      ", " +
      d.toLocaleDateString("en-IN", {
        day: "2-digit",
        month: "short",
      })
    );
  } catch {
    return timestamp;
  }
}

/**
 * Customer Incident Details Modal
 */
export function CustomerIncidentDetailModal({ incident, onClose }) {
  if (!incident) return null;

  const severityUpper = String(incident.severity || "MEDIUM").toUpperCase();
  const statusUpper = String(incident.status || "REPORTED").toUpperCase();

  const isHigh = severityUpper === "HIGH";
  const isMedium = severityUpper === "MEDIUM";

  // Check if real persistent photo data URL exists (starts with http://, https://, or data:image/)
  const hasRealPhoto =
    incident.photo_data &&
    (incident.photo_data.startsWith("http://") ||
      incident.photo_data.startsWith("https://") ||
      incident.photo_data.startsWith("data:image/"));

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#1F1D1A]/60 backdrop-blur-xs select-none"
      onClick={onClose}
    >
      <div
        className="w-full max-w-lg bg-[#FAF5EC] border border-[#E2D5C3] rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] animate-fade-in"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Header */}
        <div
          className={`px-6 py-4 border-b flex items-center justify-between ${
            isHigh
              ? "bg-[#FDF0EA] border-[#F5CABA]"
              : isMedium
              ? "bg-[#FEF6E8] border-[#F2D7A5]"
              : "bg-[#EBF3EA] border-[#C4DEC0]"
          }`}
        >
          <div className="flex items-center gap-3">
            <div
              className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold ${
                isHigh
                  ? "bg-[#FAF5EC] text-[#BA4336] border border-[#F5CABA]"
                  : isMedium
                  ? "bg-[#FAF5EC] text-[#B8711E] border border-[#F2D7A5]"
                  : "bg-[#FAF5EC] text-[#2D5926] border border-[#C4DEC0]"
              }`}
            >
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-black text-[#1F1D1A] uppercase tracking-wide font-mono">
                Cargo Incident Assessment
              </h3>
              <p className="text-[10px] text-[#5C5349] font-mono">
                OFFICIAL DRIVER OBSERVATION LOG
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-full text-[#8A7E70] hover:text-[#1F1D1A] hover:bg-[#E2D5C3]/40 transition-colors cursor-pointer"
            title="Close"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto space-y-4 font-sans text-xs">
          {/* Status & Severity Badges */}
          <div className="flex items-center justify-between p-3 bg-[#FDFBF7] rounded-xl border border-[#E2D5C3] font-mono">
            <div>
              <span className="text-[9px] text-[#8A7E70] uppercase font-bold block">
                CURRENT STATUS
              </span>
              <span className="font-bold text-xs px-2.5 py-0.5 rounded-full bg-[#FAF5EC] border border-[#E2D5C3] text-[#1F1D1A] inline-block mt-0.5">
                ● {statusUpper}
              </span>
            </div>

            <div className="text-right">
              <span className="text-[9px] text-[#8A7E70] uppercase font-bold block">
                SEVERITY LEVEL
              </span>
              <span
                className={`font-bold text-xs px-2.5 py-0.5 rounded-full border inline-block mt-0.5 ${
                  isHigh
                    ? "bg-[#FDF0EA] text-[#BA4336] border-[#F5CABA]"
                    : isMedium
                    ? "bg-[#FEF6E8] text-[#B8711E] border-[#F2D7A5]"
                    : "bg-[#EBF3EA] text-[#2D5926] border-[#C4DEC0]"
                }`}
              >
                {severityUpper}
              </span>
            </div>
          </div>

          {/* Key Identifiers */}
          <div className="grid grid-cols-2 gap-3 font-mono text-xs">
            <div className="p-3 bg-[#FDFBF7] rounded-xl border border-[#E2D5C3]">
              <span className="text-[9px] text-[#8A7E70] uppercase font-bold block">
                INCIDENT ID
              </span>
              <span className="text-sm font-bold text-[#C85A32] mt-0.5 block">
                {incident.incident_id || incident.id}
              </span>
            </div>

            <div className="p-3 bg-[#FDFBF7] rounded-xl border border-[#E2D5C3]">
              <span className="text-[9px] text-[#8A7E70] uppercase font-bold block">
                SHIPMENT / MANIFEST
              </span>
              <span className="text-sm font-bold text-[#1F1D1A] mt-0.5 block">
                {incident.shipment_id}
              </span>
            </div>
          </div>

          {/* Incident Type & Time */}
          <div className="p-3.5 bg-[#FDFBF7] rounded-xl border border-[#E2D5C3] font-mono space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="text-[#8A7E70] uppercase font-bold">Issue Reported:</span>
              <span className="font-bold text-[#1F1D1A]">{incident.incident_type}</span>
            </div>
            <div className="flex items-center justify-between text-xs border-t border-[#E2D5C3]/60 pt-2">
              <span className="text-[#8A7E70] uppercase font-bold">Reported At:</span>
              <span className="text-[#1F1D1A]">{formatTimeIST(incident.timestamp)}</span>
            </div>
            {incident.product_type && (
              <div className="flex items-center justify-between text-xs border-t border-[#E2D5C3]/60 pt-2">
                <span className="text-[#8A7E70] uppercase font-bold">Cargo Category:</span>
                <span className="text-[#1F1D1A]">{incident.product_type}</span>
              </div>
            )}
            {incident.pickup_location && incident.destination && (
              <div className="flex items-center justify-between text-xs border-t border-[#E2D5C3]/60 pt-2">
                <span className="text-[#8A7E70] uppercase font-bold">Corridor:</span>
                <span className="text-[#1F1D1A]">
                  {incident.pickup_location} → {incident.destination}
                </span>
              </div>
            )}
          </div>

          {/* Driver Description */}
          <div className="p-4 bg-[#FDFBF7] rounded-xl border border-[#E2D5C3] space-y-1.5">
            <span className="text-[9px] font-mono text-[#8A7E70] uppercase font-bold tracking-wider block">
              DRIVER OBSERVATION & NOTES
            </span>
            <p className="text-xs text-[#1F1D1A] leading-relaxed whitespace-pre-wrap bg-[#FAF5EC] p-3 rounded-lg border border-[#E2D5C3] font-mono">
              "{incident.description}"
            </p>
          </div>

          {/* Photo Evidence Section */}
          <div className="p-4 bg-[#FDFBF7] rounded-xl border border-[#E2D5C3] space-y-2 font-mono">
            <span className="text-[9px] text-[#8A7E70] uppercase font-bold tracking-wider block">
              PHOTO EVIDENCE
            </span>
            {hasRealPhoto ? (
              <div className="space-y-2">
                <img
                  src={incident.photo_data}
                  alt={incident.photo_name || "Cargo Incident Evidence"}
                  className="w-full max-h-56 object-cover rounded-xl border border-[#E2D5C3]"
                />
                {incident.photo_name && (
                  <p className="text-[10px] text-[#5C5349] truncate">
                    File: {incident.photo_name}
                  </p>
                )}
              </div>
            ) : incident.photo_name ? (
              <div className="flex items-center gap-2 p-2.5 bg-[#FAF5EC] rounded-lg border border-[#E2D5C3] text-[11px] text-[#5C5349]">
                <Camera className="w-4 h-4 text-[#C85A32] shrink-0" />
                <span>
                  Photo recorded by driver: <strong>{incident.photo_name}</strong> (local terminal capture)
                </span>
              </div>
            ) : (
              <div className="p-2.5 bg-[#FAF5EC] rounded-lg border border-[#E2D5C3] text-[11px] text-[#8A7E70] italic">
                No photograph was attached with this report.
              </div>
            )}
          </div>

          {/* Incident Lifecycle Progression Timeline */}
          <div className="p-4 bg-[#FDFBF7] rounded-xl border border-[#E2D5C3] space-y-3 font-mono">
            <span className="text-[9px] text-[#8A7E70] uppercase font-bold tracking-wider block">
              INCIDENT LIFECYCLE TIMELINE
            </span>

            <div className="space-y-2.5 pl-2 border-l-2 border-[#E2D5C3]">
              {/* Step 1: Reported */}
              <div className="flex items-start gap-2.5 relative">
                <span className="w-2.5 h-2.5 rounded-full bg-[#C85A32] shrink-0 -ml-[18px] mt-0.5" />
                <div>
                  <div className="font-bold text-[#1F1D1A]">
                    {formatTimeIST(incident.timestamp || incident.created_at)} — Incident Reported
                  </div>
                  <div className="text-[10px] text-[#5C5349]">
                    Driver recorded observation: {incident.incident_type}
                  </div>
                </div>
              </div>

              {/* Step 2: Under Inspection */}
              {(incident.inspected_at || statusUpper === "UNDER INSPECTION" || statusUpper === "RESOLVED") && (
                <div className="flex items-start gap-2.5 relative">
                  <span
                    className={`w-2.5 h-2.5 rounded-full shrink-0 -ml-[18px] mt-0.5 ${
                      statusUpper === "RESOLVED" || incident.inspected_at
                        ? "bg-[#1D5E8A]"
                        : "bg-[#8A7E70]"
                    }`}
                  />
                  <div>
                    <div className="font-bold text-[#1F1D1A]">
                      {incident.inspected_at
                        ? formatTimeIST(incident.inspected_at)
                        : "In Progress"} — Driver Started Inspection
                    </div>
                    <div className="text-[10px] text-[#5C5349]">
                      Physical inspection of cargo integrity and packaging
                    </div>
                  </div>
                </div>
              )}

              {/* Step 3: Resolved */}
              {(incident.resolved_at || statusUpper === "RESOLVED") && (
                <div className="flex items-start gap-2.5 relative">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#2D5926] shrink-0 -ml-[18px] mt-0.5" />
                  <div>
                    <div className="font-bold text-[#2D5926]">
                      {incident.resolved_at
                        ? formatTimeIST(incident.resolved_at)
                        : "Completed"} — Incident Resolved
                    </div>
                    <div className="text-[10px] text-[#5C5349]">
                      Issue addressed and confirmed by driver
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Resolution Note if present */}
          {incident.resolution_note && (
            <div className="p-4 bg-[#EBF3EA] rounded-xl border border-[#C4DEC0] space-y-1.5 font-mono">
              <span className="text-[9px] text-[#2D5926] uppercase font-bold tracking-wider block">
                DRIVER RESOLUTION OUTCOME
              </span>
              <p className="text-xs text-[#1F1D1A] font-sans bg-[#FAF5EC] p-3 rounded-lg border border-[#C4DEC0]">
                "{incident.resolution_note}"
              </p>
            </div>
          )}

          {/* Standard Operational Message */}
          <div className="p-3 bg-[#FAF5EC] rounded-xl border border-[#E2D5C3] flex items-start gap-2.5 text-[11px] text-[#5C5349]">
            <Info className="w-4 h-4 text-[#C85A32] shrink-0 mt-0.5" />
            <p>
              {statusUpper === "RESOLVED"
                ? "The reported shipment issue has been resolved. Cargo transit continues toward destination."
                : statusUpper === "UNDER INSPECTION"
                ? "Your driver is currently inspecting the shipment. Real-time updates will reflect here."
                : "The driver has reported an issue with your shipment. The cargo is currently being inspected."}
            </p>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-4 bg-[#FDFBF7] border-t border-[#E2D5C3] flex justify-end">
          <button
            onClick={onClose}
            className="px-6 py-2.5 bg-[#1F1D1A] hover:bg-[#3D352E] text-[#FDFBF7] rounded-full text-xs font-mono font-bold uppercase tracking-wider transition-all cursor-pointer shadow-sm"
          >
            Acknowledge & Close
          </button>
        </div>
      </div>
    </div>
  );
}

/**
 * Customer Incident Notification Banner with Polling
 *
 * Checks for newly reported incidents for the customer's shipments every 12 seconds.
 * Strictly requires real backend data (no mock/fake timers).
 */
export default function CustomerIncidentNotification({ activeShipmentId = null }) {
  const { user, getAuthHeaders, isAuthenticated } = useAuth();
  const [incidents, setIncidents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedIncident, setSelectedIncident] = useState(null);
  const [activeTab, setActiveTab] = useState(0);

  const isMountedRef = useRef(true);

  const fetchIncidents = async () => {
    try {
      const headers = getAuthHeaders ? getAuthHeaders() : {};
      const data = await getCustomerIncidents(headers);

      if (isMountedRef.current) {
        // If an activeShipmentId is provided, filter or prioritize that shipment
        let filtered = Array.isArray(data) ? data : [];
        if (activeShipmentId) {
          filtered = filtered.filter((inc) => inc.shipment_id === activeShipmentId);
        }
        setIncidents(filtered);
        setLoading(false);
      }
    } catch (err) {
      if (isMountedRef.current) {
        setLoading(false);
      }
    }
  };

  useEffect(() => {
    isMountedRef.current = true;
    fetchIncidents();

    // 12-second polling interval
    const intervalId = setInterval(() => {
      fetchIncidents();
    }, 12000);

    return () => {
      isMountedRef.current = false;
      clearInterval(intervalId);
    };
  }, [activeShipmentId, user]);

  if (loading || incidents.length === 0) {
    return null;
  }

  // Display the currently selected tab incident or the first one
  const currentIncident = incidents[activeTab] || incidents[0];
  const severityUpper = String(currentIncident.severity || "MEDIUM").toUpperCase();
  const currentStatus = String(currentIncident.status || "REPORTED").toUpperCase();

  const isResolved = currentStatus === "RESOLVED";
  const isUnderInspection = currentStatus === "UNDER INSPECTION";

  const isHigh = severityUpper === "HIGH" && !isResolved;
  const isMedium = severityUpper === "MEDIUM" && !isResolved;

  // Clear customer message based on status per specifications
  let customerMessage = "Your driver has reported an issue with this shipment.";
  if (isUnderInspection) {
    customerMessage = "Your driver is currently inspecting the shipment.";
  } else if (isResolved) {
    customerMessage = "The reported shipment issue has been resolved.";
  }

  return (
    <>
      <div
        className={`rounded-2xl border p-4 sm:p-5 shadow-sm transition-all duration-200 animate-fade-in font-sans ${
          isResolved
            ? "bg-[#EBF3EA] border-[#C4DEC0]"
            : isUnderInspection
            ? "bg-[#F3F7FA] border-[#BDD4E7]"
            : isHigh
            ? "bg-[#FDF0EA] border-[#F5CABA]"
            : "bg-[#FEF6E8] border-[#F2D7A5]"
        }`}
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          {/* Header Title & Urgency */}
          <div className="flex items-center gap-3">
            <div
              className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                isResolved
                  ? "bg-[#2D5926] text-[#FFFFFF]"
                  : isUnderInspection
                  ? "bg-[#1D5E8A] text-[#FFFFFF]"
                  : isHigh
                  ? "bg-[#BA4336] text-[#FFFFFF]"
                  : "bg-[#B8711E] text-[#FFFFFF]"
              }`}
            >
              {isResolved ? (
                <CheckCircle2 className="w-5 h-5" />
              ) : (
                <AlertTriangle className="w-5 h-5 animate-pulse" />
              )}
            </div>

            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-black uppercase tracking-wider text-[#1F1D1A] font-mono">
                  {isResolved ? "✓ Incident Resolved" : "🚨 Shipment Incident"}
                </span>
                <span
                  className={`text-[9px] font-mono font-bold px-2 py-0.5 rounded-full border ${
                    isResolved
                      ? "bg-[#FAF5EC] text-[#2D5926] border-[#C4DEC0]"
                      : isUnderInspection
                      ? "bg-[#FAF5EC] text-[#1D5E8A] border-[#BDD4E7]"
                      : "bg-[#FAF5EC] text-[#C85A32] border-[#F5CABA]"
                  }`}
                >
                  ● {currentStatus}
                </span>
                {incidents.length > 1 && (
                  <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-[#1F1D1A] text-[#FDFBF7]">
                    {incidents.length} REPORTS
                  </span>
                )}
              </div>
              <p className="text-[11px] text-[#5C5349] mt-0.5 font-medium">
                {customerMessage}
              </p>
            </div>
          </div>

          {/* Action Button */}
          <button
            onClick={() => setSelectedIncident(currentIncident)}
            className="self-start sm:self-center px-4 py-2 bg-[#1F1D1A] hover:bg-[#3D352E] text-[#FDFBF7] rounded-full text-xs font-mono font-bold uppercase tracking-wider transition-all cursor-pointer inline-flex items-center gap-1.5 shadow-sm active:scale-[0.98] shrink-0"
          >
            <Eye className="w-3.5 h-3.5 text-[#C85A32]" />
            <span>View Details</span>
          </button>
        </div>

        {/* Incident Summary Pill Grid */}
        <div className="mt-3 pt-3 border-t border-[#1F1D1A]/10 grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-xs font-mono">
          <div className="p-2.5 bg-[#FAF5EC]/80 rounded-xl border border-[#E2D5C3]/60">
            <span className="text-[9px] text-[#8A7E70] uppercase font-bold block">SHIPMENT</span>
            <span className="font-bold text-[#1F1D1A] truncate block mt-0.5">
              {currentIncident.shipment_id}
            </span>
          </div>

          <div className="p-2.5 bg-[#FAF5EC]/80 rounded-xl border border-[#E2D5C3]/60">
            <span className="text-[9px] text-[#8A7E70] uppercase font-bold block">ISSUE</span>
            <span className="font-bold text-[#1F1D1A] truncate block mt-0.5">
              {currentIncident.incident_type}
            </span>
          </div>

          <div className="p-2.5 bg-[#FAF5EC]/80 rounded-xl border border-[#E2D5C3]/60">
            <span className="text-[9px] text-[#8A7E70] uppercase font-bold block">SEVERITY</span>
            <span
              className={`font-bold text-[10px] px-2 py-0.5 rounded-full inline-block mt-0.5 border ${
                isHigh
                  ? "bg-[#FDF0EA] text-[#BA4336] border-[#F5CABA]"
                  : isMedium
                  ? "bg-[#FEF6E8] text-[#B8711E] border-[#F2D7A5]"
                  : "bg-[#EBF3EA] text-[#2D5926] border-[#C4DEC0]"
              }`}
            >
              {severityUpper}
            </span>
          </div>

          <div className="p-2.5 bg-[#FAF5EC]/80 rounded-xl border border-[#E2D5C3]/60">
            <span className="text-[9px] text-[#8A7E70] uppercase font-bold block">REPORTED</span>
            <span className="text-[11px] text-[#1F1D1A] truncate block mt-0.5">
              {formatTimeIST(currentIncident.timestamp)}
            </span>
          </div>
        </div>

        {/* Tab switcher if multiple incidents are present */}
        {incidents.length > 1 && (
          <div className="mt-3 flex items-center gap-1.5 font-mono text-[10px] overflow-x-auto pb-1">
            <span className="text-[#8A7E70] uppercase font-bold mr-1">Switch Manifest:</span>
            {incidents.map((inc, idx) => (
              <button
                key={inc.incident_id || idx}
                onClick={() => setActiveTab(idx)}
                className={`px-2.5 py-1 rounded-lg border transition-all cursor-pointer font-bold ${
                  activeTab === idx
                    ? "bg-[#1F1D1A] text-[#FDFBF7] border-[#1F1D1A]"
                    : "bg-[#FAF5EC] text-[#5C5349] border-[#E2D5C3] hover:text-[#1F1D1A]"
                }`}
              >
                {inc.shipment_id} ({inc.severity})
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Details Inspector Modal */}
      {selectedIncident && (
        <CustomerIncidentDetailModal
          incident={selectedIncident}
          onClose={() => setSelectedIncident(null)}
        />
      )}
    </>
  );
}
