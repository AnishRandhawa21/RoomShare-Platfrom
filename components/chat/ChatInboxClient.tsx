"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import {
  MessageSquare,
  Building2,
  ArrowRight,
  Search,
  Filter,
  ShieldCheck,
  Radio,
  Clock,
  Sparkles,
  Inbox,
} from "lucide-react";
import { getUserConversationsAction, ConversationSummaryItem } from "@/actions/chat";

interface ChatInboxClientProps {
  initialConversations: ConversationSummaryItem[];
}

export function ChatInboxClient({ initialConversations }: ChatInboxClientProps) {
  const [conversations, setConversations] = useState<ConversationSummaryItem[]>(initialConversations);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState<"all" | "unread">("all");

  // Background sync for the inbox (Zero DB load when tab is hidden)
  useEffect(() => {
    const refreshInbox = async () => {
      if (typeof document !== "undefined" && document.hidden) return;
      const res = await getUserConversationsAction();
      if (res.success && res.data) {
        setConversations(res.data);
      }
    };

    const interval = setInterval(refreshInbox, 15000);

    const onVisible = () => {
      if (typeof document !== "undefined" && !document.hidden) {
        refreshInbox();
      }
    };
    window.addEventListener("focus", onVisible);
    document.addEventListener("visibilitychange", onVisible);

    return () => {
      clearInterval(interval);
      window.removeEventListener("focus", onVisible);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, []);

  // Filtered conversations
  const filtered = useMemo(() => {
    return conversations.filter((c) => {
      // Tab filter
      if (activeTab === "unread" && !c.hasUnread) return false;

      // Search filter
      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase();
      const nameMatch = c.otherParty.name.toLowerCase().includes(q);
      const profMatch = c.otherParty.profession?.toLowerCase().includes(q);
      const titleMatch = c.roommateRequest?.title.toLowerCase().includes(q);
      const localityMatch = c.roommateRequest?.locality.toLowerCase().includes(q);
      const msgMatch = c.lastMessageText?.toLowerCase().includes(q);

      return nameMatch || profMatch || titleMatch || localityMatch || msgMatch;
    });
  }, [conversations, searchQuery, activeTab]);

  const unreadCount = conversations.filter((c) => c.hasUnread).length;

  if (conversations.length === 0) {
    return (
      <div className="rounded-3xl border border-dashed border-[#E8EAE5] bg-white p-10 sm:p-14 text-center max-w-lg mx-auto shadow-sm">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-[#eff4ec] text-[#00412E] border border-[#96BF8A]/30 mb-4">
          <MessageSquare className="h-7 w-7 text-[#00412E]" />
        </div>
        <h3 className="text-lg font-black text-zinc-950">
          No active conversations yet
        </h3>
        <p className="mt-2 text-xs sm:text-sm text-zinc-500 leading-relaxed">
          When you connect with flatmates on Roommate Share Hub or message a matched listing, your secure chats will appear here in real-time.
        </p>
        <div className="mt-6 flex justify-center gap-3">
          <Link
            href="/roommates"
            className="rounded-2xl bg-[#00412E] px-6 py-3 text-xs sm:text-sm font-bold text-white hover:bg-[#002d20] shadow-md shadow-[#00412E]/20 transition-all cursor-pointer"
          >
            Explore Roommate Matches
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Search & Tabs Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-3.5 rounded-2xl border border-[#E8EAE5] shadow-xs">
        {/* Search Input */}
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by flatmate name, locality, or message..."
            className="w-full rounded-xl border border-[#E8EAE5] bg-[#F9FAF8] pl-10 pr-4 py-2 text-xs sm:text-sm font-medium text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:border-[#00412E] focus:bg-white transition-all"
          />
        </div>

        {/* Filter Pills */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setActiveTab("all")}
            className={`rounded-xl px-4 py-2 text-xs font-bold transition-all cursor-pointer ${
              activeTab === "all"
                ? "bg-[#00412E] text-white shadow-xs"
                : "bg-[#F9FAF8] text-zinc-600 hover:bg-[#eff4ec] hover:text-[#00412E] border border-[#E8EAE5]"
            }`}
          >
            All Chats ({conversations.length})
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("unread")}
            className={`flex items-center gap-1.5 rounded-xl px-4 py-2 text-xs font-bold transition-all cursor-pointer ${
              activeTab === "unread"
                ? "bg-[#00412E] text-white shadow-xs"
                : "bg-[#F9FAF8] text-zinc-600 hover:bg-[#eff4ec] hover:text-[#00412E] border border-[#E8EAE5]"
            }`}
          >
            <span>Unread</span>
            {unreadCount > 0 && (
              <span className="flex h-4 min-w-4 items-center justify-center rounded-full bg-[#96BF8A] px-1 text-[10px] font-black text-[#00412E]">
                {unreadCount}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* Conversations List */}
      {filtered.length === 0 ? (
        <div className="rounded-3xl border border-[#E8EAE5] bg-white p-12 text-center text-zinc-500">
          <Inbox className="mx-auto h-8 w-8 text-zinc-300 mb-2" />
          <p className="text-xs font-semibold">No chats matching your filter.</p>
        </div>
      ) : (
        <div className="divide-y divide-[#E8EAE5] rounded-3xl border border-[#E8EAE5] bg-white shadow-xs overflow-hidden">
          {filtered.map((conv) => {
            const timeFormatted = conv.lastMessageAt
              ? new Date(conv.lastMessageAt).toLocaleDateString("en-IN", {
                  day: "numeric",
                  month: "short",
                })
              : "";

            return (
              <Link
                key={conv.id}
                href={`/chat/${conv.id}`}
                className={`flex items-center justify-between p-4 sm:p-5 transition-colors group ${
                  conv.hasUnread ? "bg-[#eff4ec]/30 hover:bg-[#eff4ec]/60" : "hover:bg-[#F9FAF8]"
                }`}
              >
                <div className="flex items-center gap-3.5 sm:gap-4 min-w-0">
                  {/* Avatar */}
                  <div className="relative shrink-0">
                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#00412E] text-base font-black text-white shadow-sm shadow-[#00412E]/20">
                      {conv.otherParty.name[0]?.toUpperCase() || "F"}
                    </div>
                    {conv.hasUnread && (
                      <span className="absolute -top-1 -right-1 flex h-3.5 w-3.5 items-center justify-center rounded-full bg-[#96BF8A] ring-2 ring-white" />
                    )}
                  </div>

                  <div className="space-y-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className={`text-sm sm:text-base font-bold text-zinc-950 group-hover:text-[#00412E] transition-colors truncate ${
                        conv.hasUnread ? "text-[#00412E]" : ""
                      }`}>
                        {conv.otherParty.name}
                      </h3>
                      <ShieldCheck className="h-4 w-4 text-[#96BF8A] shrink-0" />
                      <span className="text-xs text-zinc-400 hidden sm:inline">•</span>
                      <span className="text-xs text-zinc-500 font-medium truncate hidden sm:inline">
                        {conv.otherParty.profession || "Member"}
                      </span>
                    </div>

                    {/* Property / Roommate Context Tag */}
                    {conv.roommateRequest && (
                      <div className="flex items-center gap-1.5 text-xs text-zinc-600 font-medium truncate">
                        <Building2 className="h-3.5 w-3.5 text-[#00412E] shrink-0" />
                        <span className="truncate max-w-[280px]">
                          {conv.roommateRequest.title}
                        </span>
                        <span className="text-zinc-400">•</span>
                        <span className="text-[#00412E] font-semibold">
                          {conv.roommateRequest.locality}
                        </span>
                      </div>
                    )}

                    {/* Last Message Snippet */}
                    <p className={`text-xs truncate max-w-md ${
                      conv.hasUnread
                        ? "font-bold text-zinc-950"
                        : "text-zinc-500"
                    }`}>
                      {conv.lastMessageText || "New match initialized. Start chatting!"}
                    </p>
                  </div>
                </div>

                {/* Right Metadata */}
                <div className="flex items-center gap-3 shrink-0 ml-3">
                  <div className="flex flex-col items-end gap-1">
                    <span className="text-[11px] font-semibold text-zinc-400">
                      {timeFormatted}
                    </span>
                    {conv.hasUnread && (
                      <span className="rounded-full bg-[#00412E] px-2 py-0.5 text-[10px] font-bold text-white">
                        New
                      </span>
                    )}
                  </div>
                  <ArrowRight className="h-4 w-4 text-zinc-400 group-hover:text-[#00412E] group-hover:translate-x-0.5 transition-all" />
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
