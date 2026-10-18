import { Suspense } from "react";
import { requireAdmin } from "@/lib/auth/session";
import { getAdminUsersAction } from "@/actions/admin";
import { AdminUsersClient } from "@/components/admin/AdminUsersClient";

export const metadata = {
  title: "User Management | Admin Portal",
  description: "Browse, filter, and moderate registered platform users.",
};

interface AdminUsersPageProps {
  searchParams: Promise<{
    search?: string;
    role?: string;
    page?: string;
  }>;
}

async function UsersLoader({
  searchParams,
}: {
  searchParams: Promise<{ search?: string; role?: string; page?: string }>;
}) {
  await requireAdmin("/admin/users");
  const params = await searchParams;

  const res = await getAdminUsersAction({
    search: params.search,
    role: (params.role as any) || "ALL",
    page: parseInt(params.page || "1", 10),
    limit: 15,
  });

  if (!res.success || !res.data) {
    return (
      <div className="rounded-2xl border border-rose-200 bg-rose-50 p-6 text-center text-xs font-semibold text-rose-700">
        {res.error || "Failed to load users."}
      </div>
    );
  }

  return (
    <AdminUsersClient
      initialUsers={res.data.users as any}
      total={res.data.total}
      currentPage={res.data.page}
      totalPages={res.data.totalPages}
      initialFilters={{
        search: params.search,
        role: params.role,
      }}
    />
  );
}

export default function AdminUsersPage({ searchParams }: AdminUsersPageProps) {
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
      <UsersLoader searchParams={searchParams} />
    </Suspense>
  );
}
