import { Suspense } from "react";
import { requireAdmin } from "@/lib/auth/session";
import { getAdminPropertiesAction } from "@/actions/admin";
import { AdminPropertiesClient } from "@/components/admin/AdminPropertiesClient";

export const metadata = {
  title: "Property Management | Admin Portal",
  description: "Browse, filter, approve, and moderate listed PG properties.",
};

interface AdminPropertiesPageProps {
  searchParams: Promise<{
    search?: string;
    city?: string;
    locality?: string;
    status?: string;
    propertyType?: string;
    page?: string;
  }>;
}

async function PropertiesLoader({
  searchParams,
}: {
  searchParams: Promise<{
    search?: string;
    city?: string;
    locality?: string;
    status?: string;
    propertyType?: string;
    page?: string;
  }>;
}) {
  await requireAdmin("/admin/properties");
  const params = await searchParams;

  const res = await getAdminPropertiesAction({
    search: params.search,
    city: params.city,
    locality: params.locality,
    status: (params.status as any) || "ALL",
    propertyType: (params.propertyType as any) || "ALL",
    page: parseInt(params.page || "1", 10),
    limit: 15,
  });

  if (!res.success || !res.data) {
    return (
      <div className="rounded-2xl border border-rose-200 bg-rose-50 p-6 text-center text-xs font-semibold text-rose-700">
        {res.error || "Failed to load properties."}
      </div>
    );
  }

  return (
    <AdminPropertiesClient
      initialProperties={res.data.properties as any}
      total={res.data.total}
      currentPage={res.data.page}
      totalPages={res.data.totalPages}
      filterCities={res.data.filterCities}
      initialFilters={{
        search: params.search,
        city: params.city,
        status: params.status,
        propertyType: params.propertyType,
      }}
    />
  );
}

export default function AdminPropertiesPage({ searchParams }: AdminPropertiesPageProps) {
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
      <PropertiesLoader searchParams={searchParams} />
    </Suspense>
  );
}
