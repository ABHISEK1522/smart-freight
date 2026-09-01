"use client";

import React, { useState } from "react";
import {
  AlertTriangle,
  X,
  Check,
  ChevronDown,
  ChevronUp,
  Activity,
  Thermometer,
  Zap,
  Info,
} from "lucide-react";

/**
 * DriverTelemetryAlert
 *
 * Highly visible, polished, non-blocking telemetry alert banner for Driver Dashboard.
 * Rule: Displays "Potential Incident Detected" — never claims cargo is damaged
 * until the driver confirms after physical inspection.
 */
export default function DriverTelemetryAlert({
  alert,
  onInspect,
  onConfirmIncident,
  onDismiss,
}) {
  const [isExpanded, setIsExpanded] = useState(false);

  if (!alert || !alert.triggered) return null;

  const severityUpper = String(alert.severity || "MEDIUM").toUpperCase();
  const isHigh = severityUpper === "HIGH";
  const isMedium = severityUpper === "MEDIUM";

  const isImpact = alert.rule_type === "SUDDEN_IMPACT";
  const isBraking = alert.rule_type === "HARSH_BRAKING";

  return (
    <div
      className={`rounded-2xl border p-4 sm:p-5 shadow-lg transition-all duration-200 animate-fade-in font-sans select-none ${
        isHigh
          ? "bg-[#FDF0EA] border-[#F5CABA]"
          : isMedium
          ? "bg-[#FEF6E8] border-[#F2D7A5]"
          : "bg-[#FAF4E8] border-[#D4C3AC]"
      }`}
    >
      {/* Primary Alert Header & Details */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div className="flex items-start gap-3.5">
          <div
            className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 shadow-xs ${
              isHigh
                ? "bg-[#BA4336] text-[#FFFFFF]"
                : isMedium
                ? "bg-[#B8711E] text-[#FFFFFF]"
                : "bg-[#2D5926] text-[#FFFFFF]"
            }`}
          >
            {isImpact ? (
              <Zap className="w-5 h-5 animate-pulse" />
            ) : (
              <AlertTriangle className="w-5 h-5 animate-pulse" />
            )}
          </div>

          <div className="space-y-1">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs font-black uppercase tracking-wider text-[#1F1D1A] font-mono">
                ⚠ {alert.title || "POTENTIAL INCIDENT DETECTED"}
              </span>
              <span
                className={`font-mono font-bold text-[10px] px-2.5 py-0.5 rounded-full border ${
                  isHigh
                    ? "bg-[#FAF5EC] text-[#BA4336] border-[#F5CABA]"
                    : isMedium
                    ? "bg-[#FAF5EC] text-[#B8711E] border-[#F2D7A5]"
                    : "bg-[#FAF5EC] text-[#2D5926] border-[#C4DEC0]"
                }`}
              >
                SEVERITY: {severityUpper}
              </span>
            </div>

            <p className="text-xs text-[#1F1D1A] leading-relaxed">
              {alert.message || "Anomalous vehicle telemetry reading detected. Verify cargo condition."}
            </p>

            <div className="flex flex-wrap items-center gap-3 text-[11px] font-mono text-[#5C5349] pt-1">
              <span>
                Shipment: <strong className="text-[#1F1D1A]">{alert.shipment_id}</strong>
              </span>
              <span>•</span>
              <span>
                Vehicle: <strong className="text-[#1F1D1A]">{alert.vehicle || "Current Vehicle"}</strong>
              </span>
              <span>•</span>
              <span>
                Detected: <strong className="text-[#1F1D1A]">{alert.detected_at || "Just now"}</strong>
              </span>
            </div>
          </div>
        </div>

        {/* Action Button Row */}
        <div className="flex flex-wrap items-center gap-2 pt-2 lg:pt-0 self-start lg:self-center shrink-0 font-mono">
          {/* INSPECT */}
          <button
            type="button"
            onClick={() => {
              setIsExpanded(!isExpanded);
              if (onInspect) onInspect(alert);
            }}
            className="px-3.5 py-2 bg-[#FDFBF7] hover:bg-[#FAF5EC] text-[#1F1D1A] border border-[#E2D5C3] rounded-full text-xs font-bold transition-all cursor-pointer inline-flex items-center gap-1 shadow-xs active:scale-[0.98]"
            title="Inspect sensor telemetry values"
          >
            <Activity className="w-3.5 h-3.5 text-[#8A7E70]" />
            <span>INSPECT</span>
            {isExpanded ? (
              <ChevronUp className="w-3.5 h-3.5 text-[#8A7E70]" />
            ) : (
              <ChevronDown className="w-3.5 h-3.5 text-[#8A7E70]" />
            )}
          </button>

          {/* CONFIRM INCIDENT */}
          <button
            type="button"
            onClick={() => onConfirmIncident && onConfirmIncident(alert)}
            className="px-4 py-2 bg-[#1F1D1A] hover:bg-[#3D352E] text-[#FDFBF7] rounded-full text-xs font-bold uppercase tracking-wider transition-all cursor-pointer inline-flex items-center gap-1.5 shadow-sm active:scale-[0.98]"
            title="Open incident form with pre-filled telemetry data"
          >
            <Check className="w-3.5 h-3.5 text-[#C85A32]" />
            <span>CONFIRM INCIDENT</span>
          </button>

          {/* DISMISS */}
          <button
            type="button"
            onClick={() => onDismiss && onDismiss(alert)}
            className="px-3.5 py-2 bg-[#FAF5EC] hover:bg-[#FAF0E2] text-[#8A7E70] hover:text-[#1F1D1A] border border-[#E2D5C3] rounded-full text-xs font-bold transition-all cursor-pointer inline-flex items-center gap-1 active:scale-[0.98]"
            title="Dismiss alert without creating incident"
          >
            <X className="w-3.5 h-3.5" />
            <span>DISMISS</span>
          </button>
        </div>
      </div>

      {/* Expanded Telemetry Diagnostics Panel */}
      {isExpanded && (
        <div className="mt-4 pt-3.5 border-t border-[#E2D5C3] space-y-3 font-mono text-xs">
          <div className="p-3 bg-[#FAF5EC] rounded-xl border border-[#E2D5C3] space-y-2">
            <div className="flex items-center justify-between text-[11px] font-bold text-[#1F1D1A]">
              <span>TELEMETRY DIAGNOSTIC SNAPSHOT</span>
              <span className="text-[10px] text-[#8A7E70] uppercase">
                SOURCE: VEHICLE CAN-BUS & IOT SENSOR
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 pt-1">
              {alert.telemetry_snapshot?.current_temp_c != null && (
                <div className="p-2 bg-[#FDFBF7] rounded-lg border border-[#E2D5C3]">
                  <span className="text-[9px] text-[#8A7E70] uppercase block font-bold">CARGO TEMP</span>
                  <span className="text-xs font-bold text-[#C85A32]">
                    {alert.telemetry_snapshot.current_temp_c}°C
                  </span>
                  <span className="text-[9px] text-[#5C5349] block">
                    Range: {alert.telemetry_snapshot.required_range || "2.0°C - 8.0°C"}
                  </span>
                </div>
              )}

              {alert.telemetry_snapshot?.impact_g != null && (
                <div className="p-2 bg-[#FDFBF7] rounded-lg border border-[#E2D5C3]">
                  <span className="text-[9px] text-[#8A7E70] uppercase block font-bold">IMPACT FORCE</span>
                  <span className="text-xs font-bold text-[#BA4336]">
                    {alert.telemetry_snapshot.impact_g.toFixed(1)}g
                  </span>
                  <span className="text-[9px] text-[#5C5349] block">Threshold: 1.8g</span>
                </div>
              )}

              {alert.telemetry_snapshot?.decel_mps2 != null && (
                <div className="p-2 bg-[#FDFBF7] rounded-lg border border-[#E2D5C3]">
                  <span className="text-[9px] text-[#8A7E70] uppercase block font-bold">DECELERATION</span>
                  <span className="text-xs font-bold text-[#B8711E]">
                    {alert.telemetry_snapshot.decel_mps2.toFixed(1)} m/s²
                  </span>
                  <span className="text-[9px] text-[#5C5349] block">Threshold: -4.5 m/s²</span>
                </div>
              )}
            </div>

            <div className="flex items-center gap-1.5 text-[10px] text-[#5C5349] pt-1">
              <Info className="w-3.5 h-3.5 text-[#C85A32] shrink-0" />
              <span>
                Safety note: This alert indicates anomalous telemetry. It does <strong>not</strong> prove cargo is damaged. Inspect physically before confirming.
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
