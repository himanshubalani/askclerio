"use client";

import { useReducer } from "react";

// --- Types ---

export type ToolCallStatus =
  | "draft"
  | "awaiting_confirmation"
  | "running"
  | "done"
  | "cancelled"
  | "failed";

export interface ToolCallState {
  id: string;
  toolCallId: string;
  toolName: string;
  displayName: string;
  category: "email" | "calendar" | "search" | "generic";
  summary: string;
  parameters: Record<string, unknown>;
  editedParameters?: Record<string, unknown>;
  result?: unknown;
  status: ToolCallStatus;
  retryCount: number;
  maxRetries: 3;
  errorMessage?: string;
  startedAt?: Date;
  completedAt?: Date;
  chainId?: string;
}

export type ToolCallAction =
  | {
      type: "TOOL_CALL_RECEIVED";
      payload: Omit<ToolCallState, "status" | "retryCount" | "maxRetries">;
    }
  | { type: "AUTO_RUN"; id: string }
  | { type: "APPROVE"; id: string; editedParams?: Record<string, unknown> }
  | { type: "REJECT"; id: string }
  | { type: "EXECUTION_STARTED"; id: string }
  | { type: "EXECUTION_SUCCEEDED"; id: string; result: unknown }
  | { type: "EXECUTION_FAILED"; id: string; error: string }
  | { type: "RETRY"; id: string }
  | { type: "CANCEL"; id: string }
  | { type: "TIMEOUT"; id: string };

export interface ToolCallManagerState {
  toolCalls: ToolCallState[];
}

// --- Tool Classification ---

export const TOOL_CLASSIFICATION: Record<string, "read" | "write"> = {
  run_script: "write",
  get_schema: "read",
  list_operations: "read",
  corsair_setup: "write",
};

/**
 * Returns the classification for a tool. Unknown tools default to 'write' (safe fallback).
 */
export function getToolClassification(toolName: string): "read" | "write" {
  return TOOL_CLASSIFICATION[toolName] ?? "write";
}

// --- Tool Metadata ---

interface ToolMetadata {
  displayName: string;
  category: "email" | "calendar" | "search" | "generic";
  badgeColor: string;
}

const TOOL_METADATA_MAP: Record<
  string,
  { displayName: string; category: "email" | "calendar" | "search" | "generic" }
> = {
  run_script: { displayName: "Execute Script", category: "generic" },
  get_schema: { displayName: "Get API Schema", category: "generic" },
  list_operations: { displayName: "List Operations", category: "generic" },
  corsair_setup: { displayName: "Setup Integration", category: "generic" },
};

/**
 * Humanizes a tool name by replacing underscores with spaces and capitalizing the first letter.
 */
function humanizeToolName(toolName: string): string {
  if (!toolName) return "Unknown Tool";
  const spaced = toolName.replace(/_/g, " ");
  return spaced.charAt(0).toUpperCase() + spaced.slice(1);
}

/**
 * Returns metadata for a tool: displayName, category, and a default badgeColor.
 * For status-specific badge colors, use `getBadgeColor(status)`.
 */
export function getToolMetadata(toolName: string): ToolMetadata {
  const known = TOOL_METADATA_MAP[toolName];
  if (known) {
    return { ...known, badgeColor: "gray" };
  }
  return {
    displayName: humanizeToolName(toolName),
    category: "generic",
    badgeColor: "gray",
  };
}

// --- Badge Colors ---

/**
 * Returns the badge color string for a given tool-call status.
 */
export function getBadgeColor(status: ToolCallStatus): string {
  switch (status) {
    case "awaiting_confirmation":
      return "blue";
    case "running":
      return "yellow";
    case "done":
      return "green";
    case "failed":
      return "red";
    case "cancelled":
      return "gray";
    case "draft":
      return "gray";
    default:
      return "gray";
  }
}

// --- Reducer ---

/**
 * Reducer that manages an array of ToolCallState objects for UI rendering.
 * Handles all valid state transitions for tool-call cards.
 */
export function toolCallReducer(
  state: ToolCallManagerState,
  action: ToolCallAction,
): ToolCallManagerState {
  switch (action.type) {
    case "TOOL_CALL_RECEIVED": {
      const newToolCall: ToolCallState = {
        ...action.payload,
        status: "draft",
        retryCount: 0,
        maxRetries: 3,
      };
      return { toolCalls: [...state.toolCalls, newToolCall] };
    }

    case "AUTO_RUN": {
      return {
        toolCalls: state.toolCalls.map((tc) =>
          tc.id === action.id && tc.status === "draft"
            ? { ...tc, status: "running" as const, startedAt: new Date() }
            : tc,
        ),
      };
    }

    case "APPROVE": {
      return {
        toolCalls: state.toolCalls.map((tc) => {
          if (tc.id !== action.id || tc.status !== "awaiting_confirmation") {
            return tc;
          }
          return {
            ...tc,
            status: "running" as const,
            startedAt: new Date(),
            ...(action.editedParams
              ? { editedParameters: action.editedParams }
              : {}),
          };
        }),
      };
    }

    case "REJECT": {
      const targetIndex = state.toolCalls.findIndex(
        (tc) => tc.id === action.id,
      );
      if (targetIndex === -1) return state;

      const target = state.toolCalls[targetIndex]!;
      if (target.status !== "awaiting_confirmation") return state;

      return {
        toolCalls: state.toolCalls.map((tc, index) => {
          // Cancel the rejected tool call
          if (tc.id === action.id) {
            return { ...tc, status: "cancelled" as const, completedAt: new Date() };
          }
          // Cascade-cancel downstream tool calls in the same chain
          if (
            target.chainId &&
            tc.chainId === target.chainId &&
            index > targetIndex &&
            (tc.status === "draft" || tc.status === "awaiting_confirmation")
          ) {
            return { ...tc, status: "cancelled" as const, completedAt: new Date() };
          }
          return tc;
        }),
      };
    }

    case "EXECUTION_STARTED": {
      return {
        toolCalls: state.toolCalls.map((tc) =>
          tc.id === action.id && tc.status === "draft"
            ? {
                ...tc,
                status: "awaiting_confirmation" as const,
              }
            : tc,
        ),
      };
    }

    case "EXECUTION_SUCCEEDED": {
      return {
        toolCalls: state.toolCalls.map((tc) =>
          tc.id === action.id && tc.status === "running"
            ? {
                ...tc,
                status: "done" as const,
                result: action.result,
                completedAt: new Date(),
              }
            : tc,
        ),
      };
    }

    case "EXECUTION_FAILED": {
      return {
        toolCalls: state.toolCalls.map((tc) =>
          tc.id === action.id && tc.status === "running"
            ? {
                ...tc,
                status: "failed" as const,
                errorMessage: action.error,
                completedAt: new Date(),
              }
            : tc,
        ),
      };
    }

    case "RETRY": {
      return {
        toolCalls: state.toolCalls.map((tc) => {
          if (tc.id !== action.id || tc.status !== "failed") return tc;
          if (tc.retryCount >= tc.maxRetries) return tc;
          return {
            ...tc,
            status: "running" as const,
            retryCount: tc.retryCount + 1,
            errorMessage: undefined,
            startedAt: new Date(),
            completedAt: undefined,
          };
        }),
      };
    }

    case "CANCEL": {
      const targetIndex = state.toolCalls.findIndex(
        (tc) => tc.id === action.id,
      );
      if (targetIndex === -1) return state;

      const target = state.toolCalls[targetIndex]!;
      if (target.status !== "failed" && target.status !== "awaiting_confirmation") {
        return state;
      }

      return {
        toolCalls: state.toolCalls.map((tc, index) => {
          // Cancel the target tool call
          if (tc.id === action.id) {
            return { ...tc, status: "cancelled" as const, completedAt: new Date() };
          }
          // Cascade-cancel downstream tool calls in the same chain
          if (
            target.chainId &&
            tc.chainId === target.chainId &&
            index > targetIndex &&
            (tc.status === "draft" || tc.status === "awaiting_confirmation")
          ) {
            return { ...tc, status: "cancelled" as const, completedAt: new Date() };
          }
          return tc;
        }),
      };
    }

    case "TIMEOUT": {
      return {
        toolCalls: state.toolCalls.map((tc) =>
          tc.id === action.id && tc.status === "running"
            ? {
                ...tc,
                status: "failed" as const,
                errorMessage: "Tool execution timed out after 30 seconds",
                completedAt: new Date(),
              }
            : tc,
        ),
      };
    }

    default:
      return state;
  }
}

// --- Hook ---

/**
 * Hook that manages tool-call UI state using a reducer.
 * Tracks states purely for rendering tool-call cards.
 * Actual stream pause/resume is handled by the SDK's native approval flow.
 */
export function useToolCallManager() {
  const [state, dispatch] = useReducer(toolCallReducer, { toolCalls: [] });

  return { state, dispatch };
}
