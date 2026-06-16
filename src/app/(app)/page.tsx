"use client";

import { HugeiconsIcon } from "@hugeicons/react";
import { Loading02Icon, Mail01Icon } from "@hugeicons/core-free-icons";
import { ChatInput } from "@/app/_components/chat-input";
import { api } from "@/trpc/react";
import Link from "next/link";

function formatEmailTime(dateStr: string) { 
  if (!dateStr) return "";
  const date = new Date(dateStr);
  const isToday = new Date().toDateString() === date.toDateString();
  if (isToday) return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
}

export default function GmailDashboard() {
  const utils = api.useUtils();
  const { data, isLoading, isFetching, refetch } = api.gmail.getDashboardData.useQuery();

  const syncAuth = api.auth.syncGoogleCredentials.useMutation({
    onSuccess: () => {
    	void utils.gmail.getDashboardData.invalidate();
		void utils.gmail.getLabels.invalidate();
		void utils.calendar.getDashboardData.invalidate();
    }
  });

  // 1. If not synced yet, show the Connect screen
  if (data?.needsAuth) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center bg-[#fcfcfc] antialiased">
        <div className="flex max-w-sm flex-col items-center text-center p-8 rounded-3xl bg-white border border-[#e1e5f2] shadow-[0_4px_24px_rgba(2,43,58,0.04)]">
          <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-[#bfdbf7]/30 text-[#1f7a8c]">
            <HugeiconsIcon icon={Mail01Icon} className="h-8 w-8 stroke-2" />
          </div>
          <h2 className="mb-2 text-xl font-bold text-[#022b3a] text-balance">Connect your Workspace</h2>
          <p className="mb-8 text-sm text-[#022b3a]/60 text-pretty">
            Clerio needs access to your Gmail and Google Calendar to power your command center.
          </p>
          <button 
            onClick={() => syncAuth.mutate()}
            disabled={syncAuth.isPending}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#022b3a] px-4 py-3 font-medium text-white transition-all hover:bg-[#1f7a8c] hover:shadow-sm active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none"
          >
            {syncAuth.isPending ? <Loader2 className="h-5 w-5 animate-spin" /> : null}
            {syncAuth.isPending ? "Syncing Credentials..." : "Sync Credentials"}
          </button>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="flex-1 max-w-320 overflow-y-auto px-8 py-8 antialiased">
        <header className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-[#022b3a] text-balance">Inbox</h1>
            <p className="text-sm text-[#022b3a]/60 text-pretty mt-1 tabular-nums">
              {isLoading ? "Loading..." : `${data?.threads?.length || 0} recent threads`}
            </p>
          </div>
          <button 
            onClick={() => refetch()}
            disabled={isFetching}
            className="flex items-center gap-2 rounded-md border border-[#e1e5f2] px-3 py-1.5 text-sm font-medium text-[#022b3a] hover:bg-[#fcfcfc] transition-colors shadow-sm disabled:opacity-50"
          >
            {isFetching && <HugeiconsIcon icon={Loading02Icon} className="h-3 w-3 animate-spin" />}
            {isFetching ? "Refreshing..." : "Refresh"}
          </button>
        </header>

        {isLoading ? (
          <div className="flex justify-center py-12">
            <HugeiconsIcon icon={Loading02Icon} className="h-8 w-8 animate-spin text-[#1f7a8c]" />
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            {data?.threads?.map((thread, i) => {
              const isUnread = thread.labels.includes("UNREAD");
              
              return (
                <Link 
                  href={`/thread/${thread.id}`}
                  key={thread.id} 
                  className={`flex items-center gap-4 rounded-xl border p-4 transition-all hover:border-[#bfdbf7] hover:shadow-[0_2px_8px_rgba(2,43,58,0.04)] animate-in fade-in slide-in-from-bottom-4 fill-mode-backwards
                    ${isUnread ? "bg-white border-[#e1e5f2]" : "bg-[#fcfcfc]/50 border-transparent"}
                  `}
                  style={{ animationDelay: `${Math.min(i * 30, 500)}ms` }}
                >
                  <div className={`w-48 shrink-0 truncate ${isUnread ? "font-bold text-[#022b3a]" : "font-medium text-[#022b3a]/80"}`}>
                    {thread.sender}
                  </div>
                  <div className="flex-1 truncate">
                    <span className={`${isUnread ? "font-bold text-[#022b3a]" : "font-semibold text-[#022b3a]/90"}`}>
                      {thread.subject}
                    </span>
                    <span className="ml-2 text-[#022b3a]/60 text-pretty text-sm">  
                      — {thread.snippet}  
                    </span> 
                  </div>
                  {thread.note && (
                    <span className="hidden md:inline-flex items-center rounded-full bg-[#bfdbf7]/30 px-2.5 py-0.5 text-xs font-medium text-[#1f7a8c]">
                      📝 Note attached
                    </span>
                  )}
                  <div className={`text-xs tabular-nums text-right w-16 ${isUnread ? "font-bold text-[#1f7a8c]" : "font-medium text-[#022b3a]/50"}`}>
                    {formatEmailTime(thread.date)}
                  </div>
                </Link>
              );
            })}

            {data?.threads?.length === 0 && (
              <div className="text-center py-12 text-[#022b3a]/50">
                No emails found in the local cache. Please sync your account or wait for webhooks.
              </div>
            )}
          </div>
        )}
      </div>

      <div className="shrink-0 bg-gradient-to-t from-white via-white to-transparent pt-4">
        <ChatInput />
      </div>
    </>
  );
}