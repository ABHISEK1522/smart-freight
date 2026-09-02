"use client";

import React, { useState, useEffect } from "react";
import {
  ShieldAlert,
  ShieldCheck,
  AlertTriangle,
  CheckCircle2,
  Clock,
  FileText,
  Sparkles,
  Info,
  ChevronDown,
  ChevronUp,
  Cpu,
  Database,
  Search,
  Eye,
  Activity,
  Layers,
  Check,
  XCircle,
  HelpCircle,
} from "lucide-react";

export default function DamageRiskSection({
  shipmentId,
  incidents = [],
  apiBaseUrl = "http://127.0.0.1:8000",
  getAuthHeaders,
}) {
  const [pipelineStats, setPipelineStats] = useState(null);
  const [showHowItWorks, setShowHowItWorks] = useState(false);
  const [showWhyModal, setShowWhyModal] = useState(false);

  useEffect(() => {
    const fetchPipeline = async () => {
      try {
        const res = await fetch(`${apiBaseUrl}/damage-risk/pipeline-status`);
        if (res.ok) {
          const data = await res.json();
          setPipelineStats(data);
        }
      } catch (err) {
        console.warn("Failed to fetch damage pipeline stats:", err);
      }
    };
    fetchPipeline();
  }, [apiBaseUrl]);

  const verifiedCount = pipelineStats?.verified_damage_samples || 0;
  const targetThreshold = pipelineStats?.threshold_required || 50;
  const progressPct = Math.min(Math.round((verifiedCount / targetThreshold) * 100), 100);

  // Compute Cargo Condition from live incidents
  let cargoCondition = "Normal";
  let riskStatus = "Low";
  let hasVerifiedDamage = false;
  let hasTemperatureIssue = false;
  let hasDamageSpillage = false;
  let lastInspectionTime = null;

  if (incidents && incidents.length > 0) {
    const latest = incidents[0];
    const st = latest.status || "REPORTED";

    if (st === "REPORTED") {
      cargoCondition = "Incident Reported";
      riskStatus = latest.severity === "High" ? "High" : "Medium";
    } else if (st === "UNDER INSPECTION") {
      cargoCondition = "Under Inspection";
      riskStatus = latest.severity === "High" ? "High" : "Medium";
    } else if (st === "RESOLVED" || st === "DAMAGE VERIFIED") {
      if (latest.is_verified_damage === 1) {
        cargoCondition = "Damage Verified";
        riskStatus = "Medium";
      } else {
        cargoCondition = "Resolved";
        riskStatus = "Low";
      }
    } else if (st === "DISMISSED") {
      cargoCondition = "Resolved";
      riskStatus = "Low";
    }

    hasVerifiedDamage = incidents.some((i) => i.is_verified_damage === 1);
    hasTemperatureIssue = incidents.some((i) => i.incident_type === "Temperature Issue");
    hasDamageSpillage = incidents.some((i) =>
      ["Spillage", "Package Damage", "Seal Broken"].includes(i.incident_type)
    );
    lastInspectionTime =
      latest.inspected_at || latest.resolved_at || latest.timestamp;
  }

  const conditionBadges = {
    Normal: { bg: "bg-[#EBF3EA]", text: "text-[#2D5224]", border: "border-[#C4DEC0]" },
    Monitoring: { bg: "bg-[#FAF4E8]", text: "text-[#C85A32]", border: "border-[#E2D5C3]" },
    "Incident Reported": { bg: "bg-[#FDF0EA]", text: "text-[#BA4336]", border: "border-[#F5CABA]" },
    "Under Inspection": { bg: "bg-[#FAF4E8]", text: "text-[#D49A29]", border: "border-[#E2D5C3]" },
    "Damage Verified": { bg: "bg-[#FDF0EA]", text: "text-[#BA4336]", border: "border-[#F5CABA]" },
    Resolved: { bg: "bg-[#EBF3EA]", text: "text-[#2D5224]", border: "border-[#C4DEC0]" },
  };

  const badgeStyle = conditionBadges[cargoCondition] || conditionBadges.Normal;

  return (
    <div className="space-y-4 font-mono">
      {/* 1. COMPACT DAMAGE & CARGO RISK CARD */}
      <div className="bg-[#FDFBF7] border border-[#E2D5C3] rounded-2xl p-5 shadow-sm space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#E2D5C3] pb-3">
          <div className="flex items-center gap-2">
            <ShieldAlert className="w-4 h-4 text-[#C85A32]" />
            <span className="text-xs font-bold uppercase tracking-wider text-[#1F1D1A]">
              Damage & Cargo Risk Overview
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowWhyModal(true)}
              className="text-[10px] text-[#5C5349] hover:text-[#1F1D1A] flex items-center gap-1 cursor-pointer underline underline-offset-2"
            >
              <HelpCircle className="w-3 h-3 text-[#C85A32]" />
              <span>Why collect incident data?</span>
            </button>

            <span
              className={`text-[9px] font-bold px-2.5 py-0.5 rounded-full border ${badgeStyle.bg} ${badgeStyle.text} ${badgeStyle.border}`}
            >
              CONDITION: {cargoCondition.toUpperCase()}
            </span>
          </div>
        </div>

        {/* Status Metrics Strip */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
          <div className="p-3 bg-[#FAF5EC] border border-[#E2D5C3] rounded-xl">
            <span className="text-[8px] text-[#8A7E70] uppercase tracking-wider block font-bold">
              Risk Level
            </span>
            <div
              className={`text-sm font-bold mt-0.5 ${
                riskStatus === "High"
                  ? "text-[#BA4336]"
                  : riskStatus === "Medium"
                  ? "text-[#D49A29]"
                  : "text-[#4D6A42]"
              }`}
            >
              {riskStatus.toUpperCase()} RISK
            </div>
            <span className="text-[9px] text-[#5C5349]">Pre-dispatch Baseline</span>
          </div>

          <div className="p-3 bg-[#FAF5EC] border border-[#E2D5C3] rounded-xl">
            <span className="text-[8px] text-[#8A7E70] uppercase tracking-wider block font-bold">
              Incident Count
            </span>
            <div className="text-sm font-bold text-[#1F1D1A] mt-0.5">
              {incidents.length}{" "}
              <span className="text-[9px] text-[#8A7E70] font-normal">
                {incidents.length === 1 ? "flag" : "flags"}
              </span>
            </div>
            <span className="text-[9px] text-[#5C5349]">
              {incidents.length === 0 ? "Clean Audit Trail" : "Active In Log"}
            </span>
          </div>

          <div className="p-3 bg-[#FAF5EC] border border-[#E2D5C3] rounded-xl">
            <span className="text-[8px] text-[#8A7E70] uppercase tracking-wider block font-bold">
              Cold-Chain / Thermal
            </span>
            <div
              className={`text-sm font-bold mt-0.5 ${
                hasTemperatureIssue ? "text-[#BA4336]" : "text-[#4D6A42]"
              }`}
            >
              {hasTemperatureIssue ? "⚠ EXCURSION" : "✓ NOMINAL"}
            </div>
            <span className="text-[9px] text-[#5C5349]">04.2°C Chiller Sensor</span>
          </div>

          <div className="p-3 bg-[#FAF5EC] border border-[#E2D5C3] rounded-xl">
            <span className="text-[8px] text-[#8A7E70] uppercase tracking-wider block font-bold">
              Last Inspection
            </span>
            <div className="text-sm font-bold text-[#1F1D1A] mt-0.5 truncate">
              {lastInspectionTime
                ? new Date(lastInspectionTime).toLocaleTimeString("en-IN", {
                    hour: "2-digit",
                    minute: "2-digit",
                  }) + " IST"
                : "Continuous IoT"}
            </div>
            <span className="text-[9px] text-[#5C5349]">
              {lastInspectionTime ? "Field Inspector Stamp" : "Active Telemetry"}
            </span>
          </div>
        </div>

        {/* Zero-Incident vs Active-Incident Summary Banner */}
        {incidents.length === 0 ? (
          <div className="p-3.5 bg-[#EBF3EA] border border-[#C4DEC0] rounded-xl flex items-center justify-between text-xs text-[#2D5224]">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-[#2D5224] shrink-0" />
              <span className="font-bold">✓ No cargo incidents reported</span>
            </div>
            <span className="text-[10px] text-[#4D6A42]">Manifest In Good Standing</span>
          </div>
        ) : (
          <div className="p-3.5 bg-[#FDF0EA] border border-[#F5CABA] rounded-xl space-y-2 text-xs">
            <div className="flex flex-wrap items-center justify-between gap-2 text-[#BA4336] font-bold">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-[#BA4336] shrink-0" />
                <span>⚠ Cargo incident reported on this shipment</span>
              </div>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#FAF5EC] border border-[#F5CABA]">
                {incidents[0].status}
              </span>
            </div>
            <div className="flex flex-wrap items-center gap-3 text-[11px] text-[#5C5349]">
              <span>
                TYPE: <strong className="text-[#1F1D1A]">{incidents[0].incident_type}</strong>
              </span>
              <span>•</span>
              <span>
                SEVERITY: <strong className="text-[#1F1D1A]">{incidents[0].severity}</strong>
              </span>
              <span>•</span>
              <span>
                REPORTED:{" "}
                <strong className="text-[#1F1D1A]">
                  {new Date(incidents[0].timestamp).toLocaleTimeString("en-IN", {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}{" "}
                  IST
                </strong>
              </span>
            </div>
          </div>
        )}
      </div>

      {/* 2. CONSUMER INCIDENT TIMELINE (If incidents exist) */}
      {incidents.length > 0 && (
        <div className="bg-[#FDFBF7] border border-[#E2D5C3] rounded-2xl p-5 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-[#E2D5C3] pb-3 text-xs">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-[#C85A32]" />
              <span className="font-bold uppercase tracking-wider text-[#1F1D1A]">
                Incident Inspection & Resolution Timeline
              </span>
            </div>
            <span className="text-[10px] text-[#8A7E70] font-bold">
              {incidents.length} {incidents.length === 1 ? "RECORD" : "RECORDS"}
            </span>
          </div>

          <div className="space-y-6 pt-1">
            {incidents.map((inc, incIdx) => {
              const isReported = !!inc.timestamp;
              const isUnderInspection = !!inc.inspected_at || inc.status !== "REPORTED";
              const isVerified =
                inc.status === "RESOLVED" ||
                inc.status === "DAMAGE VERIFIED" ||
                inc.status === "DISMISSED";
              const isResolved =
                inc.status === "RESOLVED" ||
                inc.status === "DAMAGE VERIFIED" ||
                inc.status === "DISMISSED";

              return (
                <div key={inc.id || incIdx} className="space-y-3">
                  <div className="flex items-center justify-between text-xs text-[#8A7E70] pb-1 border-b border-[#E2D5C3]/60">
                    <span className="font-bold text-[#1F1D1A]">
                      CASE #{inc.id} — {inc.incident_type}
                    </span>
                    <span className="text-[10px]">{inc.severity} Severity</span>
                  </div>

                  <div className="relative pl-6 space-y-4 before:absolute before:left-2 before:top-2 before:bottom-2 before:w-0.5 before:bg-[#E2D5C3]">
                    {/* Stage 1: Incident Reported */}
                    <div className="relative flex items-start gap-3 text-xs">
                      <div className="absolute -left-6 top-0.5 w-4 h-4 rounded-full bg-[#FAF5EC] border-2 border-[#BA4336] flex items-center justify-center">
                        <span className="w-1.5 h-1.5 rounded-full bg-[#BA4336]" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="font-bold text-[#1F1D1A] flex items-center justify-between">
                          <span>Incident Reported</span>
                          <span className="text-[10px] text-[#8A7E70]">
                            {new Date(inc.timestamp).toLocaleTimeString("en-IN", {
                              hour: "2-digit",
                              minute: "2-digit",
                            })}{" "}
                            IST
                          </span>
                        </div>
                        <p className="text-[11px] text-[#5C5349] mt-0.5">
                          {inc.description || "Cargo exception flagged during highway transport."}
                        </p>
                      </div>
                    </div>

                    {/* Stage 2: Inspection Initiated */}
                    <div className="relative flex items-start gap-3 text-xs">
                      <div
                        className={`absolute -left-6 top-0.5 w-4 h-4 rounded-full bg-[#FAF5EC] border-2 flex items-center justify-center ${
                          isUnderInspection
                            ? "border-[#D49A29]"
                            : "border-[#D4C3AC]"
                        }`}
                      >
                        <span
                          className={`w-1.5 h-1.5 rounded-full ${
                            isUnderInspection ? "bg-[#D49A29]" : "bg-[#D4C3AC]"
                          }`}
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="font-bold text-[#1F1D1A] flex items-center justify-between">
                          <span>Inspection Initiated</span>
                          <span className="text-[10px] text-[#8A7E70]">
                            {inc.inspected_at
                              ? new Date(inc.inspected_at).toLocaleTimeString("en-IN", {
                                  hour: "2-digit",
                                  minute: "2-digit",
                                }) + " IST"
                              : isUnderInspection
                              ? "In Progress"
                              : "Awaiting Dispatcher"}
                          </span>
                        </div>
                        <p className="text-[11px] text-[#5C5349] mt-0.5">
                          {isUnderInspection
                            ? "Physical seal inspection and cargo verification underway."
                            : "Scheduled upon next carrier checkpoint."}
                        </p>
                      </div>
                    </div>

                    {/* Stage 3: Verification */}
                    <div className="relative flex items-start gap-3 text-xs">
                      <div
                        className={`absolute -left-6 top-0.5 w-4 h-4 rounded-full bg-[#FAF5EC] border-2 flex items-center justify-center ${
                          isVerified
                            ? inc.is_verified_damage === 1
                              ? "border-[#BA4336]"
                              : "border-[#4D6A42]"
                            : "border-[#D4C3AC]"
                        }`}
                      >
                        <span
                          className={`w-1.5 h-1.5 rounded-full ${
                            isVerified
                              ? inc.is_verified_damage === 1
                                ? "bg-[#BA4336]"
                                : "bg-[#4D6A42]"
                              : "bg-[#D4C3AC]"
                          }`}
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="font-bold text-[#1F1D1A] flex items-center justify-between">
                          <span>Verification Outcome</span>
                          <span className="text-[10px] text-[#8A7E70]">
                            {inc.resolved_at
                              ? new Date(inc.resolved_at).toLocaleTimeString("en-IN", {
                                  hour: "2-digit",
                                  minute: "2-digit",
                                }) + " IST"
                              : "Pending"}
                          </span>
                        </div>
                        <div className="text-[11px] mt-0.5">
                          {isVerified ? (
                            inc.is_verified_damage === 1 ? (
                              <span className="text-[#BA4336] font-bold">
                                ⚠ Damage confirmed by physical inspection
                              </span>
                            ) : (
                              <span className="text-[#4D6A42] font-bold">
                                ✓ No damage detected (Packaging intact / False alarm dismissed)
                              </span>
                            )
                          ) : (
                            <span className="text-[#8A7E70]">
                              Awaiting physical inspection outcome
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Stage 4: Resolution & Operational Record */}
                    <div className="relative flex items-start gap-3 text-xs">
                      <div
                        className={`absolute -left-6 top-0.5 w-4 h-4 rounded-full bg-[#FAF5EC] border-2 flex items-center justify-center ${
                          isResolved ? "border-[#4D6A42]" : "border-[#D4C3AC]"
                        }`}
                      >
                        <span
                          className={`w-1.5 h-1.5 rounded-full ${
                            isResolved ? "bg-[#4D6A42]" : "bg-[#D4C3AC]"
                          }`}
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="font-bold text-[#1F1D1A] flex items-center justify-between">
                          <span>Resolution & Audit Record</span>
                          <span className="text-[10px] text-[#8A7E70]">
                            {isResolved ? "Closed" : "Open"}
                          </span>
                        </div>
                        {inc.resolution_note && (
                          <p className="text-[11px] text-[#2D5224] bg-[#EBF3EA] p-2 rounded-lg border border-[#C4DEC0] mt-1">
                            <strong>Note:</strong> {inc.resolution_note}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* MODEL 2 DATA STATUS TAG */}
                  <div className="p-3 bg-[#FAF5EC] rounded-xl border border-[#E2D5C3] text-xs flex flex-wrap items-center justify-between gap-2 mt-2">
                    <div className="flex items-center gap-2">
                      <Database className="w-3.5 h-3.5 text-[#C85A32]" />
                      <span className="font-bold text-[#1F1D1A]">MODEL 2 DATA STATUS:</span>
                      {inc.is_verified_damage === 1 ? (
                        <span className="px-2 py-0.5 rounded-full bg-[#EBF3EA] text-[#2D5224] border border-[#C4DEC0] text-[9px] font-bold">
                          [ VERIFIED ]
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded-full bg-[#FAF4E8] text-[#8A7E70] border border-[#E2D5C3] text-[9px] font-bold">
                          [ UNVERIFIED / OPERATIONAL RECORD ONLY ]
                        </span>
                      )}
                    </div>
                    <span className="text-[10px] text-[#5C5349]">
                      {inc.is_verified_damage === 1
                        ? "Training contribution: ✓ Included in Model 2 dataset"
                        : "Not included in training dataset (Unverified / Dismissed)"}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* 3. MODEL 2 — DAMAGE RISK LEARNING PANEL (Visible when damage is verified) */}
      {hasVerifiedDamage && (
        <div className="bg-[#FAF5EC] border-2 border-[#C85A32]/40 rounded-2xl p-5 shadow-sm space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#E2D5C3] pb-3">
            <div className="flex items-center gap-2">
              <Cpu className="w-4 h-4 text-[#C85A32] animate-pulse" />
              <span className="text-xs font-bold uppercase tracking-wider text-[#1F1D1A]">
                MODEL 2 — DAMAGE RISK LEARNING PIPELINE
              </span>
            </div>
            <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-[#FDF0EA] text-[#C85A32] border border-[#F5CABA]">
              ◉ LEARNING PIPELINE: ACTIVE
            </span>
          </div>

          <div className="space-y-2 text-xs text-[#1F1D1A]">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              <div className="p-2.5 bg-[#FDFBF7] rounded-xl border border-[#E2D5C3] flex items-center gap-2 text-[#2D5224]">
                <Check className="w-3.5 h-3.5 text-[#2D5224] shrink-0" />
                <span>Incident verified</span>
              </div>
              <div className="p-2.5 bg-[#FDFBF7] rounded-xl border border-[#E2D5C3] flex items-center gap-2 text-[#2D5224]">
                <Check className="w-3.5 h-3.5 text-[#2D5224] shrink-0" />
                <span>Evidence recorded</span>
              </div>
              <div className="p-2.5 bg-[#FDFBF7] rounded-xl border border-[#E2D5C3] flex items-center gap-2 text-[#2D5224]">
                <Check className="w-3.5 h-3.5 text-[#2D5224] shrink-0" />
                <span>Added to training dataset</span>
              </div>
            </div>

            <div className="p-3 bg-[#FDFBF7] rounded-xl border border-[#E2D5C3] space-y-2">
              <div className="flex items-center justify-between text-xs font-bold">
                <span className="text-[#5C5349]">Verified incidents collected:</span>
                <span className="text-[#C85A32]">
                  {verifiedCount} / {targetThreshold} verified samples
                </span>
              </div>

              {/* Progress bar */}
              <div className="w-full h-2.5 bg-[#E2D5C3] rounded-full overflow-hidden">
                <div
                  className="h-full bg-[#C85A32] transition-all duration-500 rounded-full"
                  style={{ width: `${progressPct}%` }}
                />
              </div>

              <p className="text-[11px] text-[#5C5349]">
                {verifiedCount < targetThreshold
                  ? "Model 2 is currently collecting verified operational data. Supervised training begins after sufficient verified examples are accumulated."
                  : `Operational data threshold reached (${verifiedCount} verified samples). Ready for supervised training.`}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* 4. EXPANDABLE CONSUMER-FACING EXPLANATION */}
      <div className="bg-[#FDFBF7] border border-[#E2D5C3] rounded-2xl overflow-hidden shadow-xs">
        <button
          onClick={() => setShowHowItWorks(!showHowItWorks)}
          className="w-full p-4 flex items-center justify-between text-left text-xs font-bold uppercase tracking-wider text-[#1F1D1A] hover:bg-[#FAF5EC] transition-colors cursor-pointer"
        >
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-[#C85A32]" />
            <span>How this improves future shipments</span>
          </div>
          {showHowItWorks ? (
            <ChevronUp className="w-4 h-4 text-[#8A7E70]" />
          ) : (
            <ChevronDown className="w-4 h-4 text-[#8A7E70]" />
          )}
        </button>

        {showHowItWorks && (
          <div className="p-4 pt-0 border-t border-[#E2D5C3]/50 text-xs text-[#5C5349] space-y-2.5 bg-[#FAF5EC]/50">
            <p className="leading-relaxed">
              Verified cargo incidents are used as operational learning data. As more
              incidents are inspected and confirmed, the system can learn which
              combinations of route, vehicle, cargo, temperature, handling and
              operational conditions are associated with damage.
            </p>
            <div className="p-2.5 bg-[#FDFBF7] rounded-xl border border-[#E2D5C3] text-[10px] text-[#8A7E70] italic">
              Note: Unverified reports and dismissed sensor alerts do NOT enter the
              training dataset. Only human-verified inspection records contribute to
              predictive model training.
            </div>
          </div>
        )}
      </div>

      {/* 5. WHY ARE WE COLLECTING INCIDENT DATA MODAL / TOOLTIP */}
      {showWhyModal && (
        <div className="fixed inset-0 z-50 bg-[#1F1D1A]/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-[#FAF5EC] border border-[#E2D5C3] rounded-3xl p-6 max-w-lg w-full shadow-2xl space-y-4 animate-scale-in">
            <div className="flex items-center justify-between border-b border-[#E2D5C3] pb-3">
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#1F1D1A]">
                <Info className="w-4 h-4 text-[#C85A32]" />
                <span>Why are we collecting incident data?</span>
              </div>
              <button
                onClick={() => setShowWhyModal(false)}
                className="p-1 hover:bg-[#EFE3D2] rounded-lg text-[#8A7E70] hover:text-[#1F1D1A] cursor-pointer"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-[#5C5349] leading-relaxed">
              Damage risk depends on more than the shipment itself. Route conditions,
              vehicle type, cargo characteristics, temperature exposure, handling events
              and operational conditions can all contribute.
            </p>

            <p className="text-xs text-[#1F1D1A] font-bold leading-relaxed">
              Verified incident data allows the system to eventually learn these patterns
              and identify higher-risk shipments before dispatch.
            </p>

            <div className="p-3 bg-[#FDFBF7] rounded-2xl border border-[#E2D5C3] text-[10px] text-[#5C5349] space-y-1">
              <div className="font-bold text-[#C85A32] uppercase">
                MODEL 2 ARCHITECTURAL TARGETS:
              </div>
              <div>• Product Fragility × Highway Vibration Fatigue</div>
              <div>• Reefer Excursion Severity × Transit Duration</div>
              <div>• Multi-drop Handling Staging Anomaly Scoring</div>
            </div>

            <div className="flex justify-end pt-2">
              <button
                onClick={() => setShowWhyModal(false)}
                className="px-5 py-2 bg-[#1F1D1A] hover:bg-[#3D352E] text-white rounded-full text-xs font-bold uppercase cursor-pointer"
              >
                Understood
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
