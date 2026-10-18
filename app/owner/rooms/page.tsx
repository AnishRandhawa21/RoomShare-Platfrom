import { Suspense } from "react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/session";
import { getOwnerPropertiesAction } from "@/actions/owner";
import {
  BedDouble,
  Building2,
  ChevronRight,
  ArrowRight,
  Layers,
  Plus,
} from "lucide-react";

export const metadata = {
  title: "Room Inventory & Occupancy | StayKro Owner",
  description: "Select a property to view and manage individual rooms, bed inventory, and occupancy status.",
};

async function RoomsDataLoader() {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/login?returnUrl=/owner/rooms");
  }

  const { properties = [] } = await getOwnerPropertiesAction();

  if (properties.length === 1) {
    redirect(`/owner/properties/${properties[0].id}/rooms`);
  }

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-2xs">
        <h1 className="text-xl font-bold tracking-tight text-slate-900">Room Inventory & Occupancy</h1>
        <p className="text-xs text-slate-500 mt-1">
          Select a property to configure individual room numbers, update bed occupancy, or mark rooms under maintenance.
        </p>
      </div>

      {properties.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-12 text-center">
          <BedDouble className="h-10 w-10 text-slate-300 mx-auto mb-3" />
          <h3 className="text-sm font-bold text-slate-900">No Properties Found</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1 mb-4">
            You need to create your first PG before managing room numbers and beds.
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
            let totalRooms = 0;
            let totalBeds = 0;
            let occupiedBeds = 0;

            p.roomTypes?.forEach((rt: any) => {
              rt.rooms?.forEach((r: any) => {
                totalRooms += 1;
                totalBeds += rt.occupancy;
                occupiedBeds += r.occupiedBeds;
              });
            });

            const availableBeds = Math.max(0, totalBeds - occupiedBeds);

            return (
              <div
                key={p.id}
                className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-2xs flex flex-col justify-between hover:border-slate-300 transition-all"
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-semibold text-slate-400">
                      {p.locality}, {p.city}
                    </span>
                    <span
                      className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${
                        p.status === "PUBLISHED"
                          ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                          : "bg-slate-100 text-slate-600 border border-slate-200"
                      }`}
                    >
                      {p.status}
                    </span>
                  </div>

                  <h3 className="text-base font-bold text-slate-900 line-clamp-1">{p.name}</h3>

                  <div className="mt-4 grid grid-cols-3 gap-2 bg-slate-50 p-3 rounded-xl text-center">
                    <div>
                      <div className="text-[10px] font-semibold text-slate-400">Rooms</div>
                      <div className="text-sm font-extrabold text-slate-800">{totalRooms}</div>
                    </div>
                    <div>
                      <div className="text-[10px] font-semibold text-slate-400">Total Beds</div>
                      <div className="text-sm font-extrabold text-slate-800">{totalBeds}</div>
                    </div>
                    <div>
                      <div className="text-[10px] font-semibold text-emerald-600">Available</div>
                      <div className="text-sm font-extrabold text-emerald-600">{availableBeds}</div>
                    </div>
                  </div>
                </div>

                <div className="mt-5 pt-3 border-t border-slate-100">
                  <Link
                    href={`/owner/properties/${p.id}/rooms`}
                    className="flex items-center justify-center gap-2 rounded-xl bg-indigo-50 px-4 py-2 text-xs font-bold text-indigo-700 hover:bg-indigo-100 transition-colors w-full"
                  >
                    <span>Manage Room Inventory</span>
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

export default function OwnerRoomsPage() {
  return (
    <Suspense
      fallback={
        <div className="mx-auto max-w-7xl px-4 py-16 text-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-indigo-600 border-t-transparent mx-auto mb-4" />
          <p className="text-sm font-semibold text-slate-500">Loading room inventory...</p>
        </div>
      }
    >
      <RoomsDataLoader />
    </Suspense>
  );
}
