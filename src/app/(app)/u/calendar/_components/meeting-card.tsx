"use client";

import { useState, useEffect } from "react";
import { HugeiconsIcon } from "@hugeicons/react";
import { AlertCircleIcon } from "@hugeicons/core-free-icons";
import {
  type MeetingCardData,
  truncateTitle,
  shouldSaveNote,
} from "../_lib/dashboard-utils";

export interface MeetingCardProps {
  event: MeetingCardData;
  onSaveNote: (eventId: string, note: string) => void;
  isSaving: boolean;
  saveError: string | null;
  failedEventId?: string | null;
}

function formatEventTime(start: string, end: string): string {
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

export function MeetingCard({
  event,
  onSaveNote,
  isSaving,
  saveError,
  failedEventId,
}: MeetingCardProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [draftNote, setDraftNote] = useState(event.note ?? "");

  // If saveError is set, keep the textarea open with the draft text
  useEffect(() => {
    if (saveError && failedEventId === event.id && !isEditing) {
      setIsEditing(true);
    }
  }, [saveError, failedEventId, isEditing, event.id]);

  const displayTitle = event.summary
    ? truncateTitle(event.summary, 80)
    : "Untitled Event";

  function handleNoteClick() {
    setIsEditing(true);
    setDraftNote(event.note ?? "");
  }

  function handleSave() {
    const trimmed = draftNote.trim();
    if (!shouldSaveNote(draftNote)) {
      // Empty/whitespace-only text: no-op, close textarea
      setIsEditing(false);
      setDraftNote(event.note ?? "");
      return;
    }
    // Valid note (1-1000 chars after trim)
    const noteToSave = trimmed.length > 1000 ? trimmed.slice(0, 1000) : trimmed;
    onSaveNote(event.id, noteToSave);
    // Close on success — if saveError comes back, useEffect reopens
    setIsEditing(false);
  }

  function handleCancel() {
    setIsEditing(false);
    setDraftNote(event.note ?? "");
  }

  return (
    <div className="rounded-xl border border-[#e1e5f2] bg-white p-3 transition-colors hover:border-[#1f7a8c]/30">
      {/* Time display */}
      <div className="mb-1">
        {event.isAllDay ? (
          <span className="inline-flex items-center rounded-md bg-[#1f7a8c]/10 px-2 py-0.5 text-xs font-medium text-[#1f7a8c]">
            All day
          </span>
        ) : (
          <span className="text-xs font-medium tabular-nums text-[#1f7a8c]">
            {formatEventTime(event.start, event.end)}
          </span>
        )}
      </div>

      {/* Title */}
      <div className="mb-2 text-sm font-medium text-[#022b3a] text-pretty">
        {displayTitle}
      </div>

      {/* Notes field */}
      {isEditing ? (
        <div className="flex flex-col gap-2">
          <textarea
            value={draftNote}
            onChange={(e) => setDraftNote(e.target.value)}
            rows={3}
            maxLength={1000}
            className="w-full rounded-md border border-[#e1e5f2] p-2 text-sm text-[#022b3a] placeholder:text-[#022b3a]/40 focus:outline-none focus:ring-1 focus:ring-[#1f7a8c] resize-none"
            placeholder="Write a note…"
          />
          {saveError && failedEventId === event.id && (
            <div className="flex items-center gap-1.5 text-xs text-red-600">
              <HugeiconsIcon
                icon={AlertCircleIcon}
                className="h-3.5 w-3.5 shrink-0"
              />
              <span>{saveError}</span>
            </div>
          )}
          <div className="flex gap-2">
            <button
              onClick={handleSave}
              disabled={isSaving}
              className="rounded-md bg-[#1f7a8c] px-3 py-1 text-xs font-medium text-white transition-colors hover:bg-[#022b3a] disabled:opacity-50"
            >
              {isSaving ? "Saving…" : "Save"}
            </button>
            <button
              onClick={handleCancel}
              disabled={isSaving}
              className="rounded-md border border-[#e1e5f2] px-3 py-1 text-xs font-medium text-[#022b3a]/60 transition-colors hover:text-[#022b3a] hover:bg-[#e1e5f2]/50 disabled:opacity-50"
            >
              Cancel
            </button>
          </div>
        </div>
      ) : (
        <button
          onClick={handleNoteClick}
          className="text-xs text-[#022b3a]/50 transition-colors hover:text-[#1f7a8c]"
        >
          {event.note ?? "+ Add note"}
        </button>
      )}
    </div>
  );
}
