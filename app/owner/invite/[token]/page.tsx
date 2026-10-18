import { Suspense } from "react";
import { getInvitationByTokenAction } from "@/actions/invitation";
import { getCurrentUser } from "@/lib/auth/session";
import {
  InviteLandingCard,
  type PublicInvitationDetails,
} from "@/components/owner/InviteLandingCard";

interface InvitePageProps {
  params: Promise<{ token: string }>;
}

export const metadata = {
  title: "Owner Invitation | StayKro",
  description: "Accept your administrative invitation to list your PG property on StayKro.",
};

async function InviteDataLoader({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const currentUser = await getCurrentUser();
  const res = await getInvitationByTokenAction(token);

  const invitation = (res.success && res.invitation ? res.invitation : null) as unknown as PublicInvitationDetails | null;

  return (
    <InviteLandingCard
      token={token}
      invitation={invitation}
      validationError={!res.success ? res.error : null}
      currentUser={
        currentUser
          ? {
              id: currentUser.id,
              email: currentUser.email,
              fullName: currentUser.profile?.fullName,
            }
          : null
      }
    />
  );
}

export default function OwnerInvitePage({ params }: InvitePageProps) {
  return (
    <div className="min-h-screen bg-zinc-50 flex items-center justify-center p-4 sm:p-6 lg:p-8">
      <Suspense
        fallback={
          <div className="mx-auto max-w-lg p-12 text-center">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-indigo-600 border-t-transparent mx-auto mb-4" />
            <p className="text-xs font-semibold text-zinc-500">Verifying invitation link...</p>
          </div>
        }
      >
        <InviteDataLoader params={params} />
      </Suspense>
    </div>
  );
}
