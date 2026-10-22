"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  ShieldCheck,
  CheckCircle2,
  Users,
  Building2,
  Phone,
  Mail,
  MapPin,
  Clock,
  ArrowRight,
  MessageSquare,
  Sparkles,
  BadgePercent,
  Compass,
  Check,
  Zap,
  Wifi,
  Utensils,
  Key,
  HelpCircle,
  ExternalLink,
  ChevronDown,
  Code2,
  Heart,
} from "lucide-react";
import { STAYKRO_CONTACT_CONFIG } from "@/config/contact";

export function AboutClient() {
  const [activeTab, setActiveTab] = useState<"tenants" | "hosts">("tenants");
  const [openFaq, setOpenFaq] = useState<number | null>(0);

  const faqs = [
    {
      question: "Is StayKro really 100% free with zero brokerage?",
      answer:
        "Yes, absolutely. Students and tenants never pay any brokerage, convenience, or visiting fees on StayKro. You connect directly with the property host and pay your rent directly to them without any middleman cut.",
    },
    {
      question: "How do I contact a PG owner to schedule a visit?",
      answer:
        "Every listing features verified owner contact details. You can click 'Call Owner' to ring them directly or tap 'WhatsApp Chat' to message them instantly, ask about room availability, and schedule a free in-person visit.",
    },
    {
      question: "How does the Roommate Matching feature work?",
      answer:
        "Our roommate board allows students to post or browse requirements filtered by university campus, budget, sleep schedule (night owl vs early bird), dietary preferences (pure veg / non-veg), and cleanliness habits so you move in with someone compatible.",
    },
    {
      question: "I am a PG or hostel owner. How can I list my property?",
      answer:
        "You can list your property by clicking 'List Your Property' in the navigation bar or messaging our host onboarding desk on WhatsApp at +91 84930 12280. Listing your rooms is completely free with zero commission on tenant inquiries.",
    },
    {
      question: "Are the property photos and amenities genuine?",
      answer:
        "Properties displaying our 'Verified' mark have been reviewed for authentic photos, realistic room configurations, operational Wi-Fi, meal policies, and stated gate closing times.",
    },
    {
      question: "Which areas and campuses does StayKro currently cover?",
      answer:
        "StayKro is currently active in Punjab, focusing heavily on student hubs in Jalandhar and Phagwara (near Lovely Professional University / LPU), with ongoing expansion to Chandigarh, Mohali, and Delhi NCR.",
    },
    {
      question: "Who is behind StayKro?",
      answer:
        "StayKro is designed, engineered, and maintained by solo developer Anish Randhawa based in Punjab. You can reach out directly via WhatsApp or email for feedback, feature suggestions, or support.",
    },
  ];

  return (
    <div className="bg-white text-zinc-900 selection:bg-[#96BF8A]/30 selection:text-[#00412E]">
      {/* 1. Hero Section with Ambient Glow */}
      <section className="relative overflow-hidden bg-gradient-to-b from-[#eff4ec]/90 via-[#fcfdfa] to-white pt-16 pb-20 sm:pt-24 sm:pb-28 border-b border-[#E8EAE5]">
        {/* Soft Ambient Radial Accents */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-full pointer-events-none overflow-hidden">
          <div className="absolute -top-24 left-1/4 w-96 h-96 rounded-full bg-[#96BF8A]/25 blur-3xl" />
          <div className="absolute top-1/3 right-1/4 w-80 h-80 rounded-full bg-[#00412E]/10 blur-3xl" />
        </div>

        <div className="relative mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 text-center space-y-6">
          <div className="inline-flex items-center gap-2 rounded-full border border-[#96BF8A]/70 bg-white/95 px-4 py-1.5 text-xs font-bold text-[#00412E] shadow-xs backdrop-blur-md">
            <span className="flex h-2 w-2 rounded-full bg-[#00412E] animate-pulse" />
            <span>Built in Punjab • Dedicated to Zero Brokerage</span>
          </div>

          <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black tracking-tight text-zinc-950 leading-[1.12]">
            Rethinking How India&apos;s Students Find{" "}
            <span className="bg-gradient-to-r from-[#00412E] via-[#00694a] to-[#96BF8A] bg-clip-text text-transparent">
              PGs & Roommates.
            </span>
          </h1>

          <p className="text-base sm:text-xl text-zinc-600 max-w-2xl mx-auto leading-relaxed font-normal">
            No middleman brokers. No fabricated photos. No arbitrary fees.
            Just verified accommodations, direct WhatsApp connect with hosts, and genuine roommate matching.
          </p>

          <div className="flex flex-wrap items-center justify-center gap-3 pt-3">
            <Link
              href="/#discovery-section"
              className="rounded-2xl bg-[#00412E] px-6 py-3.5 text-sm font-bold text-white shadow-md hover:bg-[#002d20] transition-all flex items-center gap-2 hover:scale-[1.02] active:scale-[0.98]"
            >
              <span>Explore Verified PGs</span>
              <ArrowRight className="h-4 w-4" />
            </Link>

            <Link
              href="/roommates"
              className="rounded-2xl border border-zinc-300 bg-white px-6 py-3.5 text-sm font-bold text-zinc-800 hover:border-[#00412E] hover:text-[#00412E] shadow-2xs transition-all hover:bg-zinc-50"
            >
              Find Roommates
            </Link>

            <Link
              href="/become-owner"
              className="rounded-2xl border border-[#96BF8A]/80 bg-[#eff4ec] px-6 py-3.5 text-sm font-bold text-[#00412E] hover:bg-[#dce7d8] transition-all"
            >
              List Property (Free)
            </Link>
          </div>
        </div>

        {/* Floating Visual Preview Card */}
        <div className="relative mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 mt-12 sm:mt-16">
          <div className="rounded-3xl border border-[#96BF8A]/40 bg-gradient-to-br from-[#002419] via-[#003424] to-[#00412E] p-6 sm:p-8 text-white shadow-2xl relative overflow-hidden">
            <div className="absolute -top-12 -right-12 w-64 h-64 rounded-full bg-[#96BF8A]/10 blur-2xl pointer-events-none" />

            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-white/10 pb-6">
              <div className="flex items-center gap-3">
                <div className="h-11 w-11 rounded-2xl bg-white p-1 shadow-md flex items-center justify-center shrink-0">
                  <Image
                    src="/logo.png"
                    alt="StayKro Logo"
                    width={36}
                    height={36}
                    className="object-contain"
                  />
                </div>
                <div>
                  <h3 className="font-extrabold text-base sm:text-lg text-white">StayKro Platform</h3>
                  <p className="text-xs text-[#96BF8A] font-medium">
                    Verified Coliving Network • Official Domain: staykro.in
                  </p>
                </div>
              </div>

              <div className="inline-flex items-center gap-2 rounded-full bg-[#96BF8A]/20 border border-[#96BF8A]/40 px-3 py-1 text-xs font-bold text-[#96BF8A]">
                <ShieldCheck className="h-3.5 w-3.5" />
                <span>100% Zero Brokerage Policy</span>
              </div>
            </div>

            {/* 3 Highlight Strips */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-6">
              <div className="rounded-2xl bg-black/25 border border-white/10 p-4 space-y-2 backdrop-blur-xs">
                <div className="flex items-center gap-2 text-xs font-bold text-[#96BF8A]">
                  <MessageSquare className="h-4 w-4" />
                  <span>Direct Owner WhatsApp</span>
                </div>
                <p className="text-xs text-zinc-300 leading-relaxed">
                  Connect straight to the PG owner to verify rent, food plans, and schedule visits.
                </p>
              </div>

              <div className="rounded-2xl bg-black/25 border border-white/10 p-4 space-y-2 backdrop-blur-xs">
                <div className="flex items-center gap-2 text-xs font-bold text-[#96BF8A]">
                  <Utensils className="h-4 w-4" />
                  <span>Clear Food & Amenity Info</span>
                </div>
                <p className="text-xs text-zinc-300 leading-relaxed">
                  Real photos, meal menus, Wi-Fi speeds, and gate closing rules published openly.
                </p>
              </div>

              <div className="rounded-2xl bg-black/25 border border-white/10 p-4 space-y-2 backdrop-blur-xs">
                <div className="flex items-center gap-2 text-xs font-bold text-[#96BF8A]">
                  <Users className="h-4 w-4" />
                  <span>Lifestyle Roommate Match</span>
                </div>
                <p className="text-xs text-zinc-300 leading-relaxed">
                  Filter by study schedule, dietary choices (veg/non-veg), and university campus.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 2. The Story Behind StayKro */}
      <section className="py-16 sm:py-24 border-b border-zinc-200/80">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 space-y-12">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
            {/* Story Text */}
            <div className="lg:col-span-7 space-y-5">
              <div className="inline-flex items-center gap-1.5 rounded-full bg-[#eff4ec] px-3.5 py-1 text-xs font-bold text-[#00412E]">
                <Compass className="h-3.5 w-3.5" />
                <span>Our Origin & Purpose</span>
              </div>

              <h2 className="text-2xl sm:text-4xl font-extrabold tracking-tight text-zinc-950">
                Created to Solve What Every College Student Faces
              </h2>

              <p className="text-sm sm:text-base text-zinc-600 leading-relaxed">
                When students arrive in major educational centers like{" "}
                <strong className="text-zinc-900">Jalandhar, Phagwara (near LPU), and Chandigarh</strong>,
                their very first challenge is finding a decent place to live.
              </p>

              <p className="text-sm sm:text-base text-zinc-600 leading-relaxed">
                Local street brokers frequently charge between 15 days to a full month of rent just for
                showing standard rooms. Photos online often look nothing like reality, gate timings are
                concealed until agreements are signed, and finding a compatible roommate is left entirely
                to chance.
              </p>

              <div className="p-4 rounded-2xl bg-zinc-50 border border-zinc-200 space-y-2">
                <div className="text-xs font-bold uppercase tracking-wider text-[#00412E]">
                  Our Promise to You
                </div>
                <p className="text-xs sm:text-sm text-zinc-700 leading-relaxed">
                  StayKro is built with a simple conviction: <strong>no student should pay brokerage fees to find a home.</strong> We make owner contacts freely available and help you find genuine roommates before committing to a lease.
                </p>
              </div>
            </div>

            {/* Visual Box */}
            <div className="lg:col-span-5 space-y-4">
              <div className="rounded-3xl border border-zinc-200 bg-zinc-50 p-6 sm:p-8 space-y-4 shadow-xs">
                <div className="h-10 w-10 rounded-2xl bg-[#00412E] text-white flex items-center justify-center font-bold">
                  🌿
                </div>

                <h3 className="text-lg font-bold text-zinc-950">
                  StayKro Operating Hub
                </h3>

                <p className="text-xs sm:text-sm text-zinc-600 leading-relaxed">
                  Headquartered in <strong>Punjab</strong>, actively serving students around
                  universities in <strong>Jalandhar & Phagwara</strong>, with ongoing expansion to
                  <strong> Chandigarh, Mohali, and Delhi NCR</strong>.
                </p>

                <div className="pt-2 border-t border-zinc-200 space-y-2 text-xs">
                  <div className="flex items-center justify-between text-zinc-600">
                    <span>Direct WhatsApp & Call:</span>
                    <a
                      href={STAYKRO_CONTACT_CONFIG.phoneTel}
                      className="font-bold text-[#00412E] hover:underline"
                    >
                      {STAYKRO_CONTACT_CONFIG.phoneDisplay}
                    </a>
                  </div>
                  <div className="flex items-center justify-between text-zinc-600">
                    <span>Email Support:</span>
                    <a
                      href={STAYKRO_CONTACT_CONFIG.emailMailto}
                      className="font-bold text-zinc-900 hover:underline"
                    >
                      {STAYKRO_CONTACT_CONFIG.email}
                    </a>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 3. A Note from the Solo Developer: Anish Randhawa */}
      <section className="py-16 sm:py-24 border-b border-zinc-200/80 bg-zinc-50/50">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
          <div className="rounded-3xl border border-[#96BF8A]/40 bg-gradient-to-br from-[#002419] to-[#00412E] p-8 sm:p-12 text-white shadow-xl relative overflow-hidden">
            <div className="absolute top-0 right-0 w-80 h-80 rounded-full bg-[#96BF8A]/10 blur-3xl pointer-events-none" />

            <div className="relative space-y-6">
              <div className="inline-flex items-center gap-2 rounded-full bg-[#96BF8A]/20 border border-[#96BF8A]/40 px-3.5 py-1 text-xs font-bold text-[#96BF8A]">
                <Code2 className="h-3.5 w-3.5" />
                <span>Solo Developer Project</span>
              </div>

              <h2 className="text-2xl sm:text-3xl font-extrabold text-white">
                Built Independently by Anish Randhawa
              </h2>

              <div className="space-y-4 text-sm sm:text-base text-zinc-200 leading-relaxed font-normal">
                <p>
                  StayKro is not a venture-backed corporate firm with layers of management. It is designed, coded, and maintained independently by a solo developer, <strong>Anish Randhawa</strong>, right here in Punjab.
                </p>
                <p>
                  Having observed students moving to towns like Phagwara and Jalandhar only to be exploited by local street brokers charging up to a full month&apos;s rent for basic rooms, I decided to build StayKro from scratch to put students and tenants first.
                </p>
                <p>
                  Every single feature—from the direct WhatsApp owner connect and transparent room policies to the habit-matched roommate board—is built to make student accommodation honest, straightforward, and zero-brokerage.
                </p>
              </div>

              <div className="pt-4 border-t border-white/10 flex flex-wrap items-center justify-between gap-4">
                <div>
                  <p className="text-sm font-bold text-white">Anish Randhawa</p>
                  <p className="text-xs text-[#96BF8A]">Creator & Developer, StayKro</p>
                </div>

                <div className="flex flex-wrap items-center gap-2.5">
                  <a
                    href={STAYKRO_CONTACT_CONFIG.emailMailto}
                    className="rounded-xl bg-white/10 hover:bg-white/20 border border-white/20 px-3.5 py-2 text-xs font-semibold text-white transition-colors flex items-center gap-1.5"
                  >
                    <Mail className="h-3.5 w-3.5" />
                    <span>{STAYKRO_CONTACT_CONFIG.email}</span>
                  </a>
                  <a
                    href={STAYKRO_CONTACT_CONFIG.whatsappUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="rounded-xl bg-[#25D366] hover:bg-[#20ba59] px-3.5 py-2 text-xs font-bold text-white transition-colors flex items-center gap-1.5 shadow-sm"
                  >
                    <MessageSquare className="h-3.5 w-3.5" />
                    <span>Chat with Anish</span>
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 4. Bento Grid: 4 Core Pillars */}
      <section className="py-16 sm:py-24 border-b border-zinc-200/80">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 space-y-12">
          <div className="text-center max-w-2xl mx-auto space-y-3">
            <div className="inline-flex items-center gap-1.5 rounded-full bg-[#eff4ec] px-3.5 py-1 text-xs font-bold text-[#00412E]">
              <Sparkles className="h-3.5 w-3.5" />
              <span>Platform Pillars</span>
            </div>
            <h2 className="text-2xl sm:text-4xl font-extrabold tracking-tight text-zinc-950">
              The 4 Pillars of StayKro
            </h2>
            <p className="text-sm text-zinc-600">
              Built on transparency, community, and zero-fee connections.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="rounded-3xl border border-zinc-200 bg-white p-7 shadow-xs hover:border-[#96BF8A] transition-all space-y-4">
              <div className="h-12 w-12 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 flex items-center justify-center">
                <BadgePercent className="h-6 w-6" />
              </div>
              <h3 className="text-lg sm:text-xl font-bold text-zinc-950">
                100% Zero Brokerage Forever
              </h3>
              <p className="text-xs sm:text-sm text-zinc-600 leading-relaxed">
                Contact details of property owners are accessible directly via WhatsApp and
                direct calls at no cost. You pay zero brokerage fees to StayKro.
              </p>
            </div>

            <div className="rounded-3xl border border-zinc-200 bg-white p-7 shadow-xs hover:border-[#96BF8A] transition-all space-y-4">
              <div className="h-12 w-12 rounded-2xl bg-blue-50 border border-blue-200 text-blue-800 flex items-center justify-center">
                <ShieldCheck className="h-6 w-6" />
              </div>
              <h3 className="text-lg sm:text-xl font-bold text-zinc-950">
                Verified Listing Standards
              </h3>
              <p className="text-xs sm:text-sm text-zinc-600 leading-relaxed">
                Every PG listing details room occupancy options (Single, 2-Sharing, 3-Sharing),
                meal availability, Wi-Fi, AC/Cooler provisions, and clear gate closing guidelines.
              </p>
            </div>

            <div className="rounded-3xl border border-zinc-200 bg-white p-7 shadow-xs hover:border-[#96BF8A] transition-all space-y-4">
              <div className="h-12 w-12 rounded-2xl bg-amber-50 border border-amber-200 text-amber-800 flex items-center justify-center">
                <Users className="h-6 w-6" />
              </div>
              <h3 className="text-lg sm:text-xl font-bold text-zinc-950">
                Intelligent Roommate Board
              </h3>
              <p className="text-xs sm:text-sm text-zinc-600 leading-relaxed">
                Filter potential roommates by dietary preferences (pure veg / non-veg), night owl vs early bird
                sleep habits, and campus location.
              </p>
            </div>

            <div className="rounded-3xl border border-zinc-200 bg-white p-7 shadow-xs hover:border-[#96BF8A] transition-all space-y-4">
              <div className="h-12 w-12 rounded-2xl bg-purple-50 border border-purple-200 text-purple-800 flex items-center justify-center">
                <Building2 className="h-6 w-6" />
              </div>
              <h3 className="text-lg sm:text-xl font-bold text-zinc-950">
                Free Host Onboarding
              </h3>
              <p className="text-xs sm:text-sm text-zinc-600 leading-relaxed">
                PG owners and managers can list their accommodations without paying listing fees.
                Receive direct inquiries from students without paying broker cuts.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 5. How It Works Tabs */}
      <section className="py-16 sm:py-24 border-b border-zinc-200/80 bg-zinc-50/60">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 space-y-10">
          <div className="text-center max-w-2xl mx-auto space-y-4">
            <h2 className="text-2xl sm:text-4xl font-extrabold tracking-tight text-zinc-950">
              How StayKro Works
            </h2>

            <div className="inline-flex rounded-2xl bg-zinc-200/70 p-1 border border-zinc-300">
              <button
                type="button"
                onClick={() => setActiveTab("tenants")}
                className={`rounded-xl px-5 py-2 text-xs sm:text-sm font-bold transition-all cursor-pointer ${
                  activeTab === "tenants"
                    ? "bg-white text-[#00412E] shadow-2xs"
                    : "text-zinc-600 hover:text-zinc-950"
                }`}
              >
                For Students & Tenants
              </button>
              <button
                type="button"
                onClick={() => setActiveTab("hosts")}
                className={`rounded-xl px-5 py-2 text-xs sm:text-sm font-bold transition-all cursor-pointer ${
                  activeTab === "hosts"
                    ? "bg-white text-[#00412E] shadow-2xs"
                    : "text-zinc-600 hover:text-zinc-950"
                }`}
              >
                For Property Hosts
              </button>
            </div>
          </div>

          {activeTab === "tenants" ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="rounded-3xl border border-zinc-200 bg-white p-6 sm:p-7 space-y-3">
                <span className="text-2xl font-black text-[#00412E] font-mono">01</span>
                <h3 className="text-base font-bold text-zinc-950">Search Verified PGs</h3>
                <p className="text-xs sm:text-sm text-zinc-600 leading-relaxed">
                  Filter by your campus, city, sharing preference (Single, Double, Triple), meal plan, and budget.
                </p>
              </div>

              <div className="rounded-3xl border border-zinc-200 bg-white p-6 sm:p-7 space-y-3">
                <span className="text-2xl font-black text-[#00412E] font-mono">02</span>
                <h3 className="text-base font-bold text-zinc-950">Direct WhatsApp Visit</h3>
                <p className="text-xs sm:text-sm text-zinc-600 leading-relaxed">
                  Tap to chat directly with the owner, request a video walkthrough, or arrange an in-person visit.
                </p>
              </div>

              <div className="rounded-3xl border border-zinc-200 bg-white p-6 sm:p-7 space-y-3">
                <span className="text-2xl font-black text-[#00412E] font-mono">03</span>
                <h3 className="text-base font-bold text-zinc-950">Find Your Roommate</h3>
                <p className="text-xs sm:text-sm text-zinc-600 leading-relaxed">
                  Post or browse roommate requests to split rent with people who share your sleep and study habits.
                </p>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="rounded-3xl border border-zinc-200 bg-white p-6 sm:p-7 space-y-3">
                <span className="text-2xl font-black text-[#00412E] font-mono">01</span>
                <h3 className="text-base font-bold text-zinc-950">List Your PG Free</h3>
                <p className="text-xs sm:text-sm text-zinc-600 leading-relaxed">
                  Add photos, rent configurations, food inclusion status, and house guidelines in minutes.
                </p>
              </div>

              <div className="rounded-3xl border border-zinc-200 bg-white p-6 sm:p-7 space-y-3">
                <span className="text-2xl font-black text-[#00412E] font-mono">02</span>
                <h3 className="text-base font-bold text-zinc-950">Get Direct Inquiries</h3>
                <p className="text-xs sm:text-sm text-zinc-600 leading-relaxed">
                  Students connect directly to your mobile phone and WhatsApp. No middleman filtering your leads.
                </p>
              </div>

              <div className="rounded-3xl border border-zinc-200 bg-white p-6 sm:p-7 space-y-3">
                <span className="text-2xl font-black text-[#00412E] font-mono">03</span>
                <h3 className="text-base font-bold text-zinc-950">Fill Rooms Fast</h3>
                <p className="text-xs sm:text-sm text-zinc-600 leading-relaxed">
                  Keep your rooms occupied year-round without handing over hefty broker commissions.
                </p>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* 6. Frequently Asked Questions (FAQ) Section */}
      <section className="py-16 sm:py-24 border-b border-zinc-200/80">
        <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8 space-y-10">
          <div className="text-center space-y-2">
            <div className="inline-flex items-center gap-1.5 rounded-full bg-[#eff4ec] px-3.5 py-1 text-xs font-bold text-[#00412E]">
              <HelpCircle className="h-3.5 w-3.5" />
              <span>Got Questions?</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-zinc-950">
              Frequently Asked Questions (FAQ)
            </h2>
            <p className="text-sm text-zinc-600">
              Clear answers to the most common questions about StayKro.
            </p>
          </div>

          <div className="space-y-3">
            {faqs.map((faq, idx) => {
              const isOpen = openFaq === idx;
              return (
                <div
                  key={faq.question}
                  className="rounded-2xl border border-zinc-200 bg-white overflow-hidden transition-all shadow-2xs"
                >
                  <button
                    type="button"
                    onClick={() => setOpenFaq(isOpen ? null : idx)}
                    className="w-full p-5 text-left flex items-center justify-between gap-4 font-bold text-sm sm:text-base text-zinc-950 hover:text-[#00412E] transition-colors cursor-pointer"
                  >
                    <span>{faq.question}</span>
                    <ChevronDown
                      className={`h-4 w-4 shrink-0 text-zinc-500 transition-transform duration-200 ${
                        isOpen ? "rotate-180 text-[#00412E]" : ""
                      }`}
                    />
                  </button>

                  {isOpen && (
                    <div className="px-5 pb-5 text-xs sm:text-sm text-zinc-600 leading-relaxed border-t border-zinc-100 pt-3 animate-in fade-in duration-150">
                      {faq.answer}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* 7. Direct Contact Desk */}
      <section className="py-16 sm:py-24 bg-zinc-50">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 space-y-10">
          <div className="text-center space-y-2">
            <h2 className="text-2xl sm:text-3xl font-extrabold text-zinc-950">
              Get in Touch Directly
            </h2>
            <p className="text-sm text-zinc-600">
              Have a question about a listing or want to list your property? Reach us directly.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <a
              href={STAYKRO_CONTACT_CONFIG.phoneTel}
              className="rounded-2xl border border-zinc-200 bg-white p-5 hover:border-[#00412E] shadow-2xs transition-all group"
            >
              <div className="h-9 w-9 rounded-xl bg-[#00412E]/10 text-[#00412E] flex items-center justify-center group-hover:bg-[#00412E] group-hover:text-white transition-colors">
                <Phone className="h-4 w-4" />
              </div>
              <p className="text-xs text-zinc-500 font-semibold mt-3">Helpline</p>
              <p className="text-sm font-bold text-zinc-950">{STAYKRO_CONTACT_CONFIG.phoneDisplay}</p>
              <p className="text-[11px] text-zinc-400 mt-0.5">Mon–Sun, 9 AM – 9 PM</p>
            </a>

            <a
              href={STAYKRO_CONTACT_CONFIG.whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-2xl border border-emerald-200 bg-emerald-50/40 p-5 hover:border-emerald-500 shadow-2xs transition-all group"
            >
              <div className="h-9 w-9 rounded-xl bg-[#25D366] text-white flex items-center justify-center">
                <MessageSquare className="h-4 w-4" />
              </div>
              <p className="text-xs text-emerald-800 font-semibold mt-3">WhatsApp</p>
              <p className="text-sm font-bold text-emerald-950">Chat Instantly</p>
              <p className="text-[11px] text-emerald-700/80 mt-0.5">Quick responses</p>
            </a>

            <a
              href={STAYKRO_CONTACT_CONFIG.emailMailto}
              className="rounded-2xl border border-zinc-200 bg-white p-5 hover:border-[#00412E] shadow-2xs transition-all group"
            >
              <div className="h-9 w-9 rounded-xl bg-[#00412E]/10 text-[#00412E] flex items-center justify-center group-hover:bg-[#00412E] group-hover:text-white transition-colors">
                <Mail className="h-4 w-4" />
              </div>
              <p className="text-xs text-zinc-500 font-semibold mt-3">Email</p>
              <p className="text-sm font-bold text-zinc-950 truncate">{STAYKRO_CONTACT_CONFIG.email}</p>
              <p className="text-[11px] text-zinc-400 mt-0.5">Direct founder desk</p>
            </a>

            <div className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-2xs">
              <div className="h-9 w-9 rounded-xl bg-[#00412E]/10 text-[#00412E] flex items-center justify-center">
                <MapPin className="h-4 w-4" />
              </div>
              <p className="text-xs text-zinc-500 font-semibold mt-3">Operations</p>
              <p className="text-sm font-bold text-zinc-950">Punjab, India</p>
              <p className="text-[11px] text-zinc-400 mt-0.5">Jalandhar & Phagwara</p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
