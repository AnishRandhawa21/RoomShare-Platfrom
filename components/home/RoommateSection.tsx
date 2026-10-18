"use client";

import { useState } from "react";
import { RoommateRequest } from "@/types";
import { RoommateCard } from "./RoommateCard";
import { Users, Plus, ShieldCheck, HeartHandshake, UserPlus } from "lucide-react";

interface RoommateSectionProps {
  requests: RoommateRequest[];
  selectedCity: string;
  onViewRequest: (request: RoommateRequest) => void;
  onPostRequest: () => void;
}

export function RoommateSection({
  requests,
  selectedCity,
  onViewRequest,
  onPostRequest,
}: RoommateSectionProps) {
  const [filter, setFilter] = useState<"all" | "male" | "female" | "under10k">("all");

  const filteredRequests = requests.filter((req) => {
    if (filter === "male") return req.seekerGender === "Male";
    if (filter === "female") return req.seekerGender === "Female";
    if (filter === "under10k") return req.rentPerPerson <= 10000;
    return true;
  });

  return (
    <section id="roommate-section" className="py-14 sm:py-20 bg-zinc-50/70 border-y border-zinc-200/80">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 rounded-full bg-violet-100/80 px-3 py-1 text-xs font-bold text-violet-800">
              <Users className="h-3.5 w-3.5" />
              <span>Roommate Community</span>
            </div>
            <h2 className="mt-2 text-2xl sm:text-3xl font-extrabold tracking-tight text-zinc-950">
              Find a Roommate in {selectedCity}
            </h2>
            <p className="mt-1 text-sm text-zinc-500">
              Connect with working professionals & students looking to share flats and split expenses.
            </p>
          </div>

          {/* Action & Filter buttons */}
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={onPostRequest}
              className="inline-flex items-center gap-1.5 rounded-full bg-violet-600 px-4 py-2 text-xs font-bold text-white shadow-md shadow-violet-200 hover:bg-violet-700 transition-all cursor-pointer"
            >
              <UserPlus className="h-3.5 w-3.5" />
              <span>Post Roommate Need</span>
            </button>
          </div>
        </div>

        {/* Filter Chips */}
        <div className="mt-6 flex flex-wrap items-center gap-2">
          {[
            { id: "all", label: "All Roommate Posts" },
            { id: "female", label: "Female Flatmates" },
            { id: "male", label: "Male Flatmates" },
            { id: "under10k", label: "Under ₹10,000 / month" },
          ].map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setFilter(tab.id as any)}
              className={`rounded-full px-3.5 py-1.5 text-xs font-semibold transition-all cursor-pointer ${
                filter === tab.id
                  ? "bg-zinc-900 text-white shadow-sm"
                  : "bg-white border border-zinc-200 text-zinc-600 hover:bg-zinc-100"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Roommate Requests Grid */}
        <div className="mt-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-6">
          {filteredRequests.map((request) => (
            <RoommateCard
              key={request.id}
              request={request}
              onViewRequest={onViewRequest}
            />
          ))}
        </div>

        {/* Trust Banner Callout */}
        <div className="mt-10 rounded-3xl bg-gradient-to-r from-violet-900 via-indigo-900 to-zinc-900 p-6 sm:p-8 text-white flex flex-col md:flex-row items-center justify-between gap-6 shadow-xl">
          <div className="space-y-1 text-center md:text-left">
            <div className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1 text-xs font-medium text-violet-200">
              <ShieldCheck className="h-3.5 w-3.5 text-emerald-400" />
              <span>ID & Background Verification</span>
            </div>
            <h3 className="text-xl sm:text-2xl font-bold">
              Looking for someone to share your flat or PG room?
            </h3>
            <p className="text-xs sm:text-sm text-zinc-300 max-w-xl">
              Post your requirement in under 2 minutes. Receive direct inquiries from verified roommates without broker spam.
            </p>
          </div>

          <button
            onClick={onPostRequest}
            className="shrink-0 rounded-2xl bg-white px-6 py-3.5 text-xs font-bold text-zinc-900 hover:bg-zinc-100 active:scale-95 transition-all shadow-lg cursor-pointer"
          >
            Create Free Roommate Post
          </button>
        </div>
      </div>
    </section>
  );
}
