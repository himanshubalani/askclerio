// src/app/(app)/u/calendar/_components/upcoming-panel.tsx
"use client";

import { HugeiconsIcon } from "@hugeicons/react";
import { Calendar01Icon } from "@hugeicons/core-free-icons";
import { type DayGroupData } from "../_lib/dashboard-utils";
import { MeetingCard } from "./meeting-card";

export interface UpcomingPanelProps {
  groups: DayGroupData[];
  onSaveNote: (eventId: string, note: string) => void;
  savingEventId?: string | null;
  saveError: string | null;
  failedEventId?: string | null;
  onDeleteEvent: (eventId: string) => void;
  deletingEventId?: string | null;
}

export function UpcomingPanel({
  groups,
  onSaveNote,
  savingEventId,
  saveError,
  failedEventId,
  onDeleteEvent,
  deletingEventId,
}: UpcomingPanelProps) {
  if (groups.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-xl border border-[#e1e5f2] bg-white p-8 text-center">
        <HugeiconsIcon
          icon={Calendar01Icon}
          className="mb-3 h-10 w-10 text-[#022b3a]/20"
        />
        <p className="text-sm text-[#022b3a]/60">
          No upcoming events in the next 14 days
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      {groups.map((group) => (
        <div key={group.label}>
          <h3 className="mb-3 text-sm font-semibold text-[#022b3a]">
            {group.label}
          </h3>

          <div className="flex flex-col gap-2">
            {group.events.map((event) => (
              <MeetingCard
                key={`${group.label}-${event.id}`}
                event={event}
                onSaveNote={onSaveNote}
                isSaving={savingEventId === event.id}
                saveError={saveError}
                failedEventId={failedEventId}
                onDeleteEvent={onDeleteEvent}
                isDeleting={deletingEventId === event.id}
              />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
