// src/app/_components/mailbox-view.tsx
"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { HugeiconsIcon } from "@hugeicons/react";
import { Loading02Icon, Mail01Icon, Search01Icon } from "@hugeicons/core-free-icons";
import { GoogleOAuthConnection } from "@/app/_components/oauth-connections";
import { useAISidebar } from "@/app/_components/ai-sidebar/provider";
import { useMailboxKeyboard } from "@/app/_hooks/use-mailbox-keyboard";
import { api } from "@/trpc/react";
import Link from "next/link";
import { useRouter } from "next/navigation";

function formatEmailTime(dateStr: string) {
  if (!dateStr) return "";
  const date = new Date(dateStr);
  const isToday = new Date().toDateString() === date.toDateString();
  if (isToday) return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  return date.toLocaleDateString([], { month: "short", day: "numeric" });
}

export function MailboxView({ title, labelId }: { title: string; labelId: string }) {
  const { data, isLoading, isFetching, refetch } = api.gmail.getDashboardData.useQuery({ labelId });
  const { data: allLabels } = api.gmail.getLabels.useQuery();
  const utils = api.useUtils();
  const router = useRouter();
  const { sendPrefill } = useAISidebar();

  const [searchQuery, setSearchQuery] = useState("");
  const rowRefs = useRef<Array<HTMLAnchorElement | null>>([]);

  const syncMutation = api.gmail.syncLatest.useMutation({
    onSuccess: async () => {
      await utils.gmail.getDashboardData.invalidate();
      await refetch();
    },
    onError: (error) => {
      console.error(`Failed to sync latest emails for ${labelId}:`, error);
    },
  });

  const archiveMut = api.gmail.archiveThread.useMutation({
    onSuccess: async () => {
      await utils.gmail.getDashboardData.invalidate();
    },
  });

  const trashMut = api.gmail.trashThread.useMutation({
    onSuccess: async () => {
      await utils.gmail.getDashboardData.invalidate();
    },
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

  // --- Keyboard shortcuts (Superhuman-style) ---

  const handleOpen = useCallback(
    (index: number) => {
      const thread = filteredThreads[index];
      if (thread) router.push(`/thread/${thread.id}`);
    },
    [filteredThreads, router],
  );

  const handleArchive = useCallback(
    (index: number) => {
      const thread = filteredThreads[index];
      if (thread) archiveMut.mutate({ threadId: thread.id });
    },
    [filteredThreads, archiveMut],
  );

  const handleTrash = useCallback(
    (index: number) => {
      const thread = filteredThreads[index];
      if (thread) trashMut.mutate({ threadId: thread.id });
    },
    [filteredThreads, trashMut],
  );

  const handleReply = useCallback(
    (index: number) => {
      const thread = filteredThreads[index];
      if (!thread) return;
      sendPrefill(
        `Draft a reply to the latest message in the email thread "${thread.subject}" (thread id: ${thread.id}) from ${thread.sender}. The reply should say: `,
      );
    },
    [filteredThreads, sendPrefill],
  );

  const { focusedIndex, setFocusedIndex } = useMailboxKeyboard({
    itemCount: filteredThreads.length,
    onOpen: handleOpen,
    onArchive: handleArchive,
    onTrash: handleTrash,
    onReply: handleReply,
    enabled: !data?.needsAuth,
  });

  // Auto-scroll focused row into view as the user navigates with j/k
  useEffect(() => {
    const row = rowRefs.current[focusedIndex];
    if (row) {
      row.scrollIntoView({ block: "nearest", behavior: "smooth" });
    }
  }, [focusedIndex]);

  // Dynamically resolve the real label name if it's a custom user label (e.g. "Label_78349...")
  const displayTitle = allLabels?.find((l) => l.id === labelId)?.name || title;

  if (data?.needsAuth) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center bg-[#fcfcfc] antialiased">
        <div className="flex max-w-lg flex-col items-center text-center p-8 rounded-3xl bg-white border border-[#e1e5f2] shadow-[0_4px_24px_rgba(2,43,58,0.04)]">
          <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-[#bfdbf7]/30 text-[#1f7a8c]">
            <HugeiconsIcon icon={Mail01Icon} className="h-8 w-8 stroke-2" />
          </div>
          <h2 className="mb-2 text-xl font-bold text-[#022b3a] text-balance">Connect your Workspace</h2>
          <p className="mb-8 text-sm text-[#022b3a]/60 text-pretty">
            Clerio needs access to your Gmail and Google Calendar to power your command center.
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
      <div className="flex-1 max-w-320 overflow-y-auto px-8 py-8 antialiased">
        <header className="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold text-[#022b3a] text-balance">{displayTitle}</h1>
            <p className="text-sm text-[#022b3a]/60 text-pretty mt-1 tabular-nums">
              {isLoading ? "Loading..." : `${data?.threads?.length || 0} recent threads`}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <div className="relative flex items-center mr-2">
              <HugeiconsIcon icon={Search01Icon} className="absolute left-3 h-4 w-4 text-[#022b3a]/40" />
              <input
                type="text"
                placeholder="Search emails..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="h-9 w-full md:w-64 rounded-md border border-[#e1e5f2] bg-white pl-9 pr-3 text-sm text-[#022b3a] placeholder:text-[#022b3a]/40 focus:border-[#1f7a8c] focus:outline-none focus:ring-1 focus:ring-[#1f7a8c] transition-[border-color,box-shadow] shadow-sm"
              />
            </div>
            <button
              onClick={() => syncMutation.mutate({ labelId })}
              disabled={syncMutation.isPending || isFetching}
              className="flex items-center gap-2 rounded-md border border-[#e1e5f2] bg-white px-3 py-1.5 text-sm font-medium text-[#022b3a] hover:bg-[#fcfcfc] transition-[background-color] shadow-sm disabled:opacity-50 h-9"
            >
              {syncMutation.isPending && <HugeiconsIcon icon={Loading02Icon} className="h-3 w-3 animate-spin" />}
              {syncMutation.isPending ? "Syncing..." : "Sync"}
            </button>
            <button
              onClick={() => refetch()}
              disabled={isFetching || syncMutation.isPending}
              className="flex items-center gap-2 rounded-md border border-[#e1e5f2] bg-white px-3 py-1.5 text-sm font-medium text-[#022b3a] hover:bg-[#fcfcfc] transition-[background-color] shadow-sm disabled:opacity-50 h-9"
            >
              {isFetching && <HugeiconsIcon icon={Loading02Icon} className="h-3 w-3 animate-spin" />}
              {isFetching ? "Refreshing..." : "Refresh"}
            </button>
          </div>
        </header>

        {isLoading ? (
          <div className="flex justify-center py-12">
            <HugeiconsIcon icon={Loading02Icon} className="h-8 w-8 animate-spin text-[#1f7a8c]" />
          </div>
        ) : (
          <div className="flex flex-col gap-6">
            <div className="flex flex-col gap-2">
              {filteredThreads.map((thread, i) => {
                const isUnread = thread.labels.includes("UNREAD");
                const isFocused = i === focusedIndex;

                return (
                  <Link
                    href={`/thread/${thread.id}`}
                    key={thread.id}
                    ref={(el) => {
                      rowRefs.current[i] = el;
                    }}
                    onMouseEnter={() => setFocusedIndex(i)}
                    onClick={() => setFocusedIndex(i)}
                    className={`flex items-center gap-4 rounded-xl border p-4 transition-[border-color,box-shadow] hover:border-[#bfdbf7] hover:shadow-[0_2px_8px_rgba(2,43,58,0.04)] animate-in fade-in slide-in-from-bottom-4 fill-mode-backwards
                      ${isUnread ? "bg-white border-[#e1e5f2]" : "bg-[#fcfcfc]/50 border-transparent"}
                      ${isFocused ? "ring-2 ring-[#1f7a8c] ring-offset-1 ring-offset-white border-[#1f7a8c]" : ""}
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
            </div>

            {data?.threads && data.threads.length === 0 && (
              <div className="text-center py-12 text-[#022b3a]/50">
                No emails found in the local cache. Please hit Sync to pull from Gmail.
              </div>
            )}

            {data?.threads && data.threads.length > 0 && filteredThreads.length === 0 && (
              <div className="text-center py-12 text-[#022b3a]/50">
                No emails match your search &ldquo;{searchQuery}&rdquo;.
              </div>
            )}

            {/* Keyboard shortcut hint */}
            {filteredThreads.length > 0 && (
              <div className="mt-2 text-center text-xs text-[#022b3a]/40">
                <kbd className="rounded border border-[#e1e5f2] bg-white px-1.5 py-0.5 font-mono">j</kbd>
                <span className="mx-1">/</span>
                <kbd className="rounded border border-[#e1e5f2] bg-white px-1.5 py-0.5 font-mono">k</kbd>
                <span className="mx-1">to navigate ·</span>
                <kbd className="rounded border border-[#e1e5f2] bg-white px-1.5 py-0.5 font-mono">Enter</kbd>
                <span className="mx-1">to open ·</span>
                <kbd className="rounded border border-[#e1e5f2] bg-white px-1.5 py-0.5 font-mono">e</kbd>
                <span className="mx-1">archive ·</span>
                <kbd className="rounded border border-[#e1e5f2] bg-white px-1.5 py-0.5 font-mono">r</kbd>
                <span className="mx-1">reply ·</span>
                <kbd className="rounded border border-[#e1e5f2] bg-white px-1.5 py-0.5 font-mono">?</kbd>
                <span className="ml-1">help</span>
              </div>
            )}
          </div>
        )}
      </div>
    </>
  );
}
