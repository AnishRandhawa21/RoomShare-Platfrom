"use client";

import { useState } from "react";
import {
  Phone,
  MessageSquare,
  ShieldCheck,
  Send,
  CheckCircle2,
  AlertCircle,
  Sparkles,
} from "lucide-react";
import { submitPGEnquiryAction } from "@/actions/enquiry";
import { CustomDatePicker } from "@/components/ui/CustomDatePicker";
import type { RoomTypeData } from "./RoomTypesSection";

interface OwnerContactCardProps {
  property: {
    id: string;
    name: string;
    slug: string;
    locality: string;
    city: string;
    startingPrice: number;
    contactPhone: string;
    whatsappNumber: string | null;
  };
  owner: {
    fullName: string;
    companyName: string | null;
    isVerified: boolean;
  };
  roomTypes: RoomTypeData[];
  selectedRoomTypeId: string | null;
  onClearSelectedRoomType: () => void;
  currentUser?: {
    id: string;
    email: string | null;
    profile?: { fullName: string; phone?: string | null } | null;
  } | null;
}

export function OwnerContactCard({
  property,
  owner,
  roomTypes,
  selectedRoomTypeId,
  onClearSelectedRoomType,
  currentUser,
}: OwnerContactCardProps) {
  const [showEnquiryForm, setShowEnquiryForm] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [enquiryMoveInDate, setEnquiryMoveInDate] = useState("");
  const [statusMessage, setStatusMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  // Clean WhatsApp number
  const rawWhatsApp =
    property.whatsappNumber && property.whatsappNumber !== "Not provided"
      ? property.whatsappNumber
      : property.contactPhone && property.contactPhone !== "Not provided"
      ? property.contactPhone
      : "";
  const digitsOnly = rawWhatsApp.replace(/\D/g, "");
  const cleanWhatsApp =
    digitsOnly.length === 10
      ? `91${digitsOnly}`
      : digitsOnly.length > 10 && digitsOnly.startsWith("91")
      ? digitsOnly
      : digitsOnly;

  const hasValidWhatsApp = cleanWhatsApp.length >= 10;
  const whatsappUrl = hasValidWhatsApp
    ? `https://wa.me/${cleanWhatsApp}?text=${encodeURIComponent(
        `Hi, I saw ${property.name} in ${property.locality}, ${property.city} on StayKro and would like to enquire about room availability.`
      )}`
    : null;

  const handleEnquirySubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);
    setStatusMessage(null);

    const formData = new FormData(e.currentTarget);
    formData.append("propertyId", property.id);
    if (selectedRoomTypeId) {
      formData.append("roomTypeId", selectedRoomTypeId);
    }

    try {
      const res = await submitPGEnquiryAction(formData);
      if (res.success) {
        setStatusMessage({
          type: "success",
          text: res.message || "Enquiry sent! The property owner will contact you.",
        });
        (e.target as HTMLFormElement).reset();
      } else {
        setStatusMessage({
          type: "error",
          text: res.error || "Failed to submit enquiry. Please try calling directly.",
        });
      }
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : "Network error. Please try calling.";
      setStatusMessage({
        type: "error",
        text: errorMsg,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const activeRoomTypes = roomTypes || [];

  // Determine which room type to feature:
  const selectedRoomType = activeRoomTypes.find((rt) => rt.id === selectedRoomTypeId);

  // If no room type is selected, find the room type that gives the lowest per-person rent:
  let defaultRoomType: RoomTypeData | null = null;
  let lowestPerPerson = Infinity;
  for (const rt of activeRoomTypes) {
    const perPerson = rt.occupancy > 1 ? Math.round(rt.monthlyRent / rt.occupancy) : rt.monthlyRent;
    if (perPerson < lowestPerPerson) {
      lowestPerPerson = perPerson;
      defaultRoomType = rt;
    }
  }

  const currentRoomType = selectedRoomType || defaultRoomType;

  // Compute displayPrice (per-bed / split price if sharing), originalPrice (total room rent to cross out), and occupancyBadge
  let displayPrice = property.startingPrice || 0;
  let originalPrice: number | null = null;
  let occupancyBadge: string | null = null;

  if (currentRoomType) {
    if (currentRoomType.occupancy > 1) {
      displayPrice = Math.round(currentRoomType.monthlyRent / currentRoomType.occupancy);
      originalPrice = currentRoomType.monthlyRent;
      occupancyBadge = `${currentRoomType.occupancy}-Sharing`;
    } else {
      displayPrice = currentRoomType.monthlyRent;
      originalPrice = null;
      occupancyBadge = "Private Room";
    }
  }

  return (
    <div className="sticky top-24 rounded-3xl border border-zinc-200 bg-white p-6 shadow-xl shadow-zinc-200/50 space-y-6">
      {/* Price Header */}
      <div>
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold uppercase tracking-wider text-zinc-400">
            {selectedRoomType ? `${selectedRoomType.name} Rent` : "Monthly Rent Starts At"}
          </span>
          {selectedRoomType && (
            <button
              type="button"
              onClick={onClearSelectedRoomType}
              className="text-[11px] font-bold text-indigo-600 hover:text-indigo-800 transition-colors cursor-pointer"
            >
              Reset to All
            </button>
          )}
        </div>

        {/* Strikethrough full room price + Sharing badge (matching home screen) */}
        {(originalPrice || occupancyBadge) && (
          <div className="flex items-center gap-2 mt-1.5">
            {originalPrice && originalPrice > displayPrice && (
              <span className="text-sm font-semibold text-zinc-400 line-through">
                ₹{originalPrice.toLocaleString("en-IN")}
              </span>
            )}
            {occupancyBadge && (
              <span className="text-[10px] font-bold text-[#00412E] bg-[#96BF8A]/20 px-2 py-0.5 rounded-md border border-[#96BF8A]/50">
                {occupancyBadge}
              </span>
            )}
          </div>
        )}

        <div className="flex items-baseline gap-1 mt-1">
          <span className="text-3xl sm:text-4xl font-black tracking-tight text-zinc-950">
            ₹{displayPrice.toLocaleString("en-IN")}
          </span>
          <span className="text-sm font-semibold text-zinc-500">
            {currentRoomType && currentRoomType.occupancy > 1 ? "/ bed / month" : "/ month"}
          </span>
        </div>
        <div className="mt-2 flex items-center gap-1.5 text-xs font-semibold text-emerald-700 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-100 w-fit">
          <ShieldCheck className="h-3.5 w-3.5 text-emerald-600" />
          <span>100% Zero Brokerage Guaranteed</span>
        </div>
      </div>

      {/* Owner Badge */}
      <div className="rounded-2xl bg-[#E8EAE5]/40 p-4 border border-[#E8EAE5] flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#eff4ec] text-[#00412E] font-bold text-sm border border-[#96BF8A]/30">
            {owner.fullName ? owner.fullName[0].toUpperCase() : "O"}
          </div>
          <div>
            <div className="text-xs text-zinc-400 font-medium">Property Managed By</div>
            <div className="text-sm font-bold text-zinc-900">
              {owner.companyName || owner.fullName}
            </div>
          </div>
        </div>
        {owner.isVerified && (
          <span className="rounded-full bg-[#eff4ec] text-[#00412E] text-[10px] font-bold px-2 py-0.5 border border-[#96BF8A]/40">
            Verified Owner
          </span>
        )}
      </div>

      {/* Direct Contact CTAs */}
      <div className="grid grid-cols-2 gap-3">
        {/* Direct Call */}
        <a
          href={`tel:${property.contactPhone}`}
          className="flex items-center justify-center gap-2 rounded-2xl bg-[#00412E] py-3.5 px-4 text-xs sm:text-sm font-bold text-white hover:bg-[#002d20] active:scale-95 transition-all shadow-md shadow-[#00412E]/20 cursor-pointer"
        >
          <Phone className="h-4 w-4" />
          <span>Call Owner</span>
        </a>

        {/* WhatsApp Chat */}
        {hasValidWhatsApp && whatsappUrl ? (
          <a
            href={whatsappUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-2 rounded-2xl bg-emerald-600 py-3.5 px-4 text-xs sm:text-sm font-bold text-white hover:bg-emerald-700 active:scale-95 transition-all shadow-md shadow-emerald-100 cursor-pointer"
          >
            <MessageSquare className="h-4 w-4" />
            <span>WhatsApp</span>
          </a>
        ) : (
          <button
            type="button"
            onClick={() => setShowEnquiryForm(true)}
            className="flex items-center justify-center gap-2 rounded-2xl bg-emerald-600 py-3.5 px-4 text-xs sm:text-sm font-bold text-white hover:bg-emerald-700 active:scale-95 transition-all shadow-md shadow-emerald-100 cursor-pointer"
          >
            <MessageSquare className="h-4 w-4" />
            <span>Enquire</span>
          </button>
        )}
      </div>

      {/* Toggle Enquiry Form */}
      <div>
        <button
          type="button"
          onClick={() => setShowEnquiryForm(!showEnquiryForm)}
          className="w-full rounded-2xl border border-[#96BF8A]/40 bg-[#eff4ec] py-3 text-xs sm:text-sm font-bold text-[#00412E] hover:bg-[#dce7d8] transition-colors cursor-pointer"
        >
          {showEnquiryForm ? "Hide Quick Enquiry" : "Book a Visit / Send Enquiry"}
        </button>
      </div>

      {/* Quick Enquiry Form */}
      {showEnquiryForm && (
        <form onSubmit={handleEnquirySubmit} className="space-y-3 pt-3 border-t border-[#E8EAE5]">
          <div className="text-xs font-bold text-zinc-900 flex items-center gap-1.5">
            <Sparkles className="h-3.5 w-3.5 text-[#00412E]" />
            <span>Send Direct Booking Enquiry</span>
          </div>

          {statusMessage && (
            <div
              className={`rounded-xl p-3 text-xs font-semibold flex items-center gap-2 ${
                statusMessage.type === "success"
                  ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
                  : "bg-rose-50 text-rose-800 border border-rose-200"
              }`}
            >
              {statusMessage.type === "success" ? (
                <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
              ) : (
                <AlertCircle className="h-4 w-4 text-rose-600 shrink-0" />
              )}
              <span>{statusMessage.text}</span>
            </div>
          )}

          <div>
            <label htmlFor="enquiry-name" className="block text-[11px] font-bold uppercase text-zinc-500 mb-1">
              Your Name *
            </label>
            <input
              id="enquiry-name"
              name="visitorName"
              type="text"
              required
              defaultValue={currentUser?.profile?.fullName || ""}
              placeholder="e.g. Rahul Sharma"
              className="w-full rounded-xl border border-[#E8EAE5] bg-[#E8EAE5]/30 px-3 py-2 text-xs font-semibold text-zinc-900 placeholder:text-zinc-400 focus:bg-white focus:border-[#00412E] focus:outline-none"
            />
          </div>

          <div>
            <label htmlFor="enquiry-phone" className="block text-[11px] font-bold uppercase text-zinc-500 mb-1">
              Mobile Number (10 digits) *
            </label>
            <input
              id="enquiry-phone"
              name="visitorPhone"
              type="tel"
              required
              placeholder="e.g. 9876543210"
              className="w-full rounded-xl border border-[#E8EAE5] bg-[#E8EAE5]/30 px-3 py-2 text-xs font-semibold text-zinc-900 placeholder:text-zinc-400 focus:bg-white focus:border-[#00412E] focus:outline-none"
            />
          </div>

          <div>
            <label htmlFor="enquiry-roomtype" className="block text-[11px] font-bold uppercase text-zinc-500 mb-1">
              Preferred Room Type
            </label>
            <select
              id="enquiry-roomtype"
              name="roomTypeId"
              defaultValue={selectedRoomTypeId || ""}
              className="w-full rounded-xl border border-[#E8EAE5] bg-[#E8EAE5]/30 px-3 py-2 text-xs font-semibold text-zinc-900 focus:bg-white focus:border-[#00412E] focus:outline-none cursor-pointer"
            >
              <option value="">Any available room</option>
              {roomTypes.map((rt) => {
                const perPerson = Math.round(rt.monthlyRent / Math.max(1, rt.occupancy));
                return (
                  <option key={rt.id} value={rt.id}>
                    {rt.name} (₹{perPerson.toLocaleString("en-IN")}/person
                    {rt.occupancy > 1 ? ` - ₹${rt.monthlyRent.toLocaleString("en-IN")} total` : "/mo"})
                  </option>
                );
              })}
            </select>
          </div>

          <div>
            <label htmlFor="enquiry-date" className="block text-[11px] font-bold uppercase text-zinc-500 mb-1">
              Expected Move-in Date
            </label>
            <CustomDatePicker
              id="enquiry-date"
              name="moveInDate"
              value={enquiryMoveInDate}
              onChange={setEnquiryMoveInDate}
              minDate={new Date().toISOString().split("T")[0]}
              placeholder="Select expected move-in date"
            />
          </div>

          <div>
            <label htmlFor="enquiry-message" className="block text-[11px] font-bold uppercase text-zinc-500 mb-1">
              Message or Questions (Optional)
            </label>
            <textarea
              id="enquiry-message"
              name="message"
              rows={2}
              placeholder="e.g. I work in Tech Park, looking to visit this Saturday."
              className="w-full rounded-xl border border-[#E8EAE5] bg-[#E8EAE5]/30 px-3 py-2 text-xs font-medium text-zinc-900 placeholder:text-zinc-400 focus:bg-white focus:border-[#00412E] focus:outline-none"
            />
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full flex items-center justify-center gap-1.5 rounded-xl bg-[#00412E] py-3 text-xs font-bold text-white hover:bg-[#002d20] active:scale-95 transition-all shadow-sm shadow-[#00412E]/20 cursor-pointer disabled:opacity-70"
          >
            <Send className="h-3.5 w-3.5 text-[#96BF8A]" />
            <span>{isSubmitting ? "Sending enquiry..." : "Submit Enquiry"}</span>
          </button>
        </form>
      )}

      {/* Safety Notice */}
      <div className="rounded-2xl bg-amber-50/60 p-3.5 border border-amber-100/80 text-[11px] text-amber-900 space-y-1">
        <div className="font-bold flex items-center gap-1">
          <ShieldCheck className="h-3.5 w-3.5 text-amber-700" />
          <span>Safety & Trust Advisory</span>
        </div>
        <p className="text-zinc-600 leading-relaxed">
          Always inspect the PG physically before transferring any booking advance or token deposit.
        </p>
      </div>
    </div>
  );
}
