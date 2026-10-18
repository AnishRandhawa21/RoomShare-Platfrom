"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  MapPin,
  Calendar,
  ShieldCheck,
  MessageSquare,
  Loader2,
  Users,
} from "lucide-react";
import type { GenderPolicy } from "@/lib/types/roommate";
import { BookmarkButton } from "@/components/ui/BookmarkButton";
import { startOrGetRoommateConversationAction } from "@/actions/chat";

export interface RoommateCardProps {
  id: string;
  title: string;
  locality: string;
  city: string;
  propertyName?: string | null;
  propertySlug?: string | null;
  roomTypeName?: string | null;
  requiredRoommateCount?: number;
  rentPerPerson: number;
  securityDeposit?: number;
  preferredGender: GenderPolicy;
  moveInDate: Date | string;
  isFurnished?: boolean;
  hasAttachedBathroom?: boolean;
  currentUserId?: string | null;
  creator: {
    id: string;
    profile: {
      fullName: string;
      avatarUrl: string | null;
      profession: string | null;
      verificationStatus: string;
    } | null;
  };
  preferences?: {
    dietary: string;
    smoking: string;
    drinking: string;
    sleepSchedule: string;
    petsAllowed: boolean;
    customTags: string[];
  } | null;
  images?: { url: string }[];
}

export function RoommateCard({
  id,
  title,
  locality,
  city,
  propertyName,
  propertySlug,
  roomTypeName,
  requiredRoommateCount = 1,
  rentPerPerson,
  preferredGender,
  moveInDate,
  currentUserId,
  creator,
  preferences,
}: RoommateCardProps) {
  const router = useRouter();
  const [isConnecting, setIsConnecting] = useState(false);

  const formattedDate = new Date(moveInDate).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
  });

  const creatorName = creator.profile?.fullName || "Room Seeker";
  const profession = creator.profile?.profession || "Working Professional";
  const isVerified = creator.profile?.verificationStatus === "VERIFIED";

  // Handle direct message / chat initiation
  const handleMessageClick = async (e: React.MouseEvent) => {
    e.preventDefault();
    if (!currentUserId) {
      router.push(`/login?returnUrl=/roommates/${id}`);
      return;
    }

    if (currentUserId === creator.id) {
      router.push(`/roommates/${id}`);
      return;
    }

    setIsConnecting(true);
    const res = await startOrGetRoommateConversationAction(id);
    setIsConnecting(false);

    if (res.success && res.data) {
      router.push(`/chat/${res.data.conversationId}`);
    } else {
      router.push(`/roommates/${id}`);
    }
  };

  // Lifestyle badges
  const lifestyleBadges: string[] = [];
  if (preferences?.dietary === "VEGETARIAN_ONLY") lifestyleBadges.push("Vegetarian");
  else if (preferences?.dietary === "VEGAN") lifestyleBadges.push("Vegan");
  else if (preferences?.dietary === "NON_VEG_OK") lifestyleBadges.push("Non-Veg OK");

  if (preferences?.smoking === "NON_SMOKER_ONLY") lifestyleBadges.push("Non-smoker");
  else if (preferences?.smoking === "OUTSIDE_ONLY") lifestyleBadges.push("Balcony Smoker");

  if (preferences?.sleepSchedule === "EARLY_BIRD") lifestyleBadges.push("Early sleeper");
  else if (preferences?.sleepSchedule === "NIGHT_OWL") lifestyleBadges.push("Night owl");

  return (
    <div className="group flex flex-col justify-between rounded-3xl border border-zinc-200 bg-white p-5 sm:p-6 shadow-xs transition-all hover:border-violet-300 hover:shadow-md">
      <div>
        {/* Top Header: Property Context (The primary object being discovered) */}
        <div className="flex items-start justify-between gap-3">
          <div>
            <div className="flex items-center gap-1.5 text-xs text-zinc-500 mb-1">
              <MapPin className="h-3.5 w-3.5 text-zinc-400 shrink-0" />
              <span className="font-medium truncate">
                {locality}, {city}
              </span>
            </div>
            {propertySlug ? (
              <Link href={`/property/${propertySlug}`}>
                <h3 className="text-lg font-black text-zinc-950 group-hover:text-violet-700 transition-colors line-clamp-1">
                  {propertyName || "Verified PG Accommodation"}
                </h3>
              </Link>
            ) : (
              <h3 className="text-lg font-black text-zinc-950 line-clamp-1">
                {propertyName || title}
              </h3>
            )}
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <span
              className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider ${
                preferredGender === "BOYS"
                  ? "bg-blue-50 text-blue-700 border border-blue-200"
                  : preferredGender === "GIRLS"
                  ? "bg-rose-50 text-rose-700 border border-rose-200"
                  : "bg-violet-50 text-violet-700 border border-violet-200"
              }`}
            >
              {preferredGender === "BOYS"
                ? "Boys"
                : preferredGender === "GIRLS"
                ? "Girls"
                : "Any Gender"}
            </span>

            <BookmarkButton targetId={id} targetType="ROOMMATE" size="sm" />
          </div>
        </div>

        {/* Room Type & Need Pill */}
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <span className="inline-flex items-center rounded-xl bg-zinc-100 px-2.5 py-1 text-xs font-bold text-zinc-800">
            {roomTypeName || "Room Share"}
          </span>

          <span className="inline-flex items-center gap-1 rounded-xl bg-violet-50 px-2.5 py-1 text-xs font-bold text-violet-700 border border-violet-200/60">
            <Users className="h-3.5 w-3.5" />
            <span>
              {requiredRoommateCount} roommate{requiredRoommateCount > 1 ? "s" : ""} needed
            </span>
          </span>

          <span className="inline-flex items-center gap-1 rounded-xl bg-zinc-50 px-2.5 py-1 text-xs font-medium text-zinc-600 border border-zinc-200">
            <Calendar className="h-3 w-3 text-zinc-400" />
            <span>Move-in: {formattedDate}</span>
          </span>
        </div>

        {/* Financial info */}
        <div className="mt-4 flex items-baseline gap-1.5">
          <span className="text-xl font-black text-zinc-950">
            ₹{rentPerPerson.toLocaleString("en-IN")}
          </span>
          <span className="text-xs text-zinc-500 font-medium">/ person / month (Split share)</span>
        </div>

        {/* Secondary Section: Flatmate / Person Details */}
        <div className="mt-5 rounded-2xl bg-zinc-50/80 p-3.5 border border-zinc-100 space-y-2.5">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-violet-600 text-xs font-black text-white shadow-xs">
              {creatorName[0]?.toUpperCase() || "U"}
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-bold text-zinc-900 truncate">
                  {creatorName}
                </span>
                {isVerified && (
                  <span title="Verified User">
                    <ShieldCheck className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
                  </span>
                )}
              </div>
              <p className="text-[11px] text-zinc-500 truncate">{profession}</p>
            </div>
          </div>

          {/* Lifestyle tags: e.g. Vegetarian · Non-smoker · Early sleeper */}
          {lifestyleBadges.length > 0 && (
            <div className="text-[11px] font-medium text-zinc-600 flex items-center flex-wrap gap-1.5 pt-1 border-t border-zinc-200/50">
              {lifestyleBadges.map((badge, idx) => (
                <span key={badge} className="flex items-center gap-1.5">
                  {idx > 0 && <span className="text-zinc-300">•</span>}
                  <span>{badge}</span>
                </span>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Footer Actions: [View Request] and [Message] */}
      <div className="mt-5 pt-3.5 border-t border-zinc-100 grid grid-cols-2 gap-2.5">
        <Link
          href={`/roommates/${id}`}
          className="flex items-center justify-center gap-1.5 rounded-xl border border-zinc-200 bg-white py-2.5 text-xs font-bold text-zinc-700 hover:bg-zinc-50 transition-colors"
        >
          <span>View Request</span>
        </Link>

        {currentUserId === creator.id ? (
          <Link
            href={`/roommates/${id}`}
            className="flex items-center justify-center gap-1.5 rounded-xl bg-violet-50 text-violet-700 border border-violet-200 py-2.5 text-xs font-bold hover:bg-violet-100 transition-colors"
          >
            <span>My Post</span>
          </Link>
        ) : (
          <button
            type="button"
            onClick={handleMessageClick}
            disabled={isConnecting}
            className="flex items-center justify-center gap-1.5 rounded-xl bg-violet-600 py-2.5 text-xs font-bold text-white hover:bg-violet-700 transition-colors shadow-xs cursor-pointer disabled:opacity-50"
          >
            {isConnecting ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <>
                <MessageSquare className="h-3.5 w-3.5" />
                <span>Message</span>
              </>
            )}
          </button>
        )}
      </div>
    </div>
  );
}
