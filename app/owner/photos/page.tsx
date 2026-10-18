import { Suspense } from "react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/session";
import { getOwnerPropertiesAction } from "@/actions/owner";
import {
  Image as ImageIcon,
  Building2,
  ChevronRight,
  ArrowRight,
  Plus,
} from "lucide-react";

export const metadata = {
  title: "Property & Room Photos | StayKro Owner",
  description: "Select a property to upload and manage Cloudflare R2 gallery photos.",
};

async function PhotosDataLoader() {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/login?returnUrl=/owner/photos");
  }

  const { properties = [] } = await getOwnerPropertiesAction();

  if (properties.length === 1) {
    redirect(`/owner/properties/${properties[0].id}/photos`);
  }

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-2xs">
        <h1 className="text-xl font-bold tracking-tight text-slate-900">Property Photos & Media</h1>
        <p className="text-xs text-slate-500 mt-1">
          Select a property to manage exterior, facade, dining area, and bedroom photo galleries hosted on Cloudflare R2.
        </p>
      </div>

      {properties.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-12 text-center">
          <ImageIcon className="h-10 w-10 text-slate-300 mx-auto mb-3" />
          <h3 className="text-sm font-bold text-slate-900">No Properties Found</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1 mb-4">
            List a property first before managing gallery photos.
          </p>
          <Link
            href="/owner/onboarding"
            className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2 text-xs font-bold text-white hover:bg-indigo-700"
          >
            <Plus className="h-4 w-4" />
            <span>Create Property</span>
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {properties.map((p: any) => {
            const coverImage = p.images?.find((img: any) => img.isCover) || p.images?.[0];
            const photoCount = p.images?.length || 0;

            return (
              <div
                key={p.id}
                className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-2xs flex flex-col justify-between hover:border-slate-300 transition-all"
              >
                <div>
                  <div className="relative h-44 w-full bg-slate-100">
                    {coverImage ? (
                      <img
                        src={coverImage.url}
                        alt={p.name}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center text-slate-400">
                        <ImageIcon className="h-10 w-10 opacity-30" />
                      </div>
                    )}
                    <span className="absolute bottom-2.5 right-2.5 rounded-lg bg-black/60 backdrop-blur-xs px-2.5 py-1 text-[11px] font-semibold text-white">
                      {photoCount} {photoCount === 1 ? "Photo" : "Photos"}
                    </span>
                  </div>

                  <div className="p-5">
                    <span className="text-xs font-semibold text-slate-400">
                      {p.locality}, {p.city}
                    </span>
                    <h3 className="text-base font-bold text-slate-900 line-clamp-1 mt-0.5">
                      {p.name}
                    </h3>
                  </div>
                </div>

                <div className="p-5 pt-0">
                  <Link
                    href={`/owner/properties/${p.id}/photos`}
                    className="flex items-center justify-center gap-2 rounded-xl bg-indigo-50 px-4 py-2 text-xs font-bold text-indigo-700 hover:bg-indigo-100 transition-colors w-full"
                  >
                    <span>Manage Photos</span>
                    <ArrowRight className="h-3.5 w-3.5" />
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default function OwnerPhotosPage() {
  return (
    <Suspense
      fallback={
        <div className="mx-auto max-w-7xl px-4 py-16 text-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-indigo-600 border-t-transparent mx-auto mb-4" />
          <p className="text-sm font-semibold text-slate-500">Loading properties...</p>
        </div>
      }
    >
      <PhotosDataLoader />
    </Suspense>
  );
}
