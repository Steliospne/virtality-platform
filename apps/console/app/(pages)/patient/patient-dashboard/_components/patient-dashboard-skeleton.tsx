import { Skeleton } from '@/components/ui/skeleton'

export function PatientDashboardSkeleton() {
  return (
    <div className='min-h-screen-with-nav flex text-white dark:bg-black'>
      {/* Left Sidebar */}
      <div className='w-80 border-r p-4 dark:border-zinc-700'>
        <div className='space-y-6'>
          {/* Patient Header */}
          <div className='rounded-lg border bg-zinc-200 p-4 dark:border-zinc-700 dark:bg-zinc-800'>
            <Skeleton className='h-6 w-24 bg-zinc-500 dark:bg-zinc-700' />
          </div>

          {/* Controls Section */}
          <div className='space-y-4'>
            <Skeleton className='h-6 w-16 bg-zinc-500 dark:bg-zinc-700' />

            {/* Mode Dropdown */}
            <Skeleton className='h-12 w-full rounded bg-zinc-200 dark:bg-zinc-800' />

            {/* Start Button */}
            <Skeleton className='h-12 w-full rounded bg-teal-700' />

            {/* Control Buttons */}
            <div className='grid grid-cols-2 gap-2'>
              <Skeleton className='h-12 rounded bg-zinc-200 dark:bg-zinc-800' />
              <Skeleton className='h-12 rounded bg-zinc-200 dark:bg-zinc-800' />
            </div>
          </div>

          {/* Other Controls Section */}
          <div className='space-y-4'>
            <Skeleton className='h-6 w-28 bg-zinc-500 dark:bg-zinc-700' />

            <div className='space-y-2'>
              <Skeleton className='h-12 w-full rounded bg-zinc-200 dark:bg-zinc-800' />
              <Skeleton className='h-12 w-full rounded bg-zinc-200 dark:bg-zinc-800' />
              <Skeleton className='h-12 w-full rounded bg-zinc-200 dark:bg-zinc-800' />
            </div>
          </div>

          {/* Exercises Section */}
          <div className='space-y-4'>
            <Skeleton className='h-6 w-20 bg-zinc-500 dark:bg-zinc-700' />

            <div className='space-y-2'>
              {Array.from({ length: 3 }).map((_, index) => (
                <div
                  key={index}
                  className='flex items-center justify-between rounded border bg-zinc-200 p-3 dark:border-zinc-700 dark:bg-zinc-800'
                >
                  <div className='flex items-center gap-3'>
                    <Skeleton className='h-4 w-4 rounded-full bg-zinc-500 dark:bg-zinc-700' />
                    <Skeleton className='h-5 w-32 bg-zinc-500 dark:bg-zinc-700' />
                  </div>
                  <Skeleton className='h-4 w-4 bg-zinc-500 dark:bg-zinc-700' />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className='flex flex-1 flex-col'>
        {/* Header Bar */}
        <div className='border-b p-4 dark:border-zinc-700'>
          <div className='flex items-center justify-between'>
            <Skeleton className='h-6 w-32 bg-zinc-500 dark:bg-zinc-700' />
            <div className='flex items-center gap-2'>
              <Skeleton className='h-6 w-6 rounded bg-zinc-500 dark:bg-zinc-700' />
              <Skeleton className='h-6 w-6 rounded bg-zinc-500 dark:bg-zinc-700' />
            </div>
          </div>
        </div>

        {/* Content Area */}
        <div className='flex-1 p-6'>
          <div className='h-full rounded-lg border bg-zinc-400 p-6 dark:border-zinc-700 dark:bg-zinc-900'>
            <Skeleton className='mb-8 h-8 w-40 bg-zinc-500 dark:bg-zinc-700' />

            {/* Loading content area */}
            <div className='space-y-4'>
              <Skeleton className='h-4 w-24 bg-zinc-200 dark:bg-zinc-800' />
              <div className='space-y-2'>
                <Skeleton className='h-3 w-full bg-zinc-200 dark:bg-zinc-800' />
                <Skeleton className='h-3 w-3/4 bg-zinc-200 dark:bg-zinc-800' />
                <Skeleton className='h-3 w-1/2 bg-zinc-200 dark:bg-zinc-800' />
              </div>
            </div>

            {/* Chart/Graph placeholder */}
            <div className='mt-8'>
              <Skeleton className='h-64 w-full rounded bg-zinc-200 dark:bg-zinc-800' />
            </div>

            {/* Stats or metrics */}
            <div className='mt-6 grid grid-cols-3 gap-4'>
              <div className='space-y-2 text-center'>
                <Skeleton className='mx-auto h-8 w-16 bg-zinc-200 dark:bg-zinc-800' />
                <Skeleton className='mx-auto h-4 w-20 bg-zinc-500 dark:bg-zinc-700' />
              </div>
              <div className='space-y-2 text-center'>
                <Skeleton className='mx-auto h-8 w-16 bg-zinc-200 dark:bg-zinc-800' />
                <Skeleton className='mx-auto h-4 w-20 bg-zinc-500 dark:bg-zinc-700' />
              </div>
              <div className='space-y-2 text-center'>
                <Skeleton className='mx-auto h-8 w-16 bg-zinc-200 dark:bg-zinc-800' />
                <Skeleton className='mx-auto h-4 w-20 bg-zinc-500 dark:bg-zinc-700' />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
