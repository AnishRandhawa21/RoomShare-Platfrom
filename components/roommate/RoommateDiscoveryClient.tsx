"use client";

import { useState, useMemo, useRef, useEffect } from "react";
import Link from "next/link";
import {
  Users,
  MapPin,
  PlusCircle,
  X,
  Filter,
  ChevronDown,
  Check,
  Utensils,
  Flame,
  ArrowUpDown,
} from "lucide-react";
import { RoommateCard, type RoommateCardProps } from "@/components/roommate/RoommateCard";
import { rankRoommateRequests } from "@/lib/ranking";
import { CustomSelect, type CustomSelectOption as DropdownOption } from "@/components/ui/CustomSelect";

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
  const [sortBy, setSortBy] = useState<"recommended" | "soonest" | "rent-asc" | "rent-desc">("recommended");

  const sortOptions = useMemo<DropdownOption[]>(() => [
    { value: "recommended", label: "Recommended (Best Match)" },
    { value: "soonest", label: "Move-in: Earliest First" },
    { value: "rent-asc", label: "Rent: Low to High" },
    { value: "rent-desc", label: "Rent: High to Low" },
  ], []);

  const cityOptions = useMemo<DropdownOption[]>(() => {
    return [
      { value: "All", label: "All Cities", badge: initialRequests.length },
      ...activeCities.map((c) => ({
        value: c,
        label: c,
        badge: initialRequests.filter((r) => r.city.toLowerCase() === c.toLowerCase()).length,
      })),
    ];
  }, [activeCities, initialRequests]);

  const genderOptions = useMemo<DropdownOption[]>(() => [
    { value: "all", label: "All Genders" },
    { value: "boys", label: "Boys Only" },
    { value: "girls", label: "Girls Only" },
    { value: "unisex", label: "Any Gender" },
  ], []);

  const dietOptions = useMemo<DropdownOption[]>(() => [
    { value: "all", label: "Any Dietary Habit" },
    { value: "VEGETARIAN_ONLY", label: "Strict Vegetarian" },
    { value: "NON_VEG_OK", label: "Non-Veg OK" },
    { value: "VEGAN", label: "Vegan Only" },
    { value: "NO_PREFERENCE", label: "No Preference" },
  ], []);

  const smokingOptions = useMemo<DropdownOption[]>(() => [
    { value: "all", label: "Any Smoking Policy" },
    { value: "NON_SMOKER_ONLY", label: "Strict Non-Smoker" },
    { value: "OUTSIDE_ONLY", label: "Outside Only" },
    { value: "SMOKING_OK", label: "Smoking OK" },
  ], []);

  // Filter & rank requests locally
  const filteredRequests = useMemo(() => {
    const matched = initialRequests.filter((item) => {
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

      // Diet check
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

    if (sortBy === "soonest") {
      return [...matched].sort(
        (a, b) => new Date(a.moveInDate).getTime() - new Date(b.moveInDate).getTime()
      );
    }
    if (sortBy === "rent-asc") {
      return [...matched].sort((a, b) => a.rentPerPerson - b.rentPerPerson);
    }
    if (sortBy === "rent-desc") {
      return [...matched].sort((a, b) => b.rentPerPerson - a.rentPerPerson);
    }

    // Default: Multi-factor quality ranking heuristics
    return rankRoommateRequests(matched, {
      query: searchQuery,
      selectedCity: selectedCity !== "All" ? selectedCity : undefined,
      targetGender: selectedGender !== "all" ? selectedGender : undefined,
      maxBudget,
    });
  }, [
    initialRequests,
    selectedCity,
    searchQuery,
    selectedGender,
    maxBudget,
    selectedDiet,
    selectedSmoking,
    sortBy,
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
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-[#E8EAE5] pb-6">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full bg-[#eff4ec] px-3 py-1 text-xs font-semibold text-[#00412E] border border-[#96BF8A]/40">
            <Users className="h-3.5 w-3.5 text-[#96BF8A]" />
            <span>Roommate Share Hub</span>
            <span className="text-[#96BF8A]">•</span>
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
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#00412E] px-5 py-2.5 text-xs sm:text-sm font-bold text-white shadow-xs transition-colors hover:bg-[#002d20] active:scale-95 shadow-[#00412E]/20"
        >
          <PlusCircle className="h-4 w-4 text-[#96BF8A]" />
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
              ? "bg-[#00412E] text-white shadow-2xs"
              : "bg-white border border-[#E8EAE5] text-zinc-700 hover:bg-[#eff4ec]"
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
                  ? "bg-[#00412E] text-white shadow-2xs"
                  : "bg-white border border-[#E8EAE5] text-zinc-700 hover:bg-[#eff4ec]"
              }`}
            >
              {city} {count > 0 ? `(${count})` : ""}
            </button>
          );
        })}
      </div>

      {/* Filter Surface */}
      <div className="mt-4 rounded-2xl border border-[#E8EAE5] bg-white p-4 shadow-xs">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-12 items-center">
          {/* Locality Search Input */}
          <div className="sm:col-span-5 flex items-center rounded-xl bg-[#E8EAE5]/30 px-3.5 py-2.5 border border-[#E8EAE5] focus-within:border-[#00412E] focus-within:bg-white transition-all">
            <MapPin className="h-4 w-4 text-[#00412E] shrink-0 mr-2" />
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
                className="text-zinc-400 hover:text-zinc-600 cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>

          {/* City Selector */}
          <div className="sm:col-span-3">
            <CustomSelect
              value={selectedCity}
              options={cityOptions}
              onChange={(val) => setSelectedCity(val)}
              icon={<MapPin className="h-3.5 w-3.5 text-[#00412E]" />}
              placeholder="Select City"
            />
          </div>

          {/* Gender Filter */}
          <div className="sm:col-span-2">
            <CustomSelect
              value={selectedGender}
              options={genderOptions}
              onChange={(val) => setSelectedGender(val)}
              icon={<Users className="h-3.5 w-3.5 text-[#00412E]" />}
              placeholder="Select Gender"
            />
          </div>

          {/* Advanced Filter Toggle */}
          <div className="sm:col-span-2">
            <button
              type="button"
              onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
              className={`w-full flex items-center justify-center gap-1.5 rounded-xl border py-2.5 px-3 text-xs font-bold transition-all cursor-pointer ${
                showAdvancedFilters || hasActiveFilters
                  ? "border-[#96BF8A] bg-[#eff4ec] text-[#00412E]"
                  : "border-[#E8EAE5] bg-zinc-50/90 text-zinc-700 hover:bg-[#E8EAE5]/40"
              }`}
            >
              <Filter className={`h-3.5 w-3.5 ${showAdvancedFilters || hasActiveFilters ? "text-[#00412E]" : "text-zinc-600"}`} />
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
                <span className="font-bold text-[#00412E] bg-[#eff4ec] border border-[#96BF8A]/40 px-2 py-0.5 rounded-md">₹{maxBudget.toLocaleString("en-IN")}/mo</span>
              </div>
              <input
                type="range"
                min={3000}
                max={35000}
                step={500}
                value={maxBudget}
                onChange={(e) => setMaxBudget(Number(e.target.value))}
                style={{ accentColor: "#00412E" }}
                className="w-full accent-[#00412E] cursor-pointer"
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
              <CustomSelect
                value={selectedDiet}
                options={dietOptions}
                onChange={(val) => setSelectedDiet(val)}
                icon={<Utensils className="h-3.5 w-3.5 text-[#00412E]" />}
                placeholder="Dietary Habit"
              />
            </div>

            {/* Smoking Preference */}
            <div>
              <label className="block text-xs font-semibold text-zinc-700 mb-1.5">
                Smoking Habit
              </label>
              <CustomSelect
                value={selectedSmoking}
                options={smokingOptions}
                onChange={(val) => setSelectedSmoking(val)}
                icon={<Flame className="h-3.5 w-3.5 text-[#00412E]" />}
                placeholder="Smoking Policy"
              />
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
              className="text-xs font-bold text-[#00412E] hover:underline cursor-pointer"
            >
              Reset all filters
            </button>
          </div>
        )}
      </div>

      {/* Results Header with Dynamic Count & Quality Sorting */}
      <div className="mt-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="text-xs sm:text-sm text-zinc-500 font-medium">
          Showing <span className="font-bold text-zinc-950">{filteredRequests.length}</span>{" "}
          {filteredRequests.length === 1 ? "roommate post" : "roommate posts"}{" "}
          {selectedCity !== "All" && (
            <span>
              in <span className="font-bold text-[#00412E]">{selectedCity}</span>
            </span>
          )}
        </div>

        <div className="w-full sm:w-60">
          <CustomSelect
            value={sortBy}
            options={sortOptions}
            onChange={(val) => setSortBy(val as any)}
            icon={<ArrowUpDown className="h-3.5 w-3.5 text-zinc-400" />}
            placeholder="Sort by"
          />
        </div>
      </div>

      {/* Grid of Roommate Cards */}
      {filteredRequests.length > 0 ? (
        <div className="mt-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredRequests.map((req) => (
            <RoommateCard key={req.id} {...req} currentUserId={currentUserId} />
          ))}
        </div>
      ) : (
        <div className="mt-12 rounded-3xl border border-dashed border-[#E8EAE5] p-12 text-center max-w-lg mx-auto bg-zinc-50/50">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-[#eff4ec] text-[#00412E] border border-[#96BF8A]/30 mb-4">
            <Users className="h-6 w-6 text-[#00412E]" />
          </div>
          <h3 className="text-base font-bold text-zinc-950">
            {searchQuery.trim()
              ? `No flatmates matching "${searchQuery}"`
              : "No roommate posts match your criteria"}
          </h3>
          <p className="mt-1.5 text-xs text-zinc-500 leading-relaxed">
            {searchQuery.trim()
              ? `No active requirements found for "${searchQuery}" in ${selectedCity}. Try expanding your search or clearing active filters.`
              : "Try adjusting your location, budget, or lifestyle filters, or be the first to post your flatmate requirement!"}
          </p>
          <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
            {hasActiveFilters && (
              <button
                onClick={resetFilters}
                className="rounded-xl border border-[#E8EAE5] bg-white px-4 py-2 text-xs font-bold text-zinc-700 hover:bg-zinc-50 cursor-pointer shadow-2xs"
              >
                Clear Filters
              </button>
            )}
            <Link
              href={currentUserId ? "/roommates/new" : "/login?returnUrl=/roommates/new"}
              className="rounded-xl bg-[#00412E] px-4 py-2 text-xs font-bold text-white hover:bg-[#002d20] transition-colors shadow-2xs"
            >
              Post Requirement
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
