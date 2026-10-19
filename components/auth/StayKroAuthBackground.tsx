"use client";

export function StayKroAuthBackground() {
  return (
    <div
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 z-0 h-full w-full overflow-hidden bg-white select-none"
    >
      {/* Base Canvas */}
      <div className="absolute inset-0 bg-[#ffffff]" />

      {/* ============================================================== */}
      {/* LEFT SIDE ONLY: Abstract Ambient Architecture Background        */}
      {/* Confined strictly to Left 58% on Desktop to keep form pure     */}
      {/* ============================================================== */}
      <div className="absolute inset-y-0 left-0 w-full lg:w-[58%] xl:w-[60%] overflow-hidden pointer-events-none">
        {/* 7. Subtle Architectural Blueprint Grid (Clean 4.5% opacity) */}
        <div
          className="absolute inset-0 animate-pattern-drift"
          style={{ opacity: 0.045 }}
        >
          <svg
            className="h-full w-full"
            xmlns="http://www.w3.org/2000/svg"
            width="100%"
            height="100%"
          >
            <defs>
              <pattern
                id="staykro-blueprint-grid"
                width="120"
                height="120"
                patternUnits="userSpaceOnUse"
              >
                {/* Thin Architectural Grid Lines */}
                <path
                  d="M 120 0 L 0 0 0 120"
                  fill="none"
                  stroke="#00412E"
                  strokeWidth="0.75"
                />
                {/* Delicate Floorplan Intersection Markers */}
                <path
                  d="M 116 4 L 124 4 M 120 0 L 120 8"
                  stroke="#00412E"
                  strokeWidth="0.6"
                />
                <circle cx="60" cy="60" r="1.5" fill="#00412E" />
                <path
                  d="M 30 30 L 60 30 L 60 60"
                  fill="none"
                  stroke="#96BF8A"
                  strokeWidth="0.5"
                  strokeDasharray="2 3"
                />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#staykro-blueprint-grid)" />
          </svg>
        </div>

        {/* 8. Barely Visible Diagonal Light Sweep (Premium SaaS Sheen) */}
        <div
          className="absolute -top-[20%] right-[-10%] h-[180vh] w-[420px] lg:w-[520px] -rotate-[32deg] rounded-[240px] animate-sweep-drift"
          style={{
            background:
              "linear-gradient(180deg, rgba(150, 191, 138, 0.08) 0%, rgba(220, 235, 221, 0.06) 50%, transparent 100%)",
            filter: "blur(80px)",
            WebkitFilter: "blur(80px)",
            willChange: "transform",
          }}
        />

        {/* 1, 2, 3, 4, 5. Expansive Luxury Ambient Illumination Mesh */}
        {/* Circle 1: Upper-Left Architectural Ambient Glow (Deep Forest / Nordic Pine) */}
        <div
          className="absolute -top-[12%] -left-[10%] h-[580px] w-[580px] lg:h-[680px] lg:w-[680px] rounded-full animate-glow-primary-compound"
          style={{
            backgroundColor: "rgba(0, 65, 46, 0.08)",
            filter: "blur(85px)",
            WebkitFilter: "blur(85px)",
            willChange: "transform, opacity, background-color",
          }}
        />

        {/* Circle 2: Mid-Left Velvet Sage Glow (Cradles the Headline Typography) */}
        <div
          className="absolute top-[32%] -left-[8%] h-[520px] w-[520px] lg:h-[620px] lg:w-[620px] rounded-full animate-sweep-secondary-compound"
          style={{
            backgroundColor: "rgba(150, 191, 138, 0.11)",
            filter: "blur(90px)",
            WebkitFilter: "blur(90px)",
            willChange: "transform, background-color",
          }}
        />

        {/* Circle 3: Lower-Left Mint Silk Accent (Anchors Trust Pillars) */}
        <div
          className="absolute -bottom-[8%] left-[6%] h-[460px] w-[460px] lg:h-[540px] lg:w-[540px] rounded-full animate-glow-accent-compound"
          style={{
            backgroundColor: "rgba(220, 235, 221, 0.14)",
            filter: "blur(75px)",
            WebkitFilter: "blur(75px)",
            willChange: "transform, opacity, background-color",
          }}
        />

        {/* 6. Grand Architectural Blueprint Arcs */}
        {/* Inner Precision Blueprint Arc */}
        <div
          className="absolute top-[22%] left-[4%] h-[580px] w-[580px] lg:h-[680px] lg:w-[680px] -translate-x-1/2 -translate-y-1/2 rounded-full pointer-events-none animate-ring-inner-compound"
          style={{
            border: "1px solid rgba(0, 65, 46, 0.07)",
            willChange: "border-color",
          }}
        />

        {/* Outer Delicate Dashed Architectural Arc */}
        <div
          className="absolute top-[22%] left-[4%] h-[760px] w-[760px] lg:h-[900px] lg:w-[900px] -translate-x-1/2 -translate-y-1/2 rounded-full pointer-events-none animate-ring-outer-compound"
          style={{
            border: "1px dashed rgba(150, 191, 138, 0.12)",
            strokeDasharray: "4 8",
            willChange: "border-color",
          }}
        />
      </div>

      {/* ============================================================== */}
      {/* RIGHT SIDE: Strictly Clean & Calm Wash (No Gradients Over Form) */}
      {/* ============================================================== */}
      <div className="hidden lg:block absolute inset-y-0 right-0 w-[42%] xl:w-[40%] bg-white" />
    </div>
  );
}
