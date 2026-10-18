import { requireAdmin } from "@/lib/auth/session";
import { AdminSettingsClient } from "@/components/admin/AdminSettingsClient";

export const metadata = {
  title: "Platform Settings | Admin Portal",
  description: "Platform configurations, microservice status, and security policies.",
};

export default async function AdminSettingsPage() {
  const user = await requireAdmin("/admin/settings");

  return (
    <AdminSettingsClient
      adminEmail={user.email || "admin@staykro.in"}
      adminName={user.profile?.fullName || "Platform Admin"}
    />
  );
}
