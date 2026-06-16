"use client";

import { useState, useRef, useEffect, type KeyboardEvent } from "react";
import { Paperclip, ArrowUp } from "lucide-react";

export function ChatInput() {
  const [text, setText] = useState("");
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

  const handleSubmit = () => {
    if (!text.trim()) return;
    
    // TODO: Connect to Corsair MCP / AI Agent
    console.log("Submitting to Clerio:", text);
    
    setText("");
    if (textareaRef.current) textareaRef.current.style.height = "44px";
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
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
        
        <div className="flex items-center justify-between px-2 pb-1 pt-2">
          <button className="text-[#022b3a]/40 transition-colors hover:text-[#1f7a8c]">
            <Paperclip className="h-5 w-5" />
          </button>
          
          <button
            onClick={handleSubmit}
            disabled={!isActive}
            className={`flex h-8 w-8 items-center justify-center rounded-full transition-all duration-200 ${
              isActive
                ? "bg-[#022b3a] text-white hover:scale-105 active:scale-95"
                : "bg-[#e1e5f2] text-[#022b3a]/30 cursor-not-allowed"
            }`}
          >
            <ArrowUp className="h-4 w-4 stroke-[2.5]" />
          </button>
        </div>
      </div>
    </div>
  );
}