"use client";

import { useState } from "react";
import Link from "next/link";
import {
  MapPin,
  Search,
  User,
  Menu,
  X,
  ChevronDown,
  Home,
  Users,
  PlusCircle,
  Building2,
  ShieldCheck,
} from "lucide-react";
import { CITIES } from "@/data/mockData";

interface HeaderProps {
  selectedCity: string;
  onSelectCity: (city: string) => void;
  onOpenAuth: () => void;
  onSearchClick: () => void;
}

export function Header({
  selectedCity,
  onSelectCity,
  onOpenAuth,
  onSearchClick,
}: HeaderProps) {
  const [isCityDropdownOpen, setIsCityDropdownOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-40 w-full border-b border-zinc-200 bg-white/95 backdrop-blur-md transition-all">
      <div className="mx-auto flex h-18 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Brand & City Selector */}
        <div className="flex items-center gap-6">
          <Link href="/" className="flex items-center gap-2 group">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-tr from-indigo-600 to-violet-500 text-white shadow-md shadow-indigo-100 transition-transform group-hover:scale-105">
              <Building2 className="h-5 w-5" />
            </div>
            <div className="flex flex-col">
              <span className="text-xl font-bold tracking-tight text-zinc-900 group-hover:text-indigo-600 transition-colors">
                RoomNest<span className="text-indigo-600 font-black">.</span>
              </span>
              <span className="text-[10px] font-medium tracking-wider uppercase text-zinc-600">
                PG & Roommate Platform
              </span>
            </div>
          </Link>

          {/* City Selector Dropdown */}
          <div className="relative hidden md:block">
            <button
              type="button"
              id="city-selector-btn"
              onClick={() => setIsCityDropdownOpen(!isCityDropdownOpen)}
              className="flex items-center gap-2 rounded-full border border-zinc-200 bg-zinc-50/80 px-3.5 py-1.5 text-xs font-semibold text-zinc-700 hover:bg-zinc-100 hover:border-zinc-300 transition-all cursor-pointer"
            >
              <MapPin className="h-3.5 w-3.5 text-indigo-600" />
              <span>{selectedCity}</span>
              <ChevronDown className="h-3.5 w-3.5 text-zinc-600" />
            </button>

            {isCityDropdownOpen && (
              <div className="absolute left-0 mt-2 w-48 rounded-2xl border border-zinc-100 bg-white p-2 shadow-xl ring-1 ring-black/5 animate-in fade-in slide-in-from-top-2">
                <div className="px-3 py-1.5 text-[11px] font-bold uppercase tracking-wider text-zinc-600">
                  Select your city
                </div>
                <div className="space-y-1">
                  {CITIES.map((city) => (
                    <button
                      key={city}
                      onClick={() => {
                        onSelectCity(city);
                        setIsCityDropdownOpen(false);
                      }}
                      className={`flex w-full items-center justify-between rounded-xl px-3 py-2 text-left text-sm font-medium transition-colors ${
                        selectedCity === city
                          ? "bg-indigo-50 text-indigo-600 font-semibold"
                          : "text-zinc-600 hover:bg-zinc-50 hover:text-zinc-900"
                      }`}
                    >
                      <span>{city}</span>
                      {selectedCity === city && (
                        <span className="h-1.5 w-1.5 rounded-full bg-indigo-600" />
                      )}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Desktop Quick Nav Links */}
        <nav className="hidden lg:flex items-center gap-8 text-sm font-medium text-zinc-600">
          <a
            href="#pg-section"
            className="flex items-center gap-2 hover:text-indigo-600 transition-colors"
          >
            <Home className="h-4 w-4 text-indigo-500" />
            <span>Find a PG</span>
          </a>
          <a
            href="#roommate-section"
            className="flex items-center gap-2 hover:text-indigo-600 transition-colors"
          >
            <Users className="h-4 w-4 text-violet-500" />
            <span>Find a Roommate</span>
          </a>
          <a
            href="#how-it-works"
            className="hover:text-indigo-600 transition-colors"
          >
            How It Works
          </a>
          <a
            href="#map-section"
            className="hover:text-indigo-600 transition-colors"
          >
            Map View
          </a>
        </nav>

        {/* Right Actions */}
        <div className="flex items-center gap-3">
          {/* Quick Search Button */}
          <button
            onClick={onSearchClick}
            aria-label="Quick Search"
            className="flex items-center gap-2 rounded-full border border-zinc-200 bg-zinc-50 px-3.5 py-2 text-xs font-medium text-zinc-600 hover:border-zinc-300 hover:bg-zinc-100 transition-all"
          >
            <Search className="h-4 w-4 text-zinc-600" />
            <span className="hidden sm:inline">Search PG or Roommate...</span>
          </button>

          {/* Post Listing CTA (Demo button) */}
          <button
            onClick={onOpenAuth}
            className="hidden sm:inline-flex items-center gap-1.5 rounded-full bg-zinc-900 px-4 py-2 text-xs font-semibold text-white hover:bg-zinc-800 transition-all shadow-sm"
          >
            <PlusCircle className="h-3.5 w-3.5" />
            <span>Post Need</span>
          </button>

          {/* User Profile / Login */}
          <button
            id="login-btn"
            onClick={onOpenAuth}
            className="flex items-center gap-2 rounded-full border border-indigo-200 bg-indigo-50/50 px-3.5 py-2 text-xs font-semibold text-indigo-700 hover:bg-indigo-100/70 transition-all"
          >
            <User className="h-4 w-4 text-indigo-600" />
            <span className="hidden md:inline">Sign In</span>
          </button>

          {/* Mobile Menu Toggle */}
          <button
            type="button"
            aria-label="Toggle Navigation Menu"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="flex lg:hidden h-10 w-10 items-center justify-center rounded-xl border border-zinc-200 text-zinc-600 hover:bg-zinc-50"
          >
            {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Menu Dropdown */}
      {mobileMenuOpen && (
        <div className="border-t border-zinc-100 bg-white px-4 py-6 shadow-lg lg:hidden space-y-4">
          <div className="space-y-1">
            <div className="text-xs font-semibold uppercase tracking-wider text-zinc-600 px-2 py-1">
              Select City
            </div>
            <div className="grid grid-cols-2 gap-2">
              {CITIES.map((city) => (
                <button
                  key={city}
                  onClick={() => {
                    onSelectCity(city);
                    setMobileMenuOpen(false);
                  }}
                  className={`rounded-xl px-3 py-2 text-xs font-medium text-left transition-colors ${
                    selectedCity === city
                      ? "bg-indigo-600 text-white font-semibold"
                      : "bg-zinc-50 text-zinc-700 hover:bg-zinc-100"
                  }`}
                >
                  {city}
                </button>
              ))}
            </div>
          </div>

          <div className="border-t border-zinc-100 pt-4 space-y-2">
            <a
              href="#pg-section"
              onClick={() => setMobileMenuOpen(false)}
              className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold text-zinc-800 hover:bg-zinc-50"
            >
              <Home className="h-5 w-5 text-indigo-600" />
              <span>Find a PG</span>
            </a>
            <a
              href="#roommate-section"
              onClick={() => setMobileMenuOpen(false)}
              className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold text-zinc-800 hover:bg-zinc-50"
            >
              <Users className="h-5 w-5 text-violet-600" />
              <span>Find a Roommate</span>
            </a>
            <a
              href="#map-section"
              onClick={() => setMobileMenuOpen(false)}
              className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold text-zinc-800 hover:bg-zinc-50"
            >
              <MapPin className="h-5 w-5 text-emerald-600" />
              <span>Map View</span>
            </a>
            <a
              href="#how-it-works"
              onClick={() => setMobileMenuOpen(false)}
              className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold text-zinc-800 hover:bg-zinc-50"
            >
              <ShieldCheck className="h-5 w-5 text-amber-600" />
              <span>How It Works</span>
            </a>
          </div>

          <div className="pt-2">
            <button
              onClick={() => {
                setMobileMenuOpen(false);
                onOpenAuth();
              }}
              className="w-full rounded-xl bg-indigo-600 py-3 text-center text-sm font-semibold text-white shadow-md shadow-indigo-100"
            >
              Sign In / Create Account
            </button>
          </div>
        </div>
      )}
    </header>
  );
}
