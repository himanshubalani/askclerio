"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { SignInButton, SignUpButton, Show, UserButton } from "@clerk/nextjs";

export function LandingHeader() {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 50);
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled
          ? "bg-white/80 backdrop-blur-md border-b border-[#e1e5f2]/50 shadow-[0_1px_3px_rgba(2,43,58,0.04)]"
          : "bg-transparent border-b border-transparent"
      }`}
    >
            <div className="mx-auto flex h-16 max-w-5xl items-center justify-between px-6">
        {/* Left: Logo */}
        <Link href="/" className="flex items-center">
          <Image
            src="/clerio_header_light_mode.svg"
            alt="Clerio"
            width={96}
            height={32}
            priority
            className={`transition-opacity duration-300 ${
              scrolled ? "opacity-100" : "opacity-90"
            }`}
          />
        </Link>

        {/* Right: Auth buttons */}
        <div className="flex flex-1 items-center justify-end gap-2">
          <Show when="signed-out">
            <SignInButton>
              <button
                className={`rounded-full px-3.5 py-1.5 text-sm font-medium transition-all duration-300 cursor-pointer ${
                  scrolled
                    ? "text-[#022b3a] hover:bg-[#e1e5f2]/40"
                    : "text-[#022b3a]/80 hover:text-[#022b3a] hover:bg-white/10"
                }`}
              >
                Sign In
              </button>
            </SignInButton>
            <SignUpButton>
              <button
                className={`rounded-full px-4 py-1.5 text-sm font-medium transition-all duration-300 cursor-pointer active:scale-[0.96] ${
                  scrolled
                    ? "bg-[#022b3a] text-white hover:bg-[#1f7a8c]"
                    : "bg-white/90 text-[#022b3a] hover:bg-white shadow-sm"
                }`}
              >
                Get Started
              </button>
            </SignUpButton>
          </Show>
          <Show when="signed-in">
            <UserButton showName />
          </Show>
        </div>
      </div>
    </header>
  );
}
