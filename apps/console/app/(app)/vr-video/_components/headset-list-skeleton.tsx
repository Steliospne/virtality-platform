import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/utils'

// Staggered widths so the placeholder rows read as distinct headsets rather
// than a repeated block.
const ROW_NAME_WIDTHS = ['w-32', 'w-24', 'w-36'] as const

export function HeadsetListSkeleton() {
  return (
    <div className='flex flex-col gap-1' aria-hidden>
      {ROW_NAME_WIDTHS.map((nameWidth, index) => (
        <div key={index} className='rounded-lg px-3 py-2'>
          <Skeleton className={cn('h-5', nameWidth)} />
          <Skeleton className='mt-1.5 h-3 w-20' />
          <Skeleton className='mt-1.5 h-3 w-28' />
          <div className='bg-muted mt-2 h-1 overflow-hidden rounded-full'>
            <Skeleton className='h-full w-1/3 rounded-full' />
          </div>
        </div>
      ))}
    </div>
  )
}
