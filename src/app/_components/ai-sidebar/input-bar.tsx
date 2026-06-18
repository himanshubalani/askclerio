"use client";

import { useCallback, useEffect, useRef, useState, type KeyboardEvent } from "react";
import { HugeiconsIcon } from "@hugeicons/react";
import { ArrowUp01Icon, Cancel01Icon } from "@hugeicons/core-free-icons";

// --- Exported utility functions (for property tests) ---

/**
 * Clamps a textarea scrollHeight to the [44, 200] range.
 */
export function clampTextareaHeight(scrollHeight: number): number {
  return Math.max(44, Math.min(200, scrollHeight));
}

/**
 * Returns true if the text contains at least one non-whitespace character.
 */
export function canSubmit(text: string): boolean {
  return text.trim().length > 0;
}

// --- Types ---

export interface InputBarProps {
  onSubmit: (text: string) => void;
  onStop?: () => void;
  isStreaming?: boolean;
  prefillText?: string;
  disabled?: boolean;
}

// --- Component ---

export function InputBar({
  onSubmit,
  onStop,
  isStreaming = false,
  prefillText,
  disabled = false,
}: InputBarProps) {
  const [value, setValue] = useState("");
  const [height, setHeight] = useState(44);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Pre-fill text on mount (or when prefillText changes to a non-empty value)
  useEffect(() => {
    if (prefillText && prefillText.trim().length > 0) {
      setValue(prefillText);
    }
  }, [prefillText]);

  // Recompute height whenever value changes
  useEffect(() => {
    const textarea = textareaRef.current;
    if (!textarea) return;
    // Reset height to min so scrollHeight reflects actual content height
    textarea.style.height = "44px";
    const newHeight = clampTextareaHeight(textarea.scrollHeight);
    setHeight(newHeight);
    textarea.style.height = `${newHeight}px`;
  }, [value]);

  const handleSubmit = useCallback(() => {
    if (!canSubmit(value) || disabled || isStreaming) return;
    onSubmit(value);
    setValue("");
    setHeight(44);
    if (textareaRef.current) {
      textareaRef.current.style.height = "44px";
    }
  }, [value, disabled, isStreaming, onSubmit]);

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    // Don't submit during IME composition
    if (e.nativeEvent.isComposing) return;
    // Submit on Enter without Shift
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setValue(e.target.value);
  };

  const isSubmitDisabled = !canSubmit(value) || disabled;

  return (
    <div className="border-t border-[#e1e5f2] bg-white px-3 py-3">
      <div className="flex items-end gap-2">
        <textarea
          ref={textareaRef}
          value={value}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          disabled={disabled || isStreaming}
          placeholder="Ask Clerio..."
          aria-label="Message input"
          className="flex-1 resize-none overflow-hidden border-0 bg-transparent text-[14px] text-[#022b3a] placeholder:text-[#022b3a]/40 focus:outline-none focus:ring-0"
          style={{
            minHeight: "44px",
            maxHeight: "200px",
            height: `${height}px`,
          }}
        />

        {isStreaming ? (
          <button
            type="button"
            onClick={onStop}
            aria-label="Stop generation"
            className="rounded-lg p-2 bg-[#022b3a] text-white transition-colors hover:bg-[#022b3a]/80 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#022b3a]/40 focus-visible:ring-offset-1"
          >
            <HugeiconsIcon icon={Cancel01Icon} className="h-4 w-4" />
          </button>
        ) : (
          <button
            type="button"
            onClick={handleSubmit}
            disabled={isSubmitDisabled}
            aria-label="Send message"
            className="rounded-lg p-2 bg-[#022b3a] text-white disabled:opacity-40 disabled:cursor-not-allowed transition-colors hover:bg-[#022b3a]/80 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#022b3a]/40 focus-visible:ring-offset-1"
          >
            <HugeiconsIcon icon={ArrowUp01Icon} className="h-4 w-4" />
          </button>
        )}
      </div>
    </div>
  );
}
