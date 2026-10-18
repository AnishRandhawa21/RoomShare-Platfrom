import { Suspense } from "react";
import { requireAdmin } from "@/lib/auth/session";
import { getAdminOwnersAction } from "@/actions/admin";
import { AdminOwnersClient } from "@/components/admin/AdminOwnersClient";

export const metadata = {
  title: "Owner Management | Admin Portal",
  description: "Manage invited PG owners, verification statuses, and property portfolios.",
};

interface AdminOwnersPageProps {
  searchParams: Promise<{
    search?: string;
    status?: string;
    page?: string;
  }>;
}

async function OwnersLoader({
  searchParams,
}: {
  searchParams: Promise<{ search?: string; status?: string; page?: string }>;
}) {
  await requireAdmin("/admin/owners");
  const params = await searchParams;

  const res = await getAdminOwnersAction({
    search: params.search,
    status: (params.status as any) || "ALL",
    page: parseInt(params.page || "1", 10),
    limit: 15,
  });

  if (!res.success || !res.data) {
    return (
      <div className="rounded-2xl border border-rose-200 bg-rose-50 p-6 text-center text-xs font-semibold text-rose-700">
        {res.error || "Failed to load owners."}
      </div>
    );
  }

  return (
    <AdminOwnersClient
      initialOwners={res.data.owners as any}
      total={res.data.total}
      currentPage={res.data.page}
      totalPages={res.data.totalPages}
      initialFilters={{
        search: params.search,
        status: params.status,
      }}
    />
  );
}

export default function AdminOwnersPage({ searchParams }: AdminOwnersPageProps) {
  return (
    <Suspense
      fallback={
        <div className="space-y-4 animate-pulse">
          <div className="h-8 w-48 bg-zinc-200 rounded-xl" />
          <div className="h-20 bg-zinc-100 rounded-2xl" />
          <div className="h-96 bg-zinc-100 rounded-2xl" />
        </div>
      }
    >
      <OwnersLoader searchParams={searchParams} />
    </Suspense>
  );
}
