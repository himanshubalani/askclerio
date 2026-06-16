import { ClerkProvider, Show, SignInButton, UserAvatar } from '@clerk/nextjs'
import { TRPCReactProvider } from '@/trpc/react'
import { Manrope } from 'next/font/google'
import '@/styles/globals.css'

const manrope = Manrope({ subsets: ['latin'], weight: '400' })

function Header() {
  return (
    <header style={{ display: 'flex', justifyContent: 'space-between', padding: 20 }}>
      <h1 className={manrope.className}>Clerio</h1>
      <div>
        <Show when="signed-in">
          <UserAvatar />
        </Show>
        <Show when="signed-out">
          <SignInButton />
        </Show>
      </div>
    </header>
  )
}

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <ClerkProvider>
        <body className="antialiased">
          <TRPCReactProvider>
            <Header />
            {children}
          </TRPCReactProvider>
        </body>
      </ClerkProvider>
    </html>
  )
}
