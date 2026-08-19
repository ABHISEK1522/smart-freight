"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import {
  ArrowRight,
  LogIn,
  ShieldCheck,
  Snowflake,
  Activity,
  Layers,
  MapPin,
} from "lucide-react";

/**
 * ═════════════════════════════════════════════════════════════════════════════
 * SMART FREIGHT — VIDEO-BASED FULL-SCREEN HOMEPAGE
 * ═════════════════════════════════════════════════════════════════════════════
 * 
 * 1. Full-screen persistent HTML5 Video Background (`hero_background.mp4`)
 * 2. Uninterrupted playback: autoplays, loops, stays muted, never pauses or resets on scroll
 * 3. Minimal, elegant, non-intrusive Smart Freight content overlay
 * 4. Multi-stage scroll chapters revealing logistics intelligence above the video
 */

export default function Interactive3DWorldHomepage({ onLaunchWorkspace }) {
  const videoRef = useRef(null);

  useEffect(() => {
    // Ensure video autoplays smoothly on mount
    if (videoRef.current) {
      videoRef.current.play().catch((err) => {
        console.log("Autoplay caught:", err);
      });
    }
  }, []);

  return (
    <div className="relative min-h-screen bg-[#0A0D12] text-[#F4F6F9] font-sans selection:bg-[#E5A823] selection:text-[#0A0D12] overflow-x-hidden">
      
      {/* ═══════════════════════════════════════════════════════════
          PERSISTENT FULL-SCREEN VIDEO BACKGROUND
          (Never remounts, never pauses, never resets on scroll)
      ═══════════════════════════════════════════════════════════ */}
      <div className="fixed inset-0 w-full h-full z-0 overflow-hidden pointer-events-none">
        <video
          ref={videoRef}
          src="/videos/hero_background.mp4"
          autoPlay
          muted
          loop
          playsInline
          preload="auto"
          className="w-full h-full object-cover opacity-85 scale-100"
        />
        {/* Soft Vignette Overlay for Crisp Typography Legibility */}
        <div className="absolute inset-0 bg-gradient-to-b from-[#0A0D12]/60 via-[#0A0D12]/20 to-[#0A0D12]/75" />
      </div>

      {/* ── STICKY TOP NAVIGATION ── */}
      <header className="sticky top-0 z-50 px-6 lg:px-12 h-18 flex items-center justify-between bg-[#0A0D12]/40 backdrop-blur-md border-b border-white/10 select-none">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-[#E5A823] text-[#0A0D12] flex items-center justify-center font-black text-sm shadow-md">
            SF
          </div>
          <div>
            <div className="font-bold text-sm tracking-wider uppercase text-white leading-tight">
              Smart Freight
            </div>
            <div className="text-[9px] text-[#A0AEC0] uppercase tracking-widest font-mono">
              India Logistics Platform
            </div>
          </div>
        </div>

        <nav className="flex items-center gap-4 text-xs font-mono">
          <Link
            href="/login"
            className="px-4 py-2 text-white/90 hover:text-white transition-colors tracking-widest uppercase font-bold flex items-center gap-1.5"
          >
            <LogIn className="w-3.5 h-3.5 text-[#E5A823]" />
            <span>Sign In</span>
          </Link>
          <button
            onClick={onLaunchWorkspace}
            className="px-5 py-2.5 rounded-full bg-[#E5A823] hover:bg-[#F5BF38] text-[#0A0D12] font-bold tracking-wider uppercase transition-all active:scale-[0.98] cursor-pointer shadow-lg shadow-[#E5A823]/20 flex items-center gap-2"
          >
            <span>Plan a Shipment</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </nav>
      </header>

      {/* ═══════════════════════════════════════════════════════════
          SCROLLING CONTENT SECTIONS OVER PERSISTENT VIDEO
      ═══════════════════════════════════════════════════════════ */}
      <main className="relative z-10 flex flex-col">
        
        {/* ── SECTION 1: HERO OVERLAY ── */}
        <section className="min-h-[90vh] flex flex-col items-center justify-center text-center px-6 lg:px-12 py-20">
          <div className="max-w-4xl mx-auto space-y-6">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-black/40 backdrop-blur-md border border-white/15 text-[11px] font-mono tracking-widest uppercase text-[#E5A823]">
              <span className="w-2 h-2 rounded-full bg-[#E5A823] animate-pulse" />
              <span>AI-Powered Freight Consolidation & Logistics</span>
            </div>

            <h1 className="text-5xl sm:text-7xl lg:text-8xl font-black uppercase tracking-tight text-white leading-[0.92] drop-shadow-lg">
              Smart<br />Freight
            </h1>

            <p className="text-base sm:text-xl text-white/80 max-w-2xl mx-auto font-light leading-relaxed drop-shadow">
              Plan safer routes, optimize vehicle load capacity, and reduce freight transport costs across India.
            </p>

            <div className="flex flex-wrap items-center justify-center gap-4 pt-6">
              <button
                onClick={onLaunchWorkspace}
                className="px-8 py-4 rounded-full bg-[#E5A823] hover:bg-[#F5BF38] text-[#0A0D12] text-sm font-black tracking-widest uppercase transition-all active:scale-95 cursor-pointer shadow-xl flex items-center gap-2.5"
              >
                <span>Plan a Shipment</span>
                <ArrowRight className="w-4 h-4" />
              </button>
              <Link
                href="/login"
                className="px-7 py-4 rounded-full bg-black/40 hover:bg-black/60 text-white text-sm font-bold tracking-widest uppercase transition-all backdrop-blur-md border border-white/20 flex items-center gap-2"
              >
                <span>Account Login</span>
              </Link>
            </div>
          </div>
        </section>

        {/* ── SECTION 2: INTELLIGENT CONSOLIDATION ── */}
        <section className="min-h-[85vh] flex items-center justify-start px-6 sm:px-12 lg:px-24 py-20">
          <div className="max-w-xl bg-black/50 backdrop-blur-xl border border-white/15 p-8 sm:p-10 rounded-2xl space-y-5 shadow-2xl">
            <div className="flex items-center gap-2 text-[#E5A823] text-xs font-mono font-bold tracking-widest uppercase">
              <Layers className="w-4 h-4" />
              <span>Intelligent Load Consolidation</span>
            </div>
            
            <h2 className="text-3xl sm:text-5xl font-black uppercase tracking-tight text-white leading-tight">
              Move More.<br /><span className="text-[#E5A823]">Waste Less.</span>
            </h2>

            <p className="text-sm sm:text-base text-white/80 font-light leading-relaxed">
              Consolidate partial loads from independent agricultural shippers into unified linehaul trips, eliminating empty freight miles and slashing fuel burn.
            </p>

            <div className="grid grid-cols-2 gap-4 pt-2 font-mono">
              <div className="p-4 bg-white/5 border border-white/10 rounded-xl">
                <span className="text-[10px] text-[#A0AEC0] uppercase block">Load Factor</span>
                <span className="text-2xl font-bold text-[#E5A823]">87.4%</span>
              </div>
              <div className="p-4 bg-white/5 border border-white/10 rounded-xl">
                <span className="text-[10px] text-[#A0AEC0] uppercase block">Avg. Savings</span>
                <span className="text-2xl font-bold text-white">₹18,000</span>
              </div>
            </div>
          </div>
        </section>

        {/* ── SECTION 3: COLD-CHAIN INTEGRITY ── */}
        <section className="min-h-[85vh] flex items-center justify-end px-6 sm:px-12 lg:px-24 py-20">
          <div className="max-w-xl bg-black/50 backdrop-blur-xl border border-white/15 p-8 sm:p-10 rounded-2xl space-y-5 shadow-2xl">
            <div className="flex items-center gap-2 text-[#38B2AC] text-xs font-mono font-bold tracking-widest uppercase">
              <Snowflake className="w-4 h-4" />
              <span>Active Cryogenic Monitoring</span>
            </div>

            <h2 className="text-3xl sm:text-5xl font-black uppercase tracking-tight text-white leading-tight">
              Keep It Fresh.<br /><span className="text-[#38B2AC]">Keep It Moving.</span>
            </h2>

            <p className="text-sm sm:text-base text-white/80 font-light leading-relaxed">
              IoT-enabled telemetry continuously monitors temperature-sensitive perishables, dairy, and pharmaceuticals at 2°C to 8°C throughout the transit corridor.
            </p>

            <div className="p-4 bg-white/5 border border-[#38B2AC]/40 rounded-xl flex items-center justify-between font-mono">
              <div>
                <span className="text-[10px] text-[#A0AEC0] uppercase block">Reefer Telemetry</span>
                <span className="text-xl font-bold text-[#38B2AC]">04.2°C (PASS)</span>
              </div>
              <span className="px-3 py-1 bg-[#38B2AC]/20 border border-[#38B2AC]/50 rounded-full text-xs font-bold text-[#38B2AC]">
                SECURE
              </span>
            </div>
          </div>
        </section>

        {/* ── SECTION 4: HIGHWAY CORRIDOR CALL TO ACTION ── */}
        <section className="min-h-[85vh] flex flex-col items-center justify-center text-center px-6 lg:px-12 py-20">
          <div className="max-w-3xl mx-auto bg-black/60 backdrop-blur-2xl border border-white/20 p-10 sm:p-14 rounded-3xl space-y-6 shadow-2xl">
            <div className="inline-flex items-center gap-2 text-xs font-mono font-bold tracking-widest uppercase text-[#E5A823]">
              <MapPin className="w-4 h-4" />
              <span>Odisha – West Bengal NH-16 Spine</span>
            </div>

            <h2 className="text-4xl sm:text-6xl font-black uppercase tracking-tight text-white leading-tight">
              Ready to Dispatch Smarter?
            </h2>

            <p className="text-base text-white/80 max-w-xl mx-auto font-light">
              Connect your fleet or book freight across Bhubaneswar, Cuttack, Balasore, and Kolkata.
            </p>

            <div className="pt-4 flex flex-wrap items-center justify-center gap-4">
              <button
                onClick={onLaunchWorkspace}
                className="px-8 py-4 rounded-full bg-[#E5A823] hover:bg-[#F5BF38] text-[#0A0D12] font-black text-sm tracking-widest uppercase transition-all shadow-xl active:scale-95 cursor-pointer flex items-center gap-2"
              >
                <span>Enter Dispatch Tower</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </section>

      </main>

      {/* ── MINIMAL FOOTER ── */}
      <footer className="relative z-20 border-t border-white/10 bg-[#0A0D12]/80 backdrop-blur-md px-6 lg:px-12 py-6 text-xs text-[#A0AEC0] flex flex-col sm:flex-row items-center justify-between gap-4 font-mono select-none">
        <span>© {new Date().getFullYear()} Smart Freight Logistics Platform.</span>
        <div className="flex items-center gap-6">
          <Link href="/login" className="hover:text-white transition-colors">
            Driver & Shipper Portal
          </Link>
          <span>NH-16 Corridor Active</span>
        </div>
      </footer>

    </div>
  );
}
