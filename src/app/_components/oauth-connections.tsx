"use client";

import { useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { api } from "@/trpc/react";
import { HugeiconsIcon } from "@hugeicons/react";
import { Mail01Icon, Calendar01Icon } from "@hugeicons/core-free-icons";

export function GoogleOAuthConnection() {
  const searchParams = useSearchParams();
  const justConnected = searchParams.get("connected");

  const statusQuery = api.auth.checkConnections.useQuery();

  // Refresh status after a successful OAuth redirect
  useEffect(() => {
    if (justConnected) {
      void statusQuery.refetch();
    }
  }, [justConnected, statusQuery]);

  const gmailConnected = statusQuery.data?.gmail ?? false;
  const calendarConnected = statusQuery.data?.calendar ?? false;
  const isLoading = statusQuery.isLoading;

  return (
    <div className="flex flex-col gap-3 w-full">
      {/* Gmail Connection */}
      <div className="flex items-center justify-between p-4 border border-[#e1e5f2] rounded-xl bg-white shadow-sm">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-[#bfdbf7]/30 text-[#1f7a8c]">
             <HugeiconsIcon icon={Mail01Icon} className="h-5 w-5 stroke-2" />
          </div>
          <div className="text-left">
            <h3 className="font-semibold text-[#022b3a] text-sm">Gmail</h3>
            <p className="text-xs text-[#022b3a]/60">
              Read and manage emails
            </p>
          </div>
        </div>

        {isLoading ? (
          <div className="h-9 w-24 rounded-lg bg-[#e1e5f2] animate-pulse" />
        ) : gmailConnected ? (
          <span className="px-3 py-1.5 rounded-md bg-green-50 text-green-700 text-xs font-medium border border-green-200">
            Connected
          </span>
        ) : (
          <a
            href="/api/connect?plugin=gmail"
            className="px-4 py-2 rounded-lg bg-[#022b3a] text-white text-sm font-medium hover:bg-[#1f7a8c] transition-colors"
          >
            Connect
          </a>
        )}
      </div>

      {/* Calendar Connection */}
      <div className="flex items-center justify-between p-4 border border-[#e1e5f2] rounded-xl bg-white shadow-sm">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-[#bfdbf7]/30 text-[#1f7a8c]">
             <HugeiconsIcon icon={Calendar01Icon} className="h-5 w-5 stroke-2" />
          </div>
          <div className="text-left">
            <h3 className="font-semibold text-[#022b3a] text-sm">Google Calendar</h3>
            <p className="text-xs text-[#022b3a]/60">
              Manage your schedule
            </p>
          </div>
        </div>

        {isLoading ? (
          <div className="h-9 w-24 rounded-lg bg-[#e1e5f2] animate-pulse" />
        ) : calendarConnected ? (
          <span className="px-3 py-1.5 rounded-md bg-green-50 text-green-700 text-xs font-medium border border-green-200">
            Connected
          </span>
        ) : (
          <a
            href="/api/connect?plugin=googlecalendar"
            className="px-4 py-2 rounded-lg bg-[#022b3a] text-white text-sm font-medium hover:bg-[#1f7a8c] transition-colors"
          >
            Connect
          </a>
        )}
      </div>
    </div>
  );
}