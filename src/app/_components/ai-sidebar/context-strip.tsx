"use client";

import { usePathname } from "next/navigation";

// --- Utility Functions (exported for property tests) ---

/**
 * Truncates a string to maxLen characters.
 * If str.length <= maxLen, returns str unchanged.
 * Otherwise returns str.slice(0, maxLen - 1) + '…' (ellipsis character).
 */
export function truncate(str: string, maxLen: number): string {
  if (str.length <= maxLen) return str;
  return str.slice(0, maxLen - 1) + "\u2026";
}

/**
 * Returns 1–2 quick-action chips based on the current route.
 * Returns empty array for unknown/unassociated routes.
 */
export function getQuickActions(pathname: string): { label: string }[] {
  if (pathname === "/u") {
    return [{ label: "Summarize unread" }, { label: "Draft a reply" }];
  }
  if (pathname === "/u/important") {
    return [{ label: "Review important items" }];
  }
  if (pathname === "/u/sent") {
    return [{ label: "Follow up on sent messages" }];
  }
  if (pathname === "/u/calendar") {
    return [{ label: "What\u2019s next on my calendar?" }, { label: "Schedule a meeting" }];
  }
  return [];
}

/**
 * Returns the human-friendly view name for a given pathname, or null if unknown.
 */
export function getViewName(pathname: string): string | null {
  if (pathname === "/u") return "Inbox";
  if (pathname === "/u/important") return "Important";
  if (pathname === "/u/sent") return "Sent";
  if (pathname === "/u/spam") return "Spam";
  if (pathname === "/u/calendar") return "Calendar";
  if (pathname.startsWith("/u/label/")) return "Label";
  return null;
}

// --- Props ---

interface ContextStripProps {
  onChipClick: (text: string) => void;
}

// --- Component ---

export function ContextStrip({ onChipClick }: ContextStripProps) {
  const pathname = usePathname();
  const viewName = getViewName(pathname);

  // Hide entirely when no associated view (Requirement 4.4)
  if (!viewName) return null;

  const quickActions = getQuickActions(pathname);
  const displayName = truncate(viewName, 30);

  return (
    <div className="flex flex-wrap items-center gap-2 px-3 py-2 border-b border-[#e1e5f2]/50">
      {/* View name pill */}
      <span className="bg-[#e1e5f2]/50 px-2.5 py-1 rounded-full text-xs font-medium text-[#022b3a]/70">
        {displayName}
      </span>

      {/* Quick-action chips */}
      {quickActions.map((action) => (
        <button
          key={action.label}
          type="button"
          onClick={() => onChipClick(action.label)}
          className="bg-[#bfdbf7]/20 hover:bg-[#bfdbf7]/40 px-3 py-1.5 rounded-full text-xs font-medium text-[#022b3a] cursor-pointer transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[#022b3a]/40 focus-visible:ring-offset-1"
        >
          {action.label}
        </button>
      ))}
    </div>
  );
}
