"use client";

import { useState } from "react";
import {
  Search,
  CheckCircle2,
  Key,
  Users,
  MessageSquare,
  ShieldCheck,
  Building,
  ArrowRight,
} from "lucide-react";

export function HowItWorksSection() {
  const [activeWorkflow, setActiveWorkflow] = useState<"pg" | "roommate">("pg");

  const pgSteps = [
    {
      step: "01",
      icon: Search,
      title: "Discover & Filter PGs",
      description:
        "Filter by single/sharing room, meal preferences, proximity to tech parks, or metro stations with accurate monthly pricing.",
    },
    {
      step: "02",
      icon: ShieldCheck,
      title: "Inspect Verified Listings",
      description:
        "Every PG on our platform has verified photos, transparent room pricing, confirmed food menus, and zero hidden charges.",
    },
    {
      step: "03",
      icon: Key,
      title: "Direct Connect & Move-in",
      description:
        "Schedule a quick visit or book directly with the property manager. Pay zero brokerage fees and move in hassle-free.",
    },
  ];

  const roommateSteps = [
    {
      step: "01",
      icon: Users,
      title: "Post or Browse Needs",
      description:
        "Post your vacancy (e.g. 'Need 1 roommate in 2-seater') or browse verified flatmate requests in your target neighborhood.",
    },
    {
      step: "02",
      icon: MessageSquare,
      title: "Check Lifestyle Compatibility",
      description:
        "Review verified profiles, office affiliations, sleeping habits, food preferences, and rent expectations upfront.",
    },
    {
      step: "03",
      icon: CheckCircle2,
      title: "Team Up & Split Rent",
      description:
        "Connect directly with prospective roommates, visit the apartment together, split the deposit, and move in with peace of mind.",
    },
  ];

  const currentSteps = activeWorkflow === "pg" ? pgSteps : roommateSteps;

  return (
    <section id="how-it-works" className="py-14 sm:py-20 bg-zinc-50/50">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto">
          <div className="inline-flex items-center gap-1.5 rounded-full bg-indigo-50 px-3.5 py-1 text-xs font-bold text-indigo-700">
            <span>Simple 3-Step Process</span>
          </div>
          <h2 className="mt-3 text-3xl font-extrabold tracking-tight text-zinc-950 sm:text-4xl">
            How RoomNest Works
          </h2>
          <p className="mt-2 text-sm sm:text-base text-zinc-500">
            Whether you want a fully managed PG stay or a compatible roommate to share an apartment, we make it effortless.
          </p>

          {/* Workflow Toggle */}
          <div className="mt-8 inline-flex rounded-2xl bg-zinc-200/70 p-1.5">
            <button
              onClick={() => setActiveWorkflow("pg")}
              className={`flex items-center gap-2 rounded-xl px-5 py-2.5 text-xs font-bold transition-all cursor-pointer ${
                activeWorkflow === "pg"
                  ? "bg-white text-indigo-600 shadow-sm"
                  : "text-zinc-600 hover:text-zinc-900"
              }`}
            >
              <Building className="h-4 w-4" />
              <span>For Finding a PG</span>
            </button>
            <button
              onClick={() => setActiveWorkflow("roommate")}
              className={`flex items-center gap-2 rounded-xl px-5 py-2.5 text-xs font-bold transition-all cursor-pointer ${
                activeWorkflow === "roommate"
                  ? "bg-white text-violet-600 shadow-sm"
                  : "text-zinc-600 hover:text-zinc-900"
              }`}
            >
              <Users className="h-4 w-4" />
              <span>For Finding a Roommate</span>
            </button>
          </div>
        </div>

        {/* Steps Grid */}
        <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-8">
          {currentSteps.map((s, idx) => {
            const Icon = s.icon;
            return (
              <div
                key={idx}
                className="relative rounded-3xl bg-white p-8 border border-zinc-200/90 shadow-sm hover:shadow-md transition-shadow"
              >
                <div className="flex items-center justify-between">
                  <div
                    className={`flex h-12 w-12 items-center justify-center rounded-2xl text-white font-bold ${
                      activeWorkflow === "pg"
                        ? "bg-indigo-600 shadow-md shadow-indigo-100"
                        : "bg-violet-600 shadow-md shadow-violet-100"
                    }`}
                  >
                    <Icon className="h-6 w-6" />
                  </div>
                  <span className="text-3xl font-black text-zinc-200">
                    {s.step}
                  </span>
                </div>

                <h3 className="mt-6 text-lg font-bold text-zinc-900">
                  {s.title}
                </h3>
                <p className="mt-2 text-sm text-zinc-500 leading-relaxed">
                  {s.description}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
