"use client";

import { useState, useMemo, useEffect, useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import { getAuthSessionAction } from "@/actions/auth";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import {
  Building2,
  Users,
  Search,
  MapPin,
  CheckCircle2,
  ArrowRight,
  SlidersHorizontal,
  X,
  Utensils,
  LayoutGrid,
  Columns2,
  Map,
  Navigation,
  Loader2,
  ArrowUpDown,
  RefreshCw,
  ChevronDown,
  Check,
} from "lucide-react";
import type {
  PropertyListingSummary,
  DiscoveryLocationCity,
} from "@/lib/discovery";
import { BookmarkButton } from "@/components/ui/BookmarkButton";
import { PropertyMap } from "@/components/map/PropertyMap";
import { getPropertiesInBoundsAction } from "@/actions/map";
import {
  calculateDistanceKm,
  formatDistance,
  type Coordinates,
} from "@/lib/geo";

interface CleanHomeClientProps {
  initialProperties: PropertyListingSummary[];
  availableCities?: DiscoveryLocationCity[];
  currentUser: {
    id: string;
    email: string | null;
    role?: string | null;
    profile?: { fullName: string; avatarUrl: string | null } | null;
  } | null;
}

function PropertyCard({
  pg,
  isHovered,
  onMouseEnter,
  onMouseLeave,
}: {
  pg: PropertyListingSummary;
  isHovered?: boolean;
  onMouseEnter?: () => void;
  onMouseLeave?: () => void;
}) {
  const allImages = useMemo(() => {
    if (pg.images && pg.images.length > 0) return pg.images;
    if (pg.coverImageUrl) return [pg.coverImageUrl];
    return [];
  }, [pg.images, pg.coverImageUrl]);

  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [isCardHovered, setIsCardHovered] = useState(false);

  useEffect(() => {
    if (!isCardHovered || allImages.length <= 1) {
      return;
    }

    const interval = setInterval(() => {
      setCurrentImageIndex((prev) => (prev + 1) % allImages.length);
    }, 1800);

    return () => clearInterval(interval);
  }, [isCardHovered, allImages.length]);

  const handleMouseEnter = () => {
    setIsCardHovered(true);
    if (onMouseEnter) onMouseEnter();
  };

  const handleMouseLeave = () => {
    setIsCardHovered(false);
    setCurrentImageIndex(0);
    if (onMouseLeave) onMouseLeave();
  };

  return (
    <div
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      className={`group rounded-2xl border bg-white overflow-hidden shadow-xs hover:shadow-md transition-all flex flex-col ${
        isHovered || isCardHovered
          ? "border-[#00412E] ring-2 ring-[#96BF8A]/30 shadow-md"
          : "border-[#E8EAE5] hover:border-[#96BF8A]"
      }`}
    >
      {/* Image container */}
      <div className="relative aspect-video w-full bg-zinc-100 overflow-hidden">
        {allImages.length > 0 ? (
          allImages.map((src, idx) => (
            <img
              key={src + idx}
              src={src}
              alt={`${pg.name} - photo ${idx + 1}`}
              className={`absolute inset-0 h-full w-full object-cover transition-all duration-300 ease-in-out ${
                idx === currentImageIndex
                  ? "opacity-100 scale-100 z-0"
                  : "opacity-0 scale-105 pointer-events-none z-0"
              }`}
            />
          ))
        ) : (
          <div className="h-full w-full flex items-center justify-center bg-zinc-100 text-zinc-400">
            <Building2 className="h-8 w-8 text-zinc-300" />
          </div>
        )}

        {/* Hover cycling dots indicator */}
        {allImages.length > 1 && isCardHovered && (
          <div className="absolute bottom-2.5 inset-x-0 flex justify-center items-center gap-1.5 z-10 animate-in fade-in duration-300">
            {allImages.map((_, idx) => (
              <span
                key={idx}
                className={`h-1.5 rounded-full transition-all duration-300 ${
                  idx === currentImageIndex
                    ? "w-4 bg-white shadow-sm ring-1 ring-black/10"
                    : "w-1.5 bg-white/60"
                }`}
              />
            ))}
          </div>
        )}

        <div className="absolute top-3 left-3 flex items-center gap-1.5 z-10">
          <span
            className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-white shadow-xs ${
              pg.genderPolicy === "BOYS"
                ? "bg-blue-600"
                : pg.genderPolicy === "GIRLS"
                ? "bg-rose-600"
                : "bg-[#00412E]"
            }`}
          >
            {pg.genderPolicy === "BOYS"
              ? "Boys"
              : pg.genderPolicy === "GIRLS"
              ? "Girls"
              : "Coliving"}
          </span>
          {pg.foodIncluded && (
            <span className="rounded-full bg-zinc-900/80 backdrop-blur-xs px-2 py-0.5 text-[10px] font-bold text-white flex items-center gap-1">
              <Utensils className="h-2.5 w-2.5" /> Meals
            </span>
          )}
          {pg.hasActiveRoommateRequest && (
            <span className="rounded-full bg-[#00412E] backdrop-blur-xs px-2 py-0.5 text-[10px] font-bold text-white flex items-center gap-1 shadow-xs border border-[#96BF8A]/40">
              <Users className="h-2.5 w-2.5 text-[#96BF8A]" /> Roommate wanted
            </span>
          )}
        </div>

        <div className="absolute top-3 right-3 z-10">
          <BookmarkButton
            targetId={pg.id}
            targetType="PROPERTY"
            size="sm"
          />
        </div>
      </div>

      {/* Content */}
      <div className="p-4 sm:p-5 flex-1 flex flex-col justify-between">
        <div>
          <div className="flex items-center justify-between gap-2 mb-1">
            <div className="flex items-center gap-1 text-xs text-zinc-500 truncate">
              <MapPin className="h-3.5 w-3.5 text-zinc-400 shrink-0" />
              <span className="truncate">{pg.locality}, {pg.city}</span>
            </div>
            {pg.distanceKm !== undefined && pg.distanceKm < Infinity && (
              <span className="shrink-0 flex items-center gap-1 text-[11px] font-bold text-[#00412E] bg-[#eff4ec] border border-[#96BF8A]/40 px-2 py-0.5 rounded-full">
                <Navigation className="h-2.5 w-2.5 text-[#00412E]" />
                {formatDistance(pg.distanceKm)}
              </span>
            )}
          </div>
          <Link href={`/property/${pg.slug}`}>
            <h3 className="text-base font-bold text-zinc-950 group-hover:text-[#00412E] transition-colors">
              {pg.name}
            </h3>
          </Link>

          {/* Room types pill */}
          {pg.roomTypeSummaries.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-1">
              {pg.roomTypeSummaries.slice(0, 2).map((rt) => (
                <span
                  key={rt}
                  className="rounded-md bg-[#E8EAE5]/60 px-2 py-0.5 text-[11px] font-medium text-zinc-700"
                >
                  {rt}
                </span>
              ))}
            </div>
          )}
        </div>

        <div className="mt-5 pt-3 border-t border-[#E8EAE5] flex items-center justify-between">
          <div>
            <div className="flex items-center gap-1.5 mb-0.5">
              {pg.originalPrice && pg.originalPrice > pg.startingPrice && (
                <span className="text-xs font-semibold text-zinc-400 line-through">
                  ₹{pg.originalPrice.toLocaleString("en-IN")}
                </span>
              )}
              {pg.bestSharingOccupancy && pg.bestSharingOccupancy > 1 ? (
                <span className="text-[10px] font-bold text-[#00412E] bg-[#96BF8A]/20 px-1.5 py-0.5 rounded-md border border-[#96BF8A]/50">
                  {pg.bestSharingOccupancy}-Sharing
                </span>
              ) : (
                <span className="text-[10px] font-semibold text-zinc-400 uppercase tracking-wider block">
                  Starts at
                </span>
              )}
            </div>
            <div className="flex items-baseline gap-1">
              <span className="text-lg font-black tracking-tight text-zinc-950">
                ₹{pg.startingPrice.toLocaleString("en-IN")}
              </span>
              <span className="text-xs font-normal text-zinc-500">/mo</span>
            </div>
          </div>
          <Link
            href={`/property/${pg.slug}`}
            className="rounded-xl bg-[#00412E] px-3.5 py-1.5 text-xs font-bold text-white hover:bg-[#002d20] transition-colors inline-block shadow-xs"
          >
            Details
          </Link>
        </div>
      </div>
    </div>
  );
}

interface HomeSelectOption {
  value: string;
  label: string;
}

function HomeSelect({
  value,
  options,
  onChange,
  icon,
  className = "",
  size = "md",
}: {
  value: string;
  options: HomeSelectOption[];
  onChange: (val: string) => void;
  icon?: React.ReactNode;
  className?: string;
  size?: "md" | "sm";
}) {
  const [isOpen, setIsOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const selected = options.find((o) => o.value.toLowerCase() === value.toLowerCase()) || options[0];
  const isSmall = size === "sm";

  return (
    <div className={`relative ${className}`} ref={ref}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`w-full flex items-center justify-between gap-2 rounded-xl transition-all cursor-pointer ${
          isSmall
            ? "border border-[#E8EAE5] bg-white px-3 py-1.5 text-xs font-semibold text-zinc-800 hover:border-[#96BF8A] shadow-2xs"
            : "border border-[#E8EAE5] bg-[#E8EAE5]/40 px-3.5 py-2.5 text-xs sm:text-sm font-semibold text-zinc-800 hover:bg-white hover:border-[#96BF8A]/60"
        } ${
          isOpen
            ? "border-[#00412E] bg-white ring-2 ring-[#96BF8A]/25 text-zinc-950 shadow-xs"
            : ""
        }`}
      >
        <div className="flex items-center gap-2 truncate min-w-0">
          {icon && <span className="shrink-0">{icon}</span>}
          <span className="truncate">{selected?.label}</span>
        </div>
        <ChevronDown
          className={`h-3.5 w-3.5 text-zinc-400 shrink-0 transition-transform duration-200 ${
            isOpen ? "rotate-180 text-[#00412E]" : ""
          }`}
        />
      </button>

      {isOpen && (
        <div className={`absolute ${isSmall ? "right-0" : "left-0"} mt-1.5 min-w-[200px] w-full rounded-2xl border border-[#E8EAE5] bg-white p-1.5 shadow-xl ring-1 ring-black/5 animate-in fade-in slide-in-from-top-1 duration-150 z-50`}>
          <div className="space-y-0.5">
            {options.map((opt) => {
              const isSelected = opt.value.toLowerCase() === value.toLowerCase();
              return (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => {
                    onChange(opt.value);
                    setIsOpen(false);
                  }}
                  className={`flex w-full items-center justify-between rounded-xl px-3 py-2 text-left text-xs sm:text-sm font-semibold transition-colors cursor-pointer ${
                    isSelected
                      ? "bg-[#eff4ec] text-[#00412E] font-bold"
                      : "text-zinc-700 hover:bg-[#E8EAE5]/40 hover:text-zinc-950"
                  }`}
                >
                  <span className="truncate">{opt.label}</span>
                  {isSelected && (
                    <Check className="h-3.5 w-3.5 text-[#00412E] shrink-0 ml-2" />
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

export function CleanHomeClient({
  initialProperties,
  availableCities,
  currentUser: initialCurrentUser,
}: CleanHomeClientProps) {
  const [currentUser, setCurrentUser] = useState(initialCurrentUser);

  useEffect(() => {
    let isCancelled = false;
    getAuthSessionAction()
      .then((user) => {
        if (!isCancelled && user) {
          setCurrentUser(user);
        }
      })
      .catch(() => {});
    return () => {
      isCancelled = true;
    };
  }, []);

  // Default to first city with published properties, or first available city in database
  const defaultCity = useMemo(() => {
    if (availableCities && availableCities.length > 0) {
      const cityWithProps = availableCities.find((c) => (c.propertyCount || 0) > 0);
      return cityWithProps ? cityWithProps.name : availableCities[0].name;
    }
    return "Jalandhar";
  }, [availableCities]);

  const [selectedCity, setSelectedCity] = useState<string>(defaultCity);
  const [availabilityFilter, setAvailabilityFilter] = useState<"all" | "available" | "roommate">("all");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [selectedGender, setSelectedGender] = useState<string>("all");
  const [selectedProperty, setSelectedProperty] = useState<PropertyListingSummary | null>(null);

  // User Geolocation & Sorting
  const [userLocation, setUserLocation] = useState<Coordinates | null>(null);
  const [isLocating, setIsLocating] = useState<boolean>(false);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<"recommended" | "nearest" | "price-asc" | "price-desc">("recommended");

  const heroGenderOptions = useMemo(() => [
    { value: "all", label: "All Genders" },
    { value: "boys", label: "Boys Only" },
    { value: "girls", label: "Girls Only" },
    { value: "unisex", label: "Coliving / Unisex" },
  ], []);

  const sortOptions = useMemo(() => [
    { value: "recommended", label: "Recommended" },
    ...(userLocation ? [{ value: "nearest", label: "Nearest First" }] : []),
    { value: "price-asc", label: "Price: Low to High" },
    { value: "price-desc", label: "Price: High to Low" },
  ], [userLocation]);

  const handleLocateMe = () => {
    if (!navigator.geolocation) {
      setLocationError("Geolocation is not supported by your browser.");
      return;
    }

    setIsLocating(true);
    setLocationError(null);

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const coords: Coordinates = {
          latitude: pos.coords.latitude,
          longitude: pos.coords.longitude,
        };
        setUserLocation(coords);
        setIsLocating(false);
        setSortBy("nearest");
        setSelectedCity("All"); // Show all properties ranked by proximity to current location
      },
      (err) => {
        console.warn("Geolocation error:", err);
        setIsLocating(false);
        if (err.code === err.PERMISSION_DENIED) {
          setLocationError("Location permission was denied. Please allow location access in your browser to view properties near you.");
        } else {
          setLocationError("Could not detect your current GPS location. Please check your network connection.");
        }
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 }
    );
  };

  const handleClearLocation = () => {
    setUserLocation(null);
    setSortBy("recommended");
    setSelectedCity(defaultCity);
  };

  // Map & Discovery View Mode
  const [liveProperties, setLiveProperties] = useState<PropertyListingSummary[]>(initialProperties);
  const [viewMode, setViewMode] = useState<"grid" | "split" | "map">("grid");
  const [hoveredPropertyId, setHoveredPropertyId] = useState<string | null>(null);

  const handleBoundsChange = async (bounds: { north: number; south: number; east: number; west: number }) => {
    try {
      const res = await getPropertiesInBoundsAction(bounds, {
        genderPolicy: selectedGender,
        city: selectedCity,
      });
      if (res.success && res.properties.length > 0) {
        setLiveProperties((prev) => {
          const existingIds = new Set(prev.map((p) => p.id));
          const newlyDiscovered = res.properties.filter((p) => !existingIds.has(p.id));
          return newlyDiscovered.length > 0 ? [...prev, ...newlyDiscovered] : prev;
        });
      }
    } catch (err) {
      console.error("Error updating properties on bounds change:", err);
    }
  };

  // Quick localities based on real localities in DB for the selected city + live properties
  const quickLocalities = useMemo(() => {
    const set = new Set<string>();

    // 1. Fetch matched city localities from location master
    const matched = availableCities?.find(
      (c) => c.name.toLowerCase() === selectedCity.toLowerCase()
    );
    if (matched) {
      matched.localities.forEach((loc) => {
        if (loc && loc.trim()) set.add(loc.trim());
      });
    }

    // 2. Also add any localities where live properties currently exist for this city
    liveProperties
      .filter(
        (p) =>
          selectedCity === "All" ||
          p.city.toLowerCase() === selectedCity.toLowerCase()
      )
      .forEach((p) => {
        if (p.locality && p.locality.trim()) {
          set.add(p.locality.trim());
        }
      });

    // 3. Fallback to any locality in liveProperties if "All" is selected
    if (set.size === 0 && selectedCity === "All") {
      liveProperties.forEach((p) => {
        if (p.locality && p.locality.trim()) set.add(p.locality.trim());
      });
    }

    return Array.from(set).slice(0, 10);
  }, [selectedCity, availableCities, liveProperties]);

  // Filter & sort properties based on search, gender, availability & GPS distance
  const filteredProperties = useMemo(() => {
    const matched = liveProperties
      .map((p) => {
        const hasCoords =
          typeof p.latitude === "number" &&
          typeof p.longitude === "number" &&
          !isNaN(p.latitude) &&
          !isNaN(p.longitude);

        const distanceKm =
          userLocation && hasCoords
            ? calculateDistanceKm(
                userLocation.latitude,
                userLocation.longitude,
                p.latitude,
                p.longitude
              )
            : undefined;

        return {
          ...p,
          distanceKm,
        };
      })
      .filter((p) => {
        if (availabilityFilter === "roommate" && !p.hasActiveRoommateRequest) {
          return false;
        }

        const matchesCity =
          selectedCity === "All" ||
          p.city.toLowerCase() === selectedCity.toLowerCase() ||
          searchQuery.trim().length > 0;

        const q = searchQuery.toLowerCase().trim();
        const matchesQuery =
          !q ||
          p.name.toLowerCase().includes(q) ||
          p.locality.toLowerCase().includes(q) ||
          p.city.toLowerCase().includes(q);

        const matchesGender =
          selectedGender === "all" ||
          p.genderPolicy.toLowerCase() === selectedGender.toLowerCase();

        return matchesCity && matchesQuery && matchesGender;
      });

    // Sorting
    if (sortBy === "nearest") {
      matched.sort((a, b) => (a.distanceKm ?? Infinity) - (b.distanceKm ?? Infinity));
    } else if (sortBy === "price-asc") {
      matched.sort((a, b) => a.startingPrice - b.startingPrice);
    } else if (sortBy === "price-desc") {
      matched.sort((a, b) => b.startingPrice - a.startingPrice);
    }

    return matched;
  }, [
    liveProperties,
    selectedCity,
    searchQuery,
    selectedGender,
    availabilityFilter,
    userLocation,
    sortBy,
  ]);

  return (
    <div className="min-h-screen flex flex-col bg-white text-zinc-900 selection:bg-[#96BF8A]/30 selection:text-[#00412E]">
      {/* 1. Clean Header */}
      <Header
        selectedCity={selectedCity}
        cities={availableCities?.map((c) => c.name)}
        onSelectCity={(city) => {
          setSelectedCity(city);
          setSearchQuery("");
        }}
        onSearchClick={() => {
          document.getElementById("locality-search-input")?.focus();
        }}
        currentUser={currentUser}
      />

      <main className="flex-1">
        {/* 2. Clean Minimal Hero */}
        <section className="relative border-b border-[#E8EAE5] bg-[#FAFAF8] py-10 sm:py-14">
          <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 text-center">
            {/* StayKro Brand Badge */}
            <div className="inline-flex items-center gap-2 rounded-full border border-[#96BF8A]/40 bg-white px-3.5 py-1.5 shadow-xs mb-4">
              <div className="relative h-5 w-5 shrink-0 overflow-hidden rounded-md">
                <Image
                  src="/logo.png"
                  alt="StayKro Logo"
                  width={20}
                  height={20}
                  className="h-full w-full object-contain"
                  priority
                />
              </div>
              <span className="text-xs font-bold text-[#00412E] tracking-tight">
                StayKro <span className="text-[#96BF8A] font-semibold">•</span> 100% Direct From Owner
              </span>
            </div>

            {/* Title & Subhead */}
            <h1 className="text-2xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-zinc-950 sm:leading-tight">
              Verified PGs & Coliving in{" "}
              <span className="text-[#00412E]">{selectedCity}</span>
            </h1>
            <p className="mt-2 text-xs sm:text-sm text-zinc-500 max-w-xl mx-auto leading-relaxed">
              Explore authentic direct-from-owner accommodations with real photos, verified room inventory, and transparent pricing.
            </p>

            {/* Clean Minimal Search Bar */}
            <div className="mt-6 max-w-3xl mx-auto">
              <div className="rounded-2xl border border-[#E8EAE5] bg-white p-2.5 sm:p-3 shadow-sm">
                <div className="grid grid-cols-1 sm:grid-cols-12 gap-2.5 items-center">
                  {/* Locality Input */}
                  <div className="sm:col-span-7 flex items-center rounded-xl bg-[#E8EAE5]/40 px-3.5 py-2.5 border border-[#E8EAE5] focus-within:border-[#00412E] focus-within:bg-white transition-all">
                    <MapPin className="h-4 w-4 text-[#00412E] shrink-0 mr-2.5" />
                    <input
                      id="locality-search-input"
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder={`Search locality or PG in ${selectedCity}...`}
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

                  {/* Gender Filter */}
                  <div className="sm:col-span-3">
                    <HomeSelect
                      value={selectedGender}
                      options={heroGenderOptions}
                      onChange={(val) => setSelectedGender(val)}
                      icon={<Users className="h-4 w-4 text-[#00412E]" />}
                    />
                  </div>

                  {/* Search CTA */}
                  <div className="sm:col-span-2">
                    <button
                      type="button"
                      onClick={() => {
                        document.getElementById("discovery-section")?.scrollIntoView({ behavior: "smooth" });
                      }}
                      className="w-full flex items-center justify-center gap-1.5 rounded-xl bg-[#00412E] py-2.5 px-4 text-xs sm:text-sm font-bold text-white hover:bg-[#002d20] active:scale-95 transition-all shadow-sm shadow-[#00412E]/20 cursor-pointer"
                    >
                      <Search className="h-4 w-4 text-[#96BF8A]" />
                      <span>Search</span>
                    </button>
                  </div>
                </div>

                {/* Quick Locality Pills & Near Me */}
                <div className="mt-2.5 pt-2.5 border-t border-[#E8EAE5] flex flex-wrap items-center gap-1.5 text-xs px-1">
                  <button
                    type="button"
                    onClick={userLocation ? handleClearLocation : handleLocateMe}
                    className={`inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-bold transition-all cursor-pointer ${
                      userLocation
                        ? "bg-[#00412E] text-white shadow-xs"
                        : "bg-[#E8EAE5] text-[#00412E] hover:bg-[#eff4ec] border border-[#96BF8A]/30"
                    }`}
                    title={userLocation ? "Click to clear current location" : "Show accommodations near your current GPS location"}
                  >
                    {isLocating ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    ) : (
                      <Navigation className="h-3.5 w-3.5" />
                    )}
                    <span>{userLocation ? "Near Me (Active)" : "Find Near Me"}</span>
                  </button>

                  <span className="font-semibold text-zinc-500 flex items-center gap-1 mx-1">
                    <SlidersHorizontal className="h-3 w-3" /> {selectedCity}:
                  </span>
                  {quickLocalities.map((loc) => (
                    <button
                      key={loc}
                      type="button"
                      onClick={() => setSearchQuery(loc)}
                      className={`rounded-lg px-2.5 py-1 text-xs font-medium transition-colors cursor-pointer ${
                        searchQuery.toLowerCase() === loc.toLowerCase()
                          ? "bg-[#00412E] text-white font-bold"
                          : "bg-[#E8EAE5]/70 text-zinc-700 hover:bg-[#E8EAE5]"
                      }`}
                    >
                      {loc}
                    </button>
                  ))}
                  {searchQuery && (
                    <button
                      onClick={() => setSearchQuery("")}
                      className="text-xs text-rose-500 hover:underline font-semibold ml-auto cursor-pointer"
                    >
                      Clear
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* 3. Live Discovery Explorer Section */}
        <section id="discovery-section" className="py-12 sm:py-16 bg-white">
          <div className={`mx-auto px-4 sm:px-6 lg:px-8 transition-all duration-300 ${viewMode === "split" ? "max-w-7xl" : "max-w-6xl"}`}>
            {/* 1. Sleek Header Row: Title & View Switcher */}
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 pb-4">
              <div>
                <div className="flex items-center gap-2.5">
                  <h2 className="text-xl sm:text-2xl font-black tracking-tight text-zinc-950">
                    {userLocation ? "Stays Near You" : `Verified Stays in ${selectedCity}`}
                  </h2>
                  <span className="rounded-full bg-zinc-100 px-2.5 py-0.5 text-xs font-semibold text-zinc-600 border border-zinc-200/60">
                    {filteredProperties.length} {filteredProperties.length === 1 ? "stay" : "stays"}
                  </span>
                </div>
                <p className="mt-1 text-xs sm:text-sm text-zinc-500">
                  {userLocation
                    ? "Direct distance from your current location • 100% zero brokerage"
                    : "Direct-from-owner accommodations with verified inventory and pricing"}
                </p>
              </div>

              {/* View Switcher: Grid / Split / Map */}
              <div className="inline-flex items-center self-start sm:self-auto rounded-xl bg-zinc-100 p-1 border border-zinc-200/80 shrink-0 shadow-2xs">
                <button
                  type="button"
                  id="viewmode-grid-btn"
                  onClick={() => setViewMode("grid")}
                  className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-bold transition-all cursor-pointer ${
                    viewMode === "grid"
                      ? "bg-white text-zinc-950 shadow-xs"
                      : "text-zinc-600 hover:text-zinc-950"
                  }`}
                  title="Grid View"
                >
                  <LayoutGrid className="h-3.5 w-3.5" />
                  <span>Grid</span>
                </button>
                <button
                  type="button"
                  id="viewmode-split-btn"
                  onClick={() => setViewMode("split")}
                  className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-bold transition-all cursor-pointer ${
                    viewMode === "split"
                      ? "bg-white text-zinc-950 shadow-xs"
                      : "text-zinc-600 hover:text-zinc-950"
                  }`}
                  title="Split View"
                >
                  <Columns2 className="h-3.5 w-3.5" />
                  <span>Split</span>
                </button>
                <button
                  type="button"
                  id="viewmode-map-btn"
                  onClick={() => setViewMode("map")}
                  className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-bold transition-all cursor-pointer ${
                    viewMode === "map"
                      ? "bg-white text-zinc-950 shadow-xs"
                      : "text-zinc-600 hover:text-zinc-950"
                  }`}
                  title="Map View"
                >
                  <Map className="h-3.5 w-3.5" />
                  <span>Map</span>
                </button>
              </div>
            </div>

            {/* 2. Unified Premium Toolbar */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 py-2">
              {/* Left: Filter Tabs */}
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0 text-xs">
                <button
                  type="button"
                  id="avail-filter-all"
                  onClick={() => setAvailabilityFilter("all")}
                  className={`rounded-xl px-3.5 py-1.5 font-bold transition-all cursor-pointer whitespace-nowrap ${
                    availabilityFilter === "all"
                      ? "bg-[#00412E] text-white shadow-xs"
                      : "bg-[#E8EAE5]/60 text-zinc-700 hover:bg-[#E8EAE5]"
                  }`}
                >
                  All Stays
                </button>
                <button
                  type="button"
                  id="avail-filter-room"
                  onClick={() => setAvailabilityFilter("available")}
                  className={`rounded-xl px-3.5 py-1.5 font-bold transition-all cursor-pointer whitespace-nowrap ${
                    availabilityFilter === "available"
                      ? "bg-[#00412E] text-white shadow-xs"
                      : "bg-[#E8EAE5]/60 text-zinc-700 hover:bg-[#E8EAE5]"
                  }`}
                >
                  Rooms Available
                </button>
                <button
                  type="button"
                  id="avail-filter-roommate"
                  onClick={() => setAvailabilityFilter("roommate")}
                  className={`rounded-xl px-3.5 py-1.5 font-bold transition-all cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${
                    availabilityFilter === "roommate"
                      ? "bg-[#00412E] text-white shadow-xs"
                      : "bg-[#eff4ec] text-[#00412E] hover:bg-[#dce7d8] border border-[#96BF8A]/40"
                  }`}
                >
                  <Users className="h-3.5 w-3.5 text-[#96BF8A]" />
                  <span>Roommate Wanted</span>
                </button>
              </div>

              {/* Right: GPS Active Status & Sort Selector */}
              <div className="flex items-center gap-2.5 self-start md:self-auto shrink-0 text-xs">
                {userLocation ? (
                  <div className="inline-flex items-center gap-2 rounded-xl bg-[#eff4ec] border border-[#96BF8A]/40 px-3 py-1.5 font-medium text-[#00412E] shadow-2xs">
                    <span className="relative flex h-2 w-2">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#96BF8A] opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-[#00412E]"></span>
                    </span>
                    <span className="font-bold">GPS Near Me</span>
                    <button
                      type="button"
                      onClick={handleLocateMe}
                      disabled={isLocating}
                      title="Refresh GPS"
                      className="text-[#00412E] hover:text-[#002d20] cursor-pointer transition-colors p-0.5"
                    >
                      {isLocating ? (
                        <Loader2 className="h-3 w-3 animate-spin" />
                      ) : (
                        <RefreshCw className="h-3 w-3" />
                      )}
                    </button>
                    <button
                      type="button"
                      onClick={handleClearLocation}
                      title="Clear location filter"
                      className="text-zinc-400 hover:text-rose-600 font-bold cursor-pointer text-xs leading-none pl-1 transition-colors"
                    >
                      ✕
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={handleLocateMe}
                    disabled={isLocating}
                    className="inline-flex items-center gap-1.5 rounded-xl border border-[#E8EAE5] bg-white px-3 py-1.5 font-semibold text-zinc-700 hover:bg-[#eff4ec] hover:text-[#00412E] transition-colors cursor-pointer shadow-2xs"
                  >
                    {isLocating ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin text-[#00412E]" />
                    ) : (
                      <Navigation className="h-3.5 w-3.5 text-[#00412E]" />
                    )}
                    <span>Near Me</span>
                  </button>
                )}

                {/* Sleek Sort Dropdown */}
                <HomeSelect
                  value={sortBy}
                  options={sortOptions}
                  onChange={(val) => setSortBy(val as any)}
                  icon={<ArrowUpDown className="h-3 w-3 text-zinc-400 shrink-0" />}
                  size="sm"
                />
              </div>
            </div>

            {/* Optional Geolocation Error Notice */}
            {locationError && (
              <div className="mt-3 rounded-xl bg-amber-50 border border-amber-200 px-3.5 py-2 flex items-center justify-between text-xs text-amber-900 shadow-2xs">
                <span>{locationError}</span>
                <button
                  type="button"
                  onClick={() => setLocationError(null)}
                  className="font-bold text-amber-700 hover:text-amber-950 cursor-pointer ml-3 px-1.5"
                >
                  ✕
                </button>
              </div>
            )}

            {/* Content Display */}
            {filteredProperties.length > 0 ? (
              viewMode === "split" ? (
                // SPLIT VIEW (List on left, sticky map on right)
                <div className="mt-8 grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                  <div className="lg:col-span-6 xl:col-span-7 space-y-4 max-h-[calc(100vh-10rem)] overflow-y-auto pr-2">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {filteredProperties.map((pg) => (
                        <PropertyCard
                          key={pg.id}
                          pg={pg}
                          isHovered={hoveredPropertyId === pg.id}
                          onMouseEnter={() => setHoveredPropertyId(pg.id)}
                          onMouseLeave={() => setHoveredPropertyId(null)}
                        />
                      ))}
                    </div>
                  </div>

                  <div className="lg:col-span-6 xl:col-span-5 sticky top-24 h-[calc(100vh-10rem)] min-h-[500px]">
                    <PropertyMap
                      properties={filteredProperties}
                      selectedCity={selectedCity}
                      selectedPropertyId={hoveredPropertyId}
                      userLocation={userLocation}
                      onSelectProperty={(id) => setHoveredPropertyId(id)}
                      onBoundsChange={handleBoundsChange}
                      onLocateMe={handleLocateMe}
                      isLocating={isLocating}
                      className="w-full h-full shadow-md"
                    />
                  </div>
                </div>
              ) : viewMode === "map" ? (
                // MAP ONLY VIEW
                <div className="mt-8 h-[calc(100vh-14rem)] min-h-[550px]">
                  <PropertyMap
                    properties={filteredProperties}
                    selectedCity={selectedCity}
                    selectedPropertyId={hoveredPropertyId}
                    userLocation={userLocation}
                    onSelectProperty={(id) => setHoveredPropertyId(id)}
                    onBoundsChange={handleBoundsChange}
                    onLocateMe={handleLocateMe}
                    isLocating={isLocating}
                    className="w-full h-full shadow-md"
                  />
                </div>
              ) : (
                // STANDARD GRID VIEW (3-columns)
                <div className="mt-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {filteredProperties.map((pg) => (
                    <PropertyCard
                      key={pg.id}
                      pg={pg}
                      isHovered={hoveredPropertyId === pg.id}
                      onMouseEnter={() => setHoveredPropertyId(pg.id)}
                      onMouseLeave={() => setHoveredPropertyId(null)}
                    />
                  ))}
                </div>
              )
            ) : (
              // Clean empty state for PGs
              <div className="mt-12 rounded-3xl border border-dashed border-zinc-200 p-10 sm:p-14 text-center max-w-lg mx-auto">
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600 mb-4">
                  <Building2 className="h-6 w-6" />
                </div>
                <h3 className="text-base font-bold text-zinc-900">
                  No PGs currently listed in {selectedCity}
                </h3>
                <p className="mt-1.5 text-xs sm:text-sm text-zinc-500 leading-relaxed">
                  We are currently expanding our direct-from-owner network. Choose another city or list your property if you are an accommodation owner.
                </p>
                <div className="mt-5 flex flex-wrap items-center justify-center gap-2.5">
                  {availableCities
                    ?.filter((c) => (c.propertyCount || 0) > 0 && c.name.toLowerCase() !== selectedCity.toLowerCase())
                    .slice(0, 2)
                    .map((c) => (
                      <button
                        key={c.name}
                        onClick={() => {
                          setSelectedCity(c.name);
                          setSearchQuery("");
                        }}
                        className="rounded-xl border border-zinc-200 bg-white px-4 py-2 text-xs font-semibold text-zinc-700 hover:bg-zinc-50 transition-colors cursor-pointer"
                      >
                        View {c.name} PGs ({c.propertyCount})
                      </button>
                    ))}
                  <button
                    onClick={() => {
                      setSelectedCity("All");
                      setSearchQuery("");
                    }}
                    className="rounded-xl bg-zinc-900 px-4 py-2 text-xs font-semibold text-white hover:bg-zinc-800 transition-colors cursor-pointer"
                  >
                    Browse All Locations
                  </button>
                </div>
              </div>
            )}

            {/* Dedicated Roommate Discovery Callout Banner (Direct access to full /roommates page) */}
            <div className="mt-14 rounded-3xl border border-[#E8EAE5] bg-gradient-to-r from-[#eff4ec] via-[#E8EAE5]/40 to-white p-6 sm:p-8 flex flex-col md:flex-row md:items-center justify-between gap-6 shadow-xs">
              <div className="space-y-1.5 max-w-xl">
                <div className="inline-flex items-center gap-1.5 rounded-full bg-[#96BF8A]/20 border border-[#96BF8A]/40 px-3 py-1 text-[11px] font-bold text-[#00412E]">
                  <Users className="h-3.5 w-3.5 text-[#00412E]" /> Roommate & Flatshare Matching
                </div>
                <h3 className="text-lg sm:text-xl font-bold text-zinc-950">
                  Looking to split rent or share an apartment in {selectedCity}?
                </h3>
                <p className="text-xs sm:text-sm text-zinc-500 leading-relaxed">
                  Visit the dedicated Roommates platform to connect with verified students and working professionals. Filter by lifestyle preferences, move-in dates, and direct contact options with zero brokerage.
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-3 shrink-0">
                <Link
                  href="/roommates"
                  className="inline-flex items-center gap-2 rounded-xl bg-[#00412E] px-5 py-2.5 text-xs font-bold text-white hover:bg-[#002d20] transition-all shadow-xs cursor-pointer group"
                >
                  <Users className="h-4 w-4 text-[#96BF8A]" />
                  <span>Find Roommates</span>
                  <ArrowRight className="h-3.5 w-3.5 text-[#96BF8A] group-hover:translate-x-0.5 transition-transform" />
                </Link>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* 6. Clean Footer */}
      <Footer />

      {/* Property Details Modal */}
      {selectedProperty && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
          <div className="relative w-full max-w-lg rounded-2xl bg-white p-6 shadow-xl border border-zinc-200">
            <button
              onClick={() => setSelectedProperty(null)}
              className="absolute top-4 right-4 text-zinc-400 hover:text-zinc-600 cursor-pointer"
            >
              <X className="h-5 w-5" />
            </button>

            <div className="flex items-center justify-between gap-2 mb-1">
              <div className="flex items-center gap-1.5 text-xs text-zinc-500 truncate">
                <MapPin className="h-3.5 w-3.5 text-[#00412E] shrink-0" />
                <span className="truncate">{selectedProperty.locality}, {selectedProperty.city}</span>
              </div>
              {selectedProperty.distanceKm !== undefined && selectedProperty.distanceKm < Infinity && (
                <span className="shrink-0 flex items-center gap-1 text-xs font-bold text-[#00412E] bg-[#eff4ec] border border-[#96BF8A]/40 px-2.5 py-0.5 rounded-full">
                  <Navigation className="h-3 w-3 text-[#00412E]" />
                  {formatDistance(selectedProperty.distanceKm)}
                </span>
              )}
            </div>
            <h3 className="text-xl font-bold text-zinc-950">
              {selectedProperty.name}
            </h3>

            <div className="mt-3 flex items-center gap-2">
              <span className="rounded-md bg-zinc-100 px-2.5 py-1 text-xs font-bold text-zinc-700">
                {selectedProperty.genderPolicy}
              </span>
              {selectedProperty.foodIncluded && (
                <span className="rounded-md bg-[#eff4ec] text-[#00412E] border border-[#96BF8A]/30 px-2.5 py-1 text-xs font-bold">
                  Meals Included
                </span>
              )}
            </div>

            <div className="mt-5 p-4 rounded-xl bg-zinc-50 border border-zinc-100">
              <div className="text-xs text-zinc-500 font-semibold mb-2">Available Room Types</div>
              <div className="space-y-1.5">
                {selectedProperty.roomTypeSummaries.map((rt) => (
                  <div key={rt} className="flex items-center justify-between text-xs font-medium text-zinc-800">
                    <span className="flex items-center gap-1.5">
                      <CheckCircle2 className="h-3.5 w-3.5 text-[#00412E]" />
                      {rt}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <div className="mt-6 flex items-center justify-between">
              <div>
                <div className="flex items-center gap-1.5 mb-0.5">
                  {selectedProperty.originalPrice && selectedProperty.originalPrice > selectedProperty.startingPrice && (
                    <span className="text-xs font-semibold text-zinc-400 line-through">
                      ₹{selectedProperty.originalPrice.toLocaleString("en-IN")}
                    </span>
                  )}
                  {selectedProperty.bestSharingOccupancy && selectedProperty.bestSharingOccupancy > 1 ? (
                    <span className="text-[10px] font-bold text-[#00412E] bg-[#96BF8A]/20 px-1.5 py-0.5 rounded-md border border-[#96BF8A]/40">
                      {selectedProperty.bestSharingOccupancy}-Sharing
                    </span>
                  ) : (
                    <span className="text-[10px] text-zinc-400 uppercase font-semibold">
                      Starting Rent
                    </span>
                  )}
                </div>
                <div className="text-xl font-extrabold text-zinc-950 flex items-baseline gap-1">
                  <span>₹{selectedProperty.startingPrice.toLocaleString("en-IN")}</span>
                  <span className="text-xs font-normal text-zinc-500">/mo</span>
                </div>
              </div>
              <Link
                href={`/property/${selectedProperty.slug}`}
                className="rounded-xl bg-[#00412E] px-5 py-2.5 text-xs font-bold text-white hover:bg-[#002d20] transition-colors"
              >
                View Full Details & Contact
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* Floating Mobile Toggle (List / Map) */}
      {filteredProperties.length > 0 && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-30 sm:hidden">
          <button
            type="button"
            onClick={() => setViewMode(viewMode === "map" ? "grid" : "map")}
            className="flex items-center gap-2 rounded-full bg-zinc-950 px-5 py-3 text-xs font-bold text-white shadow-2xl hover:bg-zinc-800 transition-all active:scale-95 border border-zinc-700 cursor-pointer"
          >
            {viewMode === "map" ? (
              <>
                <LayoutGrid className="h-4 w-4 text-indigo-400" />
                <span>Show List</span>
              </>
            ) : (
              <>
                <Map className="h-4 w-4 text-indigo-400" />
                <span>Show Map</span>
              </>
            )}
          </button>
        </div>
      )}
    </div>
  );
}
