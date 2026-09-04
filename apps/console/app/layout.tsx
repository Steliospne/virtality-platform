import type { Metadata } from 'next'
import { Geist, Geist_Mono } from 'next/font/google'
import '@/app/globals.css'
import RootProvider from '@/context/root-provider'
import { cn } from '@/lib/utils'

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
})

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
})

export const metadata: Metadata = {
  title: 'Virtality App',
  description: 'Because every move matters.',
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang={'en'} suppressHydrationWarning>
      <body
        className={cn(
          geistSans.variable,
          geistMono.variable,
          'min-h-svh antialiased dark:bg-zinc-950',
        )}
      >
        <RootProvider>{children}</RootProvider>
      </body>
    </html>
  )
}
