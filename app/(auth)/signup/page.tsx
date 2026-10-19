"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { AuthSplitScreen } from "@/components/auth/AuthSplitScreen";
import { Loader2 } from "lucide-react";

function SignUpContent() {
  const searchParams = useSearchParams();
  const returnUrl = searchParams.get("returnUrl") || "/";
  const urlMessage = searchParams.get("message");
  const urlError = searchParams.get("error");
  const inviteToken = searchParams.get("invite");

  return (
    <AuthSplitScreen
      initialMode="signup"
      returnUrl={returnUrl}
      urlError={urlError}
      urlMessage={urlMessage}
      inviteToken={inviteToken}
    />
  );
}

export default function SignUpPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen w-full flex items-center justify-center bg-white">
          <div className="flex flex-col items-center gap-3">
            <Loader2 className="h-8 w-8 animate-spin text-[#00412E]" />
            <p className="text-xs font-semibold text-zinc-500">Loading StayKro...</p>
          </div>
        </div>
      }
    >
      <SignUpContent />
    </Suspense>
  );
}
