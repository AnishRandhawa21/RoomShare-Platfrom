"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { PropertySubNav } from "./PropertySubNav";
import { togglePropertyStatusAction, deleteOwnerPropertyAction } from "@/actions/owner";
import {
  CheckCircle2,
  XCircle,
  AlertCircle,
  BedDouble,
  Layers,
  Image as ImageIcon,
  Mail,
  Users,
  Trash2,
  Loader2,
  Edit,
  ExternalLink,
  ChevronRight,
} from "lucide-react";

interface PropertyDetailClientProps {
  property: any;
}

export function PropertyDetailClient({ property }: PropertyDetailClientProps) {
  const router = useRouter();
  const [currentStatus, setCurrentStatus] = useState<string>(property.status);
  const [isPublishing, setIsPublishing] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  // Compute checklist
  const hasBasicInfo = Boolean(property.name && property.description && property.genderPolicy);
  const hasLocation = Boolean(property.city && property.locality && property.address);
  const hasRoomTypes = property.roomTypes && property.roomTypes.length > 0;
  
  let totalRooms = 0;
  let totalBeds = 0;
  let occupiedBeds = 0;

  property.roomTypes?.forEach((rt: any) => {
    rt.rooms?.forEach((r: any) => {
      totalRooms += 1;
      totalBeds += rt.occupancy;
      occupiedBeds += r.occupiedBeds;
    });
  });

  const availableBeds = Math.max(0, totalBeds - occupiedBeds);
  const hasInventory = totalRooms > 0;
  const hasPhotos = property.images && property.images.length > 0;
  const hasCoverPhoto = property.images?.some((img: any) => img.isCover);

  const isReadyToPublish = hasBasicInfo && hasLocation && hasRoomTypes && hasInventory && hasPhotos;

  const handleTogglePublish = async () => {
    setIsPublishing(true);
    setActionError(null);
    try {
      const newStatus = currentStatus === "PUBLISHED" ? "INACTIVE" : "PUBLISHED";
      const res = await togglePropertyStatusAction(property.id, newStatus as any);
      if (res.success) {
        setCurrentStatus(newStatus);
        router.refresh();
      } else {
        setActionError(res.error || "Failed to update property status.");
      }
    } catch {
      setActionError("Unexpected network error while updating status.");
    } finally {
      setIsPublishing(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm(`Are you sure you want to deactivate "${property.name}"? It will be removed from public listings.`)) {
      return;
    }
    setIsDeleting(true);
    try {
      const res = await deleteOwnerPropertyAction(property.id);
      if (res.success) {
        router.push("/owner/properties");
      } else {
        setActionError(res.error || "Failed to delete property.");
      }
    } catch {
      setActionError("Network error deleting property.");
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Property Sub Navigation */}
      <PropertySubNav
        propertyId={property.id}
        propertySlug={property.slug}
        propertyName={property.name}
        status={currentStatus}
      />

      {actionError && (
        <div className="flex items-center gap-2 rounded-xl bg-rose-50 border border-rose-200 p-3.5 text-xs text-rose-700">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <span>{actionError}</span>
        </div>
      )}

      {/* Main Grid: Status/Checklist & Quick Stats */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Checklist & Property Summary */}
        <div className="lg:col-span-2 space-y-6">
          {/* Readiness Checklist Card */}
          <div className="rounded-2xl border border-slate-200/80 bg-white p-5 sm:p-6 shadow-2xs">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
              <div>
                <h2 className="text-base font-bold text-slate-900">Publishing Readiness Checklist</h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Complete all required elements to make this property visible to seekers.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <Link
                  href={`/owner/properties/${property.id}/edit`}
                  className="inline-flex items-center gap-1.5 rounded-xl border border-indigo-200 bg-indigo-50/70 hover:bg-indigo-100 text-indigo-700 px-3.5 py-2.5 text-xs font-bold transition-all shadow-2xs"
                >
                  <Edit className="h-3.5 w-3.5" />
                  <span>Edit Info & Price</span>
                </Link>

                <button
                  onClick={handleTogglePublish}
                  disabled={isPublishing || (!isReadyToPublish && currentStatus !== "PUBLISHED")}
                  className={`inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-xs font-bold transition-all ${
                    currentStatus === "PUBLISHED"
                      ? "bg-amber-500 hover:bg-amber-600 text-white shadow-xs"
                      : isReadyToPublish
                      ? "bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs"
                      : "bg-slate-100 text-slate-400 cursor-not-allowed border border-slate-200"
                  }`}
                >
                  {isPublishing ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : currentStatus === "PUBLISHED" ? (
                    <XCircle className="h-3.5 w-3.5" />
                  ) : (
                    <CheckCircle2 className="h-3.5 w-3.5" />
                  )}
                  <span>
                    {currentStatus === "PUBLISHED" ? "Unpublish (Set Inactive)" : "Publish Property"}
                  </span>
                </button>
              </div>
            </div>

            <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* Checklist Items */}
              <div
                className={`flex items-start gap-3 rounded-xl border p-3.5 ${
                  hasBasicInfo
                    ? "border-emerald-200 bg-emerald-50/50 text-emerald-900"
                    : "border-slate-200 bg-slate-50 text-slate-600"
                }`}
              >
                {hasBasicInfo ? (
                  <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
                ) : (
                  <AlertCircle className="h-4 w-4 text-amber-500 shrink-0 mt-0.5" />
                )}
                <div className="text-xs">
                  <div className="font-semibold text-slate-900">Basic Information</div>
                  <div className="text-slate-500 mt-0.5">Name, type, description & policy set</div>
                </div>
              </div>

              <div
                className={`flex items-start gap-3 rounded-xl border p-3.5 ${
                  hasLocation
                    ? "border-emerald-200 bg-emerald-50/50 text-emerald-900"
                    : "border-slate-200 bg-slate-50 text-slate-600"
                }`}
              >
                {hasLocation ? (
                  <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
                ) : (
                  <AlertCircle className="h-4 w-4 text-amber-500 shrink-0 mt-0.5" />
                )}
                <div className="text-xs">
                  <div className="font-semibold text-slate-900">Location Details</div>
                  <div className="text-slate-500 mt-0.5">
                    {property.locality}, {property.city}
                  </div>
                </div>
              </div>

              <div
                className={`flex items-start gap-3 rounded-xl border p-3.5 ${
                  hasRoomTypes
                    ? "border-emerald-200 bg-emerald-50/50 text-emerald-900"
                    : "border-amber-200 bg-amber-50/50 text-amber-900"
                }`}
              >
                {hasRoomTypes ? (
                  <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
                ) : (
                  <AlertCircle className="h-4 w-4 text-amber-500 shrink-0 mt-0.5" />
                )}
                <div className="text-xs">
                  <div className="font-semibold text-slate-900">
                    Room Types ({property.roomTypes?.length || 0})
                  </div>
                  <div className="text-slate-500 mt-0.5">
                    {hasRoomTypes ? "Configured with rent & deposit" : "Add at least 1 room type"}
                  </div>
                </div>
              </div>

              <div
                className={`flex items-start gap-3 rounded-xl border p-3.5 ${
                  hasInventory
                    ? "border-emerald-200 bg-emerald-50/50 text-emerald-900"
                    : "border-amber-200 bg-amber-50/50 text-amber-900"
                }`}
              >
                {hasInventory ? (
                  <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
                ) : (
                  <AlertCircle className="h-4 w-4 text-amber-500 shrink-0 mt-0.5" />
                )}
                <div className="text-xs">
                  <div className="font-semibold text-slate-900">
                    Room Inventory ({totalRooms} rooms)
                  </div>
                  <div className="text-slate-500 mt-0.5">
                    {hasInventory ? `${totalBeds} total beds tracked` : "Add actual rooms & beds"}
                  </div>
                </div>
              </div>

              <div
                className={`flex items-start gap-3 rounded-xl border p-3.5 sm:col-span-2 ${
                  hasPhotos
                    ? "border-emerald-200 bg-emerald-50/50 text-emerald-900"
                    : "border-amber-200 bg-amber-50/50 text-amber-900"
                }`}
              >
                {hasPhotos ? (
                  <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
                ) : (
                  <AlertCircle className="h-4 w-4 text-amber-500 shrink-0 mt-0.5" />
                )}
                <div className="text-xs">
                  <div className="font-semibold text-slate-900">
                    Property Photos ({property.images?.length || 0})
                  </div>
                  <div className="text-slate-500 mt-0.5">
                    {hasPhotos
                      ? hasCoverPhoto
                        ? "Cover photo and gallery uploaded"
                        : "Uploaded (please set a cover photo)"
                      : "Upload high-res photos to improve booking conversions"}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Room Types Overview */}
          <div className="rounded-2xl border border-slate-200/80 bg-white p-5 sm:p-6 shadow-2xs">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div>
                <h3 className="text-base font-bold text-slate-900">Room Types & Pricing</h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Tiered sharing options with individual rates and bed capacities.
                </p>
              </div>
              <Link
                href={`/owner/properties/${property.id}/room-types`}
                className="text-xs font-bold text-indigo-600 hover:text-indigo-700 flex items-center gap-1"
              >
                <span>Manage Room Types</span>
                <ChevronRight className="h-3.5 w-3.5" />
              </Link>
            </div>

            {property.roomTypes && property.roomTypes.length > 0 ? (
              <div className="mt-4 divide-y divide-slate-100">
                {property.roomTypes.map((rt: any) => {
                  const rtRooms = rt.rooms?.length || 0;
                  const rtBeds = rtRooms * rt.occupancy;
                  const rtOccupied =
                    rt.rooms?.reduce((acc: number, r: any) => acc + (r.occupiedBeds || 0), 0) || 0;
                  const rtAvailable = Math.max(0, rtBeds - rtOccupied);

                  return (
                    <div
                      key={rt.id}
                      className="py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
                    >
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-slate-900 text-sm">{rt.name}</span>
                          <span className="rounded-md bg-slate-100 px-2 py-0.5 text-[10px] font-semibold text-slate-600">
                            {rt.occupancy}-Seater
                          </span>
                          {rt.hasAirConditioning && (
                            <span className="rounded-md bg-sky-50 px-2 py-0.5 text-[10px] font-semibold text-sky-700 border border-sky-200">
                              AC
                            </span>
                          )}
                        </div>
                        <div className="text-slate-500 mt-1 flex items-center gap-3">
                          <span>Deposit: ₹{rt.securityDeposit.toLocaleString("en-IN")}</span>
                          <span>•</span>
                          <span>
                            {rtRooms} rooms ({rtBeds} beds)
                          </span>
                          <span>•</span>
                          <span
                            className={
                              rtAvailable > 0 ? "text-emerald-600 font-semibold" : "text-rose-600"
                            }
                          >
                            {rtAvailable} available
                          </span>
                        </div>
                      </div>

                      <div className="text-right">
                        <div className="text-sm font-extrabold text-slate-900">
                          ₹{rt.monthlyRent.toLocaleString("en-IN")}
                          <span className="text-[10px] font-normal text-slate-400">/bed/mo</span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="py-8 text-center">
                <Layers className="h-8 w-8 text-slate-300 mx-auto mb-2" />
                <p className="text-xs font-semibold text-slate-600">No room types configured yet</p>
                <Link
                  href={`/owner/properties/${property.id}/room-types`}
                  className="mt-3 inline-flex items-center gap-1.5 rounded-xl bg-indigo-600 px-3.5 py-2 text-xs font-bold text-white hover:bg-indigo-700"
                >
                  Create First Room Type
                </Link>
              </div>
            )}
          </div>
        </div>

        {/* Right Col: Stat Snapshot & Property Controls */}
        <div className="space-y-6">
          {/* Quick Metrics */}
          <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-2xs space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Inventory Snapshot
            </h3>

            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-xl border border-slate-100 bg-slate-50/50 p-3">
                <div className="text-[11px] font-semibold text-slate-500">Total Rooms</div>
                <div className="text-xl font-extrabold text-slate-900 mt-0.5">{totalRooms}</div>
              </div>
              <div className="rounded-xl border border-slate-100 bg-slate-50/50 p-3">
                <div className="text-[11px] font-semibold text-slate-500">Total Beds</div>
                <div className="text-xl font-extrabold text-slate-900 mt-0.5">{totalBeds}</div>
              </div>
              <div className="rounded-xl border border-emerald-100 bg-emerald-50/30 p-3">
                <div className="text-[11px] font-semibold text-emerald-700">Available Beds</div>
                <div className="text-xl font-extrabold text-emerald-700 mt-0.5">
                  {availableBeds}
                </div>
              </div>
              <div className="rounded-xl border border-slate-100 bg-slate-50/50 p-3">
                <div className="text-[11px] font-semibold text-slate-500">Occupied Beds</div>
                <div className="text-xl font-extrabold text-slate-900 mt-0.5">{occupiedBeds}</div>
              </div>
            </div>

            <div className="border-t border-slate-100 pt-3 flex items-center justify-between text-xs text-slate-600">
              <span className="flex items-center gap-1.5">
                <Mail className="h-3.5 w-3.5 text-slate-400" />
                <span>Pending Enquiries:</span>
              </span>
              <span className="font-bold text-slate-900">
                {property._count?.enquiries || 0}
              </span>
            </div>
            <div className="flex items-center justify-between text-xs text-slate-600">
              <span className="flex items-center gap-1.5">
                <Users className="h-3.5 w-3.5 text-slate-400" />
                <span>Roommate Posts:</span>
              </span>
              <span className="font-bold text-slate-900">
                {property._count?.roommateRequests || 0}
              </span>
            </div>
          </div>

          {/* Quick Management Links */}
          <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-2xs space-y-2">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">
              Property Actions
            </h3>

            <Link
              href={`/owner/properties/${property.id}/rooms`}
              className="flex items-center justify-between rounded-xl border border-slate-200 p-3 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
            >
              <div className="flex items-center gap-2.5">
                <BedDouble className="h-4 w-4 text-indigo-600" />
                <span>Manage Rooms & Beds</span>
              </div>
              <ChevronRight className="h-3.5 w-3.5 text-slate-400" />
            </Link>

            <Link
              href={`/owner/properties/${property.id}/photos`}
              className="flex items-center justify-between rounded-xl border border-slate-200 p-3 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
            >
              <div className="flex items-center gap-2.5">
                <ImageIcon className="h-4 w-4 text-emerald-600" />
                <span>Upload & Sort Photos</span>
              </div>
              <ChevronRight className="h-3.5 w-3.5 text-slate-400" />
            </Link>

            <Link
              href={`/owner/properties/${property.id}/edit`}
              className="flex items-center justify-between rounded-xl border border-slate-200 p-3 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
            >
              <div className="flex items-center gap-2.5">
                <Edit className="h-4 w-4 text-amber-600" />
                <span>Edit Property Information</span>
              </div>
              <ChevronRight className="h-3.5 w-3.5 text-slate-400" />
            </Link>

            <Link
              href={`/property/${property.slug}`}
              target="_blank"
              className="flex items-center justify-between rounded-xl border border-slate-200 p-3 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
            >
              <div className="flex items-center gap-2.5">
                <ExternalLink className="h-4 w-4 text-sky-600" />
                <span>View Public Listing</span>
              </div>
              <ChevronRight className="h-3.5 w-3.5 text-slate-400" />
            </Link>

            <div className="pt-2 border-t border-slate-100">
              <button
                onClick={handleDelete}
                disabled={isDeleting}
                className="w-full flex items-center justify-center gap-2 rounded-xl border border-rose-200 bg-rose-50/50 px-3 py-2.5 text-xs font-bold text-rose-700 hover:bg-rose-100/60 transition-colors"
              >
                {isDeleting ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <Trash2 className="h-3.5 w-3.5 text-rose-500" />
                )}
                <span>Deactivate Property</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
