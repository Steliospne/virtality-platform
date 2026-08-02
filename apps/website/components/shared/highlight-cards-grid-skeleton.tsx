import { Skeleton } from '@virtality/ui/components/skeleton'
import { HIGHLIGHT_CARD_MAX_PER_COLLECTION } from '@virtality/shared/types'

type HighlightCardsGridSkeletonProps = {
  count?: number
}

const HighlightCardSkeleton = () => {
  return (
    <>
      <div className='flex items-center gap-3 rounded-xl border border-vital-blue-100/70 bg-white/90 p-4 shadow-sm sm:hidden dark:border-zinc-700 dark:bg-zinc-800'>
        <Skeleton className='size-10 shrink-0 rounded-lg bg-vital-blue-100 dark:bg-zinc-700' />
        <Skeleton className='h-5 flex-1 bg-slate-200 dark:bg-zinc-700' />
        <Skeleton className='size-5 shrink-0 rounded bg-slate-200 dark:bg-zinc-700' />
      </div>

      <div className='hidden rounded-2xl border-2 border-vital-blue-100/50 bg-white p-8 shadow-sm sm:block dark:border-zinc-700 dark:bg-zinc-800'>
        <div className='flex h-full flex-col'>
          <Skeleton className='mb-5 size-14 rounded-xl bg-vital-blue-100 dark:bg-zinc-700' />
          <Skeleton className='mb-4 h-7 w-3/4 bg-slate-200 dark:bg-zinc-700' />
          <div className='flex flex-1 flex-col gap-2'>
            <Skeleton className='h-4 w-full bg-slate-200 dark:bg-zinc-700' />
            <Skeleton className='h-4 w-full bg-slate-200 dark:bg-zinc-700' />
            <Skeleton className='h-4 w-5/6 bg-slate-200 dark:bg-zinc-700' />
          </div>
          <div className='mt-6 border-t border-vital-blue-100 pt-4 dark:border-zinc-700'>
            <Skeleton className='h-1 w-1/3 rounded-full bg-vital-blue-100 dark:bg-zinc-700' />
          </div>
        </div>
      </div>
    </>
  )
}

const HighlightCardsGridSkeleton = ({
  count = HIGHLIGHT_CARD_MAX_PER_COLLECTION,
}: HighlightCardsGridSkeletonProps) => {
  return (
    <div
      role='status'
      aria-label='Loading highlight cards'
      className='mx-auto grid max-w-7xl gap-3 sm:grid-cols-2 sm:gap-6 lg:grid-cols-3'
    >
      {Array.from({ length: count }, (_, index) => (
        <HighlightCardSkeleton key={index} />
      ))}
      <span className='sr-only'>Loading…</span>
    </div>
  )
}

export default HighlightCardsGridSkeleton
