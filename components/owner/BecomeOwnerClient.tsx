"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Phone,
  MessageCircle,
  Mail,
  CheckCircle2,
  Building2,
  ShieldCheck,
  Sparkles,
  ArrowRight,
  Clock,
  MapPin,
  Send,
  HelpCircle,
  FileText,
  BadgeCheck,
} from "lucide-react";
import { STAYKRO_CONTACT_CONFIG as CONTACT } from "@/config/contact";

export function BecomeOwnerClient() {
  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    city: "Jalandhar",
    propertyType: "PG / Hostel",
    roomsCount: "",
    notes: "",
  });

  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const text = `Hi StayKro, I want to become a verified owner.%0A%0A*Name:* ${encodeURIComponent(
      formData.name || "Owner"
    )}%0A*Phone:* ${encodeURIComponent(
      formData.phone
    )}%0A*City:* ${encodeURIComponent(
      formData.city
    )}%0A*Property Type:* ${encodeURIComponent(
      formData.propertyType
    )}%0A*Approx Rooms/Beds:* ${encodeURIComponent(
      formData.roomsCount || "Not specified"
    )}${
      formData.notes
        ? `%0A*Details:* ${encodeURIComponent(formData.notes)}`
        : ""
    }`;

    // Open WhatsApp directly with prefilled message
    window.open(`https://wa.me/${CONTACT.whatsappNumber}?text=${text}`, "_blank");
    setSubmitted(true);
  };

  return (
    <div className="min-h-screen bg-[#FDFDFD] text-zinc-900 pb-20">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-b from-[#00412E]/5 via-[#00412E]/[0.02] to-transparent pt-12 pb-16 sm:pt-16 sm:pb-24 border-b border-[#E8EAE5]/60">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#00412E]/10 border border-[#00412E]/20 text-[#00412E] text-xs font-bold tracking-wide uppercase mb-6">
              <Sparkles className="h-3.5 w-3.5 text-[#00412E]" />
              Official Host & Owner Onboarding
            </div>

            <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-zinc-900 leading-tight">
              List Your PG on StayKro With{" "}
              <span className="text-[#00412E] underline decoration-[#96BF8A] decoration-wavy decoration-2">
                Zero Brokerage
              </span>
            </h1>

            <p className="mt-4 text-base sm:text-lg text-zinc-600 leading-relaxed max-w-2xl mx-auto">
              Connect directly with verified students and working professionals.
              No middlemen, no commission on room rent, and guaranteed direct
              phone & WhatsApp inquiries.
            </p>

            <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
              <a
                href={CONTACT.whatsappUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2.5 px-6 py-3.5 rounded-2xl bg-emerald-600 text-white font-bold text-sm hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-600/20 active:scale-95"
              >
                <MessageCircle className="h-5 w-5" />
                <span>Chat on WhatsApp</span>
              </a>

              <a
                href={CONTACT.phoneTel}
                className="inline-flex items-center gap-2.5 px-6 py-3.5 rounded-2xl bg-[#00412E] text-white font-bold text-sm hover:bg-[#003425] transition-all shadow-lg shadow-[#00412E]/20 active:scale-95"
              >
                <Phone className="h-5 w-5" />
                <span>Call {CONTACT.phoneDisplay}</span>
              </a>

              <a
                href="#inquiry-form"
                className="inline-flex items-center gap-2 px-6 py-3.5 rounded-2xl bg-white border border-zinc-200 text-zinc-700 font-bold text-sm hover:bg-zinc-50 transition-all shadow-xs"
              >
                <span>Request Callback</span>
                <ArrowRight className="h-4 w-4 text-zinc-400" />
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* Main Content Grid: Direct Contacts + Inquiry Form */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 -mt-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Left Column: Direct Contact Info & Onboarding Steps (7 cols) */}
          <div className="lg:col-span-7 space-y-6">
            {/* Direct Contact Card */}
            <div className="rounded-3xl bg-white border border-[#E8EAE5] p-6 sm:p-8 shadow-sm">
              <div className="flex items-center gap-3 mb-6">
                <div className="h-10 w-10 rounded-2xl bg-[#00412E]/10 flex items-center justify-center text-[#00412E]">
                  <Phone className="h-5 w-5" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-zinc-900">
                    Direct Contact for PG Owners
                  </h2>
                  <p className="text-xs text-zinc-500">
                    Reach out to our onboarding administrator directly to get your verified host invite.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Phone Call Box */}
                <a
                  href={CONTACT.phoneTel}
                  className="group block p-4 rounded-2xl bg-zinc-50 border border-zinc-200/80 hover:border-[#00412E] hover:bg-[#00412E]/[0.02] transition-all"
                >
                  <div className="flex items-center gap-3 mb-2">
                    <div className="h-8 w-8 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center">
                      <Phone className="h-4 w-4" />
                    </div>
                    <span className="text-xs font-bold uppercase tracking-wider text-zinc-500">
                      Direct Phone
                    </span>
                  </div>
                  <div className="text-base font-bold text-zinc-900 group-hover:text-[#00412E]">
                    {CONTACT.phoneDisplay}
                  </div>
                  <div className="text-xs text-zinc-500 mt-1">
                    Direct call for onboarding
                  </div>
                </a>

                {/* WhatsApp Chat Box */}
                <a
                  href={CONTACT.whatsappUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group block p-4 rounded-2xl bg-emerald-50/50 border border-emerald-200/80 hover:border-emerald-600 hover:bg-emerald-50 transition-all"
                >
                  <div className="flex items-center gap-3 mb-2">
                    <div className="h-8 w-8 rounded-xl bg-emerald-600 text-white flex items-center justify-center">
                      <MessageCircle className="h-4 w-4" />
                    </div>
                    <span className="text-xs font-bold uppercase tracking-wider text-emerald-700">
                      WhatsApp Chat
                    </span>
                  </div>
                  <div className="text-base font-bold text-zinc-900 group-hover:text-emerald-700">
                    {CONTACT.whatsappDisplay}
                  </div>
                  <div className="text-xs text-emerald-700 mt-1">
                    Instant message with admin
                  </div>
                </a>

                {/* Email Box */}
                <a
                  href={CONTACT.emailMailto}
                  className="group block p-4 rounded-2xl bg-zinc-50 border border-zinc-200/80 hover:border-[#00412E] hover:bg-[#00412E]/[0.02] transition-all sm:col-span-2"
                >
                  <div className="flex items-center gap-3 mb-2">
                    <div className="h-8 w-8 rounded-xl bg-blue-100 text-blue-800 flex items-center justify-center">
                      <Mail className="h-4 w-4" />
                    </div>
                    <span className="text-xs font-bold uppercase tracking-wider text-zinc-500">
                      Official Email
                    </span>
                  </div>
                  <div className="text-base font-bold text-zinc-900 group-hover:text-[#00412E] break-all">
                    {CONTACT.email}
                  </div>
                  <div className="text-xs text-zinc-500 mt-1">
                    Send property photos, brochures, or partnership inquiries
                  </div>
                </a>
              </div>

              {/* Operating Info */}
              <div className="mt-6 pt-6 border-t border-zinc-100 flex flex-wrap items-center justify-between gap-3 text-xs text-zinc-500">
                <div className="flex items-center gap-1.5">
                  <Clock className="h-4 w-4 text-zinc-400" />
                  <span>Support Hours: {CONTACT.operatingHours}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <MapPin className="h-4 w-4 text-zinc-400" />
                  <span>{CONTACT.supportLocation}</span>
                </div>
              </div>
            </div>

            {/* 3 Simple Steps */}
            <div className="rounded-3xl bg-white border border-[#E8EAE5] p-6 sm:p-8 shadow-sm">
              <h3 className="text-lg font-bold text-zinc-900 mb-6">
                How Onboarding Works
              </h3>

              <div className="space-y-6">
                <div className="flex gap-4">
                  <div className="h-8 w-8 rounded-full bg-[#00412E] text-white flex items-center justify-center text-xs font-bold shrink-0">
                    1
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-zinc-900">
                      Contact Administrator
                    </h4>
                    <p className="text-xs text-zinc-600 mt-1 leading-relaxed">
                      Call or WhatsApp on <span className="font-semibold text-zinc-900">{CONTACT.phoneDisplay}</span>. Provide your PG name, location, and total available rooms.
                    </p>
                  </div>
                </div>

                <div className="flex gap-4">
                  <div className="h-8 w-8 rounded-full bg-[#00412E] text-white flex items-center justify-center text-xs font-bold shrink-0">
                    2
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-zinc-900">
                      Quick Verification & Host Invite
                    </h4>
                    <p className="text-xs text-zinc-600 mt-1 leading-relaxed">
                      We ensure all properties meet safety and genuine listing standards. You receive a secure owner account invite link to set up your owner portal.
                    </p>
                  </div>
                </div>

                <div className="flex gap-4">
                  <div className="h-8 w-8 rounded-full bg-[#00412E] text-white flex items-center justify-center text-xs font-bold shrink-0">
                    3
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-zinc-900">
                      Activate 30-Day Listing Pass & Go Live
                    </h4>
                    <p className="text-xs text-zinc-600 mt-1 leading-relaxed">
                      Choose StayKro Solo (₹499) or StayKro Plus (₹999). Your PG goes live immediately to thousands of verified students and professionals with direct WhatsApp and Call leads.
                    </p>
                  </div>
                </div>
              </div>

              {/* Policy Callout */}
              <div className="mt-6 pt-6 border-t border-zinc-100 flex items-center justify-between">
                <div className="flex items-center gap-2 text-xs text-zinc-500">
                  <ShieldCheck className="h-4 w-4 text-emerald-600" />
                  <span>Subject to StayKro Host Listing Policies</span>
                </div>
                <Link
                  href="/policies/owner"
                  className="text-xs font-bold text-[#00412E] hover:underline flex items-center gap-1"
                >
                  <span>Read Owner Policy</span>
                  <ArrowRight className="h-3 w-3" />
                </Link>
              </div>
            </div>
          </div>

          {/* Right Column: Callback Request Form (5 cols) */}
          <div className="lg:col-span-5" id="inquiry-form">
            <div className="rounded-3xl bg-white border border-[#E8EAE5] p-6 sm:p-8 shadow-sm sticky top-24">
              <div className="flex items-center gap-2 text-[#00412E] mb-2">
                <Building2 className="h-5 w-5" />
                <span className="text-xs font-bold uppercase tracking-wider">
                  Fast-Track Onboarding
                </span>
              </div>
              <h3 className="text-xl font-bold text-zinc-900">
                Request Owner Callback
              </h3>
              <p className="text-xs text-zinc-500 mt-1 mb-6">
                Fill this quick form and our onboarding team will reach out directly.
              </p>

              {submitted ? (
                <div className="rounded-2xl bg-emerald-50 border border-emerald-200 p-6 text-center">
                  <BadgeCheck className="h-10 w-10 text-emerald-600 mx-auto mb-2" />
                  <h4 className="text-base font-bold text-emerald-900">
                    WhatsApp Connected!
                  </h4>
                  <p className="text-xs text-emerald-700 mt-1 leading-relaxed">
                    We opened WhatsApp with your details. You can also call us directly at{" "}
                    <span className="font-bold">{CONTACT.phoneDisplay}</span>.
                  </p>
                  <button
                    onClick={() => setSubmitted(false)}
                    className="mt-4 px-4 py-2 rounded-xl bg-white border border-emerald-300 text-xs font-bold text-emerald-800 hover:bg-emerald-100 transition-colors"
                  >
                    Send Another Request
                  </button>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-zinc-600 mb-1">
                      Your Full Name
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Ramesh Kumar"
                      value={formData.name}
                      onChange={(e) =>
                        setFormData({ ...formData, name: e.target.value })
                      }
                      className="w-full px-3.5 py-2.5 rounded-xl border border-zinc-200 bg-zinc-50/50 text-sm text-zinc-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#00412E]/20 focus:border-[#00412E]"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-zinc-600 mb-1">
                      Phone / WhatsApp Number
                    </label>
                    <input
                      type="tel"
                      required
                      placeholder="e.g. 98765 43210"
                      value={formData.phone}
                      onChange={(e) =>
                        setFormData({ ...formData, phone: e.target.value })
                      }
                      className="w-full px-3.5 py-2.5 rounded-xl border border-zinc-200 bg-zinc-50/50 text-sm text-zinc-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#00412E]/20 focus:border-[#00412E]"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-zinc-600 mb-1">
                        City
                      </label>
                      <select
                        value={formData.city}
                        onChange={(e) =>
                          setFormData({ ...formData, city: e.target.value })
                        }
                        className="w-full px-3 py-2.5 rounded-xl border border-zinc-200 bg-zinc-50/50 text-sm text-zinc-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#00412E]/20 focus:border-[#00412E]"
                      >
                        <option value="Jalandhar">Jalandhar</option>
                        <option value="Phagwara">Phagwara</option>
                        <option value="Chandigarh">Chandigarh</option>
                        <option value="Delhi NCR">Delhi NCR</option>
                        <option value="Other">Other City</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-zinc-600 mb-1">
                        Approx Rooms
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. 12 rooms"
                        value={formData.roomsCount}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            roomsCount: e.target.value,
                          })
                        }
                        className="w-full px-3.5 py-2.5 rounded-xl border border-zinc-200 bg-zinc-50/50 text-sm text-zinc-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#00412E]/20 focus:border-[#00412E]"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-zinc-600 mb-1">
                      Property Name / Locality
                    </label>
                    <textarea
                      rows={2}
                      placeholder="e.g. Green Valley PG near Law Gate, Phagwara"
                      value={formData.notes}
                      onChange={(e) =>
                        setFormData({ ...formData, notes: e.target.value })
                      }
                      className="w-full px-3.5 py-2 rounded-xl border border-zinc-200 bg-zinc-50/50 text-sm text-zinc-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#00412E]/20 focus:border-[#00412E] resize-none"
                    />
                  </div>

                  <button
                    type="submit"
                    className="w-full py-3.5 rounded-2xl bg-[#00412E] text-white font-bold text-sm hover:bg-[#003425] transition-all shadow-md shadow-[#00412E]/20 flex items-center justify-center gap-2 active:scale-98"
                  >
                    <Send className="h-4 w-4" />
                    <span>Submit & Connect on WhatsApp</span>
                  </button>

                  <p className="text-[11px] text-zinc-400 text-center leading-normal">
                    By submitting, you agree to StayKro&apos;s{" "}
                    <Link
                      href="/policies/owner"
                      className="underline text-zinc-600 hover:text-zinc-900"
                    >
                      Owner Policies
                    </Link>{" "}
                    and zero-commission transparent terms.
                  </p>
                </form>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Why Choose StayKro Features */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 mt-16">
        <div className="text-center max-w-2xl mx-auto mb-10">
          <h2 className="text-2xl font-bold text-zinc-900">
            Why PG Owners Love StayKro
          </h2>
          <p className="text-xs sm:text-sm text-zinc-500 mt-1">
            Built from the ground up for modern paying guest accommodations and coliving spaces.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="p-6 rounded-3xl bg-white border border-[#E8EAE5] shadow-xs">
            <div className="h-10 w-10 rounded-2xl bg-emerald-50 text-emerald-700 flex items-center justify-center font-bold mb-4">
              0%
            </div>
            <h3 className="text-base font-bold text-zinc-900">
              Zero Rent Brokerage
            </h3>
            <p className="text-xs text-zinc-600 mt-2 leading-relaxed">
              We never take a cut of your monthly rental income or tenant deposits. You keep 100% of what you earn.
            </p>
          </div>

          <div className="p-6 rounded-3xl bg-white border border-[#E8EAE5] shadow-xs">
            <div className="h-10 w-10 rounded-2xl bg-blue-50 text-blue-700 flex items-center justify-center font-bold mb-4">
              <Phone className="h-5 w-5" />
            </div>
            <h3 className="text-base font-bold text-zinc-900">
              Direct Tenant Connection
            </h3>
            <p className="text-xs text-zinc-600 mt-2 leading-relaxed">
              Tenants click to call or chat directly with you on your WhatsApp. No confusing middlemen or call-center filters.
            </p>
          </div>

          <div className="p-6 rounded-3xl bg-white border border-[#E8EAE5] shadow-xs">
            <div className="h-10 w-10 rounded-2xl bg-amber-50 text-amber-700 flex items-center justify-center font-bold mb-4">
              <ShieldCheck className="h-5 w-5" />
            </div>
            <h3 className="text-base font-bold text-zinc-900">
              Verified Host Badge
            </h3>
            <p className="text-xs text-zinc-600 mt-2 leading-relaxed">
              Verified badge on your listings gives prospective students and parents peace of mind, increasing room bookings by 3x.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
