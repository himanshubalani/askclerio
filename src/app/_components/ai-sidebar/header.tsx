"use client";

import { HugeiconsIcon } from "@hugeicons/react";
import {
  SparklesIcon,
  Clock01Icon,
  Settings01Icon,
  SidebarRight01Icon,
} from "@hugeicons/core-free-icons";
import { useAISidebar } from "./provider";

export function SidebarHeader() {
  const { state, collapse, setActivePanel } = useAISidebar();
  const { activePanel } = state;

  function handleHistoryClick() {
    setActivePanel(activePanel === "history" ? "thread" : "history");
  }

  function handleSettingsClick() {
    setActivePanel(activePanel === "settings" ? "thread" : "settings");
  }

  function handleCollapseClick() {
    collapse();
  }

  return (
    <header className="sticky top-0 z-10 flex items-center justify-between border-b border-[#e1e5f2] bg-white px-4 py-3">
      {/* Left: branding */}
      <div className="flex items-center gap-2">
        <HugeiconsIcon
          icon={SparklesIcon}
          className="h-4 w-4 text-[#022b3a]"
        />
        <span className="text-[15px] font-semibold text-[#022b3a]">
          Ask Clerio
        </span>
      </div>

      {/* Right: action buttons */}
      <div className="flex items-center gap-1">
        <button
          onClick={handleHistoryClick}
          aria-label="Conversation history"
          className={`rounded-lg p-2 transition-colors hover:bg-[#e1e5f2]/50 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#022b3a]/40 focus-visible:ring-offset-1 ${
            activePanel === "history"
              ? "bg-[#bfdbf7]/30 text-[#1f7a8c]"
              : "text-[#022b3a]/60"
          }`}
        >
          <HugeiconsIcon icon={Clock01Icon} className="h-4 w-4" />
        </button>

        <button
          onClick={handleSettingsClick}
          aria-label="Tool settings"
          className={`rounded-lg p-2 transition-colors hover:bg-[#e1e5f2]/50 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#022b3a]/40 focus-visible:ring-offset-1 ${
            activePanel === "settings"
              ? "bg-[#bfdbf7]/30 text-[#1f7a8c]"
              : "text-[#022b3a]/60"
          }`}
        >
          <HugeiconsIcon icon={Settings01Icon} className="h-4 w-4" />
        </button>

        <button
          onClick={handleCollapseClick}
          aria-label="Collapse sidebar"
          className="rounded-lg p-2 text-[#022b3a]/60 transition-colors hover:bg-[#e1e5f2]/50 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#022b3a]/40 focus-visible:ring-offset-1"
        >
          <HugeiconsIcon icon={SidebarRight01Icon} className="h-4 w-4" />
        </button>
      </div>
    </header>
  );
}
