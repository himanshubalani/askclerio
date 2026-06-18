import { ClerkProvider, Show, SignInButton, SignUpButton, UserButton } from '@clerk/nextjs'
import { TRPCReactProvider } from '@/trpc/react'
import { Geist, Geist_Mono } from 'next/font/google'
import Image from 'next/image'
import Link from 'next/link'
import '@/styles/globals.css'

const geistSans = Geist({ variable: '--font-geist-sans', subsets: ['latin'] })
const geistMono = Geist_Mono({ variable: '--font-geist-mono', subsets: ['latin'] })

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <ClerkProvider>
      <html lang="en" className={`${geistSans.variable} ${geistMono.variable}`}>
        <body className="antialiased">
          <TRPCReactProvider>
            <header className="flex justify-between items-center px-6 h-16 border-b border-[#e1e5f2] bg-white/80 backdrop-blur-sm sticky top-0 z-50">
              <Link href="/" className="flex items-center">
                <Image
                  src="/clerio_header_light_mode.svg"
                  alt="Clerio"
                  width={96}
                  height={32}
                  priority
                />
              </Link>
              <div className="flex items-center gap-3">
                <Show when="signed-out">
                  <SignInButton>
                    <button className="text-sm font-medium text-[#022b3a] hover:text-[#1f7a8c] px-3 py-2 rounded-lg hover:bg-[#f0f7ff] cursor-pointer transition-[color,background-color]">
                      Sign In
                    </button>
                  </SignInButton>
                  <SignUpButton>
                    <button className="bg-[#022b3a] hover:bg-[#1f7a8c] text-white rounded-lg font-medium text-sm h-9 px-4 cursor-pointer active:scale-[0.96] transition-[transform,background-color]">
                      Get Started
                    </button>
                  </SignUpButton>
                </Show>
                <Show when="signed-in">
                  <UserButton showName />
                </Show>
              </div>
            </header>
            {children}
          </TRPCReactProvider>
        </body>
      </html>
    </ClerkProvider>
  )
}
