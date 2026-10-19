import { Suspense } from "react";
import { notFound, redirect } from "next/navigation";
import type { Metadata } from "next";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { ChatClient } from "@/components/chat/ChatClient";
import { getCurrentUser } from "@/lib/auth/session";
import { getConversationDetailsAction } from "@/actions/chat";
import { getDiscoveryLocations } from "@/lib/discovery";

interface PageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: "Chat | StayKro",
    description: "In-platform messaging for matched roommates.",
  };
}


async function ConversationLoader({
  params,
  userId,
}: {
  params: Promise<{ id: string }>;
  userId: string;
}) {
  const { id } = await params;
  const res = await getConversationDetailsAction(id);

  if (!res.success || !res.data) {
    notFound();
  }

  const data = res.data;

  return (
    <ChatClient
      conversationId={data.id}
      initialMessages={data.messages}
      otherParty={data.otherParty}
      roommateRequest={data.roommateRequest}
      currentUserId={userId}
    />
  );
}

export default async function ConversationPage({ params }: PageProps) {
  const [currentUser, locationsData] = await Promise.all([
    getCurrentUser(),
    getDiscoveryLocations(),
  ]);

  const { id } = await params;
  if (!currentUser) {
    redirect(`/login?returnUrl=/chat/${id}`);
  }

  const sanitizedUser = {
    id: currentUser.id,
    email: currentUser.email,
    role: currentUser.role,
    profile: currentUser.profile
      ? {
          fullName: currentUser.profile.fullName,
          avatarUrl: currentUser.profile.avatarUrl,
        }
      : null,
  };

  const cityNames = locationsData.cities.map((c) => c.name);

  return (
    <div className="h-screen flex flex-col bg-[#F9FAF8] text-zinc-900 overflow-hidden">
      <Header currentUser={sanitizedUser} cities={cityNames} />

      <main className="flex-1 min-h-0 px-2 sm:px-4 py-2 sm:py-3 overflow-hidden">
        <Suspense
          fallback={
            <div className="mx-auto flex h-full max-w-4xl items-center justify-center rounded-3xl border border-[#E8EAE5] bg-white shadow-sm">
              <div className="flex flex-col items-center gap-3">
                <div className="h-8 w-8 animate-spin rounded-full border-3 border-[#00412E] border-t-[#96BF8A]" />
                <span className="text-xs font-bold text-zinc-500">Connecting to secure chat...</span>
              </div>
            </div>
          }
        >
          <ConversationLoader params={params} userId={currentUser.id} />
        </Suspense>
      </main>
    </div>
  );
}
