"use client";

import {
  Wifi,
  ShieldCheck,
  Utensils,
  Zap,
  Droplets,
  Dumbbell,
  Tv,
  Car,
  Wind,
  Bath,
  Check,
} from "lucide-react";

export interface AmenityItem {
  id: string;
  name: string;
  category: string;
  icon?: string | null;
  note?: string | null;
}

interface AmenitiesSectionProps {
  amenities: AmenityItem[];
  foodIncluded: boolean;
  foodOffering: string;
}

// Icon mapper helper
function getAmenityIcon(name: string) {
  const lower = name.toLowerCase();
  if (lower.includes("wifi") || lower.includes("internet")) return <Wifi className="h-4 w-4" />;
  if (lower.includes("security") || lower.includes("cctv") || lower.includes("biometric")) return <ShieldCheck className="h-4 w-4" />;
  if (lower.includes("food") || lower.includes("meal") || lower.includes("kitchen")) return <Utensils className="h-4 w-4" />;
  if (lower.includes("power") || lower.includes("backup") || lower.includes("generator")) return <Zap className="h-4 w-4" />;
  if (lower.includes("ro") || lower.includes("water") || lower.includes("filter")) return <Droplets className="h-4 w-4" />;
  if (lower.includes("gym") || lower.includes("fitness")) return <Dumbbell className="h-4 w-4" />;
  if (lower.includes("tv") || lower.includes("television")) return <Tv className="h-4 w-4" />;
  if (lower.includes("parking") || lower.includes("bike")) return <Car className="h-4 w-4" />;
  if (lower.includes("ac") || lower.includes("air")) return <Wind className="h-4 w-4" />;
  if (lower.includes("geyser") || lower.includes("heater")) return <Bath className="h-4 w-4" />;
  return <Check className="h-4 w-4" />;
}

export function AmenitiesSection({ amenities, foodIncluded, foodOffering }: AmenitiesSectionProps) {
  return (
    <div className="rounded-3xl border border-zinc-200 bg-white p-6 sm:p-8 space-y-6">
      <div>
        <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-zinc-950">
          Amenities & Stays Features
        </h2>
        <p className="text-xs sm:text-sm text-zinc-500 mt-1">
          Everything included in your monthly stay without hidden extra costs.
        </p>
      </div>

      {/* Food Offering Highlight */}
      <div className="rounded-2xl bg-[#eff4ec] p-4 border border-[#96BF8A]/40 flex items-center gap-3.5">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#00412E] text-white shadow-xs">
          <Utensils className="h-5 w-5 text-[#96BF8A]" />
        </div>
        <div>
          <div className="text-xs font-bold text-[#00412E]">
            {foodIncluded ? "Food Included in Stay" : "Self-Cooking / Meal Optional"}
          </div>
          <div className="text-xs text-[#00412E]/85">
            {foodOffering === "VEG_ONLY"
              ? "Pure vegetarian daily breakfast, lunch, and dinner."
              : foodOffering === "VEG_NONVEG"
              ? "Home-style North & South Indian meals with both Veg & Non-Veg options."
              : "Access to clean modular kitchen / dining hall."}
          </div>
        </div>
      </div>

      {/* Amenities Grid */}
      {amenities.length > 0 ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
          {amenities.map((item) => (
            <div
              key={item.id}
              className="flex items-center gap-2.5 rounded-2xl border border-[#E8EAE5] bg-white p-3 hover:bg-[#eff4ec]/50 hover:border-[#96BF8A]/40 transition-colors"
            >
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-[#eff4ec] text-[#00412E] shadow-2xs">
                {getAmenityIcon(item.name)}
              </div>
              <div className="min-w-0">
                <div className="text-xs font-bold text-zinc-900 truncate">
                  {item.name}
                </div>
                {item.note && (
                  <div className="text-[10px] text-zinc-500 truncate">
                    {item.note}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {["High-Speed Wi-Fi", "Daily Housekeeping", "Power Backup", "CCTV Surveillance", "RO Drinking Water", "Washing Machine"].map((name) => (
            <div
              key={name}
              className="flex items-center gap-2.5 rounded-2xl border border-zinc-200/80 bg-zinc-50/60 p-3"
            >
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-white text-indigo-600 shadow-2xs">
                {getAmenityIcon(name)}
              </div>
              <span className="text-xs font-bold text-zinc-900">{name}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
