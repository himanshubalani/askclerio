import { ChatInput } from "@/app/_components/chat-input";

export default function CalendarDashboard() {
  return (
    <>
      <div className="flex-1 overflow-hidden flex antialiased">
        {/* Main Calendar View */}
        <div className="flex-1 overflow-y-auto px-8 py-8 border-r border-[#e1e5f2]">
          <header className="mb-8 flex items-center justify-between">
            <h1 className="text-2xl font-semibold text-[#022b3a] text-balance">June 2026</h1>
            <div className="flex rounded-md border border-[#e1e5f2] p-0.5 shadow-sm bg-[#fcfcfc]">
              <button className="rounded px-3 py-1 text-sm font-medium bg-white text-[#022b3a] shadow-sm">Month</button>
              <button className="rounded px-3 py-1 text-sm font-medium text-[#022b3a]/60 hover:text-[#022b3a] transition-colors">Week</button>
            </div>
          </header>

          {/* Month Grid Placeholder */}
          <div className="grid grid-cols-7 gap-px bg-[#e1e5f2] border border-[#e1e5f2] rounded-2xl overflow-hidden">
             
             {Array.from({ length: 35 }).map((_, i) => (
                <div key={i} className="min-h-[100px] bg-white p-2">
                   <span className="text-xs font-medium text-[#022b3a]/40 tabular-nums">{i + 1}</span>
                </div>
             ))}
          </div>
        </div>

        {/* Schedules Sidebar */}
        <div className="w-80 shrink-0 bg-[#fcfcfc] overflow-y-auto px-6 py-8">
          <h2 className="text-sm font-bold tracking-wider text-[#022b3a]/50 uppercase mb-4">Upcoming Events</h2>
          
          <div className="flex flex-col gap-3">
             <div className="rounded-xl border border-[#e1e5f2] p-3 bg-white shadow-sm border-l-4 border-l-[#1f7a8c]">
                <div className="text-xs font-semibold text-[#1f7a8c] mb-1 tabular-nums">09:00 AM - 10:00 AM</div>
                <div className="font-medium text-[#022b3a] text-pretty">Sync with Dev Team</div>
             </div>
          </div>
        </div>
      </div>

      <div className="shrink-0 bg-white">
        <ChatInput />
      </div>
    </>
  );
}