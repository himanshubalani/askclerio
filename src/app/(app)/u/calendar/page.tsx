"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  Calendar01Icon,
  Add01Icon,
  AlertCircleIcon,
} from "@hugeicons/core-free-icons";
import { ChatInput } from "@/app/_components/chat-input";
import { GoogleOAuthConnection } from "@/app/_components/oauth-connections";
import { useCalendarDashboard } from "./_hooks/use-calendar-dashboard";
import { StatsRow } from "./_components/stats-row";
import { TodaysAgenda } from "./_components/todays-agenda";
import { UpcomingPanel } from "./_components/upcoming-panel";
import { CreateMeetingModal } from "./_components/create-meeting-modal";
import { RefreshButton } from "./_components/refresh-button";
import { formToCreateInput } from "./_lib/form-validation";
import type { CreateMeetingFormValues } from "./_lib/form-validation";

export default function CalendarDashboard() {
  const {
    isLoading,
    isFetching,
    error,
    needsAuth,
    needsSync,
    stats,
    todayEvents,
    upcomingGroups,
    syncLatest,
    createEvent,
    saveNote,
  } = useCalendarDashboard();

  const [isModalOpen, setIsModalOpen] = useState(false);

  // Sync timeout (30s)
  const syncTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [syncTimedOut, setSyncTimedOut] = useState(false);

  const handleSync = useCallback(() => {
    setSyncTimedOut(false);

    // Clear any existing timeout
    if (syncTimeoutRef.current) {
      clearTimeout(syncTimeoutRef.current);
    }

    syncLatest.mutate(undefined, {
      onSuccess: () => {
        if (syncTimeoutRef.current) {
          clearTimeout(syncTimeoutRef.current);
          syncTimeoutRef.current = null;
        }
      },
      onError: () => {
        if (syncTimeoutRef.current) {
          clearTimeout(syncTimeoutRef.current);
          syncTimeoutRef.current = null;
        }
      },
    });

    // Set 30s timeout
    syncTimeoutRef.current = setTimeout(() => {
      setSyncTimedOut(true);
      syncTimeoutRef.current = null;
    }, 30_000);
  }, [syncLatest]);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (syncTimeoutRef.current) {
        clearTimeout(syncTimeoutRef.current);
      }
    };
  }, []);

  const handleCreateMeeting = useCallback(
    (values: CreateMeetingFormValues) => {
      const input = formToCreateInput(values);
      createEvent.mutate(input, {
        onSuccess: () => {
          setIsModalOpen(false);
        },
      });
    },
    [createEvent]
  );

  const handleSaveNote = useCallback(
    (eventId: string, note: string) => {
      // Clear previous failures and set active saving event
      setFailedEventId(null);
      setSaveErrorMessage(null);
      setSavingEventId(eventId);

      saveNote.mutate({ eventId, note }, {
        onError: (err: any) => {
          setFailedEventId(eventId);
          setSaveErrorMessage(err?.message ?? "Save failed");
          setSavingEventId(null);
        },
        onSuccess: () => {
          setFailedEventId(null);
          setSaveErrorMessage(null);
          setSavingEventId(null);
        },
      });
    },
    [saveNote]
  );

  const [failedEventId, setFailedEventId] = useState<string | null>(null);
  const [saveErrorMessage, setSaveErrorMessage] = useState<string | null>(null);
  const [savingEventId, setSavingEventId] = useState<string | null>(null);

  // --- Auth state: show full-screen OAuth prompt ---
  if (needsAuth) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center bg-[#fcfcfc] antialiased">
        <div className="flex max-w-lg flex-col items-center rounded-3xl border border-[#e1e5f2] bg-white p-8 text-center shadow-[0_4px_24px_rgba(2,43,58,0.04)]">
          <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-[#bfdbf7]/30 text-[#1f7a8c]">
            <HugeiconsIcon
              icon={Calendar01Icon}
              className="h-8 w-8 stroke-2"
            />
          </div>
          <h2 className="mb-2 text-xl font-bold text-[#022b3a] text-balance">
            Connect your Workspace
          </h2>
          <p className="mb-8 text-sm text-[#022b3a]/60 text-pretty">
            Clerio needs access to your Google Calendar to manage your schedule.
          </p>
          <div className="w-full space-y-3">
            <GoogleOAuthConnection />
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="flex-1 overflow-y-auto px-8 py-8 antialiased">
        {/* Dashboard Header */}
        <header className="mb-6 flex items-center justify-between">
          <h1 className="text-2xl font-semibold text-[#022b3a]">Calendar</h1>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsModalOpen(true)}
              className="flex items-center gap-1.5 rounded-lg bg-[#1f7a8c] px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-[#022b3a]"
            >
              <HugeiconsIcon icon={Add01Icon} className="h-4 w-4" />
              Create Meeting
            </button>
            <RefreshButton
              onClick={handleSync}
              isSyncing={syncLatest.isPending}
            />
          </div>
        </header>

        {/* Sync timeout error */}
        {syncTimedOut && (
          <div className="mb-4 flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 px-4 py-3">
            <HugeiconsIcon
              icon={AlertCircleIcon}
              className="h-4 w-4 shrink-0 text-red-600"
            />
            <p className="text-sm text-red-700">
              Sync timed out. Please try again.
            </p>
          </div>
        )}

        {/* Sync error */}
        {syncLatest.error && !syncTimedOut && (
          <div className="mb-4 flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 px-4 py-3">
            <HugeiconsIcon
              icon={AlertCircleIcon}
              className="h-4 w-4 shrink-0 text-red-600"
            />
            <p className="text-sm text-red-700">
              Sync failed: {syncLatest.error.message}
            </p>
          </div>
        )}

        {/* Data loading error */}
        {error && (
          <div className="mb-4 flex items-center gap-2 rounded-lg border border-[#e1e5f2] bg-white px-4 py-3">
            <HugeiconsIcon
              icon={AlertCircleIcon}
              className="h-4 w-4 shrink-0 text-[#022b3a]/60"
            />
            <p className="text-sm text-[#022b3a]/70">
              Couldn&apos;t load your calendar. Try refreshing, or reconnect
              Google if the problem continues.
            </p>
          </div>
        )}

        {/* Needs sync prompt */}
        {!isLoading && needsSync && (
          <div className="mb-6 flex items-center justify-between rounded-xl border border-dashed border-[#e1e5f2] bg-white p-4">
            <p className="text-sm text-[#022b3a]/60">
              No events cached yet. Sync to pull your upcoming events from
              Google Calendar.
            </p>
            <button
              onClick={handleSync}
              disabled={syncLatest.isPending}
              className="ml-4 flex shrink-0 items-center gap-1.5 rounded-lg bg-[#022b3a] px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-[#1f7a8c] disabled:opacity-50"
            >
              {syncLatest.isPending ? "Syncing…" : "Sync now"}
            </button>
          </div>
        )}

        {/* Loading skeleton */}
        {isLoading && (
          <div className="space-y-6">
            {/* Stats skeleton */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {[0, 1, 2, 3].map((i) => (
                <div
                  key={i}
                  className="h-20 animate-pulse rounded-xl border border-[#e1e5f2] bg-white"
                />
              ))}
            </div>
            {/* Content skeleton */}
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
              <div className="space-y-3">
                {[0, 1, 2].map((i) => (
                  <div
                    key={i}
                    className="h-14 animate-pulse rounded-xl border border-[#e1e5f2] bg-white"
                  />
                ))}
              </div>
              <div className="space-y-3">
                {[0, 1, 2, 3].map((i) => (
                  <div
                    key={i}
                    className="h-20 animate-pulse rounded-xl border border-[#e1e5f2] bg-white"
                  />
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Main content (shown when not loading) */}
        {!isLoading && (
          <>
            {/* Stats Row */}
            <div className="mb-6">
              <StatsRow
                todayCount={stats.todayCount}
                weekCount={stats.weekCount}
                hoursBlocked={stats.hoursBlocked}
                nextMeeting={stats.nextMeeting}
              />
            </div>

            {/* Two-column layout */}
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
              {/* Left column: Today's Agenda */}
              <div>
                <h2 className="mb-3 text-sm font-bold uppercase tracking-wider text-[#022b3a]/50">
                  Today&apos;s Agenda
                </h2>
                <TodaysAgenda events={todayEvents} />
              </div>

              {/* Right column: Upcoming Panel */}
              <div>
                <h2 className="mb-3 text-sm font-bold uppercase tracking-wider text-[#022b3a]/50">
                  Upcoming Events
                </h2>
                <UpcomingPanel
                  groups={upcomingGroups}
                  onSaveNote={handleSaveNote}
                  // pass savingEventId so UpcomingPanel computes per-card loading
                  savingEventId={savingEventId}
                  saveError={saveErrorMessage ?? null}
                  failedEventId={failedEventId}
                />
              </div>
            </div>
          </>
        )}
      </div>

      {/* ChatInput pinned at the bottom */}
      <div className="shrink-0 bg-white">
        <ChatInput />
      </div>

      {/* Create Meeting Modal */}
      <CreateMeetingModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleCreateMeeting}
        isPending={createEvent.isPending}
        error={createEvent.error?.message ?? null}
      />
    </>
  );
}
