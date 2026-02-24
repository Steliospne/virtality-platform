import { cn } from '@/lib/utils'
import { Skeleton } from '@/components/ui/skeleton'

const SidebarSkeleton = ({ isOpen }: { isOpen: boolean }) => {
  return (
    <div
      className={cn(
        'min-h-screen-with-header h-screen-with-header fixed z-40 flex w-16 flex-col justify-between border-r bg-zinc-200 shadow-lg lg:w-56 dark:border-r-zinc-600 dark:bg-zinc-950',
        isOpen && 'w-56',
      )}
    >
      <div>
        <div className='mx-1 my-4 flex gap-2'>
          <Skeleton
            className={cn('h-6 w-8 p-4 dark:bg-zinc-700', !isOpen && 'w-6')}
          />
          <Skeleton
            className={cn(
              'h-6 w-full p-4 dark:bg-zinc-700',
              !isOpen && 'hidden',
            )}
          />
        </div>
        <div className='mx-1 my-4 flex gap-2'>
          <Skeleton
            className={cn('h-6 w-8 p-4 dark:bg-zinc-700', !isOpen && 'w-6')}
          />
          <Skeleton
            className={cn(
              'h-6 w-full p-4 dark:bg-zinc-700',
              !isOpen && 'hidden',
            )}
          />
        </div>
        <div className='mx-1 my-4 flex gap-2'>
          <Skeleton
            className={cn('h-6 w-8 p-4 dark:bg-zinc-700', !isOpen && 'w-6')}
          />
          <Skeleton
            className={cn(
              'h-6 w-full p-4 dark:bg-zinc-700',
              !isOpen && 'hidden',
            )}
          />
        </div>
      </div>

      <div className='mx-auto mb-6'>
        <Skeleton
          className={cn(
            'h-[176px] w-[190px] p-8 dark:bg-zinc-700',
            !isOpen && 'size-6',
          )}
        />
      </div>
    </div>
  )
}

export default SidebarSkeleton
