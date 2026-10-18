import { Suspense } from "react";
import { requireAdmin } from "@/lib/auth/session";
import { getAdminPaymentsAction } from "@/actions/admin";
import { AdminPaymentsClient } from "@/components/admin/AdminPaymentsClient";

export const metadata = {
  title: "Payments Ledger | Admin Portal",
  description: "Platform transactions, Razorpay order IDs, and payment verification records.",
};

interface AdminPaymentsPageProps {
  searchParams: Promise<{
    page?: string;
  }>;
}

async function PaymentsLoader({ searchParams }: { searchParams: Promise<{ page?: string }> }) {
  await requireAdmin("/admin/payments");
  const params = await searchParams;

  const res = await getAdminPaymentsAction({
    page: parseInt(params.page || "1", 10),
    limit: 15,
  });

  if (!res.success || !res.data) {
    return (
      <div className="rounded-2xl border border-rose-200 bg-rose-50 p-6 text-center text-xs font-semibold text-rose-700">
        {res.error || "Failed to load payments ledger."}
      </div>
    );
  }

  return (
    <AdminPaymentsClient
      initialPayments={res.data.payments as any}
      total={res.data.total}
      currentPage={res.data.page}
      totalPages={res.data.totalPages}
    />
  );
}

export default function AdminPaymentsPage({ searchParams }: AdminPaymentsPageProps) {
  return (
    <Suspense
      fallback={
        <div className="space-y-4 animate-pulse">
          <div className="h-20 bg-slate-100 rounded-2xl" />
          <div className="h-96 bg-slate-100 rounded-2xl" />
        </div>
      }
    >
      <PaymentsLoader searchParams={searchParams} />
    </Suspense>
  );
}
