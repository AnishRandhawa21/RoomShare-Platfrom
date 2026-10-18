"use client";

import Link from "next/link";
import {
  Bath,
  Wind,
  Sun,
  Users,
  UserPlus,
} from "lucide-react";

export interface RoomTypeData {
  id: string;
  name: string;
  occupancy: number;
  monthlyRent: number;
  securityDeposit: number;
  maintenanceCharges: number;
  foodCharges: number;
  description: string | null;
  hasAttachedBathroom: boolean;
  hasBalcony: boolean;
  hasAirConditioning: boolean;
  rooms: {
    id: string;
    occupiedBeds: number;
    status: string;
  }[];
}

interface RoomTypesSectionProps {
  roomTypes: RoomTypeData[];
  onSelectRoomType: (roomTypeId: string) => void;
  propertyId?: string;
  propertyName?: string;
  propertySlug?: string;
}

export function RoomTypesSection({
  roomTypes,
  onSelectRoomType,
  propertyId,
}: RoomTypesSectionProps) {
  if (roomTypes.length === 0) {
    return (
      <div className="rounded-3xl border border-zinc-200 bg-white p-8 text-center">
        <p className="text-sm font-semibold text-zinc-500">No room types listed yet.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-zinc-950">
            Available Room Types & Pricing
          </h2>
          <p className="text-xs sm:text-sm text-zinc-500 mt-0.5">
            Prices are per person per month with transparent security deposit terms.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
        {roomTypes.map((rt) => {
          // Calculate live bed occupancy stats
          const activeRooms = rt.rooms.filter((r) => r.status === "AVAILABLE");
          const totalBeds = activeRooms.length * rt.occupancy;
          const occupiedBeds = activeRooms.reduce((sum, r) => sum + r.occupiedBeds, 0);
          const vacantBeds = Math.max(0, totalBeds - occupiedBeds);

          return (
            <div
              key={rt.id}
              className="rounded-3xl border border-zinc-200 bg-white p-5 sm:p-6 shadow-xs hover:border-zinc-300 transition-all flex flex-col justify-between"
            >
              <div>
                {/* Header: Title & Occupancy Badge */}
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div>
                    <h3 className="text-base sm:text-lg font-bold text-zinc-950">
                      {rt.name}
                    </h3>
                    <div className="flex items-center gap-1.5 text-xs text-zinc-500 mt-0.5">
                      <Users className="h-3.5 w-3.5 text-indigo-600" />
                      <span>
                        {rt.occupancy === 1
                          ? "Private Single Room"
                          : `${rt.occupancy}-Seater Sharing`}
                      </span>
                    </div>
                    {/* Live Bed Occupancy stats */}
                    <div className="flex items-center gap-1.5 text-[11px] text-zinc-500 mt-1">
                      <span>{totalBeds} bed{totalBeds !== 1 ? "s" : ""}</span>
                      <span className="text-zinc-300">•</span>
                      <span>{occupiedBeds} occupied</span>
                      <span className="text-zinc-300">•</span>
                      <span className={vacantBeds > 0 ? "text-emerald-600 font-semibold" : "text-zinc-500"}>
                        {vacantBeds} available
                      </span>
                    </div>
                  </div>

                  {/* Vacancy indicator */}
                  <span
                    className={`rounded-full px-3 py-1 text-xs font-bold ${
                      vacantBeds > 0
                        ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                        : "bg-zinc-100 text-zinc-500 border border-zinc-200"
                    }`}
                  >
                    {vacantBeds > 0 ? `${vacantBeds} Available` : "Fully Occupied"}
                  </span>
                </div>

                {/* Features Badges */}
                <div className="flex flex-wrap gap-2 my-4">
                  <span
                    className={`inline-flex items-center gap-1 rounded-xl px-2.5 py-1 text-xs font-semibold ${
                      rt.hasAttachedBathroom
                        ? "bg-indigo-50 text-indigo-700"
                        : "bg-zinc-100 text-zinc-600"
                    }`}
                  >
                    <Bath className="h-3.5 w-3.5" />
                    <span>{rt.hasAttachedBathroom ? "Attached Washroom" : "Common Washroom"}</span>
                  </span>

                  <span
                    className={`inline-flex items-center gap-1 rounded-xl px-2.5 py-1 text-xs font-semibold ${
                      rt.hasAirConditioning
                        ? "bg-sky-50 text-sky-700"
                        : "bg-zinc-100 text-zinc-600"
                    }`}
                  >
                    <Wind className="h-3.5 w-3.5" />
                    <span>{rt.hasAirConditioning ? "AC Room" : "Non-AC Room"}</span>
                  </span>

                  {rt.hasBalcony && (
                    <span className="inline-flex items-center gap-1 rounded-xl bg-amber-50 text-amber-700 px-2.5 py-1 text-xs font-semibold">
                      <Sun className="h-3.5 w-3.5" />
                      <span>Balcony View</span>
                    </span>
                  )}
                </div>

                {/* Description if any */}
                {rt.description && (
                  <p className="text-xs text-zinc-500 leading-relaxed mb-4">
                    {rt.description}
                  </p>
                )}

                {/* Financial Breakdown Table */}
                <div className="rounded-2xl bg-zinc-50 p-3.5 border border-zinc-100 space-y-1.5 text-xs text-zinc-600">
                  {rt.occupancy > 1 ? (
                    <>
                      <div className="flex justify-between items-baseline">
                        <span>Total Room Rent:</span>
                        <span className="text-zinc-700 font-semibold">
                          ₹{rt.monthlyRent.toLocaleString("en-IN")}/mo
                        </span>
                      </div>
                      <div className="flex justify-between items-baseline">
                        <span className="text-violet-700 font-bold">
                          Split Rent ({rt.occupancy} persons):
                        </span>
                        <strong className="text-violet-700 font-black text-sm">
                          ₹{Math.round(rt.monthlyRent / rt.occupancy).toLocaleString("en-IN")} / person
                        </strong>
                      </div>
                      <div className="flex justify-between items-baseline pt-1 border-t border-zinc-200/60">
                        <span>Security Deposit (Per Person):</span>
                        <span className="font-semibold text-zinc-800">
                          ₹{Math.round(rt.securityDeposit / rt.occupancy).toLocaleString("en-IN")}
                          <span className="text-zinc-400 font-normal"> (₹{rt.securityDeposit.toLocaleString("en-IN")} total)</span>
                        </span>
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="flex justify-between">
                        <span>Monthly Rent:</span>
                        <strong className="text-zinc-900 font-bold">
                          ₹{rt.monthlyRent.toLocaleString("en-IN")}/mo
                        </strong>
                      </div>
                      <div className="flex justify-between">
                        <span>Security Deposit (Refundable):</span>
                        <span className="font-semibold text-zinc-800">
                          ₹{rt.securityDeposit.toLocaleString("en-IN")}
                        </span>
                      </div>
                    </>
                  )}
                  {rt.maintenanceCharges > 0 && (
                    <div className="flex justify-between">
                      <span>Maintenance:</span>
                      <span>₹{rt.maintenanceCharges.toLocaleString("en-IN")}/mo</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Action Buttons: Find a Roommate & Book/Enquire */}
              <div className="mt-6 pt-4 border-t border-zinc-100 flex flex-wrap items-center justify-between gap-3">
                <div>
                  <span className="text-[10px] uppercase font-bold text-zinc-400 block">
                    {rt.occupancy > 1 ? "Rent / Person (Split)" : "Monthly Rent"}
                  </span>
                  <div className="text-xl font-extrabold text-zinc-950">
                    ₹{Math.round(rt.monthlyRent / Math.max(1, rt.occupancy)).toLocaleString("en-IN")}
                    <span className="text-xs font-normal text-zinc-500">/mo</span>
                  </div>
                  {rt.occupancy > 1 && (
                    <span className="text-[10px] text-zinc-500 block">
                      Total ₹{rt.monthlyRent.toLocaleString("en-IN")}/mo split {rt.occupancy} ways
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  {propertyId && rt.occupancy > 1 && (
                    <Link
                      href={`/roommates/new?propertyId=${encodeURIComponent(propertyId)}&roomTypeId=${encodeURIComponent(rt.id)}`}
                      className="inline-flex items-center gap-1.5 rounded-xl border border-violet-600 bg-violet-50 px-3.5 py-2.5 text-xs font-bold text-violet-700 hover:bg-violet-100 active:scale-95 transition-all shadow-xs"
                      title={`Find a roommate for ${rt.name}`}
                    >
                      <UserPlus className="h-3.5 w-3.5 text-violet-600" />
                      <span>Find a Roommate</span>
                    </Link>
                  )}
                  <button
                    type="button"
                    onClick={() => onSelectRoomType(rt.id)}
                    className="rounded-xl bg-indigo-600 px-4 py-2.5 text-xs font-bold text-white hover:bg-indigo-700 active:scale-95 transition-all shadow-xs cursor-pointer"
                  >
                    Book / Enquire
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
