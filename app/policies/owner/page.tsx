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
  Clock,
  CreditCard,
  AlertTriangle,
  FileText,
  Phone,
  Mail,
  ArrowRight,
  CheckCircle2,
  BadgeAlert,
} from "lucide-react";

export const metadata: Metadata = {
  title: "PG Owner Listing Policies & 30-Day Pass Terms | StayKro",
  description:
    "Official listing policies, 30-day listing pass terms, verification standards, and safety guidelines for PG hosts and coliving property owners on StayKro.",
};

export const revalidate = 60;

export default async function OwnerPolicyPage() {
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
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
          {/* Breadcrumb / Top Bar */}
          <div className="flex items-center gap-2 text-xs text-zinc-500 mb-6">
            <Link href="/" className="hover:text-zinc-900">
              Home
            </Link>
            <span>/</span>
            <Link href="/policies" className="hover:text-zinc-900">
              Policies
            </Link>
            <span>/</span>
            <span className="text-zinc-900 font-semibold">Owner Policy</span>
          </div>

          {/* Header Card */}
          <div className="rounded-3xl bg-white border border-[#E8EAE5] p-6 sm:p-10 shadow-xs mb-8">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#00412E]/10 text-[#00412E] text-xs font-bold tracking-wide uppercase mb-4">
              <Building2 className="h-3.5 w-3.5" />
              For Property Owners & Coliving Hosts
            </div>
            <h1 className="text-2xl sm:text-4xl font-extrabold text-zinc-900 tracking-tight">
              Host Listing Policies & 30-Day Pass Terms
            </h1>
            <p className="mt-3 text-sm text-zinc-600 leading-relaxed">
              Last updated: October 2026. These policies govern all property listings,
              subscription passes, verification protocols, and host responsibilities on the StayKro platform.
            </p>

            {/* Quick Switch to User Policy */}
            <div className="mt-6 pt-6 border-t border-zinc-100 flex flex-wrap items-center justify-between gap-4">
              <span className="text-xs text-zinc-500">
                Looking for tenant and seeker guidelines instead?
              </span>
              <Link
                href="/policies/user"
                className="text-xs font-bold text-[#00412E] hover:underline flex items-center gap-1.5"
              >
                <span>Switch to Tenant & User Policies</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>
          </div>

          {/* Policy Sections */}
          <div className="space-y-8 text-zinc-700">
            {/* 1. 30-Day Listing Pass Model */}
            <section className="rounded-3xl bg-white border border-[#E8EAE5] p-6 sm:p-8 shadow-xs">
              <div className="flex items-center gap-3 mb-4">
                <div className="h-9 w-9 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center font-bold">
                  <CreditCard className="h-5 w-5" />
                </div>
                <h2 className="text-lg sm:text-xl font-bold text-zinc-900">
                  1. Transparent 30-Day Listing Pass Model
                </h2>
              </div>
              <p className="text-sm leading-relaxed mb-4">
                StayKro operates on a clean, pay-per-license model designed to protect owners from hidden fees and unexpected recurring credit card charges:
              </p>
              <ul className="space-y-3 text-sm">
                <li className="flex items-start gap-2.5">
                  <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
                  <span>
                    <strong>Non-Recurring Billing:</strong> Listing passes (StayKro Solo at ₹499/30 days and StayKro Plus at ₹999/30 days) are strictly one-time payments. We never auto-debit your bank account, card, or UPI.
                  </span>
                </li>
                <li className="flex items-start gap-2.5">
                  <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
                  <span>
                    <strong>Pass Expiry & Zero Data Loss:</strong> When your 30-day listing pass reaches expiration, your published listings automatically transition into <em>Draft / Inactive</em> status. Your photos, room types, pricing, and amenities remain completely safe and are never deleted.
                  </span>
                </li>
                <li className="flex items-start gap-2.5">
                  <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
                  <span>
                    <strong>Instant Reactivation:</strong> Whenever you have room vacancies, simply renew your pass from the Owner Hub to instantly make your property visible to seekers again.
                  </span>
                </li>
              </ul>
            </section>

            {/* 2. Zero Commission & Fair Pricing */}
            <section className="rounded-3xl bg-white border border-[#E8EAE5] p-6 sm:p-8 shadow-xs">
              <div className="flex items-center gap-3 mb-4">
                <div className="h-9 w-9 rounded-xl bg-blue-50 text-blue-700 flex items-center justify-center font-bold">
                  <ShieldCheck className="h-5 w-5" />
                </div>
                <h2 className="text-lg sm:text-xl font-bold text-zinc-900">
                  2. 100% Zero Commission & Direct Enquiries
                </h2>
              </div>
              <p className="text-sm leading-relaxed mb-4">
                StayKro provides a direct bridge between owners and tenants without broker fees:
              </p>
              <ul className="space-y-3 text-sm">
                <li className="flex items-start gap-2.5">
                  <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
                  <span>
                    <strong>Zero Rental Cut:</strong> StayKro charges 0% commission on room rent, security deposits, or booking amounts. All tenant payments go 100% directly to the owner.
                  </span>
                </li>
                <li className="flex items-start gap-2.5">
                  <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
                  <span>
                    <strong>Direct Leads:</strong> Interested students and professionals will call or message your verified WhatsApp number directly. You negotiate terms, schedule room visits, and finalize agreements directly.
                  </span>
                </li>
                <li className="flex items-start gap-2.5">
                  <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
                  <span>
                    <strong>Accurate Price Guarantee:</strong> The rent displayed on your listing must accurately match what you quote to prospective tenants. Bait-and-switch pricing or charging unauthorized broker fees is strictly prohibited.
                  </span>
                </li>
              </ul>
            </section>

            {/* 3. Property Verification & Photography */}
            <section className="rounded-3xl bg-white border border-[#E8EAE5] p-6 sm:p-8 shadow-xs">
              <div className="flex items-center gap-3 mb-4">
                <div className="h-9 w-9 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center font-bold">
                  <Building2 className="h-5 w-5" />
                </div>
                <h2 className="text-lg sm:text-xl font-bold text-zinc-900">
                  3. Genuine Photos & Amenities Guidelines
                </h2>
              </div>
              <ul className="space-y-3 text-sm">
                <li className="flex items-start gap-2.5">
                  <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
                  <span>
                    <strong>Authentic Photography:</strong> All photos uploaded must depict the actual building exterior, living rooms, bedrooms, and washrooms of the property. Stock imagery or photos of other properties are not permitted.
                  </span>
                </li>
                <li className="flex items-start gap-2.5">
                  <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
                  <span>
                    <strong>Listed Amenities:</strong> Every amenity ticked (e.g. Wi-Fi, Food/Meals, Geyser, Power Backup, RO Water, Air Conditioning) must be functional and actively provided to residents as represented.
                  </span>
                </li>
              </ul>
            </section>

            {/* 4. Safety & Tenant Welfare */}
            <section className="rounded-3xl bg-white border border-[#E8EAE5] p-6 sm:p-8 shadow-xs">
              <div className="flex items-center gap-3 mb-4">
                <div className="h-9 w-9 rounded-xl bg-violet-50 text-violet-700 flex items-center justify-center font-bold">
                  <BadgeAlert className="h-5 w-5" />
                </div>
                <h2 className="text-lg sm:text-xl font-bold text-zinc-900">
                  4. Tenant Safety, Biometrics & Police Verification
                </h2>
              </div>
              <p className="text-sm leading-relaxed mb-4">
                The safety of students and young professionals staying at your PG is paramount:
              </p>
              <ul className="space-y-3 text-sm">
                <li className="flex items-start gap-2.5">
                  <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
                  <span>
                    <strong>Police Verification:</strong> Owners must carry out mandatory tenant verification as required by state and local municipal police guidelines.
                  </span>
                </li>
                <li className="flex items-start gap-2.5">
                  <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
                  <span>
                    <strong>Security Standards:</strong> Girls and student PGs are required to maintain strict gate security, functioning entry registers/biometrics, and active CCTV in common entrance areas.
                  </span>
                </li>
                <li className="flex items-start gap-2.5">
                  <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
                  <span>
                    <strong>Non-Discrimination:</strong> StayKro prohibits discrimination based on caste, religion, or community. All listings must maintain respectful and professional standards.
                  </span>
                </li>
              </ul>
            </section>

            {/* 5. Violations & Listing Suspension */}
            <section className="rounded-3xl bg-red-50/40 border border-red-200/80 p-6 sm:p-8 shadow-xs">
              <div className="flex items-center gap-3 mb-4">
                <div className="h-9 w-9 rounded-xl bg-red-100 text-red-800 flex items-center justify-center font-bold">
                  <AlertTriangle className="h-5 w-5" />
                </div>
                <h2 className="text-lg sm:text-xl font-bold text-red-950">
                  5. Violations & Platform Termination
                </h2>
              </div>
              <p className="text-sm text-red-900 leading-relaxed mb-4">
                StayKro reserves the right to immediately suspend or permanently terminate any owner account or listing without refund if any of the following occur:
              </p>
              <ul className="space-y-2 text-sm text-red-900/90 list-disc list-inside">
                <li>Submitting fraudulent property ownership information or fake contact numbers.</li>
                <li>Multiple verified tenant reports of harassment, safety risks, or fraud.</li>
                <li>Posting duplicate, spam, or ghost listings to game search results.</li>
                <li>Demanding unauthorized brokerage fees from StayKro seekers.</li>
              </ul>
            </section>

            {/* 6. Contact Owner Support */}
            <section className="rounded-3xl bg-white border border-[#E8EAE5] p-6 sm:p-8 shadow-xs">
              <h2 className="text-lg font-bold text-zinc-900 mb-2">
                Questions or Need Onboarding Assistance?
              </h2>
              <p className="text-xs sm:text-sm text-zinc-600 mb-6">
                Our owner onboarding team is ready to assist you via phone or WhatsApp.
              </p>

              <div className="flex flex-wrap gap-4">
                <a
                  href={STAYKRO_CONTACT_CONFIG.phoneTel}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#00412E] text-white font-bold text-xs hover:bg-[#003425] transition-all"
                >
                  <Phone className="h-4 w-4" />
                  <span>Call {STAYKRO_CONTACT_CONFIG.phoneDisplay}</span>
                </a>

                <a
                  href={STAYKRO_CONTACT_CONFIG.whatsappUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-600 text-white font-bold text-xs hover:bg-emerald-700 transition-all"
                >
                  <Building2 className="h-4 w-4" />
                  <span>WhatsApp Admin</span>
                </a>

                <a
                  href={STAYKRO_CONTACT_CONFIG.emailMailto}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-zinc-100 text-zinc-700 font-bold text-xs hover:bg-zinc-200 transition-all"
                >
                  <Mail className="h-4 w-4" />
                  <span>{STAYKRO_CONTACT_CONFIG.email}</span>
                </a>
              </div>
            </section>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
