"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import {
  Lock,
  Mail,
  User,
  ArrowRight,
  ShieldCheck,
  AlertCircle,
  RefreshCw,
  ArrowLeft,
  Truck,
  UserCircle,
  Snowflake,
  MapPin,
  Layers,
} from "lucide-react";

/**
 * ═════════════════════════════════════════════════════════════════════════════
 * SMART FREIGHT — SIGN IN & SIGN UP (GLOBAL LIGHT BEIGE SYSTEM)
 * ═════════════════════════════════════════════════════════════════════════════
 */

const CORRIDOR_NODES = [
  { id: "BBI", name: "BHUBANESWAR", x: 70, y: 310, load: "2,800 KG", temp: "04.0°C" },
  { id: "CTC", name: "CUTTACK", x: 180, y: 230, load: "1,400 KG", temp: "04.1°C" },
  { id: "BLS", name: "BALASORE", x: 320, y: 160, load: "PASS-THRU", temp: "03.9°C" },
  { id: "CCU", name: "KOLKATA", x: 470, y: 90, load: "5,400 KG", temp: "04.0°C" },
];

export default function LoginPage() {
  const router = useRouter();
  const { login, register, isAuthenticated, user } = useAuth();

  const [isRegister, setIsRegister] = useState(false);
  const [selectedRole, setSelectedRole] = useState("consumer");

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [licenseNumber, setLicenseNumber] = useState("");
  const [vehicleId, setVehicleId] = useState("");

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isAuthenticated) {
      if (user?.role === "driver") {
        router.push("/driver");
      } else {
        router.push("/");
      }
    }
  }, [isAuthenticated, user, router]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      if (isRegister) {
        if (password !== confirmPassword) {
          setError("Passwords do not match");
          setLoading(false);
          return;
        }

        const registrationData = {
          name,
          email,
          password,
          role: selectedRole,
          ...(selectedRole === "driver" && {
            license_number: licenseNumber || "IND-OR-2026-8841",
            vehicle_id: vehicleId || "OD-02-TC-9941",
          }),
        };

        const res = await register(registrationData);
        if (res.success) {
          router.push(selectedRole === "driver" ? "/driver" : "/");
        } else {
          setError(res.error || "Registration failed");
        }
      } else {
        const res = await login(email, password);
        if (res.success) {
          router.push(res.user?.role === "driver" ? "/driver" : "/");
        } else {
          setError(res.error || "Invalid credentials");
        }
      }
    } catch (err) {
      setError(err.message || "An unexpected error occurred");
    } finally {
      setLoading(false);
    }
  };

  const handleDemoLogin = (role) => {
    if (role === "driver") {
      setEmail("driver@smartfreight.io");
      setPassword("driver123");
      setSelectedRole("driver");
    } else {
      setEmail("shipper@smartfreight.io");
      setPassword("shipper123");
      setSelectedRole("consumer");
    }
    setIsRegister(false);
  };

  return (
    <div className="min-h-screen bg-[#F4EBDD] text-[#1F1D1A] font-sans flex flex-col justify-between selection:bg-[#C85A32] selection:text-[#FFFFFF]">
      
      {/* ── TOP HEADER ── */}
      <header className="h-18 border-b border-[#E2D5C3] px-6 lg:px-12 flex items-center justify-between bg-[#FAF5EC]/90 backdrop-blur-md">
        <Link href="/" className="flex items-center gap-3 group">
          <div className="w-8 h-8 rounded-lg bg-[#C85A32] text-[#FFFFFF] flex items-center justify-center font-black text-sm shadow-sm group-hover:scale-105 transition-transform">
            SF
          </div>
          <div>
            <div className="font-bold text-sm tracking-wider uppercase text-[#1F1D1A] leading-tight">
              SMART FREIGHT
            </div>
            <div className="text-[9px] text-[#8A7E70] uppercase font-mono tracking-widest">
              INDIA LOGISTICS PLATFORM
            </div>
          </div>
        </Link>

        <Link
          href="/"
          className="text-xs font-mono text-[#5C5349] hover:text-[#C85A32] transition-colors flex items-center gap-1.5 uppercase font-bold"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Corridor</span>
        </Link>
      </header>

      {/* ── SPLIT COMPOSITION AUTHENTICATION SURFACE ── */}
      <main className="flex-1 flex items-center justify-center p-6 lg:p-12">
        <div className="max-w-5xl w-full grid grid-cols-1 lg:grid-cols-12 gap-8 items-center bg-[#FAF5EC] border border-[#E2D5C3] rounded-3xl p-6 sm:p-10 shadow-lg overflow-hidden">
          
          {/* LEFT SIDE: Active Corridor Network Visual */}
          <div className="lg:col-span-6 space-y-6 hidden lg:block pr-6 border-r border-[#E2D5C3]">
            <div className="space-y-2">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#FDF0EA] border border-[#F5CABA] text-[#C85A32] font-mono text-[10px] uppercase font-bold">
                <span className="w-1.5 h-1.5 rounded-full bg-[#C85A32] animate-pulse" />
                <span>ODISHA – WB NH-16 CORRIDOR</span>
              </div>
              <h2 className="text-3xl sm:text-4xl font-black uppercase text-[#1F1D1A] leading-tight">
                Enter the Living<br /><span className="text-[#C85A32]">Freight Network.</span>
              </h2>
              <p className="text-sm text-[#5C5349] leading-relaxed">
                Connect agricultural shippers, cold-chain assets, and heavy haulers across Bhubaneswar, Cuttack, Balasore, and Kolkata.
              </p>
            </div>

            {/* Miniature Vector Network Canvas */}
            <div className="p-4 bg-[#FDFBF7] border border-[#E2D5C3] rounded-2xl relative overflow-hidden shadow-xs">
              <svg viewBox="0 0 540 380" className="w-full h-auto">
                {/* Background Network Edges */}
                <path
                  d="M 70 310 Q 140 270, 180 230 T 320 160 T 470 90"
                  fill="none"
                  stroke="#C85A32"
                  strokeWidth="2.5"
                  strokeDasharray="6 8"
                  opacity="0.8"
                />

                {/* Nodes */}
                {CORRIDOR_NODES.map((node) => (
                  <g key={node.id} transform={`translate(${node.x}, ${node.y})`}>
                    <circle cx="0" cy="0" r="10" fill="#FAF5EC" stroke="#C85A32" strokeWidth="2" />
                    <circle cx="0" cy="0" r="4" fill="#C85A32" />
                    <text x="0" y="24" fill="#1F1D1A" fontSize="9.5" fontFamily="monospace" fontWeight="bold" textAnchor="middle">
                      {node.name}
                    </text>
                    <text x="0" y="34" fill="#4D6A42" fontSize="7.5" fontFamily="monospace" textAnchor="middle" fontWeight="bold">
                      {node.temp}
                    </text>
                  </g>
                ))}
              </svg>
            </div>

            {/* Quick Demo Accounts */}
            <div className="space-y-2 pt-2">
              <span className="text-[10px] font-mono uppercase text-[#8A7E70] font-bold block">
                Quick Access Demo Portals:
              </span>
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => handleDemoLogin("consumer")}
                  className="flex-1 py-2.5 px-3.5 rounded-xl bg-[#FDFBF7] hover:bg-[#F4EBDD] border border-[#E2D5C3] hover:border-[#C85A32] text-xs font-mono text-[#1F1D1A] transition-all text-left flex items-center justify-between cursor-pointer shadow-xs"
                >
                  <span className="font-bold">Shipper Portal</span>
                  <span className="text-[9px] text-[#C85A32] font-bold">Instant →</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleDemoLogin("driver")}
                  className="flex-1 py-2.5 px-3.5 rounded-xl bg-[#FDFBF7] hover:bg-[#F4EBDD] border border-[#E2D5C3] hover:border-[#4D6A42] text-xs font-mono text-[#1F1D1A] transition-all text-left flex items-center justify-between cursor-pointer shadow-xs"
                >
                  <span className="font-bold">Driver Terminal</span>
                  <span className="text-[9px] text-[#4D6A42] font-bold">Instant →</span>
                </button>
              </div>
            </div>
          </div>

          {/* RIGHT SIDE: Authentication Form */}
          <div className="lg:col-span-6 space-y-6">
            {/* Mode Switcher */}
            <div className="flex items-center p-1 bg-[#F4EBDD] border border-[#E2D5C3] rounded-xl font-mono text-xs">
              <button
                type="button"
                onClick={() => setIsRegister(false)}
                className={`flex-1 py-2 rounded-lg font-bold transition-all cursor-pointer ${
                  !isRegister
                    ? "bg-[#FDFBF7] text-[#C85A32] shadow-xs border border-[#E2D5C3]"
                    : "text-[#5C5349] hover:text-[#1F1D1A]"
                }`}
              >
                SIGN IN
              </button>
              <button
                type="button"
                onClick={() => setIsRegister(true)}
                className={`flex-1 py-2 rounded-lg font-bold transition-all cursor-pointer ${
                  isRegister
                    ? "bg-[#FDFBF7] text-[#C85A32] shadow-xs border border-[#E2D5C3]"
                    : "text-[#5C5349] hover:text-[#1F1D1A]"
                }`}
              >
                CREATE ACCOUNT
              </button>
            </div>

            {/* Error Notification */}
            {error && (
              <div className="p-3.5 bg-[#FDF0EA] border border-[#F5CABA] rounded-xl flex items-center gap-2.5 text-xs text-[#BA4336] font-mono">
                <AlertCircle className="w-4 h-4 text-[#BA4336] shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {/* Role Selection (If registering) */}
            {isRegister && (
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setSelectedRole("consumer")}
                  className={`p-3 rounded-xl border text-xs font-mono text-left transition-all cursor-pointer flex items-center gap-2.5 ${
                    selectedRole === "consumer"
                      ? "bg-[#FDFBF7] border-[#C85A32] text-[#1F1D1A] shadow-xs"
                      : "bg-[#F4EBDD]/60 border-[#E2D5C3] text-[#5C5349]"
                  }`}
                >
                  <UserCircle className="w-4 h-4 text-[#C85A32]" />
                  <div>
                    <div className="font-bold">Shipper</div>
                    <div className="text-[9px] text-[#8A7E70]">Agricultural / Cargo</div>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => setSelectedRole("driver")}
                  className={`p-3 rounded-xl border text-xs font-mono text-left transition-all cursor-pointer flex items-center gap-2.5 ${
                    selectedRole === "driver"
                      ? "bg-[#FDFBF7] border-[#4D6A42] text-[#1F1D1A] shadow-xs"
                      : "bg-[#F4EBDD]/60 border-[#E2D5C3] text-[#5C5349]"
                  }`}
                >
                  <Truck className="w-4 h-4 text-[#4D6A42]" />
                  <div>
                    <div className="font-bold">Driver</div>
                    <div className="text-[9px] text-[#8A7E70]">Fleet Operator</div>
                  </div>
                </button>
              </div>
            )}

            {/* Form Fields */}
            <form onSubmit={handleSubmit} className="space-y-4 font-sans text-xs">
              {isRegister && (
                <div>
                  <label className="block text-[10px] font-mono font-bold uppercase text-[#5C5349] mb-1.5">
                    Full Name
                  </label>
                  <div className="relative">
                    <User className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-[#8A7E70]" />
                    <input
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="e.g. Rohan Sharma"
                      required
                      className="w-full pl-10 pr-4 py-2.5 bg-[#FFFFFF] border border-[#E2D5C3] rounded-xl text-[#1F1D1A] focus:outline-none focus:border-[#C85A32] transition-colors"
                    />
                  </div>
                </div>
              )}

              <div>
                <label className="block text-[10px] font-mono font-bold uppercase text-[#5C5349] mb-1.5">
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-[#8A7E70]" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="user@smartfreight.io"
                    required
                    className="w-full pl-10 pr-4 py-2.5 bg-[#FFFFFF] border border-[#E2D5C3] rounded-xl text-[#1F1D1A] focus:outline-none focus:border-[#C85A32] transition-colors"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-mono font-bold uppercase text-[#5C5349] mb-1.5">
                  Password
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-[#8A7E70]" />
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    required
                    className="w-full pl-10 pr-4 py-2.5 bg-[#FFFFFF] border border-[#E2D5C3] rounded-xl text-[#1F1D1A] focus:outline-none focus:border-[#C85A32] transition-colors"
                  />
                </div>
              </div>

              {isRegister && (
                <div>
                  <label className="block text-[10px] font-mono font-bold uppercase text-[#5C5349] mb-1.5">
                    Confirm Password
                  </label>
                  <div className="relative">
                    <Lock className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-[#8A7E70]" />
                    <input
                      type="password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="••••••••"
                      required
                      className="w-full pl-10 pr-4 py-2.5 bg-[#FFFFFF] border border-[#E2D5C3] rounded-xl text-[#1F1D1A] focus:outline-none focus:border-[#C85A32] transition-colors"
                    />
                  </div>
                </div>
              )}

              {/* Submit CTA */}
              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 mt-2 rounded-xl bg-[#1F1D1A] hover:bg-[#3D352E] text-[#FDFBF7] font-bold tracking-wider uppercase transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer active:scale-[0.99] disabled:opacity-50"
              >
                {loading ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>AUTHENTICATING...</span>
                  </>
                ) : (
                  <>
                    <span>{isRegister ? "CREATE SMART FREIGHT ACCOUNT" : "SIGN IN TO PLATFORM"}</span>
                    <ArrowRight className="w-4 h-4 text-[#C85A32]" />
                  </>
                )}
              </button>
            </form>
          </div>

        </div>
      </main>

      {/* ── MINIMAL FOOTER ── */}
      <footer className="h-14 border-t border-[#E2D5C3] px-6 lg:px-12 flex items-center justify-between text-xs text-[#8A7E70] font-mono select-none bg-[#FAF5EC]/60">
        <span>SMART FREIGHT DISPATCH GATEWAY</span>
        <span>20.2961°N, 85.8245°E // NH-16</span>
      </footer>

    </div>
  );
}
