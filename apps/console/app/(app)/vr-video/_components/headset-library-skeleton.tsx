import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/utils'

const ROW_TITLE_WIDTHS = ['w-48', 'w-36', 'w-56', 'w-40'] as const

export function HeadsetLibrarySkeleton() {
  return (
    <div aria-hidden>
      <div className='mb-4'>
        <Skeleton className='h-5 w-40' />
        <Skeleton className='mt-1.5 h-4 w-32' />
      </div>
      <div className='divide-y'>
        {ROW_TITLE_WIDTHS.map((titleWidth, index) => (
          <div key={index} className='flex items-center gap-3 py-2'>
            <Skeleton className='size-12 shrink-0 rounded' />
            <div className='min-w-0 flex-1'>
              <Skeleton className={cn('h-5', titleWidth)} />
              <Skeleton className='mt-1.5 h-3 w-28' />
            </div>
            <Skeleton className='h-8 w-24 rounded-md' />
          </div>
        ))}
      </div>
    </div>
  )
}
