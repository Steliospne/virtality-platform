'use client'

import { H1, P } from '@/components/ui/typography'
import { ArrowLeft, ArrowUpRight, Sidebar, X } from 'lucide-react'
import { Item, ItemContent, ItemMedia } from '@/components/ui/item'
import { useIsMobile } from '@/hooks/use-mobile'
import { cn } from '@/lib/utils'
import { useRow, useStore } from 'tinybase/ui-react'
import { UserLocalData } from '@/types/models'

import useIsAuthed from '@/hooks/use-is-authed'
import AdminTool from './admin-tool'
import useMounted from '@/hooks/use-mounted'
import { Skeleton } from '@/components/ui/skeleton'
import AccountMismatchDialog from './account-mismatch-dialog'

const Dashboard = ({ isImpersonating }: { isImpersonating?: boolean }) => {
  const { data, isPending } = useIsAuthed()
  const mounted = useMounted()

  const store = useStore()
  const userLocalData = useRow('users', data?.user.id ?? '') as UserLocalData

  const showSuggestionSidebar = userLocalData.dashboardSuggestionSidebar ?? true
  const showSuggestionDropdown =
    userLocalData.dashboardSuggestionDropdown ?? true

  const handleSidebarTipClose = () => {
    if (!data || !showSuggestionSidebar) return

    store?.setCell('users', data.user.id, 'dashboardSuggestionSidebar', false)
  }

  const handleDropdownTipClose = () => {
    if (!data || !showSuggestionDropdown) return
    store?.setCell('users', data.user.id, 'dashboardSuggestionDropdown', false)
  }

  const user = data?.user

  return (
    <section className='h-screen-with-header relative flex flex-col justify-center p-10'>
      <AccountMismatchDialog />
      <AdminTool isImpersonating={isImpersonating} />

      <div className='container'>
        <H1>
          <span>Welcome, </span>
          {isPending || !mounted ? (
            <Skeleton className='inline-block h-6 w-40' />
          ) : (
            <span>{user?.name}</span>
          )}
          <span>, to the</span>
          <span className='text-vital-blue-700'> Virtality </span>
          <span>Console.</span>
        </H1>
      </div>
      <div className='flex flex-1 items-center'>
        {showSuggestionSidebar && (
          <SidebarTip handleSidebarTipClose={handleSidebarTipClose} />
        )}
      </div>

      {showSuggestionDropdown && (
        <DropdownTip handleDropdownTipClose={handleDropdownTipClose} />
      )}
    </section>
  )
}

export default Dashboard

const SidebarTip = ({
  handleSidebarTipClose,
}: {
  handleSidebarTipClose: () => void
}) => {
  const isMobile = useIsMobile()

  return (
    <Item variant='outline' className='relative hover:[&_svg]:block'>
      <ItemMedia variant='icon'>
        {isMobile ? <Sidebar /> : <ArrowLeft />}
      </ItemMedia>
      <ItemContent>
        {isMobile ? (
          <P>Tap this icon in the top navigation bar to open the sidebar.</P>
        ) : (
          <P>
            This is the sidebar, it gives you access to most of the app&apos;s
            features.
          </P>
        )}
      </ItemContent>
      <X
        onClick={handleSidebarTipClose}
        className={cn(
          'bg-card hover:bg-accent absolute -top-2.5 -right-2.5 hidden rounded-full border p-1',
          isMobile && 'block',
        )}
      />
    </Item>
  )
}

const DropdownTip = ({
  handleDropdownTipClose,
}: {
  handleDropdownTipClose: () => void
}) => {
  const isMobile = useIsMobile()

  return (
    <Item
      variant='outline'
      className='bg-card absolute top-4 right-10 m-2 hover:[&_svg]:block'
    >
      <ItemContent>
        <P>Click your name or avatar to open your account menu.</P>
      </ItemContent>
      <ItemMedia variant='icon'>
        <ArrowUpRight />
      </ItemMedia>
      <X
        onClick={handleDropdownTipClose}
        className={cn(
          'bg-card hover:bg-accent absolute -top-2.5 -left-2.5 hidden rounded-full border p-1',
          isMobile && 'block',
        )}
      />
    </Item>
  )
}
