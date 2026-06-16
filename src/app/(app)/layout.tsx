import { Sidebar } from "@/app/_components/sidebar";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-screen w-full bg-white overflow-hidden selection:bg-[#bfdbf7] selection:text-[#022b3a]">
      <Sidebar />
      <main className="flex-1 flex flex-col relative h-full">
        {children}
      </main>
    </div>
  );
}