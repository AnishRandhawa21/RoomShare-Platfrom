"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  MapPin,
  User,
  Menu,
  X,
  ChevronDown,
  Home,
  Users,
  Building2,
  ShieldCheck,
  Bookmark,
  MessageSquare,
} from "lucide-react";
import { getAuthSessionAction, getDiscoveryCitiesAction } from "@/actions/auth";
import { createClient } from "@/lib/supabase/client";

interface HeaderProps {
  selectedCity?: string;
  cities?: string[];
  onSelectCity?: (city: string) => void;
  onOpenAuth?: () => void;
  onSearchClick?: () => void;
  currentUser?: {
    id: string;
    email: string | null;
    role?: string | null;
    profile?: { fullName: string; avatarUrl: string | null } | null;
  } | null;
}

export function Header({
  selectedCity: controlledCity,
  cities,
  onSelectCity,
  onSearchClick,
  currentUser: initialCurrentUser,
}: HeaderProps) {
  const [currentUser, setCurrentUser] = useState(initialCurrentUser);
  const [dynamicCities, setDynamicCities] = useState<string[]>(cities || []);

  useEffect(() => {
    if (initialCurrentUser) {
      setCurrentUser(initialCurrentUser);
    }
  }, [initialCurrentUser]);

  // Robust client-side auth self-healing and real-time synchronization
  useEffect(() => {
    let isCancelled = false;

    // Proactively verify / self-heal session from server cookies if missing or on mount
    getAuthSessionAction()
      .then((user) => {
        if (!isCancelled && user) {
          setCurrentUser(user);
        }
      })
      .catch(() => {});

    // Listen to real-time client auth changes (login, logout, token refresh)
    try {
      const supabase = createClient();
      const {
        data: { subscription },
      } = supabase.auth.onAuthStateChange(async (event, session) => {
        if (isCancelled) return;
        if (event === "SIGNED_OUT") {
          setCurrentUser(null);
        } else if (session?.user || event === "SIGNED_IN" || event === "TOKEN_REFRESHED") {
          const freshUser = await getAuthSessionAction();
          if (!isCancelled && freshUser) {
            setCurrentUser(freshUser);
          }
        }
      });

      return () => {
        isCancelled = true;
        subscription.unsubscribe();
      };
    } catch {
      return () => {
        isCancelled = true;
      };
    }
  }, []);

  useEffect(() => {
    if (cities && cities.length > 0) {
      setDynamicCities(cities);
    } else {
      getDiscoveryCitiesAction()
        .then((list) => {
          if (list && list.length > 0) setDynamicCities(list);
        })
        .catch(() => {});
    }
  }, [cities]);

  const availableCities =
    dynamicCities.length > 0
      ? dynamicCities
      : ["Jalandhar", "Phagwara"];

  const [internalCity, setInternalCity] = useState(availableCities[0] || "Jalandhar");
  const selectedCity = controlledCity || internalCity;
  const [isCityDropdownOpen, setIsCityDropdownOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleSelectCity = (city: string) => {
    if (onSelectCity) {
      onSelectCity(city);
    } else {
      setInternalCity(city);
    }
    setIsCityDropdownOpen(false);
  };


  return (
    <header className="sticky top-0 z-40 w-full border-b border-zinc-200/80 bg-white/95 backdrop-blur-md transition-all">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        
        {/* Left: Brand Identity & City Selector */}
        <div className="flex items-center gap-3 sm:gap-4 shrink-0 min-w-0">
          <Link href="/" className="flex items-center gap-2.5 group">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-tr from-violet-600 to-indigo-600 text-white shadow-sm shadow-violet-200 transition-transform group-hover:scale-105">
              <Building2 className="h-4.5 w-4.5" />
            </div>
            <div className="flex flex-col">
              <span className="text-lg font-black tracking-tight text-zinc-950 group-hover:text-violet-600 transition-colors leading-tight">
                StayKro<span className="text-violet-600">.</span>
              </span>
              <span className="text-[9px] font-bold tracking-wider uppercase text-zinc-400 hidden sm:block leading-none mt-0.5">
                PG & Roommate Platform
              </span>
            </div>
          </Link>

          {/* Subtle Vertical Divider */}
          <div className="h-5 w-px bg-zinc-200 hidden md:block" />

          {/* City Selector Dropdown */}
          <div className="relative hidden md:block">
            <button
              type="button"
              id="city-selector-btn"
              onClick={() => setIsCityDropdownOpen(!isCityDropdownOpen)}
              className="flex items-center gap-1.5 rounded-full border border-zinc-200/90 bg-zinc-50 px-3 py-1.5 text-xs font-semibold text-zinc-700 hover:bg-zinc-100 hover:border-zinc-300 transition-all cursor-pointer"
            >
              <MapPin className="h-3.5 w-3.5 text-violet-600 shrink-0" />
              <span>{selectedCity}</span>
              <ChevronDown className="h-3 w-3 text-zinc-400" />
            </button>

            {isCityDropdownOpen && (
              <div className="absolute left-0 mt-2 w-48 rounded-2xl border border-zinc-200 bg-white p-2 shadow-xl ring-1 ring-black/5 animate-in fade-in slide-in-from-top-2 z-50">
                <div className="px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-zinc-400">
                  Select your city
                </div>
                <div className="space-y-0.5 max-h-64 overflow-y-auto pr-0.5">
                  {availableCities.map((city) => (
                    <button
                      key={city}
                      onClick={() => handleSelectCity(city)}
                      className={`flex w-full items-center justify-between rounded-xl px-3 py-2 text-left text-xs font-semibold transition-colors cursor-pointer ${
                        selectedCity.toLowerCase() === city.toLowerCase()
                          ? "bg-violet-50 text-violet-700 font-bold"
                          : "text-zinc-600 hover:bg-zinc-50 hover:text-zinc-900"
                      }`}
                    >
                      <span>{city}</span>
                      {selectedCity.toLowerCase() === city.toLowerCase() && (
                        <span className="h-1.5 w-1.5 rounded-full bg-violet-600" />
                      )}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Animated Trust / Zero Brokerage Badge moved to Header */}
          <div className="hidden lg:inline-flex items-center gap-1.5 rounded-full border border-emerald-200/90 bg-emerald-50/80 px-2.5 py-1 text-[11px] font-semibold text-emerald-900 shadow-2xs">
            <span className="flex h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>Zero Brokerage</span>
          </div>
        </div>

        {/* Center: Desktop Navigation Links (Center Aligned, Clean & Spacious) */}
        <nav className="hidden md:flex items-center justify-center gap-1.5 lg:gap-3 mx-4">
          <Link
            href="/#discovery-section"
            className="flex items-center gap-2 px-4 py-2 text-xs sm:text-sm font-semibold text-zinc-700 hover:text-zinc-950 hover:bg-zinc-100/80 rounded-full transition-all whitespace-nowrap"
          >
            <Home className="h-4 w-4 text-violet-600 shrink-0" />
            <span>Find a PG</span>
          </Link>

          <Link
            href="/roommates"
            className="flex items-center gap-2 px-4 py-2 text-xs sm:text-sm font-semibold text-zinc-700 hover:text-zinc-950 hover:bg-zinc-100/80 rounded-full transition-all whitespace-nowrap"
          >
            <Users className="h-4 w-4 text-violet-600 shrink-0" />
            <span>Find Roommates</span>
          </Link>

          {/* Role-gated owner and admin links */}
          {currentUser && (currentUser.role === "OWNER" || currentUser.role === "ADMIN") && (
            <Link
              href="/owner/properties"
              className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs sm:text-sm font-bold text-emerald-700 bg-emerald-50/80 hover:bg-emerald-100 rounded-full transition-all whitespace-nowrap border border-emerald-200"
            >
              <Building2 className="h-4 w-4 text-emerald-600 shrink-0" />
              <span>Owner Hub</span>
            </Link>
          )}

          {currentUser && currentUser.role === "ADMIN" && (
            <Link
              href="/admin/invitations"
              className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs sm:text-sm font-bold text-rose-700 bg-rose-50/80 hover:bg-rose-100 rounded-full transition-all whitespace-nowrap border border-rose-200"
            >
              <ShieldCheck className="h-4 w-4 text-rose-600 shrink-0" />
              <span>Admin</span>
            </Link>
          )}
        </nav>

        {/* Right: Actions Cluster (Chat, Saved, Profile / Sign In) */}
        <div className="flex items-center gap-2 sm:gap-2.5 shrink-0">
          {currentUser && (
            <div className="flex items-center gap-1.5">
              {/* Chat / Messages Link */}
              <Link
                href="/chat"
                title="Roommate Chats"
                className="flex h-9 w-9 items-center justify-center rounded-full border border-zinc-200 bg-zinc-50 text-zinc-600 hover:text-violet-700 hover:border-violet-300 hover:bg-violet-50 transition-all cursor-pointer shadow-2xs"
              >
                <MessageSquare className="h-4.5 w-4.5" />
              </Link>

              {/* Saved Listings Link */}
              <Link
                href="/saved"
                title="Saved Listings"
                className="flex h-9 w-9 items-center justify-center rounded-full border border-zinc-200 bg-zinc-50 text-zinc-600 hover:text-rose-600 hover:border-rose-300 hover:bg-rose-50 transition-all cursor-pointer shadow-2xs"
              >
                <Bookmark className="h-4.5 w-4.5" />
              </Link>
            </div>
          )}

          {/* User Profile / Sign In Pill */}
          {currentUser ? (
            <Link
              id="profile-nav-btn"
              href="/profile"
              className="flex items-center gap-2 rounded-full border border-violet-200/90 bg-violet-50/70 hover:bg-violet-100/80 pl-1.5 pr-3.5 py-1.5 text-xs font-bold text-violet-950 transition-all shadow-2xs hover:shadow-xs cursor-pointer ml-1"
            >
              <div className="flex h-6.5 w-6.5 items-center justify-center rounded-full bg-violet-600 text-[11px] font-black text-white shadow-2xs">
                {currentUser.profile?.fullName ? currentUser.profile.fullName[0].toUpperCase() : "U"}
              </div>
              <span className="truncate max-w-[130px] font-semibold text-xs text-zinc-900 hidden sm:inline">
                {currentUser.profile?.fullName || "My Account"}
              </span>
            </Link>
          ) : (
            <Link
              id="login-btn"
              href="/login"
              className="flex items-center gap-2 rounded-full border border-zinc-200 bg-white hover:bg-zinc-50 px-4 py-2 text-xs font-bold text-zinc-800 transition-all shadow-2xs hover:shadow-xs cursor-pointer ml-1"
            >
              <User className="h-4 w-4 text-zinc-500" />
              <span>Sign In</span>
            </Link>
          )}

          {/* Mobile Menu Toggle */}
          <button
            type="button"
            aria-label="Toggle Navigation Menu"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="flex md:hidden h-9 w-9 items-center justify-center rounded-xl border border-zinc-200 text-zinc-600 hover:bg-zinc-50 ml-1 cursor-pointer"
          >
            {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Menu Dropdown */}
      {mobileMenuOpen && (
        <div className="border-t border-zinc-100 bg-white px-4 py-5 shadow-xl md:hidden space-y-4 animate-in fade-in slide-in-from-top-2">
          {/* Mobile City Selector */}
          <div className="space-y-1.5">
            <div className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 px-1">
              Select City
            </div>
            <div className="grid grid-cols-2 gap-2 max-h-48 overflow-y-auto pr-1">
              {availableCities.map((city) => (
                <button
                  key={city}
                  onClick={() => {
                    handleSelectCity(city);
                    setMobileMenuOpen(false);
                  }}
                  className={`rounded-xl px-3 py-2 text-xs font-semibold text-left transition-colors cursor-pointer ${
                    selectedCity.toLowerCase() === city.toLowerCase()
                      ? "bg-violet-600 text-white font-bold"
                      : "bg-zinc-50 text-zinc-700 hover:bg-zinc-100"
                  }`}
                >
                  {city}
                </button>
              ))}
            </div>
          </div>

          {/* Mobile Navigation Links */}
          <div className="border-t border-zinc-100 pt-3 space-y-1">
            <Link
              href="/#discovery-section"
              onClick={() => setMobileMenuOpen(false)}
              className="flex items-center gap-3 rounded-xl px-3 py-2 text-xs font-semibold text-zinc-800 hover:bg-zinc-50"
            >
              <Home className="h-4 w-4 text-violet-600" />
              <span>Find a PG</span>
            </Link>

            <Link
              href="/roommates"
              onClick={() => setMobileMenuOpen(false)}
              className="flex items-center gap-3 rounded-xl px-3 py-2 text-xs font-semibold text-zinc-800 hover:bg-zinc-50"
            >
              <Users className="h-4 w-4 text-violet-600" />
              <span>Find Roommates</span>
            </Link>

            {currentUser && (
              <Link
                href="/chat"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center gap-3 rounded-xl px-3 py-2 text-xs font-semibold text-zinc-800 hover:bg-zinc-50"
              >
                <MessageSquare className="h-4 w-4 text-violet-600" />
                <span>My Roommate Chats</span>
              </Link>
            )}

            <Link
              href="/saved"
              onClick={() => setMobileMenuOpen(false)}
              className="flex items-center gap-3 rounded-xl px-3 py-2 text-xs font-semibold text-zinc-800 hover:bg-zinc-50"
            >
              <Bookmark className="h-4 w-4 text-rose-600" />
              <span>My Saved Listings</span>
            </Link>

            {currentUser && (currentUser.role === "OWNER" || currentUser.role === "ADMIN") && (
              <Link
                href="/owner/properties"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center gap-3 rounded-xl px-3 py-2 text-xs font-bold text-emerald-700 bg-emerald-50/60 hover:bg-emerald-100"
              >
                <Building2 className="h-4 w-4 text-emerald-600" />
                <span>Owner Hub & PG Management</span>
              </Link>
            )}

            {currentUser && currentUser.role === "ADMIN" && (
              <Link
                href="/admin/invitations"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center gap-3 rounded-xl px-3 py-2 text-xs font-bold text-rose-700 bg-rose-50/60 hover:bg-rose-100"
              >
                <ShieldCheck className="h-4 w-4 text-rose-600" />
                <span>Admin Panel (Owner Invites)</span>
              </Link>
            )}
          </div>

          {/* Profile CTA */}
          <div className="pt-2 border-t border-zinc-100">
            {currentUser ? (
              <Link
                href="/profile"
                onClick={() => setMobileMenuOpen(false)}
                className="w-full flex items-center justify-center gap-2 rounded-xl bg-violet-600 py-2.5 text-center text-xs font-bold text-white shadow-sm shadow-violet-200"
              >
                <span>My Profile ({currentUser.profile?.fullName || "Account"})</span>
              </Link>
            ) : (
              <Link
                href="/login"
                onClick={() => setMobileMenuOpen(false)}
                className="w-full flex items-center justify-center gap-2 rounded-xl bg-violet-600 py-2.5 text-center text-xs font-bold text-white shadow-sm shadow-violet-200"
              >
                <span>Sign In / Create Account</span>
              </Link>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
