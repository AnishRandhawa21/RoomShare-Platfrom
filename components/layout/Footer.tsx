import Link from "next/link";
import Image from "next/image";

export function Footer() {
  return (
    <footer className="border-t border-[#E8EAE5] bg-white text-zinc-600">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-10 lg:py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand Col */}
          <div className="md:col-span-2 space-y-3">
            <Link href="/" className="flex items-center gap-2.5 group">
              <div className="relative flex h-10 w-10 shrink-0 items-center justify-center rounded-xl overflow-hidden bg-white shadow-xs border border-[#E8EAE5] transition-transform group-hover:scale-105">
                <Image
                  src="/logo.png"
                  alt="StayKro Logo"
                  width={40}
                  height={40}
                  className="h-full w-full object-contain p-0.5"
                />
              </div>
              <span className="text-xl font-bold tracking-tight text-zinc-900 group-hover:text-[#00412E] transition-colors">
                StayKro<span className="text-[#96BF8A] font-black">.</span>
              </span>
            </Link>
            <p className="text-sm text-zinc-500 max-w-sm leading-relaxed">
              India&apos;s modern accommodation discovery platform. Find verified PGs, coliving spaces, and compatible roommates with 100% zero brokerage.
            </p>
          </div>

          {/* Top PG Cities */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-900">
              Top PG Cities
            </h4>
            <ul className="mt-4 space-y-2.5 text-sm">
              <li>
                <Link
                  href="/pg/jalandhar"
                  className="hover:text-[#00412E] transition-colors font-medium text-zinc-700"
                >
                  PGs in Jalandhar
                </Link>
              </li>
              <li>
                <Link
                  href="/pg/phagwara"
                  className="hover:text-[#00412E] transition-colors font-medium text-zinc-700"
                >
                  PGs in Phagwara
                </Link>
              </li>
              <li>
                <Link
                  href="/pg/chandigarh"
                  className="hover:text-[#00412E] transition-colors text-zinc-600"
                >
                  PGs in Chandigarh
                </Link>
              </li>
              <li>
                <Link
                  href="/pg/delhi"
                  className="hover:text-[#00412E] transition-colors text-zinc-600"
                >
                  PGs in Delhi NCR
                </Link>
              </li>
            </ul>
          </div>

          {/* Platform Navigation */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-900">
              Explore
            </h4>
            <ul className="mt-4 space-y-2.5 text-sm">
              <li>
                <Link
                  href="/#discovery-section"
                  className="hover:text-[#00412E] transition-colors"
                >
                  Verified PGs & Coliving
                </Link>
              </li>
              <li>
                <Link
                  href="/roommates"
                  className="hover:text-[#00412E] transition-colors"
                >
                  Find Roommates
                </Link>
              </li>
              <li>
                <Link
                  href="/saved"
                  className="hover:text-[#00412E] transition-colors"
                >
                  Saved Listings
                </Link>
              </li>
              <li>
                <Link
                  href="/owner/properties/new"
                  className="hover:text-[#00412E] transition-colors"
                >
                  List Your Property (Free)
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* SEO Locality Mesh */}
        <div className="mt-10 pt-8 border-t border-[#E8EAE5]/70">
          <p className="text-xs font-bold uppercase tracking-wider text-zinc-900 mb-3">
            Popular PG Localities & Coliving Searches
          </p>
          <div className="flex flex-wrap gap-x-5 gap-y-2 text-xs text-zinc-500">
            <Link href="/pg/jalandhar/model-town" className="hover:text-[#00412E] transition-colors">
              PG in Model Town Jalandhar
            </Link>
            <span className="text-zinc-300">•</span>
            <Link href="/pg/jalandhar/urban-estate-phase-2" className="hover:text-[#00412E] transition-colors">
              PG in Urban Estate Phase 2
            </Link>
            <span className="text-zinc-300">•</span>
            <Link href="/pg/jalandhar/deep-nagar" className="hover:text-[#00412E] transition-colors">
              PG in Deep Nagar Jalandhar
            </Link>
            <span className="text-zinc-300">•</span>
            <Link href="/pg/jalandhar/rama-mandi" className="hover:text-[#00412E] transition-colors">
              PG in Rama Mandi Jalandhar
            </Link>
            <span className="text-zinc-300">•</span>
            <Link href="/pg/phagwara/law-gate" className="hover:text-[#00412E] transition-colors">
              PG near LPU Law Gate Phagwara
            </Link>
            <span className="text-zinc-300">•</span>
            <Link href="/pg/jalandhar" className="hover:text-[#00412E] transition-colors">
              Boys & Girls Hostels in Jalandhar
            </Link>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="mt-8 pt-6 border-t border-[#E8EAE5] flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-zinc-400">
          <p>© 2026 StayKro Platform. All rights reserved.</p>
          <div className="flex items-center gap-6">
            <Link href="/#discovery-section" className="hover:text-[#00412E] transition-colors">
              Privacy & Security
            </Link>
            <Link href="/#discovery-section" className="hover:text-[#00412E] transition-colors">
              Verified Stays Guarantee
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}

