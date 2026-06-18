// src/app/_components/ai-sidebar/chat-container.tsx
"use client";

import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport } from "ai";
import { useCallback, useEffect, useMemo, useState } from "react";
import { ThreadView } from "./thread-view";
import { InputBar } from "./input-bar";
import { StatusFooter, type ConnectionStatus } from "./status-footer";
import { ToolCallCard } from "./tool-call-card";
import { getToolMetadata, type ToolCallStatus } from "./use-tool-call-manager";

// --- Types ---

interface ExtractedToolInvocation {
  toolCallId: string;
  toolName: string;
  input: Record<string, unknown>;
  state: string;
  approvalId?: string;
  output?: unknown;
  errorText?: string;
}

// --- State Mapping ---

function mapPartStateToCardStatus(state: string): ToolCallStatus {
  switch (state) {
    case "input-streaming":
      return "draft";
    case "input-available":
      return "running";
    case "approval-requested":
      return "awaiting_confirmation";
    case "approval-responded":
      return "running";
    case "output-available":
      return "done";
    case "output-error":
      return "failed";
    case "output-denied":
      return "cancelled";
    default:
      return "draft";
  }
}

// --- Component ---

export interface ChatContainerProps {
  conversationId?: string;
}

export function ChatContainer({ conversationId: externalConversationId }: ChatContainerProps) {
  const [conversationId] = useState(
    () => externalConversationId ?? crypto.randomUUID(),
  );

  const [isOffline, setIsOffline] = useState(false);
  const [bannerDismissed, setBannerDismissed] = useState(false);

  useEffect(() => {
    if (typeof window !== "undefined" && !navigator.onLine) {
      setIsOffline(true);
    }

    const handleOffline = () => {
      setIsOffline(true);
      setBannerDismissed(false);
    };

    const handleOnline = () => {
      setIsOffline(false);
    };

    window.addEventListener("offline", handleOffline);
    window.addEventListener("online", handleOnline);

    return () => {
      window.removeEventListener("offline", handleOffline);
      window.removeEventListener("online", handleOnline);
    };
  }, []);

  const showNetworkBanner = isOffline && !bannerDismissed;

  const transport = useMemo(
    () =>
      new DefaultChatTransport({
        api: "/api/chat",
        headers: {
          "x-conversation-id": conversationId,
        },
      }),
    [conversationId],
  );

  const {
    messages,
    sendMessage,
    status,
    stop,
    error,
    addToolApprovalResponse,
  } = useChat({
    transport,
  });

  const connectionStatus: ConnectionStatus = error
    ? "disconnected"
    : status === "submitted" || status === "streaming"
      ? "thinking"
      : "active";

  const isNetworkError = error?.message
    ? /network|fetch|failed to fetch|ERR_INTERNET_DISCONNECTED/i.test(error.message)
    : false;

  const showNetworkBannerFinal = (showNetworkBanner || isNetworkError) && !bannerDismissed;
  const isStreaming = status === "submitted" || status === "streaming";

  const handleSubmit = useCallback(
    (text: string) => {
      void sendMessage({ text });
    },
    [sendMessage],
  );

  const handleToolApprove = useCallback(
    (approvalId: string) => {
      void addToolApprovalResponse({
        id: approvalId,
        approved: true,
      });
    },
    [addToolApprovalResponse],
  );

  const handleToolReject = useCallback(
    (approvalId: string) => {
      void addToolApprovalResponse({
        id: approvalId,
        approved: false,
        reason: "User rejected the tool call",
      });
    },
    [addToolApprovalResponse],
  );

  const threadMessages = useMemo(
    () =>
      messages.map((msg) => ({
        id: msg.id,
        role: msg.role as "user" | "assistant",
        content:
          msg.parts
            .filter((p): p is { type: "text"; text: string } => p.type === "text")
            .map((p) => p.text)
            .join("") ?? "",
      })),
    [messages],
  );

  const toolInvocations = useMemo(() => {
    const invocations: ExtractedToolInvocation[] = [];

    for (const msg of messages) {
      for (const part of msg.parts) {
        if (part.type === "dynamic-tool" || part.type.startsWith("tool-")) {
          const toolPart = part as unknown as {
            type: string;
            toolName?: string;
            toolCallId: string;
            state: string;
            input?: unknown;
            output?: unknown;
            errorText?: string;
            approval?: { id: string; approved?: boolean; reason?: string };
          };

          const toolName =
            toolPart.toolName ??
            (toolPart.type.startsWith("tool-")
              ? toolPart.type.slice(5)
              : "unknown");

          invocations.push({
            toolCallId: toolPart.toolCallId,
            toolName,
            input: (toolPart.input as Record<string, unknown>) ?? {},
            state: toolPart.state,
            approvalId: toolPart.approval?.id,
            output: toolPart.output,
            errorText: toolPart.errorText,
          });
        }
      }
    }

    return invocations;
  }, [messages]);

  // Filter out completed/cancelled tasks so the bar disappears cleanly once done
  const activeToolInvocations = toolInvocations.filter(
    (inv) => !["input-streaming", "output-available", "output-denied"].includes(inv.state)
  );

  const handleSuggestionClick = useCallback(
    (text: string) => {
      void sendMessage({ text });
    },
    [sendMessage],
  );

  return (
    <div className="flex flex-1 flex-col overflow-hidden min-h-0">
      {/* Network connectivity banner */}
      {showNetworkBannerFinal && (
        <div className="mx-3 mt-2 flex items-center justify-between rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800">
          <span>Connection lost. Trying to reconnect...</span>
          <button
            type="button"
            onClick={() => setBannerDismissed(true)}
            aria-label="Dismiss network banner"
            className="ml-2 rounded p-0.5 text-amber-600 transition-colors hover:bg-amber-100 hover:text-amber-900"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
            </svg>
          </button>
        </div>
      )}

      {/* Thread View */}
      <ThreadView
        messages={threadMessages}
        isStreaming={isStreaming}
        onSuggestionClick={handleSuggestionClick}
      />

      {/* Thin Tool Call Bars (Active only) */}
      {activeToolInvocations.length > 0 && (
        <div className="px-4 pb-2 pt-2 flex flex-col gap-2 bg-gradient-to-t from-white/0 via-white/80 to-white/0">
          {activeToolInvocations.map((inv) => {
            const metadata = getToolMetadata(inv.toolName);
            const cardStatus = mapPartStateToCardStatus(inv.state);

            return (
              <ToolCallCard
                key={inv.toolCallId}
                toolCall={{
                  id: inv.toolCallId,
                  toolCallId: inv.toolCallId,
                  toolName: inv.toolName,
                  displayName: metadata.displayName,
                  category: metadata.category,
                  summary: `Executing ${metadata.displayName}`,
                  parameters: inv.input,
                  status: cardStatus,
                  retryCount: 0,
                  maxRetries: 3,
                  errorMessage: inv.errorText,
                }}
                onApprove={() => {
                  if (inv.approvalId) {
                    handleToolApprove(inv.approvalId);
                  }
                }}
                onReject={() => {
                  if (inv.approvalId) {
                    handleToolReject(inv.approvalId);
                  }
                }}
                onRetry={() => {
                  if (inv.approvalId) {
                    handleToolApprove(inv.approvalId);
                  }
                }}
                onCancel={() => {
                  if (inv.approvalId) {
                    handleToolReject(inv.approvalId);
                  }
                }}
              />
            );
          })}
        </div>
      )}

      {/* Input Bar */}
      <InputBar
        onSubmit={handleSubmit}
        onStop={() => void stop()}
        isStreaming={isStreaming}
        disabled={connectionStatus === "disconnected" || showNetworkBannerFinal}
      />

      {/* Status Footer */}
      <StatusFooter status={connectionStatus} />
    </div>
  );
}