"use client";

import { useState } from "react";
import { PGProperty } from "@/types";
import { PGCard } from "./PGCard";
import { Building, Sparkles, Filter, ChevronRight, Check } from "lucide-react";

interface PGSectionProps {
  properties: PGProperty[];
  selectedCity: string;
  onViewProperty: (property: PGProperty) => void;
}

export function PGSection({
  properties,
  selectedCity,
  onViewProperty,
}: PGSectionProps) {
  const [filterType, setFilterType] = useState<"all" | "boys" | "girls" | "unisex" | "food">("all");

  const filteredProperties = properties.filter((pg) => {
    if (filterType === "boys") return pg.gender === "Male";
    if (filterType === "girls") return pg.gender === "Female";
    if (filterType === "unisex") return pg.gender === "Unisex";
    if (filterType === "food") return pg.foodIncluded;
    return true;
  });

  return (
    <section id="pg-section" className="py-14 sm:py-20 bg-white">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 rounded-full bg-indigo-50 px-3 py-1 text-xs font-bold text-indigo-700">
              <Building className="h-3.5 w-3.5" />
              <span>Verified Stays</span>
            </div>
            <h2 className="mt-2 text-2xl sm:text-3xl font-extrabold tracking-tight text-zinc-950">
              PGs near you in {selectedCity}
            </h2>
            <p className="mt-1 text-sm text-zinc-500">
              Hand-verified paying guest accommodations with furnished rooms and zero brokerage.
            </p>
          </div>

          {/* Quick Filter Tabs */}
          <div className="flex flex-wrap items-center gap-2">
            {[
              { id: "all", label: "All PGs" },
              { id: "boys", label: "Boys Only" },
              { id: "girls", label: "Girls Only" },
              { id: "unisex", label: "Unisex / Coliving" },
              { id: "food", label: "Meals Included" },
            ].map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setFilterType(tab.id as any)}
                className={`rounded-full px-3.5 py-1.5 text-xs font-semibold transition-all cursor-pointer ${
                  filterType === tab.id
                    ? "bg-zinc-900 text-white shadow-sm"
                    : "bg-zinc-100 text-zinc-600 hover:bg-zinc-200"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Results Counter */}
        <div className="mt-6 flex items-center justify-between text-xs text-zinc-500">
          <span>
            Showing <strong className="text-zinc-900 font-semibold">{filteredProperties.length}</strong> available PGs in {selectedCity}
          </span>
          <span className="flex items-center gap-1 text-emerald-600 font-medium">
            <Check className="h-3.5 w-3.5" /> 100% physically inspected & verified
          </span>
        </div>

        {/* Property Grid */}
        <div className="mt-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
          {filteredProperties.map((property) => (
            <PGCard
              key={property.id}
              property={property}
              onViewDetails={onViewProperty}
            />
          ))}
        </div>

        {filteredProperties.length === 0 && (
          <div className="mt-10 rounded-3xl border border-dashed border-zinc-200 p-12 text-center">
            <p className="text-sm font-semibold text-zinc-600">
              No PGs match this specific filter right now.
            </p>
            <button
              onClick={() => setFilterType("all")}
              className="mt-3 text-xs font-bold text-indigo-600 hover:underline"
            >
              Reset filters to show all PGs
            </button>
          </div>
        )}
      </div>
    </section>
  );
}
