"use client";

import { useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import {
  Building2,
  CheckCircle2,
  ChevronRight,
  ChevronLeft,
  Sparkles,
  BedDouble,
  ShieldCheck,
  Utensils,
  Plus,
  Trash2,
  AlertCircle,
  Clock,
  MapPin,
  Phone,
  BadgeCheck,
  X,
  Send,
  Loader2,
  UploadCloud,
  Star,
  Camera,
  Image as ImageIcon,
} from "lucide-react";
import {
  createPropertyAction,
  registerOwnerAction,
  requestOwnerLocalityAction,
  type CreatePropertyInput,
  type InitialRoomTypeInput,
} from "@/actions/owner";
import { GenderPolicy, FoodOffering, PropertyType, PropertyStatus } from "@/lib/enums";
import { LocationPickerMap } from "@/components/map/LocationPickerMap";
import { CITY_COORDINATES } from "@/components/map/PropertyMap";
import { uploadPropertyImageDirectAction } from "@/actions/upload";
import { ImageType } from "@/lib/prisma";

export interface PendingPropertyPhoto {
  id: string;
  file: File;
  previewUrl: string;
  imageType: ImageType;
  isCover: boolean;
}

const PHOTO_CATEGORIES: Array<{ key: ImageType; label: string }> = [
  { key: "FACADE" as ImageType, label: "Building Exterior / Facade" },
  { key: "BEDROOM" as ImageType, label: "Bedroom & Bed Layout" },
  { key: "COMMON_AREA" as ImageType, label: "Common Area & Reception" },
  { key: "WASHROOM" as ImageType, label: "Washroom & Bathroom" },
  { key: "DINING" as ImageType, label: "Dining Area & Kitchen" },
  { key: "BALCONY" as ImageType, label: "Balcony & Views" },
  { key: "OTHER" as ImageType, label: "Other Facilities" },
];

interface AmenityItem {
  id: string;
  name: string;
  category: string;
  icon?: string | null;
}

export interface StateOption {
  id: string;
  name: string;
  code?: string | null;
  cities: Array<{
    id: string;
    name: string;
    localities: Array<{
      id: string;
      name: string;
      postalCode?: string | null;
      latitude?: number | null;
      longitude?: number | null;
    }>;
  }>;
}

interface OnboardingWizardProps {
  initialOwnerProfile: {
    id: string;
    businessName: string | null;
    contactPhone: string;
    whatsappNumber: string | null;
    altPhone?: string | null;
  } | null;
  amenities: AmenityItem[];
  userEmail?: string | null;
  locationMaster?: StateOption[];
}

const DEFAULT_HOUSE_RULES = [
  "No smoking in common areas",
  "Quiet hours after 10:30 PM",
  "Guests allowed until 8:00 PM",
  "No loud parties inside rooms",
  "Valid ID required at move-in",
];

export function OnboardingWizard({
  initialOwnerProfile,
  amenities,
  locationMaster = [],
}: OnboardingWizardProps) {
  const router = useRouter();

  // Wizard state: 1 (Owner), 2 (Property & Rules), 3 (Room Types & Inventory), 4 (Review)
  const [currentStep, setCurrentStep] = useState<number>(initialOwnerProfile?.contactPhone ? 2 : 1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Step 1: Owner Details (No govt ID - access verified via admin invite)
  const [businessName, setBusinessName] = useState(initialOwnerProfile?.businessName || "");
  const [contactPhone, setContactPhone] = useState(initialOwnerProfile?.contactPhone || "");
  const [whatsappNumber, setWhatsappNumber] = useState(
    initialOwnerProfile?.whatsappNumber || initialOwnerProfile?.contactPhone || ""
  );
  const [altPhone, setAltPhone] = useState(initialOwnerProfile?.altPhone || "");

  // Master Location Derived Defaults
  const defaultState = locationMaster.length > 0 ? locationMaster[0].name : "Punjab";
  const defaultCities = locationMaster.find((s) => s.name === defaultState)?.cities || [];
  const defaultCity = defaultCities.length > 0 ? defaultCities[0].name : "Jalandhar";
  const defaultLocalities = defaultCities.find((c) => c.name === defaultCity)?.localities || [];
  const defaultLocality = defaultLocalities.length > 0 ? defaultLocalities[0].name : "";

  const initialLat =
    defaultLocalities[0]?.latitude ||
    (CITY_COORDINATES[defaultCity] ? CITY_COORDINATES[defaultCity][1] : 31.326);
  const initialLng =
    defaultLocalities[0]?.longitude ||
    (CITY_COORDINATES[defaultCity] ? CITY_COORDINATES[defaultCity][0] : 75.5762);

  // Step 2: Property Details
  const [name, setName] = useState("");
  const [propertyType, setPropertyType] = useState<PropertyType>(PropertyType.PG);
  const [genderPolicy, setGenderPolicy] = useState<GenderPolicy>(GenderPolicy.UNISEX);
  const [description, setDescription] = useState("");
  const [addressLine1, setAddressLine1] = useState("");
  const [addressLine2, setAddressLine2] = useState("");
  const [state, setState] = useState(defaultState);
  const [city, setCity] = useState(defaultCity);
  const [locality, setLocality] = useState(defaultLocality);
  const [postalCode, setPostalCode] = useState("560001");
  const [latitude, setLatitude] = useState<number>(initialLat);
  const [longitude, setLongitude] = useState<number>(initialLng);
  const [gateClosingTime, setGateClosingTime] = useState("11:00 PM");
  const [noticePeriodDays, setNoticePeriodDays] = useState(30);
  const [foodOffering, setFoodOffering] = useState<FoodOffering>(FoodOffering.VEG_NONVEG);
  const [foodIncluded, setFoodIncluded] = useState(true);

  // Property Photos State (Upload during creation)
  const [propertyPhotos, setPropertyPhotos] = useState<PendingPropertyPhoto[]>([]);
  const [uploadStatusText, setUploadStatusText] = useState<string | null>(null);

  // Request Locality Modal State
  const [isLocalityModalOpen, setIsLocalityModalOpen] = useState(false);
  const [reqLocalityName, setReqLocalityName] = useState("");
  const [reqLocalityReason, setReqLocalityReason] = useState("");
  const [isSubmittingReq, setIsSubmittingReq] = useState(false);
  const [localitySuccessMsg, setLocalitySuccessMsg] = useState<string | null>(null);
  const [selectedAmenities, setSelectedAmenities] = useState<string[]>(
    amenities.slice(0, 5).map((a) => a.id)
  );
  const [houseRules, setHouseRules] = useState<string[]>(DEFAULT_HOUSE_RULES);
  const [customRule, setCustomRule] = useState("");

  const handlePhotoFilesSelected = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const validTypes = ["image/jpeg", "image/png", "image/webp", "image/avif"];
    const addedPhotos: PendingPropertyPhoto[] = [];

    Array.from(files).forEach((file) => {
      if (!validTypes.includes(file.type)) {
        setErrorMsg(`Unsupported image format for "${file.name}". Please select JPG, PNG, or WebP.`);
        return;
      }
      if (file.size > 10 * 1024 * 1024) {
        setErrorMsg(`File "${file.name}" exceeds 10MB limit.`);
        return;
      }

      const previewUrl = URL.createObjectURL(file);
      const isFirst = propertyPhotos.length === 0 && addedPhotos.length === 0;

      addedPhotos.push({
        id: crypto.randomUUID(),
        file,
        previewUrl,
        imageType: isFirst ? ("FACADE" as ImageType) : ("BEDROOM" as ImageType),
        isCover: isFirst,
      });
    });

    if (addedPhotos.length > 0) {
      setPropertyPhotos((prev) => [...prev, ...addedPhotos]);
      setErrorMsg(null);
    }
    e.target.value = "";
  };

  const handleRemovePhoto = (id: string) => {
    setPropertyPhotos((prev) => {
      const removed = prev.find((p) => p.id === id);
      if (removed) URL.revokeObjectURL(removed.previewUrl);
      const remaining = prev.filter((p) => p.id !== id);
      if (removed?.isCover && remaining.length > 0) {
        remaining[0].isCover = true;
      }
      return remaining;
    });
  };

  const handleSetCoverPhoto = (id: string) => {
    setPropertyPhotos((prev) =>
      prev.map((p) => ({
        ...p,
        isCover: p.id === id,
      }))
    );
  };

  const handleSetPhotoType = (id: string, imageType: ImageType) => {
    setPropertyPhotos((prev) =>
      prev.map((p) => (p.id === id ? { ...p, imageType } : p))
    );
  };

  // Step 3: Room Types & Initial Rooms Inventory
  const [roomTypes, setRoomTypes] = useState<InitialRoomTypeInput[]>([
    {
      name: "2-Seater AC",
      occupancy: 2,
      monthlyRent: 11500,
      securityDeposit: 23000,
      maintenanceCharges: 0,
      foodCharges: 0,
      hasAttachedBathroom: true,
      hasBalcony: false,
      hasAirConditioning: true,
      genderRestriction: GenderPolicy.UNISEX,
      initialRoomsCount: 4,
      startRoomNumber: 101,
      floor: 1,
    },
    {
      name: "Private Single AC",
      occupancy: 1,
      monthlyRent: 18000,
      securityDeposit: 36000,
      maintenanceCharges: 0,
      foodCharges: 0,
      hasAttachedBathroom: true,
      hasBalcony: true,
      hasAirConditioning: true,
      genderRestriction: GenderPolicy.UNISEX,
      initialRoomsCount: 2,
      startRoomNumber: 201,
      floor: 2,
    },
  ]);

  // Validation helpers
  const validateStep1 = () => {
    if (!contactPhone || contactPhone.trim().length < 10) {
      setErrorMsg("Please provide a valid 10-digit primary phone number.");
      return false;
    }
    setErrorMsg(null);
    return true;
  };

  const validateStep2 = () => {
    if (!name || name.trim().length < 3) {
      setErrorMsg("Please enter a property name (at least 3 characters).");
      return false;
    }
    if (!locality || !addressLine1) {
      setErrorMsg("Address and locality are required.");
      return false;
    }
    if (!description || description.trim().length < 10) {
      setErrorMsg("Please add a brief description of the property (at least 10 characters).");
      return false;
    }
    setErrorMsg(null);
    return true;
  };

  const validateStep3 = () => {
    if (roomTypes.length === 0) {
      setErrorMsg("Please configure at least one Room Type.");
      return false;
    }
    for (const rt of roomTypes) {
      if (!rt.name || rt.monthlyRent <= 0 || rt.occupancy < 1) {
        setErrorMsg("All Room Types must have a valid name, rent, and capacity.");
        return false;
      }
    }
    setErrorMsg(null);
    return true;
  };

  const handleNext = async () => {
    setErrorMsg(null);
    if (currentStep === 1) {
      if (!validateStep1()) return;
      setIsSubmitting(true);
      const res = await registerOwnerAction({
        businessName,
        contactPhone,
        whatsappNumber: whatsappNumber || contactPhone,
        altPhone: altPhone || undefined,
      });
      setIsSubmitting(false);
      if (!res.success) {
        setErrorMsg(res.error || "Failed to save owner profile.");
        return;
      }
      setCurrentStep(2);
    } else if (currentStep === 2) {
      if (!validateStep2()) return;
      setCurrentStep(3);
    } else if (currentStep === 3) {
      if (!validateStep3()) return;
      setCurrentStep(4);
    }
  };

  const handlePrev = () => {
    setErrorMsg(null);
    setCurrentStep((prev) => Math.max(1, prev - 1));
  };

  // Add a new Room Type template
  const handleAddRoomType = () => {
    const nextStart = (roomTypes.length + 1) * 100 + 1;
    setRoomTypes([
      ...roomTypes,
      {
        name: `3-Seater Regular`,
        occupancy: 3,
        monthlyRent: 8500,
        securityDeposit: 17000,
        maintenanceCharges: 0,
        foodCharges: 0,
        hasAttachedBathroom: true,
        hasBalcony: false,
        hasAirConditioning: false,
        genderRestriction: genderPolicy,
        initialRoomsCount: 3,
        startRoomNumber: nextStart,
        floor: roomTypes.length + 1,
      },
    ]);
  };

  const handleRemoveRoomType = (idx: number) => {
    if (roomTypes.length <= 1) {
      setErrorMsg("At least one room type must remain.");
      return;
    }
    setRoomTypes(roomTypes.filter((_, i) => i !== idx));
  };

  const handleUpdateRoomType = (idx: number, field: string, val: unknown) => {
    setRoomTypes(
      roomTypes.map((rt, i) => (i === idx ? { ...rt, [field]: val } : rt))
    );
  };

  const toggleAmenity = (id: string) => {
    setSelectedAmenities((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const addHouseRule = () => {
    if (customRule.trim()) {
      setHouseRules([...houseRules, customRule.trim()]);
      setCustomRule("");
    }
  };

  const removeHouseRule = (rule: string) => {
    setHouseRules(houseRules.filter((r) => r !== rule));
  };

  // Final submission
  const handleSubmit = async (publishImmediately: boolean) => {
    setIsSubmitting(true);
    setErrorMsg(null);
    setUploadStatusText(null);

    const payload: CreatePropertyInput = {
      name,
      propertyType,
      genderPolicy,
      description,
      addressLine1,
      addressLine2: addressLine2 || undefined,
      locality,
      city,
      state,
      postalCode,
      latitude,
      longitude,
      contactPhone: contactPhone,
      whatsappNumber: whatsappNumber || contactPhone,
      gateClosingTime,
      noticePeriodDays,
      houseRules,
      foodIncluded: foodOffering === FoodOffering.NO_FOOD ? false : foodIncluded,
      foodOffering,
      amenityIds: selectedAmenities,
      roomTypes,
      status: publishImmediately ? PropertyStatus.PUBLISHED : PropertyStatus.DRAFT,
    };

    const res = await createPropertyAction(payload);

    if (!res.success || !res.propertyId) {
      setIsSubmitting(false);
      setErrorMsg(res.error || "Failed to create property. Please verify your details.");
      return;
    }

    // Upload photos selected during property creation
    if (propertyPhotos.length > 0) {
      for (let i = 0; i < propertyPhotos.length; i++) {
        const photo = propertyPhotos[i];
        setUploadStatusText(`Uploading property photo ${i + 1} of ${propertyPhotos.length}...`);
        try {
          const fd = new FormData();
          fd.append("propertyId", res.propertyId);
          fd.append("file", photo.file);
          fd.append("imageType", photo.imageType);
          fd.append("isCover", String(photo.isCover));
          fd.append("altText", `${name} ${photo.imageType.toLowerCase()}`);
          await uploadPropertyImageDirectAction(fd);
        } catch (uploadErr) {
          console.warn(`Failed to upload photo ${i + 1}:`, uploadErr);
        }
      }
    }

    setIsSubmitting(false);
    // Success! Redirect directly to the room inventory management page
    router.push(`/owner/properties/${res.propertyId}/rooms?created=true`);
  };

  // Calculate summary counts
  const totalBedsProvisioned = roomTypes.reduce(
    (acc, rt) => acc + rt.occupancy * rt.initialRoomsCount,
    0
  );
  const totalRoomsProvisioned = roomTypes.reduce(
    (acc, rt) => acc + rt.initialRoomsCount,
    0
  );

  return (
    <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 py-8">
      {/* Wizard Header & Progress Tabs */}
      <div className="mb-8 flex items-start gap-4">
        <div className="relative flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl overflow-hidden bg-white shadow-xs border border-[#E8EAE5] p-1 mt-0.5">
          <Image
            src="/logo.png"
            alt="StayKro Logo"
            width={44}
            height={44}
            className="h-full w-full object-contain"
          />
        </div>
        <div>
          <div className="inline-flex items-center gap-1.5 rounded-full bg-[#eff4ec] border border-[#96BF8A]/40 px-3 py-0.5 text-xs font-bold text-[#00412E] mb-1.5">
            <Sparkles className="h-3 w-3 text-[#00412E]" />
            <span>PG Owner Onboarding</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-zinc-950">
            List Your Property on StayKro
          </h1>
          <p className="mt-1 text-xs sm:text-sm text-zinc-500">
            Complete these 4 simple steps to set up your PG and auto-provision your room inventory.
          </p>
        </div>
      </div>

      {/* Stepper Progress Bar */}
      <div className="mb-8 grid grid-cols-4 gap-2 border-b border-zinc-200 pb-4 text-xs font-semibold">
        {[
          { step: 1, title: "1. Owner Profile" },
          { step: 2, title: "2. Property & Rules" },
          { step: 3, title: "3. Rooms & Inventory" },
          { step: 4, title: "4. Review & Launch" },
        ].map((item) => (
          <div
            key={item.step}
            className={`flex items-center gap-2 pb-2 transition-colors ${
              currentStep === item.step
                ? "border-b-2 border-indigo-600 text-indigo-600 font-bold"
                : currentStep > item.step
                ? "border-b-2 border-emerald-500 text-emerald-600"
                : "text-zinc-600"
            }`}
          >
            <span
              className={`flex h-5 w-5 items-center justify-center rounded-full text-[10px] ${
                currentStep === item.step
                  ? "bg-indigo-600 text-white font-black"
                  : currentStep > item.step
                  ? "bg-emerald-500 text-white font-bold"
                  : "bg-zinc-200 text-zinc-700"
              }`}
            >
              {currentStep > item.step ? "✓" : item.step}
            </span>
            <span className="hidden sm:inline">{item.title}</span>
          </div>
        ))}
      </div>

      {/* Error Banner */}
      {errorMsg && (
        <div className="mb-6 flex items-start gap-3 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-800">
          <AlertCircle className="h-5 w-5 shrink-0 text-red-600 mt-0.5" />
          <div className="flex-1 font-medium">{errorMsg}</div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* STEP 1: OWNER PROFILE */}
      {/* ========================================================================= */}
      {currentStep === 1 && (
        <div className="rounded-3xl border border-zinc-200 bg-white p-6 sm:p-8 shadow-sm space-y-6">
          <div className="border-b border-zinc-100 pb-4">
            <h2 className="text-lg font-bold text-zinc-900 flex items-center gap-2">
              <ShieldCheck className="h-5 w-5 text-indigo-600" />
              <span>Step 1: Owner Profile & Direct Tenant Contact</span>
            </h2>
            <p className="mt-1 text-xs text-zinc-600">
              Tenants will contact you directly on these numbers. You can also receive WhatsApp enquiries.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-zinc-700 mb-1.5">
                Business / Entity Name (Optional)
              </label>
              <input
                type="text"
                placeholder="e.g. Sunrise Living Spaces"
                value={businessName}
                onChange={(e) => setBusinessName(e.target.value)}
                className="w-full rounded-xl border border-zinc-200 bg-zinc-50 px-3.5 py-2.5 text-sm font-medium text-zinc-900 focus:bg-white focus:border-indigo-600 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-zinc-700 mb-1.5">
                Primary Contact Phone * (10 digits)
              </label>
              <input
                type="tel"
                placeholder="e.g. 9876543210"
                value={contactPhone}
                onChange={(e) => setContactPhone(e.target.value)}
                className="w-full rounded-xl border border-zinc-200 bg-zinc-50 px-3.5 py-2.5 text-sm font-medium text-zinc-900 focus:bg-white focus:border-indigo-600 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-zinc-700 mb-1.5">
                WhatsApp Number (For Direct Tenant Chat)
              </label>
              <input
                type="tel"
                placeholder="e.g. 9876543210"
                value={whatsappNumber}
                onChange={(e) => setWhatsappNumber(e.target.value)}
                className="w-full rounded-xl border border-zinc-200 bg-zinc-50 px-3.5 py-2.5 text-sm font-medium text-zinc-900 focus:bg-white focus:border-indigo-600 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-zinc-700 mb-1.5">
                Alternate Phone (Optional)
              </label>
              <input
                type="tel"
                placeholder="e.g. 9876543211"
                value={altPhone}
                onChange={(e) => setAltPhone(e.target.value)}
                className="w-full rounded-xl border border-zinc-200 bg-zinc-50 px-3.5 py-2.5 text-sm font-medium text-zinc-900 focus:bg-white focus:border-indigo-600 focus:outline-none"
              />
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* STEP 2: PROPERTY BASIC DETAILS, RULES & AMENITIES */}
      {/* ========================================================================= */}
      {currentStep === 2 && (
        <div className="rounded-3xl border border-zinc-200 bg-white p-6 sm:p-8 shadow-sm space-y-6">
          <div className="border-b border-zinc-100 pb-4">
            <h2 className="text-lg font-bold text-zinc-900 flex items-center gap-2">
              <Building2 className="h-5 w-5 text-indigo-600" />
              <span>Step 2: Property Details, Location & Amenities</span>
            </h2>
            <p className="mt-1 text-xs text-zinc-600">
              Provide accurate location, food policies, and house rules for prospective tenants.
            </p>
          </div>

          {/* Property Name, Type & Gender Policy */}
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-5">
            <div className="sm:col-span-2">
              <label className="block text-xs font-bold uppercase tracking-wider text-zinc-700 mb-1.5">
                Property Name *
              </label>
              <input
                type="text"
                placeholder="e.g. Sunrise Luxury Coliving"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full rounded-xl border border-zinc-200 bg-zinc-50 px-3.5 py-2.5 text-sm font-medium text-zinc-900 focus:bg-white focus:border-indigo-600 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-zinc-700 mb-1.5">
                Property Type *
              </label>
              <select
                value={propertyType}
                onChange={(e) => setPropertyType(e.target.value as PropertyType)}
                className="w-full rounded-xl border border-zinc-200 bg-zinc-50 px-3.5 py-2.5 text-sm font-medium text-zinc-900 focus:bg-white focus:border-indigo-600 focus:outline-none"
              >
                <option value={PropertyType.PG}>Paying Guest (PG)</option>
                <option value={PropertyType.COLIVING}>Co-living Space</option>
                <option value={PropertyType.HOSTEL}>Student Hostel</option>
                <option value={PropertyType.APARTMENT}>Shared Flat</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-zinc-700 mb-1.5">
                Gender Policy *
              </label>
              <select
                value={genderPolicy}
                onChange={(e) => setGenderPolicy(e.target.value as GenderPolicy)}
                className="w-full rounded-xl border border-zinc-200 bg-zinc-50 px-3.5 py-2.5 text-sm font-medium text-zinc-900 focus:bg-white focus:border-indigo-600 focus:outline-none"
              >
                <option value={GenderPolicy.UNISEX}>Unisex / Coliving</option>
                <option value={GenderPolicy.BOYS}>Boys Only</option>
                <option value={GenderPolicy.GIRLS}>Girls Only</option>
              </select>
            </div>
          </div>

          {/* Location Fields: State -> City -> Locality from Master Data */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-zinc-700 mb-1.5">
                State *
              </label>
              <select
                value={state}
                onChange={(e) => {
                  const newState = e.target.value;
                  setState(newState);
                  const sObj = locationMaster.find((s) => s.name === newState);
                  const firstCity = sObj?.cities?.[0]?.name || "Jalandhar";
                  setCity(firstCity);
                  const cObj = sObj?.cities?.find((c) => c.name === firstCity);
                  const firstLoc = cObj?.localities?.[0];
                  setLocality(firstLoc?.name || "");
                  if (firstLoc?.latitude && firstLoc?.longitude) {
                    setLatitude(firstLoc.latitude);
                    setLongitude(firstLoc.longitude);
                  } else if (CITY_COORDINATES[firstCity]) {
                    setLatitude(CITY_COORDINATES[firstCity][1]);
                    setLongitude(CITY_COORDINATES[firstCity][0]);
                  }
                }}
                className="w-full rounded-xl border border-zinc-200 bg-zinc-50 px-3.5 py-2.5 text-sm font-medium text-zinc-900 focus:bg-white focus:border-indigo-600 focus:outline-none"
              >
                {locationMaster.length > 0 ? (
                  locationMaster.map((s) => (
                    <option key={s.id} value={s.name}>
                      {s.name}
                    </option>
                  ))
                ) : (
                  <>
                    <option value="Punjab">Punjab</option>
                    <option value="Maharashtra">Maharashtra</option>
                    <option value="Telangana">Telangana</option>
                    <option value="Haryana">Haryana</option>
                  </>
                )}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-zinc-700 mb-1.5">
                City *
              </label>
              <select
                value={city}
                onChange={(e) => {
                  const newCity = e.target.value;
                  setCity(newCity);
                  const sObj = locationMaster.find((s) => s.name === state);
                  const cObj = sObj?.cities?.find((c) => c.name === newCity);
                  const firstLoc = cObj?.localities?.[0];
                  setLocality(firstLoc?.name || "");
                  if (firstLoc?.latitude && firstLoc?.longitude) {
                    setLatitude(firstLoc.latitude);
                    setLongitude(firstLoc.longitude);
                  } else if (CITY_COORDINATES[newCity]) {
                    setLatitude(CITY_COORDINATES[newCity][1]);
                    setLongitude(CITY_COORDINATES[newCity][0]);
                  }
                }}
                className="w-full rounded-xl border border-zinc-200 bg-zinc-50 px-3.5 py-2.5 text-sm font-medium text-zinc-900 focus:bg-white focus:border-indigo-600 focus:outline-none"
              >
                {(() => {
                  const sObj = locationMaster.find((s) => s.name === state);
                  const citiesList = sObj?.cities || [];
                  return citiesList.map((c) => (
                    <option key={c.id} value={c.name}>
                      {c.name}
                    </option>
                  ));
                })()}
              </select>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-bold uppercase tracking-wider text-zinc-700">
                  Locality / Area *
                </label>
                <button
                  type="button"
                  onClick={() => setIsLocalityModalOpen(true)}
                  className="text-[11px] font-bold text-indigo-600 hover:text-indigo-700"
                >
                  + Request Missing
                </button>
              </div>

              {(() => {
                const sObj = locationMaster.find((s) => s.name === state);
                const cObj = sObj?.cities?.find((c) => c.name === city);
                const localitiesList = cObj?.localities || [];

                if (localitiesList.length > 0) {
                  return (
                    <select
                      value={locality}
                      onChange={(e) => {
                        const locName = e.target.value;
                        setLocality(locName);
                        const matchedLoc = localitiesList.find((l) => l.name === locName);
                        if (matchedLoc?.postalCode) {
                          setPostalCode(matchedLoc.postalCode);
                        }
                        if (matchedLoc?.latitude && matchedLoc?.longitude) {
                          setLatitude(matchedLoc.latitude);
                          setLongitude(matchedLoc.longitude);
                        }
                      }}
                      className="w-full rounded-xl border border-zinc-200 bg-zinc-50 px-3.5 py-2.5 text-sm font-medium text-zinc-900 focus:bg-white focus:border-indigo-600 focus:outline-none"
                    >
                      <option value="">Select Locality...</option>
                      {localitiesList.map((loc) => (
                        <option key={loc.id} value={loc.name}>
                          {loc.name} {loc.postalCode ? `(${loc.postalCode})` : ""}
                        </option>
                      ))}
                    </select>
                  );
                }

                return (
                  <input
                    type="text"
                    placeholder="e.g. Koramangala 4th Block"
                    value={locality}
                    onChange={(e) => setLocality(e.target.value)}
                    className="w-full rounded-xl border border-zinc-200 bg-zinc-50 px-3.5 py-2.5 text-sm font-medium text-zinc-900 focus:bg-white focus:border-indigo-600 focus:outline-none"
                  />
                );
              })()}
            </div>

            {localitySuccessMsg && (
              <div className="sm:col-span-3 flex items-center gap-2 rounded-xl bg-emerald-50 border border-emerald-200 p-3 text-xs text-emerald-700">
                <CheckCircle2 className="h-4 w-4 shrink-0" />
                <span>{localitySuccessMsg}</span>
              </div>
            )}

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-zinc-700 mb-1.5">
                Street Address Line 1 *
              </label>
              <input
                type="text"
                placeholder="Building No, Street, Landmark"
                value={addressLine1}
                onChange={(e) => setAddressLine1(e.target.value)}
                className="w-full rounded-xl border border-zinc-200 bg-zinc-50 px-3.5 py-2.5 text-sm font-medium text-zinc-900 focus:bg-white focus:border-indigo-600 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-zinc-700 mb-1.5">
                Address Line 2 (Optional)
              </label>
              <input
                type="text"
                placeholder="Floor, Wing, Flat / Tower"
                value={addressLine2}
                onChange={(e) => setAddressLine2(e.target.value)}
                className="w-full rounded-xl border border-zinc-200 bg-zinc-50 px-3.5 py-2.5 text-sm font-medium text-zinc-900 focus:bg-white focus:border-indigo-600 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-zinc-700 mb-1.5">
                PIN Code *
              </label>
              <input
                type="text"
                placeholder="e.g. 560034"
                value={postalCode}
                onChange={(e) => setPostalCode(e.target.value)}
                className="w-full rounded-xl border border-zinc-200 bg-zinc-50 px-3.5 py-2.5 text-sm font-medium text-zinc-900 focus:bg-white focus:border-indigo-600 focus:outline-none"
              />
            </div>
          </div>

          {/* Interactive Map Pinning */}
          <div className="border-t border-zinc-100 pt-5">
            <div className="mb-2">
              <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-700">
                Pin Property Location on Map *
              </h3>
              <p className="text-[11px] text-zinc-500 mt-0.5">
                Click anywhere on the map or drag the pin to mark your PG&apos;s exact entrance for prospective tenants.
              </p>
            </div>
            <LocationPickerMap
              latitude={latitude}
              longitude={longitude}
              onChange={({ latitude, longitude }) => {
                setLatitude(latitude);
                setLongitude(longitude);
              }}
              city={city}
              locality={locality}
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-zinc-700 mb-1.5">
              Property Description *
            </label>
            <textarea
              rows={3}
              placeholder="Describe your PG, surrounding vibe, proximity to tech parks and metro stations..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full rounded-xl border border-zinc-200 bg-zinc-50 px-3.5 py-2.5 text-sm font-medium text-zinc-900 focus:bg-white focus:border-indigo-600 focus:outline-none"
            />
          </div>

          {/* Food & Curfew Policies */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 border-t border-zinc-100 pt-5">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-zinc-700 mb-1.5">
                Food Offering
              </label>
              <select
                value={foodOffering}
                onChange={(e) => {
                  const val = e.target.value as FoodOffering;
                  setFoodOffering(val);
                  if (val === FoodOffering.NO_FOOD) {
                    setFoodIncluded(false);
                  }
                }}
                className="w-full rounded-xl border border-zinc-200 bg-zinc-50 px-3.5 py-2.5 text-sm font-medium text-zinc-900 focus:bg-white focus:border-indigo-600 focus:outline-none"
              >
                <option value={FoodOffering.VEG_NONVEG}>Veg & Non-Veg Meals</option>
                <option value={FoodOffering.VEG_ONLY}>Pure Veg Only</option>
                <option value={FoodOffering.OPTIONAL}>Optional / Paid Mess</option>
                <option value={FoodOffering.NO_FOOD}>Self Cooking / No Food</option>
              </select>
              <label
                className={`flex items-center gap-2 text-xs font-semibold mt-2 ${
                  foodOffering === FoodOffering.NO_FOOD
                    ? "text-zinc-400 cursor-not-allowed"
                    : "text-zinc-700 cursor-pointer"
                }`}
              >
                <input
                  type="checkbox"
                  checked={foodOffering === FoodOffering.NO_FOOD ? false : foodIncluded}
                  disabled={foodOffering === FoodOffering.NO_FOOD}
                  onChange={(e) => setFoodIncluded(e.target.checked)}
                  className="rounded text-indigo-600 disabled:opacity-50"
                />
                <span>Food included in monthly rent</span>
              </label>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-zinc-700 mb-1.5">
                Gate Curfew / Closing Time
              </label>
              <input
                type="text"
                placeholder="e.g. 11:00 PM or No Curfew"
                value={gateClosingTime}
                onChange={(e) => setGateClosingTime(e.target.value)}
                className="w-full rounded-xl border border-zinc-200 bg-zinc-50 px-3.5 py-2.5 text-sm font-medium text-zinc-900 focus:bg-white focus:border-indigo-600 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-zinc-700 mb-1.5">
                Notice Period (Days)
              </label>
              <input
                type="number"
                min="0"
                value={noticePeriodDays}
                onChange={(e) => setNoticePeriodDays(parseInt(e.target.value, 10) || 30)}
                className="w-full rounded-xl border border-zinc-200 bg-zinc-50 px-3.5 py-2.5 text-sm font-medium text-zinc-900 focus:bg-white focus:border-indigo-600 focus:outline-none"
              />
            </div>
          </div>

          {/* Amenities Selector */}
          <div className="border-t border-zinc-100 pt-5">
            <label className="block text-xs font-bold uppercase tracking-wider text-zinc-700 mb-2.5">
              Available Amenities ({selectedAmenities.length} selected)
            </label>
            <div className="flex flex-wrap gap-2">
              {amenities.map((item) => {
                const isSelected = selectedAmenities.includes(item.id);
                return (
                  <button
                    type="button"
                    key={item.id}
                    onClick={() => toggleAmenity(item.id)}
                    className={`flex items-center gap-1.5 rounded-xl px-3.5 py-2 text-xs font-semibold transition-all cursor-pointer ${
                      isSelected
                        ? "bg-indigo-600 text-white shadow-sm shadow-indigo-100"
                        : "border border-zinc-200 bg-zinc-50 text-zinc-700 hover:bg-zinc-100"
                    }`}
                  >
                    <span>{item.name}</span>
                    {isSelected && <CheckCircle2 className="h-3.5 w-3.5 ml-1" />}
                  </button>
                );
              })}
            </div>
          </div>

          {/* House Rules */}
          <div className="border-t border-zinc-100 pt-5">
            <label className="block text-xs font-bold uppercase tracking-wider text-zinc-700 mb-2">
              House Rules
            </label>
            <div className="flex flex-wrap gap-2 mb-3">
              {houseRules.map((rule) => (
                <span
                  key={rule}
                  className="inline-flex items-center gap-1.5 rounded-full bg-zinc-100 border border-zinc-200 px-3 py-1 text-xs font-medium text-zinc-700"
                >
                  <span>{rule}</span>
                  <button
                    type="button"
                    onClick={() => removeHouseRule(rule)}
                    className="text-zinc-600 hover:text-red-500"
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="Add custom rule..."
                value={customRule}
                onChange={(e) => setCustomRule(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addHouseRule())}
                className="flex-1 rounded-xl border border-zinc-200 bg-zinc-50 px-3.5 py-2 text-xs font-medium text-zinc-900 focus:bg-white focus:outline-none"
              />
              <button
                type="button"
                onClick={addHouseRule}
                className="rounded-xl bg-zinc-800 px-3.5 py-2 text-xs font-semibold text-white hover:bg-zinc-700"
              >
                Add Rule
              </button>
            </div>
          </div>

          {/* Property Photos Upload Section */}
          <div className="border-t border-zinc-100 pt-5 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-700 flex items-center gap-1.5">
                  <Camera className="h-4 w-4 text-indigo-600" />
                  <span>Property Photos ({propertyPhotos.length} selected)</span>
                </h3>
                <p className="text-[11px] text-zinc-500 mt-0.5">
                  Upload photos of building facade, bedrooms, bathrooms, and common spaces. Star the cover photo.
                </p>
              </div>

              <label className="inline-flex items-center gap-2 rounded-xl bg-indigo-50 border border-indigo-200 px-3.5 py-2 text-xs font-bold text-indigo-700 hover:bg-indigo-100 cursor-pointer transition-colors self-start sm:self-auto">
                <UploadCloud className="h-4 w-4" />
                <span>Select Photos</span>
                <input
                  type="file"
                  multiple
                  accept="image/jpeg,image/png,image/webp,image/avif"
                  onChange={handlePhotoFilesSelected}
                  className="hidden"
                />
              </label>
            </div>

            {/* Photo Preview Grid */}
            {propertyPhotos.length > 0 ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                {propertyPhotos.map((photo) => (
                  <div
                    key={photo.id}
                    className={`group relative overflow-hidden rounded-2xl border bg-white shadow-2xs transition-all ${
                      photo.isCover ? "border-indigo-600 ring-2 ring-indigo-500/20" : "border-zinc-200"
                    }`}
                  >
                    <div className="relative aspect-4/3 overflow-hidden bg-zinc-100">
                      <img
                        src={photo.previewUrl}
                        alt="Preview"
                        className="h-full w-full object-cover"
                      />
                      <button
                        type="button"
                        onClick={() => handleRemovePhoto(photo.id)}
                        className="absolute top-2 right-2 h-7 w-7 rounded-lg bg-black/60 text-white flex items-center justify-center hover:bg-rose-600 transition-colors cursor-pointer"
                        title="Remove photo"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>

                      <button
                        type="button"
                        onClick={() => handleSetCoverPhoto(photo.id)}
                        className={`absolute top-2 left-2 inline-flex items-center gap-1 rounded-lg px-2 py-1 text-[10px] font-bold transition-all cursor-pointer ${
                          photo.isCover
                            ? "bg-amber-400 text-amber-950 shadow-xs"
                            : "bg-black/60 text-white hover:bg-black/80"
                        }`}
                        title="Set as cover image"
                      >
                        <Star className={`h-3 w-3 ${photo.isCover ? "fill-amber-950" : ""}`} />
                        <span>{photo.isCover ? "Cover" : "Set Cover"}</span>
                      </button>
                    </div>

                    <div className="p-2 border-t border-zinc-100">
                      <select
                        value={photo.imageType}
                        onChange={(e) => handleSetPhotoType(photo.id, e.target.value as ImageType)}
                        className="w-full rounded-lg border border-zinc-200 bg-zinc-50 px-2 py-1 text-[11px] font-medium text-zinc-800 focus:bg-white focus:border-indigo-600 focus:outline-none"
                      >
                        {PHOTO_CATEGORIES.map((cat) => (
                          <option key={cat.key} value={cat.key}>
                            {cat.label}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <label className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-zinc-200 bg-zinc-50/50 p-6 text-center hover:border-indigo-300 hover:bg-indigo-50/20 cursor-pointer transition-colors">
                <UploadCloud className="h-8 w-8 text-zinc-400 mb-2" />
                <p className="text-xs font-bold text-zinc-800">
                  Click to upload photos or drag & drop here
                </p>
                <p className="text-[11px] text-zinc-500 mt-0.5">
                  PNG, JPG, or WebP up to 10MB each
                </p>
                <input
                  type="file"
                  multiple
                  accept="image/jpeg,image/png,image/webp,image/avif"
                  onChange={handlePhotoFilesSelected}
                  className="hidden"
                />
              </label>
            )}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* STEP 3: ROOM TYPES & INVENTORY PROVISIONER */}
      {/* ========================================================================= */}
      {currentStep === 3 && (
        <div className="rounded-3xl border border-zinc-200 bg-white p-6 sm:p-8 shadow-sm space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-zinc-100 pb-4 gap-4">
            <div>
              <h2 className="text-lg font-bold text-zinc-900 flex items-center gap-2">
                <BedDouble className="h-5 w-5 text-indigo-600" />
                <span>Step 3: Room Types & Automated Inventory Setup</span>
              </h2>
              <p className="mt-1 text-xs text-zinc-600">
                Define nominal capacities (e.g. 2 beds for 2-Seater) and automatically provision room numbers.
              </p>
            </div>
            <button
              type="button"
              onClick={handleAddRoomType}
              className="inline-flex items-center gap-1.5 rounded-full bg-indigo-50 border border-indigo-200 px-3.5 py-1.5 text-xs font-bold text-indigo-700 hover:bg-indigo-100 transition-colors cursor-pointer"
            >
              <Plus className="h-4 w-4" />
              <span>Add Another Room Type</span>
            </button>
          </div>

          {/* List of Room Types */}
          <div className="space-y-6">
            {roomTypes.map((rt, idx) => (
              <div
                key={idx}
                className="rounded-2xl border border-zinc-200 bg-zinc-50/60 p-5 space-y-4"
              >
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-2 text-sm font-bold text-zinc-900">
                    <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-indigo-600 text-xs text-white">
                      {idx + 1}
                    </span>
                    <span>{rt.name || "Untitled Room Type"}</span>
                  </span>
                  {roomTypes.length > 1 && (
                    <button
                      type="button"
                      onClick={() => handleRemoveRoomType(idx)}
                      className="text-zinc-600 hover:text-red-600 p-1"
                      title="Remove room type"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  )}
                </div>

                {/* Row 1: Room Identification & Capacity */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="sm:col-span-2">
                    <label className="block text-[11px] font-bold uppercase tracking-wider text-zinc-700 mb-1.5">
                      Room Type Name <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={rt.name}
                      onChange={(e) => handleUpdateRoomType(idx, "name", e.target.value)}
                      placeholder="e.g. 2-Seater AC"
                      className="w-full rounded-xl border border-zinc-200 bg-white px-3.5 py-2.5 text-sm font-medium text-zinc-900 focus:outline-none focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600 transition-all"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold uppercase tracking-wider text-zinc-700 mb-1.5">
                      Capacity (Beds) <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="number"
                      min="1"
                      max="10"
                      value={rt.occupancy}
                      onChange={(e) =>
                        handleUpdateRoomType(idx, "occupancy", parseInt(e.target.value, 10) || 1)
                      }
                      className="w-full rounded-xl border border-zinc-200 bg-white px-3.5 py-2.5 text-sm font-medium text-zinc-900 focus:outline-none focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600 transition-all"
                    />
                  </div>
                </div>

                {/* Row 2: Financial Breakdown (Rent, Deposit, Maintenance) */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-[11px] font-bold uppercase tracking-wider text-zinc-700 mb-1.5">
                      Rent (₹ / Month) <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="number"
                      min="1000"
                      value={rt.monthlyRent ? rt.monthlyRent : ""}
                      onChange={(e) =>
                        handleUpdateRoomType(
                          idx,
                          "monthlyRent",
                          e.target.value === "" ? 0 : parseInt(e.target.value, 10) || 0
                        )
                      }
                      placeholder="e.g. 11500"
                      className="w-full rounded-xl border border-zinc-200 bg-white px-3.5 py-2.5 text-sm font-medium text-zinc-900 focus:outline-none focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600 transition-all"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold uppercase tracking-wider text-zinc-700 mb-1.5">
                      Security Deposit (₹)
                    </label>
                    <input
                      type="number"
                      min="0"
                      value={rt.securityDeposit ? rt.securityDeposit : ""}
                      onChange={(e) =>
                        handleUpdateRoomType(
                          idx,
                          "securityDeposit",
                          e.target.value === "" ? 0 : parseInt(e.target.value, 10) || 0
                        )
                      }
                      placeholder="0"
                      className="w-full rounded-xl border border-zinc-200 bg-white px-3.5 py-2.5 text-sm font-medium text-zinc-900 focus:outline-none focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600 transition-all"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold uppercase tracking-wider text-zinc-700 mb-1.5">
                      Maintenance (₹ / Mo) <span className="text-[10px] text-zinc-400 font-normal lowercase">(optional)</span>
                    </label>
                    <input
                      type="number"
                      min="0"
                      value={rt.maintenanceCharges ? rt.maintenanceCharges : ""}
                      placeholder="0"
                      onChange={(e) =>
                        handleUpdateRoomType(
                          idx,
                          "maintenanceCharges",
                          e.target.value === "" ? 0 : parseInt(e.target.value, 10) || 0
                        )
                      }
                      className="w-full rounded-xl border border-zinc-200 bg-white px-3.5 py-2.5 text-sm font-medium text-zinc-900 focus:outline-none focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600 transition-all"
                    />
                  </div>
                </div>

                {/* Room Features Toggles */}
                <div className="flex flex-wrap items-center gap-5 pt-1">
                    <label className="flex items-center gap-2 text-xs font-semibold text-zinc-700 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={rt.hasAirConditioning}
                        onChange={(e) =>
                          handleUpdateRoomType(idx, "hasAirConditioning", e.target.checked)
                        }
                        className="rounded text-indigo-600 focus:ring-0"
                      />
                      <span>Air Conditioning (AC)</span>
                    </label>
                    <label className="flex items-center gap-2 text-xs font-semibold text-zinc-700 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={rt.hasAttachedBathroom}
                        onChange={(e) =>
                          handleUpdateRoomType(idx, "hasAttachedBathroom", e.target.checked)
                        }
                        className="rounded text-indigo-600 focus:ring-0"
                      />
                      <span>Attached Washroom</span>
                    </label>
                    <label className="flex items-center gap-2 text-xs font-semibold text-zinc-700 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={rt.hasBalcony}
                        onChange={(e) =>
                          handleUpdateRoomType(idx, "hasBalcony", e.target.checked)
                        }
                        className="rounded text-indigo-600 focus:ring-0"
                      />
                      <span>Balcony</span>
                    </label>
                  </div>

                {/* Initial Inventory Generator Sub-Box */}
                <div className="mt-3 rounded-xl border border-indigo-100 bg-indigo-50/50 p-4">
                  <div className="text-xs font-bold text-indigo-950 mb-2 flex items-center justify-between">
                    <span>Provision Initial Rooms for &ldquo;{rt.name}&rdquo;</span>
                    <span className="text-indigo-600 font-semibold">
                      {rt.initialRoomsCount} rooms = {rt.occupancy * rt.initialRoomsCount} total beds
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label className="block text-[10px] font-bold uppercase tracking-wider text-indigo-900 mb-1">
                        Starting Room Number
                      </label>
                      <input
                        type="number"
                        value={rt.startRoomNumber}
                        onChange={(e) =>
                          handleUpdateRoomType(
                            idx,
                            "startRoomNumber",
                            parseInt(e.target.value, 10) || 101
                          )
                        }
                        className="w-full rounded-lg border border-indigo-200 bg-white px-3 py-1.5 text-xs font-semibold text-zinc-900 focus:outline-none focus:border-indigo-600"
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
                        value={rt.initialRoomsCount}
                        onChange={(e) =>
                          handleUpdateRoomType(
                            idx,
                            "initialRoomsCount",
                            parseInt(e.target.value, 10) || 1
                          )
                        }
                        className="w-full rounded-lg border border-indigo-200 bg-white px-3 py-1.5 text-xs font-semibold text-zinc-900 focus:outline-none focus:border-indigo-600"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold uppercase tracking-wider text-indigo-900 mb-1">
                        Floor
                      </label>
                      <input
                        type="number"
                        value={rt.floor || 1}
                        onChange={(e) =>
                          handleUpdateRoomType(idx, "floor", parseInt(e.target.value, 10) || 1)
                        }
                        className="w-full rounded-lg border border-indigo-200 bg-white px-3 py-1.5 text-xs font-semibold text-zinc-900 focus:outline-none focus:border-indigo-600"
                      />
                    </div>
                  </div>

                  <p className="mt-2 text-[11px] text-indigo-700">
                    💡 Will automatically create rooms:{" "}
                    <strong>
                      {Array.from({ length: Math.min(5, rt.initialRoomsCount) }, (_, i) => rt.startRoomNumber + i).join(", ")}
                      {rt.initialRoomsCount > 5 ? ` ... up to ${rt.startRoomNumber + rt.initialRoomsCount - 1}` : ""}
                    </strong>
                  </p>
                </div>
              </div>
            ))}
          </div>

          {/* Aggregated Inventory summary */}
          <div className="rounded-2xl bg-zinc-900 text-white p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
            <div>
              <span className="font-bold text-zinc-300">Total Provisioned Capacity:</span>
              <span className="ml-2 font-black text-white text-sm">
                {totalRoomsProvisioned} Rooms • {totalBedsProvisioned} Total Beds
              </span>
            </div>
            <div className="text-zinc-600">
              Lowest rent starting from ₹{Math.min(...roomTypes.map((rt) => rt.monthlyRent))}/mo
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* STEP 4: REVIEW & PUBLISH */}
      {/* ========================================================================= */}
      {currentStep === 4 && (
        <div className="rounded-3xl border border-zinc-200 bg-white p-6 sm:p-8 shadow-sm space-y-6">
          <div className="border-b border-zinc-100 pb-4">
            <h2 className="text-lg font-bold text-zinc-900 flex items-center gap-2">
              <BadgeCheck className="h-5 w-5 text-emerald-600" />
              <span>Step 4: Review Details & Launch</span>
            </h2>
            <p className="mt-1 text-xs text-zinc-600">
              Review your PG details before publishing. You can manage your live room occupancy right after.
            </p>
          </div>

          {/* Quick Summary Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 text-xs">
            <div className="rounded-2xl border border-zinc-200 bg-zinc-50 p-4 space-y-2.5">
              <div className="font-bold text-zinc-900 flex items-center gap-1.5 text-sm">
                <Building2 className="h-4 w-4 text-indigo-600" />
                <span>{name}</span>
              </div>
              <div className="text-zinc-600 flex items-center gap-1">
                <MapPin className="h-3.5 w-3.5 text-zinc-600" />
                <span>
                  {locality}, {city} ({postalCode})
                </span>
              </div>
              <div className="text-zinc-600 flex items-center gap-1">
                <Phone className="h-3.5 w-3.5 text-zinc-600" />
                <span>Call: {contactPhone} • WhatsApp: {whatsappNumber || contactPhone}</span>
              </div>
              <div className="text-zinc-600 flex items-center gap-1">
                <Utensils className="h-3.5 w-3.5 text-zinc-600" />
                <span>{foodOffering.replace(/_/g, " ")}</span>
              </div>
              <div className="text-zinc-600 flex items-center gap-1">
                <Clock className="h-3.5 w-3.5 text-zinc-600" />
                <span>Curfew: {gateClosingTime} • Notice: {noticePeriodDays} days</span>
              </div>
            </div>

            <div className="rounded-2xl border border-zinc-200 bg-zinc-50 p-4 space-y-2.5">
              <div className="font-bold text-zinc-900 flex items-center gap-1.5 text-sm">
                <BedDouble className="h-4 w-4 text-emerald-600" />
                <span>Inventory Summary</span>
              </div>
              <div className="space-y-1">
                {roomTypes.map((rt, idx) => (
                  <div key={idx} className="flex justify-between items-center text-zinc-700">
                    <span>
                      {rt.name} ({rt.occupancy} Beds/room)
                    </span>
                    <span className="font-bold text-zinc-900">
                      {rt.initialRoomsCount} rooms (₹{rt.monthlyRent.toLocaleString("en-IN")}/mo)
                    </span>
                  </div>
                ))}
              </div>
              <div className="border-t border-zinc-200 pt-2 flex justify-between font-bold text-zinc-900">
                <span>Total Capacity</span>
                <span className="text-indigo-600 font-black">
                  {totalRoomsProvisioned} Rooms • {totalBedsProvisioned} Beds
                </span>
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-zinc-200 bg-zinc-50 p-4">
            <span className="font-bold text-zinc-900 block mb-1">
              Included Amenities ({selectedAmenities.length}):
            </span>
            <div className="flex flex-wrap gap-1.5">
              {amenities
                .filter((a) => selectedAmenities.includes(a.id))
                .map((a) => (
                  <span
                    key={a.id}
                    className="rounded-full bg-white border border-zinc-200 px-2.5 py-0.5 text-[11px] font-semibold text-zinc-700"
                  >
                    {a.name}
                  </span>
                ))}
            </div>
          </div>

          {/* Location Pin & Photos Summary in Step 4 */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 text-xs">
            {/* Pinned Coordinates Card */}
            <div className="rounded-2xl border border-zinc-200 bg-zinc-50 p-4 space-y-2">
              <div className="font-bold text-zinc-900 flex items-center gap-1.5 text-sm">
                <MapPin className="h-4 w-4 text-indigo-600" />
                <span>Pinned Location</span>
              </div>
              <p className="text-zinc-600 text-[11px]">
                {locality}, {city}, {state}
              </p>
              <div className="inline-flex items-center gap-1.5 rounded-lg bg-indigo-50 text-indigo-700 border border-indigo-200 px-2.5 py-1 font-mono text-[11px]">
                <span>Coordinates: {latitude.toFixed(5)}, {longitude.toFixed(5)}</span>
              </div>
            </div>

            {/* Photos Preview Card */}
            <div className="rounded-2xl border border-zinc-200 bg-zinc-50 p-4 space-y-2">
              <div className="font-bold text-zinc-900 flex items-center gap-1.5 text-sm">
                <Camera className="h-4 w-4 text-indigo-600" />
                <span>Photos ({propertyPhotos.length})</span>
              </div>
              {propertyPhotos.length > 0 ? (
                <div className="flex items-center gap-2 overflow-x-auto py-1">
                  {propertyPhotos.map((photo) => (
                    <div
                      key={photo.id}
                      className="relative h-12 w-16 shrink-0 overflow-hidden rounded-lg border border-zinc-200 bg-zinc-200"
                    >
                      <img src={photo.previewUrl} alt="Thumbnail" className="h-full w-full object-cover" />
                      {photo.isCover && (
                        <div className="absolute top-0.5 left-0.5 rounded-xs bg-amber-400 p-0.5 text-[8px] font-bold text-amber-950">
                          ★
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-[11px] text-zinc-500 italic">
                  No photos uploaded yet. You can upload them anytime from the property dashboard.
                </p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Navigation Buttons */}
      <div className="mt-8 flex items-center justify-between border-t border-zinc-200 pt-5">
        {currentStep > 1 ? (
          <button
            type="button"
            onClick={handlePrev}
            disabled={isSubmitting}
            className="flex items-center gap-1.5 rounded-full border border-zinc-300 bg-white px-5 py-2.5 text-xs font-bold text-zinc-700 hover:bg-zinc-50 cursor-pointer"
          >
            <ChevronLeft className="h-4 w-4" />
            <span>Previous</span>
          </button>
        ) : (
          <div />
        )}

        {currentStep < 4 ? (
          <button
            type="button"
            onClick={handleNext}
            disabled={isSubmitting}
            className="flex items-center gap-1.5 rounded-full bg-indigo-600 px-6 py-2.5 text-xs font-bold text-white hover:bg-indigo-700 shadow-md shadow-indigo-100 cursor-pointer disabled:opacity-50"
          >
            <span>{isSubmitting ? "Saving..." : "Continue"}</span>
            <ChevronRight className="h-4 w-4" />
          </button>
        ) : (
          <div className="flex items-center gap-3">
            <button
              type="button"
              disabled={isSubmitting}
              onClick={() => handleSubmit(false)}
              className="rounded-full border border-zinc-300 bg-white px-5 py-2.5 text-xs font-bold text-zinc-700 hover:bg-zinc-50 cursor-pointer disabled:opacity-50"
            >
              Save as Draft
            </button>
            <button
              type="button"
              disabled={isSubmitting}
              onClick={() => handleSubmit(true)}
              className="flex items-center gap-2 rounded-full bg-emerald-600 px-6 py-2.5 text-xs font-black text-white hover:bg-emerald-700 shadow-md shadow-emerald-100 cursor-pointer disabled:opacity-50"
            >
              {isSubmitting ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <CheckCircle2 className="h-4 w-4" />
              )}
              <span>
                {isSubmitting
                  ? uploadStatusText || "Publishing & Uploading..."
                  : "Publish & Manage Inventory"}
              </span>
            </button>
          </div>
        )}
      </div>

      {/* Request New Locality Modal */}
      {isLocalityModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl border border-slate-100">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-sm font-bold text-slate-900">Request New Locality</h3>
              <button
                type="button"
                onClick={() => setIsLocalityModalOpen(false)}
                className="h-7 w-7 rounded-lg text-slate-400 hover:bg-slate-100 flex items-center justify-center"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="mt-4 space-y-3.5 text-xs">
              <p className="text-slate-500">
                StayKro maintains a verified database of localities. If your PG&apos;s locality is not listed,
                request it here and Admin will approve it for public search.
              </p>

              <div className="rounded-xl bg-slate-50 p-3 text-slate-700">
                <span className="text-slate-400 block text-[10px] uppercase font-bold">Region</span>
                <span className="font-semibold">{city}, {state}</span>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Locality Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Bellandur Green Glen Layout"
                  value={reqLocalityName}
                  onChange={(e) => setReqLocalityName(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs focus:border-indigo-600 focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Reason / Nearest Landmark (Optional)</label>
                <textarea
                  rows={2}
                  placeholder="e.g. Near Ecospace tech park, popular student hub"
                  value={reqLocalityReason}
                  onChange={(e) => setReqLocalityReason(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs focus:border-indigo-600 focus:outline-hidden"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsLocalityModalOpen(false)}
                  className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={isSubmittingReq || !reqLocalityName.trim()}
                  onClick={async () => {
                    setIsSubmittingReq(true);
                    try {
                      const res = await requestOwnerLocalityAction({
                        stateName: state,
                        cityName: city,
                        localityName: reqLocalityName.trim(),
                        notes: reqLocalityReason.trim() || undefined,
                      });
                      if (res.success) {
                        setLocality(reqLocalityName.trim());
                        setLocalitySuccessMsg(`Locality "${reqLocalityName}" requested! Admin has been notified.`);
                        setIsLocalityModalOpen(false);
                        setReqLocalityName("");
                        setReqLocalityReason("");
                      } else {
                        setErrorMsg(res.error || "Failed to request locality.");
                      }
                    } catch {
                      setErrorMsg("Network error requesting locality.");
                    } finally {
                      setIsSubmittingReq(false);
                    }
                  }}
                  className="inline-flex items-center gap-1.5 rounded-xl bg-indigo-600 px-4 py-2 text-xs font-bold text-white hover:bg-indigo-700 disabled:opacity-50"
                >
                  {isSubmittingReq ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Send className="h-3.5 w-3.5" />}
                  <span>{isSubmittingReq ? "Submitting..." : "Submit to Admin"}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
