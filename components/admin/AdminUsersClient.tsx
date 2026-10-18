"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Users, Search, Ban, CheckCircle, ShieldAlert, ShieldCheck } from "lucide-react";
import { Role } from "@/lib/enums";
import {
  toggleAdminUserActiveAction,
  updateAdminUserRoleAction,
} from "@/actions/admin";
import { AdminPagination } from "./AdminPagination";
import { AdminConfirmDialog } from "./AdminConfirmDialog";

interface UserRow {
  id: string;
  email: string | null;
  phone: string | null;
  role: Role;
  isActive: boolean;
  createdAt: Date | string;
  profile: {
    fullName: string;
    avatarUrl: string | null;
    city: string | null;
    profession: string | null;
  } | null;
  ownerProfile: { id: string; businessName: string | null } | null;
  _count: {
    roommateRequests: number;
    reportsSubmitted: number;
    payments: number;
  };
}

interface AdminUsersClientProps {
  initialUsers: UserRow[];
  total: number;
  currentPage: number;
  totalPages: number;
  initialFilters: {
    search?: string;
    role?: string;
  };
}

export function AdminUsersClient({
  initialUsers,
  total,
  currentPage,
  totalPages,
  initialFilters,
}: AdminUsersClientProps) {
  const router = useRouter();

  const [search, setSearch] = useState(initialFilters.search || "");
  const [role, setRole] = useState(initialFilters.role || "ALL");

  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogAction, setDialogAction] = useState<"toggleActive" | "role" | null>(null);
  const [selectedUser, setSelectedUser] = useState<UserRow | null>(null);
  const [targetRole, setTargetRole] = useState<Role | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
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
    router.push(`/admin/users?${params.toString()}`);
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    applyFilters({ search, page: 1 });
  };

  const openToggleActive = (user: UserRow) => {
    setSelectedUser(user);
    setDialogAction("toggleActive");
    setErrorMessage(null);
    setDialogOpen(true);
  };

  const openRoleConfirm = (user: UserRow, newRole: Role) => {
    setSelectedUser(user);
    setTargetRole(newRole);
    setDialogAction("role");
    setErrorMessage(null);
    setDialogOpen(true);
  };

  const executeAction = async () => {
    if (!selectedUser) return;
    setIsProcessing(true);
    setErrorMessage(null);

    if (dialogAction === "toggleActive") {
      const res = await toggleAdminUserActiveAction({
        userId: selectedUser.id,
        isActive: !selectedUser.isActive,
      });
      if (!res.success) {
        setErrorMessage(res.error || "Failed to toggle user status.");
        setIsProcessing(false);
        return;
      }
    } else if (dialogAction === "role" && targetRole) {
      const res = await updateAdminUserRoleAction({
        userId: selectedUser.id,
        newRole: targetRole,
      });
      if (!res.success) {
        setErrorMessage(res.error || "Failed to update role.");
        setIsProcessing(false);
        return;
      }
    }

    setIsProcessing(false);
    setDialogOpen(false);
    router.refresh();
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-zinc-950 tracking-tight">User Management</h1>
          <p className="text-xs text-zinc-500 mt-0.5">
            View registered tenants, seekers, PG owners, and administrators.
          </p>
        </div>

        <div className="text-xs font-semibold text-zinc-600 bg-white border border-zinc-200 px-3.5 py-1.5 rounded-full shadow-2xs">
          Total accounts: <strong className="text-zinc-900">{total}</strong>
        </div>
      </div>

      {/* Filter and Search */}
      <div className="rounded-2xl border border-zinc-200 bg-white p-4 shadow-2xs space-y-3">
        <form onSubmit={handleSearchSubmit} className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" />
            <input
              type="text"
              placeholder="Search by full name, email, or phone number..."
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
          <span className="text-zinc-500 font-medium">Role Filter:</span>
          <select
            value={role}
            onChange={(e) => {
              setRole(e.target.value);
              applyFilters({ role: e.target.value, page: 1 });
            }}
            className="rounded-lg border border-zinc-200 bg-zinc-50 px-2.5 py-1 text-xs font-semibold text-zinc-700"
          >
            <option value="ALL">All Roles</option>
            <option value="USER">Standard User / Roommate Seeker</option>
            <option value="OWNER">Verified PG Owner</option>
            <option value="ADMIN">Platform Administrator</option>
          </select>
        </div>
      </div>

      {/* Users Table */}
      <div className="rounded-2xl border border-zinc-200 bg-white shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-zinc-50/80 border-b border-zinc-200/80 text-[10px] font-bold uppercase tracking-wider text-zinc-400">
              <tr>
                <th className="py-3 px-4">User</th>
                <th className="py-3 px-4">Contact</th>
                <th className="py-3 px-4">Platform Role</th>
                <th className="py-3 px-4">Roommate Needs</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100">
              {initialUsers.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-zinc-400 font-medium">
                    No users found matching query.
                  </td>
                </tr>
              ) : (
                initialUsers.map((user) => {
                  const name = user.profile?.fullName || user.email?.split("@")[0] || "User";

                  return (
                    <tr key={user.id} className="hover:bg-zinc-50/70 transition-colors">
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-3">
                          <div className="h-8 w-8 shrink-0 rounded-full bg-violet-600 text-white font-bold flex items-center justify-center text-xs">
                            {name[0]?.toUpperCase() || "U"}
                          </div>
                          <div>
                            <span className="font-bold text-zinc-950 block">{name}</span>
                            <span className="text-[11px] text-zinc-400">
                              Joined {new Date(user.createdAt).toLocaleDateString("en-IN")}
                            </span>
                          </div>
                        </div>
                      </td>

                      <td className="py-3.5 px-4">
                        <span className="text-zinc-900 font-medium block truncate max-w-[170px]">
                          {user.email || "No email"}
                        </span>
                        <span className="text-[11px] text-zinc-500 block">{user.phone || "—"}</span>
                      </td>

                      <td className="py-3.5 px-4">
                        <span
                          className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase ${
                            user.role === "ADMIN"
                              ? "bg-rose-100 text-rose-800 border border-rose-200"
                              : user.role === "OWNER"
                              ? "bg-indigo-50 text-indigo-700 border border-indigo-200"
                              : "bg-zinc-100 text-zinc-700"
                          }`}
                        >
                          {user.role}
                        </span>
                      </td>

                      <td className="py-3.5 px-4 text-zinc-700">
                        <span className="font-semibold">{user._count.roommateRequests} request(s)</span>
                      </td>

                      <td className="py-3.5 px-4">
                        <span
                          className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold ${
                            user.isActive
                              ? "bg-emerald-50 text-emerald-700"
                              : "bg-rose-50 text-rose-700"
                          }`}
                        >
                          {user.isActive ? "Active" : "Banned"}
                        </span>
                      </td>

                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {user.role !== "ADMIN" && (
                            <button
                              type="button"
                              onClick={() => openRoleConfirm(user, Role.ADMIN)}
                              title="Grant Admin Privileges"
                              className="p-1.5 rounded-lg text-rose-600 hover:bg-rose-50 cursor-pointer"
                            >
                              <ShieldCheck className="h-4 w-4" />
                            </button>
                          )}

                          <button
                            type="button"
                            onClick={() => openToggleActive(user)}
                            title={user.isActive ? "Suspend / Ban User" : "Activate User"}
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
          dialogAction === "toggleActive"
            ? `${selectedUser?.isActive ? "Ban / Suspend" : "Activate"} User "${selectedUser?.profile?.fullName || selectedUser?.email}"?`
            : `Grant Admin Privileges to "${selectedUser?.profile?.fullName || selectedUser?.email}"?`
        }
        description={
          errorMessage ||
          (dialogAction === "toggleActive"
            ? "Banning this user will block their login access across the platform."
            : "Platform Administrators gain full access to database records, user moderation, and financial ledgers.")
        }
        confirmLabel={
          dialogAction === "toggleActive"
            ? selectedUser?.isActive
              ? "Ban User"
              : "Activate"
            : "Grant Admin Role"
        }
        variant={dialogAction === "toggleActive" ? "danger" : "warning"}
        isLoading={isProcessing}
        onConfirm={executeAction}
        onClose={() => setDialogOpen(false)}
      />
    </div>
  );
}
