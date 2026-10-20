"use client";

import { useState } from "react";
import Link from "next/link";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { PropertyGallery, PropertyGalleryImage } from "./PropertyGallery";
import { RoomTypesSection, RoomTypeData } from "./RoomTypesSection";
import { AmenitiesSection, AmenityItem } from "./AmenitiesSection";
import { OwnerContactCard } from "./OwnerContactCard";
import { BookmarkButton } from "@/components/ui/BookmarkButton";
import dynamic from "next/dynamic";
import {
  PropertyReviewsSection,
  type PropertyReviewData,
} from "./PropertyReviewsSection";
import {
  MapPin,
  ShieldCheck,
  ChevronRight,
  Phone,
  MessageSquare,
  CheckCircle2,
  Star,
  Loader2,
  Share2,
} from "lucide-react";
import { PropertyShareModal } from "./PropertyShareModal";

const SinglePropertyMap = dynamic(
  () => import("@/components/map/SinglePropertyMap").then((mod) => mod.SinglePropertyMap),
  {
    ssr: false,
    loading: () => (
      <div className="h-64 sm:h-80 w-full rounded-2xl bg-zinc-50 border border-zinc-200 flex flex-col items-center justify-center text-zinc-400 gap-2">
        <Loader2 className="h-5 w-5 animate-spin text-[#00412E]" />
        <span className="text-xs font-semibold text-zinc-500">Loading map...</span>
      </div>
    ),
  }
);

interface PropertyDetailClientProps {
  property: {
    id: string;
    name: string;
    slug: string;
    description: string | null;
    propertyType: string;
    genderPolicy: string;
    addressLine1: string;
    addressLine2: string | null;
    locality: string;
    city: string;
    state: string;
    postalCode: string | null;
    latitude: number | null;
    longitude: number | null;
    contactPhone: string;
    whatsappNumber: string | null;
    gateClosingTime: string | null;
    noticePeriodDays: number | null;
    houseRules: string[];
    foodIncluded: boolean;
    foodOffering: string;
    startingPrice: number;
    isVerified: boolean;
    images: PropertyGalleryImage[];
    amenities: AmenityItem[];
    roomTypes: RoomTypeData[];
    owner: {
      fullName: string;
      companyName: string | null;
      isVerified: boolean;
    };
    reviews?: PropertyReviewData[];
  };
  currentUser?: {
    id: string;
    email: string | null;
    role?: string | null;
    profile?: { fullName: string; avatarUrl: string | null } | null;
  } | null;
}

export function PropertyDetailClient({
  property,
  currentUser,
}: PropertyDetailClientProps) {
  const [selectedRoomTypeId, setSelectedRoomTypeId] = useState<string | null>(null);
  const [isShareOpen, setIsShareOpen] = useState(false);

  const selectedRoomType = property.roomTypes.find((rt) => rt.id === selectedRoomTypeId);

  let defaultRoomType: (typeof property.roomTypes)[0] | null = null;
  let lowestPerPerson = Infinity;
  for (const rt of property.roomTypes) {
    const perPerson = rt.occupancy > 1 ? Math.round(rt.monthlyRent / rt.occupancy) : rt.monthlyRent;
    if (perPerson < lowestPerPerson) {
      lowestPerPerson = perPerson;
      defaultRoomType = rt;
    }
  }

  const currentRoomType = selectedRoomType || defaultRoomType;

  let mobilePrice = property.startingPrice || 0;
  let mobileOriginalPrice: number | null = null;
  let mobileOccupancyBadge: string | null = null;

  if (currentRoomType) {
    if (currentRoomType.occupancy > 1) {
      mobilePrice = Math.round(currentRoomType.monthlyRent / currentRoomType.occupancy);
      mobileOriginalPrice = currentRoomType.monthlyRent;
      mobileOccupancyBadge = `${currentRoomType.occupancy}-Sharing`;
    } else {
      mobilePrice = currentRoomType.monthlyRent;
      mobileOriginalPrice = null;
      mobileOccupancyBadge = "Private Room";
    }
  }

  const handleSelectRoomType = (roomTypeId: string) => {
    setSelectedRoomTypeId(roomTypeId);
    document.getElementById("contact-sidebar")?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <div className="min-h-screen flex flex-col bg-zinc-50/50 text-zinc-900 selection:bg-[#96BF8A]/30 selection:text-[#00412E]">
      {/* 1. Header Navigation */}
      <Header
        selectedCity={property.city}
        currentUser={currentUser}
      />

      {/* 2. Main Container */}
      <main className="flex-1 pb-24 lg:pb-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-8">
          {/* Breadcrumb */}
          <nav className="flex items-center gap-1.5 text-xs font-semibold text-zinc-500 overflow-x-auto whitespace-nowrap pb-1">
            <Link href="/" className="hover:text-zinc-900 transition-colors">
              Home
            </Link>
            <ChevronRight className="h-3.5 w-3.5 text-zinc-400" />
            <Link href={`/?city=${encodeURIComponent(property.city)}`} className="hover:text-zinc-900 transition-colors">
              PGs in {property.city}
            </Link>
            <ChevronRight className="h-3.5 w-3.5 text-zinc-400" />
            <span className="text-zinc-700">{property.locality}</span>
            <ChevronRight className="h-3.5 w-3.5 text-zinc-400" />
            <span className="text-zinc-950 font-bold truncate max-w-[200px]">
              {property.name}
            </span>
          </nav>

          {/* Photo Gallery */}
          <PropertyGallery images={property.images} propertyName={property.name} />

          {/* Core Content Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            {/* Left 8 Columns: Details, Rooms, Amenities, Rules */}
            <div className="lg:col-span-8 space-y-8">
              {/* Main Headline & Badges */}
              <div className="rounded-3xl border border-zinc-200 bg-white p-6 sm:p-8 space-y-4 shadow-xs">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="flex flex-wrap items-center gap-2">
                    <span
                      className={`rounded-full px-3 py-1 text-xs font-bold uppercase tracking-wider text-white ${
                        property.genderPolicy === "BOYS"
                          ? "bg-blue-600"
                          : property.genderPolicy === "GIRLS"
                          ? "bg-rose-600"
                          : "bg-emerald-600"
                      }`}
                    >
                      {property.genderPolicy === "BOYS"
                        ? "Boys Only"
                        : property.genderPolicy === "GIRLS"
                        ? "Girls Only"
                        : "Coliving / Unisex"}
                    </span>

                    <span className="rounded-full bg-zinc-100 text-zinc-700 px-3 py-1 text-xs font-bold">
                      {property.propertyType}
                    </span>

                    {property.isVerified && (
                      <span className="rounded-full bg-[#eff4ec] text-[#00412E] border border-[#96BF8A]/40 px-3 py-1 text-xs font-bold flex items-center gap-1">
                        <ShieldCheck className="h-3.5 w-3.5 text-[#00412E]" />
                        <span>Verified Stay</span>
                      </span>
                    )}

                    {property.reviews && property.reviews.length > 0 ? (
                      <a
                        href="#reviews-section"
                        className="rounded-full bg-amber-50 text-amber-900 border border-amber-200/70 px-3 py-1 text-xs font-bold flex items-center gap-1 shadow-2xs hover:bg-amber-100 transition-colors"
                      >
                        <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
                        <span>
                          {(
                            property.reviews.reduce((a, r) => a + r.rating, 0) /
                            property.reviews.length
                          ).toFixed(1)}
                        </span>
                        <span className="text-zinc-400 font-normal">
                          ({property.reviews.length})
                        </span>
                      </a>
                    ) : (
                      <a
                        href="#reviews-section"
                        className="rounded-full bg-zinc-100 text-zinc-600 hover:text-zinc-900 px-3 py-1 text-xs font-semibold flex items-center gap-1 transition-colors"
                      >
                        <Star className="h-3.5 w-3.5 text-zinc-400" />
                        <span>Rate PG</span>
                      </a>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setIsShareOpen(true)}
                      aria-label="Share property"
                      className="inline-flex items-center gap-1.5 rounded-full border border-zinc-200 bg-white px-3.5 py-1.5 text-xs font-bold text-zinc-700 hover:text-[#00412E] hover:border-[#96BF8A] shadow-2xs transition-all cursor-pointer"
                    >
                      <Share2 className="h-3.5 w-3.5" />
                      <span>Share</span>
                    </button>
                    <BookmarkButton
                      targetId={property.id}
                      targetType="PROPERTY"
                      size="md"
                    />
                  </div>
                </div>

                <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight text-zinc-950">
                  {property.name}
                </h1>

                <div className="flex items-center gap-1.5 text-xs sm:text-sm text-zinc-500">
                  <MapPin className="h-4 w-4 text-[#00412E] shrink-0" />
                  <span>
                    {property.addressLine1}
                    {property.addressLine2 ? `, ${property.addressLine2}` : ""},{" "}
                    {property.locality}, {property.city}, {property.state}{" "}
                    {property.postalCode ? `- ${property.postalCode}` : ""}
                  </span>
                </div>

                {/* Description */}
                {property.description && (
                  <p className="text-sm text-zinc-600 leading-relaxed pt-2 border-t border-zinc-100">
                    {property.description}
                  </p>
                )}

                {/* Quick Highlights Bar */}
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 pt-4 border-t border-zinc-100">
                  <div className="rounded-2xl bg-zinc-50 p-3 border border-zinc-100">
                    <span className="text-[10px] font-bold uppercase text-zinc-400 block">Gate Curfew</span>
                    <span className="text-xs sm:text-sm font-bold text-zinc-800">
                      {property.gateClosingTime || "Flexible Entry"}
                    </span>
                  </div>

                  <div className="rounded-2xl bg-zinc-50 p-3 border border-zinc-100">
                    <span className="text-[10px] font-bold uppercase text-zinc-400 block">Notice Period</span>
                    <span className="text-xs sm:text-sm font-bold text-zinc-800">
                      {property.noticePeriodDays ? `${property.noticePeriodDays} Days` : "30 Days standard"}
                    </span>
                  </div>

                  <div className="rounded-2xl bg-zinc-50 p-3 border border-zinc-100 col-span-2 sm:col-span-1">
                    <span className="text-[10px] font-bold uppercase text-zinc-400 block">Brokerage</span>
                    <span className="text-xs sm:text-sm font-bold text-emerald-600">
                      ₹0 (Direct from Owner)
                    </span>
                  </div>
                </div>
              </div>

              {/* Room Types & Pricing */}
              <RoomTypesSection
                roomTypes={property.roomTypes}
                propertyId={property.id}
                propertyName={property.name}
                propertySlug={property.slug}
                onSelectRoomType={handleSelectRoomType}
              />

              {/* Amenities */}
              <AmenitiesSection
                amenities={property.amenities}
                foodIncluded={property.foodIncluded}
                foodOffering={property.foodOffering}
              />

              {/* House Rules & Policies */}
              <div className="rounded-3xl border border-zinc-200 bg-white p-6 sm:p-8 space-y-4">
                <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-zinc-950">
                  House Rules & Policies
                </h2>
                <p className="text-xs sm:text-sm text-zinc-500">
                  Clear house guidelines set by the property management for peaceful communal living.
                </p>

                {property.houseRules && property.houseRules.length > 0 ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-4">
                    {property.houseRules.map((rule, idx) => (
                      <div
                        key={idx}
                        className="flex items-center gap-2.5 rounded-2xl bg-zinc-50 p-3 text-xs font-semibold text-zinc-700 border border-zinc-100"
                      >
                        <CheckCircle2 className="h-4 w-4 text-[#00412E] shrink-0" />
                        <span>{rule}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="rounded-2xl bg-zinc-50 p-4 text-xs text-zinc-600 border border-zinc-100">
                    Standard coliving guidelines apply: maintain cleanliness in shared spaces and respect quiet hours.
                  </div>
                )}
              </div>

              {/* Resident Reviews & Star Ratings */}
              <PropertyReviewsSection
                propertyId={property.id}
                propertyName={property.name}
                propertySlug={property.slug}
                initialReviews={property.reviews || []}
                hasFood={Boolean(property.foodIncluded && property.foodOffering !== "NO_FOOD")}
                currentUser={currentUser}
              />

              {/* Location & Interactive Neighborhood Map */}
              <SinglePropertyMap
                propertyName={property.name}
                addressLine1={property.addressLine1}
                locality={property.locality}
                city={property.city}
                latitude={property.latitude}
                longitude={property.longitude}
              />
            </div>

            {/* Right 4 Columns: Sticky Owner Contact Card */}
            <div id="contact-sidebar" className="lg:col-span-4">
              <OwnerContactCard
                property={{
                  id: property.id,
                  name: property.name,
                  slug: property.slug,
                  locality: property.locality,
                  city: property.city,
                  startingPrice: property.startingPrice,
                  contactPhone: property.contactPhone,
                  whatsappNumber: property.whatsappNumber,
                }}
                owner={property.owner}
                roomTypes={property.roomTypes}
                selectedRoomTypeId={selectedRoomTypeId}
                onClearSelectedRoomType={() => setSelectedRoomTypeId(null)}
                currentUser={currentUser}
              />
            </div>
          </div>
        </div>
      </main>

      {/* 3. Mobile Floating Contact Bar */}
      <div className="fixed bottom-0 inset-x-0 z-40 bg-white/95 backdrop-blur-md border-t border-zinc-200 p-3 px-4 flex lg:hidden items-center justify-between gap-3 shadow-lg">
        <div>
          <div className="flex items-center gap-1.5 mb-0.5">
            {mobileOriginalPrice && mobileOriginalPrice > mobilePrice && (
              <span className="text-[11px] font-semibold text-zinc-400 line-through">
                ₹{mobileOriginalPrice.toLocaleString("en-IN")}
              </span>
            )}
            {mobileOccupancyBadge && (
              <span className="text-[9px] font-bold text-[#00412E] bg-[#96BF8A]/20 px-1.5 py-0.5 rounded border border-[#96BF8A]/40">
                {mobileOccupancyBadge}
              </span>
            )}
          </div>
          <div className="text-base font-black text-zinc-950 flex items-baseline gap-1">
            <span>₹{mobilePrice.toLocaleString("en-IN")}</span>
            <span className="text-xs font-normal text-zinc-500">
              {currentRoomType && currentRoomType.occupancy > 1 ? "/bed" : "/mo"}
            </span>
          </div>
        </div>

        {(() => {
          const rawWhatsApp =
            property.whatsappNumber && property.whatsappNumber !== "Not provided"
              ? property.whatsappNumber
              : property.contactPhone && property.contactPhone !== "Not provided"
              ? property.contactPhone
              : "";
          const digitsOnly = rawWhatsApp.replace(/\D/g, "");
          const cleanWhatsApp =
            digitsOnly.length === 10
              ? `91${digitsOnly}`
              : digitsOnly.length > 10 && digitsOnly.startsWith("91")
              ? digitsOnly
              : digitsOnly;
          const hasValidWhatsApp = cleanWhatsApp.length >= 10;
          const whatsappUrl = hasValidWhatsApp
            ? `https://wa.me/${cleanWhatsApp}?text=${encodeURIComponent(
                `Hi, I saw ${property.name} on StayKro and would like to enquire about room availability.`
              )}`
            : null;

          return (
            <div className="flex items-center gap-2">
              {property.contactPhone && property.contactPhone !== "Not provided" && (
                <a
                  href={`tel:${property.contactPhone}`}
                  className="flex items-center gap-1 rounded-xl bg-zinc-900 px-3.5 py-2.5 text-xs font-bold text-white shadow-xs cursor-pointer"
                >
                  <Phone className="h-3.5 w-3.5" />
                  <span>Call</span>
                </a>
              )}

              {hasValidWhatsApp && whatsappUrl ? (
                <a
                  href={whatsappUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1 rounded-xl bg-emerald-600 px-3.5 py-2.5 text-xs font-bold text-white shadow-xs cursor-pointer"
                >
                  <MessageSquare className="h-3.5 w-3.5" />
                  <span>WhatsApp</span>
                </a>
              ) : (
                <a
                  href="#owner-contact"
                  className="flex items-center gap-1 rounded-xl bg-emerald-600 px-3.5 py-2.5 text-xs font-bold text-white shadow-xs cursor-pointer"
                >
                  <MessageSquare className="h-3.5 w-3.5" />
                  <span>Enquire</span>
                </a>
              )}
            </div>
          );
        })()}
      </div>

      <PropertyShareModal
        isOpen={isShareOpen}
        onClose={() => setIsShareOpen(false)}
        property={{
          id: property.id,
          name: property.name,
          slug: property.slug,
          locality: property.locality,
          city: property.city,
          genderPolicy: property.genderPolicy,
          startingPrice: property.startingPrice,
          foodIncluded: property.foodIncluded,
          coverImageUrl: property.images && property.images.length > 0 ? property.images[0].url : null,
          images: property.images?.map((img) => img.url),
          isVerified: property.isVerified,
          rating: property.reviews && property.reviews.length > 0
            ? property.reviews.reduce((a, r) => a + r.rating, 0) / property.reviews.length
            : undefined,
          reviewCount: property.reviews?.length,
          bestSharingOccupancy: defaultRoomType?.occupancy,
          roomTypeSummaries: property.roomTypes.map(
            (rt) => `${rt.name} (${rt.occupancy > 1 ? `${rt.occupancy}-Sharing` : "Private"})`
          ),
        }}
      />

      {/* 4. Footer */}
      <Footer />
    </div>
  );
}
