'use client'

import { H1, P } from '@/components/ui/typography'
import { ArrowLeft, ArrowUpRight, Sidebar, X } from 'lucide-react'
import { Item, ItemContent, ItemMedia } from '@/components/ui/item'
import { useIsMobile } from '@/hooks/use-mobile'
import { cn } from '@/lib/utils'
import { useRow, useStore } from 'tinybase/ui-react'
import { UserLocalData } from '@/types/models'
import { useEffect, useState } from 'react'

import useIsAuthed from '@/hooks/use-is-authed'
import AdminTool from './admin-tool'

const Dashboard = ({ isImpersonating }: { isImpersonating?: boolean }) => {
  const { data } = useIsAuthed()

  const store = useStore()
  const userLocalData = useRow('users', data?.user.id ?? '') as UserLocalData
  const [showSuggestionSidebar, setShowSuggestionsSidebar] =
    useState<boolean>(false)
  const [showSuggestionDropdown, setShowSuggestionDropdown] =
    useState<boolean>(false)

  useEffect(() => {
    if (!data) return

    if (userLocalData.dashboardSuggestionSidebar === undefined)
      store?.setCell('users', data.user.id, 'dashboardSuggestionSidebar', true)
    if (userLocalData.dashboardSuggestionDropdown === undefined)
      store?.setCell('users', data.user.id, 'dashboardSuggestionDropdown', true)
    setShowSuggestionsSidebar(userLocalData.dashboardSuggestionSidebar)
    setShowSuggestionDropdown(userLocalData.dashboardSuggestionDropdown)
  }, [store, userLocalData, data])

  const handleSidebarTipClose = () => {
    if (!data) return
    setShowSuggestionsSidebar(false)
    store?.setCell('users', data.user.id, 'dashboardSuggestionSidebar', false)
  }

  const handleDropdownTipClose = () => {
    if (!data) return
    setShowSuggestionDropdown(false)
    store?.setCell('users', data.user.id, 'dashboardSuggestionDropdown', false)
  }

  const user = data?.user

  return (
    <section className='h-screen-with-header relative flex flex-col justify-center p-10'>
      <AdminTool isImpersonating={isImpersonating} />

      <div className='container'>
        <H1>
          Welcome, {user?.name}, to the
          <span className='text-vital-blue-700'> Virtality </span> Console.
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
