"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import {
  MapPin,
  ShieldCheck,
  Utensils,
  ChevronRight,
  HelpCircle,
  Building2,
  Sparkles,
  ArrowRight,
} from "lucide-react";
import { PropertyCard } from "@/components/property/PropertyCard";
import type { LocationLandingData } from "@/lib/seo-landing";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";

export interface LocationLandingClientProps {
  data: LocationLandingData;
  currentUser: {
    id: string;
    email: string | null;
    role?: string | null;
    profile?: { fullName: string; avatarUrl: string | null } | null;
  } | null;
}

export function LocationLandingClient({
  data,
  currentUser,
}: LocationLandingClientProps) {
  const [selectedGenderFilter, setSelectedGenderFilter] = useState<string>("ALL");
  const [onlyFood, setOnlyFood] = useState<boolean>(false);
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(0);

  const locationTitle = data.localityName
    ? `${data.localityName}, ${data.cityName}`
    : data.cityName;

  const filteredProperties = useMemo(() => {
    return data.properties.filter((p) => {
      if (selectedGenderFilter !== "ALL" && p.genderPolicy !== selectedGenderFilter) {
        return false;
      }
      if (onlyFood && !p.foodIncluded) {
        return false;
      }
      return true;
    });
  }, [data.properties, selectedGenderFilter, onlyFood]);

  return (
    <div className="min-h-screen bg-[#FBFBF9] text-zinc-900 flex flex-col font-sans">
      <Header currentUser={currentUser} />

      <main className="flex-1">
        {/* Breadcrumbs */}
        <div className="border-b border-[#E8EAE5] bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
            <nav className="flex items-center text-xs text-zinc-500 overflow-x-auto whitespace-nowrap">
              {data.breadcrumbs.map((b, idx) => (
                <div key={b.path} className="flex items-center">
                  {idx > 0 && <ChevronRight className="h-3 w-3 text-zinc-400 mx-1.5 shrink-0" />}
                  {idx === data.breadcrumbs.length - 1 ? (
                    <span className="font-semibold text-zinc-900">{b.name}</span>
                  ) : (
                    <Link
                      href={b.path}
                      className="hover:text-[#00412E] transition-colors"
                    >
                      {b.name}
                    </Link>
                  )}
                </div>
              ))}
            </nav>
          </div>
        </div>

        {/* Hero Section */}
        <div className="bg-gradient-to-b from-[#EFF4EC]/70 via-white to-[#FBFBF9] border-b border-[#E8EAE5] pt-8 pb-10">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#00412E]/10 text-[#00412E] text-xs font-semibold mb-4">
              <Sparkles className="h-3.5 w-3.5" />
              <span>Zero Brokerage • Direct Owner Contact</span>
            </div>

            <h1 className="text-2xl sm:text-4xl font-extrabold text-zinc-950 tracking-tight">
              Best PGs & Hostels in <span className="text-[#00412E]">{locationTitle}</span>
            </h1>

            <p className="mt-3 text-sm sm:text-base text-zinc-600 max-w-3xl leading-relaxed">
              Explore {data.totalProperties > 0 ? data.totalProperties : "hand-picked"} verified paying guest accommodations, student hostels, and coliving spaces in {locationTitle}. Direct phone/WhatsApp chat with hosts, genuine photos, and prices starting from ₹{data.minPrice.toLocaleString("en-IN")}/mo.
            </p>

            {/* Quick Stat Badges */}
            <div className="mt-6 flex flex-wrap gap-2.5 sm:gap-3 text-xs">
              <div className="bg-white border border-[#E8EAE5] rounded-xl px-3.5 py-2 shadow-2xs flex items-center gap-2">
                <Building2 className="h-4 w-4 text-[#00412E]" />
                <span className="font-bold text-zinc-900">{data.totalProperties}</span>
                <span className="text-zinc-500">Verified Places</span>
              </div>
              <div className="bg-white border border-[#E8EAE5] rounded-xl px-3.5 py-2 shadow-2xs flex items-center gap-2">
                <span className="font-bold text-[#00412E]">₹{data.minPrice.toLocaleString("en-IN")}</span>
                <span className="text-zinc-500">Starting Rent</span>
              </div>
              {data.foodIncludedCount > 0 && (
                <div className="bg-white border border-[#E8EAE5] rounded-xl px-3.5 py-2 shadow-2xs flex items-center gap-2">
                  <Utensils className="h-4 w-4 text-amber-600" />
                  <span className="font-bold text-zinc-900">{data.foodIncludedCount}</span>
                  <span className="text-zinc-500">Meals Included</span>
                </div>
              )}
              <div className="bg-white border border-[#E8EAE5] rounded-xl px-3.5 py-2 shadow-2xs flex items-center gap-2">
                <ShieldCheck className="h-4 w-4 text-emerald-600" />
                <span className="text-zinc-700 font-medium">100% Verified Listings</span>
              </div>
            </div>
          </div>
        </div>

        {/* Popular Localities Chips (If on City Page) */}
        {data.popularLocalities.length > 0 && (
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5 border-b border-[#E8EAE5]/60">
            <div className="flex items-center gap-2 text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-2.5">
              <MapPin className="h-3.5 w-3.5 text-[#00412E]" />
              <span>Explore Top Localities in {data.cityName}:</span>
            </div>
            <div className="flex flex-wrap gap-2">
              <Link
                href={`/pg/${data.citySlug}`}
                className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                  !data.localitySlug
                    ? "bg-[#00412E] text-white shadow-xs"
                    : "bg-white border border-[#E8EAE5] text-zinc-700 hover:border-[#96BF8A]"
                }`}
              >
                All {data.cityName} ({data.totalProperties})
              </Link>
              {data.popularLocalities.map((loc) => {
                const isActive = data.localitySlug === loc.slug;
                return (
                  <Link
                    key={loc.slug}
                    href={`/pg/${data.citySlug}/${loc.slug}`}
                    className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                      isActive
                        ? "bg-[#00412E] text-white shadow-xs"
                        : "bg-white border border-[#E8EAE5] text-zinc-700 hover:border-[#96BF8A]"
                    }`}
                  >
                    {loc.name} {loc.count > 0 ? `(${loc.count})` : ""}
                  </Link>
                );
              })}
            </div>
          </div>
        )}

        {/* Listings Section with Quick Filter Pills */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6">
            <div>
              <h2 className="text-lg sm:text-xl font-bold text-zinc-950">
                Available Accommodations ({filteredProperties.length})
              </h2>
              <p className="text-xs text-zinc-500 mt-0.5">
                Direct booking with zero commission from verified owners
              </p>
            </div>

            {/* Filter Pills */}
            <div className="flex flex-wrap items-center gap-1.5">
              <button
                onClick={() => setSelectedGenderFilter("ALL")}
                className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all ${
                  selectedGenderFilter === "ALL"
                    ? "bg-[#00412E] text-white"
                    : "bg-white border border-[#E8EAE5] text-zinc-700 hover:border-zinc-300"
                }`}
              >
                All
              </button>
              {data.boysCount > 0 && (
                <button
                  onClick={() => setSelectedGenderFilter("BOYS")}
                  className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all ${
                    selectedGenderFilter === "BOYS"
                      ? "bg-blue-600 text-white"
                      : "bg-white border border-[#E8EAE5] text-zinc-700 hover:border-zinc-300"
                  }`}
                >
                  Boys ({data.boysCount})
                </button>
              )}
              {data.girlsCount > 0 && (
                <button
                  onClick={() => setSelectedGenderFilter("GIRLS")}
                  className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all ${
                    selectedGenderFilter === "GIRLS"
                      ? "bg-rose-600 text-white"
                      : "bg-white border border-[#E8EAE5] text-zinc-700 hover:border-zinc-300"
                  }`}
                >
                  Girls ({data.girlsCount})
                </button>
              )}
              {data.colivingCount > 0 && (
                <button
                  onClick={() => setSelectedGenderFilter("UNISEX")}
                  className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all ${
                    selectedGenderFilter === "UNISEX"
                      ? "bg-emerald-700 text-white"
                      : "bg-white border border-[#E8EAE5] text-zinc-700 hover:border-zinc-300"
                  }`}
                >
                  Coliving ({data.colivingCount})
                </button>
              )}
              {data.foodIncludedCount > 0 && (
                <button
                  onClick={() => setOnlyFood((prev) => !prev)}
                  className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all flex items-center gap-1 ${
                    onlyFood
                      ? "bg-amber-600 text-white"
                      : "bg-white border border-[#E8EAE5] text-zinc-700 hover:border-zinc-300"
                  }`}
                >
                  <Utensils className="h-3 w-3" />
                  <span>With Food</span>
                </button>
              )}
            </div>
          </div>

          {/* Cards Grid */}
          {filteredProperties.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
              {filteredProperties.map((pg) => (
                <PropertyCard key={pg.id} pg={pg} />
              ))}
            </div>
          ) : (
            <div className="rounded-2xl border border-dashed border-[#E8EAE5] bg-white p-12 text-center">
              <Building2 className="h-10 w-10 text-zinc-300 mx-auto mb-3" />
              <h3 className="text-base font-bold text-zinc-900">
                No matching properties found
              </h3>
              <p className="text-xs text-zinc-500 mt-1 max-w-md mx-auto">
                No listings match the current filters. Try resetting the filters or view all verified stays in {data.cityName}.
              </p>
              <button
                onClick={() => {
                  setSelectedGenderFilter("ALL");
                  setOnlyFood(false);
                }}
                className="mt-4 px-4 py-2 rounded-xl bg-[#00412E] text-white text-xs font-semibold hover:bg-[#002d20] transition-colors"
              >
                Clear Filters
              </button>
            </div>
          )}
        </div>

        {/* FAQs Section */}
        {data.faqs.length > 0 && (
          <section className="bg-white border-t border-[#E8EAE5] py-12">
            <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="flex items-center gap-2 text-xs font-bold text-[#00412E] uppercase tracking-wider mb-2">
                <HelpCircle className="h-4 w-4" />
                <span>Frequently Asked Questions</span>
              </div>
              <h2 className="text-xl sm:text-2xl font-bold text-zinc-950">
                Everything You Need to Know About Living in {locationTitle}
              </h2>
              <p className="text-xs sm:text-sm text-zinc-500 mt-1 mb-8">
                Helpful answers about rent, food, house rules, and amenities in {locationTitle}.
              </p>

              <div className="space-y-3">
                {data.faqs.map((faq, index) => {
                  const isOpen = openFaqIndex === index;
                  return (
                    <div
                      key={faq.question}
                      className="border border-[#E8EAE5] rounded-xl overflow-hidden transition-all bg-[#FBFBF9]"
                    >
                      <button
                        onClick={() => setOpenFaqIndex(isOpen ? null : index)}
                        className="w-full px-5 py-4 text-left flex items-center justify-between gap-4 font-semibold text-sm text-zinc-900 hover:text-[#00412E]"
                      >
                        <span>{faq.question}</span>
                        <ChevronRight
                          className={`h-4 w-4 text-zinc-400 shrink-0 transition-transform ${
                            isOpen ? "rotate-90 text-[#00412E]" : ""
                          }`}
                        />
                      </button>
                      {isOpen && (
                        <div className="px-5 pb-4 pt-1 text-xs sm:text-sm text-zinc-600 border-t border-[#E8EAE5]/60 bg-white leading-relaxed">
                          {faq.answer}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </section>
        )}

        {/* Owner CTA Banner */}
        <section className="bg-gradient-to-r from-[#00412E] to-[#012f21] text-white py-12">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row items-center justify-between gap-6">
            <div>
              <span className="text-xs uppercase tracking-wider font-semibold text-[#96BF8A]">
                Own a Property in {locationTitle}?
              </span>
              <h3 className="text-xl sm:text-2xl font-bold mt-1">
                List Your PG on StayKro with Zero Commission
              </h3>
              <p className="text-xs sm:text-sm text-white/80 mt-1 max-w-xl">
                Reach thousands of verified students and working professionals looking for shared accommodation in {locationTitle}. Direct tenant enquiries on WhatsApp.
              </p>
            </div>
            <Link
              href="/become-owner"
              className="shrink-0 px-6 py-3 rounded-xl bg-[#96BF8A] text-[#00412E] font-bold text-sm hover:bg-[#a9d19d] transition-all flex items-center gap-2 shadow-md"
            >
              <span>List Property on StayKro</span>
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
