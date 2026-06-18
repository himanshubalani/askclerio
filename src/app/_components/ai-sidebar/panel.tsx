"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { HugeiconsIcon } from "@hugeicons/react";
import { SidebarLeft01Icon } from "@hugeicons/core-free-icons";
import { useAISidebar } from "./provider";
import { SidebarHeader } from "./header";
import { ChatContainer } from "./chat-container";

// --- Constants ---

const FOCUSABLE_SELECTOR =
  'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])';

// --- Hooks ---

function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState(false);

  useEffect(() => {
    const mql = window.matchMedia(query);
    setMatches(mql.matches);

    function handleChange(e: MediaQueryListEvent) {
      setMatches(e.matches);
    }

    mql.addEventListener("change", handleChange);
    return () => mql.removeEventListener("change", handleChange);
  }, [query]);

  return matches;
}

function usePrefersReducedMotion(): boolean {
  return useMediaQuery("(prefers-reduced-motion: reduce)");
}

// --- Component ---

export function AISidebarPanel() {
  const { state, close, expand, setWidth } = useAISidebar();
  const { isOpen, isRailMode, width } = state;

  const isOverlay = useMediaQuery("(max-width: 959px)");
  const prefersReducedMotion = usePrefersReducedMotion();
  const isResizing = useRef(false);
  const panelRef = useRef<HTMLElement>(null);
  const triggerRef = useRef<Element | null>(null);

  // --- Resize handling ---

  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      isResizing.current = true;

      const startX = e.clientX;
      const startWidth = width;

      function handleMouseMove(moveEvent: MouseEvent) {
        if (!isResizing.current) return;
        // Dragging left edge: moving left increases width, moving right decreases
        const delta = startX - moveEvent.clientX;
        const newWidth = startWidth + delta;
        setWidth(newWidth); // clampWidth is applied inside setWidth
      }

      function handleMouseUp() {
        isResizing.current = false;
        document.removeEventListener("mousemove", handleMouseMove);
        document.removeEventListener("mouseup", handleMouseUp);
        document.body.style.cursor = "";
        document.body.style.userSelect = "";
      }

      document.body.style.cursor = "col-resize";
      document.body.style.userSelect = "none";
      document.addEventListener("mousemove", handleMouseMove);
      document.addEventListener("mouseup", handleMouseUp);
    },
    [width, setWidth],
  );

  // --- Focus management for overlay mode ---

  useEffect(() => {
    if (!isOverlay) return;

    if (isOpen) {
      // Store the element that triggered the open so we can restore focus later
      triggerRef.current = document.activeElement;

      // Auto-focus first focusable element inside the panel after render
      const frameId = requestAnimationFrame(() => {
        const panel = panelRef.current;
        if (!panel) return;
        const firstFocusable = panel.querySelector<HTMLElement>(FOCUSABLE_SELECTOR);
        if (firstFocusable) {
          firstFocusable.focus();
        } else {
          // Fallback: focus the panel itself (it needs tabindex for this)
          panel.focus();
        }
      });

      return () => cancelAnimationFrame(frameId);
    } else {
      // Panel just closed — return focus to the trigger element
      const trigger = triggerRef.current;
      if (trigger && trigger instanceof HTMLElement) {
        trigger.focus();
      }
      triggerRef.current = null;
    }
  }, [isOpen, isOverlay]);

  // --- Focus trap in overlay mode ---

  useEffect(() => {
    if (!isOpen || !isOverlay) return;

    function handleFocusTrap(e: KeyboardEvent) {
      if (e.key !== "Tab") return;

      const panel = panelRef.current;
      if (!panel) return;

      const focusableElements = Array.from(
        panel.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR),
      ).filter((el) => !el.hasAttribute("disabled") && el.offsetParent !== null);

      if (focusableElements.length === 0) return;

      const firstFocusable = focusableElements[0]!;
      const lastFocusable = focusableElements[focusableElements.length - 1]!;

      if (e.shiftKey) {
        // Shift+Tab: if focus is on the first element, wrap to last
        if (document.activeElement === firstFocusable) {
          e.preventDefault();
          lastFocusable.focus();
        }
      } else {
        // Tab: if focus is on the last element, wrap to first
        if (document.activeElement === lastFocusable) {
          e.preventDefault();
          firstFocusable.focus();
        }
      }
    }

    document.addEventListener("keydown", handleFocusTrap);
    return () => document.removeEventListener("keydown", handleFocusTrap);
  }, [isOpen, isOverlay]);

  // --- Escape key to close (returns focus via the effect above) ---

  useEffect(() => {
    if (!isOpen) return;

    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") {
        close();
      }
    }

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, close]);

  // --- Render ---

  // Rail Mode: collapsed to 48px with only the expand icon
  if (isOpen && isRailMode) {
    // In overlay mode, the rail renders inline (not fixed) since it's narrow enough
    return (
      <aside
        role="complementary"
        aria-label="AI Assistant"
        className="relative flex flex-col items-center justify-center overflow-hidden border-l border-[#e1e5f2] bg-white"
        style={{ width: "48px", minWidth: "48px" }}
      >
        <button
          onClick={expand}
          aria-label="Expand AI Assistant"
          className="flex h-10 w-10 items-center justify-center rounded-lg text-[#022b3a]/60 hover:bg-[#bfdbf7]/30 hover:text-[#022b3a] transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[#022b3a]/40"
        >
          <HugeiconsIcon icon={SidebarLeft01Icon} className="h-5 w-5" />
        </button>
      </aside>
    );
  }

  // When closed: render with width 0 and hidden overflow for smooth transition
  const panelWidth = isOpen ? width : 0;

  // Common panel content
  const panelContent = (
    <>
      {/* Resize handle — left edge */}
      <div
        onMouseDown={handleMouseDown}
        className="absolute left-0 top-0 bottom-0 w-1.5 cursor-col-resize hover:bg-[#bfdbf7]/40 transition-colors z-10"
        aria-hidden="true"
      />

      {/* Sidebar Header with branding + action buttons */}
      <SidebarHeader />

      {/* Chat Container: ThreadView + ToolCallCards + InputBar + StatusFooter */}
      <ChatContainer />
    </>
  );

  // Overlay mode (viewport < 960px)
  if (isOverlay) {
    return (
      <>
        {/* Backdrop scrim */}
        {isOpen && (
          <div
            className="fixed inset-0 bg-black/40 z-40 transition-opacity duration-250 ease-out motion-reduce:transition-none"
            onClick={close}
            aria-hidden="true"
          />
        )}

        {/* Fixed panel */}
        <aside
          ref={panelRef}
          role="complementary"
          aria-label="AI Assistant"
          className="fixed top-0 right-0 bottom-0 z-50 flex flex-col overflow-hidden border-l border-[#e1e5f2] bg-white"
          style={{
            width: isOpen ? `${width}px` : "0px",
            transition: prefersReducedMotion ? "none" : "width 250ms ease-out",
          }}
        >
          {isOpen && panelContent}
        </aside>
      </>
    );
  }

  // Inline mode (viewport >= 960px)
  return (
    <aside
      ref={panelRef}
      role="complementary"
      aria-label="AI Assistant"
      className="relative flex flex-col overflow-hidden border-l border-[#e1e5f2] bg-white h-full"
      style={{
        width: `${panelWidth}px`,
        minWidth: isOpen ? `${width}px` : "0px",
        transition: isResizing.current || prefersReducedMotion
          ? "none"
          : "width 250ms ease-out, min-width 250ms ease-out",
      }}
    >
      {isOpen && panelContent}
    </aside>
  );
}
