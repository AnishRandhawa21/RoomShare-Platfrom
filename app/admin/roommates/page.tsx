import { Suspense } from "react";
import { requireAdmin } from "@/lib/auth/session";
import { getAdminRoommatesAction } from "@/actions/admin";
import { AdminRoommatesClient } from "@/components/admin/AdminRoommatesClient";

export const metadata = {
  title: "Roommate Requests | Admin Portal",
  description: "Monitor and moderate peer-to-peer flatmate requests.",
};

interface AdminRoommatesPageProps {
  searchParams: Promise<{
    search?: string;
    city?: string;
    status?: string;
    page?: string;
  }>;
}

async function RoommatesLoader({
  searchParams,
}: {
  searchParams: Promise<{ search?: string; city?: string; status?: string; page?: string }>;
}) {
  await requireAdmin("/admin/roommates");
  const params = await searchParams;

  const res = await getAdminRoommatesAction({
    search: params.search,
    city: params.city,
    status: (params.status as any) || "ALL",
    page: parseInt(params.page || "1", 10),
    limit: 15,
  });

  if (!res.success || !res.data) {
    return (
      <div className="rounded-2xl border border-rose-200 bg-rose-50 p-6 text-center text-xs font-semibold text-rose-700">
        {res.error || "Failed to load roommate requests."}
      </div>
    );
  }

  return (
    <AdminRoommatesClient
      initialRequests={res.data.requests as any}
      total={res.data.total}
      currentPage={res.data.page}
      totalPages={res.data.totalPages}
      filterCities={res.data.filterCities}
      initialFilters={{
        search: params.search,
        city: params.city,
        status: params.status,
      }}
    />
  );
}

export default function AdminRoommatesPage({ searchParams }: AdminRoommatesPageProps) {
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
      <RoommatesLoader searchParams={searchParams} />
    </Suspense>
  );
}
