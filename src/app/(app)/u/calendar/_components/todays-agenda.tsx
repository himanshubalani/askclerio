"use client";

import { HugeiconsIcon } from "@hugeicons/react";
import { Calendar01Icon } from "@hugeicons/core-free-icons";
import { type AgendaItemData, truncateTitle } from "../_lib/dashboard-utils";

export interface TodaysAgendaProps {
  events: AgendaItemData[];
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

export function TodaysAgenda({ events }: TodaysAgendaProps) {
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
            className="flex items-start gap-3 rounded-xl border border-[#e1e5f2] bg-white p-3 transition-colors hover:border-[#1f7a8c]/30"
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
            <span className="text-sm font-medium text-[#022b3a] text-pretty">
              {displayTitle}
            </span>
          </div>
        );
      })}
    </div>
  );
}
