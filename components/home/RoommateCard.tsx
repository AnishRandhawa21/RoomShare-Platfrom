"use client";

import Image from "next/image";
import {
  Calendar,
  MapPin,
  ShieldCheck,
  Briefcase,
  ChevronRight,
  UserCheck,
  Clock,
  Sparkles,
} from "lucide-react";
import { RoommateRequest } from "@/types";
import { formatPrice } from "@/lib/utils";

interface RoommateCardProps {
  request: RoommateRequest;
  onViewRequest: (request: RoommateRequest) => void;
}

export function RoommateCard({ request, onViewRequest }: RoommateCardProps) {
  return (
    <article className="group flex flex-col rounded-3xl border border-zinc-200/90 bg-white p-6 shadow-sm hover:shadow-xl hover:border-violet-200 transition-all duration-300">
      {/* Top Header: Seeker Info & Badges */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="relative h-12 w-12 rounded-full overflow-hidden bg-zinc-100 ring-2 ring-violet-100">
            <Image
              src={request.avatarUrl}
              alt={request.seekerName}
              fill
              className="object-cover"
            />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-bold text-zinc-900 text-sm">
                {request.seekerName}
              </span>
              {request.verified && (
                <span title="Identity & Company Verified" className="inline-flex">
                  <ShieldCheck className="h-4 w-4 text-emerald-500 shrink-0" />
                </span>
              )}
            </div>
            <div className="flex items-center gap-1.5 text-xs text-zinc-500">
              <span>{request.seekerAge} yrs</span>
              <span>•</span>
              <span className="font-medium text-zinc-700">
                {request.seekerGender}
              </span>
              <span>•</span>
              <span className="truncate max-w-[120px]">
                {request.seekerProfession}
              </span>
            </div>
          </div>
        </div>

        {request.urgencyTag && (
          <span className="inline-flex items-center gap-1 rounded-full bg-violet-50 px-2.5 py-1 text-[11px] font-bold text-violet-700 border border-violet-100">
            <Sparkles className="h-3 w-3" />
            {request.urgencyTag}
          </span>
        )}
      </div>

      {/* Main Request Headline */}
      <div className="mt-4">
        <h3 className="text-base font-bold text-zinc-900 group-hover:text-violet-600 transition-colors line-clamp-1">
          {request.title}
        </h3>
        <div className="mt-1 flex items-center gap-1.5 text-xs text-zinc-500">
          <MapPin className="h-3.5 w-3.5 text-zinc-400 shrink-0" />
          <span className="font-medium text-zinc-700">{request.locality}</span>
          <span>•</span>
          <span>{request.city}</span>
        </div>
      </div>

      {/* Structured Key Specs Grid (Exact requirements: Need 1 roommate, 2-Seater, ₹8,000/month, Available from November) */}
      <div className="mt-4 grid grid-cols-2 gap-2.5 rounded-2xl bg-zinc-50 p-3.5 border border-zinc-100">
        <div>
          <span className="block text-[10px] font-bold uppercase tracking-wider text-zinc-400">
            Room Type
          </span>
          <span className="mt-0.5 block text-xs font-bold text-zinc-800">
            {request.roomType}
          </span>
        </div>

        <div>
          <span className="block text-[10px] font-bold uppercase tracking-wider text-zinc-400">
            Rent / Share
          </span>
          <span className="mt-0.5 block text-xs font-bold text-violet-700">
            {formatPrice(request.rentPerPerson)}/mo
          </span>
        </div>

        <div>
          <span className="block text-[10px] font-bold uppercase tracking-wider text-zinc-400">
            Availability
          </span>
          <span className="mt-0.5 block text-xs font-semibold text-zinc-800 flex items-center gap-1">
            <Calendar className="h-3 w-3 text-zinc-400" />
            {request.moveInDate}
          </span>
        </div>

        <div>
          <span className="block text-[10px] font-bold uppercase tracking-wider text-zinc-400">
            Security Deposit
          </span>
          <span className="mt-0.5 block text-xs font-semibold text-zinc-700">
            {request.deposit}
          </span>
        </div>
      </div>

      {/* Description Snippet */}
      <p className="mt-3 text-xs text-zinc-500 line-clamp-2 leading-relaxed">
        {request.description}
      </p>

      {/* Lifestyle Preferences Badges */}
      <div className="mt-3 flex flex-wrap gap-1.5">
        {request.preferences.map((pref, idx) => (
          <span
            key={idx}
            className="rounded-lg bg-zinc-100 px-2 py-0.5 text-[11px] font-medium text-zinc-600"
          >
            {pref}
          </span>
        ))}
      </div>

      {/* Card Footer with CTA */}
      <div className="mt-5 pt-4 border-t border-zinc-100 flex items-center justify-between">
        <div className="text-[11px] font-medium text-zinc-400 flex items-center gap-1">
          <UserCheck className="h-3.5 w-3.5 text-emerald-500" />
          <span>Zero Brokerage</span>
        </div>

        <button
          type="button"
          id={`view-roommate-${request.id}`}
          onClick={() => onViewRequest(request)}
          className="inline-flex items-center gap-1.5 rounded-2xl bg-zinc-900 px-4 py-2 text-xs font-bold text-white hover:bg-violet-600 active:scale-95 transition-all cursor-pointer shadow-sm"
        >
          <span>View Request</span>
          <ChevronRight className="h-3.5 w-3.5" />
        </button>
      </div>
    </article>
  );
}
