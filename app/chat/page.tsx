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

  if (conversations.length === 0) {
    return (
      <div className="rounded-3xl border border-dashed border-zinc-200 bg-white p-12 text-center max-w-md mx-auto shadow-xs">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-violet-100 text-violet-700 mb-4">
          <MessageSquare className="h-6 w-6" />
        </div>
        <h3 className="text-base font-bold text-zinc-950">
          No active conversations yet
        </h3>
        <p className="mt-1.5 text-xs text-zinc-500 leading-relaxed">
          Apply for roommate requirements or accept incoming applications on your posts to start chatting here.
        </p>
        <div className="mt-6 flex justify-center gap-3">
          <Link
            href="/roommates"
            className="rounded-xl bg-violet-600 px-5 py-2.5 text-xs font-bold text-white hover:bg-violet-700 transition-colors shadow-xs"
          >
            Explore Roommates
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="divide-y divide-zinc-200 rounded-3xl border border-zinc-200 bg-white shadow-xs overflow-hidden">
      {conversations.map((conv) => {
        const time = conv.lastMessageAt
          ? new Date(conv.lastMessageAt).toLocaleDateString("en-IN", {
              day: "numeric",
              month: "short",
            })
          : "";

        return (
          <Link
            key={conv.id}
            href={`/chat/${conv.id}`}
            className="flex items-center justify-between p-5 hover:bg-zinc-50 transition-colors group"
          >
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-tr from-violet-600 to-indigo-600 text-base font-black text-white shadow-sm shadow-violet-100">
                {conv.otherParty.name[0]?.toUpperCase() || "U"}
              </div>

              <div className="space-y-0.5">
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-bold text-zinc-950 group-hover:text-violet-700 transition-colors">
                    {conv.otherParty.name}
                  </h3>
                  <span className="text-xs text-zinc-400">•</span>
                  <span className="text-xs text-zinc-500 font-medium">
                    {conv.otherParty.profession}
                  </span>
                </div>

                {conv.roommateRequest && (
                  <div className="flex items-center gap-1.5 text-xs text-zinc-500 font-medium">
                    <Building2 className="h-3.5 w-3.5 text-violet-600 shrink-0" />
                    <span className="truncate max-w-[280px]">
                      {conv.roommateRequest.title}
                    </span>
                  </div>
                )}

                <p className="text-xs text-zinc-600 line-clamp-1 italic">
                  {conv.lastMessageText || "New match initialized. Start chatting!"}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3 shrink-0">
              <span className="text-[11px] text-zinc-400">{time}</span>
              <ArrowRight className="h-4 w-4 text-zinc-400 group-hover:text-violet-600 group-hover:translate-x-0.5 transition-all" />
            </div>
          </Link>
        );
      })}
    </div>
  );
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
            <span className="inline-block rounded-full bg-violet-100 px-3 py-1 text-xs font-bold text-violet-700 mb-2">
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
