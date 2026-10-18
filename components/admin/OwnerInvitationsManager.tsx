"use client";

import { useState } from "react";
import {
  Mail,
  Plus,
  Copy,
  Check,
  CheckCircle2,
  AlertCircle,
  Search,
  ShieldAlert,
  UserCheck,
} from "lucide-react";
import {
  createOwnerInvitationAction,
  revokeOwnerInvitationAction,
} from "@/actions/invitation";
import { OwnerInvitationStatus } from "@/lib/enums";

export interface InvitationItem {
  id: string;
  email: string;
  inviteeName: string | null;
  status: OwnerInvitationStatus;
  createdAt: Date;
  expiresAt: Date;
  acceptedAt: Date | null;
  revokedAt: Date | null;
  createdByAdmin?: {
    id: string;
    email: string | null;
    profile?: { fullName: string } | null;
  };
  acceptedByUser?: {
    id: string;
    email: string | null;
    profile?: { fullName: string } | null;
  } | null;
}

interface OwnerInvitationsManagerProps {
  initialInvitations: InvitationItem[];
}

export function OwnerInvitationsManager({
  initialInvitations,
}: OwnerInvitationsManagerProps) {
  const [invitations, setInvitations] = useState<InvitationItem[]>(initialInvitations);
  const [email, setEmail] = useState("");
  const [inviteeName, setInviteeName] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Newly created invite link
  const [lastGeneratedLink, setLastGeneratedLink] = useState<string | null>(null);
  const [copiedLink, setCopiedLink] = useState(false);

  // Filter & Search
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  const [revokingId, setRevokingId] = useState<string | null>(null);

  const handleCreateInvitation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !email.includes("@")) {
      setErrorMsg("Please enter a valid email address.");
      return;
    }

    setIsSubmitting(true);
    setErrorMsg(null);
    setLastGeneratedLink(null);
    setCopiedLink(false);

    const res = await createOwnerInvitationAction({
      email: email.trim(),
      inviteeName: inviteeName.trim() || undefined,
    });

    setIsSubmitting(false);

    if (res.success && res.inviteLink && res.invitation) {
      // Build absolute URL for convenience
      const origin = typeof window !== "undefined" ? window.location.origin : "";
      const fullUrl = `${origin}${res.inviteLink}`;
      setLastGeneratedLink(fullUrl);

      setInvitations((prev) => [res.invitation as unknown as InvitationItem, ...prev]);
      setEmail("");
      setInviteeName("");
    } else {
      setErrorMsg(res.error || "Failed to create invitation.");
    }
  };

  const handleCopyLink = async (link: string) => {
    try {
      await navigator.clipboard.writeText(link);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 3000);
    } catch {
      // fallback
    }
  };

  const handleRevoke = async (id: string) => {
    if (!confirm("Are you sure you want to revoke this invitation? The invitee will no longer be able to use it.")) {
      return;
    }

    setRevokingId(id);
    const res = await revokeOwnerInvitationAction(id);
    setRevokingId(null);

    if (res.success) {
      setInvitations((prev) =>
        prev.map((item) =>
          item.id === id ? { ...item, status: OwnerInvitationStatus.REVOKED, revokedAt: new Date() } : item
        )
      );
    } else {
      setErrorMsg(res.error || "Failed to revoke invitation.");
    }
  };

  const filtered = invitations.filter((inv) => {
    const matchesFilter = statusFilter === "ALL" || inv.status === statusFilter;
    const matchesSearch =
      inv.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (inv.inviteeName && inv.inviteeName.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesFilter && matchesSearch;
  });

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Page Header */}
      <div>
        <div className="inline-flex items-center gap-1.5 rounded-full bg-rose-50 border border-rose-200 px-3.5 py-1 text-xs font-bold text-rose-700 mb-2">
          <ShieldAlert className="h-3.5 w-3.5 text-rose-600" />
          <span>Admin-Invite-Only Owner Access</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-zinc-900">
          Owner Invitations & Access Control
        </h1>
        <p className="mt-1 text-sm text-zinc-600">
          Normal users cannot self-register as PG owners. Only users invited by an administrator can
          access the owner onboarding portal.
        </p>
      </div>

      {/* Invitation Generator Card */}
      <div className="rounded-3xl border border-zinc-200 bg-white p-6 sm:p-8 shadow-sm space-y-5">
        <h2 className="text-base font-bold text-zinc-900 flex items-center gap-2">
          <Mail className="h-5 w-5 text-rose-600" />
          <span>Create New Owner Invitation</span>
        </h2>

        <form onSubmit={handleCreateInvitation} className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-zinc-700 mb-1.5">
              Invitee Email Address *
            </label>
            <input
              type="email"
              required
              placeholder="e.g. owner@sunrisehostels.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-xl border border-zinc-200 bg-zinc-50 px-3.5 py-2.5 text-xs font-medium text-zinc-900 focus:bg-white focus:border-rose-600 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-zinc-700 mb-1.5">
              Invitee Name / Business (Optional)
            </label>
            <input
              type="text"
              placeholder="e.g. Ramesh Kumar (Sunrise PG)"
              value={inviteeName}
              onChange={(e) => setInviteeName(e.target.value)}
              className="w-full rounded-xl border border-zinc-200 bg-zinc-50 px-3.5 py-2.5 text-xs font-medium text-zinc-900 focus:bg-white focus:border-rose-600 focus:outline-none"
            />
          </div>

          <div className="flex items-end">
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-rose-600 py-2.5 text-xs font-bold text-white hover:bg-rose-700 shadow-md shadow-rose-100 cursor-pointer disabled:opacity-50 transition-all"
            >
              <Plus className="h-4 w-4" />
              <span>{isSubmitting ? "Generating..." : "Generate Secure Invite Link"}</span>
            </button>
          </div>
        </form>

        {/* Error message */}
        {errorMsg && (
          <div className="flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 p-3 text-xs font-medium text-red-800">
            <AlertCircle className="h-4 w-4 shrink-0 text-red-600" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Generated Link Display Box */}
        {lastGeneratedLink && (
          <div className="rounded-2xl border border-emerald-200 bg-emerald-50/70 p-4 space-y-2 animate-in fade-in">
            <div className="flex items-center justify-between text-xs font-bold text-emerald-900">
              <span className="flex items-center gap-1.5">
                <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                <span>Invitation Link Ready! (Valid for 7 days)</span>
              </span>
              <span className="text-[11px] font-semibold text-emerald-700">
                Email restricted to invitee
              </span>
            </div>

            <div className="flex items-center gap-2">
              <input
                type="text"
                readOnly
                value={lastGeneratedLink}
                className="flex-1 rounded-xl border border-emerald-300 bg-white px-3.5 py-2 text-xs font-mono font-medium text-zinc-900 focus:outline-none select-all"
              />
              <button
                type="button"
                onClick={() => handleCopyLink(lastGeneratedLink)}
                className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-600 px-4 py-2 text-xs font-bold text-white hover:bg-emerald-700 cursor-pointer transition-all"
              >
                {copiedLink ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                <span>{copiedLink ? "Copied!" : "Copy Link"}</span>
              </button>
            </div>
            <p className="text-[11px] text-emerald-800">
              Share this link directly with the owner. Only an account with that email can claim it.
            </p>
          </div>
        )}
      </div>

      {/* Invitations History Table */}
      <div className="rounded-3xl border border-zinc-200 bg-white p-6 sm:p-8 shadow-sm space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-zinc-100 pb-4">
          <div className="flex items-center gap-2">
            {["ALL", "PENDING", "ACCEPTED", "EXPIRED", "REVOKED"].map((status) => (
              <button
                key={status}
                onClick={() => setStatusFilter(status)}
                className={`rounded-full px-3.5 py-1 text-xs font-bold transition-all cursor-pointer ${
                  statusFilter === status
                    ? "bg-zinc-900 text-white shadow-sm"
                    : "bg-zinc-100 text-zinc-600 hover:bg-zinc-200"
                }`}
              >
                {status === "ALL" ? "All" : status.charAt(0) + status.slice(1).toLowerCase()}
              </button>
            ))}
          </div>

          <div className="relative w-full sm:w-64">
            <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-zinc-600" />
            <input
              type="text"
              placeholder="Search invitations..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-full border border-zinc-200 bg-zinc-50 pl-8 pr-3 py-1.5 text-xs font-medium text-zinc-900 focus:bg-white focus:outline-none focus:border-rose-600"
            />
          </div>
        </div>

        {/* Invitations List */}
        {filtered.length === 0 ? (
          <div className="py-12 text-center text-xs font-semibold text-zinc-600">
            No invitations found for the selected filter.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-zinc-200 text-[11px] font-bold uppercase tracking-wider text-zinc-600">
                  <th className="pb-3">Invitee</th>
                  <th className="pb-3">Status</th>
                  <th className="pb-3">Created</th>
                  <th className="pb-3">Expires</th>
                  <th className="pb-3">Accepted By</th>
                  <th className="pb-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100">
                {filtered.map((inv) => {
                  const isPending = inv.status === OwnerInvitationStatus.PENDING;
                  const isAccepted = inv.status === OwnerInvitationStatus.ACCEPTED;
                  const isRevoked = inv.status === OwnerInvitationStatus.REVOKED;

                  return (
                    <tr key={inv.id} className="hover:bg-zinc-50/60 transition-colors">
                      <td className="py-3.5 pr-3">
                        <div className="font-bold text-zinc-900">{inv.email}</div>
                        {inv.inviteeName && (
                          <div className="text-[11px] text-zinc-600">{inv.inviteeName}</div>
                        )}
                      </td>

                      <td className="py-3.5 pr-3">
                        <span
                          className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[10px] font-bold ${
                            isAccepted
                              ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                              : isPending
                              ? "bg-amber-50 text-amber-700 border border-amber-200"
                              : isRevoked
                              ? "bg-rose-50 text-rose-700 border border-rose-200"
                              : "bg-zinc-100 text-zinc-600 border border-zinc-200"
                          }`}
                        >
                          {inv.status}
                        </span>
                      </td>

                      <td className="py-3.5 pr-3 text-zinc-600 whitespace-nowrap">
                        {new Date(inv.createdAt).toLocaleDateString("en-IN", {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                        })}
                      </td>

                      <td className="py-3.5 pr-3 text-zinc-600 whitespace-nowrap">
                        {new Date(inv.expiresAt).toLocaleDateString("en-IN", {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                        })}
                      </td>

                      <td className="py-3.5 pr-3 whitespace-nowrap">
                        {inv.acceptedByUser ? (
                          <div className="flex items-center gap-1 text-emerald-700 font-semibold">
                            <UserCheck className="h-3.5 w-3.5" />
                            <span>
                              {inv.acceptedByUser.profile?.fullName || inv.acceptedByUser.email}
                            </span>
                          </div>
                        ) : (
                          <span className="text-zinc-600">—</span>
                        )}
                      </td>

                      <td className="py-3.5 text-right whitespace-nowrap">
                        {isPending && (
                          <button
                            type="button"
                            disabled={revokingId === inv.id}
                            onClick={() => handleRevoke(inv.id)}
                            className="rounded-lg border border-red-200 bg-red-50 px-2.5 py-1 text-[11px] font-bold text-red-700 hover:bg-red-100 cursor-pointer disabled:opacity-50"
                          >
                            Revoke
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
