"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Building2,
  PlusCircle,
  BedDouble,
  CheckCircle2,
  Sparkles,
  Search,
  TrendingUp,
  Edit3,
  Star,
} from "lucide-react";
import { PropertyStatus } from "@/lib/enums";
import { togglePropertyStatusAction } from "@/actions/owner";

interface PropertyItem {
  id: string;
  name: string;
  slug: string;
  city: string;
  locality: string;
  genderPolicy: string;
  status: PropertyStatus;
  startingPrice: number | null;
  totalRooms: number;
  totalNominalCapacity: number;
  totalOccupiedBeds: number;
  totalVacantBeds: number;
  occupancyRate: number;
  averageRating?: number | null;
  reviewCount?: number;
  roomTypes: Array<{
    id: string;
    name: string;
    occupancy: number;
    monthlyRent: number;
    rooms: Array<{ id: string; roomNumber: string; occupiedBeds: number; status: string }>;
  }>;
}

interface OwnerPropertiesListProps {
  initialProperties: PropertyItem[];
  hasOwnerProfile: boolean;
}

export function OwnerPropertiesList({
  initialProperties,
  hasOwnerProfile,
}: OwnerPropertiesListProps) {
  const [properties, setProperties] = useState<PropertyItem[]>(initialProperties);
  const [prevInitial, setPrevInitial] = useState(initialProperties);

  if (initialProperties !== prevInitial) {
    setPrevInitial(initialProperties);
    setProperties(initialProperties);
  }

  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState<string>("ALL");
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  // Compute aggregated KPI totals
  const totalProperties = properties.length;
  const totalRooms = properties.reduce((acc, p) => acc + p.totalRooms, 0);
  const totalNominalCapacity = properties.reduce((acc, p) => acc + p.totalNominalCapacity, 0);
  const totalOccupiedBeds = properties.reduce((acc, p) => acc + p.totalOccupiedBeds, 0);
  const totalVacantBeds = Math.max(0, totalNominalCapacity - totalOccupiedBeds);
  const overallOccupancyRate =
    totalNominalCapacity > 0 ? Math.round((totalOccupiedBeds / totalNominalCapacity) * 100) : 0;

  // Filtered properties
  const filtered = properties.filter((prop) => {
    const matchesSearch =
      prop.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      prop.locality.toLowerCase().includes(searchQuery.toLowerCase()) ||
      prop.city.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus =
      filterStatus === "ALL" ||
      (filterStatus === "PUBLISHED" && prop.status === PropertyStatus.PUBLISHED) ||
      (filterStatus === "DRAFT" && prop.status === PropertyStatus.DRAFT);
    return matchesSearch && matchesStatus;
  });

  const handleToggleStatus = async (propertyId: string, currentStatus: PropertyStatus) => {
    const nextStatus =
      currentStatus === PropertyStatus.PUBLISHED ? PropertyStatus.DRAFT : PropertyStatus.PUBLISHED;

    setUpdatingId(propertyId);
    const res = await togglePropertyStatusAction(propertyId, nextStatus);
    setUpdatingId(null);

    if (res.success && res.status) {
      setProperties((prev) =>
        prev.map((p) => (p.id === propertyId ? { ...p, status: res.status as PropertyStatus } : p))
      );
    }
  };

  if (!hasOwnerProfile || totalProperties === 0) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-16 text-center">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600 mb-4 shadow-sm">
          <Building2 className="h-8 w-8" />
        </div>
        <h2 className="text-2xl font-black text-zinc-900">Welcome to StayKro Owner Hub</h2>
        <p className="mt-2 text-sm text-zinc-600 max-w-md mx-auto">
          Start listing your PG properties, define your room sharing inventory, and manage tenant
          vacancies in real-time.
        </p>
        <div className="mt-6">
          <Link
            href="/owner/onboarding"
            className="inline-flex items-center gap-2 rounded-full bg-indigo-600 px-6 py-3 text-sm font-bold text-white hover:bg-indigo-700 shadow-md shadow-indigo-100 transition-all"
          >
            <PlusCircle className="h-4 w-4" />
            <span>Onboard Your First PG</span>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-zinc-900">
            Property Portfolio & Occupancy
          </h1>
          <p className="mt-1 text-sm text-zinc-600">
            Monitor real-time room occupancy and manage your live bed inventory across all PGs.
          </p>
        </div>
        <Link
          href="/owner/onboarding"
          className="inline-flex items-center gap-2 rounded-full bg-indigo-600 px-5 py-2.5 text-xs font-bold text-white hover:bg-indigo-700 shadow-md shadow-indigo-100 transition-all self-start sm:self-auto"
        >
          <PlusCircle className="h-4 w-4" />
          <span>Add New Property</span>
        </Link>
      </div>

      {/* KPI Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        <div className="rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm">
          <div className="flex items-center justify-between text-zinc-600 text-xs font-bold uppercase tracking-wider">
            <span>Properties</span>
            <Building2 className="h-4 w-4 text-indigo-600" />
          </div>
          <div className="mt-2 text-2xl font-black text-zinc-900">{totalProperties}</div>
          <div className="mt-1 text-[11px] text-zinc-600">Active listings</div>
        </div>

        <div className="rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm">
          <div className="flex items-center justify-between text-zinc-600 text-xs font-bold uppercase tracking-wider">
            <span>Total Rooms</span>
            <BedDouble className="h-4 w-4 text-violet-600" />
          </div>
          <div className="mt-2 text-2xl font-black text-zinc-900">{totalRooms}</div>
          <div className="mt-1 text-[11px] text-zinc-600">Across all room types</div>
        </div>

        <div className="rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm">
          <div className="flex items-center justify-between text-zinc-600 text-xs font-bold uppercase tracking-wider">
            <span>Total Capacity</span>
            <Sparkles className="h-4 w-4 text-amber-500" />
          </div>
          <div className="mt-2 text-2xl font-black text-zinc-900">{totalNominalCapacity}</div>
          <div className="mt-1 text-[11px] text-zinc-600">Maximum beds</div>
        </div>

        <div className="rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm">
          <div className="flex items-center justify-between text-zinc-600 text-xs font-bold uppercase tracking-wider">
            <span>Occupied Beds</span>
            <CheckCircle2 className="h-4 w-4 text-emerald-600" />
          </div>
          <div className="mt-2 text-2xl font-black text-emerald-600">{totalOccupiedBeds}</div>
          <div className="mt-1 text-[11px] text-emerald-700 font-semibold">
            {overallOccupancyRate}% Occupancy Rate
          </div>
        </div>

        <div className="rounded-2xl border border-indigo-100 bg-gradient-to-br from-indigo-50 to-white p-4 shadow-sm col-span-2 lg:col-span-1">
          <div className="flex items-center justify-between text-indigo-900 text-xs font-bold uppercase tracking-wider">
            <span>Vacant Beds</span>
            <TrendingUp className="h-4 w-4 text-indigo-600" />
          </div>
          <div className="mt-2 text-2xl font-black text-indigo-600">{totalVacantBeds}</div>
          <div className="mt-1 text-[11px] text-indigo-600 font-semibold">Open for new tenants</div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 border-b border-zinc-200 pb-4">
        <div className="flex items-center gap-2">
          {["ALL", "PUBLISHED", "DRAFT"].map((status) => (
            <button
              key={status}
              onClick={() => setFilterStatus(status)}
              className={`rounded-full px-4 py-1.5 text-xs font-bold transition-all cursor-pointer ${
                filterStatus === status
                  ? "bg-zinc-900 text-white shadow-sm"
                  : "bg-zinc-100 text-zinc-600 hover:bg-zinc-200"
              }`}
            >
              {status === "ALL" ? "All Properties" : status.charAt(0) + status.slice(1).toLowerCase()}
            </button>
          ))}
        </div>

        <div className="relative w-full sm:w-72">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-zinc-600" />
          <input
            type="text"
            placeholder="Search by name, area, city..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-full border border-zinc-200 bg-white pl-9 pr-4 py-2 text-xs font-medium text-zinc-900 focus:outline-none focus:border-indigo-600"
          />
        </div>
      </div>

      {/* Property Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filtered.map((property) => (
          <div
            key={property.id}
            className="rounded-3xl border border-zinc-200 bg-white p-5 shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between"
          >
            <div>
              {/* Header: Status, Gender Policy and Edit Info */}
              <div className="flex items-center justify-between gap-2 mb-3">
                <div className="flex flex-wrap items-center gap-1.5">
                  <span
                    className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[11px] font-bold ${
                      property.status === PropertyStatus.PUBLISHED
                        ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                        : "bg-amber-50 text-amber-700 border border-amber-200"
                    }`}
                  >
                    <span
                      className={`h-1.5 w-1.5 rounded-full ${
                        property.status === PropertyStatus.PUBLISHED ? "bg-emerald-600" : "bg-amber-500"
                      }`}
                    />
                    <span>{property.status}</span>
                  </span>

                  <span className="rounded-full bg-zinc-100 px-2.5 py-0.5 text-[11px] font-semibold text-zinc-700">
                    {property.genderPolicy.replace(/_/g, " ")}
                  </span>

                  {property.averageRating ? (
                    <Link
                      href={`/owner/properties/${property.id}/reviews`}
                      className="inline-flex items-center gap-1 rounded-full bg-amber-50 border border-amber-200/80 px-2 py-0.5 text-[11px] font-bold text-amber-800 hover:bg-amber-100 transition-colors"
                      title={`${property.averageRating} out of 5 stars (${property.reviewCount} reviews)`}
                    >
                      <Star className="h-3 w-3 fill-amber-400 text-amber-500" />
                      <span>{property.averageRating}</span>
                      <span className="text-[10px] text-amber-600 font-normal">({property.reviewCount})</span>
                    </Link>
                  ) : (
                    <Link
                      href={`/owner/properties/${property.id}/reviews`}
                      className="inline-flex items-center gap-1 rounded-full bg-zinc-100 px-2 py-0.5 text-[10px] font-medium text-zinc-500 hover:bg-zinc-200 transition-colors"
                      title="No ratings received yet"
                    >
                      <Star className="h-2.5 w-2.5 text-zinc-400" />
                      <span>Unrated</span>
                    </Link>
                  )}
                </div>

                <Link
                  href={`/owner/properties/${property.id}/edit`}
                  className="inline-flex items-center gap-1.5 rounded-xl border border-zinc-200 bg-zinc-50 hover:bg-zinc-100 text-zinc-700 px-3 py-1.5 text-xs font-semibold transition-all shadow-2xs shrink-0"
                  title="Edit name, price, location & rules"
                >
                  <Edit3 className="h-3.5 w-3.5 text-zinc-500" />
                  <span>Edit</span>
                </Link>
              </div>

              {/* Title & Location */}
              <Link href={`/owner/properties/${property.id}/edit`} className="group/title block">
                <h3 className="text-base font-black text-zinc-900 tracking-tight line-clamp-1 group-hover/title:text-indigo-600 transition-colors">
                  {property.name}
                </h3>
              </Link>
              <p className="text-xs text-zinc-600 mt-0.5">
                {property.locality}, {property.city}
              </p>

              {/* Price & Capacity Snapshot */}
              <div className="mt-4 flex items-center justify-between border-t border-zinc-100 pt-3">
                <div>
                  <span className="text-[10px] uppercase font-bold text-zinc-600 block">Starting At</span>
                  <span className="text-base font-black text-indigo-600">
                    ₹{property.startingPrice ? property.startingPrice.toLocaleString("en-IN") : "N/A"}
                    <span className="text-xs font-medium text-zinc-600">/mo</span>
                  </span>
                </div>
                <div className="text-right">
                  <span className="text-[10px] uppercase font-bold text-zinc-600 block">Inventory</span>
                  <span className="text-xs font-bold text-zinc-900">
                    {property.totalRooms} Rooms • {property.totalNominalCapacity} Beds
                  </span>
                </div>
              </div>

              {/* Live Occupancy Visual Progress Bar */}
              <div className="mt-4 rounded-2xl bg-zinc-50 border border-zinc-100 p-3">
                <div className="flex justify-between items-center text-xs font-semibold mb-1.5">
                  <span className="text-zinc-700">Occupancy</span>
                  <span className="font-bold text-zinc-900">
                    {property.totalOccupiedBeds} / {property.totalNominalCapacity} Beds ({property.occupancyRate}%)
                  </span>
                </div>
                <div className="h-2 w-full rounded-full bg-zinc-200 overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${
                      property.occupancyRate >= 90
                        ? "bg-rose-500"
                        : property.occupancyRate >= 70
                        ? "bg-indigo-600"
                        : "bg-emerald-500"
                    }`}
                    style={{ width: `${Math.min(100, property.occupancyRate)}%` }}
                  />
                </div>
                <div className="mt-2 flex justify-between items-center text-[11px] text-zinc-600">
                  <span className="text-emerald-700 font-bold">
                    {property.totalVacantBeds} beds available
                  </span>
                  <span>{property.roomTypes.length} room types</span>
                </div>
              </div>
            </div>

            {/* Action Buttons: Clean balanced 3-column grid */}
            <div className="mt-5 pt-3.5 border-t border-zinc-100 grid grid-cols-3 gap-2">
              <Link
                href={`/owner/properties/${property.id}/reviews`}
                className="inline-flex items-center justify-center gap-1.5 rounded-xl border border-amber-200 bg-amber-50/70 hover:bg-amber-100 text-amber-900 py-2.5 text-xs font-bold transition-colors shadow-2xs"
                title="View reviews & ratings for this property"
              >
                <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-500 shrink-0" />
                <span>Reviews</span>
              </Link>

              <Link
                href={`/owner/properties/${property.id}/rooms`}
                className="inline-flex items-center justify-center gap-1.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-white py-2.5 text-xs font-bold transition-colors shadow-sm"
                title="Manage room types, beds & vacancies"
              >
                <BedDouble className="h-3.5 w-3.5 shrink-0" />
                <span>Rooms</span>
              </Link>

              <button
                type="button"
                disabled={updatingId === property.id}
                onClick={() => handleToggleStatus(property.id, property.status)}
                className="inline-flex items-center justify-center rounded-xl border border-zinc-200 bg-zinc-50 hover:bg-zinc-100 py-2.5 text-xs font-semibold text-zinc-700 transition-colors cursor-pointer disabled:opacity-50"
                title="Toggle Published / Draft Status"
              >
                {property.status === PropertyStatus.PUBLISHED ? "Unpublish" : "Publish"}
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
