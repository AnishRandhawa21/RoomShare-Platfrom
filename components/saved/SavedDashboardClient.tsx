"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Bookmark,
  Building2,
  Users,
  MapPin,
  Trash2,
  ArrowRight,
  ExternalLink,
} from "lucide-react";
import {
  toggleSavePropertyAction,
  toggleSaveRoommateAction,
} from "@/actions/saved";

interface SavedPropertyItem {
  id: string;
  name: string;
  slug: string;
  locality: string;
  city: string;
  genderPolicy: string;
  startingPrice: number;
  foodIncluded: boolean;
  coverImageUrl: string | null;
  savedAt: string;
}

interface SavedRoommateItem {
  id: string;
  title: string;
  locality: string;
  city: string;
  propertyName?: string | null;
  rentPerPerson: number;
  securityDeposit: number;
  preferredGender: string;
  moveInDate: string;
  isFurnished: boolean;
  hasAttachedBathroom: boolean;
  creator: {
    id: string;
    profile: {
      fullName: string;
      avatarUrl: string | null;
      profession: string | null;
      verificationStatus: string;
    } | null;
  };
  savedAt: string;
}

interface SavedDashboardClientProps {
  initialProperties: SavedPropertyItem[];
  initialRoommates: SavedRoommateItem[];
}

export function SavedDashboardClient({
  initialProperties,
  initialRoommates,
}: SavedDashboardClientProps) {
  const [activeTab, setActiveTab] = useState<"pgs" | "roommates">("pgs");
  const [properties, setProperties] = useState<SavedPropertyItem[]>(initialProperties);
  const [roommates, setRoommates] = useState<SavedRoommateItem[]>(initialRoommates);

  const handleRemoveProperty = async (id: string) => {
    setProperties((prev) => prev.filter((p) => p.id !== id));
    await toggleSavePropertyAction(id);
  };

  const handleRemoveRoommate = async (id: string) => {
    setRoommates((prev) => prev.filter((r) => r.id !== id));
    await toggleSaveRoommateAction(id);
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      {/* Top Banner */}
      <div className="border-b border-zinc-200 pb-6">
        <div className="inline-flex items-center gap-2 rounded-full bg-rose-50 px-3 py-1 text-xs font-semibold text-rose-700 mb-2">
          <Bookmark className="h-3.5 w-3.5 fill-rose-600" />
          <span>Saved Bookmarks</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-zinc-950">
          My Saved Spaces & Flatmates
        </h1>
        <p className="mt-1 text-xs sm:text-sm text-zinc-500">
          Quickly review properties and prospective roommate requirements you have bookmarked.
        </p>

        {/* Tab Switcher */}
        <div className="mt-6 flex gap-2">
          <button
            type="button"
            onClick={() => setActiveTab("pgs")}
            className={`flex items-center gap-2 rounded-xl px-4 py-2 text-xs sm:text-sm font-bold transition-all cursor-pointer ${
              activeTab === "pgs"
                ? "bg-zinc-900 text-white shadow-xs"
                : "bg-zinc-100 text-zinc-600 hover:bg-zinc-200 hover:text-zinc-900"
            }`}
          >
            <Building2 className="h-4 w-4" />
            <span>Saved PGs ({properties.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("roommates")}
            className={`flex items-center gap-2 rounded-xl px-4 py-2 text-xs sm:text-sm font-bold transition-all cursor-pointer ${
              activeTab === "roommates"
                ? "bg-violet-600 text-white shadow-xs"
                : "bg-zinc-100 text-zinc-600 hover:bg-zinc-200 hover:text-zinc-900"
            }`}
          >
            <Users className="h-4 w-4" />
            <span>Saved Roommates ({roommates.length})</span>
          </button>
        </div>
      </div>

      {/* Content Area */}
      <div className="mt-8">
        {activeTab === "pgs" && (
          <div>
            {properties.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {properties.map((p) => (
                  <div
                    key={p.id}
                    className="group flex flex-col justify-between rounded-2xl border border-zinc-200 bg-white overflow-hidden shadow-xs hover:border-zinc-300 hover:shadow-md transition-all"
                  >
                    <div>
                      {/* Image Preview */}
                      <div className="relative aspect-16/9 w-full bg-zinc-100 overflow-hidden">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={p.coverImageUrl || "/placeholder-property.jpg"}
                          alt={p.name}
                          className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                        <button
                          type="button"
                          onClick={() => handleRemoveProperty(p.id)}
                          title="Remove bookmark"
                          className="absolute top-2.5 right-2.5 flex h-8 w-8 items-center justify-center rounded-full bg-white/90 backdrop-blur-xs text-zinc-500 hover:text-rose-600 hover:bg-white shadow-xs cursor-pointer transition-colors"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>

                      {/* Info */}
                      <div className="p-4 space-y-2">
                        <span className="rounded-md bg-indigo-50 border border-indigo-100 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-indigo-700">
                          {p.genderPolicy}
                        </span>

                        <h3 className="text-base font-bold text-zinc-950 group-hover:text-indigo-600 transition-colors line-clamp-1">
                          {p.name}
                        </h3>

                        <div className="flex items-center gap-1.5 text-xs text-zinc-500">
                          <MapPin className="h-3.5 w-3.5 text-zinc-400 shrink-0" />
                          <span className="line-clamp-1">
                            {p.locality}, {p.city}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Footer */}
                    <div className="border-t border-zinc-100 p-4 flex items-center justify-between">
                      <div>
                        <span className="text-[10px] text-zinc-400 uppercase font-semibold block">
                          Starts at
                        </span>
                        <span className="text-base font-extrabold text-zinc-950">
                          ₹{p.startingPrice.toLocaleString("en-IN")}
                          <span className="text-xs font-normal text-zinc-500">/mo</span>
                        </span>
                      </div>

                      <Link
                        href={`/property/${p.slug}`}
                        className="inline-flex items-center gap-1.5 rounded-xl bg-zinc-900 px-3.5 py-1.5 text-xs font-bold text-white hover:bg-zinc-800 transition-colors"
                      >
                        <span>View Details</span>
                        <ArrowRight className="h-3.5 w-3.5" />
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="rounded-3xl border border-dashed border-zinc-200 bg-zinc-50/50 p-12 text-center max-w-md mx-auto">
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-100 text-indigo-700 mb-4">
                  <Building2 className="h-6 w-6" />
                </div>
                <h3 className="text-base font-bold text-zinc-950">
                  No saved PGs yet
                </h3>
                <p className="mt-1 text-xs text-zinc-500 leading-relaxed">
                  Browse verified PG accommodations and click the heart icon to save listings here for later comparison.
                </p>
                <div className="mt-5">
                  <Link
                    href="/#discovery-section"
                    className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2 text-xs font-bold text-white hover:bg-indigo-700 transition-colors shadow-xs"
                  >
                    <span>Browse PGs</span>
                    <ArrowRight className="h-3.5 w-3.5" />
                  </Link>
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === "roommates" && (
          <div>
            {roommates.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {roommates.map((r) => (
                  <div
                    key={r.id}
                    className="group flex flex-col justify-between rounded-2xl border border-zinc-200 bg-white p-5 shadow-xs hover:border-violet-300 hover:shadow-md transition-all"
                  >
                    <div>
                      {/* Header */}
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-center gap-2.5">
                          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-violet-100 text-xs font-bold text-violet-700">
                            {r.creator.profile?.fullName?.[0] || "U"}
                          </div>
                          <div>
                            <span className="text-xs font-bold text-zinc-900 block">
                              {r.creator.profile?.fullName || "Flatmate"}
                            </span>
                            <span className="text-[11px] text-zinc-400">
                              Move-in: {new Date(r.moveInDate).toLocaleDateString("en-IN", { month: "short", day: "numeric" })}
                            </span>
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={() => handleRemoveRoommate(r.id)}
                          title="Remove bookmark"
                          className="flex h-7 w-7 items-center justify-center rounded-full bg-zinc-50 text-zinc-400 hover:text-rose-600 hover:bg-rose-50 cursor-pointer transition-colors"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>

                      {/* Title */}
                      <h3 className="mt-3 text-sm font-bold text-zinc-950 group-hover:text-violet-700 transition-colors line-clamp-2">
                        {r.title}
                      </h3>

                      <div className="mt-2 flex items-center gap-1.5 text-xs text-zinc-500">
                        <MapPin className="h-3.5 w-3.5 text-zinc-400 shrink-0" />
                        <span className="line-clamp-1">{r.locality}, {r.city}</span>
                      </div>
                    </div>

                    {/* Footer */}
                    <div className="mt-5 border-t border-zinc-100 pt-3 flex items-center justify-between">
                      <div>
                        <span className="text-[10px] text-zinc-400 uppercase font-semibold block">
                          Rent share
                        </span>
                        <span className="text-base font-extrabold text-zinc-950">
                          ₹{r.rentPerPerson.toLocaleString("en-IN")}
                          <span className="text-xs font-normal text-zinc-500">/mo</span>
                        </span>
                      </div>

                      <Link
                        href={`/roommates/${r.id}`}
                        className="inline-flex items-center gap-1.5 rounded-xl bg-violet-600 px-3.5 py-1.5 text-xs font-bold text-white hover:bg-violet-700 transition-colors shadow-xs"
                      >
                        <span>Connect</span>
                        <ArrowRight className="h-3.5 w-3.5" />
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="rounded-3xl border border-dashed border-zinc-200 bg-zinc-50/50 p-12 text-center max-w-md mx-auto">
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-violet-100 text-violet-700 mb-4">
                  <Users className="h-6 w-6" />
                </div>
                <h3 className="text-base font-bold text-zinc-950">
                  No saved roommates yet
                </h3>
                <p className="mt-1 text-xs text-zinc-500 leading-relaxed">
                  Explore verified roommate requirements and bookmark people whose lifestyle and budget match your preferences.
                </p>
                <div className="mt-5">
                  <Link
                    href="/roommates"
                    className="inline-flex items-center gap-2 rounded-xl bg-violet-600 px-4 py-2 text-xs font-bold text-white hover:bg-violet-700 transition-colors shadow-xs"
                  >
                    <span>Find Roommates</span>
                    <ArrowRight className="h-3.5 w-3.5" />
                  </Link>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
