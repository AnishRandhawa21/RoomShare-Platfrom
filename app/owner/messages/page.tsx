import { Suspense } from "react";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/session";
import { getOwnerConversationsAction } from "@/actions/owner";
import { OwnerMessagesClient } from "@/components/owner/OwnerMessagesClient";

export const metadata = {
  title: "Tenant Messages | StayKro Owner",
  description: "Direct communications with tenants and room seekers.",
};

async function MessagesDataLoader() {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/login?returnUrl=/owner/messages");
  }

  const res = await getOwnerConversationsAction();
  const rawConversations = res.success && res.conversations ? res.conversations : [];

  const conversations = rawConversations.map((conv: any) => {
    const otherParticipant = conv.participants?.find((p: any) => p.userId !== user.id)?.user;
    const name = otherParticipant?.profile?.fullName || otherParticipant?.email || "Tenant";

    return {
      id: conv.id,
      updatedAt: conv.updatedAt.toISOString(),
      otherParty: {
        id: otherParticipant?.id || "unknown",
        name,
        email: otherParticipant?.email || "",
        avatarUrl: otherParticipant?.profile?.avatarUrl || null,
      },
      lastMessage: conv.messages?.[0]
        ? {
            id: conv.messages[0].id,
            content: conv.messages[0].content,
            senderId: conv.messages[0].senderId,
            createdAt: conv.messages[0].createdAt.toISOString(),
          }
        : null,
      contextInfo: {
        propertyName: conv.roommateRequest?.property?.name,
        roomTypeName: conv.roommateRequest?.roomType?.name,
      },
      messages: (conv.messages || []).map((m: any) => ({
        id: m.id,
        senderId: m.senderId,
        content: m.content,
        createdAt: m.createdAt.toISOString(),
      })),
    };
  });

  return <OwnerMessagesClient currentUserId={user.id} conversations={conversations} />;
}

export default function OwnerMessagesPage() {
  return (
    <Suspense
      fallback={
        <div className="mx-auto max-w-7xl px-4 py-16 text-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-indigo-600 border-t-transparent mx-auto mb-4" />
          <p className="text-sm font-semibold text-slate-500">Loading conversations...</p>
        </div>
      }
    >
      <MessagesDataLoader />
    </Suspense>
  );
}
