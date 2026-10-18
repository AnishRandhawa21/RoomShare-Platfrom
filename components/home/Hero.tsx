"use client";

import { useState } from "react";
import {
  Search,
  MapPin,
  Building,
  Users,
  ShieldCheck,
  CheckCircle2,
  Sparkles,
  ArrowRight,
  SlidersHorizontal,
} from "lucide-react";

interface HeroProps {
  activeTab: "pg" | "roommate";
  setActiveTab: (tab: "pg" | "roommate") => void;
  selectedCity: string;
  searchQuery: string;
  setSearchQuery: (q: string) => void;
  onSearchSubmit: (e: React.FormEvent) => void;
  quickLocalities: string[];
}

export function Hero({
  activeTab,
  setActiveTab,
  selectedCity,
  searchQuery,
  setSearchQuery,
  onSearchSubmit,
  quickLocalities,
}: HeroProps) {
  const [selectedGender, setSelectedGender] = useState<string>("all");
  const [budgetTier, setBudgetTier] = useState<string>("any");

  return (
    <section className="relative overflow-hidden bg-gradient-to-b from-indigo-50/50 via-white to-white pt-8 pb-16 md:pt-16 md:pb-24">
      {/* Subtle Background Radial Gradients */}
      <div className="pointer-events-none absolute -top-24 left-1/2 -z-10 h-[500px] w-[800px] -translate-x-1/2 rounded-full bg-gradient-to-tr from-indigo-200/40 via-violet-200/30 to-amber-100/20 blur-3xl" />

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Top Announcement Pill */}
        <div className="flex justify-center">
          <div className="inline-flex items-center gap-2 rounded-full border border-indigo-200/80 bg-white/80 px-4 py-1.5 text-xs font-semibold text-indigo-900 shadow-sm backdrop-blur-sm transition-all hover:border-indigo-300">
            <span className="flex h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-zinc-600">Zero Brokerage Guarantee</span>
            <span className="text-zinc-300">•</span>
            <span className="text-indigo-600 font-bold flex items-center gap-1">
              10,000+ Verified Beds <Sparkles className="h-3 w-3" />
            </span>
          </div>
        </div>

        {/* Main Headline */}
        <div className="mt-6 text-center max-w-3xl mx-auto">
          <h1 className="text-4xl font-extrabold tracking-tight text-zinc-950 sm:text-5xl md:text-6xl">
            Find the right place. <br />
            <span className="bg-gradient-to-r from-indigo-600 via-violet-600 to-indigo-800 bg-clip-text text-transparent">
              Share it with the right people.
            </span>
          </h1>
          <p className="mt-4 text-base sm:text-lg text-zinc-600 max-w-2xl mx-auto leading-relaxed">
            Discover verified PGs with home-style food or connect with compatible
            roommates in {selectedCity} without dealing with middleman brokers.
          </p>
        </div>

        {/* Journey Switcher Tabs */}
        <div className="mt-10 flex justify-center">
          <div className="inline-flex rounded-2xl bg-zinc-100/90 p-1.5 shadow-inner">
            <button
              id="hero-tab-pg"
              type="button"
              onClick={() => setActiveTab("pg")}
              className={`flex items-center gap-2 rounded-xl px-6 py-3 text-sm font-bold transition-all cursor-pointer ${
                activeTab === "pg"
                  ? "bg-white text-indigo-600 shadow-md ring-1 ring-black/5"
                  : "text-zinc-600 hover:text-zinc-900"
              }`}
            >
              <Building className="h-4 w-4" />
              <span>1. Find a PG</span>
              <span className="rounded-full bg-indigo-100 px-2 py-0.5 text-[10px] text-indigo-700">
                Near Tech Parks
              </span>
            </button>
            <button
              id="hero-tab-roommate"
              type="button"
              onClick={() => setActiveTab("roommate")}
              className={`flex items-center gap-2 rounded-xl px-6 py-3 text-sm font-bold transition-all cursor-pointer ${
                activeTab === "roommate"
                  ? "bg-white text-violet-600 shadow-md ring-1 ring-black/5"
                  : "text-zinc-600 hover:text-zinc-900"
              }`}
            >
              <Users className="h-4 w-4" />
              <span>2. Find a Roommate</span>
              <span className="rounded-full bg-violet-100 px-2 py-0.5 text-[10px] text-violet-700">
                Split Rent
              </span>
            </button>
          </div>
        </div>

        {/* Dynamic Search Box Container */}
        <div className="mt-6 max-w-4xl mx-auto">
          <form
            onSubmit={onSearchSubmit}
            className="rounded-3xl border border-zinc-200/80 bg-white p-3 sm:p-4 shadow-2xl shadow-indigo-100/50"
          >
            <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-center">
              {/* Locality Input */}
              <div className="md:col-span-5 relative flex items-center rounded-2xl bg-zinc-50 px-4 py-3 border border-zinc-100 focus-within:border-indigo-400 focus-within:bg-white transition-all">
                <MapPin className="h-5 w-5 text-indigo-600 shrink-0 mr-3" />
                <div className="flex-1">
                  <label
                    htmlFor="locality-input"
                    className="block text-[11px] font-bold uppercase tracking-wider text-zinc-600"
                  >
                    Locality or Landmark in {selectedCity}
                  </label>
                  <input
                    id="locality-input"
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder={
                      activeTab === "pg"
                        ? "e.g. Koramangala, HSR Layout, Hinjawadi"
                        : "e.g. Near Cyber City, Viman Nagar"
                    }
                    className="w-full bg-transparent text-sm font-semibold text-zinc-900 placeholder:text-zinc-600 focus:outline-none"
                  />
                </div>
              </div>

              {/* Type / Gender Filter */}
              <div className="md:col-span-3 relative flex items-center rounded-2xl bg-zinc-50 px-4 py-3 border border-zinc-100 focus-within:border-indigo-400 focus-within:bg-white transition-all">
                <div className="flex-1">
                  <label
                    htmlFor="gender-filter"
                    className="block text-[11px] font-bold uppercase tracking-wider text-zinc-600"
                  >
                    {activeTab === "pg" ? "Tenant Type" : "Flatmate Type"}
                  </label>
                  <select
                    id="gender-filter"
                    value={selectedGender}
                    onChange={(e) => setSelectedGender(e.target.value)}
                    className="w-full bg-transparent text-sm font-semibold text-zinc-900 focus:outline-none cursor-pointer"
                  >
                    <option value="all">All / Any</option>
                    <option value="male">Boys / Male</option>
                    <option value="female">Girls / Female</option>
                    <option value="unisex">Coliving / Unisex</option>
                  </select>
                </div>
              </div>

              {/* Budget Tier */}
              <div className="md:col-span-2 relative flex items-center rounded-2xl bg-zinc-50 px-4 py-3 border border-zinc-100 focus-within:border-indigo-400 focus-within:bg-white transition-all">
                <div className="flex-1">
                  <label
                    htmlFor="budget-filter"
                    className="block text-[11px] font-bold uppercase tracking-wider text-zinc-600"
                  >
                    Budget
                  </label>
                  <select
                    id="budget-filter"
                    value={budgetTier}
                    onChange={(e) => setBudgetTier(e.target.value)}
                    className="w-full bg-transparent text-sm font-semibold text-zinc-900 focus:outline-none cursor-pointer"
                  >
                    <option value="any">Any Budget</option>
                    <option value="under8k">Under ₹8,000</option>
                    <option value="8k-12k">₹8k - ₹12,000</option>
                    <option value="12k-18k">₹12k - ₹18,000</option>
                    <option value="above18k">₹18,000+</option>
                  </select>
                </div>
              </div>

              {/* Primary Search CTA */}
              <div className="md:col-span-2">
                <button
                  type="submit"
                  id="hero-search-btn"
                  className="w-full h-full min-h-[52px] rounded-2xl bg-indigo-600 text-white font-bold text-sm flex items-center justify-center gap-2 hover:bg-indigo-700 active:scale-95 transition-all shadow-lg shadow-indigo-200 cursor-pointer"
                >
                  <Search className="h-4 w-4" />
                  <span>Search</span>
                </button>
              </div>
            </div>

            {/* Quick Filter Localities Pills */}
            <div className="mt-3.5 pt-3 border-t border-zinc-100 flex flex-wrap items-center gap-2 text-xs">
              <span className="font-semibold text-zinc-600 flex items-center gap-1">
                <SlidersHorizontal className="h-3 w-3" /> Popular in {selectedCity}:
              </span>
              {quickLocalities.map((loc) => (
                <button
                  key={loc}
                  type="button"
                  onClick={() => setSearchQuery(loc)}
                  className={`rounded-full px-3 py-1 font-medium transition-all ${
                    searchQuery === loc
                      ? "bg-indigo-600 text-white font-semibold"
                      : "bg-zinc-100 text-zinc-700 hover:bg-zinc-200"
                  }`}
                >
                  {loc}
                </button>
              ))}
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery("")}
                  className="text-xs text-rose-500 hover:underline font-semibold ml-auto"
                >
                  Clear search
                </button>
              )}
            </div>
          </form>

          {/* Quick CTAs for Both Journeys */}
          <div className="mt-4 flex flex-col sm:flex-row items-center justify-center gap-4">
            <a
              href="#pg-section"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-xl bg-indigo-50 border border-indigo-200/80 px-5 py-2.5 text-xs font-bold text-indigo-700 hover:bg-indigo-100 transition-colors"
            >
              <span>Explore Verified PGs Near You</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </a>
            <a
              href="#roommate-section"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-xl bg-violet-50 border border-violet-200/80 px-5 py-2.5 text-xs font-bold text-violet-700 hover:bg-violet-100 transition-colors"
            >
              <span>Explore Flatmate Requirements</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </a>
          </div>
        </div>

        {/* Trust Badges Bar */}
        <div className="mt-12 grid grid-cols-2 md:grid-cols-4 gap-4 max-w-4xl mx-auto pt-6 border-t border-zinc-200/60 text-center">
          <div className="flex items-center justify-center gap-2 text-zinc-700 text-xs font-semibold">
            <ShieldCheck className="h-4 w-4 text-emerald-600" />
            <span>100% Verified Properties</span>
          </div>
          <div className="flex items-center justify-center gap-2 text-zinc-700 text-xs font-semibold">
            <CheckCircle2 className="h-4 w-4 text-indigo-600" />
            <span>Direct Owner & Seeker Connect</span>
          </div>
          <div className="flex items-center justify-center gap-2 text-zinc-700 text-xs font-semibold">
            <CheckCircle2 className="h-4 w-4 text-amber-600" />
            <span>Zero Brokerage Fees</span>
          </div>
          <div className="flex items-center justify-center gap-2 text-zinc-700 text-xs font-semibold">
            <Sparkles className="h-4 w-4 text-violet-600" />
            <span>Verified Flatmate Match</span>
          </div>
        </div>
      </div>
    </section>
  );
}
