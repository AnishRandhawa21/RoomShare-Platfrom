"use client";

import Image from "next/image";
import Link from "next/link";
import { ShieldCheck } from "lucide-react";

export function AuthVisualShowcase() {
  return (
    <div className="relative h-full w-full flex flex-col justify-between p-8 sm:p-12 xl:p-16 select-none">
      {/* Brand Header */}
      <div className="flex items-center justify-between z-10">
        <Link
          href="/"
          className="flex items-center gap-3 group focus:outline-none focus-visible:ring-2 focus-visible:ring-[#00412E] rounded-2xl"
        >
          <div className="relative flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl overflow-hidden bg-white shadow-xs border border-[#E8EAE5] transition-transform group-hover:scale-105">
            <Image
              src="/logo.png"
              alt="StayKro Logo"
              width={44}
              height={44}
              className="h-full w-full object-contain p-1"
              priority
            />
          </div>
          <div>
            <span className="text-xl font-black tracking-tight text-[#00412E] transition-colors">
              StayKro<span className="text-[#96BF8A]">.</span>
            </span>
            <p className="text-[10px] font-semibold text-zinc-500 uppercase tracking-wider">
              PGs • Rooms • Flatmates
            </p>
          </div>
        </Link>

        <div className="hidden xl:inline-flex items-center gap-1.5 text-xs font-semibold text-zinc-600 bg-white/75 px-3 py-1.5 rounded-full border border-[#E8EAE5] backdrop-blur-xs">
          <ShieldCheck className="h-3.5 w-3.5 text-[#00412E]" />
          <span>Zero Brokerage Platform</span>
        </div>
      </div>

      {/* Lower-Left Marketing Typography Area (Sitting Naturally on Background) */}
      <div className="z-10 mt-auto pt-16 max-w-xl">
        <h1 className="text-4xl sm:text-5xl lg:text-[52px] xl:text-[58px] font-black tracking-tight text-[#00412E] leading-[1.08]">
          Find a place<br />
          that feels like<br />
          <span className="text-glow-wave">home.</span>
        </h1>

        <p className="mt-5 text-base sm:text-lg text-zinc-600 font-normal leading-relaxed max-w-md">
          Discover verified PGs, rooms, and compatible roommates.
        </p>

        {/* Small Decorative Horizontal Accent */}
        <div className="mt-6 flex items-center gap-2">
          <span className="h-1 w-12 rounded-full bg-[#00412E]" />
          <span className="h-1 w-3.5 rounded-full bg-[#96BF8A]" />
          <span className="h-1 w-1.5 rounded-full bg-[#E8EAE5]" />
        </div>

        {/* Subtle Identity Pillars */}
        <div className="mt-8 flex flex-wrap items-center gap-x-6 gap-y-2 text-xs font-semibold text-zinc-600">
          <div className="inline-flex items-center gap-1.5">
            <span className="text-[#00412E] font-bold">✦</span>
            <span>Verified Properties</span>
          </div>
          <div className="inline-flex items-center gap-1.5">
            <span className="text-[#00412E] font-bold">✦</span>
            <span>Direct Host Contact</span>
          </div>
          <div className="inline-flex items-center gap-1.5">
            <span className="text-[#00412E] font-bold">✦</span>
            <span>Roommate Compatibility</span>
          </div>
        </div>
      </div>
    </div>
  );
}
