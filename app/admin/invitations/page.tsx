import { Suspense } from "react";
import { requireAdmin } from "@/lib/auth/session";
import { listOwnerInvitationsAction } from "@/actions/invitation";
import {
  OwnerInvitationsManager,
  type InvitationItem,
} from "@/components/admin/OwnerInvitationsManager";

export const metadata = {
  title: "Owner Invitations | Admin Control Panel",
  description: "Create, view, and manage administrator invitations for PG owners.",
};

async function InvitationsDataLoader() {
  await requireAdmin("/admin/invitations");
  const res = await listOwnerInvitationsAction();
  const invitations = (res.success && res.invitations ? res.invitations : []) as unknown as InvitationItem[];

  return <OwnerInvitationsManager initialInvitations={invitations} />;
}

export default function AdminInvitationsPage() {
  return (
    <Suspense
      fallback={
        <div className="mx-auto max-w-7xl px-4 py-16 text-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-rose-600 border-t-transparent mx-auto mb-4" />
          <p className="text-sm font-semibold text-zinc-500">Loading invitations console...</p>
        </div>
      }
    >
      <InvitationsDataLoader />
    </Suspense>
  );
}
