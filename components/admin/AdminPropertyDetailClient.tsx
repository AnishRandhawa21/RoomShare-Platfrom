"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Building2,
  MapPin,
  ShieldCheck,
  CheckCircle,
  XCircle,
  Users,
  Bath,
  Wind,
  Trash2,
  ExternalLink,
  MessageSquare,
} from "lucide-react";
import { PropertyStatus } from "@/lib/enums";
import {
  updateAdminPropertyStatusAction,
  deleteAdminPropertyAction,
} from "@/actions/admin";
import { AdminConfirmDialog } from "./AdminConfirmDialog";

export function AdminPropertyDetailClient({ property }: { property: any }) {
  const router = useRouter();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogAction, setDialogAction] = useState<"status" | "delete" | null>(null);
  const [targetStatus, setTargetStatus] = useState<PropertyStatus | null>(null);
  const [rejectionReason, setRejectionReason] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);

  const ownerName =
    property.owner?.user?.profile?.fullName || property.owner?.businessName || "PG Host";

  const openStatusConfirm = (newStatus: PropertyStatus) => {
    setTargetStatus(newStatus);
    setDialogAction("status");
    setDialogOpen(true);
  };

  const openDeleteConfirm = () => {
    setDialogAction("delete");
    setDialogOpen(true);
  };

  const executeAction = async () => {
    setIsProcessing(true);
    if (dialogAction === "status" && targetStatus) {
      await updateAdminPropertyStatusAction({
        propertyId: property.id,
        status: targetStatus,
        rejectionReason: targetStatus === PropertyStatus.REJECTED ? rejectionReason : undefined,
      });
    } else if (dialogAction === "delete") {
      await deleteAdminPropertyAction(property.id);
      router.push("/admin/properties");
      return;
    }

    setIsProcessing(false);
    setDialogOpen(false);
    router.refresh();
  };

  return (
    <div className="space-y-6">
      {/* Top Breadcrumb & Status Action Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link
            href="/admin/properties"
            className="flex h-9 w-9 items-center justify-center rounded-xl border border-zinc-200 bg-white text-zinc-600 hover:bg-zinc-50"
          >
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl sm:text-2xl font-black text-zinc-950">
                {property.name}
              </h1>
              <span
                className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase ${
                  property.status === "PUBLISHED"
                    ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                    : property.status === "PENDING_APPROVAL"
                    ? "bg-amber-50 text-amber-700 border border-amber-200"
                    : property.status === "REJECTED"
                    ? "bg-rose-50 text-rose-700 border border-rose-200"
                    : "bg-zinc-100 text-zinc-600"
                }`}
              >
                {property.status}
              </span>
            </div>
            <p className="text-xs text-zinc-500 mt-0.5">
              {property.locality}, {property.city}, {property.state}
            </p>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex flex-wrap items-center gap-2">
          {property.status !== "PUBLISHED" && (
            <button
              type="button"
              onClick={() => openStatusConfirm(PropertyStatus.PUBLISHED)}
              className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-600 px-3.5 py-2 text-xs font-bold text-white hover:bg-emerald-700 transition-all shadow-xs cursor-pointer"
            >
              <CheckCircle className="h-3.5 w-3.5" />
              <span>Approve & Publish</span>
            </button>
          )}

          {property.status !== "REJECTED" && (
            <button
              type="button"
              onClick={() => openStatusConfirm(PropertyStatus.REJECTED)}
              className="inline-flex items-center gap-1.5 rounded-xl bg-amber-600 px-3.5 py-2 text-xs font-bold text-white hover:bg-amber-700 transition-all shadow-xs cursor-pointer"
            >
              <XCircle className="h-3.5 w-3.5" />
              <span>Reject</span>
            </button>
          )}

          <Link
            href={`/property/${property.slug}`}
            target="_blank"
            className="inline-flex items-center gap-1.5 rounded-xl border border-zinc-200 bg-white px-3.5 py-2 text-xs font-bold text-zinc-700 hover:bg-zinc-50 transition-all shadow-2xs"
          >
            <span>Public View</span>
            <ExternalLink className="h-3.5 w-3.5" />
          </Link>

          <button
            type="button"
            onClick={openDeleteConfirm}
            className="inline-flex items-center gap-1.5 rounded-xl border border-rose-200 bg-rose-50 px-3.5 py-2 text-xs font-bold text-rose-700 hover:bg-rose-100 transition-all cursor-pointer"
          >
            <Trash2 className="h-3.5 w-3.5" />
            <span>Deactivate</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        {/* Left Column (2 Cols): Details, Room Types, Photos */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Photos Carousel / Grid */}
          <div className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-2xs space-y-3">
            <h2 className="text-sm font-bold text-zinc-950">Property Photos ({property.images.length})</h2>
            <div className="grid grid-cols-3 sm:grid-cols-4 gap-2.5">
              {property.images.length === 0 ? (
                <div className="col-span-full py-8 text-center text-xs text-zinc-400">
                  No images uploaded yet.
                </div>
              ) : (
                property.images.map((img: any) => (
                  <div
                    key={img.id}
                    className="aspect-video rounded-xl bg-zinc-100 overflow-hidden border border-zinc-200 relative group"
                  >
                    <img src={img.url} alt="Property" className="h-full w-full object-cover" />
                    {img.isCover && (
                      <span className="absolute top-1 left-1 rounded-md bg-zinc-950/80 text-white text-[9px] font-bold px-1.5 py-0.5">
                        Cover
                      </span>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Description & Rules */}
          <div className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-2xs space-y-4">
            <div>
              <h2 className="text-sm font-bold text-zinc-950 mb-1">About Space</h2>
              <p className="text-xs text-zinc-600 leading-relaxed whitespace-pre-line">
                {property.description}
              </p>
            </div>

            {property.houseRules?.length > 0 && (
              <div className="border-t border-zinc-100 pt-3">
                <h3 className="text-xs font-bold text-zinc-900 mb-2">House Rules</h3>
                <div className="flex flex-wrap gap-2">
                  {property.houseRules.map((rule: string) => (
                    <span
                      key={rule}
                      className="rounded-lg bg-zinc-100 px-2.5 py-1 text-[11px] font-medium text-zinc-700"
                    >
                      {rule}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Room Types & Inventory Breakdown */}
          <div className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-2xs space-y-4">
            <h2 className="text-sm font-bold text-zinc-950">
              Room Types & Inventory ({property.roomTypes.length})
            </h2>

            <div className="space-y-3">
              {property.roomTypes.map((rt: any) => (
                <div
                  key={rt.id}
                  className="rounded-xl border border-zinc-200 bg-zinc-50/50 p-4 space-y-3"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="text-sm font-bold text-zinc-900">{rt.name}</h3>
                      <div className="flex items-center gap-2 text-xs text-zinc-500 mt-0.5">
                        <Users className="h-3.5 w-3.5 text-zinc-400" />
                        <span>{rt.occupancy}-Seater Capacity</span>
                        <span>•</span>
                        <span>Rent: ₹{rt.monthlyRent.toLocaleString("en-IN")}/mo</span>
                        <span>•</span>
                        <span>Deposit: ₹{rt.securityDeposit.toLocaleString("en-IN")}</span>
                      </div>
                    </div>

                    <span className="rounded-full bg-zinc-100 px-2.5 py-0.5 text-[10px] font-bold text-zinc-700">
                      {rt.rooms.length} room(s)
                    </span>
                  </div>

                  {/* Room numbers list */}
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {rt.rooms.map((r: any) => (
                      <span
                        key={r.id}
                        className={`rounded-md px-2 py-0.5 text-[11px] font-semibold border ${
                          r.status === "AVAILABLE"
                            ? "bg-white border-zinc-200 text-zinc-800"
                            : "bg-amber-50 border-amber-200 text-amber-700"
                        }`}
                      >
                        Room {r.roomNumber} ({r.occupiedBeds}/{rt.occupancy} beds)
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column (1 Col): Owner Info, Verification Details, Coordinates */}
        <div className="space-y-6">
          
          {/* Owner Host Card */}
          <div className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-2xs space-y-4">
            <h2 className="text-xs font-bold uppercase tracking-wider text-zinc-400">
              Host / Owner Details
            </h2>

            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-violet-600 text-white font-bold text-lg">
                {ownerName[0]?.toUpperCase() || "O"}
              </div>
              <div className="min-w-0">
                <span className="font-bold text-sm text-zinc-950 block truncate">
                  {ownerName}
                </span>
                <span className="text-xs text-zinc-500 block truncate">
                  {property.owner?.user?.email}
                </span>
                <span className="text-[11px] font-medium text-emerald-700">
                  {property.owner?.contactPhone || property.contactPhone}
                </span>
              </div>
            </div>

            <div className="pt-2 border-t border-zinc-100 flex items-center justify-between text-xs">
              <span className="text-zinc-500">Owner Verification:</span>
              <span className="font-bold text-zinc-800">
                {property.owner?.verificationStatus || "UNVERIFIED"}
              </span>
            </div>

            <Link
              href={`/admin/owners/${property.owner?.id}`}
              className="block w-full text-center rounded-xl border border-zinc-200 py-2 text-xs font-semibold text-zinc-700 hover:bg-zinc-50"
            >
              View Owner Profile
            </Link>
          </div>

          {/* Location & Metadata */}
          <div className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-2xs space-y-3 text-xs">
            <h2 className="text-xs font-bold uppercase tracking-wider text-zinc-400">
              Listing Metadata
            </h2>

            <div className="space-y-2 text-zinc-600">
              <div className="flex justify-between">
                <span>Property Type:</span>
                <strong className="text-zinc-900">{property.propertyType}</strong>
              </div>
              <div className="flex justify-between">
                <span>Gender Policy:</span>
                <strong className="text-zinc-900">{property.genderPolicy}</strong>
              </div>
              <div className="flex justify-between">
                <span>Gate Curfew:</span>
                <strong className="text-zinc-900">{property.gateClosingTime || "None"}</strong>
              </div>
              <div className="flex justify-between">
                <span>Notice Period:</span>
                <strong className="text-zinc-900">{property.noticePeriodDays} days</strong>
              </div>
              <div className="flex justify-between">
                <span>Created Date:</span>
                <strong className="text-zinc-900">
                  {new Date(property.createdAt).toLocaleDateString("en-IN")}
                </strong>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Confirmation Dialog */}
      <AdminConfirmDialog
        isOpen={dialogOpen}
        title={
          dialogAction === "delete"
            ? `Deactivate "${property.name}"?`
            : `Set status to "${targetStatus}"?`
        }
        description={
          dialogAction === "delete"
            ? "This will soft-delete the listing and remove it from the public PG discovery surface."
            : `Changing status to ${targetStatus} takes effect immediately and writes to the platform AuditLog.`
        }
        confirmLabel={dialogAction === "delete" ? "Deactivate" : "Update Status"}
        variant={dialogAction === "delete" || targetStatus === "REJECTED" ? "danger" : "default"}
        isLoading={isProcessing}
        onConfirm={executeAction}
        onClose={() => setDialogOpen(false)}
      />
    </div>
  );
}
