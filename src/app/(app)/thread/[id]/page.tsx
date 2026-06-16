"use client";

import { HugeiconsIcon } from "@hugeicons/react";
import { ArchiveIcon, ArrowLeft01Icon, Delete02Icon, Forward01Icon, Loading02Icon, MailOpen01Icon, MailReply01Icon } from "@hugeicons/core-free-icons";
import { use, useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/trpc/react";
import { ChatInput } from "@/app/_components/chat-input";

export default function ThreadView({ params }: { params: Promise<{ id: string }> }) {
  // Unwrapping params for Next 15 standard
  const { id } = use(params);
  const router = useRouter();
  
  // State to hold the drafted intent pushed down to the Clerio command box
  const [chatIntent, setChatIntent] = useState("");

  const { data: thread, isLoading } = api.gmail.getThread.useQuery({ threadId: id });
  
  const archiveMut = api.gmail.archiveThread.useMutation({
    onSuccess: () => router.push("/"),
  });
  const trashMut = api.gmail.trashThread.useMutation({
    onSuccess: () => router.push("/"),
  });

  const handleReply = () => {
    setChatIntent("Reply to this email saying: ");
  };

  const handleForward = () => {
    setChatIntent("Forward this email to: ");
  };

  return (
    <div className="flex w- h-full flex-col antialiased">
      {/* Top Toolbar */}
      <header className="flex shrink-0 items-center justify-between border-b border-[#e1e5f2] bg-white px-6 py-4 z-10 shadow-[0_2px_8px_rgba(2,43,58,0.02)]">
        <div className="flex items-center gap-4">
          <button
            onClick={() => router.back()}
            className="rounded-md p-2 text-[#022b3a]/60 transition-colors hover:bg-[#e1e5f2]/50 hover:text-[#022b3a]"
          >
            <HugeiconsIcon icon={ArrowLeft01Icon} className="h-5 w-5" />
          </button>
          <h1 className="text-xl font-semibold text-[#022b3a] truncate max-w-xl">
            {isLoading ? "Loading conversation..." : thread?.subject}
          </h1>
        </div>
        
        <div className="flex items-center gap-1 bg-[#fcfcfc] border border-[#e1e5f2] p-1 rounded-lg">
          <button
            onClick={handleReply}
            title="Reply via Clerio"
            className="rounded-md p-2 text-[#022b3a]/60 transition-colors hover:bg-white hover:shadow-sm hover:text-[#1f7a8c]"
          >
            <HugeiconsIcon icon={MailReply01Icon} className="h-4 w-4 stroke-[2.5]" />
          </button>
          <button
            onClick={handleForward}
            title="Forward via Clerio"
            className="rounded-md p-2 text-[#022b3a]/60 transition-colors hover:bg-white hover:shadow-sm hover:text-[#1f7a8c]"
          >
            <HugeiconsIcon icon={Forward01Icon} className="h-4 w-4 stroke-[2.5]" />
          </button>
          
          <div className="h-4 w-px bg-[#e1e5f2] mx-1" />
          
          <button
            onClick={() => archiveMut.mutate({ threadId: id })}
            title="Archive"
            disabled={archiveMut.isPending}
            className="rounded-md p-2 text-[#022b3a]/60 transition-colors hover:bg-white hover:shadow-sm hover:text-[#1f7a8c] disabled:opacity-50"
          >
            <HugeiconsIcon icon={ArchiveIcon} className="h-4 w-4 stroke-[2.5]" />
          </button>
          <button
            onClick={() => trashMut.mutate({ threadId: id })}
            title="Trash"
            disabled={trashMut.isPending}
            className="rounded-md p-2 text-[#022b3a]/60 transition-colors hover:bg-white hover:shadow-sm hover:text-red-600 disabled:opacity-50"
          >
            <HugeiconsIcon icon={Delete02Icon} className="h-4 w-4 stroke-[2.5]" />
          </button>
        </div>
      </header>

      {/* Conversation Thread Area */}
      <div className="flex-1 overflow-y-auto p-8 bg-[#fcfcfc] scroll-smooth">
        {isLoading ? (
          <div className="flex h-full items-center justify-center">
            <HugeiconsIcon icon={Loading02Icon} className="h-8 w-8 animate-spin text-[#1f7a8c]" />
          </div>
        ) : (
          <div className="mx-auto max-w-4xl space-y-8 pb-12">
            {thread?.messages.map((msg, idx) => (
              <div 
                key={msg.id} 
                className="rounded-2xl border border-[#e1e5f2] bg-white p-6 shadow-[0_4px_24px_rgba(2,43,58,0.02)] animate-in fade-in slide-in-from-bottom-2"
                style={{ animationDelay: `${Math.min(idx * 50, 300)}ms` }}
              >
                <div className="mb-6 flex items-start justify-between border-b border-[#e1e5f2]/50 pb-4">
                  <div className="flex gap-4">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#bfdbf7]/30 text-[#1f7a8c]">
                      <HugeiconsIcon icon={MailOpen01Icon} className="h-5 w-5" />
                    </div>
                    <div>
                      <div className="font-bold text-[#022b3a]">{msg.from.split('<')[0]?.trim()}</div>
                      <div className="text-sm font-medium text-[#022b3a]/40 text-pretty">to {msg.to.split('<')[0]?.trim()}</div>
                    </div>
                  </div>
                  <div className="text-sm font-medium text-[#022b3a]/50 tabular-nums">
                    {new Date(msg.date).toLocaleString([], {
                      month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
                    })}
                  </div>
                </div>
                
                {/* Email Body Rendering */}
                <div 
                  className="text-[#022b3a] text-[15px] leading-relaxed break-words [&>a]:text-[#1f7a8c] [&>a]:underline [&_table]:max-w-full [&_table]:overflow-x-auto [&_img]:max-w-full [&_img]:rounded-md"
                  dangerouslySetInnerHTML={{ __html: msg.body }} 
                />
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Clerio Command Input */}
      <div className="shrink-0 bg-white border-t border-[#e1e5f2] pt-4 z-10 shadow-[0_-4px_24px_rgba(2,43,58,0.02)]">
        <ChatInput initialValue={chatIntent} />
      </div>
    </div>
  );
}