import Link from "next/link";
import Image from "next/image";
import { STAYKRO_CONTACT_CONFIG } from "@/config/contact";

export function Footer() {
  return (
    <footer className="border-t border-zinc-200/80 bg-zinc-50 text-zinc-600 text-sm">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12 lg:py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8 lg:gap-12">
          {/* Brand Info */}
          <div className="lg:col-span-2 space-y-4">
            <Link href="/" className="inline-flex items-center gap-2.5 group">
              <div className="relative flex h-9 w-9 shrink-0 items-center justify-center rounded-xl overflow-hidden bg-white shadow-2xs border border-zinc-200 p-1">
                <Image
                  src="/logo.png"
                  alt="StayKro Logo"
                  width={32}
                  height={32}
                  className="h-full w-full object-contain"
                />
              </div>
              <span className="text-lg font-black tracking-tight text-zinc-950 group-hover:text-[#00412E] transition-colors">
                StayKro<span className="text-[#96BF8A]">.</span>
              </span>
            </Link>

            <p className="text-xs sm:text-sm text-zinc-500 leading-relaxed max-w-sm">
              India&apos;s zero-brokerage accommodation platform. Connecting students and young
              professionals directly with verified PG owners and compatible roommates.
            </p>

            <div className="pt-1 text-xs text-zinc-500 space-y-1">
              <p>
                <span className="font-medium text-zinc-700">Support / WhatsApp:</span>{" "}
                <a
                  href={STAYKRO_CONTACT_CONFIG.whatsappUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[#00412E] font-semibold hover:underline"
                >
                  {STAYKRO_CONTACT_CONFIG.phoneDisplay}
                </a>
              </p>
              <p>
                <span className="font-medium text-zinc-700">Email:</span>{" "}
                <a
                  href={STAYKRO_CONTACT_CONFIG.emailMailto}
                  className="text-zinc-600 hover:text-zinc-950 transition-colors"
                >
                  {STAYKRO_CONTACT_CONFIG.email}
                </a>
              </p>
            </div>
          </div>

          {/* Explore */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-900 mb-3.5">
              Explore
            </h4>
            <ul className="space-y-2.5 text-xs sm:text-sm text-zinc-600">
              <li>
                <Link
                  href="/#discovery-section"
                  className="hover:text-zinc-950 transition-colors"
                >
                  Verified PGs & Coliving
                </Link>
              </li>
              <li>
                <Link
                  href="/roommates"
                  className="hover:text-zinc-950 transition-colors"
                >
                  Find Roommates
                </Link>
              </li>
              <li>
                <Link
                  href="/saved"
                  className="hover:text-zinc-950 transition-colors"
                >
                  Saved Listings
                </Link>
              </li>
              <li>
                <Link
                  href="/become-owner"
                  className="hover:text-[#00412E] font-medium text-[#00412E] transition-colors"
                >
                  List Your Property (Host)
                </Link>
              </li>
            </ul>
          </div>

          {/* Top Cities */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-900 mb-3.5">
              Cities
            </h4>
            <ul className="space-y-2.5 text-xs sm:text-sm text-zinc-600">
              <li>
                <Link
                  href="/pg/jalandhar"
                  className="hover:text-zinc-950 transition-colors"
                >
                  PGs in Jalandhar
                </Link>
              </li>
              <li>
                <Link
                  href="/pg/phagwara"
                  className="hover:text-zinc-950 transition-colors"
                >
                  PGs in Phagwara (LPU)
                </Link>
              </li>
              <li>
                <Link
                  href="/pg/chandigarh"
                  className="hover:text-zinc-950 transition-colors"
                >
                  PGs in Chandigarh
                </Link>
              </li>
              <li>
                <Link
                  href="/pg/delhi"
                  className="hover:text-zinc-950 transition-colors"
                >
                  PGs in Delhi NCR
                </Link>
              </li>
            </ul>
          </div>

          {/* Company & Policies */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-900 mb-3.5">
              Company
            </h4>
            <ul className="space-y-2.5 text-xs sm:text-sm text-zinc-600">
              <li>
                <Link
                  href="/about"
                  className="hover:text-zinc-950 font-semibold text-zinc-900 transition-colors"
                >
                  About Us
                </Link>
              </li>
              <li>
                <Link
                  href="/policies/user"
                  className="hover:text-zinc-950 transition-colors"
                >
                  Tenant Policies
                </Link>
              </li>
              <li>
                <Link
                  href="/policies/owner"
                  className="hover:text-zinc-950 transition-colors"
                >
                  Owner Guidelines
                </Link>
              </li>
              <li>
                <Link
                  href="/policies"
                  className="hover:text-zinc-950 transition-colors"
                >
                  Zero Brokerage Policy
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="mt-12 pt-6 border-t border-zinc-200/80 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-zinc-500">
          <p>© 2026 StayKro (staykro.in). All rights reserved.</p>
          <div className="flex flex-wrap items-center gap-4 sm:gap-6">
            <Link href="/about" className="hover:text-zinc-900 transition-colors">
              About
            </Link>
            <Link href="/policies/user" className="hover:text-zinc-900 transition-colors">
              Terms & Safety
            </Link>
            <Link href="/policies" className="hover:text-zinc-900 transition-colors">
              Zero Brokerage
            </Link>
            <a
              href={STAYKRO_CONTACT_CONFIG.whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-[#00412E] font-medium hover:underline"
            >
              Host Support: {STAYKRO_CONTACT_CONFIG.phoneDisplay}
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
