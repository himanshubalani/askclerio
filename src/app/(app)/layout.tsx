import { Sidebar } from "@/app/_components/sidebar";
import { AISidebarProvider } from "@/app/_components/ai-sidebar/provider";
import { AISidebarPanel } from "@/app/_components/ai-sidebar/panel";
import { KeyboardHelp } from "@/app/_components/keyboard-help";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <AISidebarProvider>
      <div
        className="flex w-full overflow-hidden bg-white selection:bg-[#bfdbf7] selection:text-[#022b3a]"
        style={{ height: "calc(100dvh - var(--clerk-header-height, 0px))" }}
      >
        <Sidebar />
        {/* min-w-0 prevents flex children from blowing past their container */}
        <main className="flex-1 min-w-0 flex flex-col relative overflow-hidden">
          {children}
        </main>
        <AISidebarPanel />
      </div>
      <KeyboardHelp />
    </AISidebarProvider>
  );
}