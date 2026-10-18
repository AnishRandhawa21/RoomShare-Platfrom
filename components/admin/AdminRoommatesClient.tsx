"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  UserCheck,
  Search,
  Filter,
  Eye,
  CheckCircle,
  XCircle,
  MapPin,
  ExternalLink,
} from "lucide-react";
import { RoommateRequestStatus } from "@/lib/enums";
import { updateAdminRoommateStatusAction } from "@/actions/admin";
import { AdminPagination } from "./AdminPagination";
import { AdminConfirmDialog } from "./AdminConfirmDialog";

interface RoommateRow {
  id: string;
  title: string;
  locality: string;
  city: string;
  rentPerPerson: number;
  requiredRoommateCount: number;
  status: RoommateRequestStatus;
  createdAt: Date | string;
  creator: {
    id: string;
    email: string | null;
    profile: { fullName: string; profession: string | null } | null;
  };
  property: { id: string; name: string; slug: string } | null;
  roomType: { id: string; name: string; occupancy: number } | null;
  _count: { interests: number };
}

interface AdminRoommatesClientProps {
  initialRequests: RoommateRow[];
  total: number;
  currentPage: number;
  totalPages: number;
  filterCities: string[];
  initialFilters: {
    search?: string;
    city?: string;
    status?: string;
  };
}

export function AdminRoommatesClient({
  initialRequests,
  total,
  currentPage,
  totalPages,
  filterCities,
  initialFilters,
}: AdminRoommatesClientProps) {
  const router = useRouter();

  const [search, setSearch] = useState(initialFilters.search || "");
  const [city, setCity] = useState(initialFilters.city || "ALL");
  const [status, setStatus] = useState(initialFilters.status || "ALL");

  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedReq, setSelectedReq] = useState<RoommateRow | null>(null);
  const [targetStatus, setTargetStatus] = useState<RoommateRequestStatus | null>(null);
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
    router.push(`/admin/roommates?${params.toString()}`);
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    applyFilters({ search, page: 1 });
  };

  const openStatusConfirm = (req: RoommateRow, newStatus: RoommateRequestStatus) => {
    setSelectedReq(req);
    setTargetStatus(newStatus);
    setDialogOpen(true);
  };

  const executeAction = async () => {
    if (!selectedReq || !targetStatus) return;
    setIsProcessing(true);

    await updateAdminRoommateStatusAction({
      requestId: selectedReq.id,
      status: targetStatus,
    });

    setIsProcessing(false);
    setDialogOpen(false);
    router.refresh();
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-zinc-950 tracking-tight">
            Roommate Requests
          </h1>
          <p className="text-xs text-zinc-500 mt-0.5">
            Moderate peer-to-peer flatmate requests linked to verified properties and room types.
          </p>
        </div>

        <div className="text-xs font-semibold text-zinc-600 bg-white border border-zinc-200 px-3.5 py-1.5 rounded-full shadow-2xs">
          Total requests: <strong className="text-zinc-900">{total}</strong>
        </div>
      </div>

      {/* Filter and Search */}
      <div className="rounded-2xl border border-zinc-200 bg-white p-4 shadow-2xs space-y-3">
        <form onSubmit={handleSearchSubmit} className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" />
            <input
              type="text"
              placeholder="Search by title, seeker name, locality, or city..."
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
          <span className="text-zinc-500 font-medium">Filters:</span>

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

          <select
            value={status}
            onChange={(e) => {
              setStatus(e.target.value);
              applyFilters({ status: e.target.value, page: 1 });
            }}
            className="rounded-lg border border-zinc-200 bg-zinc-50 px-2.5 py-1 text-xs font-semibold text-zinc-700"
          >
            <option value="ALL">All Statuses</option>
            <option value="ACTIVE">Active</option>
            <option value="FILLED">Filled</option>
            <option value="CLOSED">Closed / Deactivated</option>
            <option value="EXPIRED">Expired</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="rounded-2xl border border-zinc-200 bg-white shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-zinc-50/80 border-b border-zinc-200/80 text-[10px] font-bold uppercase tracking-wider text-zinc-400">
              <tr>
                <th className="py-3 px-4">Request / Seeker</th>
                <th className="py-3 px-4">Associated PG & Room</th>
                <th className="py-3 px-4">Location</th>
                <th className="py-3 px-4">Rent Share</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100">
              {initialRequests.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-zinc-400 font-medium">
                    No roommate requests match query.
                  </td>
                </tr>
              ) : (
                initialRequests.map((req) => {
                  const seekerName = req.creator.profile?.fullName || req.creator.email || "Seeker";

                  return (
                    <tr key={req.id} className="hover:bg-zinc-50/70 transition-colors">
                      <td className="py-3.5 px-4">
                        <Link
                          href={`/roommates/${req.id}`}
                          target="_blank"
                          className="font-bold text-zinc-950 hover:text-violet-600 block line-clamp-1"
                        >
                          {req.title}
                        </Link>
                        <span className="text-[11px] text-zinc-500 block truncate">
                          By: {seekerName} ({req.creator.email})
                        </span>
                      </td>

                      <td className="py-3.5 px-4">
                        {req.property ? (
                          <>
                            <span className="font-semibold text-zinc-900 block truncate max-w-[150px]">
                              {req.property.name}
                            </span>
                            <span className="text-[11px] text-zinc-400 block truncate">
                              {req.roomType?.name || "Shared Room"}
                            </span>
                          </>
                        ) : (
                          <span className="text-zinc-400 italic">Independent Flat/Society</span>
                        )}
                      </td>

                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-1 text-zinc-700">
                          <MapPin className="h-3.5 w-3.5 text-zinc-400 shrink-0" />
                          <span className="truncate max-w-[130px]">
                            {req.locality}, {req.city}
                          </span>
                        </div>
                      </td>

                      <td className="py-3.5 px-4 font-semibold text-zinc-900">
                        ₹{req.rentPerPerson.toLocaleString("en-IN")}/mo
                      </td>

                      <td className="py-3.5 px-4">
                        <span
                          className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold ${
                            req.status === "ACTIVE"
                              ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                              : req.status === "FILLED"
                              ? "bg-blue-50 text-blue-700"
                              : "bg-zinc-100 text-zinc-500"
                          }`}
                        >
                          {req.status}
                        </span>
                      </td>

                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <Link
                            href={`/roommates/${req.id}`}
                            target="_blank"
                            title="View Public Post"
                            className="p-1.5 rounded-lg text-zinc-500 hover:text-zinc-900 hover:bg-zinc-100"
                          >
                            <ExternalLink className="h-4 w-4" />
                          </Link>

                          {req.status !== "CLOSED" && (
                            <button
                              type="button"
                              onClick={() => openStatusConfirm(req, RoommateRequestStatus.CLOSED)}
                              title="Close / Deactivate"
                              className="p-1.5 rounded-lg text-rose-600 hover:bg-rose-50 cursor-pointer"
                            >
                              <XCircle className="h-4 w-4" />
                            </button>
                          )}
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

      <AdminConfirmDialog
        isOpen={dialogOpen}
        title={`Change Request Status to "${targetStatus}"?`}
        description={`This will change the status of "${selectedReq?.title}" to ${targetStatus} and write to the platform AuditLog.`}
        confirmLabel="Confirm Status Change"
        variant="warning"
        isLoading={isProcessing}
        onConfirm={executeAction}
        onClose={() => setDialogOpen(false)}
      />
    </div>
  );
}
