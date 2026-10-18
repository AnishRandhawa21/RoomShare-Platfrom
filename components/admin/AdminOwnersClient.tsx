"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Briefcase,
  Search,
  CheckCircle,
  XCircle,
  Eye,
  ShieldCheck,
  Mail,
  Building2,
  Ban,
} from "lucide-react";
import { VerificationStatus } from "@/lib/enums";
import {
  updateAdminOwnerVerificationAction,
  toggleAdminUserActiveAction,
} from "@/actions/admin";
import { AdminPagination } from "./AdminPagination";
import { AdminConfirmDialog } from "./AdminConfirmDialog";

interface OwnerRow {
  id: string;
  businessName: string | null;
  contactPhone: string;
  verificationStatus: VerificationStatus;
  createdAt: Date | string;
  user: {
    id: string;
    email: string | null;
    phone: string | null;
    isActive: boolean;
    createdAt: Date | string;
    profile: { fullName: string } | null;
  };
  properties: { id: string; name: string; city: string; status: string }[];
  subscriptions: { plan: { name: string } }[];
  _count: { properties: number };
}

interface AdminOwnersClientProps {
  initialOwners: OwnerRow[];
  total: number;
  currentPage: number;
  totalPages: number;
  initialFilters: {
    search?: string;
    status?: string;
  };
}

export function AdminOwnersClient({
  initialOwners,
  total,
  currentPage,
  totalPages,
  initialFilters,
}: AdminOwnersClientProps) {
  const router = useRouter();

  const [search, setSearch] = useState(initialFilters.search || "");
  const [status, setStatus] = useState(initialFilters.status || "ALL");

  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogAction, setDialogAction] = useState<"verify" | "reject" | "toggleActive" | null>(null);
  const [selectedOwner, setSelectedOwner] = useState<OwnerRow | null>(null);
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
    router.push(`/admin/owners?${params.toString()}`);
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    applyFilters({ search, page: 1 });
  };

  const openVerifyConfirm = (owner: OwnerRow) => {
    setSelectedOwner(owner);
    setDialogAction("verify");
    setDialogOpen(true);
  };

  const openRejectConfirm = (owner: OwnerRow) => {
    setSelectedOwner(owner);
    setDialogAction("reject");
    setRejectionReason("");
    setDialogOpen(true);
  };

  const openToggleActiveConfirm = (owner: OwnerRow) => {
    setSelectedOwner(owner);
    setDialogAction("toggleActive");
    setDialogOpen(true);
  };

  const executeAction = async () => {
    if (!selectedOwner) return;
    setIsProcessing(true);

    if (dialogAction === "verify") {
      await updateAdminOwnerVerificationAction({
        ownerId: selectedOwner.id,
        verificationStatus: VerificationStatus.VERIFIED,
      });
    } else if (dialogAction === "reject") {
      await updateAdminOwnerVerificationAction({
        ownerId: selectedOwner.id,
        verificationStatus: VerificationStatus.REJECTED,
        rejectionReason,
      });
    } else if (dialogAction === "toggleActive") {
      await toggleAdminUserActiveAction({
        userId: selectedOwner.user.id,
        isActive: !selectedOwner.user.isActive,
      });
    }

    setIsProcessing(false);
    setDialogOpen(false);
    router.refresh();
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-zinc-950 tracking-tight">Owner Management</h1>
          <p className="text-xs text-zinc-500 mt-0.5">
            Manage invited PG owners, properties, subscriptions, and verification credentials.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link
            href="/admin/owners/invitations"
            className="inline-flex items-center gap-1.5 rounded-xl bg-rose-600 px-3.5 py-2 text-xs font-bold text-white hover:bg-rose-700 transition-all shadow-xs"
          >
            <Mail className="h-3.5 w-3.5" />
            <span>Manage Invitations</span>
          </Link>
        </div>
      </div>

      {/* Filter and Search */}
      <div className="rounded-2xl border border-zinc-200 bg-white p-4 shadow-2xs space-y-3">
        <form onSubmit={handleSearchSubmit} className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" />
            <input
              type="text"
              placeholder="Search by owner name, business, phone, or email..."
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

        <div className="flex items-center gap-3 pt-2 border-t border-zinc-100 text-xs">
          <span className="text-zinc-500 font-medium">Status:</span>
          <select
            value={status}
            onChange={(e) => {
              setStatus(e.target.value);
              applyFilters({ status: e.target.value, page: 1 });
            }}
            className="rounded-lg border border-zinc-200 bg-zinc-50 px-2.5 py-1 text-xs font-semibold text-zinc-700"
          >
            <option value="ALL">All Verification States</option>
            <option value="VERIFIED">Verified</option>
            <option value="PENDING">Pending Review</option>
            <option value="REJECTED">Rejected</option>
            <option value="UNVERIFIED">Unverified</option>
          </select>
        </div>
      </div>

      {/* Owners Table */}
      <div className="rounded-2xl border border-zinc-200 bg-white shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-zinc-50/80 border-b border-zinc-200/80 text-[10px] font-bold uppercase tracking-wider text-zinc-400">
              <tr>
                <th className="py-3 px-4">Owner / Host</th>
                <th className="py-3 px-4">Contact</th>
                <th className="py-3 px-4">Properties</th>
                <th className="py-3 px-4">Verification</th>
                <th className="py-3 px-4">Account</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100">
              {initialOwners.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-zinc-400 font-medium">
                    No owners found matching criteria.
                  </td>
                </tr>
              ) : (
                initialOwners.map((owner) => {
                  const name =
                    owner.user.profile?.fullName || owner.businessName || "PG Owner";

                  return (
                    <tr key={owner.id} className="hover:bg-zinc-50/70 transition-colors">
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-3">
                          <div className="h-9 w-9 shrink-0 rounded-xl bg-violet-100 text-violet-700 font-bold flex items-center justify-center text-xs">
                            {name[0]?.toUpperCase() || "O"}
                          </div>
                          <div>
                            <Link
                              href={`/admin/owners/${owner.id}`}
                              className="font-bold text-zinc-950 hover:text-violet-600 block"
                            >
                              {name}
                            </Link>
                            <span className="text-[11px] text-zinc-400 block">
                              {owner.businessName || "Individual Host"}
                            </span>
                          </div>
                        </div>
                      </td>

                      <td className="py-3.5 px-4">
                        <span className="text-zinc-900 font-semibold block">{owner.contactPhone}</span>
                        <span className="text-[11px] text-zinc-500 block">{owner.user.email}</span>
                      </td>

                      <td className="py-3.5 px-4">
                        <span className="font-semibold text-zinc-800">
                          {owner._count.properties} propert{owner._count.properties !== 1 ? "ies" : "y"}
                        </span>
                      </td>

                      <td className="py-3.5 px-4">
                        <span
                          className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase ${
                            owner.verificationStatus === "VERIFIED"
                              ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                              : owner.verificationStatus === "PENDING"
                              ? "bg-amber-50 text-amber-700 border border-amber-200"
                              : owner.verificationStatus === "REJECTED"
                              ? "bg-rose-50 text-rose-700 border border-rose-200"
                              : "bg-zinc-100 text-zinc-600"
                          }`}
                        >
                          {owner.verificationStatus}
                        </span>
                      </td>

                      <td className="py-3.5 px-4">
                        <span
                          className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold ${
                            owner.user.isActive
                              ? "bg-emerald-50 text-emerald-700"
                              : "bg-rose-50 text-rose-700"
                          }`}
                        >
                          {owner.user.isActive ? "Active" : "Suspended"}
                        </span>
                      </td>

                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <Link
                            href={`/admin/owners/${owner.id}`}
                            title="Inspect Profile"
                            className="p-1.5 rounded-lg text-zinc-500 hover:text-zinc-900 hover:bg-zinc-100"
                          >
                            <Eye className="h-4 w-4" />
                          </Link>

                          {owner.verificationStatus !== "VERIFIED" && (
                            <button
                              type="button"
                              onClick={() => openVerifyConfirm(owner)}
                              title="Verify Owner"
                              className="p-1.5 rounded-lg text-emerald-600 hover:bg-emerald-50 cursor-pointer"
                            >
                              <CheckCircle className="h-4 w-4" />
                            </button>
                          )}

                          {owner.verificationStatus !== "REJECTED" && (
                            <button
                              type="button"
                              onClick={() => openRejectConfirm(owner)}
                              title="Reject Verification"
                              className="p-1.5 rounded-lg text-amber-600 hover:bg-amber-50 cursor-pointer"
                            >
                              <XCircle className="h-4 w-4" />
                            </button>
                          )}

                          <button
                            type="button"
                            onClick={() => openToggleActiveConfirm(owner)}
                            title={owner.user.isActive ? "Suspend Owner" : "Reactivate Owner"}
                            className="p-1.5 rounded-lg text-rose-600 hover:bg-rose-50 cursor-pointer"
                          >
                            <Ban className="h-4 w-4" />
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

      <AdminConfirmDialog
        isOpen={dialogOpen}
        title={
          dialogAction === "verify"
            ? `Verify Owner "${selectedOwner?.user.profile?.fullName || selectedOwner?.businessName}"?`
            : dialogAction === "reject"
            ? `Reject Owner "${selectedOwner?.user.profile?.fullName || selectedOwner?.businessName}"?`
            : `${selectedOwner?.user.isActive ? "Suspend" : "Activate"} Owner Account?`
        }
        description={
          dialogAction === "verify"
            ? "This marks the owner profile as VERIFIED and logs an official AuditLog entry."
            : dialogAction === "reject"
            ? "This marks the owner verification status as REJECTED."
            : "Suspending this owner will block their access to the Owner Hub and manage properties."
        }
        confirmLabel={
          dialogAction === "verify"
            ? "Verify Owner"
            : dialogAction === "reject"
            ? "Reject"
            : selectedOwner?.user.isActive
            ? "Suspend Account"
            : "Activate Account"
        }
        variant={dialogAction === "verify" ? "default" : "danger"}
        isLoading={isProcessing}
        onConfirm={executeAction}
        onClose={() => setDialogOpen(false)}
      />
    </div>
  );
}
