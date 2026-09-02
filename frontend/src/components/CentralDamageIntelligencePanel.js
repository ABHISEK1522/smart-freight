"use client";

import React, { useState, useEffect } from "react";
import {
  ShieldAlert,
  ShieldCheck,
  Cpu,
  Database,
  Info,
  Layers,
  Sparkles,
  AlertTriangle,
  CheckCircle2,
  RefreshCw,
  Clock,
  FileText,
  Activity,
  ArrowRight,
  HelpCircle,
} from "lucide-react";

export default function CentralDamageIntelligencePanel({
  apiBaseUrl = "http://127.0.0.1:8000",
}) {
  const [stats, setStats] = useState(null);
  const [pipeline, setPipeline] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showWhyModal, setShowWhyModal] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [statsRes, pipeRes] = await Promise.all([
        fetch(`${apiBaseUrl}/damage-risk/stats`),
        fetch(`${apiBaseUrl}/damage-risk/pipeline-status`),
      ]);

      if (statsRes.ok) {
        setStats(await statsRes.json());
      }
      if (pipeRes.ok) {
        setPipeline(await pipeRes.json());
      }
    } catch (err) {
      console.warn("Failed to fetch damage intelligence metrics:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [apiBaseUrl]);

  const verifiedCount = stats?.verified_damage_count ?? (pipeline?.verified_damage_samples || 0);
  const underInspectionCount = stats?.under_inspection ?? 0;
  const pendingInspectionCount = stats?.pending_inspection ?? 0;
  const dismissedCount = stats?.dismissed_count ?? 0;
  const totalIncidents = stats?.total_incidents ?? (pipeline?.total_reported_incidents || 0);
  const targetThreshold = pipeline?.threshold_required || 50;
  const progressPct = Math.min(Math.round((verifiedCount / targetThreshold) * 100), 100);

  // Determine explicit Honest Model 2 state:
  // STATE A — DATA COLLECTION ("Collecting verified incidents")
  // STATE B — SUFFICIENT DATA ("Sufficient verified data collected")
  // STATE C — TRAINED ("Model 2 active")
  // STATE D — TRAINING ERROR ("Training unavailable")
  let model2State = "DATA COLLECTION";
  let stateTitle = "STATE A // DATA COLLECTION";
  let stateDesc = "Collecting verified operational incidents";

  if (pipeline?.is_trained) {
    model2State = "TRAINED";
    stateTitle = "STATE C // TRAINED";
    stateDesc = "Model 2 active for pre-dispatch evaluation";
  } else if (verifiedCount >= targetThreshold) {
    model2State = "SUFFICIENT DATA";
    stateTitle = "STATE B // SUFFICIENT DATA";
    stateDesc = "Sufficient verified data collected — Ready for supervised training";
  }

  return (
    <div className="bg-[#FAF5EC] border border-[#E2D5C3] rounded-3xl p-6 sm:p-8 shadow-sm space-y-6 font-mono">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-[#E2D5C3] pb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-[#FDF0EA] border border-[#F5CABA] text-[#C85A32] flex items-center justify-center font-bold">
            <Cpu className="w-5 h-5 text-[#C85A32]" />
          </div>
          <div>
            <div className="text-[9px] uppercase tracking-widest text-[#8A7E70] font-bold flex items-center gap-2">
              <span>MACHINE LEARNING PIPELINE 2</span>
              <span>•</span>
              <span className="text-[#C85A32]">OPERATIONAL LEARNING LOOP</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-[#1F1D1A] tracking-tight mt-0.5">
              Damage Intelligence & Model 2 Training Loop
            </h2>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowWhyModal(true)}
            className="px-3.5 py-1.5 bg-[#FDFBF7] hover:bg-[#FAF2E4] border border-[#E2D5C3] text-[#1F1D1A] text-xs font-bold rounded-full transition-colors flex items-center gap-1.5 cursor-pointer shadow-xs"
          >
            <HelpCircle className="w-3.5 h-3.5 text-[#C85A32]" />
            <span>Why Model 2 Exists</span>
          </button>

          <button
            onClick={fetchData}
            className="p-2 hover:bg-[#FDFBF7] border border-[#E2D5C3] rounded-full text-[#5C5349] hover:text-[#1F1D1A] transition-colors cursor-pointer"
            title="Refresh Metrics"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
          </button>
        </div>
      </div>

      {/* 4-Stat Real Value Counter Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="p-4 bg-[#FDFBF7] border border-[#E2D5C3] rounded-2xl shadow-xs">
          <span className="text-[9px] text-[#8A7E70] uppercase tracking-wider block font-bold">
            Verified Incidents
          </span>
          <div className="text-2xl sm:text-3xl font-black text-[#C85A32] mt-1">
            {verifiedCount}
          </div>
          <span className="text-[9px] text-[#2D5224] font-bold block mt-0.5">
            ✓ In Training Dataset
          </span>
        </div>

        <div className="p-4 bg-[#FDFBF7] border border-[#E2D5C3] rounded-2xl shadow-xs">
          <span className="text-[9px] text-[#8A7E70] uppercase tracking-wider block font-bold">
            Under Inspection
          </span>
          <div className="text-2xl sm:text-3xl font-black text-[#D49A29] mt-1">
            {underInspectionCount}
          </div>
          <span className="text-[9px] text-[#8A7E70] block mt-0.5">
            Physical Inspection
          </span>
        </div>

        <div className="p-4 bg-[#FDFBF7] border border-[#E2D5C3] rounded-2xl shadow-xs">
          <span className="text-[9px] text-[#8A7E70] uppercase tracking-wider block font-bold">
            False / Dismissed
          </span>
          <div className="text-2xl sm:text-3xl font-black text-[#4D6A42] mt-1">
            {dismissedCount}
          </div>
          <span className="text-[9px] text-[#8A7E70] block mt-0.5">
            Excluded from Dataset
          </span>
        </div>

        <div className="p-4 bg-[#FDFBF7] border border-[#E2D5C3] rounded-2xl shadow-xs">
          <span className="text-[9px] text-[#8A7E70] uppercase tracking-wider block font-bold">
            Model 2 State
          </span>
          <div className="text-base sm:text-lg font-black text-[#1F1D1A] mt-1 truncate">
            {model2State}
          </div>
          <span className="text-[9px] text-[#C85A32] font-bold block mt-0.5">
            {verifiedCount} / {targetThreshold} Samples
          </span>
        </div>
      </div>

      {/* Training Dataset Progress Milestone Bar */}
      <div className="p-5 bg-[#FDFBF7] border border-[#E2D5C3] rounded-2xl space-y-3 shadow-xs">
        <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
          <div className="flex items-center gap-2 font-bold text-[#1F1D1A]">
            <Database className="w-4 h-4 text-[#C85A32]" />
            <span>TRAINING DATASET MILESTONE PROGRESSION</span>
          </div>
          <span className="text-[11px] font-bold text-[#C85A32]">
            {verifiedCount} / {targetThreshold} Verified Operational Samples ({progressPct}%)
          </span>
        </div>

        <div className="w-full h-3 bg-[#E2D5C3] rounded-full overflow-hidden">
          <div
            className="h-full bg-[#C85A32] transition-all duration-700 rounded-full"
            style={{ width: `${progressPct}%` }}
          />
        </div>

        <div className="flex flex-wrap items-center justify-between gap-2 text-[10px] text-[#5C5349] pt-1">
          <span>
            Next milestone: <strong>{targetThreshold} verified incidents</strong> → initial Model 2 training
          </span>
          <span className="font-bold text-[#2D5224]">
            {verifiedCount < targetThreshold
              ? `${targetThreshold - verifiedCount} more verified incidents needed`
              : "✓ Threshold Achieved"}
          </span>
        </div>
      </div>

      {/* Closed-Loop Architecture Visualization */}
      <div className="p-5 bg-[#FAF5EC] border border-[#E2D5C3] rounded-2xl space-y-3">
        <div className="text-xs font-bold uppercase tracking-wider text-[#1F1D1A] flex items-center justify-between">
          <span>Closed-Loop Operational Feedback Architecture</span>
          <span className="text-[10px] text-[#8A7E70]">HUMAN-IN-THE-LOOP</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-5 gap-2 text-xs">
          <div className="p-3 bg-[#FDFBF7] border border-[#E2D5C3] rounded-xl text-center">
            <span className="text-[8px] text-[#8A7E70] uppercase block font-bold">Stage 1</span>
            <div className="font-bold text-[#1F1D1A] mt-0.5">Driver Report</div>
            <span className="text-[9px] text-[#5C5349] block mt-0.5">Flagged In Field</span>
          </div>

          <div className="p-3 bg-[#FDFBF7] border border-[#E2D5C3] rounded-xl text-center">
            <span className="text-[8px] text-[#8A7E70] uppercase block font-bold">Stage 2</span>
            <div className="font-bold text-[#1F1D1A] mt-0.5">Physical Inspection</div>
            <span className="text-[9px] text-[#5C5349] block mt-0.5">Seal Verification</span>
          </div>

          <div className="p-3 bg-[#FDFBF7] border border-[#E2D5C3] rounded-xl text-center">
            <span className="text-[8px] text-[#8A7E70] uppercase block font-bold">Stage 3</span>
            <div className="font-bold text-[#1F1D1A] mt-0.5">Human Verification</div>
            <span className="text-[9px] text-[#5C5349] block mt-0.5">Confirmed Damage</span>
          </div>

          <div className="p-3 bg-[#FDFBF7] border border-[#E2D5C3] rounded-xl text-center">
            <span className="text-[8px] text-[#8A7E70] uppercase block font-bold">Stage 4</span>
            <div className="font-bold text-[#C85A32] mt-0.5">Verified Dataset</div>
            <span className="text-[9px] text-[#4D6A42] font-bold block mt-0.5">SQLite Tabular Data</span>
          </div>

          <div className="p-3 bg-[#FDFBF7] border border-[#E2D5C3] rounded-xl text-center">
            <span className="text-[8px] text-[#8A7E70] uppercase block font-bold">Stage 5</span>
            <div className="font-bold text-[#1F1D1A] mt-0.5">Model 2 Training</div>
            <span className="text-[9px] text-[#5C5349] block mt-0.5">Future Prediction</span>
          </div>
        </div>
      </div>

      {/* Future Damage Risk Prediction Placeholder */}
      <div className="p-5 bg-[#FAF2E4]/80 border-2 border-dashed border-[#DCCFBC] rounded-2xl space-y-2.5 opacity-90">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-[#8A7E70]" />
            <span className="text-xs font-bold uppercase tracking-wider text-[#5C5349]">
              FUTURE DAMAGE RISK PREDICTION // MODEL 2 COMING SOON
            </span>
          </div>
          <span className="text-[9px] font-bold px-2.5 py-0.5 rounded-full bg-[#FAF5EC] border border-[#E2D5C3] text-[#8A7E70]">
            AWAITING {targetThreshold} SAMPLES
          </span>
        </div>

        <p className="text-xs text-[#5C5349] leading-relaxed">
          Once sufficient verified incidents are collected, Model 2 will estimate
          pre-dispatch cargo damage risk using operational features (ML transit hours, route
          vibration, intermediate stops, product fragility, and vehicle historical telemetry).
        </p>

        <div className="text-[10px] text-[#8A7E70] italic">
          * Transparent Architecture Notice: The system strictly avoids fabricating predictive scores or simulated probabilities until Model 2 is trained on verified real-world operational records.
        </div>
      </div>

      {/* Info Modal */}
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
                MODEL 2 INPUT FEATURES:
              </div>
              <div>• ML Model 1 Predicted Transit Duration</div>
              <div>• Product Fragility Index & Cargo Weight</div>
              <div>• Intermediate Hub / Drop Staging Counts</div>
              <div>• Vehicle Type & Historical Incident Log</div>
              <div>• Reefer Excursion Severity & Harsh Braking Frequency</div>
            </div>

            <div className="flex justify-end pt-2">
              <button
                onClick={() => setShowWhyModal(false)}
                className="px-5 py-2 bg-[#1F1D1A] hover:bg-[#3D352E] text-white rounded-full text-xs font-bold uppercase cursor-pointer"
              >
                Got It
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
