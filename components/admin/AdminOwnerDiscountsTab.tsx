"use client";

import { useState, useTransition } from "react";
import {
  Percent,
  Search,
  Plus,
  Trash2,
  Edit3,
  Calendar,
  Building2,
  CheckCircle2,
  AlertCircle,
  Clock,
  Loader2,
  Sparkles,
  X,
  User,
  ShieldCheck,
  Check,
  SlidersHorizontal,
  ChevronDown,
  Info,
} from "lucide-react";
import {
  saveOwnerPricingOverrideAction,
  deleteOwnerPricingOverrideAction,
  toggleOwnerPricingOverrideAction,
  searchOwnersForDiscountAction,
  type UpsertOwnerPricingOverrideInput,
} from "@/actions/pricing";

export interface OwnerPricingOverrideItem {
  id: string;
  ownerProfileId: string;
  discountType: "PERCENTAGE" | "FIXED_PRICE";
  percentageOff?: number | null;
  customSoloPrice?: number | null;
  customPlusPrice?: number | null;
  reason?: string | null;
  expiresAt?: string | Date | null;
  isActive: boolean;
  createdAt: string | Date;
  ownerProfile: {
    id: string;
    contactPhone: string;
    businessName?: string | null;
    user: {
      id: string;
      email: string;
      phone?: string | null;
      profile?: {
        fullName?: string | null;
        avatarUrl?: string | null;
        city?: string | null;
      } | null;
    };
    _count?: {
      properties: number;
    };
  };
  createdByUser?: {
    id: string;
    email?: string | null;
    profile?: { fullName?: string | null } | null;
  } | null;
}

interface OwnerSearchResult {
  id: string;
  contactPhone: string;
  businessName?: string | null;
  user: {
    id: string;
    email: string;
    profile?: {
      fullName?: string | null;
      avatarUrl?: string | null;
      city?: string | null;
    } | null;
  };
  pricingOverride?: any;
  _count?: {
    properties: number;
  };
}

interface AdminOwnerDiscountsTabProps {
  initialOverrides: OwnerPricingOverrideItem[];
  soloBasePrice: number;
  plusBasePrice: number;
}

export function AdminOwnerDiscountsTab({
  initialOverrides,
  soloBasePrice,
  plusBasePrice,
}: AdminOwnerDiscountsTabProps) {
  const [overrides, setOverrides] = useState<OwnerPricingOverrideItem[]>(initialOverrides);
  const [searchFilter, setSearchFilter] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingOverride, setEditingOverride] = useState<OwnerPricingOverrideItem | null>(null);

  // Form State for Modal
  const [selectedOwner, setSelectedOwner] = useState<OwnerSearchResult | null>(null);
  const [ownerSearchQuery, setOwnerSearchQuery] = useState("");
  const [ownerSearchResults, setOwnerSearchResults] = useState<OwnerSearchResult[]>([]);
  const [isSearchingOwners, setIsSearchingOwners] = useState(false);

  const [discountType, setDiscountType] = useState<"PERCENTAGE" | "FIXED_PRICE">("PERCENTAGE");
  const [percentageOff, setPercentageOff] = useState<number | "">(20);
  const [customSoloPrice, setCustomSoloPrice] = useState<number | "">("");
  const [customPlusPrice, setCustomPlusPrice] = useState<number | "">("");
  const [reason, setReason] = useState("");
  const [expiryOption, setExpiryOption] = useState<"PERMANENT" | "30_DAYS" | "90_DAYS" | "CUSTOM">("PERMANENT");
  const [customExpiryDate, setCustomExpiryDate] = useState("");

  const [isPending, startTransition] = useTransition();
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; message: string } | null>(null);
  const [actionId, setActionId] = useState<string | null>(null);

  // Filter overrides list
  const filteredOverrides = overrides.filter((item) => {
    if (!searchFilter.trim()) return true;
    const q = searchFilter.toLowerCase();
    const fullName = item.ownerProfile?.user?.profile?.fullName?.toLowerCase() || "";
    const email = item.ownerProfile?.user?.email?.toLowerCase() || "";
    const phone = item.ownerProfile?.contactPhone?.toLowerCase() || "";
    const businessName = item.ownerProfile?.businessName?.toLowerCase() || "";
    return fullName.includes(q) || email.includes(q) || phone.includes(q) || businessName.includes(q);
  });

  // Open modal in create mode
  const handleOpenCreateModal = () => {
    setEditingOverride(null);
    setSelectedOwner(null);
    setOwnerSearchQuery("");
    setOwnerSearchResults([]);
    setDiscountType("PERCENTAGE");
    setPercentageOff(20);
    setCustomSoloPrice("");
    setCustomPlusPrice("");
    setReason("");
    setExpiryOption("PERMANENT");
    setCustomExpiryDate("");
    setIsModalOpen(true);
  };

  // Open modal in edit mode
  const handleOpenEditModal = (override: OwnerPricingOverrideItem) => {
    setEditingOverride(override);
    setSelectedOwner({
      id: override.ownerProfile.id,
      contactPhone: override.ownerProfile.contactPhone,
      businessName: override.ownerProfile.businessName,
      user: override.ownerProfile.user,
      _count: override.ownerProfile._count,
    });
    setOwnerSearchQuery(override.ownerProfile?.user?.profile?.fullName || override.ownerProfile.contactPhone);
    setOwnerSearchResults([]);
    setDiscountType(override.discountType);
    setPercentageOff(override.percentageOff ?? "");
    setCustomSoloPrice(override.customSoloPrice ?? "");
    setCustomPlusPrice(override.customPlusPrice ?? "");
    setReason(override.reason || "");

    if (!override.expiresAt) {
      setExpiryOption("PERMANENT");
      setCustomExpiryDate("");
    } else {
      setExpiryOption("CUSTOM");
      const d = new Date(override.expiresAt);
      setCustomExpiryDate(d.toISOString().slice(0, 10));
    }

    setIsModalOpen(true);
  };

  // Search owners on typing
  const handleSearchOwners = async (query: string) => {
    setOwnerSearchQuery(query);
    if (!query.trim() || query.trim().length < 2) {
      setOwnerSearchResults([]);
      return;
    }

    setIsSearchingOwners(true);
    try {
      const res = await searchOwnersForDiscountAction(query);
      if (res.success && res.data) {
        setOwnerSearchResults(res.data as any);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsSearchingOwners(false);
    }
  };

  // Submit Save
  const handleSaveOverride = () => {
    if (!selectedOwner) {
      setFeedback({ type: "error", message: "Please select an owner first." });
      return;
    }

    if (discountType === "PERCENTAGE") {
      const pct = Number(percentageOff);
      if (!pct || pct < 1 || pct > 99) {
        setFeedback({ type: "error", message: "Percentage discount must be between 1% and 99%." });
        return;
      }
    } else {
      const solo = customSoloPrice ? Number(customSoloPrice) : null;
      const plus = customPlusPrice ? Number(customPlusPrice) : null;
      if (!solo && !plus) {
        setFeedback({ type: "error", message: "Please set at least one custom price for Solo or Plus." });
        return;
      }
    }

    let resolvedExpiry: string | null = null;
    if (expiryOption === "30_DAYS") {
      const d = new Date();
      d.setDate(d.getDate() + 30);
      resolvedExpiry = d.toISOString();
    } else if (expiryOption === "90_DAYS") {
      const d = new Date();
      d.setDate(d.getDate() + 90);
      resolvedExpiry = d.toISOString();
    } else if (expiryOption === "CUSTOM" && customExpiryDate) {
      resolvedExpiry = new Date(customExpiryDate).toISOString();
    }

    startTransition(async () => {
      const input: UpsertOwnerPricingOverrideInput = {
        ownerProfileId: selectedOwner.id,
        discountType,
        percentageOff: discountType === "PERCENTAGE" ? Number(percentageOff) : null,
        customSoloPrice: discountType === "FIXED_PRICE" && customSoloPrice !== "" ? Number(customSoloPrice) : null,
        customPlusPrice: discountType === "FIXED_PRICE" && customPlusPrice !== "" ? Number(customPlusPrice) : null,
        reason: reason.trim() || null,
        expiresAt: resolvedExpiry,
        isActive: true,
      };

      const res = await saveOwnerPricingOverrideAction(input);

      if (res.success && res.data) {
        setFeedback({
          type: "success",
          message: `Custom discount configured for ${selectedOwner.user?.profile?.fullName || selectedOwner.contactPhone} successfully!`,
        });

        // Update local state
        setOverrides((prev) => {
          const idx = prev.findIndex((o) => o.ownerProfileId === selectedOwner.id);
          if (idx >= 0) {
            const next = [...prev];
            next[idx] = res.data as any;
            return next;
          }
          return [res.data as any, ...prev];
        });

        setIsModalOpen(false);
      } else {
        setFeedback({ type: "error", message: res.error || "Failed to save discount override." });
      }
    });
  };

  // Toggle active/paused
  const handleToggleActive = (item: OwnerPricingOverrideItem) => {
    setActionId(item.id);
    startTransition(async () => {
      const nextActive = !item.isActive;
      const res = await toggleOwnerPricingOverrideAction(item.id, nextActive);
      if (res.success) {
        setOverrides((prev) =>
          prev.map((o) => (o.id === item.id ? { ...o, isActive: nextActive } : o))
        );
        setFeedback({
          type: "success",
          message: `Discount ${nextActive ? "resumed" : "paused"} for ${item.ownerProfile?.user?.profile?.fullName || item.ownerProfile?.contactPhone}.`,
        });
      } else {
        setFeedback({ type: "error", message: res.error || "Failed to toggle status." });
      }
      setActionId(null);
    });
  };

  // Delete override
  const handleDelete = (item: OwnerPricingOverrideItem) => {
    if (!confirm(`Are you sure you want to remove the custom discount for ${item.ownerProfile?.user?.profile?.fullName || item.ownerProfile?.contactPhone}?`)) {
      return;
    }

    setActionId(item.id);
    startTransition(async () => {
      const res = await deleteOwnerPricingOverrideAction(item.id);
      if (res.success) {
        setOverrides((prev) => prev.filter((o) => o.id !== item.id));
        setFeedback({
          type: "success",
          message: `Custom discount removed for ${item.ownerProfile?.user?.profile?.fullName || item.ownerProfile?.contactPhone}.`,
        });
      } else {
        setFeedback({ type: "error", message: res.error || "Failed to delete discount." });
      }
      setActionId(null);
    });
  };

  // Computed previews for the modal
  const previewSolo =
    discountType === "PERCENTAGE" && percentageOff !== ""
      ? Math.max(0, Math.round(soloBasePrice * (1 - Number(percentageOff) / 100)))
      : customSoloPrice !== ""
      ? Math.max(0, Number(customSoloPrice))
      : soloBasePrice;

  const previewPlus =
    discountType === "PERCENTAGE" && percentageOff !== ""
      ? Math.max(0, Math.round(plusBasePrice * (1 - Number(percentageOff) / 100)))
      : customPlusPrice !== ""
      ? Math.max(0, Number(customPlusPrice))
      : plusBasePrice;

  return (
    <div className="space-y-6">
      {/* Tab Header Banner */}
      <div className="rounded-3xl border border-zinc-200/80 bg-white p-6 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 text-[11px] font-bold text-[#00412E]">
              <Sparkles className="h-3 w-3 text-emerald-600" />
              VIP Partner Pricing
            </span>
            <span className="rounded-full bg-zinc-100 text-zinc-600 px-2 py-0.5 text-[10px] font-bold">
              {overrides.length} Configured
            </span>
          </div>
          <h2 className="text-xl font-black tracking-tight text-zinc-950 mt-1.5">
            Owner-Specific Custom Discounts
          </h2>
          <p className="text-xs text-zinc-500 mt-1 max-w-2xl">
            Grant tailored percentage discounts or fixed pass rates to specific owners. Their dashboard and checkout automatically reflect their customized rates without coupon codes.
          </p>
        </div>

        <button
          type="button"
          onClick={handleOpenCreateModal}
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#00412E] hover:bg-[#002f21] text-white px-4 py-2.5 text-xs font-bold shadow-2xs transition-all cursor-pointer shrink-0"
        >
          <Plus className="h-4 w-4 text-[#96BF8A]" />
          <span>Assign Owner Discount</span>
        </button>
      </div>

      {/* Global Feedback Banner */}
      {feedback && (
        <div
          className={`rounded-2xl p-4 text-xs font-semibold flex items-center justify-between gap-3 shadow-xs border ${
            feedback.type === "success"
              ? "bg-emerald-50 border-emerald-200 text-emerald-800"
              : "bg-rose-50 border-rose-200 text-rose-800"
          }`}
        >
          <div className="flex items-center gap-2.5">
            {feedback.type === "success" ? (
              <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
            ) : (
              <AlertCircle className="h-4 w-4 text-rose-600 shrink-0" />
            )}
            <span>{feedback.message}</span>
          </div>
          <button
            onClick={() => setFeedback(null)}
            className="text-xs underline opacity-80 hover:opacity-100 cursor-pointer"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Filter / Search Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white p-3 rounded-2xl border border-zinc-200 shadow-2xs">
        <div className="relative w-full sm:w-80">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-zinc-400" />
          <input
            type="text"
            value={searchFilter}
            onChange={(e) => setSearchFilter(e.target.value)}
            placeholder="Search by owner name, email, or phone..."
            className="w-full pl-9 pr-3 py-1.5 text-xs bg-zinc-50 border border-zinc-200 rounded-xl focus:bg-white focus:border-[#00412E] focus:outline-hidden transition-all"
          />
        </div>

        <div className="text-xs text-zinc-400 font-semibold self-end sm:self-center pr-2">
          Showing {filteredOverrides.length} of {overrides.length} custom discounts
        </div>
      </div>

      {/* Overrides Table / Cards */}
      {filteredOverrides.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-zinc-300 bg-white p-12 text-center space-y-4">
          <div className="h-12 w-12 rounded-2xl bg-zinc-100 flex items-center justify-center mx-auto text-zinc-400">
            <Percent className="h-6 w-6" />
          </div>
          <div className="max-w-md mx-auto">
            <h3 className="text-sm font-bold text-zinc-900">
              {overrides.length === 0
                ? "No Owner Custom Discounts Yet"
                : "No matching owners found"}
            </h3>
            <p className="text-xs text-zinc-500 mt-1">
              {overrides.length === 0
                ? "Click the button below to grant an exclusive partner discount to an owner."
                : "Try adjusting your search query above."}
            </p>
          </div>
          {overrides.length === 0 && (
            <button
              type="button"
              onClick={handleOpenCreateModal}
              className="inline-flex items-center gap-1.5 rounded-xl bg-[#00412E] text-white px-4 py-2 text-xs font-bold hover:bg-[#002f21] transition-all cursor-pointer"
            >
              <Plus className="h-4 w-4" />
              <span>Add First Owner Discount</span>
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredOverrides.map((item) => {
            const owner = item.ownerProfile;
            const user = owner?.user;
            const profile = user?.profile;
            const isPercentage = item.discountType === "PERCENTAGE";

            const calculatedSolo = isPercentage
              ? Math.max(1, Math.round(soloBasePrice * (1 - (item.percentageOff || 0) / 100)))
              : item.customSoloPrice ?? soloBasePrice;

            const calculatedPlus = isPercentage
              ? Math.max(1, Math.round(plusBasePrice * (1 - (item.percentageOff || 0) / 100)))
              : item.customPlusPrice ?? plusBasePrice;

            const isExpired = item.expiresAt && new Date(item.expiresAt).getTime() < Date.now();
            const isToggling = actionId === item.id && isPending;

            return (
              <div
                key={item.id}
                className={`rounded-3xl border bg-white flex flex-col justify-between transition-all shadow-xs hover:shadow-md ${
                  !item.isActive || isExpired
                    ? "opacity-70 border-zinc-200"
                    : "border-emerald-200/80 ring-1 ring-emerald-500/10"
                }`}
              >
                {/* Card Body */}
                <div className="p-5 space-y-4">
                  {/* Top: Owner Identity */}
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="h-10 w-10 rounded-full bg-[#eff4ec] border border-[#96BF8A]/40 flex items-center justify-center text-sm font-black text-[#00412E] shrink-0">
                        {profile?.fullName ? profile.fullName.charAt(0).toUpperCase() : "O"}
                      </div>
                      <div className="min-w-0">
                        <h4 className="text-sm font-black text-zinc-950 truncate">
                          {profile?.fullName || "Owner Account"}
                        </h4>
                        <p className="text-[11px] text-zinc-500 truncate">
                          {owner?.businessName || user?.email || owner?.contactPhone}
                        </p>
                      </div>
                    </div>

                    <span
                      className={`rounded-full px-2 py-0.5 text-[9px] font-extrabold uppercase tracking-wider shrink-0 ${
                        isExpired
                          ? "bg-rose-100 text-rose-800"
                          : item.isActive
                          ? "bg-emerald-100 text-emerald-800"
                          : "bg-zinc-100 text-zinc-600"
                      }`}
                    >
                      {isExpired ? "Expired" : item.isActive ? "Active" : "Used / Inactive"}
                    </span>
                  </div>

                  {/* Discount Badge Pill */}
                  <div className="rounded-2xl bg-zinc-50 border border-zinc-200/80 p-3 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-extrabold uppercase tracking-wider text-zinc-400">
                        Configured Benefit
                      </span>
                      {isPercentage ? (
                        <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-black px-2 py-0.5 border border-emerald-300/60">
                          <Percent className="h-3 w-3" />
                          <span>{item.percentageOff}% OFF ALL PASSES</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 rounded-full bg-indigo-100 text-indigo-800 text-[10px] font-black px-2 py-0.5 border border-indigo-300/60">
                          <Sparkles className="h-3 w-3" />
                          <span>FIXED PRICE OVERRIDE</span>
                        </span>
                      )}
                    </div>

                    {/* Effective Prices Preview */}
                    <div className="grid grid-cols-2 gap-2 pt-1 border-t border-zinc-200/60 text-xs">
                      <div className="bg-white rounded-xl p-2 border border-zinc-200/60">
                        <span className="block text-[9px] font-bold text-zinc-400 uppercase">StayKro Solo</span>
                        <div className="flex items-baseline gap-1 mt-0.5">
                          <span className="text-base font-black text-zinc-950">₹{calculatedSolo}</span>
                          <span className="text-[10px] text-zinc-400 line-through">₹{soloBasePrice}</span>
                        </div>
                      </div>
                      <div className="bg-white rounded-xl p-2 border border-zinc-200/60">
                        <span className="block text-[9px] font-bold text-zinc-400 uppercase">StayKro Plus</span>
                        <div className="flex items-baseline gap-1 mt-0.5">
                          <span className="text-base font-black text-zinc-950">₹{calculatedPlus}</span>
                          <span className="text-[10px] text-zinc-400 line-through">₹{plusBasePrice}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Metadata: Phone, Properties, Expiry, Reason */}
                  <div className="space-y-1.5 text-[11px] text-zinc-600">
                    <div className="flex items-center justify-between">
                      <span className="text-zinc-400">Phone:</span>
                      <span className="font-semibold text-zinc-800">{owner?.contactPhone}</span>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-zinc-400">Properties:</span>
                      <span className="font-semibold text-zinc-800">
                        {owner?._count?.properties || 0} PG properties
                      </span>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-zinc-400">Validity:</span>
                      <span className={`font-semibold ${isExpired ? "text-rose-600 font-bold" : "text-zinc-800"}`}>
                        {item.expiresAt
                          ? `Until ${new Date(item.expiresAt).toLocaleDateString("en-IN", {
                              day: "numeric",
                              month: "short",
                              year: "numeric",
                            })}`
                          : "Permanent (No Expiry)"}
                      </span>
                    </div>

                    {item.reason && (
                      <div className="pt-1 border-t border-zinc-100">
                        <span className="text-[10px] text-zinc-400 block font-semibold uppercase">Reason / Note</span>
                        <p className="text-[11px] text-zinc-700 italic truncate" title={item.reason}>
                          "{item.reason}"
                        </p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Card Footer: Action Buttons */}
                <div className="p-4 border-t border-zinc-100 bg-zinc-50/60 rounded-b-3xl flex items-center justify-between gap-2">
                  <button
                    type="button"
                    disabled={isToggling}
                    onClick={() => handleToggleActive(item)}
                    className="text-[11px] font-bold text-zinc-600 hover:text-zinc-950 px-2.5 py-1.5 rounded-xl border border-zinc-200 bg-white hover:bg-zinc-50 transition-colors cursor-pointer disabled:opacity-50"
                  >
                    {item.isActive ? "Pause Discount" : "Resume Discount"}
                  </button>

                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => handleOpenEditModal(item)}
                      className="p-1.5 rounded-xl text-zinc-500 hover:text-[#00412E] hover:bg-zinc-100 transition-colors cursor-pointer"
                      title="Edit Discount"
                    >
                      <Edit3 className="h-4 w-4" />
                    </button>
                    <button
                      type="button"
                      disabled={isToggling}
                      onClick={() => handleDelete(item)}
                      className="p-1.5 rounded-xl text-zinc-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer disabled:opacity-50"
                      title="Delete Override"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal: Add / Edit Custom Discount */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-950/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="w-full max-w-xl rounded-3xl bg-white border border-zinc-200 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            {/* Modal Header */}
            <div className="p-6 border-b border-zinc-100 flex items-center justify-between">
              <div>
                <h3 className="text-lg font-black text-zinc-950">
                  {editingOverride ? "Edit Custom Discount" : "Assign Custom Discount to Owner"}
                </h3>
                <p className="text-xs text-zinc-500 mt-0.5">
                  Configure an automatic VIP discount override for a specific owner account.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="p-2 rounded-xl text-zinc-400 hover:text-zinc-600 hover:bg-zinc-100 transition-colors cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-5 overflow-y-auto">
              {/* Step 1: Select Owner */}
              <div className="space-y-2">
                <label className="block text-[11px] font-extrabold uppercase tracking-wider text-zinc-500">
                  Step 1: Select Target Owner
                </label>

                {selectedOwner ? (
                  <div className="p-3.5 rounded-2xl border border-emerald-300 bg-emerald-50/50 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="h-9 w-9 rounded-full bg-[#00412E] text-white flex items-center justify-center font-bold text-xs">
                        {selectedOwner.user?.profile?.fullName?.charAt(0) || "O"}
                      </div>
                      <div>
                        <div className="text-xs font-black text-zinc-950">
                          {selectedOwner.user?.profile?.fullName || "Owner"}
                        </div>
                        <div className="text-[11px] text-zinc-500">
                          {selectedOwner.businessName ? `${selectedOwner.businessName} • ` : ""}
                          {selectedOwner.contactPhone} • {selectedOwner.user?.email}
                        </div>
                      </div>
                    </div>

                    {!editingOverride && (
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedOwner(null);
                          setOwnerSearchQuery("");
                        }}
                        className="text-xs font-bold text-zinc-500 hover:text-zinc-900 underline cursor-pointer"
                      >
                        Change
                      </button>
                    )}
                  </div>
                ) : (
                  <div className="relative">
                    <Search className="absolute left-3 top-3 h-4 w-4 text-zinc-400" />
                    <input
                      type="text"
                      value={ownerSearchQuery}
                      onChange={(e) => handleSearchOwners(e.target.value)}
                      placeholder="Type owner's name, phone, or email to search..."
                      className="w-full pl-9 pr-3 py-2 text-xs bg-zinc-50 border border-zinc-200 rounded-xl focus:bg-white focus:border-[#00412E] focus:outline-hidden"
                    />

                    {isSearchingOwners && (
                      <div className="absolute right-3 top-2.5">
                        <Loader2 className="h-4 w-4 text-zinc-400 animate-spin" />
                      </div>
                    )}

                    {/* Search Results Dropdown */}
                    {ownerSearchResults.length > 0 && (
                      <div className="absolute z-20 top-full left-0 right-0 mt-1.5 max-h-56 overflow-y-auto rounded-2xl border border-zinc-200 bg-white shadow-xl p-1.5 space-y-1">
                        {ownerSearchResults.map((o) => (
                          <div
                            key={o.id}
                            onClick={() => {
                              setSelectedOwner(o);
                              setOwnerSearchResults([]);
                            }}
                            className="p-2.5 rounded-xl hover:bg-zinc-50 cursor-pointer flex items-center justify-between gap-3 transition-colors"
                          >
                            <div className="min-w-0">
                              <div className="text-xs font-bold text-zinc-900 truncate">
                                {o.user?.profile?.fullName || "Owner"}
                              </div>
                              <div className="text-[10px] text-zinc-500 truncate">
                                {o.businessName ? `${o.businessName} • ` : ""}
                                {o.contactPhone} • {o.user?.email}
                              </div>
                            </div>
                            <span className="text-[10px] font-bold text-[#00412E] bg-emerald-50 px-2 py-0.5 rounded-md shrink-0">
                              Select
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Step 2: Choose Discount Type */}
              <div className="space-y-3">
                <label className="block text-[11px] font-extrabold uppercase tracking-wider text-zinc-500">
                  Step 2: Choose Discount Type
                </label>

                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setDiscountType("PERCENTAGE")}
                    className={`p-3.5 rounded-2xl border text-left transition-all cursor-pointer ${
                      discountType === "PERCENTAGE"
                        ? "border-[#00412E] bg-[#eff4ec]/50 ring-1 ring-[#00412E]"
                        : "border-zinc-200 hover:border-zinc-300"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <Percent className="h-4 w-4 text-[#00412E]" />
                      {discountType === "PERCENTAGE" && <Check className="h-4 w-4 text-[#00412E]" />}
                    </div>
                    <div className="text-xs font-black text-zinc-950 mt-2">Percentage Discount</div>
                    <p className="text-[10px] text-zinc-500 mt-0.5">e.g. 20% off all listing passes</p>
                  </button>

                  <button
                    type="button"
                    onClick={() => setDiscountType("FIXED_PRICE")}
                    className={`p-3.5 rounded-2xl border text-left transition-all cursor-pointer ${
                      discountType === "FIXED_PRICE"
                        ? "border-[#00412E] bg-[#eff4ec]/50 ring-1 ring-[#00412E]"
                        : "border-zinc-200 hover:border-zinc-300"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <Sparkles className="h-4 w-4 text-[#00412E]" />
                      {discountType === "FIXED_PRICE" && <Check className="h-4 w-4 text-[#00412E]" />}
                    </div>
                    <div className="text-xs font-black text-zinc-950 mt-2">Fixed Plan Rates</div>
                    <p className="text-[10px] text-zinc-500 mt-0.5">e.g. Solo: ₹299, Plus: ₹599</p>
                  </button>
                </div>

                {/* Type Inputs */}
                {discountType === "PERCENTAGE" ? (
                  <div className="rounded-2xl bg-zinc-50 p-4 border border-zinc-200/80 space-y-2">
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-zinc-500">
                      Discount Percentage (%)
                    </label>
                    <div className="flex items-center gap-3">
                      <div className="relative flex-1">
                        <input
                          type="number"
                          min="1"
                          max="100"
                          value={percentageOff}
                          onChange={(e) =>
                            setPercentageOff(e.target.value === "" ? "" : parseInt(e.target.value) || 0)
                          }
                          className="w-full text-base font-black text-zinc-950 bg-white border border-zinc-200 rounded-xl px-3 py-2 focus:border-[#00412E] focus:outline-hidden"
                          placeholder="e.g. 20"
                        />
                        <span className="absolute right-3 top-2.5 text-sm font-bold text-zinc-400">%</span>
                      </div>
                      <div className="flex items-center gap-1.5 flex-wrap">
                        {[10, 20, 50, 100].map((preset) => (
                          <button
                            key={preset}
                            type="button"
                            onClick={() => setPercentageOff(preset)}
                            className={`px-2.5 py-1.5 rounded-lg border text-xs font-bold transition-colors cursor-pointer ${
                              percentageOff === preset
                                ? "bg-[#00412E] text-white border-[#00412E]"
                                : preset === 100
                                ? "border-emerald-300 bg-emerald-50 text-emerald-800 hover:bg-emerald-100"
                                : "border-zinc-200 bg-white text-zinc-700 hover:bg-zinc-100"
                            }`}
                          >
                            {preset === 100 ? "100% (Free)" : `${preset}%`}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="rounded-2xl bg-zinc-50 p-4 border border-zinc-200/80 grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[10px] font-bold uppercase tracking-wider text-zinc-500 mb-1">
                        Custom Solo Price (₹)
                      </label>
                      <div className="relative">
                        <span className="absolute left-3 top-2 text-sm font-bold text-zinc-400">₹</span>
                        <input
                          type="number"
                          min="0"
                          value={customSoloPrice}
                          onChange={(e) =>
                            setCustomSoloPrice(e.target.value === "" ? "" : parseInt(e.target.value) || 0)
                          }
                          placeholder="0 = Free Pass"
                          className="w-full pl-7 pr-3 py-1.5 text-sm font-bold text-zinc-900 bg-white border border-zinc-200 rounded-xl focus:border-[#00412E] focus:outline-hidden"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold uppercase tracking-wider text-zinc-500 mb-1">
                        Custom Plus Price (₹)
                      </label>
                      <div className="relative">
                        <span className="absolute left-3 top-2 text-sm font-bold text-zinc-400">₹</span>
                        <input
                          type="number"
                          min="0"
                          value={customPlusPrice}
                          onChange={(e) =>
                            setCustomPlusPrice(e.target.value === "" ? "" : parseInt(e.target.value) || 0)
                          }
                          placeholder="0 = Free Pass"
                          className="w-full pl-7 pr-3 py-1.5 text-sm font-bold text-zinc-900 bg-white border border-zinc-200 rounded-xl focus:border-[#00412E] focus:outline-hidden"
                        />
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Live Preview Box */}
              <div className="rounded-2xl border border-emerald-200 bg-emerald-50/50 p-3.5 space-y-2">
                <span className="text-[10px] font-black uppercase tracking-wider text-[#00412E] flex items-center gap-1">
                  <Sparkles className="h-3 w-3" />
                  Live Pricing Preview for this Owner
                </span>
                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div className="bg-white rounded-xl p-2.5 border border-emerald-200/60">
                    <span className="text-[10px] font-bold text-zinc-400 uppercase block">Solo Pass (30 Days)</span>
                    <div className="flex items-baseline gap-1.5 mt-0.5">
                      <span className="text-lg font-black text-emerald-800">₹{previewSolo}</span>
                      <span className="text-xs text-zinc-400 line-through">₹{soloBasePrice}</span>
                      {previewSolo < soloBasePrice && (
                        <span className="text-[10px] font-bold text-emerald-600">
                          (Save ₹{soloBasePrice - previewSolo})
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="bg-white rounded-xl p-2.5 border border-emerald-200/60">
                    <span className="text-[10px] font-bold text-zinc-400 uppercase block">Plus Pass (30 Days)</span>
                    <div className="flex items-baseline gap-1.5 mt-0.5">
                      <span className="text-lg font-black text-emerald-800">₹{previewPlus}</span>
                      <span className="text-xs text-zinc-400 line-through">₹{plusBasePrice}</span>
                      {previewPlus < plusBasePrice && (
                        <span className="text-[10px] font-bold text-emerald-600">
                          (Save ₹{plusBasePrice - previewPlus})
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Step 3: Validity Period */}
              <div className="space-y-2">
                <label className="block text-[11px] font-extrabold uppercase tracking-wider text-zinc-500">
                  Step 3: Validity Period
                </label>
                <div className="grid grid-cols-4 gap-2">
                  {[
                    { key: "PERMANENT", label: "Permanent" },
                    { key: "30_DAYS", label: "30 Days" },
                    { key: "90_DAYS", label: "90 Days" },
                    { key: "CUSTOM", label: "Custom Date" },
                  ].map((opt) => (
                    <button
                      key={opt.key}
                      type="button"
                      onClick={() => setExpiryOption(opt.key as any)}
                      className={`py-2 px-2 text-center rounded-xl text-xs font-bold border transition-colors cursor-pointer ${
                        expiryOption === opt.key
                          ? "border-[#00412E] bg-[#eff4ec] text-[#00412E]"
                          : "border-zinc-200 bg-white text-zinc-600 hover:bg-zinc-50"
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>

                {expiryOption === "CUSTOM" && (
                  <div className="pt-1">
                    <input
                      type="date"
                      min={new Date().toISOString().slice(0, 10)}
                      value={customExpiryDate}
                      onChange={(e) => setCustomExpiryDate(e.target.value)}
                      className="w-full text-xs font-bold text-zinc-800 bg-zinc-50 border border-zinc-200 rounded-xl px-3 py-2 focus:border-[#00412E] focus:outline-hidden"
                    />
                  </div>
                )}
              </div>

              {/* Step 4: Reason / Note */}
              <div className="space-y-1.5">
                <label className="block text-[11px] font-extrabold uppercase tracking-wider text-zinc-500">
                  Step 4: Reason / Partner Note (Optional)
                </label>
                <input
                  type="text"
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="e.g. VIP Early Partner with 4 PG properties"
                  className="w-full text-xs text-zinc-800 bg-zinc-50 border border-zinc-200 rounded-xl px-3 py-2 focus:bg-white focus:border-[#00412E] focus:outline-hidden"
                />
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t border-zinc-100 bg-zinc-50/60 flex items-center justify-end gap-2.5">
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="px-4 py-2 rounded-xl text-xs font-bold text-zinc-600 hover:text-zinc-950 transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isPending || !selectedOwner}
                onClick={handleSaveOverride}
                className="inline-flex items-center gap-1.5 px-5 py-2 rounded-xl bg-[#00412E] hover:bg-[#002f21] text-white text-xs font-bold shadow-2xs transition-all cursor-pointer disabled:opacity-50"
              >
                {isPending ? (
                  <>
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    <span>Saving...</span>
                  </>
                ) : (
                  <>
                    <Check className="h-3.5 w-3.5 text-[#96BF8A]" />
                    <span>Save Custom Discount</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
