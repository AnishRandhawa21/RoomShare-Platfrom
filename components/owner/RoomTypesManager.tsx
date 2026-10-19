"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { PropertySubNav } from "./PropertySubNav";
import {
  addRoomTypeWithInventoryAction,
  updateOwnerRoomTypeAction,
  deleteOwnerRoomTypeAction,
} from "@/actions/owner";
import {
  deleteRoomTypeImageAction,
  uploadRoomTypeImageDirectAction,
} from "@/actions/upload";
import {
  Layers,
  Plus,
  Edit2,
  Trash2,
  Image as ImageIcon,
  CheckCircle2,
  AlertCircle,
  X,
  UploadCloud,
  Check,
  Sparkles,
} from "lucide-react";
import { GenderPolicy } from "@/lib/enums";

interface RoomTypeItem {
  id: string;
  propertyId: string;
  name: string;
  occupancy: number;
  monthlyRent: number;
  securityDeposit: number;
  maintenanceCharges: number;
  foodCharges: number;
  hasAttachedBathroom: boolean;
  hasBalcony: boolean;
  hasAirConditioning: boolean;
  genderRestriction: GenderPolicy;
  isActive: boolean;
  rooms?: Array<{
    id: string;
    roomNumber: string;
    occupiedBeds: number;
    status: string;
  }>;
  images?: Array<{
    id: string;
    url: string;
    storageKey: string;
    altText?: string | null;
  }>;
}

interface RoomTypesManagerProps {
  property: {
    id: string;
    name: string;
    slug: string;
    status: string;
    roomTypes: RoomTypeItem[];
  };
}

export function RoomTypesManager({ property }: RoomTypesManagerProps) {
  const router = useRouter();
  const [roomTypes, setRoomTypes] = useState<RoomTypeItem[]>(property.roomTypes || []);

  useEffect(() => {
    setRoomTypes(property.roomTypes || []);
  }, [property.roomTypes]);

  const [isAddOpen, setIsAddOpen] = useState(false);
  const [editingRt, setEditingRt] = useState<RoomTypeItem | null>(null);

  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Form state for Add Room Type
  const [formData, setFormData] = useState({
    name: "",
    occupancy: 2,
    monthlyRent: 8000,
    securityDeposit: 16000,
    maintenanceCharges: 0,
    foodCharges: 0,
    hasAirConditioning: false,
    hasAttachedBathroom: true,
    hasBalcony: false,
    genderRestriction: GenderPolicy.UNISEX as GenderPolicy,
    initialRoomsCount: 2,
    startRoomNumber: 101,
  });

  const handleOpenAdd = () => {
    setFormData({
      name: "",
      occupancy: 2,
      monthlyRent: 8000,
      securityDeposit: 16000,
      maintenanceCharges: 0,
      foodCharges: 0,
      hasAirConditioning: false,
      hasAttachedBathroom: true,
      hasBalcony: false,
      genderRestriction: GenderPolicy.UNISEX,
      initialRoomsCount: 2,
      startRoomNumber: 101,
    });
    setErrorMessage(null);
    setSuccessMessage(null);
    setIsAddOpen(true);
  };

  const handleSaveAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMessage(null);

    try {
      const res = await addRoomTypeWithInventoryAction(property.id, {
        name: formData.name,
        occupancy: Number(formData.occupancy),
        monthlyRent: Number(formData.monthlyRent),
        securityDeposit: Number(formData.securityDeposit),
        maintenanceCharges: Number(formData.maintenanceCharges),
        foodCharges: Number(formData.foodCharges),
        hasAirConditioning: formData.hasAirConditioning,
        hasAttachedBathroom: formData.hasAttachedBathroom,
        hasBalcony: formData.hasBalcony,
        genderRestriction: formData.genderRestriction,
        initialRoomsCount: Number(formData.initialRoomsCount),
        startRoomNumber: Number(formData.startRoomNumber),
      });

      if (res.success) {
        setIsAddOpen(false);
        setSuccessMessage("Room type created with initial inventory!");
        router.refresh();
      } else {
        setErrorMessage(res.error || "Failed to create room type.");
      }
    } catch {
      setErrorMessage("Network error while creating room type.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingRt) return;
    setIsLoading(true);
    setErrorMessage(null);

    try {
      const res = await updateOwnerRoomTypeAction(editingRt.id, {
        name: editingRt.name,
        monthlyRent: Number(editingRt.monthlyRent),
        securityDeposit: Number(editingRt.securityDeposit),
        maintenanceCharges: Number(editingRt.maintenanceCharges),
        foodCharges: Number(editingRt.foodCharges),
        hasAirConditioning: editingRt.hasAirConditioning,
        hasAttachedBathroom: editingRt.hasAttachedBathroom,
        hasBalcony: editingRt.hasBalcony,
        genderRestriction: editingRt.genderRestriction,
        isActive: editingRt.isActive,
      });

      if (res.success) {
        setRoomTypes((prev) =>
          prev.map((item) => (item.id === editingRt.id ? { ...item, ...editingRt } : item))
        );
        setEditingRt(null);
        setSuccessMessage("Room type updated successfully.");
        router.refresh();
      } else {
        setErrorMessage(res.error || "Failed to update room type.");
      }
    } catch {
      setErrorMessage("Network error while updating room type.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (rtId: string, name: string) => {
    if (!confirm(`Are you sure you want to delete room type "${name}"? Only empty room types without occupied beds can be deleted.`)) {
      return;
    }
    setIsLoading(true);
    try {
      const res = await deleteOwnerRoomTypeAction(rtId);
      if (res.success) {
        setRoomTypes((prev) => prev.filter((item) => item.id !== rtId));
        setSuccessMessage(`Room type "${name}" removed.`);
        router.refresh();
      } else {
        setErrorMessage(res.error || "Could not delete room type.");
      }
    } catch {
      setErrorMessage("Network error deleting room type.");
    } finally {
      setIsLoading(false);
    }
  };

  // Image Upload handler for a specific RoomType (Server Action - Bypasses CORS)
  const handleImageUpload = async (roomTypeId: string, e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const file = files[0];
    setIsLoading(true);
    setErrorMessage(null);

    try {
      const formData = new FormData();
      formData.append("roomTypeId", roomTypeId);
      formData.append("file", file);
      formData.append("altText", file.name);

      const res = await uploadRoomTypeImageDirectAction(formData);

      if (!res.success) {
        setErrorMessage(res.error || "Failed to upload photo.");
        setIsLoading(false);
        return;
      }

      setSuccessMessage("Room image uploaded successfully!");
      router.refresh();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to upload photo.";
      setErrorMessage(message);
    } finally {
      setIsLoading(false);
      e.target.value = "";
    }
  };

  const handleDeleteImage = async (imageId: string) => {
    if (!confirm("Are you sure you want to remove this photo?")) return;
    setIsLoading(true);
    try {
      const res = await deleteRoomTypeImageAction(imageId);
      if (res.success) {
        setSuccessMessage("Photo removed.");
        router.refresh();
      } else {
        setErrorMessage(res.error || "Failed to delete photo.");
      }
    } catch {
      setErrorMessage("Error removing photo.");
    } finally {
      setIsLoading(false);
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

      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-2xl border border-slate-200/80 bg-white p-5 shadow-2xs">
        <div>
          <h2 className="text-base font-bold text-slate-900">Room Types & Pricing</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Configure sharing options (Single, 2-Seater, 3-Seater), pricing, and room-specific photos.
          </p>
        </div>

        <button
          onClick={handleOpenAdd}
          className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-xs font-bold text-white shadow-xs hover:bg-indigo-700 transition-colors"
        >
          <Plus className="h-4 w-4" />
          <span>Add Room Type</span>
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

      {/* Room Types Cards */}
      <div className="space-y-4">
        {roomTypes.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-12 text-center">
            <Layers className="h-10 w-10 text-slate-300 mx-auto mb-3" />
            <h3 className="text-sm font-bold text-slate-900">No Room Types Configured</h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1 mb-4">
              Add sharing plans like &quot;2-Seater AC&quot; or &quot;Single Studio&quot; with their individual rents and
              room-specific images.
            </p>
            <button
              onClick={handleOpenAdd}
              className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2 text-xs font-bold text-white hover:bg-indigo-700"
            >
              <Plus className="h-4 w-4" />
              <span>Add Your First Room Type</span>
            </button>
          </div>
        ) : (
          roomTypes.map((rt) => {
            const totalRooms = rt.rooms?.length || 0;
            const totalBeds = totalRooms * rt.occupancy;
            const occupiedBeds =
              rt.rooms?.reduce((acc, r) => acc + (r.occupiedBeds || 0), 0) || 0;
            const availableBeds = Math.max(0, totalBeds - occupiedBeds);

            return (
              <div
                key={rt.id}
                className={`rounded-2xl border bg-white p-5 shadow-2xs transition-all ${
                  rt.isActive ? "border-slate-200/80" : "border-slate-200 bg-slate-50/50 opacity-75"
                }`}
              >
                <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4">
                  {/* Info Column */}
                  <div className="space-y-2.5">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="text-base font-bold text-slate-900">{rt.name}</h3>
                      <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-[11px] font-semibold text-slate-700 border border-slate-200">
                        {rt.occupancy}-Seater ({rt.occupancy} {rt.occupancy === 1 ? "bed" : "beds"}/room)
                      </span>
                      <span
                        className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${
                          rt.isActive
                            ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                            : "bg-slate-100 text-slate-500 border border-slate-200"
                        }`}
                      >
                        {rt.isActive ? "Active" : "Inactive"}
                      </span>
                      <span className="rounded-full bg-indigo-50 px-2 py-0.5 text-[10px] font-semibold text-indigo-700 border border-indigo-200">
                        {rt.genderRestriction === GenderPolicy.UNISEX
                          ? "All Genders"
                          : rt.genderRestriction === GenderPolicy.BOYS
                          ? "Male Only"
                          : "Female Only"}
                      </span>
                    </div>

                    {/* Features badges */}
                    <div className="flex flex-wrap items-center gap-1.5 text-xs text-slate-600">
                      {rt.hasAirConditioning && (
                        <span className="inline-flex items-center gap-1 rounded-md bg-sky-50 px-2 py-0.5 text-[11px] font-medium text-sky-700 border border-sky-200">
                          <Sparkles className="h-3 w-3" />
                          <span>Air Conditioned</span>
                        </span>
                      )}
                      {rt.hasAttachedBathroom && (
                        <span className="inline-flex items-center gap-1 rounded-md bg-emerald-50 px-2 py-0.5 text-[11px] font-medium text-emerald-700 border border-emerald-200">
                          <Check className="h-3 w-3" />
                          <span>Attached Washroom</span>
                        </span>
                      )}
                      {rt.hasBalcony && (
                        <span className="inline-flex items-center gap-1 rounded-md bg-amber-50 px-2 py-0.5 text-[11px] font-medium text-amber-700 border border-amber-200">
                          <Check className="h-3 w-3" />
                          <span>Private Balcony</span>
                        </span>
                      )}
                    </div>

                    {/* Financial details */}
                    <div className="flex flex-wrap items-center gap-4 text-xs text-slate-500 pt-1">
                      <div>
                        <span className="text-slate-400">Rent: </span>
                        <span className="font-extrabold text-slate-900">
                          ₹{rt.monthlyRent.toLocaleString("en-IN")}
                        </span>
                        <span className="text-[10px]">/bed/mo</span>
                      </div>
                      <div>
                        <span className="text-slate-400">Security: </span>
                        <span className="font-semibold text-slate-700">
                          ₹{rt.securityDeposit.toLocaleString("en-IN")}
                        </span>
                      </div>
                      {rt.maintenanceCharges > 0 && (
                        <div>
                          <span className="text-slate-400">Maint: </span>
                          <span className="font-semibold text-slate-700">
                            ₹{rt.maintenanceCharges.toLocaleString("en-IN")}
                          </span>
                        </div>
                      )}
                      {rt.foodCharges > 0 && (
                        <div>
                          <span className="text-slate-400">Food: </span>
                          <span className="font-semibold text-slate-700">
                            ₹{rt.foodCharges.toLocaleString("en-IN")}
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Derived Inventory Math */}
                    <div className="flex items-center gap-3 pt-1 text-xs">
                      <span className="font-semibold text-slate-700">
                        {totalRooms} {totalRooms === 1 ? "room" : "rooms"} ({totalBeds} beds total)
                      </span>
                      <span>•</span>
                      <span
                        className={`font-bold ${
                          availableBeds > 0 ? "text-emerald-600" : "text-rose-600"
                        }`}
                      >
                        {availableBeds} beds available
                      </span>
                      <span className="text-slate-400">({occupiedBeds} occupied)</span>
                    </div>
                  </div>

                  {/* Actions Column */}
                  <div className="flex sm:items-center gap-2 self-start lg:self-center">
                    <button
                      onClick={() => setEditingRt(rt)}
                      className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
                    >
                      <Edit2 className="h-3.5 w-3.5" />
                      <span>Edit</span>
                    </button>
                    <button
                      onClick={() => handleDelete(rt.id, rt.name)}
                      disabled={isLoading}
                      className="inline-flex items-center gap-1.5 rounded-xl border border-rose-200 bg-rose-50/50 px-3 py-2 text-xs font-semibold text-rose-700 hover:bg-rose-100/60 transition-colors"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                      <span>Delete</span>
                    </button>
                  </div>
                </div>

                {/* Room-specific Photos Section */}
                <div className="mt-4 pt-4 border-t border-slate-100">
                  <div className="flex items-center justify-between mb-2.5">
                    <span className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                      <ImageIcon className="h-3.5 w-3.5 text-slate-400" />
                      <span>Photos for {rt.name}</span>
                      <span className="text-[10px] text-slate-400">({rt.images?.length || 0})</span>
                    </span>

                    <label className="cursor-pointer inline-flex items-center gap-1.5 rounded-lg border border-dashed border-indigo-300 bg-indigo-50/50 px-2.5 py-1 text-xs font-semibold text-indigo-700 hover:bg-indigo-100/50 transition-colors">
                      <UploadCloud className="h-3.5 w-3.5" />
                      <span>Upload Room Photo</span>
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => handleImageUpload(rt.id, e)}
                        disabled={isLoading}
                      />
                    </label>
                  </div>

                  {rt.images && rt.images.length > 0 ? (
                    <div className="flex flex-wrap items-center gap-2.5">
                      {rt.images.map((img) => (
                        <div
                          key={img.id}
                          className="group relative h-20 w-24 overflow-hidden rounded-xl border border-slate-200 bg-slate-100"
                        >
                          <img
                            src={img.url}
                            alt={img.altText || rt.name}
                            className="h-full w-full object-cover"
                          />
                          <button
                            onClick={() => handleDeleteImage(img.id)}
                            className="absolute top-1 right-1 h-5 w-5 rounded-md bg-rose-600 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                            title="Delete photo"
                          >
                            <Trash2 className="h-3 w-3" />
                          </button>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-[11px] text-slate-400 italic">
                      No room-specific photos yet. Upload photos showing this exact layout and washroom.
                    </p>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Add Room Type Modal */}
      {isAddOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4">
          <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl bg-white p-6 shadow-xl border border-slate-100">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-base font-bold text-slate-900">Add New Room Type</h3>
              <button
                onClick={() => setIsAddOpen(false)}
                className="h-7 w-7 rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-600 flex items-center justify-center"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleSaveAdd} className="mt-4 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Room Type Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. 2-Seater AC Premium"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full rounded-xl border border-slate-200 px-3.5 py-2 text-xs focus:border-indigo-600 focus:outline-hidden"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Occupancy (Beds/Room) *
                  </label>
                  <select
                    value={formData.occupancy}
                    onChange={(e) => setFormData({ ...formData, occupancy: Number(e.target.value) })}
                    className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs focus:border-indigo-600 focus:outline-hidden"
                  >
                    <option value={1}>1 Bed (Private Single)</option>
                    <option value={2}>2 Beds (Double Sharing)</option>
                    <option value={3}>3 Beds (Triple Sharing)</option>
                    <option value={4}>4 Beds (Four Sharing)</option>
                    <option value={5}>5 Beds</option>
                    <option value={6}>6 Beds (Dorm Style)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Gender Policy *
                  </label>
                  <select
                    value={formData.genderRestriction}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        genderRestriction: e.target.value as GenderPolicy,
                      })
                    }
                    className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs focus:border-indigo-600 focus:outline-hidden"
                  >
                    <option value={GenderPolicy.UNISEX}>All Genders (Unisex)</option>
                    <option value={GenderPolicy.BOYS}>Male Only</option>
                    <option value={GenderPolicy.GIRLS}>Female Only</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Monthly Rent (₹/bed/mo) *
                  </label>
                  <input
                    type="number"
                    required
                    min={500}
                    value={formData.monthlyRent}
                    onChange={(e) =>
                      setFormData({ ...formData, monthlyRent: Number(e.target.value) })
                    }
                    className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs focus:border-indigo-600 focus:outline-hidden"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Security Deposit (₹) *
                  </label>
                  <input
                    type="number"
                    required
                    min={0}
                    value={formData.securityDeposit}
                    onChange={(e) =>
                      setFormData({ ...formData, securityDeposit: Number(e.target.value) })
                    }
                    className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs focus:border-indigo-600 focus:outline-hidden"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Maintenance (₹/mo)
                  </label>
                  <input
                    type="number"
                    min={0}
                    value={formData.maintenanceCharges}
                    onChange={(e) =>
                      setFormData({ ...formData, maintenanceCharges: Number(e.target.value) })
                    }
                    className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs focus:border-indigo-600 focus:outline-hidden"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Food Charges (₹/mo)
                  </label>
                  <input
                    type="number"
                    min={0}
                    value={formData.foodCharges}
                    onChange={(e) =>
                      setFormData({ ...formData, foodCharges: Number(e.target.value) })
                    }
                    className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs focus:border-indigo-600 focus:outline-hidden"
                  />
                </div>
              </div>

              {/* Checkboxes */}
              <div className="space-y-2 rounded-xl border border-slate-100 bg-slate-50 p-3">
                <label className="flex items-center gap-2 text-xs text-slate-700 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.hasAirConditioning}
                    onChange={(e) =>
                      setFormData({ ...formData, hasAirConditioning: e.target.checked })
                    }
                    className="rounded text-indigo-600"
                  />
                  <span>Air Conditioning (AC)</span>
                </label>
                <label className="flex items-center gap-2 text-xs text-slate-700 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.hasAttachedBathroom}
                    onChange={(e) =>
                      setFormData({ ...formData, hasAttachedBathroom: e.target.checked })
                    }
                    className="rounded text-indigo-600"
                  />
                  <span>Attached Washroom</span>
                </label>
                <label className="flex items-center gap-2 text-xs text-slate-700 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.hasBalcony}
                    onChange={(e) => setFormData({ ...formData, hasBalcony: e.target.checked })}
                    className="rounded text-indigo-600"
                  />
                  <span>Private Balcony</span>
                </label>
              </div>

              {/* Initial Room Inventory */}
              <div className="rounded-xl border border-indigo-100 bg-indigo-50/40 p-3 space-y-2">
                <div className="text-xs font-bold text-indigo-950">
                  Initial Inventory Generation (Optional)
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] text-slate-600 mb-1">Initial Rooms</label>
                    <input
                      type="number"
                      min={0}
                      max={50}
                      value={formData.initialRoomsCount}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          initialRoomsCount: Number(e.target.value),
                        })
                      }
                      className="w-full rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs focus:border-indigo-600"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] text-slate-600 mb-1">Starting Number</label>
                    <input
                      type="number"
                      min={1}
                      value={formData.startRoomNumber}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          startRoomNumber: Number(e.target.value),
                        })
                      }
                      className="w-full rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs focus:border-indigo-600"
                    />
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsAddOpen(false)}
                  className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isLoading}
                  className="rounded-xl bg-indigo-600 px-4 py-2 text-xs font-bold text-white hover:bg-indigo-700 disabled:opacity-50"
                >
                  {isLoading ? "Saving..." : "Create Room Type"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Room Type Modal */}
      {editingRt && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4">
          <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl bg-white p-6 shadow-xl border border-slate-100">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-base font-bold text-slate-900">Edit Room Type</h3>
              <button
                onClick={() => setEditingRt(null)}
                className="h-7 w-7 rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-600 flex items-center justify-center"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleSaveEdit} className="mt-4 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Name</label>
                <input
                  type="text"
                  required
                  value={editingRt.name}
                  onChange={(e) => setEditingRt({ ...editingRt, name: e.target.value })}
                  className="w-full rounded-xl border border-slate-200 px-3.5 py-2 text-xs focus:border-indigo-600 focus:outline-hidden"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Monthly Rent (₹/bed/mo)
                  </label>
                  <input
                    type="number"
                    required
                    min={500}
                    value={editingRt.monthlyRent}
                    onChange={(e) =>
                      setEditingRt({ ...editingRt, monthlyRent: Number(e.target.value) })
                    }
                    className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs focus:border-indigo-600 focus:outline-hidden"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Security Deposit (₹)
                  </label>
                  <input
                    type="number"
                    required
                    min={0}
                    value={editingRt.securityDeposit}
                    onChange={(e) =>
                      setEditingRt({ ...editingRt, securityDeposit: Number(e.target.value) })
                    }
                    className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs focus:border-indigo-600 focus:outline-hidden"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Maintenance (₹/mo)
                  </label>
                  <input
                    type="number"
                    min={0}
                    value={editingRt.maintenanceCharges}
                    onChange={(e) =>
                      setEditingRt({
                        ...editingRt,
                        maintenanceCharges: Number(e.target.value),
                      })
                    }
                    className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs focus:border-indigo-600 focus:outline-hidden"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Food Charges (₹/mo)
                  </label>
                  <input
                    type="number"
                    min={0}
                    value={editingRt.foodCharges}
                    onChange={(e) =>
                      setEditingRt({ ...editingRt, foodCharges: Number(e.target.value) })
                    }
                    className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs focus:border-indigo-600 focus:outline-hidden"
                  />
                </div>
              </div>

              <div className="space-y-2 rounded-xl border border-slate-100 bg-slate-50 p-3">
                <label className="flex items-center gap-2 text-xs text-slate-700 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={editingRt.hasAirConditioning}
                    onChange={(e) =>
                      setEditingRt({ ...editingRt, hasAirConditioning: e.target.checked })
                    }
                    className="rounded text-indigo-600"
                  />
                  <span>Air Conditioning</span>
                </label>
                <label className="flex items-center gap-2 text-xs text-slate-700 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={editingRt.hasAttachedBathroom}
                    onChange={(e) =>
                      setEditingRt({ ...editingRt, hasAttachedBathroom: e.target.checked })
                    }
                    className="rounded text-indigo-600"
                  />
                  <span>Attached Washroom</span>
                </label>
                <label className="flex items-center gap-2 text-xs text-slate-700 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={editingRt.hasBalcony}
                    onChange={(e) =>
                      setEditingRt({ ...editingRt, hasBalcony: e.target.checked })
                    }
                    className="rounded text-indigo-600"
                  />
                  <span>Private Balcony</span>
                </label>
                <label className="flex items-center gap-2 text-xs text-slate-700 cursor-pointer pt-1 border-t border-slate-200">
                  <input
                    type="checkbox"
                    checked={editingRt.isActive}
                    onChange={(e) => setEditingRt({ ...editingRt, isActive: e.target.checked })}
                    className="rounded text-indigo-600"
                  />
                  <span className="font-semibold">Room Type is Active</span>
                </label>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setEditingRt(null)}
                  className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isLoading}
                  className="rounded-xl bg-indigo-600 px-4 py-2 text-xs font-bold text-white hover:bg-indigo-700 disabled:opacity-50"
                >
                  {isLoading ? "Saving..." : "Save Changes"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
