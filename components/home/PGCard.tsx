"use client";

import Image from "next/image";
import {
  MapPin,
  Star,
  ShieldCheck,
  Utensils,
  Wifi,
  ChevronRight,
  Sparkles,
} from "lucide-react";
import { PGProperty } from "@/types";
import { formatPrice } from "@/lib/utils";

interface PGCardProps {
  property: PGProperty;
  onViewDetails: (property: PGProperty) => void;
}

export function PGCard({ property, onViewDetails }: PGCardProps) {
  const genderBadgeColor =
    property.gender === "Female"
      ? "bg-rose-50 text-rose-700 border-rose-200"
      : property.gender === "Male"
      ? "bg-sky-50 text-sky-700 border-sky-200"
      : "bg-indigo-50 text-indigo-700 border-indigo-200";

  return (
    <article className="group flex flex-col rounded-3xl border border-zinc-200/90 bg-white overflow-hidden shadow-sm hover:shadow-xl hover:border-indigo-200 transition-all duration-300">
      {/* Property Image Container */}
      <div className="relative aspect-[16/10] w-full overflow-hidden bg-zinc-100">
        <Image
          src={property.imageUrl}
          alt={property.name}
          fill
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          className="object-cover transition-transform duration-500 group-hover:scale-105"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-80" />

        {/* Top Badges */}
        <div className="absolute top-3 left-3 right-3 flex items-center justify-between gap-2">
          <div className="flex items-center gap-1.5">
            {property.verified && (
              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/95 px-2.5 py-1 text-[11px] font-bold text-white shadow-md backdrop-blur-sm">
                <ShieldCheck className="h-3.5 w-3.5" />
                Verified
              </span>
            )}
            <span
              className={`rounded-full border px-2.5 py-1 text-[11px] font-bold backdrop-blur-md shadow-sm ${genderBadgeColor}`}
            >
              {property.gender} PG
            </span>
          </div>

          {property.featured && (
            <span className="inline-flex items-center gap-1 rounded-full bg-amber-400 px-2.5 py-1 text-[11px] font-extrabold text-amber-950 shadow-md">
              <Sparkles className="h-3 w-3" />
              Featured
            </span>
          )}
        </div>

        {/* Rating Floating Badge on Image Bottom */}
        <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between text-white text-xs">
          <div className="flex items-center gap-1 rounded-lg bg-black/60 px-2 py-1 backdrop-blur-md font-semibold">
            <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
            <span>{property.rating}</span>
            <span className="text-zinc-300">({property.reviewCount})</span>
          </div>

          {property.foodIncluded ? (
            <span className="inline-flex items-center gap-1 rounded-lg bg-emerald-950/80 px-2 py-1 text-[11px] font-medium text-emerald-300 backdrop-blur-md">
              <Utensils className="h-3 w-3" />
              Food Included
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 rounded-lg bg-zinc-900/80 px-2 py-1 text-[11px] font-medium text-zinc-300 backdrop-blur-md">
              Self Cooking / Cafe
            </span>
          )}
        </div>
      </div>

      {/* Property Details Body */}
      <div className="flex flex-1 flex-col p-5">
        {/* Name and Distance */}
        <div className="flex-1">
          <h3 className="text-lg font-bold text-zinc-900 group-hover:text-indigo-600 transition-colors line-clamp-1">
            {property.name}
          </h3>

          <div className="mt-1 flex items-center gap-1.5 text-xs text-zinc-500">
            <MapPin className="h-3.5 w-3.5 shrink-0 text-zinc-400" />
            <span className="font-medium text-zinc-700">{property.locality}</span>
            <span>•</span>
            <span className="truncate">{property.distance}</span>
          </div>

          <p className="mt-2 text-xs text-zinc-500 line-clamp-1">
            {property.tagline}
          </p>

          {/* Available Room Types */}
          <div className="mt-4">
            <div className="text-[11px] font-bold uppercase tracking-wider text-zinc-400">
              Available Room Types
            </div>
            <div className="mt-1.5 flex flex-wrap gap-1.5">
              {property.availableRoomTypes.map((type) => (
                <span
                  key={type}
                  className="rounded-lg bg-zinc-100 px-2.5 py-1 text-xs font-semibold text-zinc-700"
                >
                  {type}
                </span>
              ))}
            </div>
          </div>

          {/* Key Amenities */}
          <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-zinc-600">
            {property.amenities.slice(0, 3).map((amenity, idx) => (
              <span key={idx} className="flex items-center gap-1">
                <span className="h-1.5 w-1.5 rounded-full bg-indigo-500" />
                {amenity}
              </span>
            ))}
            {property.amenities.length > 3 && (
              <span className="text-[11px] font-medium text-indigo-600">
                +{property.amenities.length - 3} more
              </span>
            )}
          </div>
        </div>

        {/* Card Footer: Price & CTA */}
        <div className="mt-5 pt-4 border-t border-zinc-100 flex items-center justify-between gap-3">
          <div>
            <div className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">
              Starts at
            </div>
            <div className="flex items-baseline gap-1">
              <span className="text-xl font-extrabold text-zinc-900">
                {formatPrice(property.startingPrice)}
              </span>
              <span className="text-xs font-medium text-zinc-500">/month</span>
            </div>
          </div>

          <button
            type="button"
            id={`view-pg-${property.id}`}
            onClick={() => onViewDetails(property)}
            className="inline-flex items-center gap-1.5 rounded-2xl bg-indigo-600 px-4 py-2.5 text-xs font-bold text-white shadow-md shadow-indigo-100 hover:bg-indigo-700 active:scale-95 transition-all cursor-pointer"
          >
            <span>View Property</span>
            <ChevronRight className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
    </article>
  );
}
