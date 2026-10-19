"use client";

import { useState, useMemo, useEffect } from "react";
import Link from "next/link";
import {
  Building2,
  Users,
  MapPin,
  CheckCircle2,
  Utensils,
  Navigation,
  Star,
} from "lucide-react";
import type { PropertyListingSummary } from "@/lib/discovery";
import { BookmarkButton } from "@/components/ui/BookmarkButton";
import { formatDistance } from "@/lib/geo";

export interface PropertyCardProps {
  pg: PropertyListingSummary;
  isHovered?: boolean;
  onMouseEnter?: () => void;
  onMouseLeave?: () => void;
}

export function PropertyCard({
  pg,
  isHovered,
  onMouseEnter,
  onMouseLeave,
}: PropertyCardProps) {
  const allImages = useMemo(() => {
    if (pg.images && pg.images.length > 0) return pg.images;
    if (pg.coverImageUrl) return [pg.coverImageUrl];
    return [];
  }, [pg.images, pg.coverImageUrl]);

  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [isCardHovered, setIsCardHovered] = useState(false);

  useEffect(() => {
    if (!isCardHovered || allImages.length <= 1) {
      return;
    }

    const interval = setInterval(() => {
      setCurrentImageIndex((prev) => (prev + 1) % allImages.length);
    }, 1800);

    return () => clearInterval(interval);
  }, [isCardHovered, allImages.length]);

  const handleMouseEnter = () => {
    setIsCardHovered(true);
    if (onMouseEnter) onMouseEnter();
  };

  const handleMouseLeave = () => {
    setIsCardHovered(false);
    setCurrentImageIndex(0);
    if (onMouseLeave) onMouseLeave();
  };

  return (
    <div
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      className={`group rounded-2xl border bg-white overflow-hidden shadow-xs hover:shadow-md transition-all flex flex-col ${
        isHovered || isCardHovered
          ? "border-[#00412E] ring-2 ring-[#96BF8A]/30 shadow-md"
          : "border-[#E8EAE5] hover:border-[#96BF8A]"
      }`}
    >
      {/* Image container */}
      <div className="relative aspect-video w-full bg-zinc-100 overflow-hidden">
        {allImages.length > 0 ? (
          allImages.map((src, idx) => (
            <img
              key={src + idx}
              src={src}
              alt={`${pg.name} - photo ${idx + 1}`}
              className={`absolute inset-0 h-full w-full object-cover transition-all duration-300 ease-in-out ${
                idx === currentImageIndex
                  ? "opacity-100 scale-100 z-0"
                  : "opacity-0 scale-105 pointer-events-none z-0"
              }`}
            />
          ))
        ) : (
          <div className="h-full w-full flex items-center justify-center bg-zinc-100 text-zinc-400">
            <Building2 className="h-8 w-8 text-zinc-300" />
          </div>
        )}

        {/* Hover cycling dots indicator */}
        {allImages.length > 1 && isCardHovered && (
          <div className="absolute bottom-2.5 inset-x-0 flex justify-center items-center gap-1.5 z-10 animate-in fade-in duration-300">
            {allImages.map((_, idx) => (
              <span
                key={idx}
                className={`h-1.5 rounded-full transition-all duration-300 ${
                  idx === currentImageIndex
                    ? "w-4 bg-white shadow-sm ring-1 ring-black/10"
                    : "w-1.5 bg-white/60"
                }`}
              />
            ))}
          </div>
        )}

        <div className="absolute top-3 left-3 flex flex-wrap items-center gap-1.5 z-10 max-w-[75%]">
          {pg.isFeatured && (
            <span className="rounded-full bg-amber-500 text-white px-2 py-0.5 text-[10px] font-black uppercase tracking-wider shadow-xs flex items-center gap-1">
              ★ Featured
            </span>
          )}
          <span
            className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-white shadow-xs ${
              pg.genderPolicy === "BOYS"
                ? "bg-blue-600"
                : pg.genderPolicy === "GIRLS"
                ? "bg-rose-600"
                : "bg-[#00412E]"
            }`}
          >
            {pg.genderPolicy === "BOYS"
              ? "Boys"
              : pg.genderPolicy === "GIRLS"
              ? "Girls"
              : "Coliving"}
          </span>
          {pg.isVerified && (
            <span className="rounded-full bg-[#00412E]/90 backdrop-blur-xs px-2 py-0.5 text-[10px] font-bold text-white flex items-center gap-0.5 shadow-xs">
              <CheckCircle2 className="h-2.5 w-2.5 text-[#96BF8A]" /> Verified
            </span>
          )}
          {pg.foodIncluded && (
            <span className="rounded-full bg-zinc-900/80 backdrop-blur-xs px-2 py-0.5 text-[10px] font-bold text-white flex items-center gap-1">
              <Utensils className="h-2.5 w-2.5" /> Meals
            </span>
          )}
          {pg.hasActiveRoommateRequest && (
            <span className="rounded-full bg-[#00412E] backdrop-blur-xs px-2 py-0.5 text-[10px] font-bold text-white flex items-center gap-1 shadow-xs border border-[#96BF8A]/40">
              <Users className="h-2.5 w-2.5 text-[#96BF8A]" /> Roommate wanted
            </span>
          )}
        </div>

        <div className="absolute top-3 right-3 z-10">
          <BookmarkButton
            targetId={pg.id}
            targetType="PROPERTY"
            size="sm"
          />
        </div>
      </div>

      {/* Content */}
      <div className="p-4 sm:p-5 flex-1 flex flex-col justify-between">
        <div>
          <div className="flex items-center justify-between gap-2 mb-1">
            <div className="flex items-center gap-1 text-xs text-zinc-500 truncate">
              <MapPin className="h-3.5 w-3.5 text-zinc-400 shrink-0" />
              <span className="truncate">{pg.locality}, {pg.city}</span>
            </div>
            {pg.distanceKm !== undefined && pg.distanceKm < Infinity && (
              <span className="shrink-0 flex items-center gap-1 text-[11px] font-bold text-[#00412E] bg-[#eff4ec] border border-[#96BF8A]/40 px-2 py-0.5 rounded-full">
                <Navigation className="h-2.5 w-2.5 text-[#00412E]" />
                {formatDistance(pg.distanceKm)}
              </span>
            )}
          </div>
          <div className="flex items-center justify-between gap-2">
            <Link href={`/property/${pg.slug}`} className="flex-1 min-w-0">
              <h3 className="text-base font-bold text-zinc-950 group-hover:text-[#00412E] transition-colors truncate">
                {pg.name}
              </h3>
            </Link>
            {pg.rating ? (
              <span className="shrink-0 inline-flex items-center gap-1 rounded-md bg-amber-50 border border-amber-200/70 px-2 py-0.5 text-xs font-bold text-amber-900 shadow-2xs">
                <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
                <span>{pg.rating.toFixed(1)}</span>
                {pg.reviewCount ? (
                  <span className="text-[10px] text-zinc-400 font-normal">({pg.reviewCount})</span>
                ) : null}
              </span>
            ) : null}
          </div>

          {/* Room types pill */}
          {pg.roomTypeSummaries.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-1">
              {pg.roomTypeSummaries.slice(0, 2).map((rt) => (
                <span
                  key={rt}
                  className="rounded-md bg-[#E8EAE5]/60 px-2 py-0.5 text-[11px] font-medium text-zinc-700"
                >
                  {rt}
                </span>
              ))}
            </div>
          )}
        </div>

        <div className="mt-5 pt-3 border-t border-[#E8EAE5] flex items-center justify-between">
          <div>
            <div className="flex items-center gap-1.5 mb-0.5">
              {pg.originalPrice && pg.originalPrice > pg.startingPrice && (
                <span className="text-xs font-semibold text-zinc-400 line-through">
                  ₹{pg.originalPrice.toLocaleString("en-IN")}
                </span>
              )}
              {pg.bestSharingOccupancy && pg.bestSharingOccupancy > 1 ? (
                <span className="text-[10px] font-bold text-[#00412E] bg-[#96BF8A]/20 px-1.5 py-0.5 rounded-md border border-[#96BF8A]/50">
                  {pg.bestSharingOccupancy}-Sharing
                </span>
              ) : (
                <span className="text-[10px] font-semibold text-zinc-400 uppercase tracking-wider block">
                  Starts at
                </span>
              )}
            </div>
            <div className="flex items-baseline gap-1">
              <span className="text-lg font-black tracking-tight text-zinc-950">
                ₹{pg.startingPrice.toLocaleString("en-IN")}
              </span>
              <span className="text-xs font-normal text-zinc-500">/mo</span>
            </div>
          </div>
          <Link
            href={`/property/${pg.slug}`}
            className="rounded-xl bg-[#00412E] px-3.5 py-1.5 text-xs font-bold text-white hover:bg-[#002d20] transition-colors inline-block shadow-xs"
          >
            Details
          </Link>
        </div>
      </div>
    </div>
  );
}
