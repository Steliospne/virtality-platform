import type { Metadata } from 'next'
import { DM_Sans, JetBrains_Mono } from 'next/font/google'
import './globals.css'
import { ThemeProvider } from '@/context/ThemeProvider'
import Navbar from '@/components/layout/navbar'
import { Toaster } from 'sonner'
import Footer from '@/components/layout/footer'
import {
  getServerUrl,
  getWebsiteUrl,
  ORPC_PREFIX,
} from '@virtality/shared/types'
import { ORPCProvider, QueryProvider } from '@virtality/react-query'

const dmSans = DM_Sans({
  variable: '--font-dm-sans',
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
})

const jetbrainsMono = JetBrains_Mono({
  variable: '--font-jetbrains-mono',
  subsets: ['latin'],
  weight: ['400', '500', '600'],
})

const websiteURL = getWebsiteUrl()
const baseURL = getServerUrl()

export const metadata: Metadata = {
  metadataBase: new URL(websiteURL),
  title: 'Virtality',
  description: 'Because every move matters.',
  openGraph: {
    title: 'Virtality',
    description: 'Because every move matters.',
    images: [{ url: '/site_front.png', width: 2537, height: 1227 }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Virtality',
    description: 'Because every move matters.',
    images: ['/site_front.png'],
  },
}
export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html
      lang='en'
      suppressHydrationWarning
      className='scroll-pt-[60px] scroll-smooth'
    >
      <body
        className={`${dmSans.variable} ${jetbrainsMono.variable} antialiased`}
      >
        <ThemeProvider
          storageKey='website-theme'
          attribute='class'
          defaultTheme='light'
          disableTransitionOnChange
        >
          <QueryProvider>
            <ORPCProvider url={baseURL + ORPC_PREFIX} credentials='include'>
              <Navbar />
              <main className='min-h-screen-with-nav'>{children}</main>
              <Footer />
              <Toaster />
            </ORPCProvider>
          </QueryProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}
