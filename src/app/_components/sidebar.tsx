"use client";

import { HugeiconsIcon } from "@hugeicons/react";
import { AlertCircleIcon, Calendar01Icon, InboxIcon, Loading02Icon, SentIcon, StarIcon, Tag01Icon } from "@hugeicons/core-free-icons";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { api } from "@/trpc/react";
import { useAISidebar } from "@/app/_components/ai-sidebar/provider";
import { UserButton } from "@clerk/nextjs";

export function Sidebar() {
  const pathname = usePathname();
  const { toggle } = useAISidebar();
  
  const { data: labels, isLoading: isLoadingLabels } = api.gmail.getLabels.useQuery();

  const customLabels = labels?.filter(
    (label) => label.type === "user" && label.name !== "UNREAD" && label.name !== "IMPORTANT"
  );

  const navItems = [
    { name: "Inbox", icon: InboxIcon, path: "/u" },
    { name: "Sent", icon: SentIcon, path: "/u/sent" },
    { name: "Important", icon: StarIcon, path: "/u/important" },
    { name: "Spam", icon: AlertCircleIcon, path: "/u/spam" },
  ];

  return (
    <aside className="flex w-[260px] flex-col border-r border-[#e8ecf4] bg-gradient-to-b from-[#fafbfd] to-[#f5f7fa] px-3 py-5 antialiased">
      {/* Logo */}
<a href="/" className="mb-5 flex items-center gap-2.5 px-3"> 
  <Image src="/clerio_header_light_mode.svg" alt="AskClerio" width={90} height={20} className="h-8 w-auto opacity-90" /> 
</a>

      {/* Ask Clerio CTA */}
      <button
        onClick={toggle}
        aria-label="Toggle AI Assistant"
        className="group mx-2 mb-6 flex items-center justify-center gap-2.5 rounded-xl bg-gradient-to-r from-[#022b3a] to-[#0a3d4f] px-4 py-2.5 text-[13px] font-semibold text-white shadow-[0_2px_8px_rgba(2,43,58,0.15)] transition-all duration-200 hover:shadow-[0_4px_16px_rgba(2,43,58,0.25)] hover:scale-[1.02] active:scale-[0.97]"
      >
        <Image src="/clerio_logo_no_bg_white.svg" alt="" width={16} height={16} className="h-4 w-4 transition-transform duration-200 group-hover:rotate-12" />
        Ask Clerio
        <kbd className="ml-auto rounded bg-white/15 px-1.5 py-1 font-mono text-[10px] align-items-center font-medium text-white/70">⌘ .</kbd>
      </button>

      {/* Navigation */}
      <nav className="flex flex-1 flex-col gap-0.5 overflow-y-auto px-1">
        <span className="mb-1.5 px-3 text-[10px] font-semibold uppercase tracking-widest text-[#022b3a]/40">Mail</span>
        {navItems.map((item) => {
          const isActive = pathname === item.path;
          return (
            <Link
              key={item.name}
              href={item.path}
              className={`group flex items-center gap-3 rounded-lg px-3 py-2 text-[13px] font-medium transition-all duration-150 ${
                isActive 
                  ? "bg-[#1f7a8c]/10 text-[#1f7a8c] shadow-[inset_0_0_0_1px_rgba(31,122,140,0.1)]" 
                  : "text-[#022b3a]/65 hover:bg-[#022b3a]/[0.04] hover:text-[#022b3a]"
              }`}
            >
              <HugeiconsIcon icon={item.icon} className={`h-[18px] w-[18px] transition-transform duration-150 group-hover:scale-110 ${isActive ? "stroke-[2.5]" : "stroke-[1.8]"}`} />
              {item.name}
            </Link>
          );
        })}

        {/* Divider */}
        <div className="my-3 mx-3 h-px bg-[#022b3a]/[0.06]" />

        {/* Labels */}
        <div className="mb-1.5 flex items-center justify-between px-3">
          <span className="text-[10px] font-semibold uppercase tracking-widest text-[#022b3a]/40">Labels</span>
          {isLoadingLabels && <HugeiconsIcon icon={Loading02Icon} className="h-3 w-3 animate-spin text-[#022b3a]/30" />}
        </div>
        
        {customLabels?.map((label) => (
          <Link
            key={label.id}
            href={`/u/label/${label.id}`}
            className="group flex items-center gap-3 rounded-lg px-3 py-2 text-[13px] font-medium text-[#022b3a]/65 transition-all duration-150 hover:bg-[#022b3a]/[0.04] hover:text-[#022b3a]"
          >
            <HugeiconsIcon icon={Tag01Icon} className="h-[18px] w-[18px] stroke-[1.8] transition-transform duration-150 group-hover:scale-110" />
            <span className="truncate">{label.name}</span>
          </Link>
        ))}

        {/* Divider */}
        <div className="my-3 mx-3 h-px bg-[#022b3a]/[0.06]" />

        {/* Calendar */}
        <span className="mb-1.5 px-3 text-[10px] font-semibold uppercase tracking-widest text-[#022b3a]/40">Tools</span>
        <Link
          href="/u/calendar"
          className={`group flex items-center gap-3 rounded-lg px-3 py-2 text-[13px] font-medium transition-all duration-150 ${
            pathname.includes("/u/calendar")
              ? "bg-[#1f7a8c]/10 text-[#1f7a8c] shadow-[inset_0_0_0_1px_rgba(31,122,140,0.1)]" 
              : "text-[#022b3a]/65 hover:bg-[#022b3a]/[0.04] hover:text-[#022b3a]"
          }`}
        >
          <HugeiconsIcon icon={Calendar01Icon} className={`h-[18px] w-[18px] transition-transform duration-150 group-hover:scale-110 ${pathname.includes("/u/calendar") ? "stroke-[2.5]" : "stroke-[1.8]"}`} />
          Calendar
        </Link>
      </nav>

      {/* Bottom */}
      <div className="mt-auto flex flex-col gap-2 border-t border-[#022b3a]/[0.06] pt-3 px-1">
        <button
          type="button"
          onClick={() => {
            document.dispatchEvent(
              new KeyboardEvent("keydown", { key: "/", ctrlKey: true, metaKey: true, bubbles: true }),
            );
          }}
          aria-label="Show keyboard shortcuts"
          className="flex w-full items-center justify-between rounded-lg px-3 py-1.5 text-[12px] text-[#022b3a]/50 hover:bg-[#022b3a]/[0.04] hover:text-[#022b3a]/70 transition-colors"
        >
          <span>Shortcuts</span>
          <span className="flex items-center gap-0.5">
            <kbd className="rounded border border-[#022b3a]/10 bg-white px-1.5 py-0.5 font-mono text-[10px] font-medium shadow-[0_1px_2px_rgba(0,0,0,0.04)]">⌘</kbd>
            <kbd className="rounded border border-[#022b3a]/10 bg-white px-1.5 py-0.5 font-mono text-[10px] font-medium shadow-[0_1px_2px_rgba(0,0,0,0.04)]">/</kbd>
          </span>
        </button>

        <div className="flex items-center px-2">
          <UserButton showName appearance={{ elements: { userButtonBox: "flex-row" } }} />
        </div>
      </div>
    </aside>
  );
}
