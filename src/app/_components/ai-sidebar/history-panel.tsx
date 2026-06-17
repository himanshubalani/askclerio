"use client";

import { useCallback, useEffect, useRef } from "react";
import { api } from "@/trpc/react";
import { truncate } from "./context-strip";
import { useAISidebar } from "./provider";

// --- Date formatting helper ---

/**
 * Formats a conversation date as a relative/short string:
 * "Today", "Yesterday", weekday name (within 7 days), or "Mon DD" format.
 */
export function formatConversationDate(date: Date | string): string {
  const d = new Date(date);
  const now = new Date();
  const diffDays = Math.floor(
    (now.getTime() - d.getTime()) / (1000 * 60 * 60 * 24),
  );

  if (diffDays === 0) return "Today";
  if (diffDays === 1) return "Yesterday";
  if (diffDays < 7)
    return d.toLocaleDateString(undefined, { weekday: "short" });
  return d.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

// --- Props ---

interface HistoryPanelProps {
  onConversationSelect: (conversationId: string) => void;
}

// --- Skeleton loader ---

function ConversationSkeleton() {
  return (
    <div className="animate-pulse px-3 py-3 border-b border-[#e1e5f2]/50">
      <div className="h-4 w-3/4 bg-[#e1e5f2]/50 rounded mb-2" />
      <div className="h-3 w-1/3 bg-[#e1e5f2]/30 rounded mb-1.5" />
      <div className="h-3 w-full bg-[#e1e5f2]/30 rounded" />
    </div>
  );
}

// --- Component ---

export function HistoryPanel({ onConversationSelect }: HistoryPanelProps) {
  const { setActivePanel } = useAISidebar();
  const sentinelRef = useRef<HTMLDivElement>(null);

  const {
    data,
    isLoading,
    isFetchingNextPage,
    hasNextPage,
    fetchNextPage,
  } = api.chat.getConversations.useInfiniteQuery(
    { limit: 25 },
    {
      initialCursor: undefined,
      getNextPageParam: (lastPage) => lastPage.nextCursor,
    },
  );

  // Infinite scroll via IntersectionObserver
  const handleObserver = useCallback(
    (entries: IntersectionObserverEntry[]) => {
      const target = entries[0];
      if (target?.isIntersecting && hasNextPage && !isFetchingNextPage) {
        void fetchNextPage();
      }
    },
    [hasNextPage, isFetchingNextPage, fetchNextPage],
  );

  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel) return;

    const observer = new IntersectionObserver(handleObserver, {
      root: null,
      rootMargin: "100px",
      threshold: 0,
    });

    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [handleObserver]);

  // Flatten pages into a single list
  const conversations = data?.pages.flatMap((page) => page.items) ?? [];

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-3 border-b border-[#e1e5f2]/50 sticky top-0 bg-white z-10">
        <h2 className="text-[15px] font-semibold text-[#022b3a]">History</h2>
        <button
          type="button"
          onClick={() => setActivePanel("thread")}
          aria-label="Back to conversation"
          className="p-1.5 rounded-md hover:bg-[#e1e5f2]/40 transition-colors text-[#022b3a]/70 cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-[#022b3a]/40 focus-visible:ring-offset-1"
        >
          <svg
            width="16"
            height="16"
            viewBox="0 0 16 16"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            aria-hidden="true"
          >
            <path
              d="M12.5 8H3.5M3.5 8L7 4.5M3.5 8L7 11.5"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </button>
      </div>

      {/* Scrollable list */}
      <div className="flex-1 overflow-y-auto">
        {/* Loading state */}
        {isLoading && (
          <div>
            {Array.from({ length: 5 }).map((_, i) => (
              <ConversationSkeleton key={i} />
            ))}
          </div>
        )}

        {/* Empty state */}
        {!isLoading && conversations.length === 0 && (
          <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
            <svg
              width="32"
              height="32"
              viewBox="0 0 24 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              className="text-[#022b3a]/30 mb-3"
              aria-hidden="true"
            >
              <path
                d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2v10z"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            <p className="text-sm text-[#022b3a]/50">
              No conversations yet
            </p>
          </div>
        )}

        {/* Conversation list */}
        {conversations.map((conversation) => {
          // firstMessagePreview may be added by a backend enhancement;
          // gracefully handle when it's not present
          const preview = (conversation as { firstMessagePreview?: string })
            .firstMessagePreview;

          return (
            <button
              key={conversation.id}
              type="button"
              onClick={() => onConversationSelect(conversation.id)}
              className="w-full text-left px-3 py-3 border-b border-[#e1e5f2]/50 hover:bg-[#bfdbf7]/10 transition-colors cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-[#022b3a]/40 focus-visible:ring-offset-1 focus-visible:ring-inset"
            >
              <div className="flex items-baseline justify-between gap-2 mb-1">
                <span className="text-[13px] font-medium text-[#022b3a] truncate flex-1">
                  {conversation.title ?? "Untitled conversation"}
                </span>
                <span className="text-[11px] text-[#022b3a]/50 whitespace-nowrap flex-shrink-0">
                  {formatConversationDate(conversation.createdAt)}
                </span>
              </div>
              {preview && (
                <p className="text-[12px] text-[#022b3a]/60 leading-relaxed">
                  {truncate(preview, 80)}
                </p>
              )}
            </button>
          );
        })}

        {/* Sentinel div for infinite scroll */}
        <div ref={sentinelRef} className="h-1" />

        {/* Pagination loading spinner */}
        {isFetchingNextPage && (
          <div className="flex justify-center py-4">
            <div className="h-5 w-5 border-2 border-[#022b3a]/20 border-t-[#022b3a]/60 rounded-full animate-spin" />
          </div>
        )}
      </div>
    </div>
  );
}
