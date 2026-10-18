"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import {
  Send,
  Building2,
  MapPin,
  ArrowLeft,
  ShieldCheck,
  Loader2,
  Users,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { sendMessageAction } from "@/actions/chat";

interface MessageItem {
  id: string;
  senderId: string;
  content: string;
  messageType: "TEXT" | "IMAGE" | "SYSTEM";
  createdAt: Date | string;
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
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom
  const scrollToBottom = (behavior: ScrollBehavior = "smooth") => {
    messagesEndRef.current?.scrollIntoView({ behavior });
  };

  useEffect(() => {
    scrollToBottom("auto");
  }, []);

  useEffect(() => {
    scrollToBottom("smooth");
  }, [messages]);

  // Supabase Realtime Live Subscription
  useEffect(() => {
    const supabase = createClient();
    const channel = supabase
      .channel(`chat_${conversationId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "Message",
          filter: `conversationId=eq.${conversationId}`,
        },
        (payload) => {
          const newMsg = payload.new as MessageItem;
          setMessages((prev) => {
            if (prev.some((m) => m.id === newMsg.id)) return prev;
            return [...prev, newMsg];
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [conversationId]);

  // Send message handler
  const handleSendMessage = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!inputText.trim() || isSending) return;

    const content = inputText.trim();
    setInputText("");
    setIsSending(true);

    // Optimistic message append
    const optimisticId = `temp_${Date.now()}`;
    const optimisticMsg: MessageItem = {
      id: optimisticId,
      senderId: currentUserId,
      content,
      messageType: "TEXT",
      createdAt: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, optimisticMsg]);

    const res = await sendMessageAction({
      conversationId,
      content,
    });

    setIsSending(false);

    if (res.success && res.data) {
      const delivered = res.data;
      setMessages((prev) =>
        prev.map((m) => (m.id === optimisticId ? delivered : m))
      );
    } else {
      // Revert optimistic on error
      setMessages((prev) => prev.filter((m) => m.id !== optimisticId));
      alert(res.error || "Failed to deliver message.");
    }
  };

  return (
    <div className="mx-auto flex h-[calc(100vh-10rem)] max-w-4xl flex-col rounded-3xl border border-zinc-200 bg-white shadow-sm overflow-hidden">
      {/* Top Header: Other Party & Property Context */}
      <div className="flex items-center justify-between border-b border-zinc-100 bg-white px-5 py-3.5">
        <div className="flex items-center gap-3">
          <Link
            href="/chat"
            className="flex h-9 w-9 items-center justify-center rounded-xl text-zinc-500 hover:bg-zinc-100 hover:text-zinc-900 transition-colors"
          >
            <ArrowLeft className="h-5 w-5" />
          </Link>

          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-violet-600 text-sm font-black text-white">
            {otherParty.name[0]?.toUpperCase() || "F"}
          </div>

          <div>
            <div className="flex items-center gap-1.5">
              <h2 className="text-sm font-bold text-zinc-950">{otherParty.name}</h2>
              <span title="Verified User">
                <ShieldCheck className="h-4 w-4 text-emerald-600" />
              </span>
            </div>
            <p className="text-xs text-zinc-500">{otherParty.profession}</p>
          </div>
        </div>

        {/* Linked Request Pill */}
        {roommateRequest && (
          <Link
            href={`/roommates/${roommateRequest.id}`}
            className="hidden sm:flex items-center gap-2 rounded-2xl border border-zinc-200 bg-zinc-50 px-3 py-1.5 text-xs text-zinc-700 hover:bg-zinc-100 transition-colors"
          >
            <Building2 className="h-3.5 w-3.5 text-violet-600" />
            <span className="font-semibold truncate max-w-[150px]">
              {roommateRequest.title}
            </span>
            <span className="text-zinc-400">•</span>
            <span className="font-bold text-zinc-900">
              ₹{roommateRequest.rentPerPerson.toLocaleString("en-IN")}/mo
            </span>
          </Link>
        )}
      </div>

      {/* Message Feed */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 bg-zinc-50/50">
        {messages.map((msg) => {
          if (msg.messageType === "SYSTEM") {
            return (
              <div key={msg.id} className="flex justify-center my-3">
                <span className="rounded-full bg-violet-100/80 px-4 py-1 text-center text-[11px] font-semibold text-violet-800 border border-violet-200/60 shadow-2xs">
                  {msg.content}
                </span>
              </div>
            );
          }

          const isMe = msg.senderId === currentUserId;
          const time = new Date(msg.createdAt).toLocaleTimeString("en-IN", {
            hour: "2-digit",
            minute: "2-digit",
          });

          return (
            <div
              key={msg.id}
              className={`flex flex-col ${isMe ? "items-end" : "items-start"}`}
            >
              <div
                className={`max-w-[80%] sm:max-w-[70%] rounded-2xl px-4 py-2.5 text-xs sm:text-sm leading-relaxed shadow-xs ${
                  isMe
                    ? "bg-violet-600 text-white rounded-br-xs"
                    : "bg-white text-zinc-900 border border-zinc-200 rounded-bl-xs"
                }`}
              >
                <p className="whitespace-pre-wrap">{msg.content}</p>
              </div>
              <span className="mt-1 text-[10px] text-zinc-400 px-1">{time}</span>
            </div>
          );
        })}
        <div ref={messagesEndRef} />
      </div>

      {/* Message Input Form */}
      <form
        onSubmit={handleSendMessage}
        className="border-t border-zinc-200 bg-white p-3.5 flex items-center gap-2.5"
      >
        <textarea
          rows={1}
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              handleSendMessage();
            }
          }}
          placeholder={`Type a message to ${otherParty.name}...`}
          className="flex-1 resize-none rounded-2xl border border-zinc-200 bg-zinc-50 px-4 py-2.5 text-xs sm:text-sm font-medium text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:border-violet-500 focus:bg-white"
        />

        <button
          type="submit"
          disabled={!inputText.trim() || isSending}
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-violet-600 text-white shadow-xs hover:bg-violet-700 disabled:opacity-40 transition-all cursor-pointer"
        >
          {isSending ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Send className="h-4 w-4" />
          )}
        </button>
      </form>
    </div>
  );
}
