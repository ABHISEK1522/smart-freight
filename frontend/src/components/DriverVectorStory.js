"use client";

import React, { useState, useEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { Snowflake, ShieldCheck, Zap, Activity, Clock, MapPin } from "lucide-react";

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger);
}

/**
 * ═════════════════════════════════════════════════════════════════════════════
 * DRIVER VECTOR STORY — 7-SCENE LIVE TRIP SCROLL ENGINE (LIGHT BEIGE SYSTEM)
 * ═════════════════════════════════════════════════════════════════════════════
 */

const DRIVER_NODES = [
  { id: "BBI", name: "BHUBANESWAR", x: 80, y: 320, eta: "DEPARTED 06:00" },
  { id: "CTC", name: "CUTTACK", x: 180, y: 250, eta: "PASSED 07:15" },
  { id: "BLS", name: "BALASORE", x: 320, y: 180, eta: "ETA 11:30" },
  { id: "KGP", name: "KHARAGPUR", x: 440, y: 130, eta: "ETA 15:00" },
  { id: "CCU", name: "KOLKATA", x: 580, y: 80, eta: "ETA 18:42" },
];

export default function DriverVectorStory({ shipmentId = "SF-E35749" }) {
  const containerRef = useRef(null);
  const [scrollProgress, setScrollProgress] = useState(0);
  const [activeScene, setActiveScene] = useState(1);

  // Camera coordinates
  const [cam, setCam] = useState({ x: 0, y: 0, scale: 1 });

  useEffect(() => {
    if (!containerRef.current) return;

    const ctx = gsap.context(() => {
      ScrollTrigger.create({
        trigger: containerRef.current,
        start: "top top",
        end: "+=2400",
        pin: true,
        scrub: 1.1,
        onUpdate: (self) => {
          const p = self.progress;
          setScrollProgress(p);

          if (p < 0.15) setActiveScene(1);
          else if (p < 0.30) setActiveScene(2);
          else if (p < 0.45) setActiveScene(3);
          else if (p < 0.60) setActiveScene(4);
          else if (p < 0.75) setActiveScene(5);
          else if (p < 0.88) setActiveScene(6);
          else setActiveScene(7);

          let targetCam = { x: 0, y: 0, scale: 1 };
          if (p < 0.15) {
            targetCam = { x: 0, y: 0, scale: 1 };
          } else if (p < 0.45) {
            const t = (p - 0.15) / 0.30;
            targetCam = { x: -140 * t, y: -80 * t, scale: 1 + 0.35 * t };
          } else if (p < 0.75) {
            const t = (p - 0.45) / 0.30;
            targetCam = { x: -140 + (-220 - -140) * t, y: -80 + (-120 - -80) * t, scale: 1.35 + (1.5 - 1.35) * t };
          } else {
            const t = (p - 0.75) / 0.25;
            targetCam = { x: -220 + (0 - -220) * t, y: -120 + (0 - -120) * t, scale: 1.5 + (1.0 - 1.5) * t };
          }
          setCam(targetCam);
        },
      });
    }, containerRef);

    return () => ctx.revert();
  }, []);

  const isRiskActive = scrollProgress >= 0.60 && scrollProgress <= 0.82;
  const vehicleProgress = scrollProgress;

  return (
    <div ref={containerRef} className="relative w-full h-[520px] bg-[#FAF5EC] rounded-2xl border border-[#E2D5C3] p-6 overflow-hidden flex flex-col justify-between select-none shadow-md">
      
      {/* Background Grid Pattern */}
      <div className="absolute inset-0 pointer-events-none opacity-20">
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
      <div className="relative z-10 flex items-center justify-between border-b border-[#E2D5C3] pb-3 text-xs font-mono">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-[#C85A32] animate-pulse" />
          <span className="font-bold tracking-widest text-[#1F1D1A] uppercase">
            {activeScene === 1 && "SCENE 01 // CURRENT TRIP: " + shipmentId}
            {activeScene === 2 && "SCENE 02 // NH-16 CORRIDOR ADVANCEMENT"}
            {activeScene === 3 && "SCENE 03 // VEHICLE TELEMETRY LOCK"}
            {activeScene === 4 && "SCENE 04 // 04.2°C CRYOGENIC REGULATION"}
            {activeScene === 5 && "SCENE 05 // BALASORE RISK DETECTION"}
            {activeScene === 6 && "SCENE 06 // DYNAMIC HIGHWAY BYPASS"}
            {activeScene === 7 && "SCENE 07 // KOLKATA ARRIVAL: READY"}
          </span>
        </div>

        <div className="flex items-center gap-4 text-[10px] text-[#C85A32] uppercase font-bold">
          <span>PROGRESS: {Math.round(scrollProgress * 100)}%</span>
          <span className="text-[#1F1D1A] font-bold">SCROLL TO ADVANCE TRIP</span>
        </div>
      </div>

      {/* SVG Canvas */}
      <div className="relative z-10 my-auto w-full h-[320px] overflow-hidden flex items-center justify-center">
        <div
          className="w-full h-full transition-transform duration-75 ease-out flex items-center justify-center"
          style={{
            transform: `translate(${cam.x}px, ${cam.y}px) scale(${cam.scale})`,
          }}
        >
          <svg viewBox="0 0 680 400" className="w-full h-full max-h-[340px]">
            <defs>
              <linearGradient id="driverSpineGrad" x1="0%" y1="100%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#C85A32" stopOpacity="0.4" />
                <stop offset="70%" stopColor="#C85A32" stopOpacity="1" />
                <stop offset="100%" stopColor="#1F1D1A" stopOpacity="0.9" />
              </linearGradient>
            </defs>

            {/* Base Corridor */}
            <path
              d="M 80 320 L 180 250 L 320 180 L 440 130 L 580 80"
              fill="none"
              stroke={isRiskActive ? "rgba(186, 67, 54, 0.4)" : "url(#driverSpineGrad)"}
              strokeWidth="2.8"
              strokeDasharray={isRiskActive ? "4 4" : "none"}
            />

            {/* Bypass Curve (Scene 6) */}
            {isRiskActive && (
              <g>
                <path
                  d="M 180 250 C 240 190, 270 120, 360 120 S 440 130, 580 80"
                  fill="none"
                  stroke="#C85A32"
                  strokeWidth="3"
                />
                <g transform="translate(290, 130)">
                  <rect x="-40" y="-10" width="80" height="16" fill="#FAF5EC" stroke="#C85A32" rx="4" />
                  <text x="0" y="-1" fill="#C85A32" fontSize="7.5" fontFamily="monospace" textAnchor="middle" fontWeight="bold">
                    BYPASS ACTIVE
                  </text>
                </g>
              </g>
            )}

            {/* Hazard Beacon at Balasore */}
            {isRiskActive && (
              <g transform="translate(320, 180)">
                <circle cx="0" cy="0" r="16" fill="rgba(186, 67, 54, 0.2)" stroke="#BA4336" strokeWidth="1.2" className="animate-ping" />
                <circle cx="0" cy="0" r="6" fill="#BA4336" />
                <text x="10" y="-4" fill="#BA4336" fontSize="7.5" fontFamily="monospace" fontWeight="bold">
                  CONGESTION RISK
                </text>
              </g>
            )}

            {/* Moving Driver Vehicle Beacon */}
            <g
              transform={`translate(${
                80 + (580 - 80) * vehicleProgress
              }, ${
                320 + (80 - 320) * vehicleProgress
              })`}
            >
              <rect x="-5" y="-5" width="10" height="10" transform="rotate(45)" fill="#FAF5EC" stroke="#C85A32" strokeWidth="2" />
              <circle cx="0" cy="0" r="14" fill="none" stroke="#C85A32" strokeWidth="1" strokeDasharray="2 2" className="animate-spin" />
              
              <g transform="translate(14, -12)">
                <rect x="-2" y="-9" width="120" height="18" fill="#FAF5EC" stroke="#E2D5C3" rx="4" />
                <text x="3" y="0" fill="#1F1D1A" fontSize="7.5" fontFamily="monospace" fontWeight="bold">
                  {shipmentId} [REEFER]
                </text>
                <text x="3" y="6.5" fill="#4D6A42" fontSize="6" fontFamily="monospace" fontWeight="bold">
                  04.2°C · 87% CAPACITY
                </text>
              </g>
            </g>

            {/* Waypoint Nodes */}
            {DRIVER_NODES.map((node, idx) => {
              const isPassed = vehicleProgress >= (idx / (DRIVER_NODES.length - 1));
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
                  <text x="10" y="3" fill={isPassed ? "#1F1D1A" : "#8A7E70"} fontSize="8" fontFamily="monospace" fontWeight={isPassed ? "bold" : "normal"}>
                    {node.name}
                  </text>
                  <text x="10" y="11" fill="#C85A32" fontSize="6" fontFamily="monospace" fontWeight="bold">
                    {node.eta}
                  </text>
                </g>
              );
            })}
          </svg>
        </div>
      </div>

      {/* Driver Telemetry Footer */}
      <div className="relative z-10 grid grid-cols-4 gap-2 pt-3 border-t border-[#E2D5C3] text-[10px] font-mono">
        <div className="p-2.5 bg-[#FDFBF7] border border-[#E2D5C3] rounded-xl shadow-xs">
          <div className="text-[#8A7E70] uppercase text-[8px]">TOTAL DISTANCE</div>
          <div className="text-xs font-bold text-[#1F1D1A]">428 KM</div>
        </div>

        <div className="p-2.5 bg-[#FDFBF7] border border-[#E2D5C3] rounded-xl shadow-xs">
          <div className="text-[#8A7E70] uppercase text-[8px]">ESTIMATED ETA</div>
          <div className="text-xs font-bold text-[#C85A32]">18:42 IST</div>
        </div>

        <div className="p-2.5 bg-[#FDFBF7] border border-[#E2D5C3] rounded-xl shadow-xs">
          <div className="text-[#8A7E70] uppercase text-[8px]">COLD CHAIN</div>
          <div className="text-xs font-bold text-[#4D6A42]">04.2°C STABLE</div>
        </div>

        <div className="p-2.5 bg-[#FDFBF7] border border-[#E2D5C3] rounded-xl shadow-xs">
          <div className="text-[#8A7E70] uppercase text-[8px]">CARGO PAYLOAD</div>
          <div className="text-xs font-bold text-[#1F1D1A]">3,200 KG</div>
        </div>
      </div>

    </div>
  );
}
