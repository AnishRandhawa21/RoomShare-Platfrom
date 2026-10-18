"use client";

import { useState } from "react";
import Link from "next/link";
import {
  BedDouble,
  ChevronLeft,
  Plus,
  Trash2,
  Sparkles,
  Wind,
  Bath,
  Sun,
  Edit3,
  X,
  AlertCircle,
  ImageIcon,
} from "lucide-react";
import {
  updateRoomInventoryAction,
  addSingleRoomAction,
  addRoomTypeWithInventoryAction,
  deleteRoomAction,
  togglePropertyStatusAction,
} from "@/actions/owner";
import { RoomOperationalStatus, PropertyStatus } from "@/lib/enums";

interface RoomItem {
  id: string;
  roomNumber: string;
  floor: number | null;
  occupiedBeds: number;
  status: RoomOperationalStatus;
  notes: string | null;
}

interface RoomTypeItem {
  id: string;
  name: string;
  occupancy: number;
  monthlyRent: number;
  securityDeposit: number;
  hasAttachedBathroom: boolean;
  hasBalcony: boolean;
  hasAirConditioning: boolean;
  genderRestriction: string;
  rooms: RoomItem[];
}

interface PropertyDetails {
  id: string;
  name: string;
  slug: string;
  locality: string;
  city: string;
  status: PropertyStatus;
  genderPolicy: string;
  startingPrice: number | null;
  roomTypes: RoomTypeItem[];
}

interface InventoryStats {
  totalRooms: number;
  availableRoomsCount: number;
  totalNominalCapacity: number;
  totalOccupiedBeds: number;
  totalVacantBeds: number;
  occupancyRate: number;
}

interface RoomInventoryManagerProps {
  initialProperty: PropertyDetails;
  initialStats: InventoryStats;
}

export function RoomInventoryManager({
  initialProperty,
  initialStats,
}: RoomInventoryManagerProps) {
  const [property, setProperty] = useState<PropertyDetails>(initialProperty);
  const [stats, setStats] = useState<InventoryStats>(initialStats);
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [activeRoomTypeId, setActiveRoomTypeId] = useState<string>("ALL");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isUpdating, setIsUpdating] = useState<string | null>(null);

  // Modal States
  const [isAddRoomModalOpen, setIsAddRoomModalOpen] = useState(false);
  const [targetRoomTypeId, setTargetRoomTypeId] = useState<string>("");
  const [newRoomNumber, setNewRoomNumber] = useState("");
  const [newRoomFloor, setNewRoomFloor] = useState<number>(1);
  const [newRoomNotes, setNewRoomNotes] = useState("");

  const [isAddRoomTypeModalOpen, setIsAddRoomTypeModalOpen] = useState(false);
  const [newTypeName, setNewTypeName] = useState("");
  const [newTypeOccupancy, setNewTypeOccupancy] = useState<number>(2);
  const [newTypeRent, setNewTypeRent] = useState<number>(10000);
  const [newTypeDeposit, setNewTypeDeposit] = useState<number>(20000);
  const [newTypeAC, setNewTypeAC] = useState(true);
  const [newTypeBath, setNewTypeBath] = useState(true);
  const [newTypeBalcony, setNewTypeBalcony] = useState(false);
  const [newTypeRoomCount, setNewTypeRoomCount] = useState<number>(4);
  const [newTypeStartRoomNum, setNewTypeStartRoomNum] = useState<number>(301);

  // Notes Modal state
  const [editingNotesRoom, setEditingNotesRoom] = useState<RoomItem | null>(null);
  const [notesInput, setNotesInput] = useState("");

  // Recompute local stats
  const recalculateStats = (currentTypes: RoomTypeItem[]) => {
    let totalRooms = 0;
    let availableRoomsCount = 0;
    let totalNominalCapacity = 0;
    let totalOccupiedBeds = 0;

    currentTypes.forEach((rt) => {
      totalRooms += rt.rooms.length;
      rt.rooms.forEach((r) => {
        if (r.status === RoomOperationalStatus.AVAILABLE) {
          availableRoomsCount++;
          totalNominalCapacity += rt.occupancy;
          totalOccupiedBeds += r.occupiedBeds;
        } else if (r.status !== RoomOperationalStatus.INACTIVE) {
          totalNominalCapacity += rt.occupancy;
          totalOccupiedBeds += r.occupiedBeds;
        }
      });
    });

    const totalVacantBeds = Math.max(0, totalNominalCapacity - totalOccupiedBeds);
    const occupancyRate =
      totalNominalCapacity > 0 ? Math.round((totalOccupiedBeds / totalNominalCapacity) * 100) : 0;

    setStats({
      totalRooms,
      availableRoomsCount,
      totalNominalCapacity,
      totalOccupiedBeds,
      totalVacantBeds,
      occupancyRate,
    });
  };

  // Adjust occupied beds (+ / -)
  const handleAdjustBeds = async (
    roomTypeId: string,
    roomId: string,
    delta: number,
    currentOccupied: number,
    maxCapacity: number
  ) => {
    const nextBeds = currentOccupied + delta;
    if (nextBeds < 0 || nextBeds > maxCapacity) return;

    setIsUpdating(roomId);
    setErrorMsg(null);

    const res = await updateRoomInventoryAction(roomId, { occupiedBeds: nextBeds });
    setIsUpdating(null);

    if (res.success && res.room) {
      const updatedTypes = property.roomTypes.map((rt) => {
        if (rt.id !== roomTypeId) return rt;
        return {
          ...rt,
          rooms: rt.rooms.map((r) => (r.id === roomId ? { ...r, occupiedBeds: nextBeds } : r)),
        };
      });

      setProperty({ ...property, roomTypes: updatedTypes });
      recalculateStats(updatedTypes);
    } else {
      setErrorMsg(res.error || "Failed to update room occupancy.");
    }
  };

  // Change room operational status
  const handleChangeStatus = async (
    roomTypeId: string,
    roomId: string,
    newStatus: RoomOperationalStatus
  ) => {
    setIsUpdating(roomId);
    setErrorMsg(null);

    const res = await updateRoomInventoryAction(roomId, { status: newStatus });
    setIsUpdating(null);

    if (res.success && res.room) {
      const updatedTypes = property.roomTypes.map((rt) => {
        if (rt.id !== roomTypeId) return rt;
        return {
          ...rt,
          rooms: rt.rooms.map((r) => (r.id === roomId ? { ...r, status: newStatus } : r)),
        };
      });

      setProperty({ ...property, roomTypes: updatedTypes });
      recalculateStats(updatedTypes);
    } else {
      setErrorMsg(res.error || "Failed to update room status.");
    }
  };

  // Save room notes
  const handleSaveNotes = async () => {
    if (!editingNotesRoom) return;
    setIsUpdating(editingNotesRoom.id);
    const res = await updateRoomInventoryAction(editingNotesRoom.id, { notes: notesInput });
    setIsUpdating(null);

    if (res.success) {
      const updatedTypes = property.roomTypes.map((rt) => ({
        ...rt,
        rooms: rt.rooms.map((r) =>
          r.id === editingNotesRoom.id ? { ...r, notes: notesInput.trim() || null } : r
        ),
      }));
      setProperty({ ...property, roomTypes: updatedTypes });
      setEditingNotesRoom(null);
    } else {
      setErrorMsg(res.error || "Failed to save room notes.");
    }
  };

  // Delete Room
  const handleDeleteRoom = async (roomTypeId: string, roomId: string) => {
    if (!confirm("Are you sure you want to remove this room from inventory?")) return;

    setIsUpdating(roomId);
    const res = await deleteRoomAction(roomId);
    setIsUpdating(null);

    if (res.success) {
      const updatedTypes = property.roomTypes.map((rt) => {
        if (rt.id !== roomTypeId) return rt;
        return {
          ...rt,
          rooms: rt.rooms.filter((r) => r.id !== roomId),
        };
      });
      setProperty({ ...property, roomTypes: updatedTypes });
      recalculateStats(updatedTypes);
    } else {
      setErrorMsg(res.error || "Failed to delete room.");
    }
  };

  // Submit Add Single Room Modal
  const handleAddSingleRoom = async () => {
    if (!newRoomNumber.trim()) {
      setErrorMsg("Please enter a room number (e.g. 105).");
      return;
    }
    setErrorMsg(null);

    const res = await addSingleRoomAction(targetRoomTypeId, {
      roomNumber: newRoomNumber.trim(),
      floor: newRoomFloor,
      notes: newRoomNotes.trim() || undefined,
    });

    if (res.success && res.room) {
      const updatedTypes = property.roomTypes.map((rt) => {
        if (rt.id !== targetRoomTypeId) return rt;
        return {
          ...rt,
          rooms: [...rt.rooms, res.room as RoomItem].sort((a, b) =>
            a.roomNumber.localeCompare(b.roomNumber, undefined, { numeric: true })
          ),
        };
      });
      setProperty({ ...property, roomTypes: updatedTypes });
      recalculateStats(updatedTypes);
      setIsAddRoomModalOpen(false);
      setNewRoomNumber("");
      setNewRoomNotes("");
    } else {
      setErrorMsg(res.error || "Failed to add room.");
    }
  };

  // Submit Add New Room Type Modal
  const handleAddNewRoomType = async () => {
    if (!newTypeName.trim()) {
      setErrorMsg("Please enter a room type name.");
      return;
    }
    setErrorMsg(null);

    const res = await addRoomTypeWithInventoryAction(property.id, {
      name: newTypeName.trim(),
      occupancy: newTypeOccupancy,
      monthlyRent: newTypeRent,
      securityDeposit: newTypeDeposit,
      hasAirConditioning: newTypeAC,
      hasAttachedBathroom: newTypeBath,
      hasBalcony: newTypeBalcony,
      initialRoomsCount: newTypeRoomCount,
      startRoomNumber: newTypeStartRoomNum,
      floor: Math.floor(newTypeStartRoomNum / 100) || 1,
    });

    if (res.success && res.roomType) {
      window.location.reload(); // Refresh to load fresh nested relations
    } else {
      setErrorMsg(res.error || "Failed to add room type.");
    }
  };

  // Toggle Property Status
  const handleTogglePropertyStatus = async () => {
    const nextStatus =
      property.status === PropertyStatus.PUBLISHED ? PropertyStatus.DRAFT : PropertyStatus.PUBLISHED;
    const res = await togglePropertyStatusAction(property.id, nextStatus);
    if (res.success && res.status) {
      setProperty({ ...property, status: res.status as PropertyStatus });
    }
  };

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Breadcrumb & Navigation */}
      <div className="flex items-center gap-2 text-xs font-semibold text-zinc-600">
        <Link
          href="/owner/properties"
          className="flex items-center gap-1 hover:text-indigo-600 transition-colors"
        >
          <ChevronLeft className="h-4 w-4" />
          <span>My Properties</span>
        </Link>
        <span>/</span>
        <span className="text-zinc-900 font-bold">{property.name}</span>
        <span>/</span>
        <span className="text-indigo-600">Room Inventory</span>
      </div>

      {/* Property Header */}
      <div className="rounded-3xl border border-zinc-200 bg-white p-6 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span
              className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold ${
                property.status === PropertyStatus.PUBLISHED
                  ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                  : "bg-amber-50 text-amber-700 border border-amber-200"
              }`}
            >
              <span
                className={`h-2 w-2 rounded-full ${
                  property.status === PropertyStatus.PUBLISHED ? "bg-emerald-600" : "bg-amber-500"
                }`}
              />
              <span>{property.status}</span>
            </span>

            <span className="rounded-full bg-zinc-100 px-3 py-1 text-xs font-semibold text-zinc-700">
              {property.genderPolicy.replace(/_/g, " ")}
            </span>
          </div>

          <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-zinc-900">
            {property.name}
          </h1>
          <p className="text-xs text-zinc-600 mt-1">
            {property.locality}, {property.city} • Starting from ₹
            {property.startingPrice?.toLocaleString("en-IN") || "N/A"}/mo
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <Link
            href={`/owner/properties/${property.id}/photos`}
            className="flex items-center gap-1.5 rounded-full border border-indigo-200 bg-indigo-50 px-4 py-2 text-xs font-bold text-indigo-700 hover:bg-indigo-100 transition-colors"
          >
            <ImageIcon className="h-4 w-4" />
            <span>Manage Photos (R2)</span>
          </Link>

          <button
            type="button"
            onClick={handleTogglePropertyStatus}
            className="rounded-full border border-zinc-200 bg-zinc-50 px-4 py-2 text-xs font-bold text-zinc-700 hover:bg-zinc-100 transition-colors cursor-pointer"
          >
            {property.status === PropertyStatus.PUBLISHED ? "Unpublish to Draft" : "Publish Live"}
          </button>

          <button
            type="button"
            onClick={() => setIsAddRoomTypeModalOpen(true)}
            className="flex items-center gap-1.5 rounded-full bg-indigo-600 px-4 py-2 text-xs font-bold text-white hover:bg-indigo-700 shadow-md shadow-indigo-100 transition-all cursor-pointer"
          >
            <Plus className="h-4 w-4" />
            <span>Add New Room Type</span>
          </button>
        </div>
      </div>

      {/* Real-time Inventory KPI Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <div className="rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm">
          <div className="text-[11px] font-bold uppercase tracking-wider text-zinc-600">
            Total Rooms
          </div>
          <div className="mt-2 text-2xl font-black text-zinc-900">{stats.totalRooms}</div>
          <div className="mt-1 text-[11px] text-zinc-600">
            {stats.availableRoomsCount} operational
          </div>
        </div>

        <div className="rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm">
          <div className="text-[11px] font-bold uppercase tracking-wider text-zinc-600">
            Total Beds
          </div>
          <div className="mt-2 text-2xl font-black text-zinc-900">
            {stats.totalNominalCapacity}
          </div>
          <div className="mt-1 text-[11px] text-zinc-600">Maximum capacity</div>
        </div>

        <div className="rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm">
          <div className="text-[11px] font-bold uppercase tracking-wider text-zinc-600">
            Occupied Beds
          </div>
          <div className="mt-2 text-2xl font-black text-emerald-600">{stats.totalOccupiedBeds}</div>
          <div className="mt-1 text-[11px] text-emerald-700 font-semibold">
            {stats.occupancyRate}% Occupied
          </div>
        </div>

        <div className="rounded-2xl border border-indigo-100 bg-indigo-50/60 p-4 shadow-sm">
          <div className="text-[11px] font-bold uppercase tracking-wider text-indigo-900">
            Vacant Beds
          </div>
          <div className="mt-2 text-2xl font-black text-indigo-600">{stats.totalVacantBeds}</div>
          <div className="mt-1 text-[11px] text-indigo-700 font-semibold">Ready for move-in</div>
        </div>

        <div className="rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm col-span-2 md:col-span-1">
          <div className="text-[11px] font-bold uppercase tracking-wider text-zinc-600">
            Occupancy Bar
          </div>
          <div className="mt-3 h-2.5 w-full rounded-full bg-zinc-100 overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-500 ${
                stats.occupancyRate >= 90
                  ? "bg-rose-500"
                  : stats.occupancyRate >= 70
                  ? "bg-indigo-600"
                  : "bg-emerald-500"
              }`}
              style={{ width: `${Math.min(100, stats.occupancyRate)}%` }}
            />
          </div>
          <div className="mt-2 text-[11px] text-zinc-600 text-right font-bold">
            {stats.occupancyRate}% Filled
          </div>
        </div>
      </div>

      {/* Error Alert */}
      {errorMsg && (
        <div className="flex items-start gap-3 rounded-2xl border border-red-200 bg-red-50 p-4 text-xs font-semibold text-red-800">
          <AlertCircle className="h-4 w-4 shrink-0 text-red-600 mt-0.5" />
          <div className="flex-1">{errorMsg}</div>
          <button
            type="button"
            onClick={() => setErrorMsg(null)}
            className="text-red-500 hover:text-red-700 font-bold"
          >
            ×
          </button>
        </div>
      )}

      {/* Filter Tabs by Room Type & Status */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 border-b border-zinc-200 pb-3">
        {/* Room Type Selector */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
          <button
            type="button"
            onClick={() => setActiveRoomTypeId("ALL")}
            className={`rounded-full px-3.5 py-1.5 text-xs font-bold whitespace-nowrap cursor-pointer transition-colors ${
              activeRoomTypeId === "ALL"
                ? "bg-zinc-900 text-white"
                : "bg-zinc-100 text-zinc-700 hover:bg-zinc-200"
            }`}
          >
            All Room Types ({property.roomTypes.length})
          </button>
          {property.roomTypes.map((rt) => (
            <button
              key={rt.id}
              type="button"
              onClick={() => setActiveRoomTypeId(rt.id)}
              className={`rounded-full px-3.5 py-1.5 text-xs font-bold whitespace-nowrap cursor-pointer transition-colors ${
                activeRoomTypeId === rt.id
                  ? "bg-indigo-600 text-white shadow-sm"
                  : "bg-zinc-100 text-zinc-700 hover:bg-zinc-200"
              }`}
            >
              {rt.name} ({rt.rooms.length})
            </button>
          ))}
        </div>

        {/* Operational Status Filter */}
        <div className="flex items-center gap-2">
          <span className="text-[11px] font-bold text-zinc-600 uppercase">Status:</span>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="rounded-xl border border-zinc-200 bg-white px-3 py-1.5 text-xs font-semibold text-zinc-900 focus:outline-none focus:border-indigo-600"
          >
            <option value="ALL">All Rooms</option>
            <option value={RoomOperationalStatus.AVAILABLE}>Available Only</option>
            <option value={RoomOperationalStatus.UNDER_MAINTENANCE}>Under Maintenance</option>
            <option value={RoomOperationalStatus.RESERVED}>Reserved</option>
            <option value={RoomOperationalStatus.INACTIVE}>Inactive</option>
          </select>
        </div>
      </div>

      {/* Room Types & Individual Room Cards Grid */}
      <div className="space-y-10">
        {property.roomTypes
          .filter((rt) => activeRoomTypeId === "ALL" || activeRoomTypeId === rt.id)
          .map((roomType) => {
            const filteredRooms = roomType.rooms.filter(
              (r) => statusFilter === "ALL" || r.status === statusFilter
            );

            // Compute room type specific occupancy
            const rtNominalCapacity = roomType.occupancy * roomType.rooms.length;
            const rtOccupiedBeds = roomType.rooms.reduce((acc, r) => acc + r.occupiedBeds, 0);
            const rtVacantBeds = Math.max(0, rtNominalCapacity - rtOccupiedBeds);

            return (
              <div
                key={roomType.id}
                className="rounded-3xl border border-zinc-200 bg-white p-6 shadow-sm space-y-6"
              >
                {/* Room Type Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-zinc-100 gap-4">
                  <div>
                    <div className="flex items-center gap-2">
                      <h2 className="text-xl font-black text-zinc-900">{roomType.name}</h2>
                      <span className="rounded-full bg-indigo-50 border border-indigo-200 px-2.5 py-0.5 text-xs font-bold text-indigo-700">
                        {roomType.occupancy} {roomType.occupancy === 1 ? "Bed" : "Beds"} per room
                      </span>
                    </div>

                    <div className="flex flex-wrap items-center gap-3 text-xs text-zinc-600 mt-1">
                      <span className="font-bold text-zinc-900">
                        ₹{roomType.monthlyRent.toLocaleString("en-IN")}/mo
                      </span>
                      <span>• Deposit: ₹{roomType.securityDeposit.toLocaleString("en-IN")}</span>
                      <span>• {rtOccupiedBeds}/{rtNominalCapacity} Beds Occupied ({rtVacantBeds} Vacant)</span>
                    </div>

                    {/* Features Badges */}
                    <div className="flex items-center gap-2 mt-2">
                      {roomType.hasAirConditioning && (
                        <span className="inline-flex items-center gap-1 rounded-md bg-blue-50 px-2 py-0.5 text-[10px] font-bold text-blue-700">
                          <Wind className="h-3 w-3" /> AC
                        </span>
                      )}
                      {roomType.hasAttachedBathroom && (
                        <span className="inline-flex items-center gap-1 rounded-md bg-teal-50 px-2 py-0.5 text-[10px] font-bold text-teal-700">
                          <Bath className="h-3 w-3" /> Attached Bath
                        </span>
                      )}
                      {roomType.hasBalcony && (
                        <span className="inline-flex items-center gap-1 rounded-md bg-amber-50 px-2 py-0.5 text-[10px] font-bold text-amber-700">
                          <Sun className="h-3 w-3" /> Balcony
                        </span>
                      )}
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      setTargetRoomTypeId(roomType.id);
                      setIsAddRoomModalOpen(true);
                    }}
                    className="inline-flex items-center gap-1.5 rounded-full border border-zinc-200 bg-zinc-50 px-3.5 py-2 text-xs font-bold text-zinc-700 hover:bg-zinc-100 hover:border-zinc-300 transition-colors cursor-pointer self-start sm:self-auto"
                  >
                    <Plus className="h-3.5 w-3.5 text-indigo-600" />
                    <span>Add Room to {roomType.name}</span>
                  </button>
                </div>

                {/* Rooms Grid */}
                {filteredRooms.length === 0 ? (
                  <div className="rounded-2xl border border-dashed border-zinc-200 py-8 text-center text-xs font-semibold text-zinc-600">
                    No rooms found matching the current filter.
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                    {filteredRooms.map((room) => {
                      const availableBeds = Math.max(0, roomType.occupancy - room.occupiedBeds);
                      const isFull = availableBeds === 0;

                      return (
                        <div
                          key={room.id}
                          className={`rounded-2xl border p-4 flex flex-col justify-between transition-all ${
                            room.status === RoomOperationalStatus.UNDER_MAINTENANCE
                              ? "border-amber-200 bg-amber-50/40"
                              : room.status === RoomOperationalStatus.RESERVED
                              ? "border-blue-200 bg-blue-50/40"
                              : room.status === RoomOperationalStatus.INACTIVE
                              ? "border-zinc-200 bg-zinc-100 opacity-60"
                              : isFull
                              ? "border-zinc-200 bg-zinc-50"
                              : "border-indigo-100 bg-white hover:border-indigo-300 shadow-sm"
                          }`}
                        >
                          <div>
                            {/* Room Header: Room Number & Status Dropdown */}
                            <div className="flex items-center justify-between mb-3">
                              <div className="flex items-center gap-1.5">
                                <span className="text-base font-black text-zinc-900">
                                  #{room.roomNumber}
                                </span>
                                {room.floor && (
                                  <span className="text-[10px] font-semibold text-zinc-600">
                                    (F{room.floor})
                                  </span>
                                )}
                              </div>

                              {/* Status Dropdown */}
                              <select
                                value={room.status}
                                disabled={isUpdating === room.id}
                                onChange={(e) =>
                                  handleChangeStatus(
                                    roomType.id,
                                    room.id,
                                    e.target.value as RoomOperationalStatus
                                  )
                                }
                                className={`rounded-lg px-2 py-1 text-[11px] font-bold border cursor-pointer focus:outline-none ${
                                  room.status === RoomOperationalStatus.AVAILABLE
                                    ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                                    : room.status === RoomOperationalStatus.UNDER_MAINTENANCE
                                    ? "bg-amber-50 text-amber-700 border-amber-200"
                                    : room.status === RoomOperationalStatus.RESERVED
                                    ? "bg-blue-50 text-blue-700 border-blue-200"
                                    : "bg-zinc-200 text-zinc-700 border-zinc-300"
                                }`}
                              >
                                <option value={RoomOperationalStatus.AVAILABLE}>Available</option>
                                <option value={RoomOperationalStatus.UNDER_MAINTENANCE}>
                                  Maintenance
                                </option>
                                <option value={RoomOperationalStatus.RESERVED}>Reserved</option>
                                <option value={RoomOperationalStatus.INACTIVE}>Inactive</option>
                              </select>
                            </div>

                            {/* Bed Occupancy Stepper (+ / -) */}
                            <div className="rounded-xl border border-zinc-200 bg-white p-3 space-y-2">
                              <div className="flex items-center justify-between text-xs">
                                <span className="font-bold text-zinc-700">Bed Occupancy:</span>
                                <span
                                  className={`font-black ${
                                    isFull ? "text-rose-600" : "text-emerald-600"
                                  }`}
                                >
                                  {room.occupiedBeds} / {roomType.occupancy} Beds
                                </span>
                              </div>

                              {/* Visual Bed Glyphs */}
                              <div className="flex items-center gap-1.5">
                                {Array.from({ length: roomType.occupancy }).map((_, bIdx) => (
                                  <div
                                    key={bIdx}
                                    className={`h-2 flex-1 rounded-full ${
                                      bIdx < room.occupiedBeds
                                        ? "bg-indigo-600"
                                        : "bg-zinc-200"
                                    }`}
                                    title={bIdx < room.occupiedBeds ? "Occupied" : "Vacant"}
                                  />
                                ))}
                              </div>

                              {/* Stepper Buttons */}
                              <div className="flex items-center justify-between pt-1">
                                <button
                                  type="button"
                                  disabled={room.occupiedBeds <= 0 || isUpdating === room.id}
                                  onClick={() =>
                                    handleAdjustBeds(
                                      roomType.id,
                                      room.id,
                                      -1,
                                      room.occupiedBeds,
                                      roomType.occupancy
                                    )
                                  }
                                  className="h-7 w-7 flex items-center justify-center rounded-lg border border-zinc-200 bg-zinc-50 text-zinc-700 hover:bg-zinc-100 text-sm font-bold disabled:opacity-40 cursor-pointer"
                                  title="Release 1 bed"
                                >
                                  -
                                </button>

                                <span className="text-[11px] font-semibold text-zinc-600">
                                  {availableBeds > 0 ? `${availableBeds} vacant` : "Fully occupied"}
                                </span>

                                <button
                                  type="button"
                                  disabled={
                                    room.occupiedBeds >= roomType.occupancy ||
                                    isUpdating === room.id
                                  }
                                  onClick={() =>
                                    handleAdjustBeds(
                                      roomType.id,
                                      room.id,
                                      1,
                                      room.occupiedBeds,
                                      roomType.occupancy
                                    )
                                  }
                                  className="h-7 w-7 flex items-center justify-center rounded-lg border border-zinc-200 bg-zinc-50 text-zinc-700 hover:bg-zinc-100 text-sm font-bold disabled:opacity-40 cursor-pointer"
                                  title="Occupy 1 bed"
                                >
                                  +
                                </button>
                              </div>
                            </div>

                            {/* Room Notes Preview */}
                            {room.notes ? (
                              <p className="mt-2 text-[11px] text-zinc-600 line-clamp-2 italic bg-zinc-50 rounded-lg p-1.5 border border-zinc-100">
                                &ldquo;{room.notes}&rdquo;
                              </p>
                            ) : null}
                          </div>

                          {/* Footer Actions */}
                          <div className="mt-3 pt-2 border-t border-zinc-100 flex items-center justify-between text-[11px] text-zinc-600">
                            <button
                              type="button"
                              onClick={() => {
                                setEditingNotesRoom(room);
                                setNotesInput(room.notes || "");
                              }}
                              className="hover:text-indigo-600 font-semibold flex items-center gap-1 cursor-pointer"
                            >
                              <Edit3 className="h-3 w-3" />
                              <span>{room.notes ? "Edit Note" : "+ Note"}</span>
                            </button>

                            <button
                              type="button"
                              disabled={isUpdating === room.id}
                              onClick={() => handleDeleteRoom(roomType.id, room.id)}
                              className="hover:text-red-600 text-zinc-600 p-1 cursor-pointer"
                              title="Delete room"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
      </div>

      {/* ========================================================================= */}
      {/* MODAL 1: ADD SINGLE ROOM */}
      {/* ========================================================================= */}
      {isAddRoomModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in">
          <div className="w-full max-w-md rounded-3xl border border-zinc-200 bg-white p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-zinc-100 pb-3">
              <h3 className="text-base font-bold text-zinc-900 flex items-center gap-2">
                <BedDouble className="h-5 w-5 text-indigo-600" />
                <span>Add Room to Inventory</span>
              </h3>
              <button
                type="button"
                onClick={() => setIsAddRoomModalOpen(false)}
                className="text-zinc-600 hover:text-zinc-700"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-zinc-700 mb-1">
                Room Number *
              </label>
              <input
                type="text"
                placeholder="e.g. 106, 204-B"
                value={newRoomNumber}
                onChange={(e) => setNewRoomNumber(e.target.value)}
                className="w-full rounded-xl border border-zinc-200 bg-zinc-50 px-3.5 py-2 text-sm font-semibold text-zinc-900 focus:bg-white focus:border-indigo-600 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-zinc-700 mb-1">
                Floor
              </label>
              <input
                type="number"
                value={newRoomFloor}
                onChange={(e) => setNewRoomFloor(parseInt(e.target.value, 10) || 1)}
                className="w-full rounded-xl border border-zinc-200 bg-zinc-50 px-3.5 py-2 text-sm font-semibold text-zinc-900 focus:bg-white focus:border-indigo-600 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-zinc-700 mb-1">
                Internal Note (Optional)
              </label>
              <input
                type="text"
                placeholder="e.g. Near elevator, recently painted"
                value={newRoomNotes}
                onChange={(e) => setNewRoomNotes(e.target.value)}
                className="w-full rounded-xl border border-zinc-200 bg-zinc-50 px-3.5 py-2 text-sm font-semibold text-zinc-900 focus:bg-white focus:border-indigo-600 focus:outline-none"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-zinc-100">
              <button
                type="button"
                onClick={() => setIsAddRoomModalOpen(false)}
                className="rounded-full px-4 py-2 text-xs font-bold text-zinc-600 hover:bg-zinc-100 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleAddSingleRoom}
                className="rounded-full bg-indigo-600 px-5 py-2 text-xs font-bold text-white hover:bg-indigo-700 shadow-md shadow-indigo-100 cursor-pointer"
              >
                Create Room
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 2: ADD NEW ROOM TYPE */}
      {/* ========================================================================= */}
      {isAddRoomTypeModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in">
          <div className="w-full max-w-lg rounded-3xl border border-zinc-200 bg-white p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-zinc-100 pb-3">
              <h3 className="text-base font-bold text-zinc-900 flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-indigo-600" />
                <span>Add New Room Type & Initial Rooms</span>
              </h3>
              <button
                type="button"
                onClick={() => setIsAddRoomTypeModalOpen(false)}
                className="text-zinc-600 hover:text-zinc-700"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="sm:col-span-2">
                <label className="block text-xs font-bold uppercase tracking-wider text-zinc-700 mb-1">
                  Room Type Name *
                </label>
                <input
                  type="text"
                  placeholder="e.g. 3-Seater Premium AC"
                  value={newTypeName}
                  onChange={(e) => setNewTypeName(e.target.value)}
                  className="w-full rounded-xl border border-zinc-200 bg-zinc-50 px-3.5 py-2 text-sm font-semibold text-zinc-900 focus:bg-white focus:border-indigo-600 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-zinc-700 mb-1">
                  Nominal Capacity (Beds) *
                </label>
                <input
                  type="number"
                  min="1"
                  max="10"
                  value={newTypeOccupancy}
                  onChange={(e) => setNewTypeOccupancy(parseInt(e.target.value, 10) || 1)}
                  className="w-full rounded-xl border border-zinc-200 bg-zinc-50 px-3.5 py-2 text-sm font-semibold text-zinc-900 focus:bg-white focus:border-indigo-600 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-zinc-700 mb-1">
                  Monthly Rent (₹/Bed) *
                </label>
                <input
                  type="number"
                  min="1000"
                  value={newTypeRent}
                  onChange={(e) => setNewTypeRent(parseInt(e.target.value, 10) || 0)}
                  className="w-full rounded-xl border border-zinc-200 bg-zinc-50 px-3.5 py-2 text-sm font-semibold text-zinc-900 focus:bg-white focus:border-indigo-600 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-zinc-700 mb-1">
                  Security Deposit (₹)
                </label>
                <input
                  type="number"
                  min="0"
                  value={newTypeDeposit}
                  onChange={(e) => setNewTypeDeposit(parseInt(e.target.value, 10) || 0)}
                  className="w-full rounded-xl border border-zinc-200 bg-zinc-50 px-3.5 py-2 text-sm font-semibold text-zinc-900 focus:bg-white focus:border-indigo-600 focus:outline-none"
                />
              </div>

              {/* Feature checkboxes */}
              <div className="sm:col-span-2 flex flex-wrap gap-4 pt-1">
                <label className="flex items-center gap-2 text-xs font-semibold text-zinc-700 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={newTypeAC}
                    onChange={(e) => setNewTypeAC(e.target.checked)}
                    className="rounded text-indigo-600"
                  />
                  <span>Air Conditioning</span>
                </label>
                <label className="flex items-center gap-2 text-xs font-semibold text-zinc-700 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={newTypeBath}
                    onChange={(e) => setNewTypeBath(e.target.checked)}
                    className="rounded text-indigo-600"
                  />
                  <span>Attached Bathroom</span>
                </label>
                <label className="flex items-center gap-2 text-xs font-semibold text-zinc-700 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={newTypeBalcony}
                    onChange={(e) => setNewTypeBalcony(e.target.checked)}
                    className="rounded text-indigo-600"
                  />
                  <span>Balcony</span>
                </label>
              </div>
            </div>

            {/* Initial Rooms Auto-Provisioner Box */}
            <div className="rounded-2xl border border-indigo-100 bg-indigo-50/50 p-4 space-y-3">
              <span className="text-xs font-bold text-indigo-950 block">
                Auto-generate Rooms for this Room Type
              </span>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-indigo-900 mb-1">
                    Start Room Number
                  </label>
                  <input
                    type="number"
                    value={newTypeStartRoomNum}
                    onChange={(e) =>
                      setNewTypeStartRoomNum(parseInt(e.target.value, 10) || 101)
                    }
                    className="w-full rounded-lg border border-indigo-200 bg-white px-3 py-1.5 text-xs font-semibold text-zinc-900"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-indigo-900 mb-1">
                    Number of Rooms
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="50"
                    value={newTypeRoomCount}
                    onChange={(e) => setNewTypeRoomCount(parseInt(e.target.value, 10) || 1)}
                    className="w-full rounded-lg border border-indigo-200 bg-white px-3 py-1.5 text-xs font-semibold text-zinc-900"
                  />
                </div>
              </div>
              <p className="text-[11px] text-indigo-700">
                Will create {newTypeRoomCount} rooms (e.g. Room {newTypeStartRoomNum} to{" "}
                {newTypeStartRoomNum + newTypeRoomCount - 1}) with{" "}
                {newTypeRoomCount * newTypeOccupancy} total beds.
              </p>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-zinc-100">
              <button
                type="button"
                onClick={() => setIsAddRoomTypeModalOpen(false)}
                className="rounded-full px-4 py-2 text-xs font-bold text-zinc-600 hover:bg-zinc-100 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleAddNewRoomType}
                className="rounded-full bg-indigo-600 px-5 py-2 text-xs font-bold text-white hover:bg-indigo-700 shadow-md shadow-indigo-100 cursor-pointer"
              >
                Create Room Type & Rooms
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 3: EDIT ROOM NOTES */}
      {/* ========================================================================= */}
      {editingNotesRoom && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in">
          <div className="w-full max-w-sm rounded-3xl border border-zinc-200 bg-white p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-zinc-100 pb-3">
              <h3 className="text-base font-bold text-zinc-900">
                Notes for Room #{editingNotesRoom.roomNumber}
              </h3>
              <button
                type="button"
                onClick={() => setEditingNotesRoom(null)}
                className="text-zinc-600 hover:text-zinc-700"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <textarea
              rows={4}
              value={notesInput}
              onChange={(e) => setNotesInput(e.target.value)}
              placeholder="e.g. Tenant Amit moved in 1st Oct. Bed 2 vacant."
              className="w-full rounded-xl border border-zinc-200 bg-zinc-50 p-3 text-xs font-medium text-zinc-900 focus:bg-white focus:border-indigo-600 focus:outline-none"
            />

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-zinc-100">
              <button
                type="button"
                onClick={() => setEditingNotesRoom(null)}
                className="rounded-full px-4 py-2 text-xs font-bold text-zinc-600 hover:bg-zinc-100 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSaveNotes}
                className="rounded-full bg-indigo-600 px-5 py-2 text-xs font-bold text-white hover:bg-indigo-700 shadow-md shadow-indigo-100 cursor-pointer"
              >
                Save Note
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
