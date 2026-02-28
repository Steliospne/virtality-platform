import type { Metadata } from 'next'
import { Geist, Geist_Mono } from 'next/font/google'
import './globals.css'
import { ThemeProvider } from '@/components/ui/ThemeProvider'
import Navbar from '@/components/layout/navbar'
import QueryProvider from '@/context/query-context'
import { Toaster } from '@/components/ui/sonner'

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
})

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
})

export const metadata: Metadata = {
  title: 'Virtality Adminboard',
  description: '',
}

const RootLayout = async ({
  children,
}: Readonly<{
  children: React.ReactNode
}>) => {
  return (
    <html lang='en' suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} min-h-svh antialiased`}
      >
        <QueryProvider>
          <ThemeProvider
            defaultTheme='system'
            attribute='class'
            enableSystem
            disableTransitionOnChange
          >
            <Navbar />
            <main className='min-h-screen-with-header bg-background text-foreground h-full'>
              {children}
            </main>
            <Toaster />
          </ThemeProvider>
        </QueryProvider>
      </body>
    </html>
  )
}

export default RootLayout
