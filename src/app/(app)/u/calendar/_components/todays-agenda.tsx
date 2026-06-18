// src/app/(app)/u/calendar/_components/todays-agenda.tsx
"use client";

import { HugeiconsIcon } from "@hugeicons/react";
import { Calendar01Icon, Delete02Icon, Loading02Icon } from "@hugeicons/core-free-icons";
import { type AgendaItemData, truncateTitle } from "../_lib/dashboard-utils";

export interface TodaysAgendaProps {
  events: AgendaItemData[];
  onDeleteEvent: (eventId: string) => void;
  deletingEventId?: string | null;
}

function formatTimeRange(start: string, end: string): string {
  const startDate = new Date(start);
  const endDate = new Date(end);
  const options: Intl.DateTimeFormatOptions = {
    hour: "numeric",
    minute: "2-digit",
  };
  const startStr = startDate.toLocaleTimeString(undefined, options);
  const endStr = endDate.toLocaleTimeString(undefined, options);
  return `${startStr} – ${endStr}`;
}

export function TodaysAgenda({ events, onDeleteEvent, deletingEventId }: TodaysAgendaProps) {
  if (events.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-[#e1e5f2] bg-white p-6 text-center">
        <div className="mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-[#bfdbf7]/30 text-[#1f7a8c]">
          <HugeiconsIcon icon={Calendar01Icon} className="h-5 w-5 stroke-2" />
        </div>
        <p className="text-sm text-[#022b3a]/60">
          No events scheduled for today
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2">
      {events.map((event) => {
        const displayTitle = event.summary
          ? truncateTitle(event.summary, 80)
          : "Untitled Event";

        return (
          <div
            key={event.id}
            className="flex items-start gap-3 rounded-xl border border-[#e1e5f2] bg-white p-3 transition-colors hover:border-[#1f7a8c]/30 group"
          >
            <div className="shrink-0 pt-0.5">
              {event.isAllDay ? (
                <span className="inline-flex items-center rounded-md bg-[#1f7a8c]/10 px-2 py-0.5 text-xs font-medium text-[#1f7a8c]">
                  All day
                </span>
              ) : (
                <span className="text-xs font-medium tabular-nums text-[#1f7a8c]">
                  {formatTimeRange(event.start, event.end)}
                </span>
              )}
            </div>
            <span className="text-sm font-medium text-[#022b3a] text-pretty flex-1 pt-0.5">
              {displayTitle}
            </span>
            <button
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                onDeleteEvent(event.id);
              }}
              disabled={deletingEventId === event.id}
              title="Delete meeting"
              className="shrink-0 rounded-md p-1.5 text-[#022b3a]/30 hover:bg-red-50 hover:text-red-600 transition-all disabled:opacity-50"
            >
              {deletingEventId === event.id ? (
                <HugeiconsIcon icon={Loading02Icon} className="h-4 w-4 animate-spin text-[#022b3a]/40" />
              ) : (
                <HugeiconsIcon icon={Delete02Icon} className="h-4 w-4" />
              )}
            </button>
          </div>
        );
      })}
    </div>
  );
}
