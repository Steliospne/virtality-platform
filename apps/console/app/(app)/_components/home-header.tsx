'use client'

import Link from 'next/link'
import { Play } from 'lucide-react'
import { Button } from '@virtality/ui/components/button'
import { Skeleton } from '@/components/ui/skeleton'
import { START_SESSION_ANCHOR } from '@/lib/home-getting-started'

export function homeGreeting(hour: number): string {
  if (hour < 12) return 'Good morning'
  if (hour < 18) return 'Good afternoon'
  return 'Good evening'
}

const HomeHeader = ({
  name,
  now,
  isPending,
}: {
  name: string | undefined
  now: Date
  isPending: boolean
}) => {
  const firstName = name?.trim().split(/\s+/)[0]

  return (
    <div className='flex flex-wrap items-end justify-between gap-4'>
      <div>
        <p className='text-muted-foreground text-[11px] font-semibold tracking-[0.08em] uppercase'>
          Dashboard
        </p>
        <h1 className='text-3xl leading-10 font-bold text-balance'>
          {isPending ? (
            <Skeleton className='inline-block h-8 w-64 align-middle' />
          ) : (
            <>
              {homeGreeting(now.getHours())}
              {firstName ? `, ${firstName}` : ''}
            </>
          )}
        </h1>
      </div>
      <Button asChild variant='primary'>
        <Link href={`#${START_SESSION_ANCHOR}`}>
          <Play className='fill-current' />
          Start a session
        </Link>
      </Button>
    </div>
  )
}

export default HomeHeader
