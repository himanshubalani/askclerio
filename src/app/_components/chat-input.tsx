"use client";

import { HugeiconsIcon } from "@hugeicons/react";
import { ArrowUp01Icon, AttachmentIcon } from "@hugeicons/core-free-icons";
import { useState, useRef, useEffect, type KeyboardEvent } from "react";

export function ChatInput({ initialValue = "" }: { initialValue?: string }) {
  const [text, setText] = useState(initialValue);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto-resize logic
  const adjustHeight = () => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = "44px"; // Reset to min-height (1 line)
      const scrollHeight = textarea.scrollHeight;
      textarea.style.height = `${Math.min(scrollHeight, 200)}px`;
    }
  };

  useEffect(() => {
    adjustHeight();
  }, [text]);

  // Handle incoming commands (like Reply/Forward)
  useEffect(() => {
    setText(initialValue);
    if (!initialValue) return;
    // Slight delay to allow render before focusing
    const timeoutId = setTimeout(() => textareaRef.current?.focus(), 50);
    return () => clearTimeout(timeoutId);
  }, [initialValue]);

  const handleSubmit = () => {
    if (!text.trim()) return;
    
    // Connect to Corsair MCP / AI Agent
    console.log("Submitting to Clerio:", text);
    
    setText("");
    if (textareaRef.current) textareaRef.current.style.height = "44px";
  };

   const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
     if (e.nativeEvent.isComposing) return;
     if (e.key === "Enter" && !e.shiftKey) {
       e.preventDefault(); // Prevent default new line
       handleSubmit();
     }
   };

  const isActive = text.trim().length > 0;

  return (
    <div className="w-full max-w-3xl mx-auto px-4 pb-6 pt-2">
      <div className="rounded-3xl border border-[#e1e5f2] bg-white p-2 shadow-[0_2px_12px_rgba(2,43,58,0.04)] transition-all duration-300 focus-within:border-[#bfdbf7] focus-within:shadow-[0_4px_24px_rgba(2,43,58,0.08)]">
        
        <textarea
          ref={textareaRef}
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Ask Clerio..."
          className="w-full resize-none bg-transparent px-3 py-2 text-[15px] leading-relaxed text-[#022b3a] placeholder:text-[#022b3a]/40 focus:outline-none"
          style={{ minHeight: "44px", maxHeight: "200px" }}
        />
        
        <div className="flex items-center justify-between px-2 pb-1 pt-2 border-t border-[#e1e5f2]/50 mt-1">
          <button
            type="button"
            aria-label="Attach file (coming soon)"
            disabled
            className="text-[#022b3a]/40 cursor-not-allowed"
          >
            <HugeiconsIcon icon={AttachmentIcon} className="h-5 w-5" />
          </button>
          
          <button
            type="button"
            aria-label="Send message"
            onClick={handleSubmit}
            disabled={!isActive}
            className={`flex h-8 w-8 items-center justify-center rounded-full transition-all duration-200 ${
              isActive
                ? "bg-[#022b3a] text-white hover:scale-105 active:scale-95"
                : "bg-[#e1e5f2] text-[#022b3a]/30 cursor-not-allowed"
            }`}
          >
            <HugeiconsIcon icon={ArrowUp01Icon} className="h-4 w-4 stroke-[2.5]" />
          </button>
        </div>
      </div>
    </div>
  );
}