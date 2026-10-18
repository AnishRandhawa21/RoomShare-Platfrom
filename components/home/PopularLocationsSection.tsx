"use client";

import Image from "next/image";
import { MapPin, ArrowRight, Building, Users } from "lucide-react";
import { POPULAR_LOCATIONS } from "@/data/mockData";
import { PopularLocation } from "@/types";

interface PopularLocationsSectionProps {
  onSelectLocality: (locality: string, city: string) => void;
}

export function PopularLocationsSection({
  onSelectLocality,
}: PopularLocationsSectionProps) {
  return (
    <section className="py-14 sm:py-20 bg-white">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 rounded-full bg-amber-50 px-3 py-1 text-xs font-bold text-amber-800">
              <MapPin className="h-3.5 w-3.5" />
              <span>Trending Tech Hubs</span>
            </div>
            <h2 className="mt-2 text-2xl sm:text-3xl font-extrabold tracking-tight text-zinc-950">
              Popular Locations Across India
            </h2>
            <p className="mt-1 text-sm text-zinc-500">
              Explore neighborhoods with the highest concentration of tech companies, colleges, and verified stays.
            </p>
          </div>
        </div>

        {/* Locations Grid */}
        <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
          {POPULAR_LOCATIONS.map((loc) => (
            <div
              key={loc.id}
              onClick={() => onSelectLocality(loc.name, loc.city)}
              className="group relative cursor-pointer overflow-hidden rounded-3xl border border-zinc-200/80 bg-zinc-900 transition-all duration-300 hover:-translate-y-1 hover:shadow-xl"
            >
              <div className="relative aspect-[4/5] w-full">
                <Image
                  src={loc.imageUrl}
                  alt={loc.name}
                  fill
                  className="object-cover opacity-75 transition-transform duration-500 group-hover:scale-110"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent" />

                <div className="absolute inset-0 p-5 flex flex-col justify-between text-white">
                  <div className="flex justify-end">
                    <span className="rounded-full bg-white/20 px-2.5 py-1 text-[11px] font-semibold backdrop-blur-md">
                      Avg: {loc.averageRent}
                    </span>
                  </div>

                  <div>
                    <h3 className="text-lg font-bold text-white group-hover:text-indigo-300 transition-colors">
                      {loc.name}
                    </h3>
                    <p className="text-xs text-zinc-300">{loc.city}</p>

                    <div className="mt-3 flex items-center gap-3 pt-3 border-t border-white/20 text-xs text-zinc-300">
                      <span className="flex items-center gap-1">
                        <Building className="h-3 w-3 text-indigo-400" />
                        {loc.pgsCount} PGs
                      </span>
                      <span>•</span>
                      <span className="flex items-center gap-1">
                        <Users className="h-3 w-3 text-violet-400" />
                        {loc.roommatesCount} Roommates
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
