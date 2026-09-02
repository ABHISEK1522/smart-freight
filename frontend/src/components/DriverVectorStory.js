"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { Play, Pause, ZoomIn, ZoomOut, RotateCcw } from "lucide-react";

/**
 * DRIVER VECTOR STORY - 7-SCENE LIVE TRIP INTERACTIVE ENGINE (LIGHT BEIGE)
 * Fixed centered vector stage with zoom support.
 */

const DRIVER_NODES = [
  { id: "BBI", name: "BHUBANESWAR", x: 80, y: 320, eta: "DEPARTED 06:00" },
  { id: "CTC", name: "CUTTACK", x: 200, y: 260, eta: "PASSED 07:15" },
  { id: "BLS", name: "BALASORE", x: 340, y: 200, eta: "ETA 11:30" },
  { id: "KGP", name: "KHARAGPUR", x: 460, y: 150, eta: "ETA 15:00" },
  { id: "CCU", name: "KOLKATA", x: 580, y: 100, eta: "ETA 18:42" },
];

const DRIVER_SCENES = [
  { id: 1, title: "CURRENT TRIP", progress: 0.10 },
  { id: 2, title: "NH-16 ADVANCEMENT", progress: 0.25 },
  { id: 3, title: "TELEMETRY LOCK", progress: 0.40 },
  { id: 4, title: "04.2°C CRYOGENIC", progress: 0.55 },
  { id: 5, title: "BALASORE RISK", progress: 0.70 },
  { id: 6, title: "HIGHWAY BYPASS", progress: 0.85 },
  { id: 7, title: "KOLKATA ARRIVAL", progress: 1.00 },
];

// Interpolate a point along the route path at progress t (0..1)
function getRoutePoint(t) {
  const clamped = Math.max(0, Math.min(1, t));
  const points = DRIVER_NODES.map((n) => ({ x: n.x, y: n.y }));
  const totalSegments = points.length - 1;
  const segFloat = clamped * totalSegments;
  const segIndex = Math.min(Math.floor(segFloat), totalSegments - 1);
  const segT = segFloat - segIndex;
  const a = points[segIndex];
  const b = points[segIndex + 1] || points[segIndex];
  return { x: a.x + (b.x - a.x) * segT, y: a.y + (b.y - a.y) * segT };
}

// Base viewBox dimensions
const BASE_W = 680;
const BASE_H = 420;

export default function DriverVectorStory({ shipmentId = "SF-E35749" }) {
  const containerRef = useRef(null);
  const svgRef = useRef(null);
  const [scrollProgress, setScrollProgress] = useState(0.40);
  const [activeScene, setActiveScene] = useState(3);
  const [isPlaying, setIsPlaying] = useState(false);
  const [zoomLevel, setZoomLevel] = useState(1);

  const getSceneFromProgress = (p) => {
    if (p < 0.15) return 1;
    if (p < 0.30) return 2;
    if (p < 0.45) return 3;
    if (p < 0.60) return 4;
    if (p < 0.75) return 5;
    if (p < 0.88) return 6;
    return 7;
  };

  const updateProgress = useCallback((newP) => {
    const clamped = Math.min(1, Math.max(0, newP));
    setScrollProgress(clamped);
    setActiveScene(getSceneFromProgress(clamped));
  }, []);

  // Compute viewBox centered in the middle of the whole map
  const computeViewBox = useCallback(() => {
    const viewW = BASE_W / zoomLevel;
    const viewH = BASE_H / zoomLevel;
    const vx = (BASE_W - viewW) / 2;
    const vy = (BASE_H - viewH) / 2;
    return `${vx} ${vy} ${viewW} ${viewH}`;
  }, [zoomLevel]);

  // Auto-play animation
  useEffect(() => {
    if (!isPlaying) return;
    const interval = setInterval(() => {
      setScrollProgress((prev) => {
        let next = prev + 0.007;
        if (next > 1) { next = 0; }
        setActiveScene(getSceneFromProgress(next));
        return next;
      });
    }, 60);
    return () => clearInterval(interval);
  }, [isPlaying]);

  const vehiclePos = getRoutePoint(scrollProgress);
  const isRiskActive = scrollProgress >= 0.65 && scrollProgress <= 0.90;

  return (
    <div
      ref={containerRef}
      className="relative w-full bg-[#FAF5EC] rounded-2xl border border-[#E2D5C3] p-4 overflow-hidden flex flex-col select-none shadow-md"
    >
      {/* Background Mesh */}
      <div className="absolute inset-0 pointer-events-none opacity-15">
        <svg className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <pattern id="driverGrid" width="40" height="23" patternUnits="userSpaceOnUse">
              <path d="M 40 0 L 20 11.5 L 0 0 M 20 11.5 L 20 23" fill="none" stroke="#D4C3AC" strokeWidth="0.6" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#driverGrid)" />
        </svg>
      </div>

      {/* Header Bar */}
      <div className="relative z-10 flex flex-wrap items-center justify-between gap-3 border-b border-[#E2D5C3] pb-2.5 text-xs font-mono">
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-[#C85A32] animate-pulse" />
          <span className="font-bold tracking-widest text-[#1F1D1A] uppercase">
            LIVE TRIP TELEMETRY // {shipmentId}
          </span>
        </div>

        <div className="flex items-center gap-2">
          {/* Zoom controls */}
          <div className="flex items-center bg-[#F4EBDD] border border-[#D4C3AC] rounded-lg p-0.5 shadow-2xs">
            <button
              onClick={() => setZoomLevel((z) => Math.max(0.6, +(z - 0.15).toFixed(2)))}
              className="p-1 hover:bg-[#FAF5EC] text-[#5C5349] rounded transition-colors cursor-pointer"
              title="Zoom Out"
            >
              <ZoomOut className="w-3.5 h-3.5" />
            </button>
            <span className="px-1.5 text-[9px] font-bold text-[#8A7E70] min-w-[34px] text-center">
              {Math.round(zoomLevel * 100)}%
            </span>
            <button
              onClick={() => setZoomLevel((z) => Math.min(2.5, +(z + 0.15).toFixed(2)))}
              className="p-1 hover:bg-[#FAF5EC] text-[#5C5349] rounded transition-colors cursor-pointer"
              title="Zoom In"
            >
              <ZoomIn className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Reset view */}
          <button
            onClick={() => setZoomLevel(1)}
            className="p-1 bg-[#F4EBDD] border border-[#D4C3AC] rounded-lg hover:bg-[#FAF5EC] text-[#5C5349] transition-colors cursor-pointer"
            title="Reset Zoom (100%)"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>

          {/* Auto play button */}
          <button
            onClick={() => setIsPlaying(!isPlaying)}
            className={`flex items-center gap-1 px-2.5 py-1 rounded-lg border text-[10px] font-bold transition-all cursor-pointer ${
              isPlaying
                ? "bg-[#C85A32] text-white border-[#C85A32]"
                : "bg-[#F4EBDD] text-[#1F1D1A] border-[#D4C3AC] hover:bg-[#EFE5D5]"
            }`}
          >
            {isPlaying ? <Pause className="w-3 h-3" /> : <Play className="w-3 h-3" />}
            <span>{isPlaying ? "PAUSE" : "AUTO TRIP"}</span>
          </button>
        </div>
      </div>

      {/* Interactive Scene Selector Pills */}
      <div className="relative z-10 flex items-center gap-1.5 overflow-x-auto py-2 border-b border-[#E2D5C3]/70">
        {DRIVER_SCENES.map((scene) => (
          <button
            key={scene.id}
            onClick={() => {
              setIsPlaying(false);
              updateProgress(scene.progress);
            }}
            className={`px-2 py-1 rounded-lg text-[10px] font-mono font-bold whitespace-nowrap transition-all cursor-pointer ${
              activeScene === scene.id
                ? "bg-[#C85A32] text-white shadow-xs"
                : "bg-[#F4EBDD]/80 text-[#5C5349] hover:bg-[#F4EBDD] hover:text-[#1F1D1A] border border-[#E2D5C3]"
            }`}
          >
            0{scene.id}. {scene.title}
          </button>
        ))}
      </div>

      {/* SVG Canvas - Fixed Centered, Undraggable */}
      <div className="relative z-10 my-2 w-full h-[320px] overflow-hidden rounded-xl bg-[#FAF4E8]/60 border border-[#E2D5C3]/60 cursor-default">
        <svg
          ref={svgRef}
          viewBox={computeViewBox()}
          className="w-full h-full"
          preserveAspectRatio="xMidYMid meet"
          style={{ transition: "viewBox 0.3s ease-out" }}
        >
          <defs>
            <linearGradient id="driverSpineGrad" x1="0%" y1="100%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#C85A32" stopOpacity="0.4" />
              <stop offset="70%" stopColor="#C85A32" stopOpacity="1" />
              <stop offset="100%" stopColor="#1F1D1A" stopOpacity="0.9" />
            </linearGradient>
          </defs>

          {/* Base Corridor */}
          <path
            d={`M ${DRIVER_NODES.map((n) => `${n.x} ${n.y}`).join(" L ")}`}
            fill="none"
            stroke={isRiskActive ? "rgba(186, 67, 54, 0.4)" : "url(#driverSpineGrad)"}
            strokeWidth="2.8"
            strokeDasharray={isRiskActive ? "4 4" : "none"}
          />

          {/* Bypass Curve (Scene 6) */}
          {isRiskActive && (
            <g>
              <path
                d="M 200 260 C 260 200, 290 140, 380 140 S 460 150, 580 100"
                fill="none"
                stroke="#C85A32"
                strokeWidth="3"
              />
              <g transform="translate(310, 145)">
                <rect x="-40" y="-10" width="80" height="16" fill="#FAF5EC" stroke="#C85A32" rx="4" />
                <text x="0" y="-1" fill="#C85A32" fontSize="7.5" fontFamily="monospace" textAnchor="middle" fontWeight="bold">
                  BYPASS ACTIVE
                </text>
              </g>
            </g>
          )}

          {/* Hazard Beacon at Balasore */}
          {isRiskActive && (
            <g transform={`translate(${DRIVER_NODES[2].x}, ${DRIVER_NODES[2].y})`}>
              <circle cx="0" cy="0" r="20" fill="rgba(186, 67, 54, 0.12)" stroke="#BA4336" strokeWidth="1" className="animate-ping" />
              <circle cx="0" cy="0" r="6" fill="#BA4336" />
              <text x="14" y="-6" fill="#BA4336" fontSize="7.5" fontFamily="monospace" fontWeight="bold">
                CONGESTION RISK
              </text>
            </g>
          )}

          {/* Moving Driver Vehicle Beacon */}
          <g transform={`translate(${vehiclePos.x}, ${vehiclePos.y})`}>
            <rect x="-5" y="-5" width="10" height="10" transform="rotate(45)" fill="#FAF5EC" stroke="#C85A32" strokeWidth="2" />
            <circle cx="0" cy="0" r="14" fill="none" stroke="#C85A32" strokeWidth="1" strokeDasharray="2 2" className="animate-spin" />
            
            <g transform="translate(16, -14)">
              <rect x="-2" y="-9" width="120" height="20" fill="#FAF5EC" stroke="#E2D5C3" rx="4" />
              <text x="3" y="0" fill="#1F1D1A" fontSize="7.5" fontFamily="monospace" fontWeight="bold">
                {shipmentId} [REEFER]
              </text>
              <text x="3" y="7" fill="#4D6A42" fontSize="6" fontFamily="monospace" fontWeight="bold">
                04.2°C • 87% CAPACITY
              </text>
            </g>
          </g>

          {/* Waypoint Nodes */}
          {DRIVER_NODES.map((node, idx) => {
            const isPassed = scrollProgress >= idx / (DRIVER_NODES.length - 1);
            return (
              <g key={node.id} transform={`translate(${node.x}, ${node.y})`}>
                <circle
                  cx="0"
                  cy="0"
                  r={isPassed ? 8 : 6}
                  fill={isPassed ? "rgba(200, 90, 50, 0.15)" : "transparent"}
                  stroke={isPassed ? "#C85A32" : "#D4C3AC"}
                  strokeWidth="1.2"
                />
                <circle cx="0" cy="0" r={isPassed ? 3.5 : 2} fill={isPassed ? "#C85A32" : "#8A7E70"} stroke="#FAF5EC" strokeWidth="0.8" />
                <text x="12" y="4" fill={isPassed ? "#1F1D1A" : "#8A7E70"} fontSize="8" fontFamily="monospace" fontWeight={isPassed ? "bold" : "normal"}>
                  {node.name}
                </text>
                <text x="12" y="13" fill="#C85A32" fontSize="6" fontFamily="monospace" fontWeight="bold">
                  {node.eta}
                </text>
              </g>
            );
          })}
        </svg>
      </div>

      {/* Progress Scrubber Slider */}
      <div className="relative z-10 py-1 flex items-center gap-3">
        <span className="text-[9px] font-mono text-[#8A7E70] uppercase">Trip Progress</span>
        <input
          type="range"
          min="0"
          max="1"
          step="0.01"
          value={scrollProgress}
          onChange={(e) => {
            setIsPlaying(false);
            updateProgress(parseFloat(e.target.value));
          }}
          className="flex-1 accent-[#C85A32] h-1.5 bg-[#E2D5C3] rounded-lg cursor-pointer"
        />
        <span className="text-[10px] font-mono font-bold text-[#C85A32] min-w-[36px] text-right">
          {Math.round(scrollProgress * 100)}%
        </span>
      </div>

      {/* Driver Telemetry Footer */}
      <div className="relative z-10 grid grid-cols-4 gap-2 pt-2 border-t border-[#E2D5C3] text-[10px] font-mono">
        <div className="p-2 bg-[#FDFBF7] border border-[#E2D5C3] rounded-xl shadow-2xs">
          <div className="text-[#8A7E70] uppercase text-[8px]">TOTAL DISTANCE</div>
          <div className="text-xs font-bold text-[#1F1D1A]">428 KM</div>
        </div>

        <div className="p-2 bg-[#FDFBF7] border border-[#E2D5C3] rounded-xl shadow-2xs">
          <div className="text-[#8A7E70] uppercase text-[8px]">ESTIMATED ETA</div>
          <div className="text-xs font-bold text-[#C85A32]">18:42 IST</div>
        </div>

        <div className="p-2 bg-[#FDFBF7] border border-[#E2D5C3] rounded-xl shadow-2xs">
          <div className="text-[#8A7E70] uppercase text-[8px]">COLD CHAIN</div>
          <div className="text-xs font-bold text-[#4D6A42]">04.2°C STABLE</div>
        </div>

        <div className="p-2 bg-[#FDFBF7] border border-[#E2D5C3] rounded-xl shadow-2xs">
          <div className="text-[#8A7E70] uppercase text-[8px]">CARGO PAYLOAD</div>
          <div className="text-xs font-bold text-[#1F1D1A]">3,200 KG</div>
        </div>
      </div>
    </div>
  );
}
