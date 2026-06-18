// src/app/_components/sidebar.tsx
"use client";

import { HugeiconsIcon } from "@hugeicons/react";
import { AlertCircleIcon, Calendar01Icon, InboxIcon, Loading02Icon, MoonIcon, SentIcon, Settings01Icon, StarIcon, Tag01Icon } from "@hugeicons/core-free-icons";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { api } from "@/trpc/react";
import { useAISidebar } from "@/app/_components/ai-sidebar/provider";

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
    <aside className="flex h-screen w-64 flex-col border-r border-[#e1e5f2] bg-[#fcfcfc] px-4 py-6 antialiased">
      

      {/* CTA Button */}
      <button
        onClick={toggle}
        aria-label="Toggle AI Assistant"
        className="mb-8 flex items-center justify-center gap-2 rounded-xl bg-[#022b3a] px-4 py-3 font-medium text-white hover:bg-[#1f7a8c] hover:shadow-[0_2px_8px_rgba(2,43,58,0.12)] active:scale-[0.96] transition-[transform,background-color,box-shadow]"
      >
        <Image src="/clerio_logo_no_bg_white.svg" alt="" width={16} height={16} className="h-4 w-4" />
        Ask Clerio
      </button>

      {/* Gmail  */}
      <nav className="flex flex-1 flex-col gap-1 overflow-y-auto pr-2">
        {navItems.map((item) => {
          const isActive = pathname === item.path;
          return (
            <Link
              key={item.name}
              href={item.path}
              className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-[color,background-color] ${
                isActive 
                  ? "bg-[#bfdbf7]/30 text-[#1f7a8c]" 
                  : "text-[#022b3a]/70 hover:bg-[#e1e5f2]/50 hover:text-[#022b3a]"
              }`}
            >
              <HugeiconsIcon icon={item.icon} className={`h-4 w-4 ${isActive ? "stroke-[2.5]" : "stroke-2"}`} />
              {item.name}
            </Link>
          );
        })}

        <div className="my-4 h-px w-full bg-[#e1e5f2]" />

        {/* Fetched Labels */}
        <div className="px-3 mb-2 flex items-center justify-between">
          <span className="text-xs font-bold uppercase tracking-wider text-[#022b3a]/50">Labels</span>
          {isLoadingLabels && <HugeiconsIcon icon={Loading02Icon} className="h-3 w-3 animate-spin text-[#022b3a]/40" />}
        </div>
        
        {customLabels?.map((label) => (
          <Link
            key={label.id}
            href={`/labels/${label.id}`}
            className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-[color,background-color] text-[#022b3a]/70 hover:bg-[#e1e5f2]/50 hover:text-[#022b3a]"
          >
            <HugeiconsIcon icon={Tag01Icon} className="h-4 w-4 stroke-2" />
            <span className="truncate">{label.name}</span>
          </Link>
        ))}

        <div className="my-4 h-px w-full bg-[#e1e5f2]" />

        {/* Calendar */}
        <Link
          href="/u/calendar"
          className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-[color,background-color] ${
            pathname.includes("/u/calendar")
              ? "bg-[#bfdbf7]/30 text-[#1f7a8c]" 
              : "text-[#022b3a]/70 hover:bg-[#e1e5f2]/50 hover:text-[#022b3a]"
          }`}
        >
          <HugeiconsIcon icon={Calendar01Icon} className={`h-4 w-4 ${pathname.includes("/u/calendar") ? "stroke-[2.5]" : "stroke-2"}`} />
          Calendar
        </Link>
      </nav>

      {/* Bottom Actions */}
      <div className="mt-auto flex items-center justify-between pt-4 border-t border-[#e1e5f2]">
        <button className="rounded-lg p-2.5 text-[#022b3a]/60 hover:bg-[#e1e5f2]/50 hover:text-[#022b3a] transition-[color,background-color]">
          <HugeiconsIcon icon={Settings01Icon} className="h-5 w-5" />
        </button>
        <button className="rounded-lg p-2.5 text-[#022b3a]/60 hover:bg-[#e1e5f2]/50 hover:text-[#022b3a] transition-[color,background-color]">
          <HugeiconsIcon icon={MoonIcon} className="h-5 w-5" />
        </button>
      </div>
    </aside>
  );
}