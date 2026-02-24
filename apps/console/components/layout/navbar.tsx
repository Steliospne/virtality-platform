'use client'
import Link from 'next/link'
import Avatar from '@/components/layout/avatar'
import { Button } from '@/components/ui/button'
import { SidebarTrigger } from '@/components/ui/sidebar'
import { Sidebar } from 'lucide-react'
import { Skeleton } from '@/components/ui/skeleton'
import useIsAuthed from '@/hooks/use-is-authed'

const Navbar = () => {
  const { data, isPending } = useIsAuthed()

  if (!data) return null

  if (isPending)
    return (
      <div className='flex h-[60px] items-center justify-between bg-zinc-200/80 px-[8px] py-[4px] dark:border-b-zinc-600 dark:bg-zinc-950'>
        <Skeleton className='bg-accent-foreground size-7' />
        <div className='flex h-12 items-center gap-2'>
          <Skeleton className='bg-accent-foreground h-7 w-48' />
          <Skeleton className='bg-accent-foreground size-12 rounded-full' />
        </div>
      </div>
    )

  return (
    <header className='sticky top-0 z-10 col-span-2 col-start-1 flex h-[60px] border-b bg-zinc-200/80 px-[8px] py-[4px] text-zinc-800 drop-shadow-sm backdrop-blur-xs backdrop-saturate-180 dark:border-b-zinc-600 dark:bg-zinc-950 dark:text-white'>
      <nav className='relative flex w-full items-center gap-6 text-xl font-semibold'>
        <SidebarTrigger>
          <Sidebar />
        </SidebarTrigger>
        <Button asChild variant='ghost' className='ml-auto max-lg:text-sm'>
          <Link href='/'>Dashboard</Link>
        </Button>

        <Avatar />
      </nav>
    </header>
  )
}

export default Navbar
