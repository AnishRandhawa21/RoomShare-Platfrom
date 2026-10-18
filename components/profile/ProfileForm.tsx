"use client";

import { useActionState } from "react";
import { updateProfileAction, type ProfileActionResult } from "@/actions/profile";
import { User, Phone, Briefcase, GraduationCap, MapPin, AlertCircle, CheckCircle2, Save } from "lucide-react";

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
  };
}

export function ProfileForm({ user }: ProfileFormProps) {
  const [state, formAction, isPending] = useActionState<ProfileActionResult | null, FormData>(
    updateProfileAction,
    null
  );

  const profile = user.profile;

  return (
    <form action={formAction} className="space-y-6">
      {state?.error && (
        <div className="rounded-2xl bg-rose-50 p-4 border border-rose-100 text-xs sm:text-sm font-semibold text-rose-800 flex items-center gap-2">
          <AlertCircle className="h-4 w-4 text-rose-600 shrink-0" />
          <span>{state.error}</span>
        </div>
      )}

      {state?.success && (
        <div className="rounded-2xl bg-emerald-50 p-4 border border-emerald-100 text-xs sm:text-sm font-semibold text-emerald-800 flex items-center gap-2">
          <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
          <span>{state.message}</span>
        </div>
      )}

      {/* Basic Personal Details */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label
            htmlFor="fullName"
            className="block text-xs font-bold uppercase tracking-wider text-zinc-600 mb-1.5"
          >
            Full Name <span className="text-rose-500">*</span>
          </label>
          <div className="relative rounded-2xl border border-zinc-200 bg-zinc-50 focus-within:border-indigo-500 focus-within:bg-white transition-all">
            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5">
              <User className="h-4 w-4 text-zinc-400" />
            </div>
            <input
              id="fullName"
              name="fullName"
              type="text"
              required
              defaultValue={profile?.fullName || ""}
              placeholder="e.g. Rahul Sharma"
              className="block w-full rounded-2xl bg-transparent py-3 pl-10 pr-4 text-sm font-semibold text-zinc-900 placeholder:text-zinc-400 focus:outline-none"
            />
          </div>
        </div>

        <div>
          <label
            htmlFor="email"
            className="block text-xs font-bold uppercase tracking-wider text-zinc-600 mb-1.5"
          >
            Account Email <span className="text-zinc-400 font-normal">(Read-only)</span>
          </label>
          <input
            id="email"
            type="email"
            disabled
            value={user.email || ""}
            className="block w-full rounded-2xl border border-zinc-200 bg-zinc-100/70 py-3 px-4 text-sm font-medium text-zinc-500 cursor-not-allowed"
          />
        </div>

        <div>
          <label
            htmlFor="phone"
            className="block text-xs font-bold uppercase tracking-wider text-zinc-600 mb-1.5"
          >
            Phone Number
          </label>
          <div className="relative rounded-2xl border border-zinc-200 bg-zinc-50 focus-within:border-indigo-500 focus-within:bg-white transition-all">
            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5">
              <Phone className="h-4 w-4 text-zinc-400" />
            </div>
            <input
              id="phone"
              name="phone"
              type="tel"
              defaultValue={user.phone || ""}
              placeholder="+91 98765 43210"
              className="block w-full rounded-2xl bg-transparent py-3 pl-10 pr-4 text-sm font-semibold text-zinc-900 placeholder:text-zinc-400 focus:outline-none"
            />
          </div>
        </div>

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
            className="block w-full rounded-2xl border border-zinc-200 bg-zinc-50 py-3 px-4 text-sm font-semibold text-zinc-900 focus:outline-none focus:border-indigo-500 focus:bg-white transition-all cursor-pointer"
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
            className="block w-full rounded-2xl border border-zinc-200 bg-zinc-50 py-3 px-4 text-sm font-semibold text-zinc-900 focus:outline-none focus:border-indigo-500 focus:bg-white transition-all"
          />
        </div>

        <div>
          <label
            htmlFor="city"
            className="block text-xs font-bold uppercase tracking-wider text-zinc-600 mb-1.5"
          >
            Current City
          </label>
          <div className="relative rounded-2xl border border-zinc-200 bg-zinc-50 focus-within:border-indigo-500 focus-within:bg-white transition-all">
            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5">
              <MapPin className="h-4 w-4 text-zinc-400" />
            </div>
            <input
              id="city"
              name="city"
              type="text"
              defaultValue={profile?.city || ""}
              placeholder="e.g. Bengaluru, Pune, Gurugram"
              className="block w-full rounded-2xl bg-transparent py-3 pl-10 pr-4 text-sm font-semibold text-zinc-900 placeholder:text-zinc-400 focus:outline-none"
            />
          </div>
        </div>

        <div>
          <label
            htmlFor="profession"
            className="block text-xs font-bold uppercase tracking-wider text-zinc-600 mb-1.5"
          >
            Profession / Occupation
          </label>
          <div className="relative rounded-2xl border border-zinc-200 bg-zinc-50 focus-within:border-indigo-500 focus-within:bg-white transition-all">
            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5">
              <Briefcase className="h-4 w-4 text-zinc-400" />
            </div>
            <input
              id="profession"
              name="profession"
              type="text"
              defaultValue={profile?.profession || ""}
              placeholder="e.g. Software Engineer, Designer, Student"
              className="block w-full rounded-2xl bg-transparent py-3 pl-10 pr-4 text-sm font-semibold text-zinc-900 placeholder:text-zinc-400 focus:outline-none"
            />
          </div>
        </div>

        <div>
          <label
            htmlFor="companyOrCollege"
            className="block text-xs font-bold uppercase tracking-wider text-zinc-600 mb-1.5"
          >
            Company or University
          </label>
          <div className="relative rounded-2xl border border-zinc-200 bg-zinc-50 focus-within:border-indigo-500 focus-within:bg-white transition-all">
            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5">
              <GraduationCap className="h-4 w-4 text-zinc-400" />
            </div>
            <input
              id="companyOrCollege"
              name="companyOrCollege"
              type="text"
              defaultValue={profile?.companyOrCollege || ""}
              placeholder="e.g. Swiggy, Amazon, IIT Delhi"
              className="block w-full rounded-2xl bg-transparent py-3 pl-10 pr-4 text-sm font-semibold text-zinc-900 placeholder:text-zinc-400 focus:outline-none"
            />
          </div>
        </div>
      </div>

      {/* Bio / About */}
      <div>
        <label
          htmlFor="bio"
          className="block text-xs font-bold uppercase tracking-wider text-zinc-600 mb-1.5"
        >
          About You & Roommate Preferences
        </label>
        <textarea
          id="bio"
          name="bio"
          rows={3}
          defaultValue={profile?.bio || ""}
          placeholder="Briefly describe yourself, your routine, hobbies, and what you look for in a flatmate or PG..."
          className="block w-full rounded-2xl border border-zinc-200 bg-zinc-50 p-4 text-sm font-medium text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:border-indigo-500 focus:bg-white transition-all"
        />
      </div>

      <div className="pt-2 flex justify-end">
        <button
          type="submit"
          disabled={isPending}
          className="inline-flex items-center gap-2 rounded-2xl bg-indigo-600 px-6 py-3 text-sm font-bold text-white shadow-lg shadow-indigo-100 hover:bg-indigo-700 active:scale-95 transition-all disabled:opacity-70 cursor-pointer"
        >
          <Save className="h-4 w-4" />
          <span>{isPending ? "Saving Changes..." : "Save Profile"}</span>
        </button>
      </div>
    </form>
  );
}
