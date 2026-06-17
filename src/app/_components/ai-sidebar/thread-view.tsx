"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { MessageBubble } from "./message-bubble";

// --- Utility Functions (exported for property tests) ---

/**
 * Determines whether the thread should auto-scroll to the bottom.
 * Returns true when the user is within 50px of the bottom.
 */
export function shouldAutoScroll(
  scrollTop: number,
  scrollHeight: number,
  clientHeight: number,
): boolean {
  return scrollHeight - scrollTop - clientHeight <= 50;
}

/**
 * Returns 2–4 suggestion chips for the empty thread state.
 */
export function getSuggestionChips(): { label: string }[] {
  return [
    { label: "What's on my calendar today?" },
    { label: "Summarize my inbox" },
    { label: "Draft an email" },
    { label: "Find unread messages" },
  ];
}

// --- Types ---

interface ThreadViewProps {
  messages: Array<{
    id: string;
    role: "user" | "assistant";
    content: string;
    toolCalls?: Array<{
      id: string;
      toolName: string;
      parameters: Record<string, unknown>;
      status: string;
    }>;
  }>;
  isStreaming?: boolean;
  onSuggestionClick?: (text: string) => void;
}

// --- Component ---

export function ThreadView({
  messages,
  isStreaming = false,
  onSuggestionClick,
}: ThreadViewProps) {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [userHasScrolledUp, setUserHasScrolledUp] = useState(false);
  const prevMessageCountRef = useRef(messages.length);

  // --- Scroll event handler to track user scroll position ---
  const handleScroll = useCallback(() => {
    const container = scrollContainerRef.current;
    if (!container) return;

    const isNearBottom = shouldAutoScroll(
      container.scrollTop,
      container.scrollHeight,
      container.clientHeight,
    );
    setUserHasScrolledUp(!isNearBottom);
  }, []);

  // --- Auto-scroll on new messages or streaming updates ---
  useEffect(() => {
    const container = scrollContainerRef.current;
    if (!container) return;

    const messageCountChanged = messages.length !== prevMessageCountRef.current;
    prevMessageCountRef.current = messages.length;

    // Auto-scroll if user hasn't scrolled up
    if (!userHasScrolledUp && (messageCountChanged || isStreaming)) {
      container.scrollTop = container.scrollHeight;
    }
  }, [messages.length, messages, isStreaming, userHasScrolledUp]);

  // --- Empty state with suggestion chips ---
  if (messages.length === 0) {
    const chips = getSuggestionChips();

    return (
      <div
        role="log"
        aria-live="polite"
        aria-relevant="additions"
        className="flex flex-1 flex-col items-center justify-center overflow-y-auto px-4 py-3"
      >
        <p className="mb-4 text-sm text-[#022b3a]/60">
          Ask Clerio anything about your email or calendar.
        </p>
        <div className="flex flex-wrap justify-center gap-2">
          {chips.map((chip) => (
            <button
              key={chip.label}
              type="button"
              onClick={() => onSuggestionClick?.(chip.label)}
              className="cursor-pointer rounded-full bg-[#bfdbf7]/20 px-3 py-1.5 text-xs font-medium text-[#022b3a] transition-colors hover:bg-[#bfdbf7]/40 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#022b3a]/40 focus-visible:ring-offset-1"
            >
              {chip.label}
            </button>
          ))}
        </div>
      </div>
    );
  }

  // --- Thread with messages ---
  return (
    <div
      ref={scrollContainerRef}
      role="log"
      aria-live="polite"
      aria-relevant="additions"
      onScroll={handleScroll}
      className="flex flex-1 flex-col overflow-y-auto px-4 py-3 space-y-3"
    >
      {messages.map((message, index) => (
        <div key={message.id}>
          <MessageBubble
            role={message.role}
            content={message.content}
            isStreaming={
              isStreaming &&
              message.role === "assistant" &&
              index === messages.length - 1
            }
          />

          {/* Render tool call placeholders */}
          {message.toolCalls?.map((toolCall) => (
            <div
              key={toolCall.id}
              className="my-2 rounded-lg border border-[#e1e5f2] bg-[#f8f9fc] p-3 text-xs text-[#022b3a]/60"
            >
              ToolCallCard placeholder
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}
