"use client";

import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport } from "ai";
import { HugeiconsIcon } from "@hugeicons/react";
import { 
  ArrowUp01Icon, 
  SparklesIcon, 
  Cancel01Icon, 
  AlertCircleIcon 
} from "@hugeicons/core-free-icons";
import { useEffect, useRef, useState, type KeyboardEvent } from "react";

export function ChatInput({ initialValue = "" }: { initialValue?: string }) {
  const [input, setInput] = useState(initialValue);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Initializing with the new DefaultChatTransport and extracting status/controls
  const { messages, sendMessage, status, stop, error, regenerate } = useChat({
    transport: new DefaultChatTransport({
      api: '/api/chat',
    }),
  });

  // Auto-resize logic
  useEffect(() => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = "44px";
      const scrollHeight = textarea.scrollHeight;
      textarea.style.height = `${Math.min(scrollHeight, 200)}px`;
    }
  }, [input]);

  // Handle incoming intents (like Reply/Forward buttons from other views)
  useEffect(() => {
    if (initialValue) {
      setInput(initialValue);
      setTimeout(() => textareaRef.current?.focus(), 50);
    }
  }, [initialValue]);

  const submitMessage = () => {
    if (input.trim() && (status === 'ready' || status === 'error')) {
      sendMessage({ text: input });
      setInput("");
      if (textareaRef.current) textareaRef.current.style.height = "44px";
    }
  };

  const onKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.nativeEvent.isComposing) return;
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      submitMessage();
    }
  };

  const isActive = input.trim().length > 0;
  const isStreaming = status === "submitted" || status === "streaming";

  return (
    <div className="w-full max-w-3xl mx-auto px-4 pb-6 pt-2 flex flex-col gap-4">
      
      {/* Dynamic Chat Messages Area */}
      {messages.length > 0 && (
        <div className="flex flex-col gap-4 max-h-[50vh] overflow-y-auto px-2 mb-2 pb-2 scroll-smooth">
          {messages.map((m) => (
            <div
              key={m.id}
              className={`flex flex-col max-w-[85%] rounded-2xl px-4 py-3 text-[15px] leading-relaxed shadow-[0_2px_8px_rgba(2,43,58,0.02)] ${
                m.role === "user"
                  ? "bg-[#022b3a] text-white self-end rounded-br-sm"
                  : "bg-white border border-[#e1e5f2] text-[#022b3a] self-start rounded-bl-sm"
              }`}
            >
              {m.role === "assistant" && (
                <div className="flex items-center gap-1.5 mb-2 opacity-60">
                  <HugeiconsIcon icon={SparklesIcon} className="h-3.5 w-3.5" />
                  <span className="text-xs font-semibold uppercase tracking-wider">Ask Clerio</span>
                </div>
              )}

              {/* Render using the new "parts" API */}
              <div className="flex flex-col gap-2">
                {m.parts?.map((part, index) => {
                  if (part.type === "text") {
                    return <div key={index} className="whitespace-pre-wrap">{part.text}</div>;
                  }
                  
                  // Gracefully handle reasoning tokens if you ever use DeepSeek/Claude-Sonnet
                  if (part.type === "reasoning") {
                    return (
                      <div key={index} className="text-xs text-[#022b3a]/50 italic border-l-2 border-[#e1e5f2] pl-3 py-1 my-1">
                        {part.text}
                      </div>
                    );
                  }
                  return null;
                })}
              </div>

              {/* Render Tool Invocations Gracefully (AI SDK 6 parts API) */}
              {m.parts?.filter((p) => p.type === "tool-invocation").map((toolPart) => {
                const toolInv = toolPart as unknown as { type: "tool-invocation"; toolInvocation: { toolCallId: string; toolName: string; state: string } };
                return (
                  <div key={toolInv.toolInvocation.toolCallId} className="mt-3 p-2.5 bg-[#fcfcfc] rounded-lg border border-[#e1e5f2] text-xs text-[#1f7a8c] font-medium font-mono flex items-center gap-2">
                    {toolInv.toolInvocation.state === 'result' ? '✓' : (
                      <div className="h-2 w-2 rounded-full bg-[#1f7a8c] animate-pulse shrink-0" />
                    )}
                    {toolInv.toolInvocation.state === 'result' 
                      ? `Executed: ${toolInv.toolInvocation.toolName}` 
                      : `Running: ${toolInv.toolInvocation.toolName}...`}
                  </div>
                );
              })}
            </div>
          ))}

          {/* Error State Component */}
          {error && (
            <div className="flex flex-col items-center gap-3 mt-2 p-4 bg-red-50 border border-red-100 rounded-xl text-red-600 text-sm animate-in fade-in zoom-in-95">
              <div className="flex items-center gap-2 font-medium">
                <HugeiconsIcon icon={AlertCircleIcon} className="h-4 w-4" />
                Something went wrong connecting to the Agent.
              </div>
              <button
                onClick={() => regenerate()}
                className="px-4 py-1.5 bg-white border border-red-200 rounded-md hover:bg-red-50 transition-[background-color] font-medium shadow-sm"
              >
                Retry
              </button>
            </div>
          )}
        </div>
      )}

      {/* Input Box */}
      <div className="rounded-3xl border border-[#e1e5f2] bg-white p-2 shadow-[0_2px_12px_rgba(2,43,58,0.04)] transition-[border-color,box-shadow] duration-300 focus-within:border-[#bfdbf7] focus-within:shadow-[0_4px_24px_rgba(2,43,58,0.08)]">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            submitMessage();
          }} 
          className="flex flex-col"
        >
          <textarea
            ref={textareaRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={onKeyDown}
            disabled={status !== 'ready' && status !== 'error'}
            placeholder={isStreaming ? "Clerio is executing..." : "Ask Clerio to send an email or schedule a meeting..."}
            className="w-full resize-none bg-transparent px-3 py-2 text-[15px] leading-relaxed text-[#022b3a] placeholder:text-[#022b3a]/40 focus:outline-none disabled:opacity-50"
            style={{ minHeight: "44px", maxHeight: "200px" }}
          />
          
          <div className="flex items-center justify-between px-2 pb-1 pt-2 border-t border-[#e1e5f2]/50 mt-1">
            <div className="text-xs text-[#022b3a]/40 flex items-center gap-1.5 font-medium">
              <HugeiconsIcon icon={SparklesIcon} className="h-3.5 w-3.5" />
              {isStreaming ? "Agent is thinking..." : "Corsair MCP Agent Active"}
            </div>
            
            <div className="flex items-center gap-2">
              {/* Interrupt / Stop Button */}
              {isStreaming && (
                <button
                  type="button"
                  onClick={() => stop()}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium bg-[#fcfcfc] border border-[#e1e5f2] text-[#022b3a]/60 hover:bg-[#e1e5f2]/50 hover:text-[#022b3a] transition-[color,background-color]"
                >
                  <HugeiconsIcon icon={Cancel01Icon} className="h-3.5 w-3.5" />
                  Stop
                </button>
              )}

              <button
                type="submit"
                aria-label="Send message"
                disabled={!isActive || isStreaming}
                className={`flex h-8 w-8 items-center justify-center rounded-full transition-[transform,background-color] duration-200 ${
                  isActive && !isStreaming
                    ? "bg-[#022b3a] text-white hover:scale-105 active:scale-[0.96] shadow-sm"
                    : "bg-[#e1e5f2] text-[#022b3a]/30 cursor-not-allowed"
                }`}
              >
                <HugeiconsIcon icon={ArrowUp01Icon} className="h-4 w-4 stroke-[2.5]" />
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}