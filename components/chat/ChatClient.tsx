"use client";

import { useState, useEffect, useRef, useMemo, useCallback } from "react";
import Link from "next/link";
import {
  Send,
  Building2,
  ArrowLeft,
  ShieldCheck,
  Loader2,
  CheckCheck,
  Sparkles,
  ArrowDown,
  Clock,
  Radio,
  ExternalLink,
  AlertCircle,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import {
  sendMessageAction,
  getLatestMessagesAction,
  markConversationAsReadAction,
} from "@/actions/chat";

export interface MessageItem {
  id: string;
  senderId: string;
  content: string;
  messageType: "TEXT" | "IMAGE" | "SYSTEM";
  createdAt: Date | string;
  status?: "sending" | "sent" | "failed";
}

interface ChatClientProps {
  conversationId: string;
  initialMessages: MessageItem[];
  otherParty: {
    id: string;
    name: string;
    avatarUrl: string | null;
    profession: string | null;
  };
  roommateRequest: {
    id: string;
    title: string;
    locality: string;
    city: string;
    rentPerPerson: number;
  } | null;
  currentUserId: string;
}

const QUICK_ICEBREAKERS = [
  "👋 Hi! Is this room still available?",
  "📅 Can we schedule a visit this week?",
  "💰 Does the rent include maintenance & wifi?",
  "🤝 Happy to connect and discuss flatmate preferences!",
];

export function ChatClient({
  conversationId,
  initialMessages,
  otherParty,
  roommateRequest,
  currentUserId,
}: ChatClientProps) {
  const [messages, setMessages] = useState<MessageItem[]>(initialMessages);
  const [inputText, setInputText] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isRealtimeActive, setIsRealtimeActive] = useState(false);
  const [showScrollBottom, setShowScrollBottom] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const chatScrollContainerRef = useRef<HTMLDivElement>(null);
  const channelRef = useRef<any>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const messagesRef = useRef<MessageItem[]>(messages);

  // Keep messagesRef in sync for safe access without causing re-renders
  useEffect(() => {
    messagesRef.current = messages;
  }, [messages]);

  // Auto-scroll to bottom of the chat container ONLY (prevents page/window from scrolling up)
  const scrollToBottom = useCallback((behavior: ScrollBehavior = "smooth") => {
    if (chatScrollContainerRef.current) {
      chatScrollContainerRef.current.scrollTo({
        top: chatScrollContainerRef.current.scrollHeight,
        behavior,
      });
    }
  }, []);

  // Initial scroll and mark as read
  useEffect(() => {
    scrollToBottom("auto");
    markConversationAsReadAction(conversationId).catch(() => {});
  }, [conversationId, scrollToBottom]);

  // Scroll to bottom on messages change
  useEffect(() => {
    if (chatScrollContainerRef.current) {
      const { scrollTop, scrollHeight, clientHeight } = chatScrollContainerRef.current;
      const isNearBottom = scrollHeight - scrollTop - clientHeight < 250;
      if (isNearBottom) {
        scrollToBottom("smooth");
      }
    }
  }, [messages, scrollToBottom]);

  // Dynamic textarea height adjustment
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 130)}px`;
    }
  }, [inputText]);

  // Track scroll position to show floating "Jump to latest" button
  const handleScroll = () => {
    if (!chatScrollContainerRef.current) return;
    const { scrollTop, scrollHeight, clientHeight } = chatScrollContainerRef.current;
    const isScrolledUp = scrollHeight - scrollTop - clientHeight > 180;
    setShowScrollBottom(isScrolledUp);
  };

  // Helper to safely append new incoming message avoiding duplicates
  const handleIncomingMessage = useCallback((incoming: MessageItem) => {
    setMessages((prev) => {
      const exists = prev.some((m) => m.id === incoming.id);
      if (exists) return prev;

      // Replace optimistic message if matching
      const optimisticIdx = prev.findIndex(
        (m) =>
          m.senderId === incoming.senderId &&
          m.content === incoming.content &&
          m.id.startsWith("temp_")
      );

      if (optimisticIdx !== -1) {
        const next = [...prev];
        next[optimisticIdx] = incoming;
        return next;
      }

      return [...prev, incoming];
    });
  }, []);

  // =========================================================================
  // MULTI-LAYER REALTIME ENGINE:
  // 1. Supabase Broadcast (instant client-to-client <50ms)
  // 2. Supabase Postgres Changes
  // 3. Resilient Polling Fallback (runs every 3.5s + on focus)
  // =========================================================================
  useEffect(() => {
    let supabase: any = null;
    let channel: any = null;

    try {
      const hasUrl = Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL);
      const hasKey = Boolean(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

      if (hasUrl && hasKey) {
        supabase = createClient();
        const channelName = `conversation_channel_${conversationId}`;

        channel = supabase.channel(channelName, {
          config: {
            broadcast: { ack: false },
          },
        });

        channelRef.current = channel;

        // 1. Supabase Broadcast listener
        channel.on("broadcast", { event: "new_message" }, (payload: any) => {
          if (payload && payload.payload) {
            handleIncomingMessage(payload.payload as MessageItem);
          }
        });

        // 2. Postgres Changes listener
        channel.on(
          "postgres_changes",
          {
            event: "INSERT",
            schema: "public",
            table: "Message",
            filter: `conversationId=eq.${conversationId}`,
          },
          (payload: any) => {
            if (payload && payload.new) {
              handleIncomingMessage(payload.new as MessageItem);
            }
          }
        );

        // Subscribe and track socket status
        channel.subscribe((status: string) => {
          if (status === "SUBSCRIBED") {
            setIsRealtimeActive(true);
          } else if (status === "CLOSED" || status === "CHANNEL_ERROR") {
            setIsRealtimeActive(false);
          }
        });
      }
    } catch (err) {
      console.warn("Realtime initialization skipped:", err);
    }

    // 3. Resilient Polling Fallback (Zero DB load when tab is hidden)
    const syncLatest = async () => {
      if (typeof document !== "undefined" && document.hidden) return;

      try {
        const current = messagesRef.current;
        const validTimestamps = current
          .filter((m) => !m.id.startsWith("temp_"))
          .map((m) => new Date(m.createdAt).getTime())
          .filter((t) => !isNaN(t));

        const latestTime = validTimestamps.length > 0 ? Math.max(...validTimestamps) : 0;
        const afterIso = latestTime > 0 ? new Date(latestTime).toISOString() : undefined;

        const res = await getLatestMessagesAction({ conversationId, after: afterIso });
        if (res.success && res.data && res.data.length > 0) {
          res.data.forEach((msg) => {
            handleIncomingMessage(msg as MessageItem);
          });
        }
      } catch (pollErr) {
        // Safe silent sync fallback
      }
    };

    const interval = setInterval(syncLatest, 5000);

    const onVisible = () => {
      if (typeof document !== "undefined" && !document.hidden) {
        syncLatest();
      }
    };
    window.addEventListener("focus", onVisible);
    document.addEventListener("visibilitychange", onVisible);

    return () => {
      clearInterval(interval);
      window.removeEventListener("focus", onVisible);
      document.removeEventListener("visibilitychange", onVisible);
      if (supabase && channel) {
        supabase.removeChannel(channel);
      }
      channelRef.current = null;
    };
  }, [conversationId, handleIncomingMessage]);

  // Send message handler with full error recovery & unsent text preservation
  const handleSendMessage = async (explicitText?: string) => {
    const rawContent = (explicitText !== undefined ? explicitText : inputText).trim();
    if (!rawContent || isSending) return;

    setErrorMessage(null);
    setInputText("");
    setIsSending(true);

    // Optimistic message append
    const optimisticId = `temp_${Date.now()}`;
    const optimisticMsg: MessageItem = {
      id: optimisticId,
      senderId: currentUserId,
      content: rawContent,
      messageType: "TEXT",
      createdAt: new Date().toISOString(),
      status: "sending",
    };

    setMessages((prev) => [...prev, optimisticMsg]);

    try {
      const res = await sendMessageAction({
        conversationId,
        content: rawContent,
      });

      if (res.success && res.data) {
        const delivered: MessageItem = {
          ...res.data,
          status: "sent",
        };

        // Replace optimistic message
        setMessages((prev) =>
          prev.map((m) => (m.id === optimisticId ? delivered : m))
        );

        // Broadcast to connected peers
        try {
          if (channelRef.current) {
            channelRef.current.send({
              type: "broadcast",
              event: "new_message",
              payload: delivered,
            });
          }

          // Also broadcast to otherParty notification channel for instant 0-query header dot
          const supabase = createClient();
          const notifChannel = supabase.channel(`user_notif_${otherParty.id}`);
          notifChannel.subscribe((status: string) => {
            if (status === "SUBSCRIBED") {
              notifChannel.send({
                type: "broadcast",
                event: "incoming_chat",
                payload: { conversationId },
              });
            }
          });
        } catch {
          // broadcast non-critical failure
        }
      } else {
        // Revert optimistic and restore typed text so user doesn't lose it
        setMessages((prev) => prev.filter((m) => m.id !== optimisticId));
        setInputText(rawContent);
        setErrorMessage(res.error || "Message delivery failed. Please retry.");
      }
    } catch (err: any) {
      console.error("Message send error:", err);
      setMessages((prev) => prev.filter((m) => m.id !== optimisticId));
      setInputText(rawContent);
      setErrorMessage("Network issue. Could not send message.");
    } finally {
      setIsSending(false);
      // Retain focus for continuous typing without scrolling window
      setTimeout(() => {
        textareaRef.current?.focus({ preventScroll: true });
      }, 50);
    }
  };

  // Helper for quick chip click (loads into text area & focuses without scroll)
  const handleChipClick = (text: string) => {
    setInputText(text);
    setErrorMessage(null);
    setTimeout(() => {
      textareaRef.current?.focus({ preventScroll: true });
    }, 50);
  };

  // Group messages by Date
  const groupedMessages = useMemo(() => {
    const groups: { dateLabel: string; items: MessageItem[] }[] = [];
    const today = new Date().toDateString();
    const yesterday = new Date(Date.now() - 86400000).toDateString();

    messages.forEach((msg) => {
      const msgDate = new Date(msg.createdAt);
      const msgDateString = msgDate.toDateString();

      let label = msgDate.toLocaleDateString("en-IN", {
        day: "numeric",
        month: "short",
        year: msgDate.getFullYear() !== new Date().getFullYear() ? "numeric" : undefined,
      });

      if (msgDateString === today) label = "Today";
      else if (msgDateString === yesterday) label = "Yesterday";

      let lastGroup = groups[groups.length - 1];
      if (!lastGroup || lastGroup.dateLabel !== label) {
        lastGroup = { dateLabel: label, items: [] };
        groups.push(lastGroup);
      }
      lastGroup.items.push(msg);
    });

    return groups;
  }, [messages]);

  const hasUserMessages = messages.some((m) => m.messageType === "TEXT");

  return (
    <div className="relative mx-auto flex h-full max-h-full w-full max-w-4xl flex-col rounded-3xl border border-[#E8EAE5] bg-white shadow-xl shadow-zinc-950/5 overflow-hidden">
      {/* ================================================================= */}
      {/* TOP HEADER */}
      {/* ================================================================= */}
      <div className="shrink-0 flex flex-col sm:flex-row sm:items-center justify-between border-b border-[#E8EAE5] bg-white px-4 py-3 sm:px-6 gap-3 z-10">
        <div className="flex items-center gap-3">
          <Link
            href="/chat"
            className="flex h-9 w-9 items-center justify-center rounded-xl text-zinc-500 hover:bg-[#eff4ec] hover:text-[#00412E] transition-colors"
            title="Back to all chats"
          >
            <ArrowLeft className="h-5 w-5" />
          </Link>

          <div className="relative">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#00412E] text-base font-black text-white shadow-sm shadow-[#00412E]/25">
              {otherParty.name[0]?.toUpperCase() || "F"}
            </div>
            {/* Live Socket pulsating status dot */}
            <span
              className="absolute -bottom-0.5 -right-0.5 flex h-3.5 w-3.5 items-center justify-center rounded-full bg-white ring-2 ring-white"
              title={isRealtimeActive ? "Realtime Live" : "Active Sync"}
            >
              <span
                className={`h-2.5 w-2.5 rounded-full ${
                  isRealtimeActive ? "bg-[#96BF8A] animate-pulse" : "bg-[#96BF8A]"
                }`}
              />
            </span>
          </div>

          <div>
            <div className="flex items-center gap-1.5">
              <h2 className="text-sm sm:text-base font-bold text-zinc-950">
                {otherParty.name}
              </h2>
              <span title="Verified Flatmate Profile">
                <ShieldCheck className="h-4 w-4 text-[#96BF8A]" />
              </span>
            </div>
            <div className="flex items-center gap-2 text-xs text-zinc-500">
              <span>{otherParty.profession || "Flatmate Member"}</span>
              <span className="text-zinc-300">•</span>
              <span className="flex items-center gap-1 text-[11px] font-medium text-[#00412E]">
                <Radio className="h-3 w-3 text-[#96BF8A]" />
                {isRealtimeActive ? "Realtime Active" : "Live Sync"}
              </span>
            </div>
          </div>
        </div>

        {/* Linked Roommate Post Context Pill */}
        {roommateRequest && (
          <Link
            href={`/roommates/${roommateRequest.id}`}
            target="_blank"
            className="flex items-center gap-2.5 rounded-2xl border border-[#96BF8A]/30 bg-[#eff4ec]/60 px-3.5 py-1.5 text-xs text-zinc-800 hover:bg-[#eff4ec] transition-colors self-start sm:self-auto group"
            title="View linked flatmate requirement"
          >
            <Building2 className="h-3.5 w-3.5 text-[#00412E] shrink-0" />
            <div className="flex flex-col">
              <span className="font-semibold text-zinc-900 truncate max-w-[180px] group-hover:text-[#00412E] transition-colors">
                {roommateRequest.title}
              </span>
              <span className="text-[11px] font-bold text-[#00412E]">
                ₹{roommateRequest.rentPerPerson.toLocaleString("en-IN")}/mo • {roommateRequest.locality}
              </span>
            </div>
            <ExternalLink className="h-3.5 w-3.5 text-zinc-400 group-hover:text-[#00412E] transition-colors shrink-0" />
          </Link>
        )}
      </div>

      {/* ================================================================= */}
      {/* MESSAGE STREAM */}
      {/* ================================================================= */}
      <div
        ref={chatScrollContainerRef}
        onScroll={handleScroll}
        className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6 bg-[#F9FAF8] relative"
      >
        {/* Icebreakers / Starter Prompt if no messages yet */}
        {!hasUserMessages && (
          <div className="mx-auto max-w-md rounded-3xl border border-[#96BF8A]/30 bg-white p-5 text-center shadow-xs my-4">
            <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-2xl bg-[#eff4ec] text-[#00412E] mb-3">
              <Sparkles className="h-5 w-5 text-[#00412E]" />
            </div>
            <h4 className="text-sm font-bold text-zinc-950">
              Start chatting with {otherParty.name}
            </h4>
            <p className="mt-1 text-xs text-zinc-500 leading-relaxed">
              Click a suggested icebreaker below to load it into the message box:
            </p>

            <div className="mt-4 flex flex-col gap-2">
              {QUICK_ICEBREAKERS.map((prompt) => (
                <button
                  key={prompt}
                  type="button"
                  onClick={() => handleChipClick(prompt)}
                  className="rounded-xl border border-[#E8EAE5] bg-[#F9FAF8] px-3.5 py-2.5 text-left text-xs font-semibold text-zinc-700 hover:border-[#96BF8A] hover:bg-[#eff4ec] hover:text-[#00412E] transition-all cursor-pointer shadow-2xs"
                >
                  {prompt}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Grouped Messages Feed */}
        {groupedMessages.map((group) => (
          <div key={group.dateLabel} className="space-y-3">
            {/* Date Badge */}
            <div className="flex justify-center my-3">
              <span className="rounded-full bg-[#E8EAE5]/70 border border-[#E8EAE5] px-3.5 py-1 text-center text-[11px] font-semibold text-zinc-600 shadow-2xs">
                {group.dateLabel}
              </span>
            </div>

            {group.items.map((msg) => {
              if (msg.messageType === "SYSTEM") {
                return (
                  <div key={msg.id} className="flex justify-center my-2">
                    <span className="flex items-center gap-1.5 rounded-full bg-[#eff4ec] px-4 py-1.5 text-center text-[11px] font-semibold text-[#00412E] border border-[#96BF8A]/40 shadow-2xs max-w-md">
                      <ShieldCheck className="h-3.5 w-3.5 shrink-0 text-[#00412E]" />
                      <span>{msg.content}</span>
                    </span>
                  </div>
                );
              }

              const isMe = msg.senderId === currentUserId;
              const timeString = new Date(msg.createdAt).toLocaleTimeString("en-IN", {
                hour: "2-digit",
                minute: "2-digit",
              });

              return (
                <div
                  key={msg.id}
                  className={`flex items-end gap-2 ${isMe ? "justify-end" : "justify-start"}`}
                >
                  {/* Other party avatar */}
                  {!isMe && (
                    <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-xl bg-[#00412E] text-[11px] font-bold text-white shadow-2xs">
                      {otherParty.name[0]?.toUpperCase() || "F"}
                    </div>
                  )}

                  <div className={`flex flex-col ${isMe ? "items-end" : "items-start"} max-w-[82%] sm:max-w-[70%]`}>
                    <div
                      className={`rounded-2xl px-4 py-2.5 text-xs sm:text-sm leading-relaxed shadow-xs transition-all ${
                        isMe
                          ? "bg-[#00412E] text-white rounded-br-xs"
                          : "bg-white text-zinc-900 border border-[#E8EAE5] rounded-bl-xs"
                      }`}
                    >
                      <p className="whitespace-pre-wrap break-words">{msg.content}</p>
                    </div>

                    {/* Timestamp & Status indicators */}
                    <div className="flex items-center gap-1 mt-1 px-1">
                      <span className="text-[10px] text-zinc-400">{timeString}</span>
                      {isMe && (
                        <span>
                          {msg.status === "sending" ? (
                            <Clock className="h-3 w-3 text-amber-500 animate-pulse" />
                          ) : (
                            <CheckCheck className="h-3 w-3 text-[#96BF8A]" />
                          )}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ))}

        <div ref={messagesEndRef} />
      </div>

      {/* Floating Jump to Bottom Button */}
      {showScrollBottom && (
        <button
          type="button"
          onClick={() => scrollToBottom("smooth")}
          className="absolute bottom-28 right-6 z-20 flex items-center gap-1.5 rounded-full bg-[#00412E] px-3.5 py-1.5 text-xs font-bold text-white shadow-lg hover:bg-[#002d20] transition-all cursor-pointer animate-in fade-in zoom-in-95"
        >
          <ArrowDown className="h-3.5 w-3.5" />
          <span>New messages</span>
        </button>
      )}

      {/* Optional inline error message */}
      {errorMessage && (
        <div className="shrink-0 bg-red-50 border-t border-red-200 px-4 py-1.5 flex items-center justify-between text-xs text-red-700">
          <div className="flex items-center gap-1.5">
            <AlertCircle className="h-3.5 w-3.5 shrink-0" />
            <span>{errorMessage}</span>
          </div>
          <button
            type="button"
            onClick={() => setErrorMessage(null)}
            className="text-[11px] font-bold hover:underline cursor-pointer"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* ================================================================= */}
      {/* QUICK CHIPS */}
      {/* ================================================================= */}
      <div className="shrink-0 border-t border-[#E8EAE5] bg-white px-4 pt-2.5 pb-1 flex items-center gap-2 overflow-x-auto no-scrollbar">
        <span className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider shrink-0">
          Quick:
        </span>
        {["👍 Sounds great", "🤝 Perfect", "📍 Share location", "📅 Visit tomorrow"].map((chip) => (
          <button
            key={chip}
            type="button"
            onClick={() => handleChipClick(chip)}
            className="rounded-full border border-[#E8EAE5] bg-[#F9FAF8] px-3 py-1 text-[11px] font-medium text-zinc-600 hover:border-[#96BF8A] hover:bg-[#eff4ec] hover:text-[#00412E] transition-colors shrink-0 cursor-pointer"
          >
            {chip}
          </button>
        ))}
      </div>

      {/* ================================================================= */}
      {/* MESSAGE INPUT BAR */}
      {/* ================================================================= */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleSendMessage();
        }}
        className="shrink-0 bg-white p-3 sm:p-4 flex items-end gap-2.5 relative z-10"
      >
        <div
          onClick={() => textareaRef.current?.focus({ preventScroll: true })}
          className="flex-1 cursor-text rounded-2xl border border-[#E8EAE5] bg-[#F9FAF8] px-4 py-2.5 focus-within:border-[#00412E] focus-within:bg-white focus-within:ring-2 focus-within:ring-[#96BF8A]/20 transition-all flex items-center min-h-[46px]"
        >
          <textarea
            id="chat-message-input"
            ref={textareaRef}
            rows={1}
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                handleSendMessage();
              }
            }}
            placeholder={`Message ${otherParty.name}... (Press Enter ↵ to send)`}
            className="w-full resize-none bg-transparent text-xs sm:text-sm font-medium text-zinc-900 placeholder:text-zinc-400 focus:outline-none min-h-[22px] max-h-[130px] leading-relaxed block"
          />
        </div>

        <button
          type="submit"
          disabled={!inputText.trim() || isSending}
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[#00412E] text-white shadow-md shadow-[#00412E]/20 hover:bg-[#002d20] disabled:opacity-40 transition-all cursor-pointer active:scale-95"
          title="Send message"
        >
          {isSending ? (
            <Loader2 className="h-4 w-4 animate-spin text-[#96BF8A]" />
          ) : (
            <Send className="h-4 w-4" />
          )}
        </button>
      </form>
    </div>
  );
}
