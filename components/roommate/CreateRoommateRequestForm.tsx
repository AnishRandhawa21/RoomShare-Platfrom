"use client";

import { useState, useRef, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import {
  MapPin,
  Calendar,
  ShieldCheck,
  Building2,
  AlertCircle,
  Loader2,
  X,
  ArrowRight,
  Utensils,
  Cigarette,
  Wine,
  Moon,
  Briefcase,
  Lock,
  Check,
  PawPrint,
  Search,
} from "lucide-react";
import {
  createRoommateRequestAction,
  type CreateRoommateRequestInput,
} from "@/actions/roommate";
import { CustomDatePicker } from "@/components/ui/CustomDatePicker";
import { CustomSelect, type CustomSelectOption } from "@/components/ui/CustomSelect";
import {
  DietaryPreference,
  SmokingPreference,
  DrinkingPreference,
  OccupationPreference,
  SleepSchedule,
} from "@/lib/types/roommate";

export interface SelectedPGContext {
  propertyId: string;
  propertyName: string;
  propertySlug: string;
  locality: string;
  city: string;
  state: string;
  roomTypeId: string;
  roomTypeName: string;
  monthlyRent: number; // Split share per person
  totalRoomRent?: number; // Total PG room rent
  securityDeposit: number; // Split deposit per person
  totalSecurityDeposit?: number; // Total PG room deposit
  roommateNeededCount: number;
  occupancy: number;
  genderPolicy: string;
  hasAttachedBathroom: boolean;
}

export interface PropertyOptionWithRooms {
  id: string;
  name: string;
  locality: string;
  city: string;
  state: string;
  genderPolicy: string;
  imageUrl?: string | null;
  roomTypes: {
    id: string;
    name: string;
    monthlyRent: number;
    securityDeposit: number;
    occupancy: number;
    hasAttachedBathroom: boolean;
  }[];
}

const DIETARY_OPTIONS: CustomSelectOption[] = [
  { value: DietaryPreference.NO_PREFERENCE, label: "No Preference" },
  { value: DietaryPreference.VEGETARIAN_ONLY, label: "Vegetarian Only" },
  { value: DietaryPreference.NON_VEG_OK, label: "Non-Veg OK" },
  { value: DietaryPreference.VEGAN, label: "Vegan Only" },
];

const SMOKING_OPTIONS: CustomSelectOption[] = [
  { value: SmokingPreference.NON_SMOKER_ONLY, label: "Non-Smoker Only" },
  { value: SmokingPreference.OUTSIDE_ONLY, label: "Outside / Balcony Only" },
  { value: SmokingPreference.SMOKING_OK, label: "Smoking OK" },
];

const DRINKING_OPTIONS: CustomSelectOption[] = [
  { value: DrinkingPreference.NO_PREFERENCE, label: "No Preference" },
  { value: DrinkingPreference.NON_DRINKER_ONLY, label: "Non-Drinker Only" },
  { value: DrinkingPreference.OCCASIONAL_OK, label: "Occasional Drinking OK" },
];

const OCCUPATION_OPTIONS: CustomSelectOption[] = [
  { value: OccupationPreference.ANY, label: "Any (Students & Professionals)" },
  { value: OccupationPreference.WORKING_PROFESSIONAL, label: "Working Professionals Only" },
  { value: OccupationPreference.STUDENT, label: "College Students Only" },
];

const SLEEP_SCHEDULE_OPTIONS: CustomSelectOption[] = [
  { value: SleepSchedule.FLEXIBLE, label: "Flexible Schedule" },
  { value: SleepSchedule.EARLY_BIRD, label: "Early Bird (Sleeps < 11 PM)" },
  { value: SleepSchedule.NIGHT_OWL, label: "Night Owl (Late nights)" },
];

const PET_OPTIONS: CustomSelectOption[] = [
  { value: "false", label: "No Pets Allowed" },
  { value: "true", label: "Pets Allowed & Welcome" },
];

interface CreateRoommateRequestFormProps {
  initialPGContext?: SelectedPGContext | null;
  properties?: PropertyOptionWithRooms[];
  userFullName: string;
}

export function CreateRoommateRequestForm({
  initialPGContext,
  properties = [],
  userFullName,
}: CreateRoommateRequestFormProps) {
  const router = useRouter();

  // Active PG Context (either passed from property page or selected here)
  const [activePG, setActivePG] = useState<SelectedPGContext | null>(
    initialPGContext || null
  );

  // Selector state if user came without pre-selected PG
  const [selectedPropId, setSelectedPropId] = useState<string>("");
  const [selectedRtId, setSelectedRtId] = useState<string>("");
  const [pgSearchQuery, setPgSearchQuery] = useState<string>("");
  const [isPgDropdownOpen, setIsPgDropdownOpen] = useState<boolean>(false);
  const pgSearchRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (
        pgSearchRef.current &&
        !pgSearchRef.current.contains(e.target as Node)
      ) {
        setIsPgDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const filteredProperties = useMemo(() => {
    if (!pgSearchQuery.trim()) return properties;
    const q = pgSearchQuery.toLowerCase().trim();
    return properties.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        p.locality.toLowerCase().includes(q) ||
        p.city.toLowerCase().includes(q)
    );
  }, [properties, pgSearchQuery]);

  // Personal / Request-specific Inputs (ONLY what is required from the user)
  const [moveInDate, setMoveInDate] = useState<string>(() => {
    const d = new Date();
    d.setDate(d.getDate() + 7);
    return d.toISOString().split("T")[0];
  });
  const [description, setDescription] = useState<string>("");
  const [customTitle, setCustomTitle] = useState<string>("");

  // Lifestyle Preferences
  const [dietary, setDietary] = useState<DietaryPreference>(
    DietaryPreference.NO_PREFERENCE
  );
  const [smoking, setSmoking] = useState<SmokingPreference>(
    SmokingPreference.NON_SMOKER_ONLY
  );
  const [drinking, setDrinking] = useState<DrinkingPreference>(
    DrinkingPreference.NO_PREFERENCE
  );
  const [occupation, setOccupation] = useState<OccupationPreference>(
    OccupationPreference.ANY
  );
  const [sleepSchedule, setSleepSchedule] = useState<SleepSchedule>(
    SleepSchedule.FLEXIBLE
  );
  const [petsAllowed, setPetsAllowed] = useState<boolean>(false);

  // Optional Tags
  const [customTags, setCustomTags] = useState<string[]>([
    "Working Professional",
    "Clean & Organized",
  ]);
  const [tagInput, setTagInput] = useState<string>("");

  // Submission state
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Helper for manual PG picker if initialPGContext was not provided
  const handleSelectProperty = (propId: string) => {
    setSelectedPropId(propId);
    setSelectedRtId("");
  };

  const handleSelectRoomType = (rtId: string) => {
    setSelectedRtId(rtId);
    const prop = properties.find((p) => p.id === selectedPropId);
    const rt = prop?.roomTypes.find((r) => r.id === rtId);
    if (prop && rt) {
      if (rt.occupancy <= 1) {
        setErrorMessage("Private single rooms cannot have a roommate request. Please choose a sharing room type.");
        return;
      }
      setErrorMessage(null);
      const splitCount = Math.max(1, rt.occupancy);
      const rentPerPerson = Math.round(rt.monthlyRent / splitCount);
      const depositPerPerson = Math.round(rt.securityDeposit / splitCount);

      setActivePG({
        propertyId: prop.id,
        propertyName: prop.name,
        propertySlug: prop.id,
        locality: prop.locality,
        city: prop.city,
        state: prop.state,
        roomTypeId: rt.id,
        roomTypeName: rt.name,
        monthlyRent: rentPerPerson,
        totalRoomRent: rt.monthlyRent,
        securityDeposit: depositPerPerson,
        totalSecurityDeposit: rt.securityDeposit,
        roommateNeededCount: Math.max(1, rt.occupancy - 1),
        occupancy: rt.occupancy,
        genderPolicy: prop.genderPolicy,
        hasAttachedBathroom: rt.hasAttachedBathroom,
      });
    }
  };

  const addTag = () => {
    const trimmed = tagInput.trim();
    if (trimmed && !customTags.includes(trimmed)) {
      setCustomTags([...customTags, trimmed]);
      setTagInput("");
    }
  };

  const removeTag = (tag: string) => {
    setCustomTags(customTags.filter((t) => t !== tag));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activePG) {
      setErrorMessage("Please select a property and room type to continue.");
      return;
    }

    if (!description.trim() || description.trim().length < 10) {
      setErrorMessage("Please share a short 'About you' description (at least 10 characters).");
      return;
    }

    if (!moveInDate) {
      setErrorMessage("Please specify your target move-in date.");
      return;
    }

    setIsSubmitting(true);
    setErrorMessage(null);

    const input: CreateRoommateRequestInput = {
      propertyId: activePG.propertyId,
      roomTypeId: activePG.roomTypeId,
      title: customTitle.trim() || undefined, // Server auto-generates if omitted
      description: description.trim(),
      moveInDate,
      dietary,
      smoking,
      drinking,
      occupation,
      sleepSchedule,
      petsAllowed,
      customTags,
    };

    const res = await createRoommateRequestAction(input);

    if (res.success && res.data) {
      router.push(`/roommates/${res.data.requestId}`);
    } else {
      setIsSubmitting(false);
      setErrorMessage(res.error || "Failed to post roommate requirement.");
    }
  };

  const selectedPropForPicker = properties.find((p) => p.id === selectedPropId);

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* 1. READ-ONLY CONTEXT CARD (Mandatory Selected PG & Room Information) */}
      {activePG ? (
        <div className="rounded-3xl border border-violet-100 bg-gradient-to-br from-violet-50/60 via-white to-zinc-50/60 p-6 sm:p-7 shadow-xs">
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="inline-flex items-center gap-1.5 text-xs font-bold text-violet-700 uppercase tracking-wider mb-1">
                <Lock className="h-3 w-3" />
                <span>Selected Accommodation Context</span>
              </div>
              <h2 className="text-xl sm:text-2xl font-black text-zinc-950">
                {activePG.propertyName}
              </h2>
              <div className="flex items-center gap-1.5 text-xs text-zinc-600 mt-1">
                <MapPin className="h-3.5 w-3.5 text-zinc-400 shrink-0" />
                <span>
                  {activePG.locality}, {activePG.city}
                </span>
              </div>
            </div>

            <div className="flex flex-col items-end gap-1.5">
              <span className="rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 px-3 py-1 text-xs font-bold inline-flex items-center gap-1">
                <ShieldCheck className="h-3.5 w-3.5" />
                <span>Verified Property</span>
              </span>
              {!initialPGContext && (
                <button
                  type="button"
                  onClick={() => setActivePG(null)}
                  className="text-[11px] font-semibold text-violet-600 hover:underline"
                >
                  Change room
                </button>
              )}
            </div>
          </div>

          {/* Read-Only Breakdown Grid */}
          <div className="mt-5 grid grid-cols-1 sm:grid-cols-3 gap-3 border-t border-violet-100/70 pt-4">
            <div className="rounded-2xl bg-white p-3.5 border border-zinc-200">
              <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 block">
                Room Sharing Type
              </span>
              <span className="text-sm font-extrabold text-zinc-900 block mt-0.5">
                {activePG.roomTypeName}
              </span>
              <span className="text-[11px] text-zinc-500">
                {activePG.hasAttachedBathroom ? "Attached bathroom" : "Common bathroom"}
              </span>
            </div>

            <div className="rounded-2xl bg-white p-3.5 border border-zinc-200">
              <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 block">
                {activePG.occupancy > 1 ? "Rent Share / Person" : "Monthly Rent"}
              </span>
              <div className="flex items-baseline gap-1 mt-0.5">
                <span className="text-sm sm:text-base font-extrabold text-zinc-950">
                  ₹{activePG.monthlyRent.toLocaleString("en-IN")}
                </span>
                <span className="text-xs text-zinc-500">/ person / mo</span>
              </div>
              {activePG.totalRoomRent && activePG.occupancy > 1 ? (
                <div className="mt-1 text-[11px] font-medium text-emerald-700">
                  Total ₹{activePG.totalRoomRent.toLocaleString("en-IN")} split equally between {activePG.occupancy} persons
                </div>
              ) : null}
              <div className="text-[11px] text-zinc-500 mt-1">
                Deposit: ₹{activePG.securityDeposit.toLocaleString("en-IN")} / person
                {activePG.totalSecurityDeposit && activePG.occupancy > 1 ? (
                  <span className="text-zinc-400"> (₹{activePG.totalSecurityDeposit.toLocaleString("en-IN")} total)</span>
                ) : null}
              </div>
            </div>

            <div className="rounded-2xl bg-violet-50/50 p-3.5 border border-violet-200">
              <span className="text-[10px] font-bold uppercase tracking-wider text-violet-600 block">
                Inventory Derived
              </span>
              <span className="text-sm font-extrabold text-violet-900 block mt-0.5">
                {activePG.roommateNeededCount} roommate needed
              </span>
              <span className="text-[11px] text-violet-600">
                Occupancy capacity: {activePG.occupancy} beds
              </span>
            </div>
          </div>

          <p className="mt-3 text-[11px] text-zinc-400 italic">
            * Rent, deposit, address, and room attributes are securely loaded from the property catalog and cannot be altered here.
          </p>
        </div>
      ) : (
        /* Fallback PG Picker if user navigated directly without propertyId in URL */
        <div className="rounded-3xl border border-zinc-200 bg-white p-6 sm:p-8 shadow-xs space-y-4">
          <div className="flex items-center gap-2">
            <Building2 className="h-5 w-5 text-violet-600" />
            <h2 className="text-base sm:text-lg font-bold text-zinc-950">
              1. Select Your PG & Room Type
            </h2>
          </div>
          <p className="text-xs text-zinc-500">
            Choose the property and sharing room where you are looking for a flatmate.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
            <div>
              <label className="block text-xs font-semibold text-zinc-700 mb-1.5">
                Search PG Accommodation
              </label>

              {selectedPropForPicker ? (
                <div className="h-[46px] rounded-xl border border-[#00412E]/30 bg-white px-2.5 py-1.5 flex items-center justify-between gap-2.5 shadow-2xs">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="relative h-8 w-8 rounded-lg overflow-hidden bg-zinc-100 shrink-0 border border-zinc-200/80">
                      {selectedPropForPicker.imageUrl ? (
                        <Image
                          src={selectedPropForPicker.imageUrl}
                          alt={selectedPropForPicker.name}
                          fill
                          className="object-cover"
                        />
                      ) : (
                        <div className="h-full w-full flex items-center justify-center text-zinc-400">
                          <Building2 className="h-4 w-4" />
                        </div>
                      )}
                    </div>
                    <div className="min-w-0">
                      <div className="text-xs font-bold text-zinc-900 truncate">
                        {selectedPropForPicker.name}
                      </div>
                      <div className="text-[10px] text-zinc-500 truncate flex items-center gap-1">
                        <MapPin className="h-2.5 w-2.5 text-zinc-400 shrink-0" />
                        <span>
                          {selectedPropForPicker.locality}, {selectedPropForPicker.city}
                        </span>
                      </div>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedPropId("");
                      setSelectedRtId("");
                      setPgSearchQuery("");
                      setIsPgDropdownOpen(true);
                    }}
                    className="shrink-0 text-[11px] font-bold text-[#00412E] hover:underline px-2 py-1 rounded-lg bg-[#00412E]/5 hover:bg-[#00412E]/10 transition-colors flex items-center gap-1 cursor-pointer"
                  >
                    <span>Change</span>
                    <X className="h-3 w-3" />
                  </button>
                </div>
              ) : (
                <div className="relative" ref={pgSearchRef}>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400 pointer-events-none" />
                    <input
                      type="text"
                      placeholder="Type PG name, area or city..."
                      value={pgSearchQuery}
                      onChange={(e) => {
                        setPgSearchQuery(e.target.value);
                        setIsPgDropdownOpen(true);
                      }}
                      onFocus={() => setIsPgDropdownOpen(true)}
                      className="w-full h-[46px] rounded-xl border border-zinc-200 bg-zinc-50/80 pl-9 pr-8 text-xs font-medium text-zinc-900 placeholder:text-zinc-400 focus:bg-white focus:outline-none focus:border-[#00412E] focus:ring-2 focus:ring-[#00412E]/10 transition-all shadow-2xs"
                    />
                    {pgSearchQuery && (
                      <button
                        type="button"
                        onClick={() => setPgSearchQuery("")}
                        className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 text-zinc-400 hover:text-zinc-600 rounded-md"
                      >
                        <X className="h-3.5 w-3.5" />
                      </button>
                    )}
                  </div>

                  {/* Dropdown with property image in start and then property name */}
                  {isPgDropdownOpen && (
                    <div className="absolute left-0 top-full mt-1.5 w-full rounded-2xl border border-[#E8EAE5] bg-white p-1.5 shadow-2xl shadow-zinc-900/10 ring-1 ring-black/5 animate-in fade-in-50 zoom-in-95 duration-150 z-50">
                      <div className="max-h-64 overflow-y-auto space-y-1 pr-1 custom-scrollbar">
                        {filteredProperties.length > 0 ? (
                          filteredProperties.map((p) => (
                            <button
                              key={p.id}
                              type="button"
                              onClick={() => {
                                handleSelectProperty(p.id);
                                setIsPgDropdownOpen(false);
                                setPgSearchQuery("");
                              }}
                              className="group flex w-full items-center gap-3 rounded-xl p-2 text-left hover:bg-[#00412E]/5 transition-all cursor-pointer border border-transparent hover:border-[#00412E]/15"
                            >
                              {/* Image in start */}
                              <div className="relative h-11 w-11 rounded-xl overflow-hidden bg-zinc-100 shrink-0 border border-zinc-200/80 shadow-2xs">
                                {p.imageUrl ? (
                                  <Image
                                    src={p.imageUrl}
                                    alt={p.name}
                                    fill
                                    className="object-cover group-hover:scale-105 transition-transform"
                                  />
                                ) : (
                                  <div className="h-full w-full flex items-center justify-center text-zinc-400">
                                    <Building2 className="h-5 w-5" />
                                  </div>
                                )}
                              </div>

                              {/* Name and location */}
                              <div className="min-w-0 flex-1">
                                <div className="text-xs font-bold text-zinc-900 group-hover:text-[#00412E] truncate">
                                  {p.name}
                                </div>
                                <div className="text-[11px] text-zinc-500 truncate flex items-center gap-1 mt-0.5">
                                  <MapPin className="h-3 w-3 text-zinc-400 shrink-0" />
                                  <span>
                                    {p.locality}, {p.city}
                                  </span>
                                </div>
                              </div>

                              {/* Badge */}
                              <div className="shrink-0 flex flex-col items-end gap-0.5">
                                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-zinc-100 text-zinc-700">
                                  {p.genderPolicy === "BOYS"
                                    ? "Boys PG"
                                    : p.genderPolicy === "GIRLS"
                                    ? "Girls PG"
                                    : "Coliving"}
                                </span>
                                <span className="text-[10px] text-zinc-400">
                                  {p.roomTypes.length} sharing option
                                  {p.roomTypes.length > 1 ? "s" : ""}
                                </span>
                              </div>
                            </button>
                          ))
                        ) : (
                          <div className="py-6 text-center text-xs text-zinc-400">
                            No PG found matching &quot;{pgSearchQuery}&quot;
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            <div>
              <label className="block text-xs font-semibold text-zinc-700 mb-1.5">
                Select Room Type
              </label>
              <CustomSelect
                disabled={!selectedPropForPicker}
                triggerHeight="h-[46px]"
                value={selectedRtId}
                onChange={handleSelectRoomType}
                placeholder={
                  selectedPropForPicker
                    ? "-- Choose room type --"
                    : "Search and select a PG first"
                }
                options={
                  selectedPropForPicker?.roomTypes
                    .filter((rt) => rt.occupancy > 1)
                    .map((rt) => {
                      const splitRent = Math.round(
                        rt.monthlyRent / Math.max(1, rt.occupancy)
                      );
                      return {
                        value: rt.id,
                        label: `${rt.name} - ₹${splitRent.toLocaleString("en-IN")}/person`,
                        description: `Total ₹${rt.monthlyRent.toLocaleString("en-IN")}, ${rt.occupancy}-way split`,
                      };
                    }) || []
                }
              />
            </div>
          </div>
        </div>
      )}

      {/* 2. WHAT THE USER ACTUALLY NEEDS TO ENTER */}
      <div className="rounded-3xl border border-zinc-200 bg-white p-6 sm:p-8 shadow-xs space-y-6">
        <div>
          <h3 className="text-lg font-bold text-zinc-950">
            Tell Prospective Flatmates About Yourself
          </h3>
          <p className="text-xs text-zinc-500 mt-0.5">
            Posting as <span className="font-semibold text-zinc-800">{userFullName}</span>. Share your schedule, move-in readiness, and habits.
          </p>
        </div>

        {errorMessage && (
          <div className="flex items-center gap-2 rounded-xl bg-rose-50 border border-rose-200 p-3.5 text-xs font-medium text-rose-800">
            <AlertCircle className="h-4 w-4 shrink-0 text-rose-600" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Required: Target Move-in Date */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold text-zinc-800 mb-1.5">
              Target Move-in Date <span className="text-rose-500">*</span>
            </label>
            <CustomDatePicker
              value={moveInDate}
              onChange={setMoveInDate}
              minDate={new Date().toISOString().split("T")[0]}
              placeholder="Select target move-in date"
              required
            />
          </div>

          {/* Optional custom headline */}
          <div>
            <label className="block text-xs font-bold text-zinc-800 mb-1.5">
              Headline / Title <span className="text-zinc-400 font-normal">(Optional)</span>
            </label>
            <input
              type="text"
              value={customTitle}
              onChange={(e) => setCustomTitle(e.target.value)}
              placeholder={
                activePG
                  ? `Roommate needed for ${activePG.roomTypeName} at ${activePG.propertyName}`
                  : "Looking for 1 roommate..."
              }
              className="w-full h-[42px] rounded-xl border border-zinc-200 bg-zinc-50 px-3.5 text-xs font-medium text-zinc-900 placeholder:text-zinc-400 focus:bg-white focus:outline-none focus:border-violet-500"
            />
          </div>
        </div>

        {/* Required: Short About You / Description */}
        <div>
          <label className="block text-xs font-bold text-zinc-800 mb-1.5">
            About You & Ideal Flatmate <span className="text-rose-500">*</span>
          </label>
          <textarea
            required
            rows={4}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Share a short bio: what you do, your typical daily routine, whether you prefer a quiet study/work vibe, and what kind of flatmate you'd enjoy living with..."
            className="w-full rounded-xl border border-zinc-200 bg-zinc-50 p-3.5 text-xs font-medium text-zinc-900 placeholder:text-zinc-400 focus:bg-white focus:outline-none focus:border-violet-500"
          />
        </div>

        {/* 3. LIFESTYLE PREFERENCES (Using existing Prisma Enums) */}
        <div className="border-t border-zinc-100 pt-6 space-y-4">
          <h4 className="text-sm font-bold text-zinc-950">
            Lifestyle & Living Habits
          </h4>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* Dietary */}
            <div>
              <label className="flex items-center gap-1.5 text-xs font-semibold text-zinc-700 mb-1.5">
                <Utensils className="h-3.5 w-3.5 text-emerald-600" />
                <span>Dietary Preference</span>
              </label>
              <CustomSelect
                value={dietary}
                onChange={(val) => setDietary(val as DietaryPreference)}
                options={DIETARY_OPTIONS}
              />
            </div>

            {/* Smoking */}
            <div>
              <label className="flex items-center gap-1.5 text-xs font-semibold text-zinc-700 mb-1.5">
                <Cigarette className="h-3.5 w-3.5 text-rose-500" />
                <span>Smoking Habit</span>
              </label>
              <CustomSelect
                value={smoking}
                onChange={(val) => setSmoking(val as SmokingPreference)}
                options={SMOKING_OPTIONS}
              />
            </div>

            {/* Drinking */}
            <div>
              <label className="flex items-center gap-1.5 text-xs font-semibold text-zinc-700 mb-1.5">
                <Wine className="h-3.5 w-3.5 text-purple-500" />
                <span>Drinking Habit</span>
              </label>
              <CustomSelect
                value={drinking}
                onChange={(val) => setDrinking(val as DrinkingPreference)}
                options={DRINKING_OPTIONS}
              />
            </div>

            {/* Occupation */}
            <div>
              <label className="flex items-center gap-1.5 text-xs font-semibold text-zinc-700 mb-1.5">
                <Briefcase className="h-3.5 w-3.5 text-blue-600" />
                <span>Occupation Preference</span>
              </label>
              <CustomSelect
                value={occupation}
                onChange={(val) => setOccupation(val as OccupationPreference)}
                options={OCCUPATION_OPTIONS}
              />
            </div>

            {/* Sleep Schedule */}
            <div>
              <label className="flex items-center gap-1.5 text-xs font-semibold text-zinc-700 mb-1.5">
                <Moon className="h-3.5 w-3.5 text-indigo-500" />
                <span>Sleep Schedule</span>
              </label>
              <CustomSelect
                value={sleepSchedule}
                onChange={(val) => setSleepSchedule(val as SleepSchedule)}
                options={SLEEP_SCHEDULE_OPTIONS}
              />
            </div>

            {/* Pet Policy */}
            <div>
              <label className="flex items-center gap-1.5 text-xs font-semibold text-zinc-700 mb-1.5">
                <PawPrint className="h-3.5 w-3.5 text-amber-600" />
                <span>Pet Policy</span>
              </label>
              <CustomSelect
                value={petsAllowed ? "true" : "false"}
                onChange={(val) => setPetsAllowed(val === "true")}
                options={PET_OPTIONS}
              />
            </div>
          </div>
        </div>

        {/* Optional Tags */}
        <div className="border-t border-zinc-100 pt-6">
          <label className="block text-xs font-bold text-zinc-800 mb-2">
            Personal Tags & Interests <span className="text-zinc-400 font-normal">(Optional)</span>
          </label>
          <div className="flex flex-wrap gap-2 mb-3">
            {customTags.map((tag) => (
              <span
                key={tag}
                className="inline-flex items-center gap-1 rounded-full bg-violet-50 border border-violet-200 px-3 py-1 text-xs font-medium text-violet-700"
              >
                <span>{tag}</span>
                <button
                  type="button"
                  onClick={() => removeTag(tag)}
                  className="hover:text-rose-600 text-violet-400"
                >
                  <X className="h-3 w-3" />
                </button>
              </span>
            ))}
          </div>
          <div className="flex gap-2 max-w-sm">
            <input
              type="text"
              value={tagInput}
              onChange={(e) => setTagInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  addTag();
                }
              }}
              placeholder="e.g. Gym, Quiet, Techie..."
              className="flex-1 rounded-xl border border-zinc-200 bg-zinc-50 px-3 py-2 text-xs font-medium text-zinc-800 focus:bg-white focus:outline-none focus:border-violet-500"
            />
            <button
              type="button"
              onClick={addTag}
              className="rounded-xl border border-zinc-200 bg-zinc-100 px-3 py-2 text-xs font-bold text-zinc-700 hover:bg-zinc-200 transition-colors"
            >
              Add Tag
            </button>
          </div>
        </div>

        {/* Submission CTA */}
        <div className="pt-4 border-t border-zinc-100 flex items-center justify-between">
          <Link
            href={activePG?.propertySlug ? `/property/${activePG.propertySlug}` : "/roommates"}
            className="text-xs font-semibold text-zinc-500 hover:text-zinc-800"
          >
            Cancel
          </Link>

          <button
            type="submit"
            disabled={isSubmitting || !activePG}
            className="inline-flex items-center gap-2 rounded-xl bg-violet-600 px-6 py-3 text-xs sm:text-sm font-bold text-white shadow-md shadow-violet-200 hover:bg-violet-700 disabled:opacity-50 cursor-pointer active:scale-95 transition-all"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>Posting Requirement...</span>
              </>
            ) : (
              <>
                <span>Post Roommate Requirement</span>
                <ArrowRight className="h-4 w-4" />
              </>
            )}
          </button>
        </div>
      </div>
    </form>
  );
}
