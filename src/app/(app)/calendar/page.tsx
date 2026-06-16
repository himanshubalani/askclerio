"use client";

import { useMemo, useState } from "react";
import { ChatInput } from "@/app/_components/chat-input";
import { api } from "@/trpc/react";

function startOfMonthGrid(year: number, month: number) {
  const firstOfMonth = new Date(year, month, 1);
  const startWeekday = firstOfMonth.getDay(); // 0 = Sunday
  const gridStart = new Date(year, month, 1 - startWeekday);
  return gridStart;
}

function isSameDay(a: Date, b: Date) {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

export default function CalendarDashboard() {
  const now = useMemo(() => new Date(), []);
  const [monthOffset, setMonthOffset] = useState(0);

  const viewDate = useMemo(() => {
    const d = new Date(now.getFullYear(), now.getMonth() + monthOffset, 1);
    return d;
  }, [now, monthOffset]);

  const monthLabel = viewDate.toLocaleDateString("en-US", {
    month: "long",
    year: "numeric",
  });

  const { data, isLoading, error, refetch } = api.calendar.getDashboardData.useQuery();
  const syncLatest = api.calendar.syncLatest.useMutation({
    onSuccess: () => refetch(),
  });
  const saveNote = api.calendar.saveNote.useMutation({
    onSuccess: () => refetch(),
  });

  const [editingId, setEditingId] = useState<string | null>(null);
  const [draftNote, setDraftNote] = useState("");

  const events = data?.events ?? [];

  const gridDays = useMemo(() => {
    const gridStart = startOfMonthGrid(viewDate.getFullYear(), viewDate.getMonth());
    return Array.from({ length: 35 }, (_, i) => {
      const d = new Date(gridStart);
      d.setDate(gridStart.getDate() + i);
      return d;
    });
  }, [viewDate]);

  const eventsByDay = useMemo(() => {
    const map = new Map<string, typeof events>();
    for (const ev of events) {
      if (!ev.start) continue;
      const key = new Date(ev.start).toDateString();
      const list = map.get(key) ?? [];
      list.push(ev);
      map.set(key, list);
    }
    return map;
  }, [events]);

  const upcoming = useMemo(() => {
    const today = new Date();
    return events
      .filter((e) => e.start && new Date(e.start) >= new Date(today.toDateString()))
      .sort((a, b) => new Date(a.start).getTime() - new Date(b.start).getTime())
      .slice(0, 12);
  }, [events]);

  function formatTimeRange(start: string, end: string) {
    if (!start) return "All day";
    const s = new Date(start);
    const e = end ? new Date(end) : null;
    const fmt = (d: Date) =>
      d.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
    return e ? `${fmt(s)} - ${fmt(e)}` : fmt(s);
  }

  return (
    <>
      <div className="flex-1 overflow-hidden flex antialiased">
        {/* Main Calendar View */}
        <div className="flex-1 overflow-y-auto px-8 py-8 border-r border-[#e1e5f2]">
          <header className="mb-8 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <button
                onClick={() => setMonthOffset((m) => m - 1)}
                className="rounded-md border border-[#e1e5f2] px-2 py-1 text-sm text-[#022b3a]/60 hover:text-[#022b3a] hover:bg-white transition-colors"
                aria-label="Previous month"
              >
                ←
              </button>
              <h1 className="text-2xl font-semibold text-[#022b3a] text-balance">
                {monthLabel}
              </h1>
              <button
                onClick={() => setMonthOffset((m) => m + 1)}
                className="rounded-md border border-[#e1e5f2] px-2 py-1 text-sm text-[#022b3a]/60 hover:text-[#022b3a] hover:bg-white transition-colors"
                aria-label="Next month"
              >
                →
              </button>
            </div>
            <div className="flex items-center gap-3">
              {data?.stats && (
                <span className="text-sm text-[#022b3a]/50 tabular-nums">
                  {data.stats.todayCount} today · {data.stats.hoursBlocked}h booked
                </span>
              )}
              <button
                onClick={() => syncLatest.mutate()}
                disabled={syncLatest.isPending}
                className="rounded-md border border-[#e1e5f2] px-3 py-1 text-sm font-medium text-[#022b3a] hover:bg-white transition-colors disabled:opacity-50"
              >
                {syncLatest.isPending ? "Syncing…" : "Refresh"}
              </button>
            </div>
          </header>

          {error && (
            <div className="mb-4 rounded-lg border border-[#e1e5f2] bg-white p-4 text-sm text-[#022b3a]/70">
              Couldn&apos;t load your calendar. Try refreshing, or reconnect Google if the
              problem continues.
            </div>
          )}

          {/* Weekday header */}
          <div className="grid grid-cols-7 gap-px mb-1">
            {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((d) => (
              <div
                key={d}
                className="text-center text-xs font-semibold uppercase tracking-wide text-[#022b3a]/40 pb-2"
              >
                {d}
              </div>
            ))}
          </div>

          {/* Month Grid */}
          <div className="grid grid-cols-7 gap-px bg-[#e1e5f2] border border-[#e1e5f2] rounded-2xl overflow-hidden">
            {gridDays.map((day, i) => {
              const inMonth = day.getMonth() === viewDate.getMonth();
              const isToday = isSameDay(day, now);
              const dayEvents = eventsByDay.get(day.toDateString()) ?? [];

              return (
                <div
                  key={i}
                  className={`min-h-[100px] p-2 flex flex-col gap-1 ${
                    inMonth ? "bg-white" : "bg-[#fcfcfc]"
                  }`}
                >
                  <span
                    className={`text-xs font-medium tabular-nums ${
                      isToday
                        ? "inline-flex h-5 w-5 items-center justify-center rounded-full bg-[#1f7a8c] text-white"
                        : inMonth
                          ? "text-[#022b3a]/40"
                          : "text-[#022b3a]/20"
                    }`}
                  >
                    {day.getDate()}
                  </span>
                  <div className="flex flex-col gap-1">
                    {dayEvents.slice(0, 3).map((ev) => (
                      <div
                        key={ev.id}
                        title={ev.summary}
                        className="truncate rounded bg-[#1f7a8c]/10 px-1.5 py-0.5 text-[11px] font-medium text-[#1f7a8c]"
                      >
                        {ev.summary}
                      </div>
                    ))}
                    {dayEvents.length > 3 && (
                      <span className="text-[10px] text-[#022b3a]/40">
                        +{dayEvents.length - 3} more
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Schedules Sidebar */}
        <div className="w-80 shrink-0 bg-[#fcfcfc] overflow-y-auto px-6 py-8">
          <h2 className="text-sm font-bold tracking-wider text-[#022b3a]/50 uppercase mb-4">
            Upcoming Events
          </h2>

          {isLoading && (
            <div className="flex flex-col gap-3">
              {[0, 1, 2].map((i) => (
                <div
                  key={i}
                  className="h-16 rounded-xl border border-[#e1e5f2] bg-white animate-pulse"
                />
              ))}
            </div>
          )}

          {!isLoading && upcoming.length === 0 && (
            <div className="rounded-xl border border-dashed border-[#e1e5f2] p-4 text-sm text-[#022b3a]/50">
              No upcoming events. Connect Google Calendar or hit Refresh to pull in your
              schedule.
            </div>
          )}

          <div className="flex flex-col gap-3">
            {upcoming.map((ev) => (
              <div
                key={ev.id}
                className="rounded-xl border border-[#e1e5f2] p-3 bg-white shadow-sm border-l-4 border-l-[#1f7a8c]"
              >
                <div className="text-xs font-semibold text-[#1f7a8c] mb-1 tabular-nums">
                  {formatTimeRange(ev.start, ev.end)}
                </div>
                <div className="font-medium text-[#022b3a] text-pretty">{ev.summary}</div>

                {editingId === ev.id ? (
                  <div className="mt-2 flex flex-col gap-2">
                    <textarea
                      value={draftNote}
                      onChange={(e) => setDraftNote(e.target.value)}
                      rows={2}
                      className="w-full rounded-md border border-[#e1e5f2] p-2 text-sm text-[#022b3a] focus:outline-none focus:ring-1 focus:ring-[#1f7a8c]"
                      placeholder="Add a note for this event…"
                    />
                    <div className="flex gap-2">
                      <button
                        onClick={() => {
                          saveNote.mutate({ eventId: ev.id, note: draftNote });
                          setEditingId(null);
                        }}
                        disabled={saveNote.isPending}
                        className="rounded-md bg-[#1f7a8c] px-2 py-1 text-xs font-medium text-white disabled:opacity-50"
                      >
                        Save
                      </button>
                      <button
                        onClick={() => setEditingId(null)}
                        className="rounded-md border border-[#e1e5f2] px-2 py-1 text-xs font-medium text-[#022b3a]/60"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <button
                    onClick={() => {
                      setEditingId(ev.id);
                      setDraftNote(ev.note ?? "");
                    }}
                    className="mt-2 text-xs text-[#022b3a]/50 hover:text-[#1f7a8c] transition-colors"
                  >
                    {ev.note ? `Note: ${ev.note}` : "+ Add note"}
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="shrink-0 bg-white">
        <ChatInput />
      </div>
    </>
  );
}