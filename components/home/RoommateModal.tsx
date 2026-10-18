"use client";

import Image from "next/image";
import {
  X,
  MapPin,
  ShieldCheck,
  Calendar,
  MessageCircle,
  Briefcase,
  User,
  HeartHandshake,
} from "lucide-react";
import { RoommateRequest } from "@/types";
import { formatPrice } from "@/lib/utils";

interface RoommateModalProps {
  request: RoommateRequest | null;
  onClose: () => void;
}

export function RoommateModal({ request, onClose }: RoommateModalProps) {
  if (!request) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-xl max-h-[90vh] overflow-y-auto rounded-3xl bg-white shadow-2xl ring-1 ring-black/10 p-6 sm:p-8">
        {/* Close Button */}
        <button
          onClick={onClose}
          aria-label="Close modal"
          className="absolute top-5 right-5 flex h-8 w-8 items-center justify-center rounded-full bg-zinc-100 text-zinc-500 hover:bg-zinc-200 transition-colors cursor-pointer"
        >
          <X className="h-4 w-4" />
        </button>

        {/* Seeker Profile Banner */}
        <div className="flex items-center gap-4">
          <div className="relative h-16 w-16 rounded-2xl overflow-hidden bg-zinc-100 ring-2 ring-violet-200 shrink-0">
            <Image
              src={request.avatarUrl}
              alt={request.seekerName}
              fill
              className="object-cover"
            />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-lg font-bold text-zinc-900">
                {request.seekerName}
              </h3>
              {request.verified && (
                <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[11px] font-bold text-emerald-700 border border-emerald-100">
                  <ShieldCheck className="h-3.5 w-3.5 text-emerald-600" />
                  Verified
                </span>
              )}
            </div>
            <p className="text-xs text-zinc-500">
              {request.seekerAge} yrs • {request.seekerGender} • {request.seekerProfession}
              {request.seekerCompanyOrCollege && ` at ${request.seekerCompanyOrCollege}`}
            </p>
            <div className="flex items-center gap-1 text-xs text-zinc-600 mt-0.5">
              <MapPin className="h-3 w-3 text-zinc-400" />
              <span>{request.locality}, {request.city}</span>
            </div>
          </div>
        </div>

        {/* Request Title */}
        <div className="mt-6">
          <h2 className="text-xl font-extrabold text-zinc-900">
            {request.title}
          </h2>
          <p className="mt-2 text-sm text-zinc-600 leading-relaxed">
            {request.description}
          </p>
        </div>

        {/* Structured Spec Grid */}
        <div className="mt-6 grid grid-cols-2 gap-3 rounded-2xl bg-zinc-50 p-4 border border-zinc-100">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">
              Room Sharing
            </span>
            <span className="block text-sm font-bold text-zinc-900 mt-0.5">
              {request.roomType}
            </span>
          </div>
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">
              Monthly Rent
            </span>
            <span className="block text-sm font-bold text-violet-700 mt-0.5">
              {formatPrice(request.rentPerPerson)}/mo
            </span>
          </div>
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">
              Move-in Date
            </span>
            <span className="block text-sm font-semibold text-zinc-800 mt-0.5">
              {request.moveInDate}
            </span>
          </div>
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">
              Security Deposit
            </span>
            <span className="block text-sm font-semibold text-zinc-800 mt-0.5">
              {request.deposit}
            </span>
          </div>
        </div>

        {/* Preferences / Habits */}
        <div className="mt-6">
          <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-500">
            Seeker Preferences & Habits
          </h4>
          <div className="mt-2.5 flex flex-wrap gap-2">
            {request.preferences.map((p, idx) => (
              <span
                key={idx}
                className="rounded-xl bg-violet-50 border border-violet-100 px-3 py-1 text-xs font-semibold text-violet-800"
              >
                {p}
              </span>
            ))}
          </div>
        </div>

        {/* Safety Note */}
        <div className="mt-6 rounded-2xl bg-emerald-50/80 p-3 border border-emerald-100 text-xs text-emerald-800 flex items-start gap-2">
          <HeartHandshake className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
          <span>
            Zero broker platform: You will be directly in touch with {request.seekerName}. Never transfer any advance payment before visiting the property.
          </span>
        </div>

        {/* Modal Actions */}
        <div className="mt-6 pt-4 border-t border-zinc-100 flex flex-col sm:flex-row gap-3">
          <button
            onClick={() => alert(`Connection initiated with ${request.seekerName}. Messaging module will be unlocked in Phase 2.`)}
            className="flex-1 rounded-2xl bg-violet-600 py-3 text-center text-xs sm:text-sm font-bold text-white shadow-lg shadow-violet-100 hover:bg-violet-700 active:scale-95 transition-all cursor-pointer flex items-center justify-center gap-2"
          >
            <MessageCircle className="h-4 w-4" />
            <span>Connect with {request.seekerName}</span>
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
  );
}
