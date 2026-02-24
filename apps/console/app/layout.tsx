import type { Metadata } from 'next'
import { Geist, Geist_Mono } from 'next/font/google'
import '@/app/globals.css'
import Navbar from '@/components/layout/navbar'
import { ThemeProvider } from 'next-themes'
import { ToastContainer } from 'react-toastify'
import TinyBaseProvider from '@/context/tinybase-context'
import TourProvider from '@/context/tour-context'
import { SidebarProvider } from '@/components/ui/sidebar'
import RootSidebar from '@/components/layout/sidebar'
import { settings } from '@/i18n/settings'
import QueryCtxProvider from '@/context/query-context'

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
        className={`${geistSans.variable} ${geistMono.variable} min-h-svh antialiased dark:bg-zinc-950`}
      >
        <QueryCtxProvider>
          <ThemeProvider
            attribute='class'
            defaultTheme='system'
            enableSystem
            disableTransitionOnChange
          >
            <TinyBaseProvider>
              <TourProvider>
                <div id='root'>
                  <SidebarProvider suppressHydrationWarning>
                    <RootSidebar />
                    <main className='w-full'>
                      <Navbar />
                      {children}
                    </main>
                  </SidebarProvider>
                  <ToastContainer
                    position='bottom-right'
                    autoClose={5000}
                    hideProgressBar
                    newestOnTop
                    closeOnClick
                    rtl={false}
                    pauseOnFocusLoss={false}
                    draggable
                    pauseOnHover={false}
                    theme='dark'
                  />
                </div>
              </TourProvider>
            </TinyBaseProvider>
          </ThemeProvider>
        </QueryCtxProvider>
      </body>
    </html>
  )
}
