"use client";

import React, { useState, useEffect } from "react";
import Sidebar from "@/components/Sidebar";
import VehicleIllustration from "@/components/VehicleIllustration";
import {
  Truck,
  Plus,
  RefreshCw,
  ThermometerSnowflake,
  ShieldCheck,
  AlertCircle,
  CheckCircle2,
  X,
  Scale,
  IndianRupee,
  Layers,
  Activity,
  AlertOctagon,
  Eye,
  Sliders,
  Check,
  Snowflake,
  ArrowRight,
} from "lucide-react";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";

export default function VehiclesPage() {
  const [vehicles, setVehicles] = useState([]);
  const [trips, setTrips] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentTime, setCurrentTime] = useState("");

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState("");

  // Selected vehicle for inspector/detail modal
  const [inspectVehicle, setInspectVehicle] = useState(null);

  // New Vehicle Form State
  const [formData, setFormData] = useState({
    id: "",
    type: "Refrigerated Truck",
    capacity_kg: 5000,
    base_cost: 18000,
    is_refrigerated: true,
    status: "Available",
  });

  // Time Sync
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setCurrentTime(
        now.toLocaleDateString("en-IN", {
          day: "2-digit",
          month: "short",
          year: "numeric",
        }) +
          " " +
          now.toLocaleTimeString("en-IN", {
            hour: "2-digit",
            minute: "2-digit",
            second: "2-digit",
            hour12: false,
          }) +
          " IST"
      );
    };
    updateTime();
    const timer = setInterval(updateTime, 1000);
    return () => clearInterval(timer);
  }, []);

  const fetchFleetData = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${API_BASE_URL}/vehicles`);
      if (res.ok) {
        const data = await res.json();
        setVehicles(data);
      } else {
        throw new Error("Unable to retrieve vehicles");
      }
    } catch (err) {
      console.error("Error fetching fleet data:", err);
      setError("Unable to connect to live fleet telemetry. Showing cached registry.");
      setVehicles([
        {
          id: "VH-101",
          type: "Refrigerated Truck",
          capacity_kg: 8000,
          base_cost: 24000,
          is_refrigerated: true,
          status: "Available",
        },
        {
          id: "VH-102",
          type: "Refrigerated Van",
          capacity_kg: 3500,
          base_cost: 16000,
          is_refrigerated: true,
          status: "In Transit",
        },
        {
          id: "VH-103",
          type: "Standard Freight Truck",
          capacity_kg: 12000,
          base_cost: 28000,
          is_refrigerated: false,
          status: "Available",
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFleetData();
  }, []);

  const handleCreateVehicle = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setFormError("");

    try {
      const res = await fetch(`${API_BASE_URL}/vehicles`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: formData.id || `VH-${Math.floor(100 + Math.random() * 900)}`,
          type: formData.type,
          capacity_kg: Number(formData.capacity_kg),
          base_cost: Number(formData.base_cost),
          is_refrigerated: Boolean(formData.is_refrigerated),
          status: formData.status,
        }),
      });

      if (!res.ok) {
        throw new Error("Failed to register vehicle in database.");
      }

      setIsModalOpen(false);
      fetchFleetData();
    } catch (err) {
      setFormError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="flex min-h-screen bg-[#F4EBDD] text-[#1F1D1A] font-sans selection:bg-[#C85A32] selection:text-[#FFFFFF]">
      <Sidebar />

      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Header */}
        <header className="h-18 bg-[#FAF5EC] border-b border-[#E2D5C3] px-6 flex items-center justify-between sticky top-0 z-20 select-none">
          <div className="flex items-center gap-3.5">
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#FDFBF7] border border-[#E2D5C3] shadow-xs">
              <span className="w-2 h-2 rounded-full bg-[#C85A32] animate-pulse" />
              <span className="text-[11px] font-bold uppercase tracking-wider text-[#1F1D1A]">
                VEHICLE TELEMETRY // ASSET CATALOG
              </span>
            </div>
            <span className="text-[#D4C3AC] text-xs">|</span>
            <div className="text-[11px] text-[#C85A32] hidden sm:flex items-center gap-1.5 font-mono">
              <span className="text-[#8A7E70]">REGISTRY:</span>
              <span className="font-bold text-[#1F1D1A]">{vehicles.length} ACTIVE VEHICLES</span>
            </div>
          </div>

          <div className="flex items-center gap-4 text-xs font-mono select-none">
            <span className="hidden lg:block bg-[#FDFBF7] text-[#C85A32] px-3 py-1 rounded-lg border border-[#E2D5C3] font-bold shadow-xs">{currentTime}</span>
            <button
              onClick={() => setIsModalOpen(true)}
              className="px-4 py-2 bg-[#1F1D1A] hover:bg-[#3D352E] text-[#FDFBF7] rounded-full text-xs font-bold uppercase tracking-wider transition-all flex items-center gap-1.5 shadow-sm active:scale-[0.98] cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5 text-[#C85A32]" />
              <span>Add Vehicle</span>
            </button>
          </div>
        </header>

        {/* Main Content */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 space-y-6">
          <div className="max-w-6xl mx-auto space-y-6 animate-fade-in">
            
            {/* Catalog Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {vehicles.map((v) => (
                <div
                  key={v.id}
                  className="p-5 bg-[#FAF5EC] border border-[#E2D5C3] rounded-2xl shadow-sm flex flex-col justify-between space-y-4 relative hover:border-[#C85A32] transition-colors"
                >
                  <div>
                    {/* Header */}
                    <div className="flex items-center justify-between border-b border-[#E2D5C3] pb-3">
                      <div className="flex items-center gap-2 font-mono">
                        <span className="text-xs font-bold text-[#C85A32]">{v.id}</span>
                        <span className="text-[10px] text-[#5C5349] font-bold">
                          {v.is_refrigerated ? "❄️ Reefer" : "📦 Ambient"}
                        </span>
                      </div>
                      <span
                        className={`text-[9px] font-mono font-bold px-2.5 py-0.5 rounded-full border ${
                          v.status === "Available"
                            ? "bg-[#EBF3EA] text-[#2D5926] border-[#C4DEC0]"
                            : v.status === "In Transit"
                            ? "bg-[#FDF0EA] text-[#C85A32] border-[#F5CABA]"
                            : "bg-[#FDF0EA] text-[#BA4336] border-[#F5CABA]"
                        }`}
                      >
                        ● {v.status?.toUpperCase() || "AVAILABLE"}
                      </span>
                    </div>

                    {/* Illustration Showcase */}
                    <div className="py-3 my-3 flex items-center justify-center bg-[#FDFBF7] border border-[#E2D5C3] rounded-xl overflow-hidden shadow-xs">
                      <VehicleIllustration
                        type={v.type}
                        mode={v.status === "In Transit" ? "driving" : "idle"}
                        isSelected={false}
                        showRoad={true}
                        className="w-36 h-20"
                      />
                    </div>

                    {/* Specifications */}
                    <div className="space-y-1">
                      <h3 className="text-xs font-bold text-[#1F1D1A]">{v.type}</h3>
                      <div className="flex items-center justify-between text-[10px] font-mono text-[#5C5349] pt-1">
                        <span>Payload: <strong className="text-[#1F1D1A]">{v.capacity_kg.toLocaleString()} kg</strong></span>
                        <span>Base: ₹{v.base_cost.toLocaleString()}</span>
                      </div>
                    </div>
                  </div>

                  <div className="pt-3 border-t border-[#E2D5C3] flex items-center justify-between font-mono text-xs">
                    <button
                      onClick={() => setInspectVehicle(v)}
                      className="text-[10px] text-[#C85A32] hover:underline font-bold inline-flex items-center gap-1 cursor-pointer"
                    >
                      <Eye className="w-3 h-3" />
                      <span>Inspect Telemetry</span>
                    </button>
                    <span className="text-[9px] text-[#8A7E70]">NH-16 Registered</span>
                  </div>
                </div>
              ))}
            </div>

            {/* Modal Dialog */}
            {isModalOpen && (
              <div className="fixed inset-0 bg-black/50 backdrop-blur-xs z-50 flex items-center justify-center p-4">
                <div className="bg-[#FAF5EC] border border-[#E2D5C3] rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4">
                  <div className="flex items-center justify-between border-b border-[#E2D5C3] pb-3">
                    <h3 className="text-xs font-bold font-mono text-[#1F1D1A] uppercase tracking-wider">
                      Register Fleet Vehicle
                    </h3>
                    <button
                      onClick={() => setIsModalOpen(false)}
                      className="p-1 text-[#8A7E70] hover:text-[#1F1D1A] rounded cursor-pointer"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>

                  <form onSubmit={handleCreateVehicle} className="space-y-4 text-xs font-mono">
                    <div>
                      <label className="block text-[10px] text-[#5C5349] font-bold uppercase mb-1">Vehicle Identifier</label>
                      <input
                        type="text"
                        value={formData.id}
                        onChange={(e) => setFormData({ ...formData, id: e.target.value })}
                        placeholder="e.g. VH-104"
                        className="w-full px-3 py-2 bg-[#FFFFFF] border border-[#E2D5C3] rounded-xl text-[#1F1D1A] focus:outline-none focus:border-[#C85A32]"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] text-[#5C5349] font-bold uppercase mb-1">Carrier Type</label>
                      <select
                        value={formData.type}
                        onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                        className="w-full px-3 py-2 bg-[#FFFFFF] border border-[#E2D5C3] rounded-xl text-[#1F1D1A] focus:outline-none focus:border-[#C85A32] cursor-pointer"
                      >
                        <option value="Refrigerated Truck (Heavy)">Refrigerated Truck (Heavy)</option>
                        <option value="Refrigerated Van (Medium)">Refrigerated Van (Medium)</option>
                        <option value="Standard Freight Truck">Standard Freight Truck</option>
                        <option value="Light Delivery Truck">Light Delivery Truck</option>
                      </select>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[10px] text-[#5C5349] font-bold uppercase mb-1">Capacity (KG)</label>
                        <input
                          type="number"
                          value={formData.capacity_kg}
                          onChange={(e) => setFormData({ ...formData, capacity_kg: e.target.value })}
                          required
                          className="w-full px-3 py-2 bg-[#FFFFFF] border border-[#E2D5C3] rounded-xl text-[#1F1D1A] focus:outline-none focus:border-[#C85A32]"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] text-[#5C5349] font-bold uppercase mb-1">Base Cost (₹)</label>
                        <input
                          type="number"
                          value={formData.base_cost}
                          onChange={(e) => setFormData({ ...formData, base_cost: e.target.value })}
                          required
                          className="w-full px-3 py-2 bg-[#FFFFFF] border border-[#E2D5C3] rounded-xl text-[#1F1D1A] focus:outline-none focus:border-[#C85A32]"
                        />
                      </div>
                    </div>

                    <div className="pt-3 flex justify-end gap-2 border-t border-[#E2D5C3]">
                      <button
                        type="button"
                        onClick={() => setIsModalOpen(false)}
                        className="px-4 py-2 bg-[#FAF5EC] hover:bg-[#FDFBF7] text-[#5C5349] rounded-full text-xs font-bold transition-all border border-[#E2D5C3] cursor-pointer"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        disabled={submitting}
                        className="px-6 py-2 bg-[#1F1D1A] hover:bg-[#3D352E] text-[#FDFBF7] rounded-full text-xs font-bold uppercase transition-all cursor-pointer shadow-md"
                      >
                        {submitting ? "Saving..." : "Save Vehicle"}
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            )}

          </div>
        </main>
      </div>
    </div>
  );
}
