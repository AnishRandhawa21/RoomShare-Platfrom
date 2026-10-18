"use server";

import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth/session";
import { revalidatePath } from "next/cache";

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
      return {
        id: conv.id,
        roommateRequest: conv.roommateRequest,
        lastMessageText: conv.lastMessageText,
        lastMessageAt: conv.lastMessageAt,
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

    const trimmed = content.trim();

    const [message] = await prisma.$transaction([
      prisma.message.create({
        data: {
          conversationId,
          senderId: user.id,
          content: trimmed,
          messageType: "TEXT",
        },
      }),
      prisma.conversation.update({
        where: { id: conversationId },
        data: {
          lastMessageText: trimmed,
          lastMessageAt: new Date(),
        },
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
