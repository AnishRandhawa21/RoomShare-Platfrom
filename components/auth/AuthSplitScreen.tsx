"use client";

import { StayKroAuthBackground } from "./StayKroAuthBackground";
import { AuthVisualShowcase } from "./AuthVisualShowcase";
import { AuthFormPanel } from "./AuthFormPanel";

interface AuthSplitScreenProps {
  initialMode: "login" | "signup";
  returnUrl?: string;
  urlError?: string | null;
  urlMessage?: string | null;
  inviteToken?: string | null;
}

export function AuthSplitScreen({
  initialMode,
  returnUrl = "/",
  urlError = null,
  urlMessage = null,
  inviteToken = null,
}: AuthSplitScreenProps) {
  return (
    <main className="relative min-h-screen lg:h-screen lg:max-h-screen w-full flex flex-col lg:flex-row bg-white selection:bg-[#96BF8A] selection:text-[#00412E] overflow-x-hidden lg:overflow-hidden">
      {/* Full-Viewport Ambient Translucent Sweeps & Architectural Blueprint Background */}
      <StayKroAuthBackground />

      {/* Left Column: Marketing Typography (56-60% width on desktop, hidden on mobile) */}
      <section
        aria-label="StayKro Experience Showcase"
        className="relative z-10 hidden lg:flex lg:w-[56%] xl:w-[58%] 2xl:w-[60%] h-full flex-col justify-between shrink-0"
      >
        <AuthVisualShowcase />
      </section>

      {/* Right Column: Authentication Panel (40-44% width on desktop, full-width on mobile) */}
      <section
        aria-label="Account Authentication"
        className="relative z-10 w-full lg:w-[44%] xl:w-[42%] 2xl:w-[40%] min-h-screen lg:min-h-0 lg:h-full flex flex-col justify-center overflow-y-auto py-10 lg:py-6 px-4 sm:px-8"
      >
        <AuthFormPanel
          initialMode={initialMode}
          returnUrl={returnUrl}
          urlError={urlError}
          urlMessage={urlMessage}
          inviteToken={inviteToken}
        />
      </section>
    </main>
  );
}
