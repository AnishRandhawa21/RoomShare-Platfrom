import type { Metadata } from "next";
import Link from "next/link";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { getCurrentUser } from "@/lib/auth/session";
import { getDiscoveryLocations } from "@/lib/discovery";
import { STAYKRO_CONTACT_CONFIG } from "@/config/contact";
import {
  ShieldCheck,
  Building2,
  Users,
  Lock,
  ArrowRight,
  Phone,
  Mail,
  FileText,
  BadgeCheck,
} from "lucide-react";

export const metadata: Metadata = {
  title: "Policies, Terms & Community Standards | StayKro",
  description:
    "Explore StayKro platform policies: Owner Listing Policies & 30-Day Pass Terms, Tenant Guidelines & Safety, and Zero Brokerage Guarantees.",
};

export const revalidate = 60;

export default async function PoliciesHubPage() {
  const [user, locationsData] = await Promise.all([
    getCurrentUser(),
    getDiscoveryLocations(),
  ]);

  const sanitizedUser = user
    ? {
        id: user.id,
        email: user.email,
        role: user.role,
        profile: user.profile
          ? {
              fullName: user.profile.fullName,
              avatarUrl: user.profile.avatarUrl,
            }
          : null,
      }
    : null;

  const cityNames = locationsData.cities.map((c) => c.name);

  return (
    <div className="min-h-screen flex flex-col bg-[#FDFDFD]">
      <Header cities={cityNames} currentUser={sanitizedUser} />

      <main className="flex-1 py-12 sm:py-16">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="text-center max-w-2xl mx-auto mb-12">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#00412E]/10 text-[#00412E] text-xs font-bold tracking-wide uppercase mb-3">
              <ShieldCheck className="h-3.5 w-3.5" />
              StayKro Platform Standards
            </div>
            <h1 className="text-3xl sm:text-4xl font-extrabold text-zinc-900 tracking-tight">
              Policies, Terms & Trust
            </h1>
            <p className="mt-3 text-sm sm:text-base text-zinc-600">
              Clear, transparent guidelines designed separately for our PG hosts and prospective tenants.
            </p>
          </div>

          {/* Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
            {/* Owner Policy Card */}
            <div className="rounded-3xl bg-white border border-[#E8EAE5] p-8 shadow-xs flex flex-col justify-between hover:shadow-md hover:border-[#00412E]/40 transition-all">
              <div>
                <div className="h-12 w-12 rounded-2xl bg-[#00412E]/10 text-[#00412E] flex items-center justify-center font-bold mb-6">
                  <Building2 className="h-6 w-6" />
                </div>
                <div className="inline-block px-2.5 py-0.5 rounded-full bg-[#00412E]/10 text-[#00412E] text-[11px] font-bold uppercase tracking-wider mb-2">
                  For Property Owners
                </div>
                <h2 className="text-xl font-bold text-zinc-900 mb-3">
                  Host & PG Owner Policies
                </h2>
                <p className="text-xs text-zinc-600 leading-relaxed mb-6">
                  Learn about our 30-Day Pay-per-License Pass model, automatic unpublishing upon pass expiry, genuine photography rules, tenant police verification, and zero brokerage obligations.
                </p>
                <ul className="space-y-2 text-xs text-zinc-600 mb-6">
                  <li className="flex items-center gap-2">
                    <BadgeCheck className="h-4 w-4 text-emerald-600" />
                    <span>30-Day Solo & Plus Pass billing terms</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <BadgeCheck className="h-4 w-4 text-emerald-600" />
                    <span>Non-recurring transparent payments</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <BadgeCheck className="h-4 w-4 text-emerald-600" />
                    <span>Listing accuracy & tenant safety rules</span>
                  </li>
                </ul>
              </div>

              <Link
                href="/policies/owner"
                className="w-full py-3 rounded-2xl bg-[#00412E] text-white font-bold text-xs hover:bg-[#003425] transition-all flex items-center justify-center gap-2 shadow-xs"
              >
                <span>Read Owner Policies</span>
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>

            {/* Tenant Policy Card */}
            <div className="rounded-3xl bg-white border border-[#E8EAE5] p-8 shadow-xs flex flex-col justify-between hover:shadow-md hover:border-emerald-500/40 transition-all">
              <div>
                <div className="h-12 w-12 rounded-2xl bg-emerald-50 text-emerald-700 flex items-center justify-center font-bold mb-6">
                  <Users className="h-6 w-6" />
                </div>
                <div className="inline-block px-2.5 py-0.5 rounded-full bg-emerald-100/60 text-emerald-800 text-[11px] font-bold uppercase tracking-wider mb-2">
                  For Tenants & Seekers
                </div>
                <h2 className="text-xl font-bold text-zinc-900 mb-3">
                  Tenant Policies & Guidelines
                </h2>
                <p className="text-xs text-zinc-600 leading-relaxed mb-6">
                  Understand our 100% Zero Brokerage promise, roommate search community etiquette, in-person property visit precautions, deposit security, and house rules.
                </p>
                <ul className="space-y-2 text-xs text-zinc-600 mb-6">
                  <li className="flex items-center gap-2">
                    <BadgeCheck className="h-4 w-4 text-emerald-600" />
                    <span>100% Zero Brokerage guarantee</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <BadgeCheck className="h-4 w-4 text-emerald-600" />
                    <span>Roommate finder code of conduct</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <BadgeCheck className="h-4 w-4 text-emerald-600" />
                    <span>Scam prevention & deposit safety</span>
                  </li>
                </ul>
              </div>

              <Link
                href="/policies/user"
                className="w-full py-3 rounded-2xl bg-emerald-700 text-white font-bold text-xs hover:bg-emerald-800 transition-all flex items-center justify-center gap-2 shadow-xs"
              >
                <span>Read Tenant Policies</span>
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>

          {/* Quick Contact Bar */}
          <div className="rounded-3xl bg-zinc-50 border border-zinc-200/80 p-6 sm:p-8 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div>
              <h3 className="text-sm font-bold text-zinc-900">
                Have questions regarding our policies or want to list your PG?
              </h3>
              <p className="text-xs text-zinc-500 mt-0.5">
                Reach out to our platform team anytime between {STAYKRO_CONTACT_CONFIG.operatingHours}.
              </p>
            </div>
            <div className="flex items-center gap-3 shrink-0">
              <a
                href={STAYKRO_CONTACT_CONFIG.phoneTel}
                className="px-4 py-2 rounded-xl bg-white border border-zinc-200 text-xs font-bold text-zinc-800 hover:bg-zinc-100 transition-colors flex items-center gap-1.5"
              >
                <Phone className="h-3.5 w-3.5 text-zinc-600" />
                <span>{STAYKRO_CONTACT_CONFIG.phoneDisplay}</span>
              </a>
              <Link
                href="/become-owner"
                className="px-4 py-2 rounded-xl bg-[#00412E] text-white text-xs font-bold hover:bg-[#003425] transition-colors"
              >
                Become an Owner
              </Link>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
