import { Suspense } from "react";
import { notFound, redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/session";
import { getOwnerPropertyDetailAction } from "@/actions/owner";
import { PropertyEditClient } from "@/components/owner/PropertyEditClient";

interface PropertyEditPageProps {
  params: Promise<{ id: string }>;
}

export const metadata = {
  title: "Edit Property Information | StayKro Owner",
  description: "Update property basic info, house rules, timings, and contact numbers.",
};

async function PropertyEditLoader({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await getCurrentUser();
  if (!user) {
    redirect(`/login?returnUrl=/owner/properties/${id}/edit`);
  }

  const res = await getOwnerPropertyDetailAction(id);
  if (!res.success || !res.property) {
    notFound();
  }

  return <PropertyEditClient property={res.property} />;
}

export default function PropertyEditPage({ params }: PropertyEditPageProps) {
  return (
    <Suspense
      fallback={
        <div className="mx-auto max-w-7xl px-4 py-16 text-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-indigo-600 border-t-transparent mx-auto mb-4" />
          <p className="text-sm font-semibold text-slate-500">Loading property editor...</p>
        </div>
      }
    >
      <PropertyEditLoader params={params} />
    </Suspense>
  );
}
