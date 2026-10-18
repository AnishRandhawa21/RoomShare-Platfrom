import Link from "next/link";
import { Building2, Heart, ShieldCheck, Mail, Phone, MapPin } from "lucide-react";

export function Footer() {
  return (
    <footer className="border-t border-zinc-200 bg-white text-zinc-600">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-14 lg:py-16">
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-8">
          {/* Brand Col */}
          <div className="col-span-2 lg:col-span-2 space-y-4">
            <Link href="/" className="flex items-center gap-2">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-tr from-indigo-600 to-violet-500 text-white shadow-md shadow-indigo-100">
                <Building2 className="h-5 w-5" />
              </div>
              <span className="text-xl font-bold tracking-tight text-zinc-900">
                RoomNest<span className="text-indigo-600 font-black">.</span>
              </span>
            </Link>
            <p className="text-sm text-zinc-500 max-w-sm leading-relaxed">
              India&apos;s modern accommodation discovery platform. Find verified PGs, coliving spaces, and compatible roommates with 100% zero brokerage.
            </p>
            <div className="flex items-center gap-2 text-xs font-semibold text-emerald-700 bg-emerald-50 w-fit px-3 py-1.5 rounded-full border border-emerald-100">
              <ShieldCheck className="h-4 w-4 text-emerald-600" />
              <span>Verified Listing Protection</span>
            </div>
          </div>

          {/* Top PG Cities */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-900">
              Top Cities
            </h4>
            <ul className="mt-4 space-y-2.5 text-sm">
              <li>
                <a href="#pg-section" className="hover:text-indigo-600 transition-colors">
                  PGs in Bengaluru
                </a>
              </li>
              <li>
                <a href="#pg-section" className="hover:text-indigo-600 transition-colors">
                  PGs in Pune
                </a>
              </li>
              <li>
                <a href="#pg-section" className="hover:text-indigo-600 transition-colors">
                  PGs in Gurugram
                </a>
              </li>
              <li>
                <a href="#pg-section" className="hover:text-indigo-600 transition-colors">
                  PGs in Hyderabad
                </a>
              </li>
              <li>
                <a href="#pg-section" className="hover:text-indigo-600 transition-colors">
                  PGs in Noida & Delhi
                </a>
              </li>
            </ul>
          </div>

          {/* Categories */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-900">
              Categories
            </h4>
            <ul className="mt-4 space-y-2.5 text-sm">
              <li>
                <a href="#pg-section" className="hover:text-indigo-600 transition-colors">
                  Girls PGs (Safe Stay)
                </a>
              </li>
              <li>
                <a href="#pg-section" className="hover:text-indigo-600 transition-colors">
                  Boys Hostels & PGs
                </a>
              </li>
              <li>
                <a href="#pg-section" className="hover:text-indigo-600 transition-colors">
                  Unisex & Coliving
                </a>
              </li>
              <li>
                <a href="#roommate-section" className="hover:text-indigo-600 transition-colors">
                  Roommate Finder
                </a>
              </li>
              <li>
                <a href="#pg-section" className="hover:text-indigo-600 transition-colors">
                  Food Included Stays
                </a>
              </li>
            </ul>
          </div>

          {/* Support & Legal */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-900">
              Trust & Safety
            </h4>
            <ul className="mt-4 space-y-2.5 text-sm">
              <li>
                <span className="cursor-pointer hover:text-indigo-600 transition-colors">
                  Safety Guidelines
                </span>
              </li>
              <li>
                <span className="cursor-pointer hover:text-indigo-600 transition-colors">
                  Zero Brokerage Policy
                </span>
              </li>
              <li>
                <span className="cursor-pointer hover:text-indigo-600 transition-colors">
                  Verification Process
                </span>
              </li>
              <li>
                <span className="cursor-pointer hover:text-indigo-600 transition-colors">
                  Terms of Service
                </span>
              </li>
              <li>
                <span className="cursor-pointer hover:text-indigo-600 transition-colors">
                  Privacy Policy
                </span>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="mt-12 pt-8 border-t border-zinc-100 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-zinc-400">
          <p>© 2026 RoomNest Platform. All rights reserved.</p>
          <p className="flex items-center gap-1">
            Crafted for hassle-free living across India
          </p>
        </div>
      </div>
    </footer>
  );
}
