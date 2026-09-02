"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { Play, Pause, ZoomIn, ZoomOut, RotateCcw } from "lucide-react";

/**
 * CONSUMER VECTOR STORY - 5-SCENE INTERACTIVE ROUTE ENGINE (LIGHT BEIGE)
 * Fixed centered vector stage with zoom support.
 */

const CONSUMER_NODES = [
  { id: "BBI", name: "BHUBANESWAR", x: 100, y: 320, load: "2,800 KG", temp: "04.0°C", active: true },
  { id: "CTC", name: "CUTTACK", x: 240, y: 250, load: "1,400 KG", temp: "04.1°C" },
  { id: "BLS", name: "BALASORE", x: 390, y: 180, load: "PASS-THRU", temp: "03.9°C" },
  { id: "CCU", name: "KOLKATA", x: 560, y: 100, load: "5,400 KG", temp: "04.0°C", active: true },
];

const SCENES = [
  { id: 1, title: "3 INDEPENDENT SHIPMENTS", progress: 0.10, desc: "Separate linehauls running uncoordinated with high overhead" },
  { id: 2, title: "CORRIDOR DEMAND MATCH", progress: 0.30, desc: "AI identifies overlapping OD pairs along NH-16 arterial" },
  { id: 3, title: "MULTI-SHIPPER CONSOLIDATION", progress: 0.50, desc: "Combined 4.2T load merged into single refrigerated unit" },
  { id: 4, title: "TRAJECTORY OPTIMIZATION", progress: 0.70, desc: "Direct dynamic corridor route calculated with zero detour" },
  { id: 5, title: "₹18,000 SAVED (33%)", progress: 1.00, desc: "Consolidated dispatch executed with optimal cost & emission" },
];

// Interpolate a point along the route path at progress t (0..1)
function getRoutePoint(t) {
  const clamped = Math.max(0, Math.min(1, t));
  const points = CONSUMER_NODES.map((n) => ({ x: n.x, y: n.y }));
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

export default function ConsumerVectorStory() {
  const containerRef = useRef(null);
  const [scrollProgress, setScrollProgress] = useState(0.50);
  const [activeScene, setActiveScene] = useState(3);
  const [isPlaying, setIsPlaying] = useState(false);
  const [zoomLevel, setZoomLevel] = useState(1);

  const getSceneFromProgress = (p) => {
    if (p < 0.20) return 1;
    if (p < 0.40) return 2;
    if (p < 0.60) return 3;
    if (p < 0.80) return 4;
    return 5;
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
        let next = prev + 0.008;
        if (next > 1) { next = 0; }
        setActiveScene(getSceneFromProgress(next));
        return next;
      });
    }, 60);
    return () => clearInterval(interval);
  }, [isPlaying]);

  const consolidationFactor = Math.min(1, Math.max(0, (scrollProgress - 0.25) / 0.35));

  return (
    <div
      ref={containerRef}
      className="relative w-full bg-[#FAF5EC] rounded-2xl border border-[#E2D5C3] p-4 overflow-hidden flex flex-col select-none shadow-md"
    >
      {/* Background Mesh */}
      <div className="absolute inset-0 pointer-events-none opacity-15">
        <svg className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <pattern id="consGrid" width="40" height="23" patternUnits="userSpaceOnUse">
              <path d="M 40 0 L 20 11.5 L 0 0 M 20 11.5 L 20 23" fill="none" stroke="#D4C3AC" strokeWidth="0.6" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#consGrid)" />
        </svg>
      </div>

      {/* Header Bar */}
      <div className="relative z-10 flex flex-wrap items-center justify-between gap-3 border-b border-[#E2D5C3] pb-2.5 text-xs font-mono">
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-[#C85A32] animate-pulse" />
          <span className="font-bold tracking-widest text-[#1F1D1A] uppercase">
            SCENE 0{activeScene} // {SCENES[activeScene - 1]?.title}
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
            <span>{isPlaying ? "PAUSE" : "AUTO TOUR"}</span>
          </button>
        </div>
      </div>

      {/* Interactive Scene Selector Pills */}
      <div className="relative z-10 flex items-center gap-1.5 overflow-x-auto py-2 border-b border-[#E2D5C3]/70">
        {SCENES.map((scene) => (
          <button
            key={scene.id}
            onClick={() => {
              setIsPlaying(false);
              updateProgress(scene.progress);
            }}
            className={`px-2.5 py-1 rounded-lg text-[10px] font-mono font-bold whitespace-nowrap transition-all cursor-pointer ${
              activeScene === scene.id
                ? "bg-[#C85A32] text-white shadow-xs"
                : "bg-[#F4EBDD]/80 text-[#5C5349] hover:bg-[#F4EBDD] hover:text-[#1F1D1A] border border-[#E2D5C3]"
            }`}
          >
            0{scene.id}. {scene.title}
          </button>
        ))}
      </div>

      {/* Scene Description */}
      <div className="relative z-10 py-1.5 px-1 text-[10px] font-mono text-[#5C5349] italic">
        {SCENES[activeScene - 1]?.desc}
      </div>

      {/* Main SVG Vector Network Stage - Fixed Centered, Undraggable */}
      <div className="relative z-10 w-full h-[320px] overflow-hidden rounded-xl bg-[#FAF4E8]/60 border border-[#E2D5C3]/60 cursor-default">
        <svg
          viewBox={computeViewBox()}
          className="w-full h-full"
          preserveAspectRatio="xMidYMid meet"
          style={{ transition: "viewBox 0.3s ease-out" }}
        >
          <defs>
            <linearGradient id="consSpineGrad" x1="0%" y1="100%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#C85A32" stopOpacity="0.4" />
              <stop offset="60%" stopColor="#C85A32" stopOpacity="1" />
              <stop offset="100%" stopColor="#1F1D1A" stopOpacity="0.9" />
            </linearGradient>
          </defs>

          {/* Base Highway Corridor Trace */}
          <path
            d={`M ${CONSUMER_NODES.map((n) => `${n.x} ${n.y}`).join(" L ")}`}
            fill="none"
            stroke="#D4C3AC"
            strokeWidth="1.5"
            strokeDasharray="3 4"
          />

          {/* Inefficient Separate Routes (Scene 1 & 2) */}
          {consolidationFactor < 1 && (
            <g opacity={1 - consolidationFactor * 0.9} className="transition-opacity duration-300">
              <path
                d={`M 100 320 Q 330 ${320 - (1 - consolidationFactor) * 80}, 560 100`}
                fill="none"
                stroke="#BA4336"
                strokeWidth="1.8"
                strokeDasharray="4 4"
              />
              <path
                d={`M 240 250 Q 400 ${250 + (1 - consolidationFactor) * 60}, 560 100`}
                fill="none"
                stroke="#D49A29"
                strokeWidth="1.5"
                strokeDasharray="4 4"
              />
              <path
                d={`M 390 180 Q 475 ${180 - (1 - consolidationFactor) * 40}, 560 100`}
                fill="none"
                stroke="#8A7E70"
                strokeWidth="1.2"
                strokeDasharray="4 4"
              />

              {/* Independent Cargo Markers */}
              <g transform={`translate(${100 + (560 - 100) * ((scrollProgress * 2.5) % 1)}, ${320 + (100 - 320) * ((scrollProgress * 2.5) % 1) - 20})`}>
                <rect x="-3.5" y="-3.5" width="7" height="7" fill="#BA4336" transform="rotate(45)" />
                <text x="8" y="-4" fill="#BA4336" fontSize="7.5" fontFamily="monospace" fontWeight="bold">SF-A (TOMATOES)</text>
              </g>
              <g transform={`translate(${240 + (560 - 240) * (((scrollProgress * 2.5) + 0.3) % 1)}, ${250 + (100 - 250) * (((scrollProgress * 2.5) + 0.3) % 1) + 18})`}>
                <rect x="-3.5" y="-3.5" width="7" height="7" fill="#D49A29" transform="rotate(45)" />
                <text x="8" y="10" fill="#D49A29" fontSize="7.5" fontFamily="monospace" fontWeight="bold">SF-B (DAIRY)</text>
              </g>
            </g>
          )}

          {/* Consolidated Single Master Route (Scene 3 to 5) */}
          {consolidationFactor > 0.05 && (
            <g>
              <path
                d={`M ${CONSUMER_NODES.map((n) => `${n.x} ${n.y}`).join(" L ")}`}
                fill="none"
                stroke="url(#consSpineGrad)"
                strokeWidth={consolidationFactor > 0.8 ? "3.5" : "2.5"}
              />

              {/* Master Consolidated Cargo Unit */}
              {(() => {
                const cargoPos = getRoutePoint((scrollProgress * 1.5) % 1);
                return (
                  <g transform={`translate(${cargoPos.x}, ${cargoPos.y})`}>
                    <rect x="-5" y="-5" width="10" height="10" transform="rotate(45)" fill="#FAF5EC" stroke="#C85A32" strokeWidth="2" />
                    <circle cx="0" cy="0" r="14" fill="none" stroke="#C85A32" strokeWidth="1" strokeDasharray="2 2" className="animate-spin" />
                    
                    <g transform="translate(16, -14)">
                      <rect x="-2" y="-9" width="120" height="20" fill="#FAF5EC" stroke="#E2D5C3" rx="4" />
                      <text x="3" y="0" fill="#1F1D1A" fontSize="7.5" fontFamily="monospace" fontWeight="bold">
                        SF-CONSOL // 1 TRIP
                      </text>
                      <text x="3" y="7" fill="#C85A32" fontSize="6" fontFamily="monospace" fontWeight="bold">
                        87% LOAD • 04.2°C STABLE
                      </text>
                    </g>
                  </g>
                );
              })()}
            </g>
          )}

          {/* Nodes */}
          {CONSUMER_NODES.map((node) => (
            <g key={node.id} transform={`translate(${node.x}, ${node.y})`}>
              <circle
                cx="0"
                cy="0"
                r={node.active ? 10 : 7}
                fill={node.active ? "rgba(200, 90, 50, 0.15)" : "transparent"}
                stroke={node.active ? "#C85A32" : "#D4C3AC"}
                strokeWidth="1.2"
              />
              <circle cx="0" cy="0" r={node.active ? 4 : 2.5} fill={node.active ? "#C85A32" : "#8A7E70"} stroke="#FAF5EC" strokeWidth="1" />
              <text x="12" y="4" fill={node.active ? "#1F1D1A" : "#5C5349"} fontSize="8.5" fontFamily="monospace" fontWeight={node.active ? "bold" : "normal"}>
                {node.name}
              </text>
            </g>
          ))}
        </svg>
      </div>

      {/* Progress Scrubber Slider */}
      <div className="relative z-10 py-1 flex items-center gap-3 mt-1">
        <span className="text-[9px] font-mono text-[#8A7E70] uppercase">Progress</span>
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

      {/* Bottom Annotations */}
      <div className="relative z-10 grid grid-cols-3 gap-3 pt-2 border-t border-[#E2D5C3] text-[10px] font-mono">
        <div className="p-2.5 bg-[#FDFBF7] border border-[#E2D5C3] rounded-xl shadow-2xs">
          <div className="text-[#8A7E70] uppercase text-[8px]">TOTAL EXPENSE</div>
          <div className="text-sm font-bold text-[#BA4336]">
            {activeScene >= 3 ? "₹36,000" : "₹54,000"}
          </div>
        </div>

        <div className="p-2.5 bg-[#FDFBF7] border border-[#E2D5C3] rounded-xl shadow-2xs">
          <div className="text-[#8A7E70] uppercase text-[8px]">EST. SAVINGS</div>
          <div className="text-sm font-bold text-[#4D6A42]">
            {activeScene >= 3 ? "+₹18,000 (33%)" : "₹0"}
          </div>
        </div>

        <div className="p-2.5 bg-[#FDFBF7] border border-[#E2D5C3] rounded-xl shadow-2xs">
          <div className="text-[#8A7E70] uppercase text-[8px]">FLEET CAPACITY</div>
          <div className="text-sm font-bold text-[#C85A32]">
            {activeScene >= 3 ? "87.4% OPTIMAL" : "32.0% UNDERUTILIZED"}
          </div>
        </div>
      </div>
    </div>
  );
}
