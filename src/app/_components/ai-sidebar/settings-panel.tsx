"use client";

import { api } from "@/trpc/react";
import { useAISidebar } from "./provider";
import { getToolClassification, getToolMetadata } from "./use-tool-call-manager";

// --- Known MCP tools (static list for display) ---

const KNOWN_TOOLS = [
  { name: "run_script", description: "Execute scripts that interact with Gmail and Calendar APIs" },
  { name: "get_schema", description: "Read API schema definitions from the MCP server" },
  { name: "list_operations", description: "List available API operations" },
  { name: "corsair_setup", description: "Modify integration setup and configuration" },
];

// --- Skeleton loader ---

function SettingsSkeleton() {
  return (
    <div className="animate-pulse px-3 py-3 border-b border-[#e1e5f2]/50">
      <div className="flex items-center gap-2 mb-2">
        <div className="h-4 w-28 bg-[#e1e5f2]/50 rounded" />
        <div className="h-4 w-12 bg-[#e1e5f2]/30 rounded-full" />
      </div>
      <div className="h-3 w-full bg-[#e1e5f2]/30 rounded mb-2" />
      <div className="h-7 w-36 bg-[#e1e5f2]/40 rounded-md" />
    </div>
  );
}

// --- Lock icon SVG ---

function LockIcon() {
  return (
    <svg
      width="12"
      height="12"
      viewBox="0 0 16 16"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
      className="text-[#022b3a]/50"
    >
      <rect x="3" y="7" width="10" height="7" rx="1.5" stroke="currentColor" strokeWidth="1.5" />
      <path
        d="M5.5 7V5a2.5 2.5 0 015 0v2"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </svg>
  );
}

// --- Component ---

export function SettingsPanel() {
  const { setActivePanel } = useAISidebar();
  const utils = api.useUtils();

  // Load user's tool settings
  const { data: userSettings, isLoading } = api.chat.getToolSettings.useQuery();

  // Mutation with optimistic updates
  const updateSetting = api.chat.updateToolSetting.useMutation({
    onMutate: async ({ toolName, trustMode }) => {
      // Cancel outgoing refetches
      await utils.chat.getToolSettings.cancel();

      // Snapshot the previous value
      const previousSettings = utils.chat.getToolSettings.getData();

      // Optimistically update the cache
      utils.chat.getToolSettings.setData(undefined, (old) => {
        if (!old) return old;
        const existingIndex = old.findIndex((s) => s.toolName === toolName);
        if (existingIndex >= 0) {
          const updated = [...old];
          updated[existingIndex] = { ...updated[existingIndex]!, trustMode };
          return updated;
        }
        // Add new entry optimistically
        return [
          ...old,
          {
            id: `optimistic-${toolName}`,
            userId: "",
            toolName,
            trustMode,
            classification: getToolClassification(toolName),
            createdAt: new Date(),
            updatedAt: new Date(),
          },
        ];
      });

      return { previousSettings };
    },
    onError: (_err, _variables, context) => {
      // Roll back on error
      if (context?.previousSettings) {
        utils.chat.getToolSettings.setData(undefined, context.previousSettings);
      }
    },
    onSettled: () => {
      // Refetch to ensure server state
      void utils.chat.getToolSettings.invalidate();
    },
  });

  /**
   * Get the effective trust mode for a given tool.
   * Defaults to "ask_every_time" for new/unknown tools.
   */
  function getEffectiveTrustMode(toolName: string): "ask_every_time" | "auto_run" {
    if (!userSettings) return "ask_every_time";
    const setting = userSettings.find((s) => s.toolName === toolName);
    return (setting?.trustMode as "ask_every_time" | "auto_run") ?? "ask_every_time";
  }

  function handleToggle(toolName: string, mode: "ask_every_time" | "auto_run") {
    const classification = getToolClassification(toolName);
    // Write tools are locked to "ask_every_time"
    if (classification === "write" && mode === "auto_run") return;
    updateSetting.mutate({ toolName, trustMode: mode });
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-3 border-b border-[#e1e5f2]/50 sticky top-0 bg-white z-10">
        <h2 className="text-[15px] font-semibold text-[#022b3a]">Tool Settings</h2>
        <button
          type="button"
          onClick={() => setActivePanel("thread")}
          aria-label="Back to conversation"
          className="p-1.5 rounded-md hover:bg-[#e1e5f2]/40 transition-colors text-[#022b3a]/70 cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-[#022b3a]/40 focus-visible:ring-offset-1"
        >
          <svg
            width="16"
            height="16"
            viewBox="0 0 16 16"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            aria-hidden="true"
          >
            <path
              d="M12.5 8H3.5M3.5 8L7 4.5M3.5 8L7 11.5"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </button>
      </div>

      {/* Scrollable tool list */}
      <div className="flex-1 overflow-y-auto">
        {/* Loading state */}
        {isLoading && (
          <div>
            {Array.from({ length: 4 }).map((_, i) => (
              <SettingsSkeleton key={i} />
            ))}
          </div>
        )}

        {/* Tool list */}
        {!isLoading &&
          KNOWN_TOOLS.map((tool) => {
            const classification = getToolClassification(tool.name);
            const metadata = getToolMetadata(tool.name);
            const trustMode = getEffectiveTrustMode(tool.name);
            const isWriteTool = classification === "write";

            return (
              <div
                key={tool.name}
                className="px-3 py-3 border-b border-[#e1e5f2]/50"
              >
                {/* Tool name + classification badge */}
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-[13px] font-medium text-[#022b3a]">
                    {metadata.displayName}
                  </span>
                  <span
                    className={`text-[10px] font-medium px-1.5 py-0.5 rounded-full ${
                      classification === "read"
                        ? "bg-green-100 text-green-700"
                        : "bg-amber-100 text-amber-700"
                    }`}
                  >
                    {classification === "read" ? "Read" : "Write"}
                  </span>
                </div>

                {/* Description */}
                <p className="text-[12px] text-[#022b3a]/60 mb-2 leading-relaxed">
                  {tool.description}
                </p>

                {/* Toggle: Ask / Auto */}
                <div className="flex items-center gap-1.5">
                  <div className="inline-flex rounded-md bg-[#e1e5f2]/30 p-0.5">
                    <button
                      type="button"
                      onClick={() => handleToggle(tool.name, "ask_every_time")}
                      className={`px-2.5 py-1 text-[11px] font-medium rounded transition-colors cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-[#022b3a]/40 focus-visible:ring-offset-1 ${
                        trustMode === "ask_every_time"
                          ? "bg-[#022b3a] text-white"
                          : "bg-transparent text-[#022b3a]/60 hover:text-[#022b3a]"
                      }`}
                      aria-pressed={trustMode === "ask_every_time"}
                      aria-label={`Set ${metadata.displayName} to ask every time`}
                    >
                      Ask
                    </button>
                    <button
                      type="button"
                      onClick={() => handleToggle(tool.name, "auto_run")}
                      disabled={isWriteTool}
                      title={isWriteTool ? "Write tools always require approval" : undefined}
                      className={`px-2.5 py-1 text-[11px] font-medium rounded transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[#022b3a]/40 focus-visible:ring-offset-1 ${
                        isWriteTool
                          ? "bg-transparent text-[#022b3a]/30 cursor-not-allowed"
                          : trustMode === "auto_run"
                            ? "bg-[#022b3a] text-white cursor-pointer"
                            : "bg-transparent text-[#022b3a]/60 hover:text-[#022b3a] cursor-pointer"
                      }`}
                      aria-pressed={trustMode === "auto_run"}
                      aria-label={
                        isWriteTool
                          ? `Auto-run disabled for ${metadata.displayName} - write tools always require approval`
                          : `Set ${metadata.displayName} to auto-run`
                      }
                    >
                      Auto
                    </button>
                  </div>

                  {/* Lock indicator for write tools */}
                  {isWriteTool && (
                    <span
                      className="flex items-center gap-1 text-[10px] text-[#022b3a]/50"
                      title="Write tools always require approval"
                    >
                      <LockIcon />
                      <span>Locked</span>
                    </span>
                  )}
                </div>
              </div>
            );
          })}
      </div>
    </div>
  );
}
