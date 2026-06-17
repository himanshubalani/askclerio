"use client";

import { HugeiconsIcon } from "@hugeicons/react";
import {
  Calendar01Icon,
  Calendar03Icon,
  Clock01Icon,
  UserGroupIcon,
} from "@hugeicons/core-free-icons";
import type { StatsRowProps } from "../_lib/dashboard-utils";

function formatNextMeetingTime(startTime: string): string {
  const date = new Date(startTime);
  return date.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
  });
}

export function StatsRow({
  todayCount,
  weekCount,
  hoursBlocked,
  nextMeeting,
}: StatsRowProps) {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {/* Today's Events */}
      <div className="flex items-center gap-3 rounded-xl border border-[#e1e5f2] bg-[#fcfcfc] p-4">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-[#1f7a8c]/10">
          <HugeiconsIcon
            icon={Calendar01Icon}
            className="h-5 w-5 text-[#1f7a8c]"
          />
        </div>
        <div>
          <p className="text-2xl font-semibold tabular-nums text-[#022b3a]">
            {todayCount}
          </p>
          <p className="text-xs text-[#022b3a]/60">Today&apos;s Events</p>
        </div>
      </div>

      {/* This Week */}
      <div className="flex items-center gap-3 rounded-xl border border-[#e1e5f2] bg-[#fcfcfc] p-4">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-[#1f7a8c]/10">
          <HugeiconsIcon
            icon={Calendar03Icon}
            className="h-5 w-5 text-[#1f7a8c]"
          />
        </div>
        <div>
          <p className="text-2xl font-semibold tabular-nums text-[#022b3a]">
            {weekCount}
          </p>
          <p className="text-xs text-[#022b3a]/60">This Week</p>
        </div>
      </div>

      {/* Hours Blocked */}
      <div className="flex items-center gap-3 rounded-xl border border-[#e1e5f2] bg-[#fcfcfc] p-4">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-[#1f7a8c]/10">
          <HugeiconsIcon
            icon={Clock01Icon}
            className="h-5 w-5 text-[#1f7a8c]"
          />
        </div>
        <div>
          <p className="text-2xl font-semibold tabular-nums text-[#022b3a]">
            {hoursBlocked.toFixed(1)}
          </p>
          <p className="text-xs text-[#022b3a]/60">Hours Blocked</p>
        </div>
      </div>

      {/* Next Meeting */}
      <div className="flex items-center gap-3 rounded-xl border border-[#e1e5f2] bg-[#fcfcfc] p-4">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-[#1f7a8c]/10">
          <HugeiconsIcon
            icon={UserGroupIcon}
            className="h-5 w-5 text-[#1f7a8c]"
          />
        </div>
        <div className="min-w-0">
          {nextMeeting ? (
            <>
              <p className="truncate text-sm font-medium text-[#022b3a]">
                {nextMeeting.title}
              </p>
              <p className="text-xs tabular-nums text-[#022b3a]/60">
                {formatNextMeetingTime(nextMeeting.startTime)}
              </p>
            </>
          ) : (
            <p className="text-sm text-[#022b3a]/60">No upcoming meetings</p>
          )}
        </div>
      </div>
    </div>
  );
}
