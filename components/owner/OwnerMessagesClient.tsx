"use client";

import { useState, useEffect, useRef } from "react";
import { sendMessageAction } from "@/actions/chat";
import {
  MessageSquare,
  Send,
  Building2,
  Loader2,
} from "lucide-react";

interface ConversationItem {
  id: string;
  updatedAt: string;
  otherParty: {
    id: string;
    name: string;
    email: string;
    avatarUrl?: string | null;
  };
  lastMessage?: {
    id: string;
    content: string;
    senderId: string;
    createdAt: string;
  } | null;
  contextInfo?: {
    propertyName?: string;
    roomTypeName?: string;
  };
  messages?: Array<{
    id: string;
    senderId: string;
    content: string;
    createdAt: string;
  }>;
}

interface OwnerMessagesClientProps {
  currentUserId: string;
  conversations: ConversationItem[];
}

export function OwnerMessagesClient({
  currentUserId,
  conversations: initialConversations,
}: OwnerMessagesClientProps) {
  const [conversations, setConversations] = useState<ConversationItem[]>(initialConversations);
  const [selectedId, setSelectedId] = useState<string | null>(
    initialConversations.length > 0 ? initialConversations[0].id : null
  );
  const [messageInput, setMessageInput] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const selectedConversation = conversations.find((c) => c.id === selectedId);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [selectedConversation?.messages]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!messageInput.trim() || !selectedId) return;

    const content = messageInput.trim();
    setMessageInput("");
    setIsSending(true);
    setErrorMessage(null);

    const tempMessage = {
      id: `temp-${Date.now()}`,
      senderId: currentUserId,
      content,
      createdAt: new Date().toISOString(),
    };

    // Optimistic update
    setConversations((prev) =>
      prev.map((conv) => {
        if (conv.id === selectedId) {
          return {
            ...conv,
            lastMessage: tempMessage,
            messages: [...(conv.messages || []), tempMessage],
          };
        }
        return conv;
      })
    );

    try {
      const res = await sendMessageAction({
        conversationId: selectedId,
        content,
      });

      if (!res.success) {
        setErrorMessage(res.error || "Failed to send message.");
      }
    } catch {
      setErrorMessage("Network error sending message.");
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-2xs">
        <h1 className="text-xl font-bold tracking-tight text-slate-900">Tenant Messages & Inquiries</h1>
        <p className="text-xs text-slate-500 mt-1">
          Authenticated in-platform conversations with room seekers and prospective roommates.
        </p>
      </div>

      {conversations.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-16 text-center">
          <MessageSquare className="h-10 w-10 text-slate-300 mx-auto mb-3" />
          <h3 className="text-sm font-bold text-slate-900">No Conversations Yet</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1">
            When tenants or room seekers send in-platform chat messages regarding your listings, they
            will appear here.
          </p>
        </div>
      ) : (
        <div className="h-[640px] rounded-2xl border border-slate-200/80 bg-white shadow-2xs grid grid-cols-1 md:grid-cols-3 overflow-hidden">
          {/* Left: Conversations List */}
          <div className="border-r border-slate-200/80 overflow-y-auto flex flex-col divide-y divide-slate-100">
            {conversations.map((conv) => {
              const isSelected = conv.id === selectedId;
              return (
                <div
                  key={conv.id}
                  onClick={() => setSelectedId(conv.id)}
                  className={`cursor-pointer p-4 transition-colors select-none ${
                    isSelected ? "bg-indigo-50/60 border-l-4 border-l-indigo-600" : "hover:bg-slate-50"
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-bold text-xs text-slate-900 line-clamp-1">
                      {conv.otherParty.name}
                    </span>
                    <span className="text-[10px] text-slate-400">
                      {new Date(conv.updatedAt).toLocaleDateString("en-IN", {
                        day: "numeric",
                        month: "short",
                      })}
                    </span>
                  </div>

                  {conv.contextInfo?.propertyName && (
                    <div className="flex items-center gap-1 text-[11px] font-semibold text-indigo-600 mb-1">
                      <Building2 className="h-3 w-3" />
                      <span className="line-clamp-1">{conv.contextInfo.propertyName}</span>
                    </div>
                  )}

                  <p className="text-xs text-slate-500 line-clamp-1">
                    {conv.lastMessage?.content || "No messages yet"}
                  </p>
                </div>
              );
            })}
          </div>

          {/* Right: Message Window */}
          {selectedConversation ? (
            <div className="col-span-2 flex flex-col h-full bg-slate-50/50">
              {/* Chat Header */}
              <div className="border-b border-slate-200 bg-white p-4 flex items-center justify-between">
                <div>
                  <h3 className="text-xs font-bold text-slate-900">
                    {selectedConversation.otherParty.name}
                  </h3>
                  <div className="text-[11px] text-slate-400">
                    {selectedConversation.contextInfo?.propertyName || "In-Platform Chat"}
                  </div>
                </div>
              </div>

              {/* Chat Messages Body */}
              <div className="flex-1 overflow-y-auto p-4 space-y-3">
                {selectedConversation.messages && selectedConversation.messages.length > 0 ? (
                  selectedConversation.messages.map((msg) => {
                    const isMine = msg.senderId === currentUserId;
                    return (
                      <div
                        key={msg.id}
                        className={`flex flex-col ${isMine ? "items-end" : "items-start"}`}
                      >
                        <div
                          className={`max-w-[75%] rounded-2xl px-4 py-2 text-xs leading-relaxed ${
                            isMine
                              ? "bg-indigo-600 text-white rounded-br-xs"
                              : "bg-white text-slate-800 border border-slate-200/80 rounded-bl-xs shadow-2xs"
                          }`}
                        >
                          {msg.content}
                        </div>
                        <span className="text-[9px] text-slate-400 mt-1 px-1">
                          {new Date(msg.createdAt).toLocaleTimeString([], {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </span>
                      </div>
                    );
                  })
                ) : (
                  <div className="h-full flex items-center justify-center text-xs text-slate-400">
                    Say hello to start the conversation.
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Chat Input Bar */}
              <form
                onSubmit={handleSendMessage}
                className="p-3 border-t border-slate-200 bg-white flex items-center gap-2"
              >
                <input
                  type="text"
                  placeholder="Type a response..."
                  value={messageInput}
                  onChange={(e) => setMessageInput(e.target.value)}
                  className="flex-1 rounded-xl border border-slate-200 px-3.5 py-2 text-xs focus:border-indigo-600 focus:outline-hidden"
                />
                <button
                  type="submit"
                  disabled={isSending || !messageInput.trim()}
                  className="rounded-xl bg-indigo-600 px-3.5 py-2 text-xs font-bold text-white hover:bg-indigo-700 disabled:opacity-50 transition-colors flex items-center gap-1"
                >
                  {isSending ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <Send className="h-3.5 w-3.5" />
                  )}
                  <span>Send</span>
                </button>
              </form>
            </div>
          ) : (
            <div className="col-span-2 flex items-center justify-center text-xs text-slate-400">
              Select a conversation to read messages
            </div>
          )}
        </div>
      )}
    </div>
  );
}
