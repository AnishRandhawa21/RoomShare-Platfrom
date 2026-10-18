import { Suspense } from "react";
import { notFound, redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/session";
import { getOwnerPropertyDetailAction } from "@/actions/owner";
import { PropertyDetailClient } from "@/components/owner/PropertyDetailClient";

interface PropertyDetailPageProps {
  params: Promise<{ id: string }>;
}

export const metadata = {
  title: "Property Hub & Overview | StayKro Owner",
  description: "Manage property room types, inventory, photos, and readiness.",
};

async function PropertyLoader({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await getCurrentUser();
  if (!user) {
    redirect(`/login?returnUrl=/owner/properties/${id}`);
  }

  const res = await getOwnerPropertyDetailAction(id);
  if (!res.success || !res.property) {
    notFound();
  }

  return <PropertyDetailClient property={res.property} />;
}

export default function PropertyDetailPage({ params }: PropertyDetailPageProps) {
  return (
    <Suspense
      fallback={
        <div className="mx-auto max-w-7xl px-4 py-16 text-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-indigo-600 border-t-transparent mx-auto mb-4" />
          <p className="text-sm font-semibold text-slate-500">Loading property hub details...</p>
        </div>
      }
    >
      <PropertyLoader params={params} />
    </Suspense>
  );
}
