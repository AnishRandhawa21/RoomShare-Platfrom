"use client";

import { useState, useMemo } from "react";
import { Header } from "@/components/layout/Header";
import { Hero } from "@/components/home/Hero";
import { PGSection } from "@/components/home/PGSection";
import { RoommateSection } from "@/components/home/RoommateSection";
import { MapPlaceholderSection } from "@/components/home/MapPlaceholderSection";
import { HowItWorksSection } from "@/components/home/HowItWorksSection";
import { PopularLocationsSection } from "@/components/home/PopularLocationsSection";
import { WhyUsSection } from "@/components/home/WhyUsSection";
import { Footer } from "@/components/layout/Footer";
import { PropertyModal } from "@/components/home/PropertyModal";
import { RoommateModal } from "@/components/home/RoommateModal";
import { AuthModal } from "@/components/layout/AuthModal";
import { MOCK_PGS, MOCK_ROOMMATES } from "@/data/mockData";
import { PGProperty, RoommateRequest } from "@/types";

export default function HomePage() {
  const [selectedCity, setSelectedCity] = useState<string>("Bengaluru");
  const [activeJourney, setActiveJourney] = useState<"pg" | "roommate">("pg");
  const [searchQuery, setSearchQuery] = useState<string>("");

  // Modals state
  const [selectedPG, setSelectedPG] = useState<PGProperty | null>(null);
  const [selectedRoommate, setSelectedRoommate] = useState<RoommateRequest | null>(null);
  const [isAuthOpen, setIsAuthOpen] = useState<boolean>(false);

  // Quick localities based on selected city
  const quickLocalities = useMemo(() => {
    switch (selectedCity) {
      case "Bengaluru":
        return ["Koramangala", "HSR Layout", "Indiranagar", "Whitefield", "Electronic City"];
      case "Pune":
        return ["Hinjawadi", "Viman Nagar", "Wakad", "Baner", "Kothrud"];
      case "Gurugram":
        return ["Cyber Hub", "DLF Phase 2", "Sector 48", "Golf Course Road"];
      case "Hyderabad":
        return ["Gachibowli", "Madhapur", "Hitec City", "Kondapur"];
      default:
        return ["City Center", "Tech Park Zone", "Metro Corridor"];
    }
  }, [selectedCity]);

  // Filtered PGs
  const displayedPGs = useMemo(() => {
    return MOCK_PGS.filter((pg) => {
      const matchesCity =
        pg.city.toLowerCase() === selectedCity.toLowerCase() ||
        searchQuery.trim().length > 0;
      const matchesQuery =
        !searchQuery.trim() ||
        pg.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        pg.locality.toLowerCase().includes(searchQuery.toLowerCase()) ||
        pg.city.toLowerCase().includes(searchQuery.toLowerCase());

      return matchesCity && matchesQuery;
    });
  }, [selectedCity, searchQuery]);

  // Filtered Roommates
  const displayedRoommates = useMemo(() => {
    return MOCK_ROOMMATES.filter((req) => {
      const matchesCity =
        req.city.toLowerCase() === selectedCity.toLowerCase() ||
        searchQuery.trim().length > 0;
      const matchesQuery =
        !searchQuery.trim() ||
        req.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        req.locality.toLowerCase().includes(searchQuery.toLowerCase()) ||
        req.roomType.toLowerCase().includes(searchQuery.toLowerCase());

      return matchesCity && matchesQuery;
    });
  }, [selectedCity, searchQuery]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (activeJourney === "pg") {
      const el = document.getElementById("pg-section");
      el?.scrollIntoView({ behavior: "smooth" });
    } else {
      const el = document.getElementById("roommate-section");
      el?.scrollIntoView({ behavior: "smooth" });
    }
  };

  const handleSelectLocality = (locality: string, city: string) => {
    setSelectedCity(city);
    setSearchQuery(locality);
    const target = activeJourney === "pg" ? "pg-section" : "roommate-section";
    document.getElementById(target)?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <div className="min-h-screen flex flex-col bg-white text-zinc-900 selection:bg-indigo-100 selection:text-indigo-900">
      {/* 1. Header Navigation */}
      <Header
        selectedCity={selectedCity}
        onSelectCity={(city) => {
          setSelectedCity(city);
          setSearchQuery("");
        }}
        onOpenAuth={() => setIsAuthOpen(true)}
        onSearchClick={() => {
          document.getElementById("locality-input")?.focus();
        }}
      />

      <main className="flex-1">
        {/* 2. Hero Section with Dual Journeys & Search */}
        <Hero
          activeTab={activeJourney}
          setActiveTab={setActiveJourney}
          selectedCity={selectedCity}
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          onSearchSubmit={handleSearchSubmit}
          quickLocalities={quickLocalities}
        />

        {/* 3. Journey 1: Find A PG Section */}
        <PGSection
          properties={displayedPGs}
          selectedCity={selectedCity}
          onViewProperty={(property) => setSelectedPG(property)}
        />

        {/* 4. Journey 2: Find A Roommate Section */}
        <RoommateSection
          requests={displayedRoommates}
          selectedCity={selectedCity}
          onViewRequest={(request) => setSelectedRoommate(request)}
          onPostRequest={() => setIsAuthOpen(true)}
        />

        {/* 5. Map Preview Section (Placeholder per specs, no MapLibre yet) */}
        <MapPlaceholderSection
          onSelectProperty={(property) => setSelectedPG(property)}
        />

        {/* 6. Popular Locations */}
        <PopularLocationsSection onSelectLocality={handleSelectLocality} />

        {/* 7. How It Works Section */}
        <HowItWorksSection />

        {/* 8. Why Use The Platform */}
        <WhyUsSection />
      </main>

      {/* 9. Footer */}
      <Footer />

      {/* Interactive Detail Modals */}
      <PropertyModal
        property={selectedPG}
        onClose={() => setSelectedPG(null)}
      />

      <RoommateModal
        request={selectedRoommate}
        onClose={() => setSelectedRoommate(null)}
      />

      <AuthModal
        isOpen={isAuthOpen}
        onClose={() => setIsAuthOpen(false)}
      />
    </div>
  );
}
