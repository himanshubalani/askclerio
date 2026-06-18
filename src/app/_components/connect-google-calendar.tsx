"use client";

import { HugeiconsIcon } from "@hugeicons/react";
import { Calendar01Icon, AlertCircleIcon } from "@hugeicons/core-free-icons";

interface ConnectGoogleCalendarProps {
  /** Whether the Google Calendar plugin is already connected */
  isCalendarConnected: boolean;
  /** Optional error message to display (e.g. after OAuth failure) */
  error?: string | null;
}

/**
 * Displays a prompt to connect Google Calendar when the user has Gmail
 * connected but not the `googlecalendar` plugin. Renders in AI Sidebar
 * and calendar section.
 */
export function ConnectGoogleCalendar({
  isCalendarConnected,
  error,
}: ConnectGoogleCalendarProps) {
  // If already connected, render nothing
  if (isCalendarConnected) {
    return null;
  }

  return (
    <div className="rounded-xl border border-[#e1e5f2] bg-white p-4 shadow-sm">
      <div className="flex items-start gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-[#bfdbf7]/30 text-[#1f7a8c]">
          <HugeiconsIcon icon={Calendar01Icon} className="h-5 w-5 stroke-2" />
        </div>
        <div className="flex flex-col gap-2">
          <p className="text-sm text-[#022b3a]/80">
            Connect Google Calendar to let the assistant schedule meetings on
            your behalf
          </p>

          {error && (
            <div className="flex items-center gap-1.5 text-xs text-red-600">
              <HugeiconsIcon
                icon={AlertCircleIcon}
                className="h-3.5 w-3.5 shrink-0"
              />
              <span>{error}</span>
            </div>
          )}

          <a
            href="/api/connect?plugin=googlecalendar"
            className="inline-flex w-fit items-center gap-1.5 rounded-lg bg-[#022b3a] px-4 py-2 text-sm font-medium text-white transition-[transform,background-color] hover:bg-[#1f7a8c] active:scale-[0.96]"
          >
            <HugeiconsIcon icon={Calendar01Icon} className="h-4 w-4" />
            Connect Google Calendar
          </a>
        </div>
      </div>
    </div>
  );
}
