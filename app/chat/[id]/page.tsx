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
    <div className="min-h-screen flex flex-col bg-zinc-50/50 text-zinc-900">
      <Header currentUser={sanitizedUser} cities={cityNames} />

      <main className="flex-1 py-6 sm:py-8">
        <Suspense
          fallback={
            <div className="mx-auto flex h-[calc(100vh-10rem)] max-w-4xl items-center justify-center rounded-3xl border border-zinc-200 bg-white">
              <div className="flex flex-col items-center gap-2">
                <div className="h-7 w-7 animate-spin rounded-full border-2 border-violet-600 border-t-transparent" />
                <span className="text-xs font-semibold text-zinc-400">Loading chat...</span>
              </div>
            </div>
          }
        >
          <ConversationLoader params={params} userId={currentUser.id} />
        </Suspense>
      </main>

      <Footer />
    </div>
  );
}
