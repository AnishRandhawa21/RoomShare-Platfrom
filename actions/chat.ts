"use server";

import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth/session";
import { revalidatePath } from "next/cache";
import { checkRateLimit } from "@/lib/rate-limit";
import { sanitizeText } from "@/lib/sanitize";

export interface ChatActionResult<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
}

export interface ConversationSummaryItem {
  id: string;
  roommateRequest: {
    id: string;
    title: string;
    locality: string;
    city: string;
  } | null;
  lastMessageText: string | null;
  lastMessageAt: Date | null;
  hasUnread?: boolean;
  otherParty: {
    id: string;
    name: string;
    avatarUrl: string | null;
    profession: string;
  };
}

export interface ConversationDetailData {
  id: string;
  roommateRequest: {
    id: string;
    title: string;
    locality: string;
    city: string;
    rentPerPerson: number;
  } | null;
  messages: Array<{
    id: string;
    senderId: string;
    content: string;
    messageType: "TEXT" | "IMAGE" | "SYSTEM";
    createdAt: Date;
  }>;
  otherParty: {
    id: string;
    name: string;
    avatarUrl: string | null;
    profession: string;
  };
}

export interface MessageData {
  id: string;
  conversationId: string;
  senderId: string;
  content: string;
  messageType: "TEXT" | "IMAGE" | "SYSTEM";
  createdAt: Date;
}

/**
 * Get all conversations the current user is part of.
 */
export async function getUserConversationsAction(): Promise<ChatActionResult<ConversationSummaryItem[]>> {
  const user = await getCurrentUser();
  if (!user) {
    return { success: false, error: "Unauthorized." };
  }

  try {
    const participants = await prisma.conversationParticipant.findMany({
      where: { userId: user.id },
      include: {
        conversation: {
          include: {
            roommateRequest: {
              select: {
                id: true,
                title: true,
                locality: true,
                city: true,
              },
            },
            messages: {
              orderBy: { createdAt: "desc" },
              take: 1,
              select: {
                senderId: true,
                createdAt: true,
              },
            },
            participants: {
              include: {
                user: {
                  select: {
                    id: true,
                    profile: {
                      select: {
                        fullName: true,
                        avatarUrl: true,
                        profession: true,
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
      orderBy: { conversation: { lastMessageAt: "desc" } },
    });

    const conversations: ConversationSummaryItem[] = participants.map((p) => {
      const conv = p.conversation;
      const otherParticipant = conv.participants.find((pt) => pt.userId !== user.id)?.user;
      const lastMsg = conv.messages?.[0];
      const hasUnread = Boolean(
        lastMsg &&
        lastMsg.senderId !== user.id &&
        (!p.lastReadAt || new Date(lastMsg.createdAt) > new Date(p.lastReadAt))
      );

      return {
        id: conv.id,
        roommateRequest: conv.roommateRequest,
        lastMessageText: conv.lastMessageText,
        lastMessageAt: conv.lastMessageAt,
        hasUnread,
        otherParty: {
          id: otherParticipant?.id || "unknown",
          name: otherParticipant?.profile?.fullName || "Flatmate Match",
          avatarUrl: otherParticipant?.profile?.avatarUrl || null,
          profession: otherParticipant?.profile?.profession || "Member",
        },
      };
    });

    return { success: true, data: conversations };
  } catch (error) {
    console.error("Error fetching conversations:", error);
    return { success: false, error: "Failed to load chats." };
  }
}

/**
 * Loads conversation details and messages for an active chat session.
 */
export async function getConversationDetailsAction(
  conversationId: string
): Promise<ChatActionResult<ConversationDetailData>> {
  const user = await getCurrentUser();
  if (!user) {
    return { success: false, error: "Unauthorized." };
  }

  try {
    const conversation = await prisma.conversation.findUnique({
      where: { id: conversationId },
      include: {
        roommateRequest: {
          select: {
            id: true,
            title: true,
            locality: true,
            city: true,
            rentPerPerson: true,
          },
        },
        participants: {
          include: {
            user: {
              select: {
                id: true,
                profile: {
                  select: {
                    fullName: true,
                    avatarUrl: true,
                    profession: true,
                  },
                },
              },
            },
          },
        },
        messages: {
          orderBy: { createdAt: "asc" },
          take: 100,
        },
      },
    });

    if (!conversation) {
      return { success: false, error: "Conversation not found." };
    }

    const isParticipant = conversation.participants.some((p) => p.userId === user.id);
    if (!isParticipant && user.role !== "ADMIN") {
      return { success: false, error: "Unauthorized to view this conversation." };
    }

    // Mark as read asynchronously
    prisma.conversationParticipant
      .updateMany({
        where: { conversationId, userId: user.id },
        data: { lastReadAt: new Date() },
      })
      .catch((err) => console.error("Error updating lastReadAt:", err));

    const otherParticipant = conversation.participants.find((pt) => pt.userId !== user.id)?.user;

    return {
      success: true,
      data: {
        id: conversation.id,
        roommateRequest: conversation.roommateRequest,
        messages: conversation.messages,
        otherParty: {
          id: otherParticipant?.id || "unknown",
          name: otherParticipant?.profile?.fullName || "Flatmate",
          avatarUrl: otherParticipant?.profile?.avatarUrl || null,
          profession: otherParticipant?.profile?.profession || "Member",
        },
      },
    };
  } catch (error) {
    console.error("Error loading conversation:", error);
    return { success: false, error: "Failed to load chat." };
  }
}

/**
 * Fetches latest messages created after a given timestamp (for smart background polling sync).
 */
export async function getLatestMessagesAction({
  conversationId,
  after,
}: {
  conversationId: string;
  after?: string;
}): Promise<ChatActionResult<MessageData[]>> {
  const user = await getCurrentUser();
  if (!user) {
    return { success: false, error: "Unauthorized." };
  }

  try {
    const isParticipant = await prisma.conversationParticipant.findUnique({
      where: {
        conversationId_userId: {
          conversationId,
          userId: user.id,
        },
      },
    });

    if (!isParticipant && user.role !== "ADMIN") {
      return { success: false, error: "Unauthorized." };
    }

    const whereClause: {
      conversationId: string;
      createdAt?: { gt: Date };
    } = { conversationId };

    if (after) {
      whereClause.createdAt = {
        gt: new Date(after),
      };
    }

    const messages = await prisma.message.findMany({
      where: whereClause,
      orderBy: { createdAt: "asc" },
      take: 50,
    });

    // Mark conversation read in background
    if (messages.length > 0) {
      prisma.conversationParticipant
        .updateMany({
          where: { conversationId, userId: user.id },
          data: { lastReadAt: new Date() },
        })
        .catch(() => {});
    }

    return {
      success: true,
      data: messages,
    };
  } catch (error) {
    console.error("Error fetching latest messages:", error);
    return { success: false, error: "Failed to fetch new messages." };
  }
}

/**
 * Explicitly marks a conversation as read by the current user.
 */
export async function markConversationAsReadAction(
  conversationId: string
): Promise<ChatActionResult<boolean>> {
  const user = await getCurrentUser();
  if (!user) {
    return { success: false, error: "Unauthorized." };
  }

  try {
    await prisma.conversationParticipant.updateMany({
      where: { conversationId, userId: user.id },
      data: { lastReadAt: new Date() },
    });
    return { success: true, data: true };
  } catch (error) {
    console.error("Error marking conversation as read:", error);
    return { success: false, error: "Failed to mark as read." };
  }
}

/**
 * Sends a message in a conversation.
 */
export async function sendMessageAction({
  conversationId,
  content,
}: {
  conversationId: string;
  content: string;
}): Promise<ChatActionResult<MessageData>> {
  const user = await getCurrentUser();
  if (!user) {
    return { success: false, error: "Unauthorized." };
  }

  if (!content || !content.trim()) {
    return { success: false, error: "Message cannot be empty." };
  }

  try {
    // Check membership
    const participant = await prisma.conversationParticipant.findUnique({
      where: {
        conversationId_userId: {
          conversationId,
          userId: user.id,
        },
      },
    });

    if (!participant && user.role !== "ADMIN") {
      return { success: false, error: "Unauthorized." };
    }

    // Rate Limiting (max 30 messages per minute per user to stop flooding)
    const rateLimit = checkRateLimit(`chat:${user.id}`, 30, 60000);
    if (!rateLimit.success) {
      return { success: false, error: "You are sending messages too quickly. Please pause for a moment." };
    }

    const sanitized = sanitizeText(content, 2000);
    if (!sanitized) {
      return { success: false, error: "Message cannot be empty." };
    }

    const [message] = await prisma.$transaction([
      prisma.message.create({
        data: {
          conversationId,
          senderId: user.id,
          content: sanitized,
          messageType: "TEXT",
        },
      }),
      prisma.conversation.update({
        where: { id: conversationId },
        data: {
          lastMessageText: sanitized,
          lastMessageAt: new Date(),
        },
      }),
      prisma.conversationParticipant.updateMany({
        where: { conversationId, userId: user.id },
        data: { lastReadAt: new Date() },
      }),
    ]);

    try {
      revalidatePath(`/chat/${conversationId}`);
      revalidatePath(`/chat`);
    } catch {
      // safe fallback
    }

    return {
      success: true,
      data: message,
    };
  } catch (error) {
    console.error("Error sending message:", error);
    return { success: false, error: "Failed to send message." };
  }
}

/**
 * Starts or reuses a Conversation between the current authenticated user and the creator of a RoommateRequest.
 * Protects user privacy by routing all communication through the in-platform chat system.
 */
export async function startOrGetRoommateConversationAction(
  requestId: string
): Promise<ChatActionResult<{ conversationId: string }>> {
  const user = await getCurrentUser();
  if (!user) {
    return { success: false, error: "Please sign in to message this flatmate." };
  }

  try {
    const request = await prisma.roommateRequest.findUnique({
      where: { id: requestId },
      select: {
        id: true,
        creatorId: true,
        title: true,
        propertyName: true,
        roomTypeName: true,
        status: true,
      },
    });

    if (!request) {
      return { success: false, error: "Roommate requirement not found." };
    }

    if (request.creatorId === user.id) {
      return { success: false, error: "You cannot message yourself on your own post." };
    }

    // Check if a conversation already exists between these 2 users for this request
    const existingConv = await prisma.conversation.findFirst({
      where: {
        roommateRequestId: request.id,
        AND: [
          { participants: { some: { userId: user.id } } },
          { participants: { some: { userId: request.creatorId } } },
        ],
      },
      select: { id: true },
    });

    if (existingConv) {
      return { success: true, data: { conversationId: existingConv.id } };
    }

    // Otherwise create conversation
    const newConv = await prisma.conversation.create({
      data: {
        roommateRequestId: request.id,
        status: "ACTIVE",
        lastMessageText: "Direct flatmate inquiry initiated.",
        lastMessageAt: new Date(),
        participants: {
          create: [
            { userId: request.creatorId },
            { userId: user.id },
          ],
        },
        messages: {
          create: [
            {
              senderId: user.id,
              messageType: "SYSTEM",
              content: `Direct conversation initiated regarding ${request.title}${
                request.propertyName ? ` at ${request.propertyName}` : ""
              }. Say hello to coordinate move-in details safely!`,
            },
          ],
        },
      },
      select: { id: true },
    });

    try {
      revalidatePath("/chat");
    } catch {
      // safe fallback
    }

    return { success: true, data: { conversationId: newConv.id } };
  } catch (error) {
    console.error("Error creating/reusing conversation:", error);
    return { success: false, error: "Failed to start chat." };
  }
}

/**
 * Quick, lightweight check to determine if the current user has any unread messages.
 * Used for displaying a notification pill / badge dot on the homepage and header chat icon.
 */
export async function getUnreadMessagesStatusAction(): Promise<{
  hasUnread: boolean;
  unreadCount: number;
}> {
  const user = await getCurrentUser();
  if (!user) {
    return { hasUnread: false, unreadCount: 0 };
  }

  try {
    const participants = await prisma.conversationParticipant.findMany({
      where: { userId: user.id },
      select: {
        lastReadAt: true,
        conversation: {
          select: {
            lastMessageAt: true,
            messages: {
              orderBy: { createdAt: "desc" },
              take: 1,
              select: {
                senderId: true,
                createdAt: true,
              },
            },
          },
        },
      },
    });

    let unreadCount = 0;
    for (const p of participants) {
      const lastMsg = p.conversation.messages?.[0];
      if (
        lastMsg &&
        lastMsg.senderId !== user.id &&
        (!p.lastReadAt || new Date(lastMsg.createdAt) > new Date(p.lastReadAt))
      ) {
        unreadCount++;
      }
    }

    return {
      hasUnread: unreadCount > 0,
      unreadCount,
    };
  } catch (error) {
    console.error("Error checking unread status:", error);
    return { hasUnread: false, unreadCount: 0 };
  }
}

