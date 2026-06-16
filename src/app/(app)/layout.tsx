import { Sidebar } from "@/app/_components/sidebar";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    // h-dvh = dynamic viewport height (no mobile browser chrome bleed)
    // We subtract the Clerk header using the CSS var set in root layout.
    // overflow-hidden on THIS container kills the global scrollbar.
    <div
      className="flex w-full overflow-hidden bg-white selection:bg-[#bfdbf7] selection:text-[#022b3a]"
      style={{ height: "calc(100dvh - var(--clerk-header-height, 0px))" }}
    >
      <Sidebar />
      {/* min-w-0 prevents flex children from blowing past their container */}
      <main className="flex-1 min-w-0 flex flex-col relative overflow-hidden">
        {children}
      </main>
    </div>
  );
}