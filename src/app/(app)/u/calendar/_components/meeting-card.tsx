// src/app/(app)/u/calendar/_components/meeting-card.tsx
"use client";

import { useState, useEffect } from "react";
import { HugeiconsIcon } from "@hugeicons/react";
import { AlertCircleIcon, Delete02Icon, Loading02Icon } from "@hugeicons/core-free-icons";
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
  onDeleteEvent: (eventId: string) => void;
  isDeleting?: boolean;
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
  onDeleteEvent,
  isDeleting,
}: MeetingCardProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [draftNote, setDraftNote] = useState(event.note ?? "");

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
      setIsEditing(false);
      setDraftNote(event.note ?? "");
      return;
    }
    const noteToSave = trimmed.length > 1000 ? trimmed.slice(0, 1000) : trimmed;
    onSaveNote(event.id, noteToSave);
    setIsEditing(false);
  }

  function handleCancel() {
    setIsEditing(false);
    setDraftNote(event.note ?? "");
  }

  return (
    <div className="rounded-xl border border-[#e1e5f2] bg-white p-3 transition-[border-color] hover:border-[#1f7a8c]/30 group">
      
      {/* Header Area with Delete Action */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
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
          <div className="mb-2 text-sm font-medium text-[#022b3a] text-pretty truncate whitespace-normal">
            {displayTitle}
          </div>
        </div>

        <button
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            onDeleteEvent(event.id);
          }}
          disabled={isDeleting}
          title="Delete meeting"
          className="shrink-0 rounded-md p-1.5 text-[#022b3a]/30 hover:bg-red-50 hover:text-red-600 transition-[color,background-color] disabled:opacity-50"
        >
          {isDeleting ? (
            <HugeiconsIcon icon={Loading02Icon} className="h-4 w-4 animate-spin text-[#022b3a]/40" />
          ) : (
            <HugeiconsIcon icon={Delete02Icon} className="h-4 w-4" />
          )}
        </button>
      </div>

      {/* Notes field */}
      {isEditing ? (
        <div className="flex flex-col gap-2 mt-1">
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
              className="rounded-md bg-[#1f7a8c] px-3 py-1 text-xs font-medium text-white transition-[background-color] hover:bg-[#022b3a] disabled:opacity-50"
            >
              {isSaving ? "Saving…" : "Save"}
            </button>
            <button
              onClick={handleCancel}
              disabled={isSaving}
              className="rounded-md border border-[#e1e5f2] px-3 py-1 text-xs font-medium text-[#022b3a]/60 transition-[color,background-color] hover:text-[#022b3a] hover:bg-[#e1e5f2]/50 disabled:opacity-50"
            >
              Cancel
            </button>
          </div>
        </div>
      ) : (
        <button
          onClick={handleNoteClick}
          className="text-xs text-[#022b3a]/50 transition-[color] hover:text-[#1f7a8c] mt-1"
        >
          {event.note ?? "+ Add note"}
        </button>
      )}
    </div>
  );
}
