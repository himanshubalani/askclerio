"use client";

import { HugeiconsIcon } from "@hugeicons/react";
import { Loading02Icon } from "@hugeicons/core-free-icons";

interface RefreshButtonProps {
  onClick: () => void;
  isSyncing: boolean;
}

export function RefreshButton({ onClick, isSyncing }: RefreshButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={isSyncing}
      className="flex items-center gap-1.5 rounded-md border border-[#e1e5f2] px-3 py-1 text-sm font-medium text-[#022b3a] hover:bg-white transition-[background-color] disabled:opacity-50"
    >
      {isSyncing && (
        <HugeiconsIcon
          icon={Loading02Icon}
          className="h-3 w-3 animate-spin"
        />
      )}
      {isSyncing ? "Syncing…" : "Sync"}
    </button>
  );
}
