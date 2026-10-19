"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
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
import { getUnreadMessagesStatusAction } from "@/actions/chat";
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
  const [hasUnreadMessages, setHasUnreadMessages] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  // Zero-load sync for unread chat status (WebSocket-driven + paused on hidden tabs)
  useEffect(() => {
    if (!currentUser) {
      setHasUnreadMessages(false);
      setUnreadCount(0);
      return;
    }

    // 1. Initial check & window focus trigger
    const checkUnread = async () => {
      // Zero DB load when tab is hidden / minimized
      if (typeof document !== "undefined" && document.hidden) return;

      try {
        const res = await getUnreadMessagesStatusAction();
        setHasUnreadMessages(res.hasUnread);
        setUnreadCount(res.unreadCount);
      } catch {
        // non-critical
      }
    };

    checkUnread();

    // 2. WebSocket listener for instant zero-DB-query notification
    let notifChannel: any = null;
    let supabase: any = null;
    try {
      if (process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
        supabase = createClient();
        notifChannel = supabase.channel(`user_notif_${currentUser.id}`, {
          config: { broadcast: { ack: false } },
        });

        notifChannel.on("broadcast", { event: "incoming_chat" }, () => {
          setHasUnreadMessages(true);
          setUnreadCount((prev) => prev + 1);
        });

        notifChannel.subscribe();
      }
    } catch (err) {
      console.warn("Header realtime notification skipped:", err);
    }

    // 3. Relaxed low-frequency fallback (every 45s instead of 10s, saves ~80% DB load)
    const interval = setInterval(checkUnread, 45000);

    const onVisible = () => {
      if (typeof document !== "undefined" && !document.hidden) {
        checkUnread();
      }
    };

    window.addEventListener("focus", onVisible);
    document.addEventListener("visibilitychange", onVisible);

    return () => {
      clearInterval(interval);
      window.removeEventListener("focus", onVisible);
      document.removeEventListener("visibilitychange", onVisible);
      if (supabase && notifChannel) {
        supabase.removeChannel(notifChannel);
      }
    };
  }, [currentUser]);

  const handleSelectCity = (city: string) => {
    if (onSelectCity) {
      onSelectCity(city);
    } else {
      setInternalCity(city);
    }
    setIsCityDropdownOpen(false);
  };


  return (
    <header className="sticky top-0 z-40 w-full border-b border-[#E8EAE5] bg-white/95 backdrop-blur-md transition-all">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        
        {/* Left: Brand Identity & City Selector */}
        <div className="flex items-center gap-3 sm:gap-4 shrink-0 min-w-0">
          <Link href="/" className="flex items-center gap-2.5 group">
            <div className="relative flex h-10 w-10 shrink-0 items-center justify-center rounded-xl overflow-hidden bg-white shadow-xs border border-[#E8EAE5] transition-transform group-hover:scale-105">
              <Image
                src="/logo.png"
                alt="StayKro Logo"
                width={40}
                height={40}
                className="h-full w-full object-contain p-0.5"
                priority
              />
            </div>
            <div className="flex flex-col">
              <span className="text-lg font-black tracking-tight text-zinc-950 group-hover:text-[#00412E] transition-colors leading-tight">
                StayKro<span className="text-[#96BF8A]">.</span>
              </span>
              <span className="text-[9px] font-bold tracking-wider uppercase text-zinc-400 hidden sm:block leading-none mt-0.5">
                PG & Roommate Platform
              </span>
            </div>
          </Link>

          {/* Subtle Vertical Divider */}
          <div className="h-5 w-px bg-[#E8EAE5] hidden md:block" />

          {/* City Selector Dropdown */}
          <div className="relative hidden md:block">
            <button
              type="button"
              id="city-selector-btn"
              onClick={() => setIsCityDropdownOpen(!isCityDropdownOpen)}
              className="flex items-center gap-1.5 rounded-full border border-[#E8EAE5] bg-[#E8EAE5]/50 px-3 py-1.5 text-xs font-semibold text-zinc-700 hover:bg-[#E8EAE5] hover:border-[#96BF8A] transition-all cursor-pointer"
            >
              <MapPin className="h-3.5 w-3.5 text-[#00412E] shrink-0" />
              <span>{selectedCity}</span>
              <ChevronDown className="h-3 w-3 text-zinc-400" />
            </button>

            {isCityDropdownOpen && (
              <div className="absolute left-0 mt-2 w-48 rounded-2xl border border-[#E8EAE5] bg-white p-2 shadow-xl ring-1 ring-black/5 animate-in fade-in slide-in-from-top-2 z-50">
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
                          ? "bg-[#eff4ec] text-[#00412E] font-bold"
                          : "text-zinc-600 hover:bg-[#E8EAE5]/40 hover:text-zinc-900"
                      }`}
                    >
                      <span>{city}</span>
                      {selectedCity.toLowerCase() === city.toLowerCase() && (
                        <span className="h-1.5 w-1.5 rounded-full bg-[#00412E]" />
                      )}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Animated Trust / Zero Brokerage Badge */}
          <div className="hidden lg:inline-flex items-center gap-1.5 rounded-full border border-[#96BF8A]/40 bg-[#E8EAE5]/60 px-2.5 py-1 text-[11px] font-bold text-[#00412E] shadow-2xs">
            <span className="flex h-2 w-2 rounded-full bg-[#96BF8A] animate-pulse" />
            <span>Zero Brokerage</span>
          </div>
        </div>

        {/* Center: Desktop Navigation Links (Center Aligned, Clean & Spacious) */}
        <nav className="hidden md:flex items-center justify-center gap-1.5 lg:gap-3 mx-4">
          <Link
            href="/#discovery-section"
            className="flex items-center gap-2 px-4 py-2 text-xs sm:text-sm font-semibold text-zinc-700 hover:text-[#00412E] hover:bg-[#E8EAE5]/50 rounded-full transition-all whitespace-nowrap"
          >
            <Home className="h-4 w-4 text-[#00412E] shrink-0" />
            <span>Find a PG</span>
          </Link>

          <Link
            href="/roommates"
            className="flex items-center gap-2 px-4 py-2 text-xs sm:text-sm font-semibold text-zinc-700 hover:text-[#00412E] hover:bg-[#E8EAE5]/50 rounded-full transition-all whitespace-nowrap"
          >
            <Users className="h-4 w-4 text-[#00412E] shrink-0" />
            <span>Find Roommates</span>
          </Link>

          {/* Role-gated owner and admin links */}
          {currentUser && (currentUser.role === "OWNER" || currentUser.role === "ADMIN") && (
            <Link
              href="/owner/properties"
              className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs sm:text-sm font-bold text-[#00412E] bg-[#eff4ec] hover:bg-[#dce7d8] rounded-full transition-all whitespace-nowrap border border-[#96BF8A]/40"
            >
              <Building2 className="h-4 w-4 text-[#00412E] shrink-0" />
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
              {/* Chat / Messages Link with Unread Indicator Dot */}
              <Link
                href="/chat"
                title={hasUnreadMessages ? `Roommate Chats (${unreadCount} new)` : "Roommate Chats"}
                className="relative flex h-9 w-9 items-center justify-center rounded-full border border-[#E8EAE5] bg-[#E8EAE5]/40 text-zinc-600 hover:text-[#00412E] hover:border-[#96BF8A] hover:bg-[#eff4ec] transition-all cursor-pointer shadow-2xs group"
              >
                <MessageSquare className="h-4.5 w-4.5" />
                {hasUnreadMessages && (
                  <span className="absolute -top-1 -right-1 flex h-3 w-3">
                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#96BF8A] opacity-75" />
                    <span className="relative inline-flex h-3 w-3 rounded-full bg-[#00412E] ring-2 ring-white" />
                  </span>
                )}
              </Link>

              {/* Saved Listings Link */}
              <Link
                href="/saved"
                title="Saved Listings"
                className="flex h-9 w-9 items-center justify-center rounded-full border border-[#E8EAE5] bg-[#E8EAE5]/40 text-zinc-600 hover:text-rose-600 hover:border-rose-300 hover:bg-rose-50 transition-all cursor-pointer shadow-2xs"
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
              className="flex items-center gap-2 rounded-full border border-[#96BF8A]/40 bg-[#eff4ec] hover:bg-[#dce7d8] pl-1.5 pr-3.5 py-1.5 text-xs font-bold text-[#00412E] transition-all shadow-2xs hover:shadow-xs cursor-pointer ml-1"
            >
              <div className="flex h-6.5 w-6.5 items-center justify-center rounded-full bg-[#00412E] text-[11px] font-black text-white shadow-2xs">
                {currentUser.profile?.fullName ? currentUser.profile.fullName[0].toUpperCase() : "U"}
              </div>
              <span className="truncate max-w-[130px] font-semibold text-xs text-[#00412E] hidden sm:inline">
                {currentUser.profile?.fullName || "My Account"}
              </span>
            </Link>
          ) : (
            <Link
              id="login-btn"
              href="/login"
              className="flex items-center gap-2 rounded-full border border-[#00412E] bg-[#00412E] hover:bg-[#002d20] px-4 py-2 text-xs font-bold text-white transition-all shadow-xs hover:shadow-sm cursor-pointer ml-1"
            >
              <User className="h-4 w-4 text-[#96BF8A]" />
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
                      ? "bg-[#00412E] text-white font-bold"
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
              <Home className="h-4 w-4 text-[#00412E]" />
              <span>Find a PG</span>
            </Link>

            <Link
              href="/roommates"
              onClick={() => setMobileMenuOpen(false)}
              className="flex items-center gap-3 rounded-xl px-3 py-2 text-xs font-semibold text-zinc-800 hover:bg-zinc-50"
            >
              <Users className="h-4 w-4 text-[#00412E]" />
              <span>Find Roommates</span>
            </Link>

            {currentUser && (
              <Link
                href="/chat"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center justify-between rounded-xl px-3 py-2 text-xs font-semibold text-zinc-800 hover:bg-zinc-50"
              >
                <div className="flex items-center gap-3">
                  <div className="relative">
                    <MessageSquare className="h-4 w-4 text-[#00412E]" />
                    {hasUnreadMessages && (
                      <span className="absolute -top-1 -right-1 h-2 w-2 rounded-full bg-[#96BF8A] ring-1 ring-white" />
                    )}
                  </div>
                  <span>My Roommate Chats</span>
                </div>
                {hasUnreadMessages && (
                  <span className="flex items-center gap-1.5 rounded-full bg-[#00412E] px-2.5 py-0.5 text-[10px] font-bold text-white shadow-2xs">
                    <span className="h-1.5 w-1.5 rounded-full bg-[#96BF8A] animate-pulse" />
                    <span>{unreadCount > 1 ? `${unreadCount} New` : "New"}</span>
                  </span>
                )}
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
                className="flex items-center gap-3 rounded-xl px-3 py-2 text-xs font-bold text-[#00412E] bg-[#eff4ec] hover:bg-[#dce7d8]"
              >
                <Building2 className="h-4 w-4 text-[#00412E]" />
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
                className="w-full flex items-center justify-center gap-2 rounded-xl bg-[#00412E] py-2.5 text-center text-xs font-bold text-white shadow-sm shadow-[#00412E]/20 hover:bg-[#002d20]"
              >
                <span>My Profile ({currentUser.profile?.fullName || "Account"})</span>
              </Link>
            ) : (
              <Link
                href="/login"
                onClick={() => setMobileMenuOpen(false)}
                className="w-full flex items-center justify-center gap-2 rounded-xl bg-[#00412E] py-2.5 text-center text-xs font-bold text-white shadow-sm shadow-[#00412E]/20 hover:bg-[#002d20]"
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
