"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { updateOwnerProfileAction } from "@/actions/owner";
import {
  Save,
  CheckCircle2,
  AlertCircle,
  Loader2,
  ShieldCheck,
  Mail,
} from "lucide-react";

interface OwnerProfileClientProps {
  initialData: {
    fullName: string;
    email: string;
    businessName: string;
    contactPhone: string;
    whatsappNumber: string;
    altPhone: string;
    isVerified: boolean;
  };
}

export function OwnerProfileClient({ initialData }: OwnerProfileClientProps) {
  const router = useRouter();
  const [formData, setFormData] = useState({
    fullName: initialData.fullName || "",
    businessName: initialData.businessName || "",
    contactPhone: initialData.contactPhone || "",
    whatsappNumber: initialData.whatsappNumber || "",
    altPhone: initialData.altPhone || "",
  });

  const [isSaving, setIsSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setErrorMessage(null);
    setSuccessMessage(null);

    try {
      const res = await updateOwnerProfileAction({
        fullName: formData.fullName,
        businessName: formData.businessName,
        contactPhone: formData.contactPhone,
        whatsappNumber: formData.whatsappNumber,
        altPhone: formData.altPhone,
      });

      if (res.success) {
        setSuccessMessage("Owner profile details saved successfully.");
        router.refresh();
      } else {
        setErrorMessage(res.error || "Failed to update profile.");
      }
    } catch {
      setErrorMessage("Network error while updating profile.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-2xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold tracking-tight text-slate-900">Owner Profile</h1>
              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-0.5 text-[10px] font-bold text-emerald-700 border border-emerald-200">
                <ShieldCheck className="h-3 w-3" />
                <span>Verified Partner</span>
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Manage your business identity, manager contact number, and WhatsApp notification details.
            </p>
          </div>
        </div>
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

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-2xs space-y-4">
          <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400">
            Account & Business Identity
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Full Name / Primary Contact *
              </label>
              <input
                type="text"
                required
                value={formData.fullName}
                onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-xs focus:border-indigo-600 focus:outline-hidden"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Business / Enterprise Brand Name (Optional)
              </label>
              <input
                type="text"
                placeholder="e.g. Royal Living Stays LLP"
                value={formData.businessName}
                onChange={(e) => setFormData({ ...formData, businessName: e.target.value })}
                className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-xs focus:border-indigo-600 focus:outline-hidden"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Account Email
            </label>
            <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-xs text-slate-500">
              <Mail className="h-4 w-4 text-slate-400" />
              <span>{initialData.email}</span>
              <span className="ml-auto text-[10px] text-slate-400 italic">Managed by Supabase Auth</span>
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-2xs space-y-4">
          <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400">
            Contact & Lead Routing Numbers
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Primary Contact Phone *
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
                WhatsApp Phone Number
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
                Alternative Phone (Optional)
              </label>
              <input
                type="text"
                value={formData.altPhone}
                onChange={(e) => setFormData({ ...formData, altPhone: e.target.value })}
                className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-xs focus:border-indigo-600 focus:outline-hidden"
              />
            </div>
          </div>
        </div>

        <div className="flex justify-end">
          <button
            type="submit"
            disabled={isSaving}
            className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-5 py-2.5 text-xs font-bold text-white shadow-xs hover:bg-indigo-700 disabled:opacity-50 transition-colors"
          >
            {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            <span>{isSaving ? "Saving..." : "Save Profile Details"}</span>
          </button>
        </div>
      </form>
    </div>
  );
}
