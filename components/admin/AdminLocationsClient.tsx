"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  MapPin,
  Plus,
  CheckCircle,
  XCircle,
  Building,
  Navigation,
  Loader2,
  AlertCircle,
  Trash2,
} from "lucide-react";
import {
  createAdminStateAction,
  updateAdminStateAction,
  deleteAdminStateAction,
  createAdminCityAction,
  updateAdminCityAction,
  deleteAdminCityAction,
  createAdminLocalityAction,
  updateAdminLocalityAction,
  deleteAdminLocalityAction,
  resolveAdminLocalityRequestAction,
} from "@/actions/admin";
import { AdminConfirmDialog } from "./AdminConfirmDialog";

interface StateData {
  id: string;
  name: string;
  code: string | null;
  isActive: boolean;
  cities: {
    id: string;
    name: string;
    slug: string;
    isActive: boolean;
    localities: {
      id: string;
      name: string;
      slug: string;
      postalCode: string | null;
      isActive: boolean;
    }[];
    _count: { localities: number };
  }[];
}

interface LocalityRequestData {
  id: string;
  stateName: string;
  cityName: string;
  localityName: string;
  notes: string | null;
  createdAt: Date | string;
  requestedBy: {
    email: string | null;
    profile: { fullName: string } | null;
  };
}

export function AdminLocationsClient({
  states,
  pendingLocalityRequests,
}: {
  states: StateData[];
  pendingLocalityRequests: LocalityRequestData[];
}) {
  const router = useRouter();

  const [activeTab, setActiveTab] = useState<"catalog" | "requests">("catalog");
  const [selectedStateId, setSelectedStateId] = useState<string>(states[0]?.id || "");
  const [selectedCityId, setSelectedCityId] = useState<string>(
    states[0]?.cities[0]?.id || ""
  );

  // Modal forms
  const [modalType, setModalType] = useState<"state" | "city" | "locality" | null>(null);
  const [formStateName, setFormStateName] = useState("");
  const [formStateCode, setFormStateCode] = useState("");
  const [formCityName, setFormCityName] = useState("");
  const [formLocalityName, setFormLocalityName] = useState("");
  const [formPostalCode, setFormPostalCode] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const [deleteConfirm, setDeleteConfirm] = useState<{
    isOpen: boolean;
    type: "state" | "city" | "locality";
    id: string;
    name: string;
    subCount?: number;
  }>({
    isOpen: false,
    type: "locality",
    id: "",
    name: "",
  });

  const handleConfirmDelete = async () => {
    if (!deleteConfirm.id) return;
    setIsSubmitting(true);
    let res: { success: boolean; error?: string };

    if (deleteConfirm.type === "state") {
      res = await deleteAdminStateAction(deleteConfirm.id);
      if (res.success && selectedStateId === deleteConfirm.id) {
        const remaining = states.filter((s) => s.id !== deleteConfirm.id);
        setSelectedStateId(remaining[0]?.id || "");
        setSelectedCityId(remaining[0]?.cities[0]?.id || "");
      }
    } else if (deleteConfirm.type === "city") {
      res = await deleteAdminCityAction(deleteConfirm.id);
      if (res.success && selectedCityId === deleteConfirm.id) {
        const remaining = currentState?.cities.filter((c) => c.id !== deleteConfirm.id);
        setSelectedCityId(remaining?.[0]?.id || "");
      }
    } else {
      res = await deleteAdminLocalityAction(deleteConfirm.id);
    }

    setIsSubmitting(false);
    setDeleteConfirm((prev) => ({ ...prev, isOpen: false }));
    if (!res.success) {
      alert(res.error || "Failed to delete location.");
    } else {
      router.refresh();
    }
  };

  const currentState = states.find((s) => s.id === selectedStateId) || states[0];
  const currentCity = currentState?.cities.find((c) => c.id === selectedCityId) || currentState?.cities[0];

  const handleCreateState = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setErrorMessage(null);

    const res = await createAdminStateAction({
      name: formStateName,
      code: formStateCode || undefined,
    });

    setIsSubmitting(false);
    if (res.success) {
      setModalType(null);
      setFormStateName("");
      setFormStateCode("");
      router.refresh();
    } else {
      setErrorMessage(res.error || "Failed to create state.");
    }
  };

  const handleCreateCity = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStateId) return;
    setIsSubmitting(true);
    setErrorMessage(null);

    const res = await createAdminCityAction({
      stateId: selectedStateId,
      name: formCityName,
    });

    setIsSubmitting(false);
    if (res.success) {
      setModalType(null);
      setFormCityName("");
      router.refresh();
    } else {
      setErrorMessage(res.error || "Failed to create city.");
    }
  };

  const handleCreateLocality = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentCity) return;
    setIsSubmitting(true);
    setErrorMessage(null);

    const res = await createAdminLocalityAction({
      cityId: currentCity.id,
      name: formLocalityName,
      postalCode: formPostalCode || undefined,
    });

    setIsSubmitting(false);
    if (res.success) {
      setModalType(null);
      setFormLocalityName("");
      setFormPostalCode("");
      router.refresh();
    } else {
      setErrorMessage(res.error || "Failed to create locality.");
    }
  };

  const toggleStateActive = async (s: StateData) => {
    await updateAdminStateAction({
      stateId: s.id,
      isActive: !s.isActive,
    });
    router.refresh();
  };

  const toggleCityActive = async (c: any) => {
    await updateAdminCityAction({
      cityId: c.id,
      isActive: !c.isActive,
    });
    router.refresh();
  };

  const toggleLocalityActive = async (loc: any) => {
    await updateAdminLocalityAction({
      localityId: loc.id,
      isActive: !loc.isActive,
    });
    router.refresh();
  };

  const resolveRequest = async (requestId: string, status: "RESOLVED" | "DISMISSED") => {
    await resolveAdminLocalityRequestAction({
      requestId,
      status: status as any,
    });
    router.refresh();
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-zinc-950 tracking-tight">
            Location Master Data
          </h1>
          <p className="text-xs text-zinc-500 mt-0.5">
            Hierarchical geographic registry: State &rarr; City &rarr; Locality &rarr; Property.
          </p>
        </div>

        {/* Tab switch */}
        <div className="flex items-center gap-1.5 p-1 rounded-xl bg-zinc-100 border border-zinc-200">
          <button
            type="button"
            onClick={() => setActiveTab("catalog")}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              activeTab === "catalog" ? "bg-white text-zinc-900 shadow-2xs" : "text-zinc-600 hover:text-zinc-900"
            }`}
          >
            Location Registry
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("requests")}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
              activeTab === "requests" ? "bg-white text-zinc-900 shadow-2xs" : "text-zinc-600 hover:text-zinc-900"
            }`}
          >
            <span>Locality Requests</span>
            {pendingLocalityRequests.length > 0 && (
              <span className="rounded-full bg-amber-500 text-white px-1.5 py-0.2 text-[10px] font-bold">
                {pendingLocalityRequests.length}
              </span>
            )}
          </button>
        </div>
      </div>

      {activeTab === "catalog" ? (
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-start">
          {/* Column 1: States (3 cols) */}
          <div className="md:col-span-3 rounded-2xl border border-zinc-200 bg-white p-4 shadow-2xs space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-xs font-bold uppercase tracking-wider text-zinc-400">
                1. States ({states.length})
              </h2>
              <button
                type="button"
                onClick={() => setModalType("state")}
                className="p-1 rounded-lg hover:bg-zinc-100 text-violet-600"
                title="Add New State"
              >
                <Plus className="h-4 w-4" />
              </button>
            </div>

            <div className="space-y-1">
              {states.map((s) => (
                <div
                  key={s.id}
                  onClick={() => {
                    setSelectedStateId(s.id);
                    setSelectedCityId(s.cities[0]?.id || "");
                  }}
                  className={`flex items-center justify-between p-2.5 rounded-xl text-xs font-semibold cursor-pointer transition-all ${
                    s.id === currentState?.id
                      ? "bg-violet-50 text-violet-900 font-bold border border-violet-200"
                      : "text-zinc-700 hover:bg-zinc-50"
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <span>{s.name}</span>
                    {s.code && <span className="text-[10px] text-zinc-400 font-mono">({s.code})</span>}
                  </div>
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleStateActive(s);
                      }}
                      title={s.isActive ? "Active (Click to Deactivate)" : "Inactive"}
                      className={`h-2.5 w-2.5 rounded-full ${s.isActive ? "bg-emerald-500" : "bg-zinc-300"}`}
                    />
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setDeleteConfirm({
                          isOpen: true,
                          type: "state",
                          id: s.id,
                          name: s.name,
                          subCount: s.cities.length,
                        });
                      }}
                      title="Delete State"
                      className="p-1 rounded-md text-zinc-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Column 2: Cities in selected State (4 cols) */}
          <div className="md:col-span-4 rounded-2xl border border-zinc-200 bg-white p-4 shadow-2xs space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-xs font-bold uppercase tracking-wider text-zinc-400">
                2. Cities in {currentState?.name} ({currentState?.cities.length || 0})
              </h2>
              <button
                type="button"
                onClick={() => setModalType("city")}
                className="p-1 rounded-lg hover:bg-zinc-100 text-violet-600"
                title={`Add City to ${currentState?.name}`}
              >
                <Plus className="h-4 w-4" />
              </button>
            </div>

            <div className="space-y-1">
              {!currentState?.cities.length ? (
                <p className="text-xs text-zinc-400 py-6 text-center">No cities added yet.</p>
              ) : (
                currentState.cities.map((c) => (
                  <div
                    key={c.id}
                    onClick={() => setSelectedCityId(c.id)}
                    className={`flex items-center justify-between p-2.5 rounded-xl text-xs font-semibold cursor-pointer transition-all ${
                      c.id === currentCity?.id
                        ? "bg-violet-50 text-violet-900 font-bold border border-violet-200"
                        : "text-zinc-700 hover:bg-zinc-50"
                    }`}
                  >
                    <div>
                      <span>{c.name}</span>
                      <span className="text-[10px] text-zinc-400 block font-normal">
                        {c._count.localities} localities
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleCityActive(c);
                        }}
                        title={c.isActive ? "Active (Click to Deactivate)" : "Inactive"}
                        className={`h-2.5 w-2.5 rounded-full ${c.isActive ? "bg-emerald-500" : "bg-zinc-300"}`}
                      />
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setDeleteConfirm({
                            isOpen: true,
                            type: "city",
                            id: c.id,
                            name: c.name,
                            subCount: c._count.localities,
                          });
                        }}
                        title="Delete City"
                        className="p-1 rounded-md text-zinc-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Column 3: Localities in selected City (5 cols) */}
          <div className="md:col-span-5 rounded-2xl border border-zinc-200 bg-white p-4 shadow-2xs space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-xs font-bold uppercase tracking-wider text-zinc-400">
                3. Localities in {currentCity?.name} ({currentCity?.localities.length || 0})
              </h2>
              <button
                type="button"
                onClick={() => setModalType("locality")}
                className="p-1 rounded-lg hover:bg-zinc-100 text-violet-600"
                title={`Add Locality to ${currentCity?.name}`}
              >
                <Plus className="h-4 w-4" />
              </button>
            </div>

            <div className="space-y-1">
              {!currentCity?.localities.length ? (
                <p className="text-xs text-zinc-400 py-6 text-center">No localities in this city.</p>
              ) : (
                currentCity.localities.map((loc) => (
                  <div
                    key={loc.id}
                    className="flex items-center justify-between p-2.5 rounded-xl border border-zinc-100 bg-zinc-50/60 text-xs font-semibold"
                  >
                    <div>
                      <span className="text-zinc-900 font-bold">{loc.name}</span>
                      {loc.postalCode && (
                        <span className="text-[10px] text-zinc-400 block font-mono">
                          PIN: {loc.postalCode}
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => toggleLocalityActive(loc)}
                        title={loc.isActive ? "Active locality (Visible in PG Creation)" : "Inactive"}
                        className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
                          loc.isActive
                            ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                            : "bg-zinc-100 text-zinc-500"
                        }`}
                      >
                        {loc.isActive ? "Active" : "Disabled"}
                      </button>
                      <button
                        type="button"
                        onClick={() =>
                          setDeleteConfirm({
                            isOpen: true,
                            type: "locality",
                            id: loc.id,
                            name: loc.name,
                          })
                        }
                        title="Delete Locality"
                        className="p-1 rounded-md text-zinc-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      ) : (
        /* Tab 2: Locality Requests from Landlords & Tenants */
        <div className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-2xs space-y-4">
          <h2 className="text-sm font-bold text-zinc-950">
            Pending Locality Requests ({pendingLocalityRequests.length})
          </h2>

          {pendingLocalityRequests.length === 0 ? (
            <p className="text-xs text-zinc-400 py-8 text-center">
              No pending locality requests. All owner requests are resolved.
            </p>
          ) : (
            <div className="space-y-3">
              {pendingLocalityRequests.map((req) => (
                <div
                  key={req.id}
                  className="rounded-xl border border-zinc-200 bg-zinc-50/60 p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 text-xs"
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <strong className="text-sm text-zinc-950">{req.localityName}</strong>
                      <span className="rounded-md bg-zinc-100 px-2 py-0.5 font-medium text-zinc-700 text-[11px]">
                        {req.cityName}, {req.stateName}
                      </span>
                    </div>
                    <span className="text-[11px] text-zinc-500 mt-1 block">
                      Requested by: {req.requestedBy.profile?.fullName || req.requestedBy.email}
                      {req.notes && ` • Note: "${req.notes}"`}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => resolveRequest(req.id, "RESOLVED")}
                      className="rounded-xl bg-emerald-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-emerald-700 cursor-pointer"
                    >
                      Approve & Add
                    </button>
                    <button
                      type="button"
                      onClick={() => resolveRequest(req.id, "DISMISSED")}
                      className="rounded-xl border border-zinc-200 bg-white px-3 py-1.5 text-xs font-semibold text-zinc-600 hover:bg-zinc-50 cursor-pointer"
                    >
                      Dismiss
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Add Modal */}
      {modalType && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
          <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-2xl border border-zinc-200 space-y-4">
            <h3 className="text-base font-bold text-zinc-950">
              {modalType === "state"
                ? "Add Indian State"
                : modalType === "city"
                ? `Add City in ${currentState?.name}`
                : `Add Locality in ${currentCity?.name}`}
            </h3>

            {errorMessage && (
              <div className="rounded-xl bg-rose-50 p-2.5 text-xs font-semibold text-rose-700">
                {errorMessage}
              </div>
            )}

            {modalType === "state" && (
              <form onSubmit={handleCreateState} className="space-y-3 text-xs">
                <div>
                  <label className="font-semibold text-zinc-700 block mb-1">State Name</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Punjab, Maharashtra"
                    value={formStateName}
                    onChange={(e) => setFormStateName(e.target.value)}
                    className="w-full rounded-xl border border-zinc-200 p-2.5 font-medium"
                  />
                </div>
                <div>
                  <label className="font-semibold text-zinc-700 block mb-1">State Code (Optional)</label>
                  <input
                    type="text"
                    placeholder="e.g. PB, MH"
                    value={formStateCode}
                    onChange={(e) => setFormStateCode(e.target.value)}
                    className="w-full rounded-xl border border-zinc-200 p-2.5 font-medium uppercase"
                  />
                </div>
                <div className="flex justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setModalType(null)}
                    className="rounded-xl border border-zinc-200 px-3.5 py-2 font-semibold"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="rounded-xl bg-zinc-950 text-white px-4 py-2 font-bold cursor-pointer"
                  >
                    {isSubmitting ? "Creating..." : "Save State"}
                  </button>
                </div>
              </form>
            )}

            {modalType === "city" && (
              <form onSubmit={handleCreateCity} className="space-y-3 text-xs">
                <div>
                  <label className="font-semibold text-zinc-700 block mb-1">City Name</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Jalandhar, Phagwara"
                    value={formCityName}
                    onChange={(e) => setFormCityName(e.target.value)}
                    className="w-full rounded-xl border border-zinc-200 p-2.5 font-medium"
                  />
                </div>
                <div className="flex justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setModalType(null)}
                    className="rounded-xl border border-zinc-200 px-3.5 py-2 font-semibold"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="rounded-xl bg-zinc-950 text-white px-4 py-2 font-bold cursor-pointer"
                  >
                    {isSubmitting ? "Creating..." : "Save City"}
                  </button>
                </div>
              </form>
            )}

            {modalType === "locality" && (
              <form onSubmit={handleCreateLocality} className="space-y-3 text-xs">
                <div>
                  <label className="font-semibold text-zinc-700 block mb-1">Locality Name</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Lawgate, Green Valley"
                    value={formLocalityName}
                    onChange={(e) => setFormLocalityName(e.target.value)}
                    className="w-full rounded-xl border border-zinc-200 p-2.5 font-medium"
                  />
                </div>
                <div>
                  <label className="font-semibold text-zinc-700 block mb-1">PIN Code (Optional)</label>
                  <input
                    type="text"
                    placeholder="e.g. 144411"
                    value={formPostalCode}
                    onChange={(e) => setFormPostalCode(e.target.value)}
                    className="w-full rounded-xl border border-zinc-200 p-2.5 font-medium font-mono"
                  />
                </div>
                <div className="flex justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setModalType(null)}
                    className="rounded-xl border border-zinc-200 px-3.5 py-2 font-semibold"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="rounded-xl bg-zinc-950 text-white px-4 py-2 font-bold cursor-pointer"
                  >
                    {isSubmitting ? "Creating..." : "Save Locality"}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      <AdminConfirmDialog
        isOpen={deleteConfirm.isOpen}
        title={`Delete ${deleteConfirm.type.charAt(0).toUpperCase() + deleteConfirm.type.slice(1)}`}
        description={
          deleteConfirm.type === "state"
            ? `Are you sure you want to permanently delete the state "${deleteConfirm.name}"? This will also remove all its ${deleteConfirm.subCount || 0} cities and their localities from the master catalog.`
            : deleteConfirm.type === "city"
            ? `Are you sure you want to permanently delete the city "${deleteConfirm.name}"? This will also remove all its ${deleteConfirm.subCount || 0} localities from the master catalog.`
            : `Are you sure you want to permanently delete the locality "${deleteConfirm.name}" from the master catalog?`
        }
        confirmLabel={`Yes, Delete ${deleteConfirm.type.charAt(0).toUpperCase() + deleteConfirm.type.slice(1)}`}
        variant="danger"
        isLoading={isSubmitting}
        onConfirm={handleConfirmDelete}
        onClose={() => setDeleteConfirm((prev) => ({ ...prev, isOpen: false }))}
      />
    </div>
  );
}
