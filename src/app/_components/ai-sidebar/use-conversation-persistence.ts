"use client";

import { useState, useCallback, useRef } from "react";
import { api } from "@/trpc/react";

/**
 * Truncates a string to create a conversation title.
 * If the string exceeds maxLen, it's cut and an ellipsis is appended.
 */
export function generateTitle(message: string, maxLen: number = 80): string {
  const trimmed = message.trim();
  if (trimmed.length <= maxLen) return trimmed;
  return trimmed.slice(0, maxLen - 1) + "…";
}

export interface Message {
  id: string;
  role: "user" | "assistant" | "system" | "tool";
  content: string;
  toolInvocations?: Array<{
    toolCallId: string;
    toolName: string;
    args: Record<string, unknown>;
    result?: unknown;
    state: string;
  }>;
}

/**
 * Custom hook that manages conversation persistence for the AI sidebar.
 *
 * Responsibilities:
 * - Manages the active conversation ID in state
 * - Creates conversations on first message (auto-generates title)
 * - Persists messages and tool calls to DB via tRPC mutations
 * - Provides reset for switching conversations
 */
export function useConversationPersistence() {
  const [activeConversationId, setActiveConversationId] = useState<
    string | null
  >(null);

  // Track which message IDs have already been persisted to avoid duplicates
  const persistedMessageIds = useRef<Set<string>>(new Set());

  const createConversation = api.chat.createConversation.useMutation();
  const saveMessage = api.chat.saveMessage.useMutation();
  const recordToolCall = api.chat.recordToolCall.useMutation();

  /**
   * Ensures a conversation exists for the current chat session.
   * If no active conversation ID, creates one using the first user message as the title.
   * Returns the conversation ID.
   */
  const ensureConversation = useCallback(
    async (firstMessage: string): Promise<string> => {
      if (activeConversationId) return activeConversationId;

      const title = generateTitle(firstMessage);
      const conversation = await createConversation.mutateAsync({ title });
      setActiveConversationId(conversation.id);
      return conversation.id;
    },
    [activeConversationId, createConversation]
  );

  /**
   * Persists new messages (and associated tool calls) to the database.
   * Called after the assistant response completes.
   * Skips messages that have already been persisted.
   */
  const persistMessages = useCallback(
    async (messages: Message[], conversationId: string) => {
      for (const message of messages) {
        // Skip already-persisted messages
        if (persistedMessageIds.current.has(message.id)) continue;

        // Save the message itself
        const savedMessage = await saveMessage.mutateAsync({
          conversationId,
          role: message.role,
          content: message.content,
          toolCalls: message.toolInvocations ?? undefined,
        });

        // Record individual tool calls for the audit trail
        if (message.toolInvocations) {
          for (const toolCall of message.toolInvocations) {
            await recordToolCall.mutateAsync({
              messageId: savedMessage.id,
              conversationId,
              toolName: toolCall.toolName,
              toolCallId: toolCall.toolCallId,
              parameters: toolCall.args,
              status:
                toolCall.state === "result"
                  ? "done"
                  : toolCall.state === "error"
                    ? "failed"
                    : "draft",
            });
          }
        }

        persistedMessageIds.current.add(message.id);
      }
    },
    [saveMessage, recordToolCall]
  );

  /**
   * Resets the active conversation state (used when switching conversations).
   * Clears the active ID and the persisted message tracking.
   */
  const resetConversation = useCallback(() => {
    setActiveConversationId(null);
    persistedMessageIds.current.clear();
  }, []);

  return {
    activeConversationId,
    setActiveConversationId,
    ensureConversation,
    persistMessages,
    resetConversation,
  };
}
