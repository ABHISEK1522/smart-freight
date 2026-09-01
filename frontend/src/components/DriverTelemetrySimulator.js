"use client";

import React, { useState } from "react";
import {
  Activity,
  Thermometer,
  Zap,
  Gauge,
  Sliders,
  Play,
  RotateCcw,
  CheckCircle2,
  AlertTriangle,
} from "lucide-react";

/**
 * DriverTelemetrySimulator
 *
 * Safe developer/demo simulation controls for testing rule-based safety detection.
 * Feeds simulated telemetry values into the exact same detection pipeline as live sensors.
 */
export default function DriverTelemetrySimulator({
  currentTelemetry,
  onApplySimulation,
  onResetToBaseline,
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [activePreset, setActivePreset] = useState("normal");

  const handleSelectPreset = (presetKey) => {
    setActivePreset(presetKey);

    switch (presetKey) {
      case "normal":
        onApplySimulation({
          currentTempC: 4.2,
          tempDurationSeconds: 0,
          impactG: 0.2,
          decelMps2: 0.0,
          label: "Normal Operational Baseline",
        });
        break;

      case "temp_breach":
        onApplySimulation({
          currentTempC: 10.8,
          tempDurationSeconds: 12,
          impactG: 0.2,
          decelMps2: 0.0,
          label: "Cold-Chain Temperature Breach (10.8°C for 12s)",
        });
        break;

      case "impact":
        onApplySimulation({
          currentTempC: 4.4,
          tempDurationSeconds: 0,
          impactG: 3.4,
          decelMps2: -1.2,
          label: "Sudden Vehicle Impact (3.4g shock)",
        });
        break;

      case "braking":
        onApplySimulation({
          currentTempC: 4.2,
          tempDurationSeconds: 0,
          impactG: 0.8,
          decelMps2: -5.8,
          label: "Harsh Braking & Deceleration (-5.8 m/s²)",
        });
        break;

      default:
        break;
    }
  };

  return (
    <div className="bg-[#FAF5EC] border border-[#E2D5C3] rounded-2xl overflow-hidden font-mono text-xs shadow-sm">
      {/* Top Bar / Toggle */}
      <div
        onClick={() => setIsOpen(!isOpen)}
        className="px-4 py-3 bg-[#FDFBF7] flex items-center justify-between cursor-pointer hover:bg-[#FAF5EC] transition-colors"
      >
        <div className="flex items-center gap-2 text-[#1F1D1A]">
          <Activity className="w-4 h-4 text-[#C85A32]" />
          <span className="font-bold uppercase tracking-wider text-[11px]">
            Vehicle Telemetry Stream & Safety Sensor Cockpit
          </span>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-[9px] uppercase font-bold text-[#8A7E70] bg-[#FAF5EC] px-2 py-0.5 rounded border border-[#E2D5C3]">
            DEMO TEST HARNESS
          </span>
          <span className="text-xs text-[#8A7E70]">{isOpen ? "▲ Hide" : "▼ Controls"}</span>
        </div>
      </div>

      {/* Sensor Gauges Summary Strip */}
      <div className="px-4 py-3 grid grid-cols-3 gap-3 border-t border-[#E2D5C3] bg-[#FAF5EC]/80">
        <div className="p-2 bg-[#FDFBF7] rounded-xl border border-[#E2D5C3]">
          <span className="text-[8px] uppercase text-[#8A7E70] font-bold block flex items-center gap-1">
            <Thermometer className="w-3 h-3 text-[#4D6A42]" />
            CARGO TEMP
          </span>
          <div className="text-sm font-bold text-[#1F1D1A] mt-0.5">
            {currentTelemetry?.currentTempC != null ? `${currentTelemetry.currentTempC.toFixed(1)}°C` : "04.2°C"}
          </div>
          <span className="text-[8px] text-[#4D6A42]">Safe: 2.0°C - 8.0°C</span>
        </div>

        <div className="p-2 bg-[#FDFBF7] rounded-xl border border-[#E2D5C3]">
          <span className="text-[8px] uppercase text-[#8A7E70] font-bold block flex items-center gap-1">
            <Zap className="w-3 h-3 text-[#C85A32]" />
            ACCEL / IMPACT
          </span>
          <div className="text-sm font-bold text-[#1F1D1A] mt-0.5">
            {currentTelemetry?.impactG != null ? `${currentTelemetry.impactG.toFixed(1)}g` : "0.2g"}
          </div>
          <span className="text-[8px] text-[#5C5349]">Threshold: 1.8g</span>
        </div>

        <div className="p-2 bg-[#FDFBF7] rounded-xl border border-[#E2D5C3]">
          <span className="text-[8px] uppercase text-[#8A7E70] font-bold block flex items-center gap-1">
            <Gauge className="w-3 h-3 text-[#B8711E]" />
            DECELERATION
          </span>
          <div className="text-sm font-bold text-[#1F1D1A] mt-0.5">
            {currentTelemetry?.decelMps2 != null ? `${currentTelemetry.decelMps2.toFixed(1)} m/s²` : "0.0 m/s²"}
          </div>
          <span className="text-[8px] text-[#5C5349]">Harsh: &lt; -4.5 m/s²</span>
        </div>
      </div>

      {/* Collapsible Simulation Panel */}
      {isOpen && (
        <div className="p-4 bg-[#FDFBF7] border-t border-[#E2D5C3] space-y-3 animate-fade-in">
          <div className="flex items-center justify-between">
            <span className="text-[10px] text-[#8A7E70] uppercase font-bold">
              Simulate Telemetry Test Conditions (Feeds into Safety Rule Pipeline):
            </span>
            <button
              onClick={() => handleSelectPreset("normal")}
              className="text-[10px] text-[#C85A32] font-bold hover:underline inline-flex items-center gap-1 cursor-pointer"
            >
              <RotateCcw className="w-3 h-3" />
              <span>Reset to Baseline</span>
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-4 gap-2">
            <button
              type="button"
              onClick={() => handleSelectPreset("normal")}
              className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                activePreset === "normal"
                  ? "bg-[#EBF3EA] border-[#C4DEC0] text-[#2D5926] font-bold"
                  : "bg-[#FAF5EC] border-[#E2D5C3] text-[#5C5349] hover:text-[#1F1D1A]"
              }`}
            >
              <div className="text-[9px] uppercase font-bold">● Normal Baseline</div>
              <div className="text-[11px] mt-0.5">4.2°C · 0.2g · 0.0 m/s²</div>
              <div className="text-[8px] text-[#4D6A42] mt-0.5">No alert expected</div>
            </button>

            <button
              type="button"
              onClick={() => handleSelectPreset("temp_breach")}
              className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                activePreset === "temp_breach"
                  ? "bg-[#FEF6E8] border-[#F2D7A5] text-[#B8711E] font-bold"
                  : "bg-[#FAF5EC] border-[#E2D5C3] text-[#5C5349] hover:text-[#1F1D1A]"
              }`}
            >
              <div className="text-[9px] uppercase font-bold">⚠ Temp Breach</div>
              <div className="text-[11px] mt-0.5">10.8°C for 12s</div>
              <div className="text-[8px] text-[#B8711E] mt-0.5">Triggers Temp Alert</div>
            </button>

            <button
              type="button"
              onClick={() => handleSelectPreset("impact")}
              className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                activePreset === "impact"
                  ? "bg-[#FDF0EA] border-[#F5CABA] text-[#BA4336] font-bold"
                  : "bg-[#FAF5EC] border-[#E2D5C3] text-[#5C5349] hover:text-[#1F1D1A]"
              }`}
            >
              <div className="text-[9px] uppercase font-bold">💥 Sudden Impact</div>
              <div className="text-[11px] mt-0.5">3.4g shock force</div>
              <div className="text-[8px] text-[#BA4336] mt-0.5">Triggers Impact Alert</div>
            </button>

            <button
              type="button"
              onClick={() => handleSelectPreset("braking")}
              className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                activePreset === "braking"
                  ? "bg-[#FEF6E8] border-[#F2D7A5] text-[#B8711E] font-bold"
                  : "bg-[#FAF5EC] border-[#E2D5C3] text-[#5C5349] hover:text-[#1F1D1A]"
              }`}
            >
              <div className="text-[9px] uppercase font-bold">🛑 Harsh Braking</div>
              <div className="text-[11px] mt-0.5">-5.8 m/s² deceleration</div>
              <div className="text-[8px] text-[#B8711E] mt-0.5">Triggers Decel Alert</div>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
