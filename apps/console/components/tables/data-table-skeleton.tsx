import { Skeleton } from '@/components/ui/skeleton'

export function DataTableSkeleton() {
  return (
    <div className='min-h-screen-with-nav bg-zinc-200 p-6 text-white dark:bg-zinc-950'>
      <div className='mx-auto max-w-7xl'>
        {/* Header */}
        <div className='mb-6 flex items-center justify-between'>
          <Skeleton className='h-10 w-64 bg-zinc-500 dark:bg-zinc-800' />
          <div className='flex items-center gap-2'>
            <Skeleton className='size-6 bg-zinc-400 dark:bg-zinc-800' />
            <Skeleton className='size-6 bg-zinc-400 dark:bg-zinc-800' />
            <Skeleton className='size-6 bg-zinc-400 dark:bg-zinc-800' />
          </div>
          <Skeleton className='h-10 w-32 bg-teal-700' />
        </div>

        {/* Table */}
        <div className='overflow-hidden rounded-lg border border-zinc-500 bg-zinc-400 dark:border-zinc-800 dark:bg-zinc-900'>
          {/* Table Header */}
          <div className='border-b border-zinc-500 p-4 dark:border-zinc-800'>
            <div className='grid grid-cols-12 gap-4'>
              <div className='col-span-1'>
                <Skeleton className='h-5 w-4 bg-zinc-300 dark:bg-zinc-800' />
              </div>
              <div className='col-span-8'>
                <Skeleton className='h-5 w-16 bg-zinc-300 dark:bg-zinc-800' />
              </div>
              <div className='col-span-3'>{/* Empty space for actions */}</div>
            </div>
          </div>

          {/* Table Rows */}
          {Array.from({ length: 8 }).map((_, index) => (
            <div
              key={index}
              className='border-b border-zinc-500 p-4 last:border-b-0 dark:border-zinc-800'
            >
              <div className='grid grid-cols-12 items-center gap-4'>
                <div className='col-span-1'>
                  <Skeleton className='h-5 w-4 bg-zinc-200 dark:bg-zinc-800' />
                </div>
                <div className='col-span-8'>
                  <Skeleton className='h-5 w-32 bg-zinc-200 dark:bg-zinc-800' />
                </div>
                <div className='col-span-3 flex justify-end'>
                  <Skeleton className='size-6 bg-zinc-200 dark:bg-zinc-800' />
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Pagination */}
        <div className='mt-6 flex items-center justify-between'>
          <div className='flex items-center gap-2'>
            <Skeleton className='h-5 w-24 bg-zinc-400 dark:bg-zinc-800' />
            <Skeleton className='h-8 w-16 bg-zinc-400 dark:bg-zinc-800' />
          </div>

          <div className='flex items-center gap-4'>
            <Skeleton className='h-5 w-20 bg-zinc-400 dark:bg-zinc-800' />
            <div className='flex gap-2'>
              <Skeleton className='h-8 w-20 bg-zinc-400 dark:bg-zinc-800' />
              <Skeleton className='h-8 w-16 bg-zinc-400 dark:bg-zinc-800' />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
