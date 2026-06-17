"use client";

import { useEffect, useRef, useState, type ChangeEvent } from "react";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  Mail01Icon,
  Calendar01Icon,
  Search01Icon,
  Settings01Icon,
} from "@hugeicons/core-free-icons";

import {
  type ToolCallState,
  type ToolCallStatus,
  getBadgeColor,
  getToolMetadata,
} from "./use-tool-call-manager";
import { truncate } from "./context-strip";

// --- Utility ---

/**
 * Stringifies a parameter value and truncates to maxLen characters.
 * Non-string values are JSON-stringified first.
 */
export function truncateParam(value: unknown, maxLen: number): string {
  let str: string;
  if (typeof value === "string") {
    str = value;
  } else if (value === null || value === undefined) {
    str = String(value);
  } else {
    try {
      str = JSON.stringify(value);
    } catch {
      str = String(value);
    }
  }
  return truncate(str, maxLen);
}

// --- Props ---

export interface ToolCallCardProps {
  toolCall: ToolCallState;
  onApprove: (editedParams?: Record<string, unknown>) => void;
  onReject: () => void;
  onRetry: () => void;
  onCancel: () => void;
  showConnector?: boolean;
}

// --- Constants ---

const EDITABLE_FIELDS = ["recipients", "subject", "body"];
const MAX_PARAM_ROWS = 5;
const PARAM_VALUE_MAX_LEN = 80;
const SUMMARY_MAX_LEN = 120;

// --- Category Icon Map ---

function getCategoryIcon(category: "email" | "calendar" | "search" | "generic") {
  switch (category) {
    case "email":
      return Mail01Icon;
    case "calendar":
      return Calendar01Icon;
    case "search":
      return Search01Icon;
    case "generic":
    default:
      return Settings01Icon;
  }
}

// --- Badge Color Classes ---

function getBadgeClasses(status: ToolCallStatus): string {
  const color = getBadgeColor(status);
  switch (color) {
    case "blue":
      return "bg-blue-100 text-blue-700";
    case "yellow":
      return "bg-amber-100 text-amber-700";
    case "green":
      return "bg-emerald-100 text-emerald-700";
    case "red":
      return "bg-red-100 text-red-700";
    case "gray":
    default:
      return "bg-gray-100 text-gray-600";
  }
}

// --- Status Label ---

function getStatusLabel(status: ToolCallStatus): string {
  switch (status) {
    case "awaiting_confirmation":
      return "Awaiting";
    case "running":
      return "Running";
    case "done":
      return "Done";
    case "failed":
      return "Failed";
    case "cancelled":
      return "Cancelled";
    case "draft":
      return "Draft";
    default:
      return "Unknown";
  }
}

// --- Component ---

export function ToolCallCard({
  toolCall,
  onApprove,
  onReject,
  onRetry,
  onCancel,
  showConnector = false,
}: ToolCallCardProps) {
  const [showRaw, setShowRaw] = useState(false);
  const [editedValues, setEditedValues] = useState<Record<string, string>>({});
  const prevStatusRef = useRef<ToolCallStatus>(toolCall.status);
  const [announcement, setAnnouncement] = useState("");

  // Announce status changes for screen readers
  useEffect(() => {
    if (prevStatusRef.current !== toolCall.status) {
      const label = getStatusLabel(toolCall.status);
      setAnnouncement(`${toolCall.displayName}: ${label}`);
      prevStatusRef.current = toolCall.status;
    }
  }, [toolCall.status, toolCall.displayName]);

  const metadata = getToolMetadata(toolCall.toolName);
  const categoryIcon = getCategoryIcon(metadata.category);
  const isAwaiting = toolCall.status === "awaiting_confirmation";
  const isFailed = toolCall.status === "failed";
  const canRetry = isFailed && toolCall.retryCount < toolCall.maxRetries;

  // Get parameter entries (max 5)
  const paramEntries = Object.entries(toolCall.parameters).slice(
    0,
    MAX_PARAM_ROWS,
  );

  // Handle edited parameter change
  const handleParamChange = (key: string, value: string) => {
    setEditedValues((prev) => ({ ...prev, [key]: value }));
  };

  // Build edited params for approval
  const handleApprove = () => {
    if (Object.keys(editedValues).length > 0) {
      const merged: Record<string, unknown> = {
        ...toolCall.parameters,
        ...editedValues,
      };
      onApprove(merged);
    } else {
      onApprove();
    }
  };

  return (
    <div className="relative">
      {/* Visually-hidden aria-live region for state change announcements */}
      <span
        aria-live="polite"
        aria-atomic="true"
        className="sr-only"
      >
        {announcement}
      </span>

      {/* Vertical connector line */}
      {showConnector && (
        <div className="absolute left-4 top-0 -bottom-2 border-l-2 border-[#e1e5f2]" />
      )}

      {/* Card */}
      <div
        className={`relative rounded-xl border border-[#e1e5f2] bg-[#f8f9fc] p-3 transition-opacity duration-200 ease-out motion-reduce:transition-none ${
          showConnector ? "ml-6" : ""
        }`}
      >
        {/* Header row */}
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0">
            <HugeiconsIcon
              icon={categoryIcon}
              className="h-4 w-4 shrink-0 text-[#1f7a8c]"
            />
            <span className="text-sm font-medium text-[#022b3a] truncate">
              {toolCall.displayName}
            </span>
          </div>

          {/* Status badge */}
          <span
            className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-medium ${getBadgeClasses(
              toolCall.status,
            )}`}
          >
            {getStatusLabel(toolCall.status)}
          </span>
        </div>

        {/* Summary row */}
        {toolCall.summary && (
          <p className="text-xs text-[#022b3a]/60 mt-1">
            {truncate(toolCall.summary, SUMMARY_MAX_LEN)}
          </p>
        )}

        {/* Parameter rows */}
        {paramEntries.length > 0 && (
          <div className="mt-2 space-y-1">
            {paramEntries.map(([key, value]) => {
              const isEditable = isAwaiting && EDITABLE_FIELDS.includes(key);

              if (isEditable) {
                const currentValue =
                  editedValues[key] ??
                  (typeof value === "string" ? value : JSON.stringify(value));
                const isLongField = key === "body";

                return (
                  <div key={key} className="flex flex-col gap-0.5">
                    <label className="text-[10px] font-medium text-[#022b3a]/50 uppercase tracking-wide">
                      {key}
                    </label>
                    {isLongField ? (
                      <textarea
                        value={currentValue}
                        onChange={(e: ChangeEvent<HTMLTextAreaElement>) =>
                          handleParamChange(key, e.target.value)
                        }
                        className="w-full rounded-md border border-[#e1e5f2] bg-white px-2 py-1 text-xs text-[#022b3a] focus:outline-none focus:ring-1 focus:ring-[#1f7a8c] resize-y min-h-[44px] max-h-[120px]"
                        rows={2}
                      />
                    ) : (
                      <input
                        type="text"
                        value={currentValue}
                        onChange={(e: ChangeEvent<HTMLInputElement>) =>
                          handleParamChange(key, e.target.value)
                        }
                        className="w-full rounded-md border border-[#e1e5f2] bg-white px-2 py-1 text-xs text-[#022b3a] focus:outline-none focus:ring-1 focus:ring-[#1f7a8c]"
                      />
                    )}
                  </div>
                );
              }

              return (
                <div
                  key={key}
                  className="flex items-baseline gap-1.5 text-xs"
                >
                  <span className="shrink-0 font-medium text-[#022b3a]/70">
                    {key}:
                  </span>
                  <span className="text-[#022b3a]/50 truncate">
                    {truncateParam(value, PARAM_VALUE_MAX_LEN)}
                  </span>
                </div>
              );
            })}
          </div>
        )}

        {/* View raw toggle */}
        <button
          type="button"
          onClick={() => setShowRaw((prev) => !prev)}
          className="mt-2 text-xs text-[#1f7a8c] cursor-pointer hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-[#022b3a]/40 focus-visible:ring-offset-1 rounded"
        >
          {showRaw ? "Hide raw" : "View raw"}
        </button>

        {/* Raw JSON view */}
        {showRaw && (
          <pre className="mt-1 rounded-lg bg-[#022b3a]/5 p-2 text-[11px] text-[#022b3a]/70 overflow-x-auto max-h-[200px] overflow-y-auto">
            {JSON.stringify(toolCall.parameters, null, 2)}
          </pre>
        )}

        {/* Error message for failed state */}
        {isFailed && toolCall.errorMessage && (
          <p className="mt-2 text-xs text-red-600 bg-red-50 rounded-md px-2 py-1">
            {toolCall.errorMessage}
          </p>
        )}

        {/* Action buttons */}
        {isAwaiting && (
          <div className="mt-3 flex items-center gap-2">
            <button
              type="button"
              onClick={handleApprove}
              className="rounded-lg px-3 py-1.5 text-xs font-medium bg-emerald-100 text-emerald-700 hover:bg-emerald-200 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[#022b3a]/40 focus-visible:ring-offset-1"
            >
              Approve
            </button>
            <button
              type="button"
              onClick={onReject}
              className="rounded-lg px-3 py-1.5 text-xs font-medium bg-red-100 text-red-700 hover:bg-red-200 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[#022b3a]/40 focus-visible:ring-offset-1"
            >
              Reject
            </button>
          </div>
        )}

        {isFailed && (
          <div className="mt-3 flex items-center gap-2">
            {canRetry && (
              <button
                type="button"
                onClick={onRetry}
                className="rounded-lg px-3 py-1.5 text-xs font-medium bg-amber-100 text-amber-700 hover:bg-amber-200 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[#022b3a]/40 focus-visible:ring-offset-1"
              >
                Retry
              </button>
            )}
            <button
              type="button"
              onClick={onCancel}
              className="rounded-lg px-3 py-1.5 text-xs font-medium bg-gray-100 text-gray-600 hover:bg-gray-200 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[#022b3a]/40 focus-visible:ring-offset-1"
            >
              Cancel
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
