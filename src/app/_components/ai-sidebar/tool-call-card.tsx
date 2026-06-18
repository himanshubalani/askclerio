// src/app/_components/ai-sidebar/tool-call-card.tsx
"use client";

import { useEffect, useRef, useState } from "react";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  Mail01Icon,
  Calendar01Icon,
  Search01Icon,
  Settings01Icon,
  Loading02Icon,
  AlertCircleIcon
} from "@hugeicons/core-free-icons";

import {
  type ToolCallState,
  type ToolCallStatus,
  getToolMetadata,
} from "./use-tool-call-manager";

export interface ToolCallCardProps {
  toolCall: ToolCallState;
  onApprove: () => void;
  onReject: () => void;
  onRetry: () => void;
  onCancel: () => void;
}

function getCategoryIcon(category: "email" | "calendar" | "search" | "generic") {
  switch (category) {
    case "email": return Mail01Icon;
    case "calendar": return Calendar01Icon;
    case "search": return Search01Icon;
    case "generic":
    default: return Settings01Icon;
  }
}

export function ToolCallCard({
  toolCall,
  onApprove,
  onReject,
  onRetry,
  onCancel,
}: ToolCallCardProps) {
  const [announcement, setAnnouncement] = useState("");
  const prevStatusRef = useRef<ToolCallStatus>(toolCall.status);

  // Announce status changes for screen readers
  useEffect(() => {
    if (prevStatusRef.current !== toolCall.status) {
      setAnnouncement(`${toolCall.displayName}: ${toolCall.status}`);
      prevStatusRef.current = toolCall.status;
    }
  }, [toolCall.status, toolCall.displayName]);

  const metadata = getToolMetadata(toolCall.toolName);
  const categoryIcon = getCategoryIcon(metadata.category);
  
  const isAwaiting = toolCall.status === "awaiting_confirmation";
  const isFailed = toolCall.status === "failed";
  const isRunning = toolCall.status === "running";
  const canRetry = isFailed && toolCall.retryCount < toolCall.maxRetries;

  return (
    <div className="relative overflow-hidden rounded-xl border border-[#e1e5f2] bg-white shadow-[0_4px_16px_rgba(2,43,58,0.04)] animate-in slide-in-from-bottom-3 fade-in duration-300">
      
      {/* Visually-hidden aria-live region for state change announcements */}
      <span aria-live="polite" aria-atomic="true" className="sr-only">
        {announcement}
      </span>

      {/* Thin Bar Layout */}
      <div className="flex items-center justify-between px-3 py-2.5">
        <div className="flex items-center gap-2.5 min-w-0">
          {isRunning ? (
            <HugeiconsIcon icon={Loading02Icon} className="h-4 w-4 shrink-0 text-[#1f7a8c] animate-spin" />
          ) : isFailed ? (
            <HugeiconsIcon icon={AlertCircleIcon} className="h-4 w-4 shrink-0 text-red-500" />
          ) : (
            <HugeiconsIcon icon={categoryIcon} className="h-4 w-4 shrink-0 text-[#1f7a8c]" />
          )}
          
          <span className="text-xs font-medium text-[#022b3a] truncate">
            {isAwaiting && `Approve ${metadata.displayName}?`}
            {isRunning && `Executing ${metadata.displayName}...`}
            {isFailed && `Failed: ${metadata.displayName}`}
            {!isAwaiting && !isRunning && !isFailed && toolCall.displayName}
          </span>
        </div>

        {/* Action buttons (Only show when necessary) */}
        <div className="flex items-center gap-1.5 shrink-0 ml-3">
          {isAwaiting && (
            <>
              <button
                type="button"
                onClick={onReject}
                className="rounded-md px-2.5 py-1 text-[11px] font-medium bg-gray-100 text-gray-600 hover:bg-gray-200 transition-colors"
              >
                Reject
              </button>
              <button
                type="button"
                onClick={() => onApprove()}
                className="rounded-md px-2.5 py-1 text-[11px] font-medium bg-[#022b3a] text-white hover:bg-[#1f7a8c] transition-colors shadow-sm"
              >
                Approve
              </button>
            </>
          )}
          {isFailed && (
            <>
              <button
                type="button"
                onClick={onCancel}
                className="rounded-md px-2.5 py-1 text-[11px] font-medium bg-gray-100 text-gray-600 hover:bg-gray-200 transition-colors"
              >
                Dismiss
              </button>
              {canRetry && (
                <button
                  type="button"
                  onClick={onRetry}
                  className="rounded-md px-2.5 py-1 text-[11px] font-medium bg-amber-100 text-amber-700 hover:bg-amber-200 transition-colors"
                >
                  Retry
                </button>
              )}
            </>
          )}
        </div>
      </div>

      {/* Error message (only visible if failed) */}
      {isFailed && toolCall.errorMessage && (
        <div className="px-3 pb-2.5 pt-0">
           <p className="text-[11px] text-red-600 truncate">{toolCall.errorMessage}</p>
        </div>
      )}
    </div>
  );
}
