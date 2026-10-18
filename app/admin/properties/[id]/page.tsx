import { notFound } from "next/navigation";
import { requireAdmin } from "@/lib/auth/session";
import { getAdminPropertyDetailAction } from "@/actions/admin";
import { AdminPropertyDetailClient } from "@/components/admin/AdminPropertyDetailClient";

interface AdminPropertyPageProps {
  params: Promise<{ id: string }>;
}

export default async function AdminPropertyDetailPage({ params }: AdminPropertyPageProps) {
  await requireAdmin("/admin/properties");
  const { id } = await params;

  const res = await getAdminPropertyDetailAction(id);

  if (!res.success || !res.data) {
    notFound();
  }

  return <AdminPropertyDetailClient property={res.data} />;
}
