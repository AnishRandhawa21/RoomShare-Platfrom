"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { PropertySubNav } from "./PropertySubNav";
import { updateOwnerPropertyAction } from "@/actions/owner";
import { LocationPickerMap } from "@/components/map/LocationPickerMap";
import {
  Save,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Plus,
  Trash2,
} from "lucide-react";

interface PropertyEditClientProps {
  property: any;
}

export function PropertyEditClient({ property }: PropertyEditClientProps) {
  const router = useRouter();
  const [formData, setFormData] = useState({
    name: property.name || "",
    description: property.description || "",
    propertyType: property.propertyType || "PG",
    genderPolicy: property.genderPolicy || "UNISEX",
    startingPrice: property.startingPrice !== undefined && property.startingPrice !== null ? String(property.startingPrice) : "",
    locality: property.locality || "",
    city: property.city || "",
    state: property.state || "",
    postalCode: property.postalCode || "",
    addressLine1: property.addressLine1 || "",
    addressLine2: property.addressLine2 || "",
    latitude: property.latitude ?? 12.9716,
    longitude: property.longitude ?? 77.5946,
    contactPhone: property.contactPhone || "",
    whatsappNumber: property.whatsappNumber || "",
    gateClosingTime: property.gateClosingTime || "",
    noticePeriodDays: property.noticePeriodDays || 30,
    foodIncluded: property.foodOffering === "NO_FOOD" ? false : Boolean(property.foodIncluded),
    foodOffering: property.foodOffering || "NO_FOOD",
    houseRules: (property.houseRules as string[]) || [
      "Gates close strictly at gate closing time",
      "No loud music after 10:00 PM",
      "Keep common areas clean",
    ],
  });

  const [ruleInput, setRuleInput] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const handleAddRule = () => {
    if (!ruleInput.trim()) return;
    setFormData((prev) => ({
      ...prev,
      houseRules: [...prev.houseRules, ruleInput.trim()],
    }));
    setRuleInput("");
  };

  const handleRemoveRule = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      houseRules: prev.houseRules.filter((_, i) => i !== index),
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setErrorMessage(null);
    setSuccessMessage(null);

    try {
      const res = await updateOwnerPropertyAction(property.id, {
        name: formData.name,
        description: formData.description,
        propertyType: formData.propertyType,
        genderPolicy: formData.genderPolicy,
        startingPrice: formData.startingPrice.trim() ? Number(formData.startingPrice) : null,
        locality: formData.locality,
        city: formData.city,
        state: formData.state,
        postalCode: formData.postalCode,
        addressLine1: formData.addressLine1,
        addressLine2: formData.addressLine2,
        contactPhone: formData.contactPhone,
        whatsappNumber: formData.whatsappNumber,
        gateClosingTime: formData.gateClosingTime,
        noticePeriodDays: Number(formData.noticePeriodDays),
        foodIncluded: formData.foodOffering === "NO_FOOD" ? false : Boolean(formData.foodIncluded),
        foodOffering: formData.foodOffering,
        houseRules: formData.houseRules,
        latitude: formData.latitude,
        longitude: formData.longitude,
      });

      if (res.success) {
        setSuccessMessage("Property information, price, and location updated successfully!");
        router.refresh();
      } else {
        setErrorMessage(res.error || "Failed to update property.");
      }
    } catch {
      setErrorMessage("Network error while saving changes.");
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

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Sticky Action Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-2xl border border-slate-200/80 bg-white p-5 shadow-2xs">
          <div>
            <h2 className="text-base font-bold text-slate-900">Edit Property Details & Rules</h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Update general information, timings, food options, and house policies.
            </p>
          </div>

          <button
            type="submit"
            disabled={isSaving}
            className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-xs font-bold text-white shadow-xs hover:bg-indigo-700 transition-colors disabled:opacity-50"
          >
            {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            <span>{isSaving ? "Saving..." : "Save Changes"}</span>
          </button>
        </div>

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

        {/* Basic Information Section */}
        <div className="rounded-2xl border border-slate-200/80 bg-white p-5 sm:p-6 shadow-2xs space-y-4">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
            Basic Information
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Property Name *
              </label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-xs focus:border-indigo-600 focus:outline-hidden"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Property Type *
              </label>
              <select
                value={formData.propertyType}
                onChange={(e) => setFormData({ ...formData, propertyType: e.target.value as any })}
                className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-xs focus:border-indigo-600 focus:outline-hidden"
              >
                <option value="PG">PG / Paying Guest</option>
                <option value="HOSTEL">Student Hostel</option>
                <option value="COLIVING">Co-Living Space</option>
                <option value="FLAT">Managed Flat / Apartment</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Gender Policy *
              </label>
              <select
                value={formData.genderPolicy}
                onChange={(e) => setFormData({ ...formData, genderPolicy: e.target.value as any })}
                className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-xs focus:border-indigo-600 focus:outline-hidden"
              >
                <option value="UNISEX">Unisex / Co-ed</option>
                <option value="MALE_ONLY">Men Only (Gents PG)</option>
                <option value="FEMALE_ONLY">Women Only (Ladies PG)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Starting Monthly Price (₹)
              </label>
              <input
                type="number"
                min={0}
                placeholder="e.g. 7500"
                value={formData.startingPrice}
                onChange={(e) =>
                  setFormData({ ...formData, startingPrice: e.target.value })
                }
                className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-xs focus:border-indigo-600 focus:outline-hidden font-bold text-slate-900"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Notice Period (Days)
              </label>
              <input
                type="number"
                min={0}
                value={formData.noticePeriodDays}
                onChange={(e) =>
                  setFormData({ ...formData, noticePeriodDays: Number(e.target.value) })
                }
                className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-xs focus:border-indigo-600 focus:outline-hidden"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Description & Highlights *
            </label>
            <textarea
              rows={4}
              required
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-xs focus:border-indigo-600 focus:outline-hidden"
              placeholder="Describe the atmosphere, nearby tech parks/colleges, housekeeping schedules, and security."
            />
          </div>
        </div>

        {/* Contact & Timings Section */}
        <div className="rounded-2xl border border-slate-200/80 bg-white p-5 sm:p-6 shadow-2xs space-y-4">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
            Contact & Timings
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Public Contact Phone *
              </label>
              <input
                type="text"
                required
                value={formData.contactPhone}
                onChange={(e) => setFormData({ ...formData, contactPhone: e.target.value })}
                className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-xs focus:border-indigo-600 focus:outline-hidden"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                WhatsApp Enquiry Number
              </label>
              <input
                type="text"
                placeholder="e.g. +91 9876543210"
                value={formData.whatsappNumber}
                onChange={(e) => setFormData({ ...formData, whatsappNumber: e.target.value })}
                className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-xs focus:border-indigo-600 focus:outline-hidden"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Gate Closing Time
              </label>
              <input
                type="text"
                placeholder="e.g. 10:30 PM (or No Restrictions)"
                value={formData.gateClosingTime}
                onChange={(e) => setFormData({ ...formData, gateClosingTime: e.target.value })}
                className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-xs focus:border-indigo-600 focus:outline-hidden"
              />
            </div>
          </div>
        </div>

        {/* Address Section */}
        <div className="rounded-2xl border border-slate-200/80 bg-white p-5 sm:p-6 shadow-2xs space-y-4">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
            Address Information
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Locality / Area *
              </label>
              <input
                type="text"
                required
                placeholder="e.g. Model Town, Law Gate, Koramangala 4th Block"
                value={formData.locality}
                onChange={(e) => setFormData({ ...formData, locality: e.target.value })}
                className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-xs focus:border-indigo-600 focus:outline-hidden"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                City *
              </label>
              <input
                type="text"
                required
                placeholder="e.g. Jalandhar, Phagwara, Bengaluru"
                value={formData.city}
                onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-xs focus:border-indigo-600 focus:outline-hidden"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                State *
              </label>
              <input
                type="text"
                required
                placeholder="e.g. Punjab, Karnataka"
                value={formData.state}
                onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-xs focus:border-indigo-600 focus:outline-hidden"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Postal Code / PIN
              </label>
              <input
                type="text"
                placeholder="e.g. 144411, 560034"
                value={formData.postalCode}
                onChange={(e) => setFormData({ ...formData, postalCode: e.target.value })}
                className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-xs focus:border-indigo-600 focus:outline-hidden"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Address Line 1 *
              </label>
              <input
                type="text"
                required
                value={formData.addressLine1}
                onChange={(e) => setFormData({ ...formData, addressLine1: e.target.value })}
                className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-xs focus:border-indigo-600 focus:outline-hidden"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Address Line 2 (Optional)
              </label>
              <input
                type="text"
                value={formData.addressLine2}
                onChange={(e) => setFormData({ ...formData, addressLine2: e.target.value })}
                className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-xs focus:border-indigo-600 focus:outline-hidden"
              />
            </div>
          </div>

          <div className="pt-2 border-t border-slate-100">
            <div className="mb-2">
              <span className="block text-xs font-semibold text-slate-700">Pin Location on Map</span>
              <span className="text-[11px] text-slate-400">Drag or click on the map to pin the exact coordinates for prospective tenants.</span>
            </div>
            <LocationPickerMap
              latitude={formData.latitude}
              longitude={formData.longitude}
              onChange={({ latitude, longitude }) => {
                setFormData((prev) => ({ ...prev, latitude, longitude }));
              }}
              city={formData.city || property.city}
              locality={formData.locality || property.locality}
            />
          </div>
        </div>

        {/* Food & Dining Section */}
        <div className="rounded-2xl border border-slate-200/80 bg-white p-5 sm:p-6 shadow-2xs space-y-4">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
            Food & Mess Details
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="flex items-center gap-3 pt-2">
              <input
                type="checkbox"
                id="foodIncluded"
                checked={formData.foodOffering === "NO_FOOD" ? false : Boolean(formData.foodIncluded)}
                disabled={formData.foodOffering === "NO_FOOD"}
                onChange={(e) => setFormData({ ...formData, foodIncluded: e.target.checked })}
                className="h-4 w-4 rounded text-indigo-600 focus:ring-indigo-500 disabled:opacity-50"
              />
              <label
                htmlFor="foodIncluded"
                className={`text-xs font-semibold ${
                  formData.foodOffering === "NO_FOOD"
                    ? "text-slate-400 cursor-not-allowed"
                    : "text-slate-900 cursor-pointer"
                }`}
              >
                Food / Mess Included in Monthly Rent
              </label>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Food Offering Type
              </label>
              <select
                value={formData.foodOffering}
                onChange={(e) => {
                  const val = e.target.value;
                  setFormData({
                    ...formData,
                    foodOffering: val as any,
                    foodIncluded: val === "NO_FOOD" ? false : formData.foodIncluded,
                  });
                }}
                className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-xs focus:border-indigo-600 focus:outline-hidden"
              >
                <option value="VEG_NONVEG">Veg & Non-Veg Meals</option>
                <option value="VEG_ONLY">Pure Veg Only</option>
                <option value="OPTIONAL">Optional / Paid Mess</option>
                <option value="NO_FOOD">Self Cooking / No Food</option>
              </select>
            </div>
          </div>
        </div>

        {/* House Rules Section */}
        <div className="rounded-2xl border border-slate-200/80 bg-white p-5 sm:p-6 shadow-2xs space-y-4">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
            House Rules & Guidelines
          </h3>

          <div className="flex gap-2">
            <input
              type="text"
              placeholder="e.g. Non-veg cooking is prohibited in rooms"
              value={ruleInput}
              onChange={(e) => setRuleInput(e.target.value)}
              className="flex-1 rounded-xl border border-slate-200 px-3.5 py-2.5 text-xs focus:border-indigo-600 focus:outline-hidden"
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  handleAddRule();
                }
              }}
            />
            <button
              type="button"
              onClick={handleAddRule}
              className="inline-flex items-center gap-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 px-4 py-2.5 text-xs font-bold text-slate-700"
            >
              <Plus className="h-4 w-4" />
              <span>Add</span>
            </button>
          </div>

          <div className="divide-y divide-slate-100">
            {formData.houseRules.map((rule, idx) => (
              <div key={idx} className="flex items-center justify-between py-2.5 text-xs text-slate-700">
                <span className="flex items-center gap-2">
                  <span className="h-1.5 w-1.5 rounded-full bg-indigo-600" />
                  <span>{rule}</span>
                </span>
                <button
                  type="button"
                  onClick={() => handleRemoveRule(idx)}
                  className="text-slate-400 hover:text-rose-600 p-1"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            ))}
          </div>
        </div>
      </form>
    </div>
  );
}
