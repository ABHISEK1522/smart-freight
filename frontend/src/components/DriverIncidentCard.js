"use client";

import React, { useState } from "react";
import {
  AlertTriangle,
  Search,
  CheckCircle2,
  Clock,
  ArrowRight,
  ShieldCheck,
  Check,
  X,
  FileText,
} from "lucide-react";
import { updateIncidentStatus } from "@/services/incidentService";

/**
 * Format timestamp to friendly IST time
 */
function formatIST(isoStr) {
  if (!isoStr) return "Just now";
  try {
    const d = new Date(isoStr);
    if (isNaN(d.getTime())) return isoStr;
    return d.toLocaleTimeString("en-IN", {
      timeZone: "Asia/Kolkata",
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });
  } catch {
    return isoStr;
  }
}

/**
 * DriverIncidentCard
 *
 * Displays an active or resolved incident on the Driver Dashboard with one-click lifecycle actions:
 * - REPORTED -> [ START INSPECTION ]
 * - UNDER INSPECTION -> [ MARK RESOLVED ] (with optional resolution note)
 * - RESOLVED -> Green verification state
 */
export default function DriverIncidentCard({
  incident,
  onStatusUpdated,
  authHeaders = {},
}) {
  const [updating, setUpdating] = useState(false);
  const [showResolveModal, setShowResolveModal] = useState(false);
  const [resolutionNote, setResolutionNote] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  if (!incident) return null;

  const incId = incident.incident_id || incident.id;
  const status = (incident.status || "REPORTED").toUpperCase();
  const severityUpper = String(incident.severity || "MEDIUM").toUpperCase();

  const isHigh = severityUpper === "HIGH";
  const isMedium = severityUpper === "MEDIUM";

  const isReported = status === "REPORTED";
  const isUnderInspection = status === "UNDER INSPECTION";
  const isResolved = status === "RESOLVED";

  const handleStartInspection = async () => {
    setUpdating(true);
    setErrorMsg("");
    try {
      const updated = await updateIncidentStatus(
        incId,
        "UNDER INSPECTION",
        null,
        authHeaders
      );
      if (updated) {
        if (onStatusUpdated) onStatusUpdated(updated);
      } else {
        setErrorMsg("Failed to update status. Please retry.");
      }
    } catch (err) {
      setErrorMsg("Network error updating status.");
    } finally {
      setUpdating(false);
    }
  };

  const handleMarkResolved = async (e) => {
    if (e) e.preventDefault();
    setUpdating(true);
    setErrorMsg("");
    try {
      const updated = await updateIncidentStatus(
        incId,
        "RESOLVED",
        resolutionNote.trim() || null,
        authHeaders
      );
      if (updated) {
        setShowResolveModal(false);
        if (onStatusUpdated) onStatusUpdated(updated);
      } else {
        setErrorMsg("Failed to mark resolved. Please retry.");
      }
    } catch (err) {
      setErrorMsg("Network error marking resolved.");
    } finally {
      setUpdating(false);
    }
  };

  return (
    <>
      <div
        className={`rounded-2xl border p-4 sm:p-5 font-mono text-xs transition-all shadow-xs ${
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
          {/* Top Identifier & Tags */}
          <div className="flex items-center gap-2.5">
            <div
              className={`w-7 h-7 rounded-lg flex items-center justify-center font-bold text-[10px] ${
                isResolved
                  ? "bg-[#FAF5EC] text-[#2D5926] border border-[#C4DEC0]"
                  : isUnderInspection
                  ? "bg-[#FAF5EC] text-[#1D5E8A] border border-[#BDD4E7]"
                  : "bg-[#FAF5EC] text-[#C85A32] border border-[#F5CABA]"
              }`}
            >
              {isResolved ? <Check className="w-4 h-4" /> : <AlertTriangle className="w-4 h-4" />}
            </div>

            <div>
              <div className="flex items-center gap-2">
                <span className="font-black text-[#1F1D1A] tracking-wider text-xs">
                  INCIDENT #{incId}
                </span>
                <span
                  className={`text-[9px] font-bold px-2 py-0.5 rounded-full border ${
                    isHigh
                      ? "bg-[#FAF5EC] text-[#BA4336] border-[#F5CABA]"
                      : isMedium
                      ? "bg-[#FAF5EC] text-[#B8711E] border-[#F2D7A5]"
                      : "bg-[#FAF5EC] text-[#2D5926] border-[#C4DEC0]"
                  }`}
                >
                  {severityUpper}
                </span>
              </div>
              <div className="text-[10px] text-[#5C5349] mt-0.5">
                Shipment: <strong>{incident.shipment_id}</strong> · Reported:{" "}
                <strong>{formatIST(incident.timestamp || incident.created_at)}</strong>
              </div>
            </div>
          </div>

          {/* Status Badge & Primary Action */}
          <div className="flex items-center gap-2.5 self-start sm:self-center shrink-0">
            <div className="text-right">
              <span className="text-[8px] text-[#8A7E70] uppercase font-bold block">STATUS</span>
              <span
                className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full border inline-block mt-0.5 ${
                  isResolved
                    ? "bg-[#FAF5EC] text-[#2D5926] border-[#C4DEC0]"
                    : isUnderInspection
                    ? "bg-[#FAF5EC] text-[#1D5E8A] border-[#BDD4E7] animate-pulse"
                    : "bg-[#FAF5EC] text-[#C85A32] border-[#F5CABA]"
                }`}
              >
                ● {status}
              </span>
            </div>

            {/* Action 1: REPORTED -> START INSPECTION */}
            {isReported && (
              <button
                type="button"
                disabled={updating}
                onClick={handleStartInspection}
                className="px-3.5 py-2 bg-[#1F1D1A] hover:bg-[#3D352E] text-[#FDFBF7] rounded-full text-[11px] font-bold uppercase tracking-wider transition-all cursor-pointer inline-flex items-center gap-1.5 shadow-sm active:scale-[0.98] disabled:opacity-50"
              >
                <Search className="w-3.5 h-3.5 text-[#C85A32]" />
                <span>{updating ? "Updating..." : "START INSPECTION"}</span>
              </button>
            )}

            {/* Action 2: UNDER INSPECTION -> MARK RESOLVED */}
            {isUnderInspection && (
              <button
                type="button"
                disabled={updating}
                onClick={() => setShowResolveModal(true)}
                className="px-3.5 py-2 bg-[#2D5926] hover:bg-[#23471E] text-[#FDFBF7] rounded-full text-[11px] font-bold uppercase tracking-wider transition-all cursor-pointer inline-flex items-center gap-1.5 shadow-sm active:scale-[0.98] disabled:opacity-50"
              >
                <CheckCircle2 className="w-3.5 h-3.5 text-[#C4DEC0]" />
                <span>{updating ? "Updating..." : "MARK RESOLVED"}</span>
              </button>
            )}

            {/* Action 3: RESOLVED State indicator */}
            {isResolved && (
              <span className="px-3 py-1.5 bg-[#FAF5EC] text-[#2D5926] border border-[#C4DEC0] rounded-full text-[10px] font-bold inline-flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>RESOLVED</span>
              </span>
            )}
          </div>
        </div>

        {/* Issue Type & Observation Description */}
        <div className="mt-3 pt-3 border-t border-[#1F1D1A]/10 space-y-1.5 text-[11px]">
          <div className="flex items-center justify-between text-[#1F1D1A]">
            <span>
              Issue Type: <strong>{incident.incident_type}</strong>
            </span>
            {incident.inspected_at && !isResolved && (
              <span className="text-[10px] text-[#1D5E8A]">
                Inspection started: {formatIST(incident.inspected_at)}
              </span>
            )}
          </div>

          <p className="text-[#3E3832] bg-[#FAF5EC]/70 p-2.5 rounded-xl border border-[#E2D5C3]/60 leading-relaxed font-sans text-xs">
            "{incident.description}"
          </p>

          {/* Resolution Note if resolved */}
          {isResolved && incident.resolution_note && (
            <div className="p-2.5 bg-[#FAF5EC] rounded-xl border border-[#C4DEC0] text-[#2D5926] text-[11px] space-y-1">
              <span className="font-bold block uppercase text-[9px] text-[#2D5926]">
                RESOLUTION SUMMARY:
              </span>
              <p className="font-sans text-xs text-[#1F1D1A]">
                "{incident.resolution_note}"
              </p>
            </div>
          )}
        </div>

        {errorMsg && (
          <div className="mt-2 text-[10px] text-[#BA4336] font-bold">{errorMsg}</div>
        )}
      </div>

      {/* Optional Resolution Note Modal */}
      {showResolveModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#1F1D1A]/60 backdrop-blur-xs select-none"
          onClick={() => setShowResolveModal(false)}
        >
          <div
            className="w-full max-w-md bg-[#FAF5EC] border border-[#E2D5C3] rounded-3xl shadow-2xl p-6 space-y-4 font-mono text-xs"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-[#E2D5C3] pb-3">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-[#2D5926]" />
                <h3 className="text-sm font-bold text-[#1F1D1A] uppercase">
                  Resolve Incident #{incId}
                </h3>
              </div>
              <button
                onClick={() => setShowResolveModal(false)}
                className="text-[#8A7E70] hover:text-[#1F1D1A]"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-[#5C5349] font-sans">
              Provide an optional note summarizing the inspection outcome before notifying the customer:
            </p>

            <div>
              <textarea
                value={resolutionNote}
                onChange={(e) => setResolutionNote(e.target.value)}
                placeholder="e.g. Damaged outer packaging inspected. Internal cargo verified undamaged and secure."
                rows={3}
                className="w-full p-3 bg-[#FDFBF7] border border-[#DCCFBC] focus:border-[#2D5926] rounded-xl text-[#1F1D1A] text-xs font-sans focus:outline-none"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#E2D5C3]">
              <button
                type="button"
                onClick={() => setShowResolveModal(false)}
                className="px-4 py-2 bg-[#FAF5EC] hover:bg-[#E2D5C3]/50 text-[#5C5349] rounded-full text-xs font-bold uppercase cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={updating}
                onClick={handleMarkResolved}
                className="px-5 py-2 bg-[#2D5926] hover:bg-[#23471E] text-[#FDFBF7] rounded-full text-xs font-bold uppercase tracking-wider transition-all cursor-pointer shadow-sm active:scale-[0.98] disabled:opacity-50 inline-flex items-center gap-1.5"
              >
                <Check className="w-3.5 h-3.5" />
                <span>{updating ? "Saving..." : "Confirm Resolved"}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
