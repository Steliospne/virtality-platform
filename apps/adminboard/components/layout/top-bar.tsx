'use client'

import Avatar from '@/components/layout/avatar'
import { SidebarTrigger } from '@virtality/ui/components/sidebar'
import { Skeleton } from '@/components/ui/skeleton'
import { authClient } from '@/auth-client'
import Link from 'next/link'

const { useSession } = authClient

const TopBar = () => {
  const { isPending } = useSession()

  if (isPending) return <Skeleton className='h-15 w-full' />

  return (
    <header className='bg-background sticky top-0 z-20 flex h-15 items-center gap-2 border-b px-2'>
      <SidebarTrigger />
      <Link href='/' className='text-lg font-semibold tracking-tight'>
        Adminboard
      </Link>
      <div className='ml-auto'>
        <Avatar />
      </div>
    </header>
  )
}

export default TopBar
