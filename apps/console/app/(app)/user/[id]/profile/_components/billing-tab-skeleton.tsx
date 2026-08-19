import { Skeleton } from '@/components/ui/skeleton'

function PlanCardSkeleton({
  withBadge,
  withListMuted,
}: {
  withBadge: boolean
  withListMuted: boolean
}) {
  return (
    <div className='rounded-xl border-2 border-zinc-200 p-5 dark:border-zinc-800'>
      <div className='flex items-start justify-between gap-3'>
        <div className='space-y-2'>
          <div className='flex flex-wrap items-center gap-2'>
            <Skeleton className='h-6 w-24 rounded-md' />
            {withBadge ? <Skeleton className='h-5 w-44 rounded-md' /> : null}
          </div>
          <Skeleton className='h-4 w-56' />
        </div>
        <div className='space-y-2 text-right'>
          <Skeleton className='ml-auto h-6 w-28' />
          {withListMuted ? <Skeleton className='ml-auto h-4 w-24' /> : null}
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

        <div className='grid gap-3'>
          <PlanCardSkeleton withBadge={false} withListMuted={false} />
          <PlanCardSkeleton withBadge withListMuted={true} />
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
