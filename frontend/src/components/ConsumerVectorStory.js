"use client";

import React, { useState, useEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { Snowflake, ShieldCheck, Zap, Activity, TrendingDown, Layers } from "lucide-react";

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger);
}

/**
 * ═════════════════════════════════════════════════════════════════════════════
 * CONSUMER VECTOR STORY — 5-SCENE CINEMATIC SCROLL ENGINE (LIGHT BEIGE SYSTEM)
 * ═════════════════════════════════════════════════════════════════════════════
 */

const CONSUMER_NODES = [
  { id: "BBI", name: "BHUBANESWAR", x: 100, y: 320, load: "2,800 KG", temp: "04.0°C", active: true },
  { id: "CTC", name: "CUTTACK", x: 220, y: 240, load: "1,400 KG", temp: "04.1°C" },
  { id: "BLS", name: "BALASORE", x: 380, y: 170, load: "PASS-THRU", temp: "03.9°C" },
  { id: "CCU", name: "KOLKATA", x: 560, y: 90, load: "5,400 KG", temp: "04.0°C", active: true },
];

export default function ConsumerVectorStory() {
  const containerRef = useRef(null);
  const [scrollProgress, setScrollProgress] = useState(0);
  const [activeScene, setActiveScene] = useState(1);
  const [hoveredNode, setHoveredNode] = useState(null);

  // Camera coordinates
  const [cam, setCam] = useState({ x: 0, y: 0, scale: 1 });

  useEffect(() => {
    if (!containerRef.current) return;

    const ctx = gsap.context(() => {
      ScrollTrigger.create({
        trigger: containerRef.current,
        start: "top top",
        end: "+=2200",
        pin: true,
        scrub: 1.1,
        onUpdate: (self) => {
          const p = self.progress;
          setScrollProgress(p);

          if (p < 0.20) setActiveScene(1);
          else if (p < 0.40) setActiveScene(2);
          else if (p < 0.60) setActiveScene(3);
          else if (p < 0.80) setActiveScene(4);
          else setActiveScene(5);

          let targetCam = { x: 0, y: 0, scale: 1 };
          if (p < 0.20) {
            targetCam = { x: 0, y: 0, scale: 1 };
          } else if (p < 0.40) {
            const t = (p - 0.20) / 0.20;
            targetCam = { x: -60 * t, y: -40 * t, scale: 1 + 0.25 * t };
          } else if (p < 0.60) {
            const t = (p - 0.40) / 0.20;
            targetCam = { x: -60 + (-120 - -60) * t, y: -40 + (-70 - -40) * t, scale: 1.25 + (1.5 - 1.25) * t };
          } else if (p < 0.80) {
            const t = (p - 0.60) / 0.20;
            targetCam = { x: -120 + (-80 - -120) * t, y: -70 + (-40 - -70) * t, scale: 1.5 + (1.25 - 1.5) * t };
          } else {
            const t = (p - 0.80) / 0.20;
            targetCam = { x: -80 + (0 - -80) * t, y: -40 + (0 - -40) * t, scale: 1.25 + (1.0 - 1.25) * t };
          }
          setCam(targetCam);
        },
      });
    }, containerRef);

    return () => ctx.revert();
  }, []);

  const consolidationFactor = Math.min(1, Math.max(0, (scrollProgress - 0.25) / 0.35));

  return (
    <div ref={containerRef} className="relative w-full h-[520px] bg-[#FAF5EC] rounded-2xl border border-[#E2D5C3] p-6 overflow-hidden flex flex-col justify-between select-none shadow-md">
      
      {/* Background Mesh */}
      <div className="absolute inset-0 pointer-events-none opacity-20">
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
      <div className="relative z-10 flex items-center justify-between border-b border-[#E2D5C3] pb-3 text-xs font-mono">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-[#C85A32] animate-pulse" />
          <span className="font-bold tracking-widest text-[#1F1D1A] uppercase">
            {activeScene === 1 && "SCENE 01 // 3 INDEPENDENT SHIPMENTS"}
            {activeScene === 2 && "SCENE 02 // CORRIDOR DEMAND MATCH"}
            {activeScene === 3 && "SCENE 03 // MULTI-SHIPPER CONSOLIDATION"}
            {activeScene === 4 && "SCENE 04 // TRAJECTORY OPTIMIZATION"}
            {activeScene === 5 && "SCENE 05 // ₹18,000 SAVED (33%)"}
          </span>
        </div>

        <div className="flex items-center gap-4 text-[10px] text-[#C85A32] uppercase font-bold">
          <span>PROGRESS: {Math.round(scrollProgress * 100)}%</span>
          <span className="text-[#1F1D1A] font-bold">SCROLL TO OPERATE</span>
        </div>
      </div>

      {/* Main SVG Vector Network Stage */}
      <div className="relative z-10 my-auto w-full h-[320px] overflow-hidden flex items-center justify-center">
        
        <div
          className="w-full h-full transition-transform duration-75 ease-out flex items-center justify-center"
          style={{
            transform: `translate(${cam.x}px, ${cam.y}px) scale(${cam.scale})`,
          }}
        >
          <svg viewBox="0 0 680 400" className="w-full h-full max-h-[340px]">
            <defs>
              <linearGradient id="consSpineGrad" x1="0%" y1="100%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#C85A32" stopOpacity="0.4" />
                <stop offset="60%" stopColor="#C85A32" stopOpacity="1" />
                <stop offset="100%" stopColor="#1F1D1A" stopOpacity="0.9" />
              </linearGradient>
            </defs>

            {/* Base Highway Corridor Trace */}
            <path d="M 100 320 L 220 240 L 380 170 L 560 90" fill="none" stroke="#D4C3AC" strokeWidth="1.5" strokeDasharray="3 4" />

            {/* Inefficient Separate Routes (Scene 1 & 2) */}
            {consolidationFactor < 1 && (
              <g opacity={1 - consolidationFactor * 0.9} className="transition-opacity duration-300">
                <path
                  d={`M 100 320 Q 330 ${320 - (1 - consolidationFactor) * 80}, 560 90`}
                  fill="none"
                  stroke="#BA4336"
                  strokeWidth="1.8"
                  strokeDasharray="4 4"
                />
                <path
                  d={`M 220 240 Q 400 ${240 + (1 - consolidationFactor) * 60}, 560 90`}
                  fill="none"
                  stroke="#D49A29"
                  strokeWidth="1.5"
                  strokeDasharray="4 4"
                />
                <path
                  d={`M 380 170 Q 470 ${170 - (1 - consolidationFactor) * 40}, 560 90`}
                  fill="none"
                  stroke="#8A7E70"
                  strokeWidth="1.2"
                  strokeDasharray="4 4"
                />

                {/* Independent Cargo Markers */}
                <g transform={`translate(${100 + (560 - 100) * ((scrollProgress * 2.5) % 1)}, ${320 + (90 - 320) * ((scrollProgress * 2.5) % 1) - 20})`}>
                  <rect x="-3.5" y="-3.5" width="7" height="7" fill="#BA4336" transform="rotate(45)" />
                  <text x="8" y="-4" fill="#BA4336" fontSize="7.5" fontFamily="monospace" fontWeight="bold">SF-A (TOMATOES)</text>
                </g>
                <g transform={`translate(${220 + (560 - 220) * (((scrollProgress * 2.5) + 0.3) % 1)}, ${240 + (90 - 240) * (((scrollProgress * 2.5) + 0.3) % 1) + 18})`}>
                  <rect x="-3.5" y="-3.5" width="7" height="7" fill="#D49A29" transform="rotate(45)" />
                  <text x="8" y="10" fill="#D49A29" fontSize="7.5" fontFamily="monospace" fontWeight="bold">SF-B (DAIRY)</text>
                </g>
              </g>
            )}

            {/* Consolidated Single Master Route (Scene 3 to 5) */}
            {consolidationFactor > 0.05 && (
              <g>
                <path
                  d="M 100 320 L 220 240 L 380 170 L 560 90"
                  fill="none"
                  stroke="url(#consSpineGrad)"
                  strokeWidth={consolidationFactor > 0.8 ? "3.5" : "2.5"}
                />

                {/* Master Consolidated Cargo Unit */}
                <g
                  transform={`translate(${
                    100 + (560 - 100) * ((scrollProgress * 1.5) % 1)
                  }, ${
                    320 + (90 - 320) * ((scrollProgress * 1.5) % 1)
                  })`}
                >
                  <rect x="-5" y="-5" width="10" height="10" transform="rotate(45)" fill="#FAF5EC" stroke="#C85A32" strokeWidth="2" />
                  <circle cx="0" cy="0" r="14" fill="none" stroke="#C85A32" strokeWidth="1" strokeDasharray="2 2" className="animate-spin" />
                  
                  <g transform="translate(14, -12)">
                    <rect x="-2" y="-9" width="115" height="18" fill="#FAF5EC" stroke="#E2D5C3" rx="4" />
                    <text x="3" y="0" fill="#1F1D1A" fontSize="7.5" fontFamily="monospace" fontWeight="bold">
                      SF-CONSOL // 1 TRIP
                    </text>
                    <text x="3" y="6.5" fill="#C85A32" fontSize="6" fontFamily="monospace" fontWeight="bold">
                      87% LOAD · 04.2°C STABLE
                    </text>
                  </g>
                </g>
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
                <text x="10" y="3" fill={node.active ? "#1F1D1A" : "#5C5349"} fontSize="8.5" fontFamily="monospace" fontWeight={node.active ? "bold" : "normal"}>
                  {node.name}
                </text>
              </g>
            ))}
          </svg>
        </div>

      </div>

      {/* Bottom Annotations */}
      <div className="relative z-10 grid grid-cols-3 gap-3 pt-3 border-t border-[#E2D5C3] text-[10px] font-mono">
        <div className="p-2.5 bg-[#FDFBF7] border border-[#E2D5C3] rounded-xl shadow-xs">
          <div className="text-[#8A7E70] uppercase text-[8px]">TOTAL EXPENSE</div>
          <div className="text-sm font-bold text-[#BA4336]">
            {activeScene >= 3 ? "₹36,000" : "₹54,000"}
          </div>
        </div>

        <div className="p-2.5 bg-[#FDFBF7] border border-[#E2D5C3] rounded-xl shadow-xs">
          <div className="text-[#8A7E70] uppercase text-[8px]">EST. SAVINGS</div>
          <div className="text-sm font-bold text-[#4D6A42]">
            {activeScene >= 3 ? "+₹18,000 (33%)" : "₹0"}
          </div>
        </div>

        <div className="p-2.5 bg-[#FDFBF7] border border-[#E2D5C3] rounded-xl shadow-xs">
          <div className="text-[#8A7E70] uppercase text-[8px]">FLEET CAPACITY</div>
          <div className="text-sm font-bold text-[#C85A32]">
            {activeScene >= 3 ? "87.4% OPTIMAL" : "32.0% UNDERUTILIZED"}
          </div>
        </div>
      </div>

    </div>
  );
}
