// ─── Interfaces ──────────────────────────────────────────────────────────────

export interface StatsRowProps {
  todayCount: number;
  weekCount: number;
  hoursBlocked: number;
  nextMeeting: { title: string; startTime: string } | null;
}

export interface AgendaItemData {
  id: string;
  summary: string;
  start: string;
  end: string;
  isAllDay: boolean;
}

export interface DayGroupData {
  date: Date;
  label: string;
  events: MeetingCardData[];
}

export interface MeetingCardData {
  id: string;
  summary: string;
  start: string;
  end: string;
  isAllDay: boolean;
  note: string | null;
}

export interface DashboardComputedData {
  stats: {
    todayCount: number;
    weekCount: number;
    hoursBlocked: number;
    nextMeeting: { title: string; startTime: string } | null;
  };
  todayEvents: AgendaItemData[];
  upcomingGroups: DayGroupData[];
}

// ─── Utility Functions ───────────────────────────────────────────────────────

/**
 * Detects all-day events by date-only string (YYYY-MM-DD) or midnight-to-midnight span.
 */
export function isAllDayEvent(start: string, end: string): boolean {
  // Date-only strings from Google Calendar (e.g., "2025-01-20")
  if (start.length === 10 && !start.includes("T")) return true;

  // Midnight-to-midnight check
  const s = new Date(start);
  const e = new Date(end);
  return (
    s.getHours() === 0 &&
    s.getMinutes() === 0 &&
    e.getHours() === 0 &&
    e.getMinutes() === 0 &&
    e.getTime() - s.getTime() >= 86_400_000
  );
}

/**
 * Truncates a title to maxLen characters with ellipsis ("…") when exceeded.
 */
export function truncateTitle(summary: string, maxLen: number): string {
  if (summary.length <= maxLen) return summary;
  return summary.slice(0, maxLen) + "…";
}

/**
 * Returns false for empty/whitespace-only strings, true otherwise.
 */
export function shouldSaveNote(noteText: string): boolean {
  return noteText.trim().length > 0;
}

/**
 * Finds the earliest future timed (non-all-day) event, or null if none exists.
 */
export function computeNextMeeting(
  events: Array<{ id: string; summary: string; start: string; end: string; note?: string | null }>,
  now: Date,
): { title: string; startTime: string } | null {
  const nowTime = now.getTime();

  let earliest: { title: string; startTime: string; time: number } | null = null;

  for (const ev of events) {
    if (!ev.start || !ev.end) continue;
    if (isAllDayEvent(ev.start, ev.end)) continue;

    const startTime = new Date(ev.start).getTime();
    if (startTime <= nowTime) continue;

    if (earliest === null || startTime < earliest.time) {
      earliest = {
        title: ev.summary || "Untitled Event",
        startTime: ev.start,
        time: startTime,
      };
    }
  }

  return earliest ? { title: earliest.title, startTime: earliest.startTime } : null;
}

/**
 * Computes stats: todayCount, weekCount, hoursBlocked, nextMeeting.
 */
export function computeStats(
  events: Array<{ id: string; summary: string; start: string; end: string; note?: string | null }>,
  now: Date,
): StatsRowProps {
  // Today boundaries (local timezone)
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
  const todayEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);

  // Week boundaries (Monday through Sunday)
  const dayOfWeek = now.getDay(); // 0=Sun, 1=Mon, ...
  const mondayOffset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
  const weekStart = new Date(now.getFullYear(), now.getMonth(), now.getDate() + mondayOffset, 0, 0, 0, 0);
  const weekEnd = new Date(weekStart.getFullYear(), weekStart.getMonth(), weekStart.getDate() + 6, 23, 59, 59, 999);

  let todayCount = 0;
  let weekCount = 0;
  let hoursBlocked = 0;

  for (const ev of events) {
    if (!ev.start) continue;

    // Parse event start date for comparison
    let eventStartDate: Date;
    if (ev.start.length === 10 && !ev.start.includes("T")) {
      // Date-only: parse as local date
      const [year, month, day] = ev.start.split("-").map(Number);
      eventStartDate = new Date(year!, month! - 1, day);
    } else {
      eventStartDate = new Date(ev.start);
    }

    const eventTime = eventStartDate.getTime();

    // Today count
    if (eventTime >= todayStart.getTime() && eventTime <= todayEnd.getTime()) {
      todayCount++;

      // Hours blocked: sum of durations for today's events
      if (ev.end) {
        let endDate: Date;
        if (ev.end.length === 10 && !ev.end.includes("T")) {
          const [year, month, day] = ev.end.split("-").map(Number);
          endDate = new Date(year!, month! - 1, day);
        } else {
          endDate = new Date(ev.end);
        }
        const durationMs = endDate.getTime() - eventStartDate.getTime();
        if (durationMs > 0) {
          hoursBlocked += durationMs / (1000 * 60 * 60);
        }
      }
    }

    // Week count
    if (eventTime >= weekStart.getTime() && eventTime <= weekEnd.getTime()) {
      weekCount++;
    }
  }

  // Round hours to 1 decimal place
  hoursBlocked = Math.round(hoursBlocked * 10) / 10;

  const nextMeeting = computeNextMeeting(events, now);

  return { todayCount, weekCount, hoursBlocked, nextMeeting };
}

/**
 * Sorts events for a single day: all-day first, then timed ascending by start.
 */
export function sortEventsForDay<T extends { start: string; end: string }>(events: T[]): T[] {
  return [...events].sort((a, b) => {
    const aAllDay = isAllDayEvent(a.start, a.end);
    const bAllDay = isAllDayEvent(b.start, b.end);

    // All-day events come first
    if (aAllDay && !bAllDay) return -1;
    if (!aAllDay && bAllDay) return 1;

    // Both all-day or both timed: sort by start time ascending
    if (!aAllDay && !bAllDay) {
      return new Date(a.start).getTime() - new Date(b.start).getTime();
    }

    return 0;
  });
}

/**
 * Filters events to the next 14 days starting from tomorrow (inclusive).
 */
export function filterUpcomingEvents(
  events: Array<{ id: string; summary: string; start: string; end: string; note?: string | null }>,
  today: Date,
): Array<{ id: string; summary: string; start: string; end: string; note?: string | null }> {
  const tomorrow = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1, 0, 0, 0, 0);
  const windowEnd = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 15, 0, 0, 0, 0);
  // windowEnd is exclusive: events must be < windowEnd (i.e., up to 14 days from tomorrow inclusive)

  return events.filter((ev) => {
    if (!ev.start) return false;

    let eventStartDate: Date;
    if (ev.start.length === 10 && !ev.start.includes("T")) {
      const [year, month, day] = ev.start.split("-").map(Number);
      eventStartDate = new Date(year!, month! - 1, day);
    } else {
      eventStartDate = new Date(ev.start);
    }

    const eventDay = new Date(eventStartDate.getFullYear(), eventStartDate.getMonth(), eventStartDate.getDate());
    return eventDay.getTime() >= tomorrow.getTime() && eventDay.getTime() < windowEnd.getTime();
  });
}

/**
 * Groups events by calendar date with formatted label.
 * Label format: "DayName, Month Day, Year" (e.g., "Monday, January 20, 2025").
 * Only includes groups that have at least one event.
 */
export function groupEventsByDay(
  events: Array<{ id: string; summary: string; start: string; end: string; note?: string | null }>,
): DayGroupData[] {
  const groupMap = new Map<string, { date: Date; events: MeetingCardData[] }>();

  for (const ev of events) {
    if (!ev.start) continue;

    let eventStartDate: Date;
    if (ev.start.length === 10 && !ev.start.includes("T")) {
      const [year, month, day] = ev.start.split("-").map(Number);
      eventStartDate = new Date(year!, month! - 1, day);
    } else {
      eventStartDate = new Date(ev.start);
    }

    const dayKey = `${eventStartDate.getFullYear()}-${String(eventStartDate.getMonth() + 1).padStart(2, "0")}-${String(eventStartDate.getDate()).padStart(2, "0")}`;

    if (!groupMap.has(dayKey)) {
      const midnight = new Date(eventStartDate.getFullYear(), eventStartDate.getMonth(), eventStartDate.getDate());
      groupMap.set(dayKey, { date: midnight, events: [] });
    }

    const meetingCard: MeetingCardData = {
      id: ev.id,
      summary: ev.summary || "Untitled Event",
      start: ev.start,
      end: ev.end,
      isAllDay: isAllDayEvent(ev.start, ev.end),
      note: ev.note ?? null,
    };

    groupMap.get(dayKey)!.events.push(meetingCard);
  }

  // Convert to sorted array of DayGroupData
  const groups: DayGroupData[] = [];
  groupMap.forEach((value) => {
    const label = value.date.toLocaleDateString("en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });

    groups.push({
      date: value.date,
      label,
      events: sortEventsForDay(value.events),
    });
  });

  // Sort groups by date ascending
  groups.sort((a, b) => a.date.getTime() - b.date.getTime());

  return groups;
}

/**
 * Expands multi-day events into per-day entries, clamped to the window boundaries.
 */
export function expandMultiDayEvent(
  event: MeetingCardData,
  windowStart: Date,
  windowEnd: Date,
): Array<{ date: Date; event: MeetingCardData }> {
  const start = new Date(event.start);
  const end = new Date(event.end);
  const results: Array<{ date: Date; event: MeetingCardData }> = [];

  const current = new Date(Math.max(start.getTime(), windowStart.getTime()));
  current.setHours(0, 0, 0, 0);

  const endDay = new Date(Math.min(end.getTime(), windowEnd.getTime()));
  endDay.setHours(0, 0, 0, 0);

  while (current <= endDay) {
    results.push({ date: new Date(current), event });
    current.setDate(current.getDate() + 1);
  }

  return results;
}

/**
 * Combines all utility functions to produce DashboardComputedData from raw events.
 */
export function computeDashboardData(
  events: Array<{ id: string; summary: string; start: string; end: string; note?: string | null }>,
): DashboardComputedData {
  const now = new Date();

  // Compute stats
  const stats = computeStats(events, now);

  // Today's events
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
  const todayEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);

  const todayEvents: AgendaItemData[] = sortEventsForDay(
    events
      .filter((ev) => {
        if (!ev.start) return false;
        let eventStartDate: Date;
        if (ev.start.length === 10 && !ev.start.includes("T")) {
          const [year, month, day] = ev.start.split("-").map(Number);
          eventStartDate = new Date(year!, month! - 1, day);
        } else {
          eventStartDate = new Date(ev.start);
        }
        const eventTime = eventStartDate.getTime();
        return eventTime >= todayStart.getTime() && eventTime <= todayEnd.getTime();
      })
      .map((ev) => ({
        id: ev.id,
        summary: ev.summary || "Untitled Event",
        start: ev.start,
        end: ev.end,
        isAllDay: isAllDayEvent(ev.start, ev.end),
      })),
  );

  // Upcoming events (next 14 days from tomorrow)
  const upcomingFiltered = filterUpcomingEvents(events, now);

  // Expand multi-day events
  const tomorrow = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1, 0, 0, 0, 0);
  const windowEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 14, 23, 59, 59, 999);

  const expandedEvents: Array<{ id: string; summary: string; start: string; end: string; note?: string | null }> = [];

  for (const ev of upcomingFiltered) {
    if (!ev.start || !ev.end) {
      expandedEvents.push(ev);
      continue;
    }

    let startDate: Date;
    let endDate: Date;
    if (ev.start.length === 10 && !ev.start.includes("T")) {
      const [y, m, d] = ev.start.split("-").map(Number);
      startDate = new Date(y!, m! - 1, d);
    } else {
      startDate = new Date(ev.start);
    }
    if (ev.end.length === 10 && !ev.end.includes("T")) {
      const [y, m, d] = ev.end.split("-").map(Number);
      endDate = new Date(y!, m! - 1, d);
    } else {
      endDate = new Date(ev.end);
    }

    const startDay = new Date(startDate.getFullYear(), startDate.getMonth(), startDate.getDate());
    const endDay = new Date(endDate.getFullYear(), endDate.getMonth(), endDate.getDate());

    // Check if it spans multiple days
    if (endDay.getTime() - startDay.getTime() > 86_400_000) {
      const card: MeetingCardData = {
        id: ev.id,
        summary: ev.summary || "Untitled Event",
        start: ev.start,
        end: ev.end,
        isAllDay: isAllDayEvent(ev.start, ev.end),
        note: ev.note ?? null,
      };
      const expanded = expandMultiDayEvent(card, tomorrow, windowEnd);
      for (const entry of expanded) {
        // Create a synthetic event reference for the group date
        expandedEvents.push({
          ...ev,
          start: entry.date.toISOString(),
        });
      }
    } else {
      expandedEvents.push(ev);
    }
  }

  // Group by day
  const upcomingGroups = groupEventsByDay(expandedEvents);

  return { stats, todayEvents, upcomingGroups };
}
