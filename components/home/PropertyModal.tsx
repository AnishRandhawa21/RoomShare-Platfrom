"use client";

import Image from "next/image";
import {
  X,
  MapPin,
  Star,
  ShieldCheck,
  Check,
  Utensils,
  PhoneCall,
  Calendar,
  Building,
} from "lucide-react";
import { PGProperty } from "@/types";
import { formatPrice } from "@/lib/utils";

interface PropertyModalProps {
  property: PGProperty | null;
  onClose: () => void;
}

export function PropertyModal({ property, onClose }: PropertyModalProps) {
  if (!property) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-3xl bg-white shadow-2xl ring-1 ring-black/10">
        {/* Close Button */}
        <button
          onClick={onClose}
          aria-label="Close modal"
          className="absolute top-4 right-4 z-10 flex h-9 w-9 items-center justify-center rounded-full bg-black/50 text-white backdrop-blur-md hover:bg-black/75 transition-colors cursor-pointer"
        >
          <X className="h-5 w-5" />
        </button>

        {/* Hero Image */}
        <div className="relative aspect-[16/9] w-full bg-zinc-100">
          <Image
            src={property.imageUrl}
            alt={property.name}
            fill
            className="object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />

          <div className="absolute bottom-4 left-5 right-5 text-white">
            <div className="flex items-center gap-2 mb-1.5">
              {property.verified && (
                <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500 px-2.5 py-0.5 text-xs font-bold">
                  <ShieldCheck className="h-3.5 w-3.5" />
                  Verified Property
                </span>
              )}
              <span className="rounded-full bg-white/20 px-2.5 py-0.5 text-xs font-semibold backdrop-blur-md">
                {property.gender} PG
              </span>
            </div>
            <h2 className="text-2xl font-bold">{property.name}</h2>
            <div className="flex items-center gap-2 text-xs text-zinc-200 mt-1">
              <MapPin className="h-3.5 w-3.5" />
              <span>{property.locality}, {property.city}</span>
              <span>•</span>
              <span>{property.distance}</span>
            </div>
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-6">
          {/* Rent & Rating Header */}
          <div className="flex items-center justify-between p-4 rounded-2xl bg-zinc-50 border border-zinc-100">
            <div>
              <span className="text-xs text-zinc-500 font-medium">Starting from</span>
              <div className="flex items-baseline gap-1">
                <span className="text-2xl font-extrabold text-zinc-900">
                  {formatPrice(property.startingPrice)}
                </span>
                <span className="text-xs text-zinc-500">/month</span>
              </div>
            </div>
            <div className="text-right">
              <div className="flex items-center gap-1 text-sm font-bold text-zinc-900 justify-end">
                <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
                <span>{property.rating} / 5.0</span>
              </div>
              <span className="text-xs text-zinc-500">{property.reviewCount} verified reviews</span>
            </div>
          </div>

          {/* Available Room Configurations */}
          <div>
            <h3 className="text-sm font-bold text-zinc-900 uppercase tracking-wider">
              Available Room Options
            </h3>
            <div className="mt-3 grid grid-cols-2 sm:grid-cols-3 gap-2.5">
              {property.availableRoomTypes.map((type, idx) => (
                <div
                  key={idx}
                  className="rounded-xl border border-zinc-200 p-3 bg-zinc-50/50"
                >
                  <span className="block text-xs font-bold text-zinc-800">{type}</span>
                  <span className="block text-[11px] text-emerald-600 font-medium mt-0.5">
                    Available Now
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Amenities & Food */}
          <div>
            <h3 className="text-sm font-bold text-zinc-900 uppercase tracking-wider">
              Amenities & Inclusions
            </h3>
            <div className="mt-3 grid grid-cols-2 gap-2 text-xs text-zinc-700">
              {property.amenities.map((amenity, idx) => (
                <div key={idx} className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-emerald-500 shrink-0" />
                  <span>{amenity}</span>
                </div>
              ))}
              {property.foodIncluded && (
                <div className="flex items-center gap-2 font-semibold text-emerald-700">
                  <Utensils className="h-4 w-4 text-emerald-600 shrink-0" />
                  <span>Breakfast, Lunch & Dinner Included</span>
                </div>
              )}
            </div>
          </div>

          {/* Action Footer */}
          <div className="pt-4 border-t border-zinc-100 flex flex-col sm:flex-row gap-3">
            <button
              onClick={() => alert(`Direct contact details for ${property.name} requested. Platform integration ready!`)}
              className="flex-1 rounded-2xl bg-indigo-600 py-3 text-center text-xs sm:text-sm font-bold text-white shadow-lg shadow-indigo-100 hover:bg-indigo-700 active:scale-95 transition-all cursor-pointer flex items-center justify-center gap-2"
            >
              <PhoneCall className="h-4 w-4" />
              <span>Contact Property Manager (Free)</span>
            </button>
            <button
              onClick={onClose}
              className="rounded-2xl border border-zinc-200 py-3 px-5 text-center text-xs sm:text-sm font-semibold text-zinc-700 hover:bg-zinc-50 cursor-pointer"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
