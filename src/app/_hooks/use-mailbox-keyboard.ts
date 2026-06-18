"use client";

import { useCallback, useEffect, useState } from "react";

/**
 * Returns true if the current event target is an editable element where we
 * should NOT intercept single-letter shortcuts (input, textarea, select,
 * contentEditable).
 */
function isEditableTarget(target: EventTarget | null): boolean {
  if (!target || !(target instanceof HTMLElement)) return false;
  const tag = target.tagName;
  if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return true;
  if (target.isContentEditable) return true;
  return false;
}

export interface UseMailboxKeyboardArgs {
  /** Total number of focusable items in the list. */
  itemCount: number;
  /** Called when the user activates the focused item (Enter or `o`). */
  onOpen: (index: number) => void;
  /** Called when the user presses `e` on the focused item. */
  onArchive: (index: number) => void;
  /** Called when the user presses `#` on the focused item. */
  onTrash: (index: number) => void;
  /** Called when the user presses `r` on the focused item. */
  onReply: (index: number) => void;
  /** When false, all listeners are detached. Defaults to true. */
  enabled?: boolean;
}

export interface UseMailboxKeyboardReturn {
  focusedIndex: number;
  setFocusedIndex: (index: number) => void;
}

/**
 * Wires up Superhuman-style list keyboard shortcuts:
 *
 * - `j` move focus down
 * - `k` move focus up
 * - `Enter` or `o` open the focused item
 * - `e` archive the focused item
 * - `#` (Shift+3) trash the focused item
 * - `r` reply to the focused item (delegated)
 *
 * Single-letter shortcuts are suppressed while the user is typing in any
 * input/textarea/contentEditable, and while modifier keys (cmd/ctrl/alt)
 * are held — so we never clobber browser shortcuts.
 */
export function useMailboxKeyboard({
  itemCount,
  onOpen,
  onArchive,
  onTrash,
  onReply,
  enabled = true,
}: UseMailboxKeyboardArgs): UseMailboxKeyboardReturn {
  const [focusedIndex, setFocusedIndex] = useState<number>(0);

  // Keep focusedIndex valid as items change
  useEffect(() => {
    if (itemCount === 0) {
      setFocusedIndex(0);
      return;
    }
    if (focusedIndex >= itemCount) {
      setFocusedIndex(Math.max(0, itemCount - 1));
    }
  }, [itemCount, focusedIndex]);

  const moveDown = useCallback(() => {
    setFocusedIndex((i) => Math.min(itemCount - 1, i + 1));
  }, [itemCount]);

  const moveUp = useCallback(() => {
    setFocusedIndex((i) => Math.max(0, i - 1));
  }, []);

  useEffect(() => {
    if (!enabled) return;

    function handleKeyDown(event: KeyboardEvent) {
      if (event.metaKey || event.ctrlKey || event.altKey) return;
      if (isEditableTarget(event.target)) return;
      if (itemCount === 0) return;

      switch (event.key) {
        case "j":
        case "ArrowDown":
          event.preventDefault();
          moveDown();
          break;
        case "k":
        case "ArrowUp":
          event.preventDefault();
          moveUp();
          break;
        case "Enter":
        case "o":
          event.preventDefault();
          onOpen(focusedIndex);
          break;
        case "e":
          event.preventDefault();
          onArchive(focusedIndex);
          break;
        case "#":
          event.preventDefault();
          onTrash(focusedIndex);
          break;
        case "r":
          event.preventDefault();
          onReply(focusedIndex);
          break;
        default:
          break;
      }
    }

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [enabled, itemCount, focusedIndex, moveDown, moveUp, onOpen, onArchive, onTrash, onReply]);

  return { focusedIndex, setFocusedIndex };
}
