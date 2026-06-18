"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";

// --- Types ---

export interface AISidebarState {
  isOpen: boolean;
  isRailMode: boolean;
  width: number; // 320–520, default 380
  activePanel: "thread" | "settings" | "history";
}

/**
 * Ephemeral prefill request used to seed the InputBar from elsewhere in the app
 * (e.g. clicking Reply/Forward on a thread). Each call bumps the nonce so the
 * InputBar re-applies the value even if the text matches a previous prefill.
 */
export interface PrefillRequest {
  text: string;
  nonce: number;
}

export interface AISidebarContextValue {
  state: AISidebarState;
  prefillRequest: PrefillRequest | null;
  open: () => void;
  close: () => void;
  toggle: () => void;
  collapse: () => void;
  expand: () => void;
  setWidth: (width: number) => void;
  setActivePanel: (panel: AISidebarState["activePanel"]) => void;
  sendPrefill: (text: string) => void;
}

// --- Constants ---

const STORAGE_KEY = "clerio-sidebar-state";
const MIN_WIDTH = 320;
const MAX_WIDTH = 520;
const DEFAULT_WIDTH = 380;

const DEFAULT_STATE: AISidebarState = {
  isOpen: false,
  isRailMode: false,
  width: DEFAULT_WIDTH,
  activePanel: "thread",
};

// --- Utility ---

/**
 * Clamps a width value to the valid sidebar range [320, 520].
 */
export function clampWidth(w: number): number {
  return Math.max(MIN_WIDTH, Math.min(MAX_WIDTH, w));
}

// --- Context ---

const AISidebarContext = createContext<AISidebarContextValue | null>(null);

// --- Provider ---

function readStateFromStorage(): AISidebarState {
  if (typeof window === "undefined") return DEFAULT_STATE;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_STATE;
    const parsed = JSON.parse(raw) as Partial<AISidebarState>;
    return {
      isOpen:
        typeof parsed.isOpen === "boolean" ? parsed.isOpen : DEFAULT_STATE.isOpen,
      isRailMode:
        typeof parsed.isRailMode === "boolean"
          ? parsed.isRailMode
          : DEFAULT_STATE.isRailMode,
      width:
        typeof parsed.width === "number"
          ? clampWidth(parsed.width)
          : DEFAULT_STATE.width,
      activePanel:
        parsed.activePanel === "thread" ||
        parsed.activePanel === "settings" ||
        parsed.activePanel === "history"
          ? parsed.activePanel
          : DEFAULT_STATE.activePanel,
    };
  } catch {
    return DEFAULT_STATE;
  }
}

function writeStateToStorage(state: AISidebarState): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // Storage full or unavailable — silently ignore
  }
}

export function AISidebarProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<AISidebarState>(DEFAULT_STATE);
  const [prefillRequest, setPrefillRequest] = useState<PrefillRequest | null>(null);
  const isHydrated = useRef(false);

  // Hydrate from localStorage on mount
  useEffect(() => {
    const stored = readStateFromStorage();
    setState(stored);
    isHydrated.current = true;
  }, []);

  // Persist to localStorage on every state change (after hydration)
  useEffect(() => {
    if (isHydrated.current) {
      writeStateToStorage(state);
    }
  }, [state]);

  const open = useCallback(() => {
    setState((prev) => ({ ...prev, isOpen: true, isRailMode: false }));
  }, []);

  const close = useCallback(() => {
    setState((prev) => ({ ...prev, isOpen: false }));
  }, []);

  const toggle = useCallback(() => {
    setState((prev) => {
      if (prev.isOpen) {
        // Closing
        return { ...prev, isOpen: false };
      }
      // Opening — if was in rail mode, restore full panel
      return { ...prev, isOpen: true, isRailMode: false };
    });
  }, []);

  // Keyboard shortcut: Cmd/Ctrl + Period toggles sidebar
  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if ((event.metaKey || event.ctrlKey) && event.key === ".") {
        event.preventDefault();
        toggle();
      }
    }
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [toggle]);

  const collapse = useCallback(() => {
    setState((prev) => ({ ...prev, isRailMode: true }));
  }, []);

  const expand = useCallback(() => {
    setState((prev) => ({ ...prev, isRailMode: false }));
  }, []);

  const setWidth = useCallback((width: number) => {
    setState((prev) => ({ ...prev, width: clampWidth(width) }));
  }, []);

  const setActivePanel = useCallback(
    (panel: AISidebarState["activePanel"]) => {
      setState((prev) => ({ ...prev, activePanel: panel }));
    },
    [],
  );

  // Open the sidebar (in chat panel) and seed the InputBar with prefill text.
  // Bumps a nonce each call so repeated prefills with the same text still apply.
  const sendPrefill = useCallback((text: string) => {
    setState((prev) => ({
      ...prev,
      isOpen: true,
      isRailMode: false,
      activePanel: "thread",
    }));
    setPrefillRequest({ text, nonce: Date.now() });
  }, []);

  const value: AISidebarContextValue = {
    state,
    prefillRequest,
    open,
    close,
    toggle,
    collapse,
    expand,
    setWidth,
    setActivePanel,
    sendPrefill,
  };

  return (
    <AISidebarContext.Provider value={value}>
      {children}
    </AISidebarContext.Provider>
  );
}

// --- Hook ---

export function useAISidebar(): AISidebarContextValue {
  const context = useContext(AISidebarContext);
  if (!context) {
    throw new Error("useAISidebar must be used within an AISidebarProvider");
  }
  return context;
}
