'use client'

import Link from 'next/link'
import { ArrowRight } from 'lucide-react'
import { Button } from '@virtality/ui/components/button'
import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/utils'
import {
  formatHomeWindow,
  formatWeekDelta,
  type HomeSessionsSummary,
} from '@/lib/home-sessions-summary'
import SessionsChart from './sessions-chart'
import SessionsSideStats from './sessions-side-stats'
import HomeSectionLabel from './home-section-label'

const SessionsOverviewCard = ({
  summary,
  isLoading,
}: {
  summary: HomeSessionsSummary
  isLoading: boolean
}) => {
  const delta = summary.deltaVsPriorWeek

  return (
    <section className='bg-card text-card-foreground grid overflow-hidden rounded-xl border shadow-sm lg:grid-cols-[minmax(0,1fr)_300px]'>
      <div className='flex min-w-0 flex-col gap-3.5 p-6'>
        <div className='flex items-center justify-between'>
          <HomeSectionLabel>Sessions · last 7 days</HomeSectionLabel>
          <Button asChild variant='ghost' size='sm'>
            <Link href='/patients'>
              All patients <ArrowRight />
            </Link>
          </Button>
        </div>
        <div className='flex items-baseline gap-2.5'>
          {isLoading ? (
            <Skeleton className='h-8 w-12' />
          ) : (
            <>
              <span className='text-3xl leading-none font-semibold tabular-nums'>
                {summary.total}
              </span>
              <span
                className={cn(
                  'rounded px-1.5 py-px text-[13px] font-semibold tabular-nums',
                  delta > 0 &&
                    'bg-green-50 text-green-700 dark:bg-green-500/10 dark:text-green-300',
                  delta < 0 &&
                    'bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-300',
                  delta === 0 && 'bg-muted text-muted-foreground',
                )}
              >
                {formatWeekDelta(delta)}
              </span>
            </>
          )}
          <span className='text-muted-foreground ml-auto text-[13px]'>
            {formatHomeWindow(summary.windowStart, summary.windowEnd)}
          </span>
        </div>
        <SessionsChart days={summary.days} />
      </div>
      <SessionsSideStats summary={summary} isLoading={isLoading} />
    </section>
  )
}

export default SessionsOverviewCard
