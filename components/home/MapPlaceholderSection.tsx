"use client";

import { useState } from "react";
import Image from "next/image";
import {
  MapPin,
  Layers,
  Compass,
  Navigation,
  Train,
  CheckCircle2,
  Building2,
  ExternalLink,
  Info,
} from "lucide-react";
import { MOCK_PGS } from "@/data/mockData";
import { PGProperty } from "@/types";
import { formatPrice } from "@/lib/utils";

interface MapPlaceholderSectionProps {
  onSelectProperty: (property: PGProperty) => void;
}

export function MapPlaceholderSection({
  onSelectProperty,
}: MapPlaceholderSectionProps) {
  const [activePinId, setActivePinId] = useState<string>("pg-1");
  const [activeLayer, setActiveLayer] = useState<"all" | "metro" | "girls">("all");

  const selectedPG = MOCK_PGS.find((p) => p.id === activePinId) || MOCK_PGS[0];

  // Coordinates positioned within mock map layout percentage (top%, left%)
  const pinCoordinates = [
    { id: "pg-1", top: "34%", left: "42%", price: "₹11.5k" },
    { id: "pg-2", top: "58%", left: "68%", price: "₹8.5k" },
    { id: "pg-3", top: "25%", left: "75%", price: "₹14.0k" },
    { id: "pg-4", top: "68%", left: "28%", price: "₹7.5k" },
    { id: "pg-5", top: "45%", left: "82%", price: "₹13.5k" },
    { id: "pg-6", top: "78%", left: "54%", price: "₹6.9k" },
  ];

  return (
    <section id="map-section" className="py-14 sm:py-20 bg-white">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-800">
              <MapPin className="h-3.5 w-3.5" />
              <span>Map Explorer</span>
            </div>
            <h2 className="mt-2 text-2xl sm:text-3xl font-extrabold tracking-tight text-zinc-950">
              Search by Neighborhood & Commute
            </h2>
            <p className="mt-1 text-sm text-zinc-500">
              Pinpoint verified stays near IT corridors, metro stations, and colleges.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1 rounded-full bg-zinc-100 px-3 py-1 text-xs font-medium text-zinc-600">
              <Info className="h-3.5 w-3.5 text-zinc-400" />
              MapLibre + OSM Vector Engine Ready
            </span>
          </div>
        </div>

        {/* Visual Map Canvas Placeholder Container */}
        <div className="mt-8 relative overflow-hidden rounded-3xl border border-zinc-200/90 bg-slate-900 shadow-2xl h-[520px] sm:h-[580px] w-full">
          {/* Mock Map Vector Grid Layer */}
          <div className="absolute inset-0 bg-[#0f172a] opacity-95">
            {/* SVG Vector roads and geographic contours */}
            <svg
              className="w-full h-full opacity-35"
              xmlns="http://www.w3.org/2000/svg"
              width="100%"
              height="100%"
            >
              <defs>
                <pattern
                  id="map-grid"
                  width="60"
                  height="60"
                  patternUnits="userSpaceOnUse"
                >
                  <path
                    d="M 60 0 L 0 0 0 60"
                    fill="none"
                    stroke="rgba(255,255,255,0.08)"
                    strokeWidth="1"
                  />
                </pattern>
              </defs>
              <rect width="100%" height="100%" fill="url(#map-grid)" />

              {/* Major arterial roads (curves) */}
              <path
                d="M -50 180 Q 300 120 600 280 T 1200 200"
                fill="none"
                stroke="rgba(99, 102, 241, 0.4)"
                strokeWidth="6"
              />
              <path
                d="M 200 -20 Q 350 300 450 650"
                fill="none"
                stroke="rgba(148, 163, 184, 0.3)"
                strokeWidth="5"
              />
              <path
                d="M 500 -20 Q 550 250 850 650"
                fill="none"
                stroke="rgba(99, 102, 241, 0.35)"
                strokeWidth="7"
              />
              <path
                d="M 100 500 Q 500 420 1100 540"
                fill="none"
                stroke="rgba(148, 163, 184, 0.25)"
                strokeWidth="4"
              />

              {/* Metro Rail Transit Line */}
              <path
                d="M 10 320 L 320 280 L 580 340 L 900 260 L 1200 310"
                fill="none"
                stroke="#10b981"
                strokeWidth="3"
                strokeDasharray="8 6"
              />

              {/* Green Park Zones */}
              <circle cx="280" cy="180" r="80" fill="rgba(16, 185, 129, 0.12)" />
              <circle cx="750" cy="400" r="110" fill="rgba(16, 185, 129, 0.09)" />
            </svg>
          </div>

          {/* Map Top Floating Controls */}
          <div className="absolute top-4 left-4 right-4 z-20 flex flex-wrap items-center justify-between gap-3 pointer-events-auto">
            {/* Filter Pills */}
            <div className="flex items-center gap-1.5 rounded-2xl bg-zinc-900/90 p-1.5 backdrop-blur-md border border-white/10 shadow-lg text-xs">
              <button
                onClick={() => setActiveLayer("all")}
                className={`rounded-xl px-3 py-1.5 font-medium transition-colors ${
                  activeLayer === "all"
                    ? "bg-indigo-600 text-white font-semibold"
                    : "text-zinc-300 hover:text-white"
                }`}
              >
                All Verified PGs
              </button>
              <button
                onClick={() => setActiveLayer("metro")}
                className={`flex items-center gap-1 rounded-xl px-3 py-1.5 font-medium transition-colors ${
                  activeLayer === "metro"
                    ? "bg-emerald-600 text-white font-semibold"
                    : "text-zinc-300 hover:text-white"
                }`}
              >
                <Train className="h-3 w-3" />
                Near Metro Line
              </button>
            </div>

            {/* Map Status Badge */}
            <div className="hidden sm:inline-flex items-center gap-2 rounded-2xl bg-zinc-900/90 px-3.5 py-2 backdrop-blur-md border border-white/10 text-xs font-semibold text-zinc-300">
              <span className="h-2 w-2 rounded-full bg-emerald-400 animate-ping" />
              <span>Interactive Map Preview Mode</span>
            </div>
          </div>

          {/* Interactive Property Map Pins */}
          {pinCoordinates.map((pin) => {
            const isSelected = activePinId === pin.id;
            return (
              <button
                key={pin.id}
                type="button"
                onClick={() => setActivePinId(pin.id)}
                style={{ top: pin.top, left: pin.left }}
                className={`absolute z-20 -translate-x-1/2 -translate-y-1/2 group cursor-pointer transition-transform duration-200 ${
                  isSelected ? "scale-115 z-30" : "hover:scale-110"
                }`}
              >
                {/* Distance Halo if active */}
                {isSelected && (
                  <span className="absolute -inset-4 rounded-full bg-indigo-500/25 animate-pulse" />
                )}

                <div
                  className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-extrabold shadow-xl transition-all border ${
                    isSelected
                      ? "bg-indigo-600 text-white border-white ring-4 ring-indigo-500/30"
                      : "bg-white text-zinc-900 border-zinc-200 hover:bg-indigo-50"
                  }`}
                >
                  <Building2 className={`h-3 w-3 ${isSelected ? "text-white" : "text-indigo-600"}`} />
                  <span>{pin.price}</span>
                </div>
              </button>
            );
          })}

          {/* Selected Property Overlay Floating Card (Bottom-Left) */}
          {selectedPG && (
            <div className="absolute bottom-4 left-4 right-4 sm:right-auto sm:max-w-sm z-30 animate-in fade-in slide-in-from-bottom-3 duration-300">
              <div className="rounded-2xl border border-white/15 bg-zinc-900/95 p-4 text-white shadow-2xl backdrop-blur-md">
                <div className="flex gap-3.5">
                  <div className="relative h-20 w-20 shrink-0 rounded-xl overflow-hidden bg-zinc-800">
                    <Image
                      src={selectedPG.imageUrl}
                      alt={selectedPG.name}
                      fill
                      className="object-cover"
                    />
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-1">
                      <span className="inline-block rounded-md bg-indigo-500/30 px-2 py-0.5 text-[10px] font-bold text-indigo-300">
                        {selectedPG.gender} PG
                      </span>
                      <span className="text-[11px] font-semibold text-emerald-400">
                        {selectedPG.distance}
                      </span>
                    </div>

                    <h4 className="mt-1 font-bold text-sm text-zinc-100 truncate">
                      {selectedPG.name}
                    </h4>

                    <p className="text-xs text-zinc-400 truncate">
                      {selectedPG.locality}
                    </p>

                    <div className="mt-2 flex items-center justify-between">
                      <span className="text-sm font-extrabold text-white">
                        {formatPrice(selectedPG.startingPrice)}
                        <span className="text-[10px] font-normal text-zinc-400">/mo</span>
                      </span>

                      <button
                        onClick={() => onSelectProperty(selectedPG)}
                        className="rounded-lg bg-indigo-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-indigo-700 active:scale-95 transition-all cursor-pointer"
                      >
                        View Details
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Metro Legend Bottom Right */}
          <div className="hidden md:flex absolute bottom-4 right-4 z-20 items-center gap-3 rounded-xl bg-zinc-900/80 px-3 py-2 text-[11px] font-medium text-zinc-300 backdrop-blur-md border border-white/10">
            <div className="flex items-center gap-1.5">
              <span className="h-2 w-4 rounded-full bg-emerald-500" />
              <span>Namma Metro Line</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 rounded-full bg-indigo-500" />
              <span>Verified PG Hub</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
