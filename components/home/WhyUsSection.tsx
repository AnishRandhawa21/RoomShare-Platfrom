import {
  ShieldCheck,
  BadgePercent,
  Sparkles,
  Users2,
  Lock,
  Headphones,
} from "lucide-react";

export function WhyUsSection() {
  const benefits = [
    {
      icon: BadgePercent,
      title: "100% Zero Brokerage",
      description:
        "Save ₹10,000 to ₹30,000 on broker commissions. Deal directly with PG managers and real flatmates.",
      color: "text-amber-600 bg-amber-50",
    },
    {
      icon: ShieldCheck,
      title: "Physical Property Verification",
      description:
        "Our ground team verifies photos, electricity charges, water supply, and deposit policies before listing.",
      color: "text-emerald-600 bg-emerald-50",
    },
    {
      icon: Users2,
      title: "Lifestyle Compatibility Matching",
      description:
        "Find roommates who match your routine: dietary preferences, non-smoker requirements, and work shifts.",
      color: "text-indigo-600 bg-indigo-50",
    },
    {
      icon: Lock,
      title: "Safety & Privacy Focused",
      description:
        "Exclusive female-only PGs with biometric access and verified ID verification for all flatmate seekers.",
      color: "text-rose-600 bg-rose-50",
    },
    {
      icon: Sparkles,
      title: "Transparent Pricing",
      description:
        "No surprise maintenance charges or inflated electricity unit rates. What you see is what you pay.",
      color: "text-violet-600 bg-violet-50",
    },
    {
      icon: Headphones,
      title: "Tenant Resolution Support",
      description:
        "Dedicated assistance team to resolve deposit disputes, maintenance delays, or roommate transitions.",
      color: "text-sky-600 bg-sky-50",
    },
  ];

  return (
    <section className="py-14 sm:py-20 bg-zinc-900 text-white">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto">
          <div className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-3.5 py-1 text-xs font-bold text-indigo-300">
            <span>Built For Urban Renters</span>
          </div>
          <h2 className="mt-3 text-3xl font-extrabold tracking-tight sm:text-4xl text-white">
            Why Renters Choose RoomNest
          </h2>
          <p className="mt-2 text-sm sm:text-base text-zinc-400">
            Finding accommodation in Indian metro cities shouldn't be stressful or filled with broker fraud.
          </p>
        </div>

        <div className="mt-12 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
          {benefits.map((b, idx) => {
            const Icon = b.icon;
            return (
              <div
                key={idx}
                className="rounded-3xl border border-white/10 bg-zinc-800/60 p-6 sm:p-8 backdrop-blur-sm hover:border-white/20 transition-colors"
              >
                <div
                  className={`flex h-12 w-12 items-center justify-center rounded-2xl ${b.color}`}
                >
                  <Icon className="h-6 w-6" />
                </div>
                <h3 className="mt-5 text-lg font-bold text-white">{b.title}</h3>
                <p className="mt-2 text-sm text-zinc-400 leading-relaxed">
                  {b.description}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
