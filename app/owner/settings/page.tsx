import { Suspense } from "react";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/session";
import { OwnerSettingsClient } from "@/components/owner/OwnerSettingsClient";

export const metadata = {
  title: "Partner Settings | StayKro Owner",
  description: "Account preferences, lead routing, and security settings.",
};

async function SettingsDataLoader() {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/login?returnUrl=/owner/settings");
  }

  return <OwnerSettingsClient userEmail={user.email || ""} />;
}

export default function OwnerSettingsPage() {
  return (
    <Suspense
      fallback={
        <div className="mx-auto max-w-7xl px-4 py-16 text-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-indigo-600 border-t-transparent mx-auto mb-4" />
          <p className="text-sm font-semibold text-slate-500">Loading settings...</p>
        </div>
      }
    >
      <SettingsDataLoader />
    </Suspense>
  );
}
