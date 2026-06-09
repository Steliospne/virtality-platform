import type { Metadata } from 'next'
import { Geist, Geist_Mono } from 'next/font/google'
import './globals.css'
import { ThemeProvider } from '@/components/ui/ThemeProvider'
import Navbar from '@/components/layout/navbar'
import { QueryProvider, ORPCProvider } from '@virtality/react-query'
import { Toaster } from '@/components/ui/sonner'
import { getServerUrl, ORPC_PREFIX } from '@virtality/shared/types'

const baseURL = getServerUrl()

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
          <ORPCProvider url={baseURL + ORPC_PREFIX} credentials='include'>
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
          </ORPCProvider>
        </QueryProvider>
      </body>
    </html>
  )
}

export default RootLayout
