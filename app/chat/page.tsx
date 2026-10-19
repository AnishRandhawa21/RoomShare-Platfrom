import { Suspense } from "react";
import { redirect } from "next/navigation";
import Link from "next/link";
import type { Metadata } from "next";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { getCurrentUser } from "@/lib/auth/session";
import { getDiscoveryLocations } from "@/lib/discovery";
import { getUserConversationsAction } from "@/actions/chat";
import {
  MessageSquare,
  Building2,
  ArrowRight,
} from "lucide-react";

import { ChatInboxClient } from "@/components/chat/ChatInboxClient";

export const metadata: Metadata = {
  title: "My Roommate Chats | StayKro",
  description: "Secure, direct messaging with matched roommates and hosts without broker fees.",
};

async function InboxLoader() {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/login?returnUrl=/chat");
  }

  const res = await getUserConversationsAction();
  const conversations = res.success && res.data ? res.data : [];

  return <ChatInboxClient initialConversations={conversations} />;
}

export default async function ChatInboxPage() {
  const [currentUser, locationsData] = await Promise.all([
    getCurrentUser(),
    getDiscoveryLocations(),
  ]);

  const sanitizedUser = currentUser
    ? {
        id: currentUser.id,
        email: currentUser.email,
        role: currentUser.role,
        profile: currentUser.profile
          ? {
              fullName: currentUser.profile.fullName,
              avatarUrl: currentUser.profile.avatarUrl,
            }
          : null,
      }
    : null;

  const cityNames = locationsData.cities.map((c) => c.name);

  return (
    <div className="min-h-screen flex flex-col bg-zinc-50/40 text-zinc-900">
      <Header currentUser={sanitizedUser} cities={cityNames} />

      <main className="flex-1 py-10 sm:py-14">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
          <div className="mb-8">
            <span className="inline-block rounded-full bg-[#eff4ec] border border-[#96BF8A]/40 px-3 py-1 text-xs font-bold text-[#00412E] mb-2">
              In-Platform Messaging
            </span>
            <h1 className="text-2xl sm:text-3xl font-black text-zinc-950">
              Roommate Conversations
            </h1>
            <p className="mt-1 text-xs sm:text-sm text-zinc-500">
              Real-time messaging between matched roommates. Coordinate move-in dates and flatmate questions safely.
            </p>
          </div>

          <Suspense
            fallback={
              <div className="rounded-3xl border border-zinc-200 bg-white p-12 text-center text-zinc-400 text-xs font-semibold">
                Loading conversations...
              </div>
            }
          >
            <InboxLoader />
          </Suspense>
        </div>
      </main>

      <Footer />
    </div>
  );
}
