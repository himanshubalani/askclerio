"use client";

export type ConnectionStatus = "active" | "thinking" | "disconnected";

export interface StatusFooterProps {
  status: ConnectionStatus;
}

const statusConfig: Record<
  ConnectionStatus,
  { text: string; dotClass: string }
> = {
  active: {
    text: "Corsair MCP Agent Active",
    dotClass: "bg-emerald-500",
  },
  thinking: {
    text: "Agent is thinking...",
    dotClass: "bg-amber-400 animate-pulse",
  },
  disconnected: {
    text: "Agent Disconnected",
    dotClass: "bg-red-400",
  },
};

export function StatusFooter({ status }: StatusFooterProps) {
  const { text, dotClass } = statusConfig[status];

  return (
    <div className="px-3 py-2 border-t border-[#e1e5f2]/50 bg-[#fcfcfc]">
      <div className="flex flex-row items-center">
        <span className={`h-2 w-2 rounded-full ${dotClass}`} aria-hidden="true" />
        <span className="text-xs text-[#022b3a]/60 ml-2">{text}</span>
      </div>
    </div>
  );
}
