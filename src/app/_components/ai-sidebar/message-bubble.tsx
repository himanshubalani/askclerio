"use client";

import React from "react";

// --- Types ---

export interface MessageBubbleProps {
  role: "user" | "assistant";
  content: string;
  isStreaming?: boolean;
}

// --- Lightweight Markdown Renderer ---

/**
 * Renders a simplified subset of markdown into React elements.
 * Supports: **bold**, *italic*, `code`, [links](url), lists (- or *), and newlines.
 * Built with React elements directly for security (no dangerouslySetInnerHTML).
 */
export function renderMarkdown(text: string): React.ReactNode[] {
  const lines = text.split("\n");
  const elements: React.ReactNode[] = [];
  let listItems: React.ReactNode[] = [];
  let keyCounter = 0;

  function flushList() {
    if (listItems.length > 0) {
      elements.push(
        <ul key={`ul-${keyCounter++}`} className="list-disc pl-4 my-1 space-y-0.5">
          {listItems}
        </ul>
      );
      listItems = [];
    }
  }

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]!;
    const listMatch = /^[-*]\s+(.*)/.exec(line);

    if (listMatch) {
      listItems.push(
        <li key={`li-${keyCounter++}`}>{renderInline(listMatch[1]!)}</li>
      );
    } else {
      flushList();

      if (line === "") {
        elements.push(<br key={`br-${keyCounter++}`} />);
      } else {
        if (elements.length > 0 && i > 0) {
          const prevLine = lines[i - 1];
          if (prevLine !== undefined && !(/^[-*]\s+/.exec(prevLine)) && prevLine !== "") {
            elements.push(<br key={`br-${keyCounter++}`} />);
          }
        }
        elements.push(
          <span key={`line-${keyCounter++}`}>{renderInline(line)}</span>
        );
      }
    }
  }

  flushList();
  return elements;
}

/**
 * Renders inline markdown tokens: **bold**, *italic*, `code`, [text](url)
 */
function renderInline(text: string): React.ReactNode[] {
  const tokens: React.ReactNode[] = [];
  let keyCounter = 0;

  // Combined regex for inline markdown patterns
  // Order matters: bold (**) before italic (*) to avoid conflicts
  const inlineRegex =
    /(\*\*(.+?)\*\*)|(\*(.+?)\*)|(`(.+?)`)|(\[(.+?)\]\((.+?)\))/g;

  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = inlineRegex.exec(text)) !== null) {
    // Add plain text before this match
    if (match.index > lastIndex) {
      tokens.push(text.slice(lastIndex, match.index));
    }

    if (match[1]) {
      // Bold: **text**
      tokens.push(<strong key={`b-${keyCounter++}`}>{match[2]}</strong>);
    } else if (match[3]) {
      // Italic: *text*
      tokens.push(<em key={`i-${keyCounter++}`}>{match[4]}</em>);
    } else if (match[5]) {
      // Inline code: `text`
      tokens.push(
        <code
          key={`c-${keyCounter++}`}
          className="bg-[#e1e5f2]/50 px-1 py-0.5 rounded text-[13px] font-mono"
        >
          {match[6]}
        </code>
      );
    } else if (match[7]) {
      // Link: [text](url)
      tokens.push(
        <a
          key={`a-${keyCounter++}`}
          href={match[9]}
          target="_blank"
          rel="noopener noreferrer"
          className="text-[#1f7a8c] underline"
        >
          {match[8]}
        </a>
      );
    }

    lastIndex = match.index + match[0].length;
  }

  // Add remaining plain text
  if (lastIndex < text.length) {
    tokens.push(text.slice(lastIndex));
  }

  return tokens;
}

// --- Cursor blink keyframes (530ms step-end for authentic terminal cursor) ---

const cursorBlinkStyle = `
@keyframes cursor-blink {
  0%, 100% { opacity: 1 }
  50% { opacity: 0 }
}
`;

// --- Component ---

export function MessageBubble({ role, content, isStreaming }: MessageBubbleProps) {
  if (role === "user") {
    return (
      <div className="flex justify-end">
        <div className="bg-[#bfdbf7]/30 rounded-2xl px-4 py-2.5 max-w-[85%] text-[14px] text-[#022b3a] break-words">
          {content}
        </div>
      </div>
    );
  }

  // Assistant message
  return (
    <div className="flex justify-start">
      {/* Inject cursor blink keyframes */}
      {isStreaming && <style>{cursorBlinkStyle}</style>}
      <div className="bg-white border border-[#e1e5f2] rounded-2xl px-4 py-2.5 max-w-[85%] text-[14px] text-[#022b3a] break-words">
        {renderMarkdown(content)}
        {isStreaming && (
          <span
            className="inline-block w-2 h-4 bg-[#022b3a] ml-0.5 align-middle"
            style={{ animation: "cursor-blink 530ms step-end infinite" }}
            aria-hidden="true"
          />
        )}
      </div>
    </div>
  );
}
