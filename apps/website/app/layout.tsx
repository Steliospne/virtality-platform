import type { Metadata } from 'next'
import { DM_Sans, JetBrains_Mono } from 'next/font/google'
import './globals.css'
import { ThemeProvider } from '@/context/ThemeProvider'
import Navbar from '@/components/layout/navbar'
import { Toaster } from 'sonner'
import Footer from '@/components/layout/footer'
import CookieBanner from '@/components/layout/cookie-banner'
import {
  getServerUrl,
  getWebsiteUrl,
  ORPC_PREFIX,
} from '@virtality/shared/types'
import { ORPCProvider, QueryProvider } from '@virtality/react-query'
import { cn } from '@/lib/utils'

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

const metaTitle = 'Virtality - Because every move matters'

const metaDescription =
  'Where physiotherapists bridge neuroscience and technology to unlock movement faster.'

const metaImage = '/open-graph/og-image.png'

export const metadata: Metadata = {
  metadataBase: new URL(websiteURL),
  title: metaTitle,
  description: metaDescription,
  openGraph: {
    title: metaTitle,
    description: metaDescription,
    images: [{ url: metaImage, width: 1200, height: 630 }],
  },
  twitter: {
    card: 'summary_large_image',
    title: metaTitle,
    description: metaDescription,
    images: [metaImage],
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
      className='scroll-pt-15 scroll-smooth'
    >
      <body
        className={cn(dmSans.variable, jetbrainsMono.variable, 'antialiased')}
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
              <CookieBanner />
              <Toaster />
            </ORPCProvider>
          </QueryProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}
