"use client";

import { useState, useMemo } from "react";
import { HugeiconsIcon } from "@hugeicons/react";
import { Loading02Icon, Mail01Icon, MailOpen01Icon, Search01Icon } from "@hugeicons/core-free-icons";
import { GoogleOAuthConnection } from "@/app/_components/oauth-connections";
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
  const { data, isLoading, isFetching, refetch } = api.gmail.getDashboardData.useQuery();
  const utils = api.useUtils();
  
  const [searchQuery, setSearchQuery] = useState("");
  
  const syncMutation = api.gmail.syncLatest.useMutation({
    onSuccess: async () => {
      await utils.gmail.getDashboardData.invalidate();
      await refetch();
    },
    onError: (error) => {
      console.error("Failed to sync latest emails:", error);
    },
  });

  const markAsRead = api.gmail.markRead.useMutation({
    onSuccess: () => utils.gmail.getDashboardData.invalidate(),
  });
  const markAsUnread = api.gmail.markUnread.useMutation({
    onSuccess: () => utils.gmail.getDashboardData.invalidate(),
  });

  const filteredThreads = useMemo(() => {
    if (!data?.threads) return [];
    if (!searchQuery.trim()) return data.threads;
    const lowerQuery = searchQuery.toLowerCase();
    return data.threads.filter((t) =>
      t.subject?.toLowerCase().includes(lowerQuery) ||
      t.sender?.toLowerCase().includes(lowerQuery) ||
      t.snippet?.toLowerCase().includes(lowerQuery)
    );
  }, [data?.threads, searchQuery]);

  if (data?.needsAuth) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center bg-gradient-to-br from-[#fafbfd] to-[#f0f4f8] antialiased">
        <div className="flex max-w-md flex-col items-center text-center p-10 rounded-2xl bg-white border border-[#e8ecf4] shadow-[0_8px_32px_rgba(2,43,58,0.06)]">
          <div className="mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-[#bfdbf7]/40 to-[#1f7a8c]/10 text-[#1f7a8c]">
            <HugeiconsIcon icon={Mail01Icon} className="h-7 w-7 stroke-[1.8]" />
          </div>
          <h2 className="mb-2 text-lg font-bold text-[#022b3a]">Connect your Workspace</h2>
          <p className="mb-7 text-sm leading-relaxed text-[#022b3a]/55">
            Clerio needs access to your Gmail and Google Calendar to power your command center.
          </p>
          <div className="w-full">
            <GoogleOAuthConnection />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto bg-gradient-to-br from-[#fafbfd] to-[#f5f7fa]">
      <div className="mx-auto max-w-7xl px-6 py-8 md:px-10">
        {/* Header */}
        <header className="mb-6 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <h1 className="text-[22px] font-bold tracking-tight text-[#022b3a]">Inbox</h1>
            <p className="mt-0.5 text-[13px] tabular-nums text-[#022b3a]/50">
              {isLoading ? "Loading..." : `${data?.threads?.length ?? 0} threads`}
            </p>
          </div>
          <div className="flex items-center gap-2">
            {/* Search */}
            <div className="relative">
              <HugeiconsIcon icon={Search01Icon} className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-[#022b3a]/35" />
              <input
                type="text"
                placeholder="Search..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="h-8 w-48 rounded-lg border border-[#e8ecf4] bg-white pl-8 pr-3 text-[13px] text-[#022b3a] placeholder:text-[#022b3a]/35 shadow-sm transition-all focus:w-64 focus:border-[#1f7a8c]/40 focus:outline-none focus:ring-2 focus:ring-[#1f7a8c]/10"
              />
            </div>
            <button 
              onClick={() => syncMutation.mutate()}
              disabled={syncMutation.isPending || isFetching}
              className="flex h-8 items-center gap-1.5 rounded-lg border border-[#e8ecf4] bg-white px-3 text-[13px] font-medium text-[#022b3a]/70 shadow-sm transition-all hover:border-[#1f7a8c]/30 hover:text-[#022b3a] disabled:opacity-50"
            >
              {syncMutation.isPending && <HugeiconsIcon icon={Loading02Icon} className="h-3 w-3 animate-spin" />}
              Sync
            </button>
            <button 
              onClick={() => refetch()}
              disabled={isFetching || syncMutation.isPending}
              className="flex h-8 items-center gap-1.5 rounded-lg border border-[#e8ecf4] bg-white px-3 text-[13px] font-medium text-[#022b3a]/70 shadow-sm transition-all hover:border-[#1f7a8c]/30 hover:text-[#022b3a] disabled:opacity-50"
            >
              {isFetching && <HugeiconsIcon icon={Loading02Icon} className="h-3 w-3 animate-spin" />}
              Refresh
            </button>
          </div>
        </header>

        {isLoading ? (
          <div className="flex justify-center py-20">
            <HugeiconsIcon icon={Loading02Icon} className="h-6 w-6 animate-spin text-[#1f7a8c]/60" />
          </div>
        ) : (
          <div className="space-y-5">
            {/* Labels */}
            {data?.labels && data.labels.length > 0 && !searchQuery && (
              <div className="flex flex-wrap items-center gap-1.5">
                {data.labels.map((label: { id: string; name: string }) => (
                  <span
                    key={label.id}
                    className={`rounded-md px-2 py-0.5 text-[11px] font-semibold ${
                      label.name === "IMPORTANT"
                        ? "bg-red-50 text-red-600"
                        : label.name === "STARRED"
                        ? "bg-amber-50 text-amber-600"
                        : label.name === "SENT"
                        ? "bg-sky-50 text-sky-600"
                        : "bg-[#f0f4f8] text-[#022b3a]/60"
                    }`}
                  >
                    {label.name}
                  </span>
                ))}
              </div>
            )}

            {/* Thread List */}
            <div className="rounded-xl border border-[#e8ecf4] bg-white shadow-[0_1px_4px_rgba(2,43,58,0.03)] overflow-hidden">
              {filteredThreads.map((thread, i) => {
                const isUnread = thread.labels.includes("UNREAD");
                return (
                  <Link 
                    href={`/thread/${thread.id}`}
                    key={thread.id} 
                    className={`group flex items-center gap-4 border-b border-[#e8ecf4]/70 px-5 py-3.5 transition-colors last:border-b-0 hover:bg-[#f5f9fc] ${
                      isUnread ? "bg-white" : "bg-[#fafbfd]/60"
                    }`}
                  >
                    {/* Unread dot */}
                    <div className="w-2 shrink-0">
                      {isUnread && <div className="h-2 w-2 rounded-full bg-[#1f7a8c]" />}
                    </div>

                    {/* Sender */}
                    <div className={`w-40 shrink-0 truncate text-[13px] ${isUnread ? "font-semibold text-[#022b3a]" : "font-medium text-[#022b3a]/70"}`}>
                      {thread.sender}
                    </div>

                    {/* Subject + Snippet */}
                    <div className="flex-1 min-w-0 truncate text-[13px]">
                      <span className={isUnread ? "font-semibold text-[#022b3a]" : "font-medium text-[#022b3a]/80"}>
                        {thread.subject}
                      </span>
                      <span className="ml-2 text-[#022b3a]/40">
                        {thread.snippet}
                      </span>
                    </div>

                    {/* Note badge */}
                    {thread.note && (
                      <span className="hidden shrink-0 rounded-md bg-[#1f7a8c]/8 px-2 py-0.5 text-[11px] font-medium text-[#1f7a8c] md:inline-block">
                        Note
                      </span>
                    )}

                    {/* Read/Unread toggle */}
                    <button
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        if (isUnread) {
                          markAsRead.mutate({ threadId: thread.id });
                        } else {
                          markAsUnread.mutate({ threadId: thread.id });
                        }
                      }}
                      disabled={markAsRead.isPending || markAsUnread.isPending}
                      title={isUnread ? "Mark as read" : "Mark as unread"}
                      className="shrink-0 rounded-md p-1.5 text-[#022b3a]/30 opacity-0 transition-all group-hover:opacity-100 hover:bg-[#1f7a8c]/10 hover:text-[#1f7a8c] disabled:opacity-30"
                    >
                      <HugeiconsIcon icon={isUnread ? MailOpen01Icon : Mail01Icon} className="h-3.5 w-3.5 stroke-2" />
                    </button>

                    {/* Time */}
                    <div className={`w-14 shrink-0 text-right text-[12px] tabular-nums ${isUnread ? "font-semibold text-[#022b3a]/70" : "text-[#022b3a]/40"}`}>
                      {formatEmailTime(thread.date)}
                    </div>
                  </Link>
                );
              })}

              {data?.threads?.length === 0 && (
                <div className="py-16 text-center text-sm text-[#022b3a]/40">
                  No emails in cache. Hit <strong>Sync</strong> to pull from Gmail.
                </div>
              )}
              
              {data?.threads && data.threads.length > 0 && filteredThreads.length === 0 && (
                <div className="py-16 text-center text-sm text-[#022b3a]/40">
                  No results for &ldquo;{searchQuery}&rdquo;
                </div>
              )}
            </div>

            {/* Keyboard hint */}
            {filteredThreads.length > 0 && (
              <p className="text-center text-[11px] text-[#022b3a]/35">
                <kbd className="rounded border border-[#e8ecf4] bg-white px-1 py-0.5 font-mono text-[10px] shadow-sm">j</kbd>
                {" / "}
                <kbd className="rounded border border-[#e8ecf4] bg-white px-1 py-0.5 font-mono text-[10px] shadow-sm">k</kbd>
                {" navigate · "}
                <kbd className="rounded border border-[#e8ecf4] bg-white px-1 py-0.5 font-mono text-[10px] shadow-sm">Enter</kbd>
                {" open · "}
                <kbd className="rounded border border-[#e8ecf4] bg-white px-1 py-0.5 font-mono text-[10px] shadow-sm">⌘.</kbd>
                {" Clerio"}
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
