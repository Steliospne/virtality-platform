import { cookies } from 'next/headers'
import { SidebarProvider, SIDEBAR_COOKIE_NAME } from '@/components/ui/sidebar'
import RootSidebar from '@/components/layout/sidebar'
import Navbar from '@/components/layout/navbar'
import { RenewPromptBanner } from '@/components/layout/renew-prompt-banner'
import { ExpiredFreeUpgradeDialog } from '@/components/layout/expired-free-upgrade-dialog'

export default async function AppLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  const cookieStore = await cookies()
  const defaultOpen = cookieStore.get(SIDEBAR_COOKIE_NAME)?.value !== 'false'

  return (
    <SidebarProvider defaultOpen={defaultOpen} suppressHydrationWarning>
      <RootSidebar />
      <main className='w-full'>
        <Navbar />
        <RenewPromptBanner />
        <ExpiredFreeUpgradeDialog />
        {children}
      </main>
    </SidebarProvider>
  )
}
