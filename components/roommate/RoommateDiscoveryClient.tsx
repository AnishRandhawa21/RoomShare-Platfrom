"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import {
  Users,
  MapPin,
  PlusCircle,
  X,
  Filter,
} from "lucide-react";
import { RoommateCard, type RoommateCardProps } from "@/components/roommate/RoommateCard";

interface RoommateDiscoveryClientProps {
  initialRequests: RoommateCardProps[];
  currentUserId?: string | null;
  availableCities?: string[];
  initialCity?: string;
}

export function RoommateDiscoveryClient({
  initialRequests,
  currentUserId,
  availableCities,
  initialCity,
}: RoommateDiscoveryClientProps) {
  // Dynamically derive active cities from Location Master and live requests
  const activeCities = useMemo(() => {
    const set = new Set<string>();
    if (availableCities && availableCities.length > 0) {
      availableCities.forEach((c) => {
        if (c && c.trim()) set.add(c.trim());
      });
    }
    initialRequests.forEach((req) => {
      if (req.city && req.city.trim()) set.add(req.city.trim());
    });
    if (set.size === 0) {
      ["Jalandhar", "Phagwara"].forEach((c) => set.add(c));
    }
    return Array.from(set).sort();
  }, [availableCities, initialRequests]);

  const [selectedCity, setSelectedCity] = useState<string>(initialCity || "All");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [selectedGender, setSelectedGender] = useState<string>("all");
  const [maxBudget, setMaxBudget] = useState<number>(30000);
  const [selectedDiet, setSelectedDiet] = useState<string>("all");
  const [selectedSmoking, setSelectedSmoking] = useState<string>("all");
  const [showAdvancedFilters, setShowAdvancedFilters] = useState<boolean>(false);

  // Filter requests locally
  const filteredRequests = useMemo(() => {
    return initialRequests.filter((item) => {
      // City check
      if (
        selectedCity !== "All" &&
        item.city.toLowerCase() !== selectedCity.toLowerCase()
      ) {
        return false;
      }

      // Search query check (title, locality, city, propertyName)
      if (searchQuery.trim().length > 0) {
        const q = searchQuery.toLowerCase().trim();
        const matchesQ =
          item.title.toLowerCase().includes(q) ||
          item.locality.toLowerCase().includes(q) ||
          item.city.toLowerCase().includes(q) ||
          (item.propertyName && item.propertyName.toLowerCase().includes(q));
        if (!matchesQ) return false;
      }

      // Gender check
      if (
        selectedGender !== "all" &&
        item.preferredGender.toLowerCase() !== selectedGender.toLowerCase()
      ) {
        return false;
      }

      // Budget check
      if (item.rentPerPerson > maxBudget) {
        return false;
      }

      // Dietary check
      if (selectedDiet !== "all") {
        if (item.preferences?.dietary !== selectedDiet) {
          return false;
        }
      }

      // Smoking check
      if (selectedSmoking !== "all") {
        if (item.preferences?.smoking !== selectedSmoking) {
          return false;
        }
      }

      return true;
    });
  }, [
    initialRequests,
    selectedCity,
    searchQuery,
    selectedGender,
    maxBudget,
    selectedDiet,
    selectedSmoking,
  ]);

  const resetFilters = () => {
    setSelectedCity("All");
    setSearchQuery("");
    setSelectedGender("all");
    setMaxBudget(30000);
    setSelectedDiet("all");
    setSelectedSmoking("all");
  };

  const hasActiveFilters =
    selectedCity !== "All" ||
    searchQuery.trim().length > 0 ||
    selectedGender !== "all" ||
    maxBudget < 30000 ||
    selectedDiet !== "all" ||
    selectedSmoking !== "all";

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      {/* Top Banner / Hero Bar */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-zinc-200 pb-6">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full bg-violet-50 px-3 py-1 text-xs font-semibold text-violet-700">
            <Users className="h-3.5 w-3.5" />
            <span>Roommate Share Hub</span>
            <span className="text-violet-300">•</span>
            <span className="text-zinc-500 font-normal">Platform Primary USP</span>
          </div>
          <h1 className="mt-2 text-2xl sm:text-3xl font-extrabold tracking-tight text-zinc-950">
            Find the Ideal Flatmate
          </h1>
          <p className="mt-1 text-xs sm:text-sm text-zinc-600">
            Connect directly with verified working professionals and students looking to share living spaces without broker fees.
          </p>
        </div>

        <Link
          href={currentUserId ? "/roommates/new" : "/login?returnUrl=/roommates/new"}
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-violet-600 px-5 py-2.5 text-xs sm:text-sm font-bold text-white shadow-xs transition-colors hover:bg-violet-700 active:scale-95"
        >
          <PlusCircle className="h-4 w-4" />
          <span>Post Requirement</span>
        </Link>
      </div>

      {/* Quick City Filter Bar */}
      <div className="mt-5 flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
        <span className="text-[11px] font-bold uppercase tracking-wider text-zinc-400 shrink-0 mr-1">
          City:
        </span>
        <button
          type="button"
          onClick={() => setSelectedCity("All")}
          className={`shrink-0 rounded-full px-3.5 py-1.5 text-xs font-bold transition-all cursor-pointer ${
            selectedCity === "All"
              ? "bg-violet-600 text-white shadow-2xs"
              : "bg-white border border-zinc-200 text-zinc-700 hover:bg-zinc-50"
          }`}
        >
          All Cities ({initialRequests.length})
        </button>
        {activeCities.map((city) => {
          const count = initialRequests.filter(
            (r) => r.city.toLowerCase() === city.toLowerCase()
          ).length;
          return (
            <button
              key={city}
              type="button"
              onClick={() => setSelectedCity(city)}
              className={`shrink-0 rounded-full px-3.5 py-1.5 text-xs font-bold transition-all cursor-pointer ${
                selectedCity.toLowerCase() === city.toLowerCase()
                  ? "bg-violet-600 text-white shadow-2xs"
                  : "bg-white border border-zinc-200 text-zinc-700 hover:bg-zinc-50"
              }`}
            >
              {city} {count > 0 ? `(${count})` : ""}
            </button>
          );
        })}
      </div>

      {/* Filter Surface */}
      <div className="mt-4 rounded-2xl border border-zinc-200 bg-white p-4 shadow-xs">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-12 items-center">
          {/* Locality Search Input */}
          <div className="sm:col-span-5 flex items-center rounded-xl bg-zinc-50 px-3.5 py-2.5 border border-zinc-200 focus-within:border-violet-500 focus-within:bg-white transition-all">
            <MapPin className="h-4 w-4 text-violet-600 shrink-0 mr-2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search locality, area, or society..."
              className="w-full bg-transparent text-xs sm:text-sm font-medium text-zinc-900 placeholder:text-zinc-400 focus:outline-none"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="text-zinc-400 hover:text-zinc-600"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>

          {/* City Selector */}
          <div className="sm:col-span-3 flex items-center rounded-xl bg-zinc-50 px-3 py-2.5 border border-zinc-200 focus-within:border-violet-500 focus-within:bg-white transition-all">
            <select
              aria-label="Filter by City"
              value={selectedCity}
              onChange={(e) => setSelectedCity(e.target.value)}
              className="w-full bg-transparent text-xs sm:text-sm font-semibold text-zinc-800 focus:outline-none cursor-pointer"
            >
              <option value="All">All Cities</option>
              {activeCities.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>

          {/* Gender Filter */}
          <div className="sm:col-span-2 flex items-center rounded-xl bg-zinc-50 px-3 py-2.5 border border-zinc-200 focus-within:border-violet-500 focus-within:bg-white transition-all">
            <select
              aria-label="Filter by Gender"
              value={selectedGender}
              onChange={(e) => setSelectedGender(e.target.value)}
              className="w-full bg-transparent text-xs sm:text-sm font-semibold text-zinc-800 focus:outline-none cursor-pointer"
            >
              <option value="all">All Genders</option>
              <option value="boys">Boys Only</option>
              <option value="girls">Girls Only</option>
              <option value="unisex">Any Gender</option>
            </select>
          </div>

          {/* Advanced Filter Toggle */}
          <div className="sm:col-span-2">
            <button
              type="button"
              onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
              className={`w-full flex items-center justify-center gap-1.5 rounded-xl border py-2.5 px-3 text-xs font-bold transition-all cursor-pointer ${
                showAdvancedFilters || hasActiveFilters
                  ? "border-violet-300 bg-violet-50 text-violet-700"
                  : "border-zinc-200 bg-zinc-50 text-zinc-700 hover:bg-zinc-100"
              }`}
            >
              <Filter className="h-3.5 w-3.5" />
              <span>Filters {hasActiveFilters && "•"}</span>
            </button>
          </div>
        </div>

        {/* Collapsible Advanced Filters */}
        {showAdvancedFilters && (
          <div className="mt-4 border-t border-zinc-100 pt-4 grid grid-cols-1 sm:grid-cols-3 gap-4">
            {/* Max Budget Slider */}
            <div>
              <div className="flex items-center justify-between text-xs font-semibold text-zinc-700 mb-1.5">
                <span>Max Monthly Budget</span>
                <span className="font-bold text-violet-700">₹{maxBudget.toLocaleString("en-IN")}/mo</span>
              </div>
              <input
                type="range"
                min={3000}
                max={35000}
                step={500}
                value={maxBudget}
                onChange={(e) => setMaxBudget(Number(e.target.value))}
                className="w-full accent-violet-600 cursor-pointer"
              />
              <div className="flex justify-between text-[10px] text-zinc-400 mt-0.5">
                <span>₹3,000</span>
                <span>₹35,000+</span>
              </div>
            </div>

            {/* Dietary Preference */}
            <div>
              <label className="block text-xs font-semibold text-zinc-700 mb-1.5">
                Dietary Habit
              </label>
              <select
                aria-label="Filter by Dietary Preference"
                value={selectedDiet}
                onChange={(e) => setSelectedDiet(e.target.value)}
                className="w-full rounded-xl border border-zinc-200 bg-zinc-50 px-3 py-2 text-xs font-medium text-zinc-800 focus:outline-none focus:border-violet-500"
              >
                <option value="all">Any Dietary Habit</option>
                <option value="VEGETARIAN_ONLY">Strict Vegetarian</option>
                <option value="NON_VEG_OK">Non-Veg OK</option>
                <option value="VEGAN">Vegan Only</option>
                <option value="NO_PREFERENCE">No Preference</option>
              </select>
            </div>

            {/* Smoking Preference */}
            <div>
              <label className="block text-xs font-semibold text-zinc-700 mb-1.5">
                Smoking Habit
              </label>
              <select
                aria-label="Filter by Smoking Habit"
                value={selectedSmoking}
                onChange={(e) => setSelectedSmoking(e.target.value)}
                className="w-full rounded-xl border border-zinc-200 bg-zinc-50 px-3 py-2 text-xs font-medium text-zinc-800 focus:outline-none focus:border-violet-500"
              >
                <option value="all">Any Smoking Policy</option>
                <option value="NON_SMOKER_ONLY">Strict Non-Smoker</option>
                <option value="OUTSIDE_ONLY">Outside Only</option>
                <option value="SMOKING_OK">Smoking OK</option>
              </select>
            </div>
          </div>
        )}

        {/* Active Filter Clear Pill */}
        {hasActiveFilters && (
          <div className="mt-3 flex items-center justify-between border-t border-zinc-100 pt-3 text-xs">
            <span className="text-zinc-500 font-medium">
              Showing <span className="font-bold text-zinc-900">{filteredRequests.length}</span> matching flatmate requirements
            </span>
            <button
              onClick={resetFilters}
              className="text-xs font-bold text-violet-600 hover:text-violet-700 underline cursor-pointer"
            >
              Reset all filters
            </button>
          </div>
        )}
      </div>

      {/* Grid of Roommate Cards */}
      {filteredRequests.length > 0 ? (
        <div className="mt-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredRequests.map((req) => (
            <RoommateCard key={req.id} {...req} currentUserId={currentUserId} />
          ))}
        </div>
      ) : (
        <div className="mt-12 rounded-3xl border border-dashed border-zinc-200 p-12 text-center max-w-lg mx-auto bg-zinc-50/50">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-violet-100 text-violet-700 mb-4">
            <Users className="h-6 w-6" />
          </div>
          <h3 className="text-base font-bold text-zinc-950">
            No roommate posts match your criteria
          </h3>
          <p className="mt-1.5 text-xs text-zinc-500 leading-relaxed">
            Try adjusting your location, budget, or lifestyle filters, or be the first to post your flatmate requirement!
          </p>
          <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
            {hasActiveFilters && (
              <button
                onClick={resetFilters}
                className="rounded-xl border border-zinc-200 bg-white px-4 py-2 text-xs font-bold text-zinc-700 hover:bg-zinc-50 cursor-pointer"
              >
                Clear Filters
              </button>
            )}
            <Link
              href={currentUserId ? "/roommates/new" : "/login?returnUrl=/roommates/new"}
              className="rounded-xl bg-violet-600 px-4 py-2 text-xs font-bold text-white hover:bg-violet-700 transition-colors shadow-xs"
            >
              Post Requirement
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
