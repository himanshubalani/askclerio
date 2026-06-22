import { ClerkProvider } from '@clerk/nextjs'
import { TRPCReactProvider } from '@/trpc/react'
import { Geist, Geist_Mono } from 'next/font/google'
import { Analytics } from '@vercel/analytics/next'
import '@/styles/globals.css'

const geistSans = Geist({ variable: '--font-geist-sans', subsets: ['latin'] })
const geistMono = Geist_Mono({ variable: '--font-geist-mono', subsets: ['latin'] })

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <ClerkProvider>
      <html lang="en" className={`${geistSans.variable} ${geistMono.variable}`}>
        <body className="antialiased">
          <TRPCReactProvider>
            {children}
          </TRPCReactProvider>
          <Analytics />
        </body>
      </html>
    </ClerkProvider>
  )
}
