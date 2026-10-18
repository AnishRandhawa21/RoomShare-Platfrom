"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Building2,
  Search,
  Filter,
  Eye,
  CheckCircle,
  XCircle,
  Trash2,
  MapPin,
  ExternalLink,
} from "lucide-react";
import { PropertyStatus, PropertyType } from "@/lib/enums";
import {
  updateAdminPropertyStatusAction,
  deleteAdminPropertyAction,
} from "@/actions/admin";
import { AdminPagination } from "./AdminPagination";
import { AdminConfirmDialog } from "./AdminConfirmDialog";

interface PropertyRow {
  id: string;
  name: string;
  slug: string;
  locality: string;
  city: string;
  propertyType: PropertyType;
  status: PropertyStatus;
  createdAt: Date | string;
  owner: {
    businessName: string | null;
    user: { email: string | null; profile: { fullName: string } | null };
  };
  roomTypes: { id: string; name: string; monthlyRent: number; occupancy: number }[];
  images: { url: string }[];
  _count: { roomTypes: number };
}

interface AdminPropertiesClientProps {
  initialProperties: PropertyRow[];
  total: number;
  currentPage: number;
  totalPages: number;
  filterCities: string[];
  initialFilters: {
    search?: string;
    city?: string;
    status?: string;
    propertyType?: string;
  };
}

export function AdminPropertiesClient({
  initialProperties,
  total,
  currentPage,
  totalPages,
  filterCities,
  initialFilters,
}: AdminPropertiesClientProps) {
  const router = useRouter();

  const [search, setSearch] = useState(initialFilters.search || "");
  const [city, setCity] = useState(initialFilters.city || "ALL");
  const [status, setStatus] = useState(initialFilters.status || "ALL");
  const [propertyType, setPropertyType] = useState(initialFilters.propertyType || "ALL");

  // Confirmation dialog state
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogAction, setDialogAction] = useState<"delete" | "status" | null>(null);
  const [selectedProperty, setSelectedProperty] = useState<PropertyRow | null>(null);
  const [targetStatus, setTargetStatus] = useState<PropertyStatus | null>(null);
  const [rejectionReason, setRejectionReason] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);

  const applyFilters = (newParams: Record<string, string | number>) => {
    const params = new URLSearchParams(window.location.search);
    Object.entries(newParams).forEach(([k, v]) => {
      if (v === "" || v === "ALL") {
        params.delete(k);
      } else {
        params.set(k, String(v));
      }
    });
    router.push(`/admin/properties?${params.toString()}`);
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    applyFilters({ search, page: 1 });
  };

  const openStatusConfirm = (prop: PropertyRow, newStatus: PropertyStatus) => {
    setSelectedProperty(prop);
    setTargetStatus(newStatus);
    setDialogAction("status");
    setRejectionReason("");
    setDialogOpen(true);
  };

  const openDeleteConfirm = (prop: PropertyRow) => {
    setSelectedProperty(prop);
    setDialogAction("delete");
    setDialogOpen(true);
  };

  const executeConfirmedAction = async () => {
    if (!selectedProperty) return;
    setIsProcessing(true);

    if (dialogAction === "status" && targetStatus) {
      await updateAdminPropertyStatusAction({
        propertyId: selectedProperty.id,
        status: targetStatus,
        rejectionReason: targetStatus === PropertyStatus.REJECTED ? rejectionReason : undefined,
      });
    } else if (dialogAction === "delete") {
      await deleteAdminPropertyAction(selectedProperty.id);
    }

    setIsProcessing(false);
    setDialogOpen(false);
    router.refresh();
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-zinc-950 tracking-tight">
            Property Management
          </h1>
          <p className="text-xs text-zinc-500 mt-0.5">
            Catalog of all PG, coliving, and hostel listings across cities.
          </p>
        </div>

        <div className="text-xs font-semibold text-zinc-600 bg-white border border-zinc-200 px-3.5 py-1.5 rounded-full shadow-2xs self-start sm:self-auto">
          Total properties: <strong className="text-zinc-900">{total}</strong>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="rounded-2xl border border-zinc-200 bg-white p-4 shadow-2xs space-y-3">
        <form onSubmit={handleSearchSubmit} className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" />
            <input
              type="text"
              placeholder="Search by property name, locality, city, or owner..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-xl border border-zinc-200 bg-zinc-50 pl-10 pr-4 py-2 text-xs font-medium text-zinc-900 focus:bg-white focus:outline-none focus:border-zinc-400"
            />
          </div>
          <button
            type="submit"
            className="rounded-xl bg-zinc-900 px-4 py-2 text-xs font-bold text-white hover:bg-zinc-800 transition-colors cursor-pointer"
          >
            Search
          </button>
        </form>

        <div className="flex flex-wrap items-center gap-3 pt-2 border-t border-zinc-100 text-xs">
          <div className="flex items-center gap-1.5 text-zinc-500 font-medium">
            <Filter className="h-3.5 w-3.5" />
            <span>Filters:</span>
          </div>

          {/* City Filter */}
          <select
            value={city}
            onChange={(e) => {
              setCity(e.target.value);
              applyFilters({ city: e.target.value, page: 1 });
            }}
            className="rounded-lg border border-zinc-200 bg-zinc-50 px-2.5 py-1 text-xs font-semibold text-zinc-700"
          >
            <option value="ALL">All Cities</option>
            {filterCities.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>

          {/* Status Filter */}
          <select
            value={status}
            onChange={(e) => {
              setStatus(e.target.value);
              applyFilters({ status: e.target.value, page: 1 });
            }}
            className="rounded-lg border border-zinc-200 bg-zinc-50 px-2.5 py-1 text-xs font-semibold text-zinc-700"
          >
            <option value="ALL">All Statuses</option>
            <option value="PUBLISHED">Published (Active)</option>
            <option value="PENDING_APPROVAL">Pending Approval</option>
            <option value="DRAFT">Draft</option>
            <option value="REJECTED">Rejected</option>
            <option value="INACTIVE">Inactive / Soft-deleted</option>
          </select>

          {/* Property Type Filter */}
          <select
            value={propertyType}
            onChange={(e) => {
              setPropertyType(e.target.value);
              applyFilters({ propertyType: e.target.value, page: 1 });
            }}
            className="rounded-lg border border-zinc-200 bg-zinc-50 px-2.5 py-1 text-xs font-semibold text-zinc-700"
          >
            <option value="ALL">All Types</option>
            <option value="PG">PG</option>
            <option value="COLIVING">Coliving</option>
            <option value="HOSTEL">Hostel</option>
            <option value="APARTMENT">Apartment</option>
          </select>
        </div>
      </div>

      {/* Properties Table */}
      <div className="rounded-2xl border border-zinc-200 bg-white shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-zinc-50/80 border-b border-zinc-200/80 text-[10px] font-bold uppercase tracking-wider text-zinc-400">
              <tr>
                <th className="py-3 px-4">Property</th>
                <th className="py-3 px-4">Owner / Host</th>
                <th className="py-3 px-4">Location</th>
                <th className="py-3 px-4">Rooms / Types</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100">
              {initialProperties.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-zinc-400 font-medium">
                    No properties match the selected criteria.
                  </td>
                </tr>
              ) : (
                initialProperties.map((p) => {
                  const ownerName =
                    p.owner?.user?.profile?.fullName || p.owner?.businessName || "PG Owner";
                  const coverUrl = p.images[0]?.url;

                  return (
                    <tr key={p.id} className="hover:bg-zinc-50/70 transition-colors">
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-3">
                          <div className="h-10 w-10 shrink-0 rounded-xl bg-zinc-100 overflow-hidden border border-zinc-200 flex items-center justify-center">
                            {coverUrl ? (
                              <img src={coverUrl} alt={p.name} className="h-full w-full object-cover" />
                            ) : (
                              <Building2 className="h-5 w-5 text-zinc-400" />
                            )}
                          </div>
                          <div>
                            <Link
                              href={`/admin/properties/${p.id}`}
                              className="font-bold text-zinc-950 hover:text-violet-600 block line-clamp-1"
                            >
                              {p.name}
                            </Link>
                            <span className="text-[10px] font-semibold text-zinc-400 uppercase tracking-wider">
                              {p.propertyType}
                            </span>
                          </div>
                        </div>
                      </td>

                      <td className="py-3.5 px-4">
                        <span className="font-semibold text-zinc-900 block truncate max-w-[150px]">
                          {ownerName}
                        </span>
                        <span className="text-[11px] text-zinc-500 block truncate max-w-[150px]">
                          {p.owner?.user?.email || "No email"}
                        </span>
                      </td>

                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-1 text-zinc-700">
                          <MapPin className="h-3.5 w-3.5 text-zinc-400 shrink-0" />
                          <span className="truncate max-w-[140px]">
                            {p.locality}, {p.city}
                          </span>
                        </div>
                      </td>

                      <td className="py-3.5 px-4 text-zinc-700">
                        <span className="font-semibold">{p._count.roomTypes} room type(s)</span>
                      </td>

                      <td className="py-3.5 px-4">
                        <span
                          className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider ${
                            p.status === "PUBLISHED"
                              ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                              : p.status === "PENDING_APPROVAL"
                              ? "bg-amber-50 text-amber-700 border border-amber-200"
                              : p.status === "REJECTED"
                              ? "bg-rose-50 text-rose-700 border border-rose-200"
                              : "bg-zinc-100 text-zinc-600"
                          }`}
                        >
                          {p.status}
                        </span>
                      </td>

                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <Link
                            href={`/admin/properties/${p.id}`}
                            title="Inspect Details"
                            className="p-1.5 rounded-lg text-zinc-500 hover:text-zinc-900 hover:bg-zinc-100 transition-colors"
                          >
                            <Eye className="h-4 w-4" />
                          </Link>

                          {p.status !== "PUBLISHED" && (
                            <button
                              type="button"
                              onClick={() => openStatusConfirm(p, PropertyStatus.PUBLISHED)}
                              title="Approve / Publish"
                              className="p-1.5 rounded-lg text-emerald-600 hover:bg-emerald-50 transition-colors cursor-pointer"
                            >
                              <CheckCircle className="h-4 w-4" />
                            </button>
                          )}

                          {p.status !== "REJECTED" && (
                            <button
                              type="button"
                              onClick={() => openStatusConfirm(p, PropertyStatus.REJECTED)}
                              title="Reject Listing"
                              className="p-1.5 rounded-lg text-amber-600 hover:bg-amber-50 transition-colors cursor-pointer"
                            >
                              <XCircle className="h-4 w-4" />
                            </button>
                          )}

                          <button
                            type="button"
                            onClick={() => openDeleteConfirm(p)}
                            title="Soft Delete Property"
                            className="p-1.5 rounded-lg text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        <AdminPagination
          currentPage={currentPage}
          totalPages={totalPages}
          totalItems={total}
          itemsPerPage={15}
          onPageChange={(page) => applyFilters({ page })}
        />
      </div>

      {/* Confirmation Dialog */}
      <AdminConfirmDialog
        isOpen={dialogOpen}
        title={
          dialogAction === "delete"
            ? `Soft Delete "${selectedProperty?.name}"?`
            : `Change Status to "${targetStatus}" for "${selectedProperty?.name}"?`
        }
        description={
          dialogAction === "delete"
            ? "This will deactivate the property and hide it from all public search and discovery surfaces. The owner can review this status."
            : `Changing status to ${targetStatus} updates live catalog visibility immediately and creates an immutable AuditLog entry.`
        }
        confirmLabel={dialogAction === "delete" ? "Delete Property" : "Apply Status"}
        variant={dialogAction === "delete" || targetStatus === "REJECTED" ? "danger" : "default"}
        isLoading={isProcessing}
        onConfirm={executeConfirmedAction}
        onClose={() => setDialogOpen(false)}
      />
    </div>
  );
}
