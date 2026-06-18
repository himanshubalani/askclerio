"use client";

import { useEffect, useState } from "react";
import { HugeiconsIcon } from "@hugeicons/react";
import { Cancel01Icon, CommandIcon } from "@hugeicons/core-free-icons";

interface Shortcut {
  keys: string[];
  description: string;
}

const MAILBOX_SHORTCUTS: Shortcut[] = [
  { keys: ["j"], description: "Next thread" },
  { keys: ["k"], description: "Previous thread" },
  { keys: ["Enter"], description: "Open thread" },
  { keys: ["o"], description: "Open thread" },
  { keys: ["e"], description: "Archive thread" },
  { keys: ["#"], description: "Trash thread" },
  { keys: ["r"], description: "Reply with Clerio" },
];

const THREAD_SHORTCUTS: Shortcut[] = [
  { keys: ["e"], description: "Archive" },
  { keys: ["#"], description: "Trash" },
  { keys: ["r"], description: "Reply with Clerio" },
  { keys: ["f"], description: "Forward with Clerio" },
  { keys: ["u"], description: "Back to inbox" },
  { keys: ["Esc"], description: "Back to inbox" },
];

const GLOBAL_SHORTCUTS: Shortcut[] = [
  { keys: ["⌘", "."], description: "Toggle Clerio sidebar" },
  { keys: ["?"], description: "Show this help" },
  { keys: ["Esc"], description: "Close dialog / sidebar" },
];

function isEditableTarget(target: EventTarget | null): boolean {
  if (!target || !(target instanceof HTMLElement)) return false;
  const tag = target.tagName;
  if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return true;
  if (target.isContentEditable) return true;
  return false;
}

function Kbd({ children }: { children: React.ReactNode }) {
  return (
    <kbd className="inline-flex h-6 min-w-[24px] items-center justify-center rounded-md border border-[#e1e5f2] bg-[#fcfcfc] px-1.5 text-xs font-semibold text-[#022b3a] shadow-[0_1px_0_rgba(2,43,58,0.05)]">
      {children}
    </kbd>
  );
}

function ShortcutRow({ shortcut }: { shortcut: Shortcut }) {
  return (
    <div className="flex items-center justify-between py-1.5">
      <span className="text-sm text-[#022b3a]/70">{shortcut.description}</span>
      <span className="flex items-center gap-1">
        {shortcut.keys.map((key, i) => (
          <Kbd key={i}>{key}</Kbd>
        ))}
      </span>
    </div>
  );
}

/**
 * Global keyboard help overlay. Press `?` (Shift+/) anywhere outside of an
 * input to open. Press Esc or click the backdrop to close.
 */
export function KeyboardHelp() {
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.metaKey || event.ctrlKey || event.altKey) return;
      if (isEditableTarget(event.target)) return;

      if (event.key === "?") {
        event.preventDefault();
        setIsOpen((prev) => !prev);
        return;
      }

      if (event.key === "Escape" && isOpen) {
        event.preventDefault();
        setIsOpen(false);
      }
    }

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-label="Keyboard shortcuts"
      aria-modal="true"
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 backdrop-blur-sm animate-in fade-in"
      onClick={() => setIsOpen(false)}
    >
      <div
        className="w-full max-w-lg rounded-2xl border border-[#e1e5f2] bg-white shadow-[0_24px_64px_rgba(2,43,58,0.12)] animate-in zoom-in-95 fade-in"
        onClick={(e) => e.stopPropagation()}
      >
        <header className="flex items-center justify-between border-b border-[#e1e5f2] px-5 py-4">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#bfdbf7]/30 text-[#1f7a8c]">
              <HugeiconsIcon icon={CommandIcon} className="h-4 w-4 stroke-2" />
            </div>
            <h2 className="text-base font-semibold text-[#022b3a]">Keyboard shortcuts</h2>
          </div>
          <button
            type="button"
            onClick={() => setIsOpen(false)}
            aria-label="Close"
            className="rounded-md p-1.5 text-[#022b3a]/60 hover:bg-[#e1e5f2]/50 hover:text-[#022b3a] transition-colors"
          >
            <HugeiconsIcon icon={Cancel01Icon} className="h-4 w-4" />
          </button>
        </header>

        <div className="grid grid-cols-1 gap-6 p-5 sm:grid-cols-2">
          <section>
            <h3 className="mb-2 text-xs font-bold uppercase tracking-wider text-[#022b3a]/50">
              Mailbox
            </h3>
            <div className="divide-y divide-[#e1e5f2]/60">
              {MAILBOX_SHORTCUTS.map((s, i) => (
                <ShortcutRow key={i} shortcut={s} />
              ))}
            </div>
          </section>

          <section>
            <h3 className="mb-2 text-xs font-bold uppercase tracking-wider text-[#022b3a]/50">
              Thread
            </h3>
            <div className="divide-y divide-[#e1e5f2]/60">
              {THREAD_SHORTCUTS.map((s, i) => (
                <ShortcutRow key={i} shortcut={s} />
              ))}
            </div>
          </section>

          <section className="sm:col-span-2">
            <h3 className="mb-2 text-xs font-bold uppercase tracking-wider text-[#022b3a]/50">
              Global
            </h3>
            <div className="divide-y divide-[#e1e5f2]/60">
              {GLOBAL_SHORTCUTS.map((s, i) => (
                <ShortcutRow key={i} shortcut={s} />
              ))}
            </div>
          </section>
        </div>

        <footer className="rounded-b-2xl border-t border-[#e1e5f2] bg-[#fcfcfc]/50 px-5 py-3 text-xs text-[#022b3a]/50">
          Press <Kbd>?</Kbd> any time to open this dialog.
        </footer>
      </div>
    </div>
  );
}
