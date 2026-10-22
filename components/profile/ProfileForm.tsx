"use client";

import { useActionState } from "react";
import { updateProfileAction, type ProfileActionResult } from "@/actions/profile";
import {
  User,
  Phone,
  Briefcase,
  GraduationCap,
  MapPin,
  AlertCircle,
  CheckCircle2,
  Save,
  Shield,
  Building2,
  Mail,
  MessageSquare,
  Sparkles,
} from "lucide-react";

interface ProfileFormProps {
  user: {
    id: string;
    email: string | null;
    phone: string | null;
    role: string;
    profile: {
      fullName: string;
      avatarUrl: string | null;
      bio: string | null;
      gender: string | null;
      age: number | null;
      profession: string | null;
      companyOrCollege: string | null;
      city: string | null;
      verificationStatus: string;
    } | null;
    ownerProfile?: {
      id: string;
      businessName: string | null;
      contactPhone: string;
      whatsappNumber: string | null;
    } | null;
  };
}

export function ProfileForm({ user }: ProfileFormProps) {
  const [state, formAction, isPending] = useActionState<ProfileActionResult | null, FormData>(
    updateProfileAction,
    null
  );

  const profile = user.profile;
  const owner = user.ownerProfile;
  const role = user.role;

  const isAdmin = role === "ADMIN";
  const isOwner = role === "OWNER";
  const isSeeker = !isAdmin && !isOwner;

  return (
    <form action={formAction} className="space-y-6">
      {/* Alert Messages */}
      {state?.error && (
        <div className="rounded-2xl bg-rose-50 p-4 border border-rose-200 text-xs sm:text-sm font-semibold text-rose-800 flex items-center gap-2.5 shadow-2xs">
          <AlertCircle className="h-4 w-4 text-rose-600 shrink-0" />
          <span>{state.error}</span>
        </div>
      )}

      {state?.success && (
        <div className="rounded-2xl bg-emerald-50 p-4 border border-emerald-200 text-xs sm:text-sm font-semibold text-emerald-800 flex items-center gap-2.5 shadow-2xs">
          <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
          <span>{state.message}</span>
        </div>
      )}

      {/* Role-Specific Context Notice Banner */}
      {isAdmin && (
        <div className="rounded-2xl bg-[#00412E]/5 border border-[#00412E]/15 p-4 flex items-start gap-3">
          <Shield className="h-5 w-5 text-[#00412E] shrink-0 mt-0.5" />
          <div className="text-xs">
            <span className="font-bold text-[#00412E] block">System Administrator Profile</span>
            <span className="text-zinc-600 mt-0.5 block">
              You are authenticated with platform Superadmin access. Your contact details are used for emergency alerts, invite operations, and administrative audit logging.
            </span>
          </div>
        </div>
      )}

      {isOwner && (
        <div className="rounded-2xl bg-emerald-50 border border-emerald-200/80 p-4 flex items-start gap-3">
          <Building2 className="h-5 w-5 text-emerald-700 shrink-0 mt-0.5" />
          <div className="text-xs">
            <span className="font-bold text-emerald-900 block">Host & Property Business Contact</span>
            <span className="text-emerald-800 mt-0.5 block">
              Your contact numbers and WhatsApp business number are directly shared with prospective tenants when they inquire about your published PG listings.
            </span>
          </div>
        </div>
      )}

      {isSeeker && (
        <div className="rounded-2xl bg-[#eff4ec] border border-[#96BF8A]/40 p-4 flex items-start gap-3">
          <Sparkles className="h-5 w-5 text-[#00412E] shrink-0 mt-0.5" />
          <div className="text-xs">
            <span className="font-bold text-[#00412E] block">Resident & Roommate Profile</span>
            <span className="text-zinc-600 mt-0.5 block">
              Keeping your lifestyle preferences and occupation details updated helps PG hosts verify your inquiries and flatmates connect with you faster.
            </span>
          </div>
        </div>
      )}

      {/* Inputs Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Full Name */}
        <div>
          <label
            htmlFor="fullName"
            className="block text-xs font-bold uppercase tracking-wider text-zinc-600 mb-1.5"
          >
            {isAdmin ? "Admin Full Name" : isOwner ? "Primary Host Name" : "Full Name"}{" "}
            <span className="text-rose-500">*</span>
          </label>
          <div className="relative rounded-2xl border border-zinc-200 bg-zinc-50/80 focus-within:border-[#00412E] focus-within:bg-white focus-within:ring-2 focus-within:ring-[#00412E]/10 transition-all">
            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5">
              <User className="h-4 w-4 text-zinc-400" />
            </div>
            <input
              id="fullName"
              name="fullName"
              type="text"
              required
              defaultValue={profile?.fullName || ""}
              placeholder={isAdmin ? "System Admin Name" : isOwner ? "Host / Owner Name" : "e.g. Rahul Sharma"}
              className="block w-full rounded-2xl bg-transparent py-3 pl-10 pr-4 text-sm font-semibold text-zinc-900 placeholder:text-zinc-400 focus:outline-none"
            />
          </div>
        </div>

        {/* Read-Only Account Email */}
        <div>
          <label
            htmlFor="email"
            className="block text-xs font-bold uppercase tracking-wider text-zinc-600 mb-1.5"
          >
            Account Email <span className="text-zinc-400 font-normal">(Primary Auth)</span>
          </label>
          <div className="relative rounded-2xl border border-zinc-200 bg-zinc-100/70">
            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5">
              <Mail className="h-4 w-4 text-zinc-400" />
            </div>
            <input
              id="email"
              type="email"
              disabled
              value={user.email || ""}
              className="block w-full rounded-2xl bg-transparent py-3 pl-10 pr-4 text-sm font-medium text-zinc-500 cursor-not-allowed"
            />
          </div>
        </div>

        {/* Primary Phone */}
        <div>
          <label
            htmlFor="phone"
            className="block text-xs font-bold uppercase tracking-wider text-zinc-600 mb-1.5"
          >
            {isAdmin ? "Security Contact Phone" : isOwner ? "Calling Phone (Direct Tenant Calls)" : "Phone Number"}
          </label>
          <div className="relative rounded-2xl border border-zinc-200 bg-zinc-50/80 focus-within:border-[#00412E] focus-within:bg-white focus-within:ring-2 focus-within:ring-[#00412E]/10 transition-all">
            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5">
              <Phone className="h-4 w-4 text-zinc-400" />
            </div>
            <input
              id="phone"
              name="phone"
              type="tel"
              defaultValue={user.phone || owner?.contactPhone || ""}
              placeholder="+91 98765 43210"
              className="block w-full rounded-2xl bg-transparent py-3 pl-10 pr-4 text-sm font-semibold text-zinc-900 placeholder:text-zinc-400 focus:outline-none"
            />
          </div>
        </div>

        {/* Owner-Specific WhatsApp Number */}
        {isOwner && (
          <div>
            <label
              htmlFor="whatsappNumber"
              className="block text-xs font-bold uppercase tracking-wider text-zinc-600 mb-1.5"
            >
              WhatsApp Number <span className="text-zinc-400 font-normal">(Tenant Leads)</span>
            </label>
            <div className="relative rounded-2xl border border-zinc-200 bg-zinc-50/80 focus-within:border-[#00412E] focus-within:bg-white focus-within:ring-2 focus-within:ring-[#00412E]/10 transition-all">
              <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5">
                <MessageSquare className="h-4 w-4 text-emerald-600" />
              </div>
              <input
                id="whatsappNumber"
                name="whatsappNumber"
                type="tel"
                defaultValue={owner?.whatsappNumber || user.phone || ""}
                placeholder="+91 98765 43210 (WhatsApp)"
                className="block w-full rounded-2xl bg-transparent py-3 pl-10 pr-4 text-sm font-semibold text-zinc-900 placeholder:text-zinc-400 focus:outline-none"
              />
            </div>
          </div>
        )}

        {/* Owner-Specific Business / Brand Name */}
        {isOwner && (
          <div>
            <label
              htmlFor="businessName"
              className="block text-xs font-bold uppercase tracking-wider text-zinc-600 mb-1.5"
            >
              Business or Property Group Name
            </label>
            <div className="relative rounded-2xl border border-zinc-200 bg-zinc-50/80 focus-within:border-[#00412E] focus-within:bg-white focus-within:ring-2 focus-within:ring-[#00412E]/10 transition-all">
              <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5">
                <Building2 className="h-4 w-4 text-zinc-400" />
              </div>
              <input
                id="businessName"
                name="businessName"
                type="text"
                defaultValue={owner?.businessName || ""}
                placeholder="e.g. Sunrise Hospitality & PG"
                className="block w-full rounded-2xl bg-transparent py-3 pl-10 pr-4 text-sm font-semibold text-zinc-900 placeholder:text-zinc-400 focus:outline-none"
              />
            </div>
          </div>
        )}

        {/* Operating City */}
        <div>
          <label
            htmlFor="city"
            className="block text-xs font-bold uppercase tracking-wider text-zinc-600 mb-1.5"
          >
            {isAdmin ? "Operational Base / City" : isOwner ? "Primary Property City" : "Current City"}
          </label>
          <div className="relative rounded-2xl border border-zinc-200 bg-zinc-50/80 focus-within:border-[#00412E] focus-within:bg-white focus-within:ring-2 focus-within:ring-[#00412E]/10 transition-all">
            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5">
              <MapPin className="h-4 w-4 text-zinc-400" />
            </div>
            <input
              id="city"
              name="city"
              type="text"
              defaultValue={profile?.city || ""}
              placeholder="e.g. Bengaluru, Gurugram, Pune, Delhi"
              className="block w-full rounded-2xl bg-transparent py-3 pl-10 pr-4 text-sm font-semibold text-zinc-900 placeholder:text-zinc-400 focus:outline-none"
            />
          </div>
        </div>

        {/* Seeker Fields: Gender & Age */}
        {isSeeker && (
          <>
            <div>
              <label
                htmlFor="gender"
                className="block text-xs font-bold uppercase tracking-wider text-zinc-600 mb-1.5"
              >
                Gender Identity
              </label>
              <select
                id="gender"
                name="gender"
                defaultValue={profile?.gender || ""}
                className="block w-full rounded-2xl border border-zinc-200 bg-zinc-50/80 py-3 px-4 text-sm font-semibold text-zinc-900 focus:outline-none focus:border-[#00412E] focus:bg-white focus:ring-2 focus:ring-[#00412E]/10 transition-all cursor-pointer"
              >
                <option value="">Select Gender</option>
                <option value="BOYS">Male</option>
                <option value="GIRLS">Female</option>
                <option value="UNISEX">Other / Prefer not to say</option>
              </select>
            </div>

            <div>
              <label
                htmlFor="age"
                className="block text-xs font-bold uppercase tracking-wider text-zinc-600 mb-1.5"
              >
                Age (Years)
              </label>
              <input
                id="age"
                name="age"
                type="number"
                min={16}
                max={99}
                defaultValue={profile?.age || ""}
                placeholder="e.g. 24"
                className="block w-full rounded-2xl border border-zinc-200 bg-zinc-50/80 py-3 px-4 text-sm font-semibold text-zinc-900 focus:outline-none focus:border-[#00412E] focus:bg-white focus:ring-2 focus:ring-[#00412E]/10 transition-all"
              />
            </div>
          </>
        )}

        {/* Profession / Role */}
        <div>
          <label
            htmlFor="profession"
            className="block text-xs font-bold uppercase tracking-wider text-zinc-600 mb-1.5"
          >
            {isAdmin ? "Admin Title / Role" : isOwner ? "Host Role / Profession" : "Profession / Occupation"}
          </label>
          <div className="relative rounded-2xl border border-zinc-200 bg-zinc-50/80 focus-within:border-[#00412E] focus-within:bg-white focus-within:ring-2 focus-within:ring-[#00412E]/10 transition-all">
            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5">
              <Briefcase className="h-4 w-4 text-zinc-400" />
            </div>
            <input
              id="profession"
              name="profession"
              type="text"
              defaultValue={profile?.profession || ""}
              placeholder={
                isAdmin
                  ? "e.g. Platform Administrator, Operations Lead"
                  : isOwner
                  ? "e.g. Property Owner, PG Manager, Host"
                  : "e.g. Software Engineer, Designer, Student"
              }
              className="block w-full rounded-2xl bg-transparent py-3 pl-10 pr-4 text-sm font-semibold text-zinc-900 placeholder:text-zinc-400 focus:outline-none"
            />
          </div>
        </div>

        {/* Company / Institution */}
        <div>
          <label
            htmlFor="companyOrCollege"
            className="block text-xs font-bold uppercase tracking-wider text-zinc-600 mb-1.5"
          >
            {isAdmin ? "Entity / Department" : isOwner ? "Hospitality Entity / Company" : "Company or University"}
          </label>
          <div className="relative rounded-2xl border border-zinc-200 bg-zinc-50/80 focus-within:border-[#00412E] focus-within:bg-white focus-within:ring-2 focus-within:ring-[#00412E]/10 transition-all">
            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5">
              <GraduationCap className="h-4 w-4 text-zinc-400" />
            </div>
            <input
              id="companyOrCollege"
              name="companyOrCollege"
              type="text"
              defaultValue={profile?.companyOrCollege || ""}
              placeholder={
                isAdmin
                  ? "e.g. StayKro Core Infrastructure"
                  : isOwner
                  ? "e.g. Sunrise Hospitality LLP"
                  : "e.g. Swiggy, Google, IIT Delhi, DU"
              }
              className="block w-full rounded-2xl bg-transparent py-3 pl-10 pr-4 text-sm font-semibold text-zinc-900 placeholder:text-zinc-400 focus:outline-none"
            />
          </div>
        </div>
      </div>

      {/* Bio / Description */}
      <div>
        <label
          htmlFor="bio"
          className="block text-xs font-bold uppercase tracking-wider text-zinc-600 mb-1.5"
        >
          {isAdmin
            ? "Administrative Notes / Bio"
            : isOwner
            ? "About Your Accommodations & Hospitality"
            : "About You & Roommate Preferences"}
        </label>
        <textarea
          id="bio"
          name="bio"
          rows={3}
          defaultValue={profile?.bio || ""}
          placeholder={
            isAdmin
              ? "Internal operational notes, department scope, or administrator credentials summary..."
              : isOwner
              ? "Tell prospective tenants about your accommodations, amenities, food standards, cleanliness, and rules..."
              : "Describe your daily routine, lifestyle, cleanliness habits, hobbies, and what you look for in a flatmate or PG..."
          }
          className="block w-full rounded-2xl border border-zinc-200 bg-zinc-50/80 p-4 text-sm font-medium text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:border-[#00412E] focus:bg-white focus:ring-2 focus:ring-[#00412E]/10 transition-all"
        />
      </div>

      {/* Submit Button */}
      <div className="pt-2 flex items-center justify-between border-t border-zinc-100">
        <span className="text-xs text-zinc-400">
          Last updated: {profile ? new Date().toLocaleDateString("en-IN", { month: "short", day: "numeric", year: "numeric" }) : "Never"}
        </span>
        <button
          type="submit"
          disabled={isPending}
          className="inline-flex items-center gap-2 rounded-2xl bg-[#00412E] hover:bg-[#002f21] px-6 py-3 text-sm font-bold text-white shadow-md shadow-[#00412E]/20 active:scale-95 transition-all disabled:opacity-70 cursor-pointer"
        >
          <Save className="h-4 w-4" />
          <span>{isPending ? "Saving Changes..." : "Save Profile"}</span>
        </button>
      </div>
    </form>
  );
}
