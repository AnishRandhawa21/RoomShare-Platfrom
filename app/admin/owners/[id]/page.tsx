import { notFound } from "next/navigation";
import { requireAdmin } from "@/lib/auth/session";
import { getAdminOwnerDetailAction } from "@/actions/admin";
import { AdminOwnerDetailClient } from "@/components/admin/AdminOwnerDetailClient";

interface AdminOwnerPageProps {
  params: Promise<{ id: string }>;
}

export default async function AdminOwnerDetailPage({ params }: AdminOwnerPageProps) {
  await requireAdmin("/admin/owners");
  const { id } = await params;

  const res = await getAdminOwnerDetailAction(id);

  if (!res.success || !res.data) {
    notFound();
  }

  return <AdminOwnerDetailClient owner={res.data} />;
}
