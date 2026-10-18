"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { PropertySubNav } from "./PropertySubNav";
import { updateOwnerPropertyAmenitiesAction } from "@/actions/owner";
import {
  CheckSquare,
  Square,
  Save,
  CheckCircle2,
  AlertCircle,
  Loader2,
} from "lucide-react";

interface AmenityItem {
  id: string;
  name: string;
  category: string;
  iconName?: string | null;
  description?: string | null;
}

interface PropertyAmenitiesClientProps {
  property: {
    id: string;
    name: string;
    slug: string;
    status: string;
    selectedAmenityIds: string[];
  };
  catalogAmenities: AmenityItem[];
}

export function PropertyAmenitiesClient({
  property,
  catalogAmenities,
}: PropertyAmenitiesClientProps) {
  const router = useRouter();
  const [selectedIds, setSelectedIds] = useState<string[]>(property.selectedAmenityIds || []);
  const [isSaving, setIsSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Group catalog amenities by category
  const categories = Array.from(new Set(catalogAmenities.map((a) => a.category || "General")));

  const toggleAmenity = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleSave = async () => {
    setIsSaving(true);
    setErrorMessage(null);
    setSuccessMessage(null);

    try {
      const res = await updateOwnerPropertyAmenitiesAction(property.id, selectedIds);
      if (res.success) {
        setSuccessMessage("Property amenities updated successfully!");
        router.refresh();
      } else {
        setErrorMessage(res.error || "Failed to update amenities.");
      }
    } catch {
      setErrorMessage("Network error while saving amenities.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <PropertySubNav
        propertyId={property.id}
        propertySlug={property.slug}
        propertyName={property.name}
        status={property.status}
      />

      {/* Header Bar with Sticky/Action Save */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-2xl border border-slate-200/80 bg-white p-5 shadow-2xs">
        <div>
          <h2 className="text-base font-bold text-slate-900">Property Amenities & Facilities</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Select the amenities provided across this PG. ({selectedIds.length} selected)
          </p>
        </div>

        <button
          onClick={handleSave}
          disabled={isSaving}
          className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-xs font-bold text-white shadow-xs hover:bg-indigo-700 transition-colors disabled:opacity-50"
        >
          {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
          <span>{isSaving ? "Saving Amenities..." : "Save Amenities"}</span>
        </button>
      </div>

      {/* Alerts */}
      {errorMessage && (
        <div className="flex items-center gap-2 rounded-xl bg-rose-50 border border-rose-200 p-3.5 text-xs text-rose-700">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}
      {successMessage && (
        <div className="flex items-center gap-2 rounded-xl bg-emerald-50 border border-emerald-200 p-3.5 text-xs text-emerald-700">
          <CheckCircle2 className="h-4 w-4 shrink-0" />
          <span>{successMessage}</span>
        </div>
      )}

      {/* Amenities by Category */}
      <div className="space-y-6">
        {categories.map((category) => {
          const amenitiesInCategory = catalogAmenities.filter(
            (a) => (a.category || "General") === category
          );

          return (
            <div
              key={category}
              className="rounded-2xl border border-slate-200/80 bg-white p-5 sm:p-6 shadow-2xs"
            >
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-4">
                {category} Facilities
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                {amenitiesInCategory.map((amenity) => {
                  const isChecked = selectedIds.includes(amenity.id);
                  return (
                    <div
                      key={amenity.id}
                      onClick={() => toggleAmenity(amenity.id)}
                      className={`cursor-pointer flex items-start gap-3 rounded-xl border p-3.5 transition-all select-none ${
                        isChecked
                          ? "border-indigo-600 bg-indigo-50/40 text-indigo-950 shadow-2xs"
                          : "border-slate-200 bg-white text-slate-700 hover:border-slate-300 hover:bg-slate-50/50"
                      }`}
                    >
                      <div className="mt-0.5 shrink-0 text-indigo-600">
                        {isChecked ? (
                          <CheckSquare className="h-4 w-4" />
                        ) : (
                          <Square className="h-4 w-4 text-slate-300" />
                        )}
                      </div>
                      <div className="text-xs">
                        <div className="font-bold text-slate-900">{amenity.name}</div>
                        {amenity.description && (
                          <div className="text-slate-500 mt-0.5 text-[11px]">
                            {amenity.description}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
