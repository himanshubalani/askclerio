import { SignUpButton, SignInButton } from "@clerk/nextjs";
import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import Image from "next/image";

export default async function LandingPage() {
  const { userId } = await auth();

  // Redirect signed-in users straight to the app
  if (userId) redirect("/u");

  return (
    <main className="min-h-[calc(100vh-4rem)] bg-white selection:bg-[#bfdbf7] selection:text-[#022b3a]">

      {/* Hero */}
      <section className="flex flex-col items-center justify-center text-center px-6 pt-24 pb-20">
        <div className="inline-flex items-center gap-2 rounded-full border border-[#bfdbf7] bg-[#f0f7ff] px-4 py-1.5 text-xs font-medium text-[#1f7a8c] mb-8">
          ✦ Your AI-powered command center
        </div>

        <h1 className="text-5xl sm:text-6xl font-bold text-[#022b3a] tracking-tight max-w-3xl text-balance leading-[1.1] mb-6">
          Agent based {" "}
          <span className="text-[#1f7a8c]">productivity suite.</span>{" "}
          All in one place.
        </h1>

        <p className="text-lg text-[#022b3a]/60 max-w-xl text-pretty mb-10">
          Clerio connects your Gmail and Google Calendar, then puts an AI assistant 
          on top — so you can triage, reply, and plan without switching tabs.
        </p>

        <div className="flex flex-wrap items-center justify-center gap-3">
          <SignUpButton>
            <button className="h-11 px-6 rounded-xl bg-[#022b3a] text-white font-medium text-sm hover:bg-[#1f7a8c] shadow-[0_2px_8px_rgba(2,43,58,0.12),0_1px_2px_rgba(2,43,58,0.08)] hover:shadow-[0_4px_16px_rgba(2,43,58,0.16),0_2px_4px_rgba(2,43,58,0.1)] active:scale-[0.96] transition-[transform,background-color,box-shadow]">
              Get started for free
            </button>
          </SignUpButton>
          <SignInButton>
            <button className="h-11 px-6 rounded-xl border border-[#e1e5f2] text-[#022b3a] font-medium text-sm hover:bg-[#f0f7ff] active:scale-[0.96] transition-[transform,background-color]">
              Sign in
            </button>
          </SignInButton>
        </div>

        {/* Hero image */}
        <div className="mt-16 w-full max-w-4xl rounded-2xl shadow-[0_8px_40px_rgba(2,43,58,0.08),0_2px_8px_rgba(2,43,58,0.04)] bg-[#fcfcfc] overflow-hidden">
          <div className="flex items-center gap-1.5 px-4 py-3 border-b border-[#e1e5f2] bg-white">
            <div className="h-2.5 w-2.5 rounded-full bg-[#e1e5f2]" />
            <div className="h-2.5 w-2.5 rounded-full bg-[#e1e5f2]" />
            <div className="h-2.5 w-2.5 rounded-full bg-[#e1e5f2]" />
            <div className="mx-auto h-5 w-48 rounded-full bg-[#e1e5f2]" />
          </div>
          <Image
            src="/hero-demo.png"
            alt="Clerio app preview"
            width={1920}
            height={1080}
            priority
            className="h-auto w-full"
          />
        </div>
      </section>

      {/* Features */}
      <section className="px-6 py-20 bg-[#fcfcfc] border-y border-[#e1e5f2]">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-2xl font-bold text-[#022b3a] text-center mb-12">
            Everything you need, nothing you don&apos;t
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            {[
              {
                icon: "✉️",
                title: "Smart Inbox",
                desc: "Threads sorted by priority. AI labels what matters so you focus on what needs a reply.",
              },
              {
                icon: "📅",
                title: "Calendar at a glance",
                desc: "See today's schedule alongside your email. Never miss a meeting buried under 200 unread.",
              },
              {
                icon: "🤖",
                title: "AI Assistant",
                desc: "Ask Clerio to summarize threads, draft replies, or find that email from last Tuesday.",
              },
            ].map((f) => (
              <div
                key={f.title}
                className="rounded-2xl bg-white p-6 shadow-[0_2px_8px_rgba(2,43,58,0.04),0_1px_2px_rgba(2,43,58,0.02)]"
              >
                <div className="text-3xl mb-4">{f.icon}</div>
                <h3 className="font-semibold text-[#022b3a] mb-2">{f.title}</h3>
                <p className="text-sm text-[#022b3a]/60 text-pretty">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="px-6 py-24 flex flex-col items-center text-center">
        <Image
          src="/clerio logo mark dark.svg"
          alt="Clerio"
          width={40}
          height={40}
          className="mb-6 opacity-80"
        />
        <h2 className="text-3xl font-bold text-[#022b3a] mb-4 text-balance">
          Ready to reclaim your inbox?
        </h2>
        <p className="text-[#022b3a]/60 mb-8 max-w-sm text-pretty">
          Connect Gmail and Calendar in under a minute. No credit card required.
        </p>
        <SignUpButton>
          <button className="h-11 px-8 rounded-xl bg-[#022b3a] text-white font-medium text-sm hover:bg-[#1f7a8c] shadow-[0_2px_8px_rgba(2,43,58,0.12),0_1px_2px_rgba(2,43,58,0.08)] hover:shadow-[0_4px_16px_rgba(2,43,58,0.16),0_2px_4px_rgba(2,43,58,0.1)] active:scale-[0.96] transition-[transform,background-color,box-shadow]">
            Start for free
          </button>
        </SignUpButton>
      </section>

      {/* Footer */}
      <footer className="border-t border-[#e1e5f2] px-6 py-6 flex items-center justify-between text-xs text-[#022b3a]/40">
        <Image
          src="/clerio_header_light_mode.svg"
          alt="Clerio"
          width={64}
          height={22}
          className="outline outline-1 outline-[rgba(0,0,0,0.1)] rounded"
        />
        <span>© {new Date().getFullYear()} Clerio</span>
      </footer>
    </main>
  );
}
