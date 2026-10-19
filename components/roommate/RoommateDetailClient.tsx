"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  MapPin,
  Calendar,
  Building2,
  ShieldCheck,
  Check,
  Utensils,
  Cigarette,
  Moon,
  Dog,
  Users,
  MessageSquare,
  AlertCircle,
  CheckCircle2,
  Send,
  Loader2,
  ExternalLink,
} from "lucide-react";
import {
  applyRoommateInterestAction,
  respondToRoommateInterestAction,
  updateRoommateRequestStatusAction,
} from "@/actions/roommate";
import { startOrGetRoommateConversationAction } from "@/actions/chat";
import { RoommateRequestStatus, RoommateInterestStatus } from "@/lib/types/roommate";
import { BookmarkButton } from "@/components/ui/BookmarkButton";

interface ApplicantItem {
  id: string;
  applicantId: string;
  status: RoommateInterestStatus;
  introMessage: string | null;
  conversationId: string | null;
  createdAt: Date | string;
  applicant: {
    id: string;
    profile: {
      fullName: string;
      avatarUrl: string | null;
      profession: string | null;
      companyOrCollege: string | null;
    } | null;
  };
}

export interface RoommateDetailClientProps {
  request: {
    id: string;
    title: string;
    description: string;
    locality: string;
    city: string;
    state: string;
    rentPerPerson: number;
    securityDeposit: number;
    preferredGender: string;
    moveInDate: Date | string;
    requiredRoommateCount: number;
    currentOccupantsCount: number;
    roomTypeName: string | null;
    propertyName: string | null;
    isFurnished: boolean;
    hasAttachedBathroom: boolean;
    status: RoommateRequestStatus;
    createdAt: Date | string;
    creator: {
      id: string;
      email: string | null;
      profile: {
        fullName: string;
        avatarUrl: string | null;
        bio: string | null;
        profession: string | null;
        companyOrCollege: string | null;
        gender: string | null;
        age: number | null;
        verificationStatus: string;
      } | null;
    };
    preferences?: {
      dietary: string;
      smoking: string;
      drinking: string;
      occupation: string;
      sleepSchedule: string;
      petsAllowed: boolean;
      customTags: string[];
    } | null;
    images: { url: string }[];
    property?: {
      id: string;
      name: string;
      slug: string;
      locality: string;
      city: string;
      addressLine1: string;
    } | null;
    interests: ApplicantItem[];
  };
  currentUser: {
    id: string;
    email: string | null;
    role?: string | null;
  } | null;
}

export function RoommateDetailClient({
  request,
  currentUser,
}: RoommateDetailClientProps) {
  const router = useRouter();
  const isCreator = currentUser?.id === request.creator.id;
  const isAdmin = currentUser?.role === "ADMIN";

  // Check if current user has an existing interest
  const myInterest = currentUser
    ? request.interests.find((i) => i.applicant.id === currentUser.id)
    : null;

  // Local interactive states
  const [introMessage, setIntroMessage] = useState("");
  const [isApplying, setIsApplying] = useState(false);
  const [applyError, setApplyError] = useState<string | null>(null);

  const [respondingId, setRespondingId] = useState<string | null>(null);
  const [requestStatus, setRequestStatus] = useState<RoommateRequestStatus>(request.status);
  const [statusLoading, setStatusLoading] = useState(false);
  const [isDirectChatLoading, setIsDirectChatLoading] = useState(false);

  const handleDirectChat = async () => {
    if (!currentUser) {
      router.push(`/login?returnUrl=/roommates/${request.id}`);
      return;
    }
    setIsDirectChatLoading(true);
    const res = await startOrGetRoommateConversationAction(request.id);
    setIsDirectChatLoading(false);
    if (res.success && res.data) {
      router.push(`/chat/${res.data.conversationId}`);
    } else {
      alert(res.error || "Failed to open chat.");
    }
  };

  const creatorName = request.creator.profile?.fullName || "Room Seeker";
  const creatorProfession = request.creator.profile?.profession || "Working Professional";
  const creatorCompany = request.creator.profile?.companyOrCollege;
  const isVerified = request.creator.profile?.verificationStatus === "VERIFIED";

  const formattedMoveIn = new Date(request.moveInDate).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  // Handle Apply Interest
  const handleApply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) return;

    setIsApplying(true);
    setApplyError(null);

    const res = await applyRoommateInterestAction({
      requestId: request.id,
      introMessage,
    });

    setIsApplying(false);
    if (res.success) {
      window.location.reload();
    } else {
      setApplyError(res.error || "Failed to submit interest.");
    }
  };

  // Handle Respond to Applicant (Accept or Decline)
  const handleRespond = async (interestId: string, decision: "ACCEPT" | "DECLINE") => {
    setRespondingId(interestId);
    const res = await respondToRoommateInterestAction({
      interestId,
      decision,
    });
    setRespondingId(null);

    if (res.success) {
      window.location.reload();
    } else {
      alert(res.error || "Failed to update application.");
    }
  };

  // Handle Status Update (e.g. Mark Filled)
  const handleStatusChange = async (newStatus: RoommateRequestStatus) => {
    setStatusLoading(true);
    const res = await updateRoommateRequestStatusAction({
      requestId: request.id,
      status: newStatus,
    });
    setStatusLoading(false);
    if (res.success && res.data) {
      setRequestStatus(res.data.status);
    }
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      {/* Top Breadcrumb & Status */}
      <div className="flex flex-wrap items-center justify-between gap-4 pb-6 border-b border-zinc-200">
        <div className="flex items-center gap-2 text-xs text-zinc-500">
          <Link href="/roommates" className="hover:text-[#00412E] transition-colors">
            Roommates
          </Link>
          <span>/</span>
          <span className="text-zinc-900 font-semibold">{request.city}</span>
          <span>/</span>
          <span className="truncate max-w-[200px] text-zinc-700">{request.locality}</span>
        </div>

        <div className="flex items-center gap-2">
          {requestStatus === "ACTIVE" ? (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 border border-emerald-200 px-3 py-1 text-xs font-bold text-emerald-700">
              <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
              Active Requirement
            </span>
          ) : requestStatus === "FILLED" ? (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-blue-50 border border-blue-200 px-3 py-1 text-xs font-bold text-blue-700">
              <CheckCircle2 className="h-3.5 w-3.5" />
              Requirement Filled
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-zinc-100 border border-zinc-200 px-3 py-1 text-xs font-bold text-zinc-700">
              Closed
            </span>
          )}

          <span className="rounded-full bg-[#eff4ec] border border-[#96BF8A]/40 px-3 py-1 text-xs font-bold text-[#00412E] uppercase">
            {request.preferredGender}
          </span>

          <BookmarkButton
            targetId={request.id}
            targetType="ROOMMATE"
            size="md"
          />
        </div>
      </div>

      <div className="mt-8 grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Main Content (Left 8 cols) */}
        <div className="lg:col-span-8 space-y-8">
          {/* Seeker Profile Banner */}
          <div className="rounded-3xl border border-zinc-200 bg-white p-6 sm:p-8 shadow-xs">
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-[#00412E] text-2xl font-black text-white shadow-md shadow-[#00412E]/20">
                  {creatorName[0]?.toUpperCase() || "U"}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h1 className="text-xl sm:text-2xl font-black text-zinc-950">
                      {creatorName}
                    </h1>
                    {isVerified && (
                      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-bold text-emerald-700 border border-emerald-200">
                        <ShieldCheck className="h-3.5 w-3.5 text-emerald-600" />
                        Verified
                      </span>
                    )}
                  </div>
                  <p className="text-xs sm:text-sm font-medium text-zinc-600 mt-0.5">
                    {creatorProfession}
                    {creatorCompany && <span> at <strong className="text-zinc-900">{creatorCompany}</strong></span>}
                  </p>
                  <p className="text-xs text-zinc-400 mt-1">
                    Seeking flatmate for: <strong className="text-zinc-800">{request.locality}, {request.city}</strong>
                  </p>
                </div>
              </div>

              {isCreator && (
                <div className="hidden sm:block">
                  <span className="rounded-xl bg-[#eff4ec] border border-[#96BF8A]/40 px-3 py-1.5 text-xs font-bold text-[#00412E]">
                    Your Post
                  </span>
                </div>
              )}
            </div>

            {request.creator.profile?.bio && (
              <div className="mt-5 rounded-2xl bg-zinc-50 p-4 text-xs sm:text-sm text-zinc-700 leading-relaxed border border-zinc-100">
                &ldquo;{request.creator.profile.bio}&rdquo;
              </div>
            )}
          </div>

          {/* Request Title & Space Highlights */}
          <div className="rounded-3xl border border-zinc-200 bg-white p-6 sm:p-8 shadow-xs space-y-6">
            <div>
              <h2 className="text-xl sm:text-2xl font-extrabold text-zinc-950">
                {request.title}
              </h2>

              <div className="mt-3 flex flex-wrap items-center gap-4 text-xs sm:text-sm text-zinc-600">
                <div className="flex items-center gap-1.5">
                  <MapPin className="h-4 w-4 text-[#00412E] shrink-0" />
                  <span>{request.locality}, {request.city}</span>
                </div>

                {(request.propertyName || request.property?.name) && (
                  <div className="flex items-center gap-1.5 font-medium text-zinc-900">
                    <Building2 className="h-4 w-4 text-[#00412E] shrink-0" />
                    {request.property ? (
                      <Link
                        href={`/property/${request.property.slug}`}
                        className="text-[#00412E] hover:underline flex items-center gap-1 font-bold"
                      >
                        <span>{request.property.name}</span>
                        <ExternalLink className="h-3 w-3" />
                      </Link>
                    ) : (
                      <span>{request.propertyName}</span>
                    )}
                  </div>
                )}

                <div className="flex items-center gap-1.5">
                  <Calendar className="h-4 w-4 text-[#00412E] shrink-0" />
                  <span>Target Move-in: <strong>{formattedMoveIn}</strong></span>
                </div>
              </div>
            </div>

            {/* Quick Spec Strip */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-4 rounded-2xl bg-[#eff4ec]/50 border border-[#E8EAE5]">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#00412E] block">
                  Monthly Rent Share
                </span>
                <span className="text-lg font-black text-zinc-950">
                  ₹{request.rentPerPerson.toLocaleString("en-IN")}
                </span>
                <span className="text-xs text-zinc-500">/mo</span>
              </div>

              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#00412E] block">
                  Security Deposit
                </span>
                <span className="text-lg font-black text-zinc-950">
                  ₹{request.securityDeposit.toLocaleString("en-IN")}
                </span>
              </div>

              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#00412E] block">
                  Room Sharing
                </span>
                <span className="text-sm font-bold text-zinc-900">
                  {request.roomTypeName || "Master Bedroom"}
                </span>
              </div>

              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#00412E] block">
                  Flatmates Needed
                </span>
                <span className="text-sm font-bold text-zinc-900">
                  {request.requiredRoommateCount} person(s)
                </span>
              </div>
            </div>

            {/* Room Features */}
            <div className="flex flex-wrap gap-2 pt-2">
              <span className={`inline-flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-bold border ${
                request.isFurnished
                  ? "bg-emerald-50 text-emerald-800 border-emerald-200"
                  : "bg-zinc-100 text-zinc-600 border-zinc-200"
              }`}>
                <Check className="h-3.5 w-3.5" />
                {request.isFurnished ? "Furnished Room" : "Unfurnished"}
              </span>

              <span className={`inline-flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-bold border ${
                request.hasAttachedBathroom
                  ? "bg-emerald-50 text-emerald-800 border-emerald-200"
                  : "bg-zinc-100 text-zinc-600 border-zinc-200"
              }`}>
                <Check className="h-3.5 w-3.5" />
                {request.hasAttachedBathroom ? "Attached Washroom" : "Shared Washroom"}
              </span>
            </div>

            {/* Description */}
            <div className="border-t border-zinc-100 pt-5">
              <h3 className="text-sm font-bold uppercase tracking-wider text-zinc-500 mb-2">
                About The Space & Living Habits
              </h3>
              <p className="text-xs sm:text-sm text-zinc-700 leading-relaxed whitespace-pre-line">
                {request.description}
              </p>
            </div>
          </div>

          {/* Lifestyle Compatibility Matrix */}
          <div className="rounded-3xl border border-zinc-200 bg-white p-6 sm:p-8 shadow-xs">
            <h3 className="text-base font-bold text-zinc-950 mb-5 flex items-center gap-2">
              <Users className="h-5 w-5 text-[#00412E]" />
              <span>Lifestyle Compatibility Checklist</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="flex items-center gap-3.5 rounded-2xl border border-zinc-100 bg-zinc-50/60 p-3.5">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-100 text-emerald-700">
                  <Utensils className="h-5 w-5" />
                </div>
                <div>
                  <span className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider block">
                    Dietary Preference
                  </span>
                  <span className="text-xs sm:text-sm font-bold text-zinc-900">
                    {request.preferences?.dietary === "VEGETARIAN_ONLY" && "Strict Vegetarian Only"}
                    {request.preferences?.dietary === "NON_VEG_OK" && "Non-Vegetarian OK"}
                    {request.preferences?.dietary === "VEGAN" && "Vegan Only"}
                    {(!request.preferences?.dietary || request.preferences.dietary === "NO_PREFERENCE") && "No Dietary Preference"}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-3.5 rounded-2xl border border-zinc-100 bg-zinc-50/60 p-3.5">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-rose-100 text-rose-700">
                  <Cigarette className="h-5 w-5" />
                </div>
                <div>
                  <span className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider block">
                    Smoking Habit
                  </span>
                  <span className="text-xs sm:text-sm font-bold text-zinc-900">
                    {request.preferences?.smoking === "NON_SMOKER_ONLY" && "Strict Non-Smoker Only"}
                    {request.preferences?.smoking === "OUTSIDE_ONLY" && "Outside / Balcony Only"}
                    {request.preferences?.smoking === "SMOKING_OK" && "Smoking OK"}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-3.5 rounded-2xl border border-zinc-100 bg-zinc-50/60 p-3.5">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-100 text-indigo-700">
                  <Moon className="h-5 w-5" />
                </div>
                <div>
                  <span className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider block">
                    Sleep Schedule
                  </span>
                  <span className="text-xs sm:text-sm font-bold text-zinc-900">
                    {request.preferences?.sleepSchedule === "EARLY_BIRD" && "Early Bird (Sleeps before 11 PM)"}
                    {request.preferences?.sleepSchedule === "NIGHT_OWL" && "Night Owl (Late nights)"}
                    {(!request.preferences?.sleepSchedule || request.preferences?.sleepSchedule === "FLEXIBLE") && "Flexible Hours"}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-3.5 rounded-2xl border border-zinc-100 bg-zinc-50/60 p-3.5">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-100 text-amber-700">
                  <Dog className="h-5 w-5" />
                </div>
                <div>
                  <span className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider block">
                    Pets Policy
                  </span>
                  <span className="text-xs sm:text-sm font-bold text-zinc-900">
                    {request.preferences?.petsAllowed ? "Pets Allowed & Welcome" : "No Pets in Flat"}
                  </span>
                </div>
              </div>
            </div>

            {/* Custom tags */}
            {request.preferences?.customTags && request.preferences.customTags.length > 0 && (
              <div className="mt-5 pt-4 border-t border-zinc-100">
                <span className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider block mb-2">
                  Tags & Preferences
                </span>
                <div className="flex flex-wrap gap-2">
                  {request.preferences.customTags.map((t) => (
                    <span
                      key={t}
                      className="rounded-full bg-[#eff4ec] border border-[#96BF8A]/40 px-3 py-1 text-xs font-semibold text-[#00412E]"
                    >
                      {t}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Photo Gallery (if photos exist) */}
          {request.images && request.images.length > 0 && (
            <div className="rounded-3xl border border-zinc-200 bg-white p-6 sm:p-8 shadow-xs">
              <h3 className="text-base font-bold text-zinc-950 mb-4">
                Room Photos
              </h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {request.images.map((img, idx) => (
                  <div
                    key={idx}
                    className="relative aspect-4/3 rounded-2xl overflow-hidden bg-zinc-100 border border-zinc-200"
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={img.url}
                      alt="Room photo"
                      className="h-full w-full object-cover hover:scale-105 transition-transform duration-300"
                    />
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Sidebar Action Surface (Right 4 cols) */}
        <div className="lg:col-span-4 sticky top-24 space-y-6">
          {/* HOST / CREATOR VIEW: Applications Received */}
          {isCreator || isAdmin ? (
            <div className="rounded-3xl border border-zinc-200 bg-white p-6 shadow-sm space-y-6">
              <div className="flex items-center justify-between border-b border-zinc-100 pb-4">
                <div>
                  <h3 className="text-base font-black text-zinc-950">
                    Host Control Panel
                  </h3>
                  <p className="text-xs text-zinc-500">
                    Manage your listing & applicants
                  </p>
                </div>

                <div className="flex items-center gap-1.5">
                  {requestStatus === "ACTIVE" ? (
                    <button
                      disabled={statusLoading}
                      onClick={() => handleStatusChange(RoommateRequestStatus.FILLED)}
                      className="rounded-xl border border-blue-200 bg-blue-50 px-3 py-1.5 text-xs font-bold text-blue-700 hover:bg-blue-100 cursor-pointer"
                    >
                      Mark Filled
                    </button>
                  ) : (
                    <button
                      disabled={statusLoading}
                      onClick={() => handleStatusChange(RoommateRequestStatus.ACTIVE)}
                      className="rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-xs font-bold text-emerald-700 hover:bg-emerald-100 cursor-pointer"
                    >
                      Re-open Post
                    </button>
                  )}
                </div>
              </div>

              {/* Applications List */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-600">
                    Received Inquiries ({request.interests.length})
                  </h4>
                </div>

                {request.interests.length > 0 ? (
                  <div className="space-y-3">
                    {request.interests.map((interest) => (
                      <div
                        key={interest.id}
                        className="rounded-2xl border border-zinc-200 p-4 bg-zinc-50/50 space-y-3"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex items-center gap-2.5">
                            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[#00412E] text-xs font-bold text-white">
                              {interest.applicant.profile?.fullName?.[0] || "U"}
                            </div>
                            <div>
                              <div className="text-xs font-bold text-zinc-950">
                                {interest.applicant.profile?.fullName || "Prospective Flatmate"}
                              </div>
                              <div className="text-[11px] text-zinc-500">
                                {interest.applicant.profile?.profession || "Member"}
                              </div>
                            </div>
                          </div>

                          <span
                            className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${
                              interest.status === "ACCEPTED"
                                ? "bg-emerald-100 text-emerald-800"
                                : interest.status === "DECLINED"
                                ? "bg-rose-100 text-rose-800"
                                : "bg-amber-100 text-amber-800"
                            }`}
                          >
                            {interest.status}
                          </span>
                        </div>

                        {interest.introMessage && (
                          <p className="text-xs text-zinc-600 bg-white p-2.5 rounded-xl border border-zinc-100 italic">
                            &ldquo;{interest.introMessage}&rdquo;
                          </p>
                        )}

                        {/* Action buttons */}
                        <div className="flex items-center justify-end gap-2 pt-1 border-t border-zinc-100">
                          {interest.status === "PENDING" && (
                            <>
                              <button
                                disabled={respondingId === interest.id}
                                onClick={() => handleRespond(interest.id, "DECLINE")}
                                className="rounded-xl border border-zinc-200 bg-white px-3 py-1.5 text-xs font-semibold text-zinc-600 hover:bg-zinc-100 cursor-pointer"
                              >
                                Decline
                              </button>
                              <button
                                disabled={respondingId === interest.id}
                                onClick={() => handleRespond(interest.id, "ACCEPT")}
                                className="rounded-xl bg-[#00412E] px-3.5 py-1.5 text-xs font-bold text-white hover:bg-[#002d20] cursor-pointer shadow-xs"
                              >
                                {respondingId === interest.id ? (
                                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                ) : (
                                  "Accept & Chat"
                                )}
                              </button>
                            </>
                          )}

                          {interest.status === "ACCEPTED" && interest.conversationId && (
                            <Link
                              href={`/chat/${interest.conversationId}`}
                              className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-600 px-3.5 py-1.5 text-xs font-bold text-white hover:bg-emerald-700"
                            >
                              <MessageSquare className="h-3.5 w-3.5" />
                              <span>Open In-Platform Chat</span>
                            </Link>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="rounded-2xl border border-dashed border-zinc-200 p-6 text-center bg-zinc-50">
                    <p className="text-xs text-zinc-500">
                      No applications received yet. Your listing is live in the discovery feed.
                    </p>
                  </div>
                )}
              </div>
            </div>
          ) : (
            /* VISITOR / APPLICANT VIEW: Apply for flatshare */
            <div className="rounded-3xl border border-zinc-200 bg-white p-6 sm:p-7 shadow-sm space-y-5">
              <div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-[#00412E] block">
                  Zero Brokerage
                </span>
                <h3 className="text-lg font-black text-zinc-950 mt-0.5">
                  Interested in this space?
                </h3>
                <p className="text-xs text-zinc-500 mt-1">
                  Send an introductory note to connect directly with {creatorName}.
                </p>
              </div>

              {myInterest ? (
                <div className="rounded-2xl bg-[#eff4ec] border border-[#96BF8A]/40 p-5 space-y-3">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-[#00412E]" />
                    <span className="text-xs font-bold text-[#00412E]">
                      Inquiry Sent: Status is {myInterest.status}
                    </span>
                  </div>
                  <p className="text-xs text-zinc-600">
                    {myInterest.status === "ACCEPTED"
                      ? "Congratulations! The host accepted your application. You can chat right now in-platform."
                      : myInterest.status === "PENDING"
                      ? "Your inquiry has been sent to the host. You will be notified once they review your profile."
                      : "The host has closed this inquiry."}
                  </p>

                  {myInterest.status === "ACCEPTED" && myInterest.conversationId && (
                    <Link
                      href={`/chat/${myInterest.conversationId}`}
                      className="w-full flex items-center justify-center gap-2 rounded-xl bg-[#00412E] py-3 text-xs font-bold text-white hover:bg-[#002d20] shadow-md shadow-[#00412E]/20"
                    >
                      <MessageSquare className="h-4 w-4" />
                      <span>Start Chat with Host</span>
                    </Link>
                  )}
                </div>
              ) : currentUser ? (
                <div className="space-y-4">
                  <button
                    type="button"
                    onClick={handleDirectChat}
                    disabled={isDirectChatLoading}
                    className="w-full flex items-center justify-center gap-2 rounded-xl border border-[#00412E] bg-[#eff4ec] py-2.5 text-xs font-bold text-[#00412E] hover:bg-[#dce7d8] cursor-pointer shadow-xs transition-colors disabled:opacity-50"
                  >
                    {isDirectChatLoading ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <>
                        <MessageSquare className="h-4 w-4 text-[#00412E]" />
                        <span>Direct Message {creatorName}</span>
                      </>
                    )}
                  </button>

                  <div className="flex items-center gap-2 my-1">
                    <div className="h-px bg-zinc-200 flex-1" />
                    <span className="text-[10px] text-zinc-400 uppercase font-bold tracking-wider">
                      Or send formal introduction
                    </span>
                    <div className="h-px bg-zinc-200 flex-1" />
                  </div>

                  <form onSubmit={handleApply} className="space-y-4">
                    {applyError && (
                      <div className="flex items-center gap-2 rounded-xl bg-rose-50 border border-rose-200 p-3 text-xs font-medium text-rose-800">
                        <AlertCircle className="h-4 w-4 shrink-0 text-rose-600" />
                        <span>{applyError}</span>
                      </div>
                    )}

                    <div>
                      <label className="block text-xs font-semibold text-zinc-700 mb-1.5">
                        Introduce Yourself
                      </label>
                      <textarea
                        rows={3}
                        value={introMessage}
                        onChange={(e) => setIntroMessage(e.target.value)}
                        placeholder={`Hi ${creatorName}, I work in the area and my move-in date aligns well. I'm a quiet, clean flatmate...`}
                        className="w-full rounded-xl border border-[#E8EAE5] bg-zinc-50 p-3 text-xs font-medium text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:border-[#00412E] focus:bg-white"
                      />
                    </div>

                    <button
                      type="submit"
                      disabled={isApplying || requestStatus !== "ACTIVE"}
                      className="w-full flex items-center justify-center gap-2 rounded-xl bg-[#00412E] py-3 text-xs sm:text-sm font-bold text-white shadow-md shadow-[#00412E]/20 hover:bg-[#002d20] disabled:opacity-50 cursor-pointer active:scale-95 transition-all"
                    >
                      {isApplying ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin" />
                          <span>Sending Request...</span>
                        </>
                      ) : (
                        <>
                          <Send className="h-4 w-4 text-[#96BF8A]" />
                          <span>Send Interest Application</span>
                        </>
                      )}
                    </button>

                    <p className="text-[11px] text-zinc-400 text-center">
                      Your phone number remains private until you choose to share it.
                    </p>
                  </form>
                </div>
              ) : (
                <div className="rounded-2xl bg-zinc-50 border border-zinc-200 p-5 text-center space-y-3">
                  <p className="text-xs text-zinc-600 leading-relaxed">
                    Sign in to message {creatorName} and coordinate move-in details safely.
                  </p>
                  <Link
                    href={`/login?returnUrl=/roommates/${request.id}`}
                    className="w-full inline-block rounded-xl bg-[#00412E] py-2.5 text-xs font-bold text-white hover:bg-[#002d20] transition-colors shadow-xs"
                  >
                    Sign In to Message / Connect
                  </Link>
                </div>
              )}
            </div>
          )}

          {/* Platform Safety Box */}
          <div className="rounded-2xl border border-zinc-100 bg-zinc-50/70 p-5 space-y-2">
            <div className="flex items-center gap-2 text-xs font-bold text-zinc-800">
              <ShieldCheck className="h-4 w-4 text-emerald-600" />
              <span>Safe Flatmate Protocol</span>
            </div>
            <p className="text-[11px] text-zinc-500 leading-relaxed">
              Never transfer security deposits or rent advances before visiting the space and meeting the current occupants in person.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
