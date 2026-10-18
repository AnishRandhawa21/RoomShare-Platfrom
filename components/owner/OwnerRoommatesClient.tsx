"use client";

import { useState } from "react";
import Link from "next/link";
import { PropertySubNav } from "./PropertySubNav";
import { updateOwnerRoommateRequestStatusAction } from "@/actions/owner";
import {
  Users,
  Building2,
  Calendar,
  Layers,
  ExternalLink,
  CheckCircle2,
  AlertCircle,
  Loader2,
} from "lucide-react";

interface RoommateRequestItem {
  id: string;
  propertyId: string;
  roomTypeId: string;
  headline: string;
  description: string;
  monthlyRent: number;
  securityDeposit: number;
  targetMoveInDate: string;
  roomSharingType: string;
  flatmatesNeeded: number;
  status: "ACTIVE" | "PAUSED" | "FULFILLED" | "EXPIRED";
  createdAt: string;
  property: {
    id: string;
    name: string;
    slug: string;
    locality: string;
    city: string;
  };
  roomType: {
    id: string;
    name: string;
    occupancy: number;
    rooms?: Array<{
      id: string;
      occupiedBeds: number;
      status: string;
    }>;
  };
  creator: {
    id: string;
    email: string;
    profile?: {
      fullName?: string | null;
      avatarUrl?: string | null;
      occupation?: string | null;
      age?: number | null;
    } | null;
  };
  preferences?: {
    dietaryPreference?: string | null;
    smokingAllowed?: boolean | null;
    drinkingAllowed?: boolean | null;
  } | null;
}

interface OwnerRoommatesClientProps {
  initialRequests: RoommateRequestItem[];
  total: number;
  page: number;
  totalPages: number;
  propertiesList?: Array<{ id: string; name: string }>;
  propertyContext?: {
    id: string;
    name: string;
    slug: string;
    status: string;
  };
}

export function OwnerRoommatesClient({
  initialRequests,
  total,
  page,
  totalPages,
  propertiesList = [],
  propertyContext,
}: OwnerRoommatesClientProps) {
  const [requests, setRequests] = useState<RoommateRequestItem[]>(initialRequests);
  const [selectedPropertyId, setSelectedPropertyId] = useState<string>(
    propertyContext?.id || "ALL"
  );
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleStatusToggle = async (requestId: string, newStatus: any) => {
    setUpdatingId(requestId);
    setErrorMessage(null);

    try {
      const res = await updateOwnerRoommateRequestStatusAction({
        requestId,
        status: newStatus,
      });

      if (res.success) {
        setRequests((prev) =>
          prev.map((r) => (r.id === requestId ? { ...r, status: newStatus } : r))
        );
      } else {
        setErrorMessage(res.error || "Failed to update request status.");
      }
    } catch {
      setErrorMessage("Network error updating roommate request.");
    } finally {
      setUpdatingId(null);
    }
  };

  const filteredRequests = requests.filter((r) => {
    if (statusFilter !== "ALL" && r.status !== statusFilter) return false;
    if (selectedPropertyId !== "ALL" && r.propertyId !== selectedPropertyId) return false;
    return true;
  });

  return (
    <div className="space-y-6">
      {propertyContext && (
        <PropertySubNav
          propertyId={propertyContext.id}
          propertySlug={propertyContext.slug}
          propertyName={propertyContext.name}
          status={propertyContext.status}
        />
      )}

      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-2xl border border-slate-200/80 bg-white p-5 shadow-2xs">
        <div>
          <h2 className="text-base font-bold text-slate-900">
            {propertyContext
              ? `${propertyContext.name} — Roommate Requests`
              : "Roommate Requests in Your PGs"}
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Tenants seeking roommates for specific room types in your properties. ({total} total)
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {!propertyContext && propertiesList.length > 0 && (
            <select
              value={selectedPropertyId}
              onChange={(e) => setSelectedPropertyId(e.target.value)}
              className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 focus:border-indigo-600 focus:outline-hidden"
            >
              <option value="ALL">All Properties</option>
              {propertiesList.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          )}

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 focus:border-indigo-600 focus:outline-hidden"
          >
            <option value="ALL">All Statuses</option>
            <option value="ACTIVE">Active Posts</option>
            <option value="FULFILLED">Fulfilled</option>
            <option value="PAUSED">Paused</option>
          </select>
        </div>
      </div>

      {errorMessage && (
        <div className="flex items-center gap-2 rounded-xl bg-rose-50 border border-rose-200 p-3.5 text-xs text-rose-700">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Requests List */}
      <div className="space-y-4">
        {filteredRequests.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-12 text-center">
            <Users className="h-10 w-10 text-slate-300 mx-auto mb-3" />
            <h3 className="text-sm font-bold text-slate-900">No Roommate Requests</h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1">
              When tenants browse your PG room types and create a &quot;Find Roommate&quot; post, their active
              collaborations will appear here.
            </p>
          </div>
        ) : (
          filteredRequests.map((req) => {
            // Calculate real-time bed availability for the associated room type
            const totalRtRooms = req.roomType?.rooms?.length || 0;
            const totalRtBeds = totalRtRooms * (req.roomType?.occupancy || 1);
            const occupiedRtBeds =
              req.roomType?.rooms?.reduce((acc, r) => acc + (r.occupiedBeds || 0), 0) || 0;
            const availableRtBeds = Math.max(0, totalRtBeds - occupiedRtBeds);

            return (
              <div
                key={req.id}
                className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-2xs transition-all hover:border-slate-300"
              >
                <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4">
                  {/* Left: Request & Seeker Profile */}
                  <div className="space-y-2 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-bold text-slate-900 text-sm">{req.headline}</span>
                      <span
                        className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider border ${
                          req.status === "ACTIVE"
                            ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                            : "bg-slate-100 text-slate-500 border-slate-200"
                        }`}
                      >
                        {req.status}
                      </span>
                    </div>

                    {/* Property and RoomType details */}
                    <div className="flex flex-wrap items-center gap-3 text-xs text-slate-600">
                      {req.property?.name && (
                        <span className="flex items-center gap-1 font-semibold text-slate-900">
                          <Building2 className="h-3.5 w-3.5 text-indigo-600" />
                          <span>{req.property.name}</span>
                          {req.property.locality && (
                            <span className="text-slate-400 font-normal">
                              ({req.property.locality}, {req.property.city})
                            </span>
                          )}
                        </span>
                      )}

                      {(req.roomType?.name || req.roomSharingType) && (
                        <>
                          {req.property?.name && <span>•</span>}
                          <span className="flex items-center gap-1 font-semibold text-indigo-600">
                            <Layers className="h-3.5 w-3.5" />
                            <span>{req.roomType?.name || req.roomSharingType}</span>
                          </span>
                        </>
                      )}

                      {req.roomType && (
                        <>
                          <span>•</span>
                          <span
                            className={`font-semibold ${
                              availableRtBeds > 0 ? "text-emerald-700" : "text-rose-600"
                            }`}
                          >
                            {availableRtBeds} {availableRtBeds === 1 ? "bed" : "beds"} available in PG
                          </span>
                        </>
                      )}
                    </div>

                    {/* Seeker Info */}
                    <div className="flex flex-wrap items-center gap-2 pt-1 text-xs text-slate-500">
                      <span className="font-semibold text-slate-800">
                        {req.creator.profile?.fullName || req.creator.email}
                      </span>
                      {req.creator.profile?.occupation && (
                        <span>({req.creator.profile.occupation})</span>
                      )}
                      <span>is looking for</span>
                      <span className="font-bold text-indigo-600">
                        {req.flatmatesNeeded} {req.flatmatesNeeded === 1 ? "roommate" : "roommates"}
                      </span>
                      <span>• Move-in:</span>
                      <span className="font-semibold text-slate-800">
                        {new Date(req.targetMoveInDate).toLocaleDateString("en-IN", {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                        })}
                      </span>
                    </div>

                    {req.description && (
                      <p className="text-xs text-slate-600 mt-2 line-clamp-2">
                        {req.description}
                      </p>
                    )}
                  </div>

                  {/* Right: Rent & Owner Actions */}
                  <div className="flex flex-col sm:items-end gap-2.5">
                    <div className="text-right">
                      <div className="text-base font-extrabold text-slate-900">
                        ₹{req.monthlyRent.toLocaleString("en-IN")}
                        <span className="text-[11px] font-normal text-slate-400">/mo/person</span>
                      </div>
                      <div className="text-[11px] text-slate-400">
                        Deposit: ₹{req.securityDeposit.toLocaleString("en-IN")}
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <Link
                        href={`/roommates/${req.id}`}
                        target="_blank"
                        className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
                      >
                        <span>View Post</span>
                        <ExternalLink className="h-3 w-3 text-slate-400" />
                      </Link>

                      {req.status === "ACTIVE" ? (
                        <button
                          onClick={() => handleStatusToggle(req.id, "FULFILLED")}
                          disabled={updatingId === req.id}
                          className="inline-flex items-center gap-1 rounded-xl border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-100 disabled:opacity-50"
                        >
                          {updatingId === req.id ? (
                            <Loader2 className="h-3.5 w-3.5 animate-spin" />
                          ) : (
                            <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
                          )}
                          <span>Mark Fulfilled</span>
                        </button>
                      ) : (
                        <button
                          onClick={() => handleStatusToggle(req.id, "ACTIVE")}
                          disabled={updatingId === req.id}
                          className="inline-flex items-center gap-1 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-700 hover:bg-emerald-100 disabled:opacity-50"
                        >
                          {updatingId === req.id ? (
                            <Loader2 className="h-3.5 w-3.5 animate-spin" />
                          ) : (
                            <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
                          )}
                          <span>Re-activate</span>
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
