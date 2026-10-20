import type { Metadata } from "next";
import Link from "next/link";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { getCurrentUser } from "@/lib/auth/session";
import { getDiscoveryLocations } from "@/lib/discovery";
import { STAYKRO_CONTACT_CONFIG } from "@/config/contact";
import {
  ShieldCheck,
  Users,
  CheckCircle2,
  AlertTriangle,
  HeartHandshake,
  Lock,
  ArrowRight,
  Phone,
  Mail,
  Home,
  MessageSquare,
} from "lucide-react";

export const metadata: Metadata = {
  title: "Tenant Policies, Community Guidelines & Safety | StayKro",
  description:
    "Official policies, zero-brokerage guarantees, code of conduct, roommate chat rules, and safety tips for students and working professionals on StayKro.",
};

export const revalidate = 60;

export default async function UserPolicyPage() {
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
            <span className="text-zinc-900 font-semibold">Tenant & User Policy</span>
          </div>

          {/* Header Card */}
          <div className="rounded-3xl bg-white border border-[#E8EAE5] p-6 sm:p-10 shadow-xs mb-8">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-50 text-emerald-800 text-xs font-bold tracking-wide uppercase mb-4">
              <Users className="h-3.5 w-3.5" />
              For Tenants, Students & Flatmate Seekers
            </div>
            <h1 className="text-2xl sm:text-4xl font-extrabold text-zinc-900 tracking-tight">
              Tenant Policies & Community Safety Guidelines
            </h1>
            <p className="mt-3 text-sm text-zinc-600 leading-relaxed">
              Last updated: October 2026. StayKro is dedicated to providing students and young
              professionals with safe, transparent, and 100% zero-brokerage accommodation discovery.
            </p>

            {/* Quick Switch to Owner Policy */}
            <div className="mt-6 pt-6 border-t border-zinc-100 flex flex-wrap items-center justify-between gap-4">
              <span className="text-xs text-zinc-500">
                Are you a PG owner or property manager?
              </span>
              <Link
                href="/policies/owner"
                className="text-xs font-bold text-[#00412E] hover:underline flex items-center gap-1.5"
              >
                <span>Switch to Owner Listing Policies</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>
          </div>

          {/* Policy Sections */}
          <div className="space-y-8 text-zinc-700">
            {/* 1. Zero Brokerage Guarantee */}
            <section className="rounded-3xl bg-white border border-[#E8EAE5] p-6 sm:p-8 shadow-xs">
              <div className="flex items-center gap-3 mb-4">
                <div className="h-9 w-9 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center font-bold">
                  <ShieldCheck className="h-5 w-5" />
                </div>
                <h2 className="text-lg sm:text-xl font-bold text-zinc-900">
                  1. 100% Zero Brokerage Guarantee
                </h2>
              </div>
              <p className="text-sm leading-relaxed mb-4">
                StayKro is completely free for tenants and roommates. We believe students and working professionals should never have to pay heavy brokerage fees just to find a place to stay:
              </p>
              <ul className="space-y-3 text-sm">
                <li className="flex items-start gap-2.5">
                  <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
                  <span>
                    <strong>Free Browsing & Inquiries:</strong> You will never be asked to pay a commission, registration fee, or viewing charge by StayKro.
                  </span>
                </li>
                <li className="flex items-start gap-2.5">
                  <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
                  <span>
                    <strong>Direct Landlord Contact:</strong> You speak directly with the verified property host on Phone and WhatsApp.
                  </span>
                </li>
                <li className="flex items-start gap-2.5">
                  <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
                  <span>
                    <strong>Beware of Imposters:</strong> If anyone claims to be an &quot;agent from StayKro&quot; demanding money or service charges before showing a property, report them immediately.
                  </span>
                </li>
              </ul>
            </section>

            {/* 2. Roommate Matchmaking & Chat Etiquette */}
            <section className="rounded-3xl bg-white border border-[#E8EAE5] p-6 sm:p-8 shadow-xs">
              <div className="flex items-center gap-3 mb-4">
                <div className="h-9 w-9 rounded-xl bg-violet-50 text-violet-700 flex items-center justify-center font-bold">
                  <MessageSquare className="h-5 w-5" />
                </div>
                <h2 className="text-lg sm:text-xl font-bold text-zinc-900">
                  2. Roommate Finder & Chat Conduct
                </h2>
              </div>
              <p className="text-sm leading-relaxed mb-4">
                When using our roommate discovery features or in-app messaging:
              </p>
              <ul className="space-y-3 text-sm">
                <li className="flex items-start gap-2.5">
                  <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
                  <span>
                    <strong>Respectful Communication:</strong> Maintain courteous and respectful communication. Hate speech, vulgar language, discrimination, and inappropriate advances are strictly prohibited.
                  </span>
                </li>
                <li className="flex items-start gap-2.5">
                  <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
                  <span>
                    <strong>Authentic Profiles:</strong> Do not post fake pictures, deceptive occupations, or pretend to be someone else. Honest profiles create safe living environments.
                  </span>
                </li>
                <li className="flex items-start gap-2.5">
                  <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
                  <span>
                    <strong>Harassment-Free Policy:</strong> Any user who harasses, intimidates, or sends unsolicited spam to fellow seekers will face an immediate permanent ban.
                  </span>
                </li>
              </ul>
            </section>

            {/* 3. Safe Viewing & Deposit Protection */}
            <section className="rounded-3xl bg-white border border-[#E8EAE5] p-6 sm:p-8 shadow-xs">
              <div className="flex items-center gap-3 mb-4">
                <div className="h-9 w-9 rounded-xl bg-blue-50 text-blue-700 flex items-center justify-center font-bold">
                  <Lock className="h-5 w-5" />
                </div>
                <h2 className="text-lg sm:text-xl font-bold text-zinc-900">
                  3. In-Person Visits & Deposit Safety Advice
                </h2>
              </div>
              <p className="text-sm leading-relaxed mb-4">
                To protect yourself from online rental scams, follow these essential safety practices:
              </p>
              <ul className="space-y-3 text-sm">
                <li className="flex items-start gap-2.5">
                  <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
                  <span>
                    <strong>Always Inspect First:</strong> Always visit the PG in person or have a friend inspect the room, washroom, and food quality before paying any advance token money.
                  </span>
                </li>
                <li className="flex items-start gap-2.5">
                  <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
                  <span>
                    <strong>Written Receipts:</strong> When paying rent or security deposits to the host, always obtain a written receipt or digital acknowledgement detailing the deposit refund policy.
                  </span>
                </li>
                <li className="flex items-start gap-2.5">
                  <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
                  <span>
                    <strong>Never Share OTPs:</strong> Never share banking OTPs, UPI PINs, or sensitive credentials with anyone claiming to &quot;reverse charge&quot; or &quot;verify&quot; a booking.
                  </span>
                </li>
              </ul>
            </section>

            {/* 4. Respecting PG House Rules */}
            <section className="rounded-3xl bg-white border border-[#E8EAE5] p-6 sm:p-8 shadow-xs">
              <div className="flex items-center gap-3 mb-4">
                <div className="h-9 w-9 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center font-bold">
                  <Home className="h-5 w-5" />
                </div>
                <h2 className="text-lg sm:text-xl font-bold text-zinc-900">
                  4. House Rules & Community Living
                </h2>
              </div>
              <ul className="space-y-3 text-sm">
                <li className="flex items-start gap-2.5">
                  <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
                  <span>
                    <strong>Adhere to Timings & Curfews:</strong> Student PGs and hostels often have specific gate closure timings or visitor rules set by management. Tenants must abide by mutually agreed terms.
                  </span>
                </li>
                <li className="flex items-start gap-2.5">
                  <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
                  <span>
                    <strong>Timely Rent Payment:</strong> Pay your monthly rent and utility dues on or before the due date agreed upon with your property owner.
                  </span>
                </li>
                <li className="flex items-start gap-2.5">
                  <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
                  <span>
                    <strong>Property Maintenance:</strong> Treat PG furniture, fixtures, appliances, and common areas with care. Report any maintenance issues promptly to your warden or host.
                  </span>
                </li>
              </ul>
            </section>

            {/* 5. Reporting Violations & Tenant Support */}
            <section className="rounded-3xl bg-white border border-[#E8EAE5] p-6 sm:p-8 shadow-xs">
              <div className="flex items-center gap-3 mb-4">
                <div className="h-9 w-9 rounded-xl bg-rose-50 text-rose-700 flex items-center justify-center font-bold">
                  <HeartHandshake className="h-5 w-5" />
                </div>
                <h2 className="text-lg sm:text-xl font-bold text-zinc-900">
                  5. Reporting & Support
                </h2>
              </div>
              <p className="text-sm leading-relaxed mb-4">
                Encountered an inaccurate listing, misleading photos, or an unprofessional host? Our platform safety team is here to assist you:
              </p>

              <div className="flex flex-wrap gap-4">
                <a
                  href={STAYKRO_CONTACT_CONFIG.phoneTel}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#00412E] text-white font-bold text-xs hover:bg-[#003425] transition-all"
                >
                  <Phone className="h-4 w-4" />
                  <span>Helpline: {STAYKRO_CONTACT_CONFIG.phoneDisplay}</span>
                </a>

                <a
                  href={STAYKRO_CONTACT_CONFIG.emailMailto}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-zinc-100 text-zinc-700 font-bold text-xs hover:bg-zinc-200 transition-all"
                >
                  <Mail className="h-4 w-4" />
                  <span>Email: {STAYKRO_CONTACT_CONFIG.email}</span>
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
