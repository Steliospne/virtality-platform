import { Skeleton } from '@/components/ui/skeleton'

function PlanCardSkeleton({
  withBadge,
  withListMuted,
  accent = false,
}: {
  withBadge: boolean
  withListMuted: boolean
  accent?: boolean
}) {
  return (
    <div
      className={
        accent
          ? 'border-vital-blue-200 bg-vital-blue-50/60 dark:border-vital-blue-800 dark:bg-vital-blue-950/20 flex h-full min-h-72 flex-col rounded-xl border-2 p-6 sm:min-h-80 sm:p-7'
          : 'flex h-full min-h-72 flex-col rounded-xl border-2 border-zinc-200 p-6 sm:min-h-80 sm:p-7 dark:border-zinc-800'
      }
    >
      <div className='flex min-h-28 flex-col sm:min-h-32'>
        <div className='space-y-2'>
          <div className='flex min-h-12 flex-wrap items-start gap-2'>
            <Skeleton className='h-7 w-24 rounded-md' />
            {withBadge ? <Skeleton className='h-5 w-44 rounded-md' /> : null}
          </div>
          <Skeleton className='h-11 w-full max-w-none sm:h-12' />
        </div>
        <div className='mt-6 min-h-16 space-y-1'>
          <Skeleton className='h-8 w-28' />
          <Skeleton
            className={withListMuted ? 'h-5 w-24' : 'h-5 w-24 opacity-0'}
          />
        </div>
      </div>
    </div>
  )
}

export function BillingTabSkeleton() {
  return (
    <div className='rounded-lg border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-950'>
      <div className='space-y-6'>
        <header className='space-y-2'>
          <Skeleton className='h-3 w-16' />
          <Skeleton className='h-8 w-40' />
          <Skeleton className='h-4 w-72 max-w-full' />
        </header>

        <div className='grid grid-cols-1 gap-4 sm:grid-cols-2'>
          <PlanCardSkeleton withBadge={false} withListMuted={false} />
          <PlanCardSkeleton withBadge withListMuted accent />
        </div>

        <div className='flex items-center gap-2 text-xs text-zinc-500'>
          <Skeleton className='mt-0.5 size-3.5 shrink-0 rounded-md' />
          <Skeleton className='h-4 w-full rounded-md' />
        </div>

        <Skeleton className='h-11 w-full rounded-md' />

        <div className='space-y-2 border-t border-zinc-200 pt-4 dark:border-zinc-800'>
          <Skeleton className='h-4 w-52 rounded-md' />
          <div className='flex gap-2'>
            <Skeleton className='h-10 flex-1 rounded-md' />
            <Skeleton className='h-10 w-28 rounded-md' />
          </div>
          <Skeleton className='h-4 w-64 rounded-md' />
        </div>
      </div>
    </div>
  )
}
