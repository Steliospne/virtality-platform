import { Skeleton } from '@/components/ui/skeleton'

export function PatientProfileSkeleton() {
  return (
    <div className='h-screen-with-header p-6 text-white dark:bg-black'>
      <div className='mx-auto max-w-7xl'>
        <Skeleton className='mb-8 h-8 w-48 bg-zinc-200 dark:bg-zinc-800' />

        <div className='grid grid-cols-1 gap-6 lg:grid-cols-2'>
          {/* Patient Information Section */}
          <div className='space-y-6'>
            <div className='rounded-t-md bg-teal-600 p-4'>
              <div className='flex items-center gap-2'>
                <Skeleton className='h-5 w-5 bg-teal-500' />
                <Skeleton className='h-6 w-40 bg-teal-500' />
              </div>
              <Skeleton className='mt-2 h-4 w-56 bg-teal-500' />
            </div>

            <div className='rounded-b-md bg-zinc-400 p-6 dark:bg-zinc-900'>
              {/* Avatar */}
              <div className='mb-8 flex flex-col items-center'>
                <Skeleton className='size-28 rounded-full bg-zinc-500 dark:bg-zinc-700' />
                <Skeleton className='mt-4 h-4 w-40 bg-zinc-500 dark:bg-zinc-700' />
              </div>

              {/* Form Fields */}
              <div className='space-y-6'>
                <div>
                  <Skeleton className='mb-2 h-4 w-20 bg-zinc-500 dark:bg-zinc-700' />
                  <Skeleton className='h-12 w-full bg-zinc-200 dark:bg-zinc-800' />
                </div>

                <div className='grid grid-cols-1 gap-4 md:grid-cols-2'>
                  <div>
                    <Skeleton className='mb-2 h-4 w-16 bg-zinc-500 dark:bg-zinc-700' />
                    <Skeleton className='h-10 w-full bg-zinc-200 dark:bg-zinc-800' />
                  </div>
                  <div>
                    <Skeleton className='mb-2 h-4 w-16 bg-zinc-500 dark:bg-zinc-700' />
                    <Skeleton className='h-10 w-full bg-zinc-200 dark:bg-zinc-800' />
                  </div>
                </div>

                <div className='grid grid-cols-1 gap-4 md:grid-cols-2'>
                  <div>
                    <Skeleton className='mb-2 h-4 w-24 bg-zinc-500 dark:bg-zinc-700' />
                    <Skeleton className='h-10 w-full bg-zinc-200 dark:bg-zinc-800' />
                  </div>
                  <div>
                    <Skeleton className='mb-2 h-4 w-12 bg-zinc-500 dark:bg-zinc-700' />
                    <Skeleton className='h-10 w-full bg-zinc-200 dark:bg-zinc-800' />
                  </div>
                </div>

                <div>
                  <Skeleton className='mb-2 h-4 w-20 bg-zinc-500 dark:bg-zinc-700' />
                  <Skeleton className='h-12 w-full bg-zinc-200 dark:bg-zinc-800' />
                </div>
              </div>
            </div>
          </div>

          {/* Patient History Section */}
          <div className='flex flex-col space-y-6'>
            <div className='rounded-t-md bg-teal-600 p-4'>
              <Skeleton className='h-6 w-32 bg-teal-500' />
              <Skeleton className='mt-2 h-4 w-64 bg-teal-500' />
            </div>

            <div className='flex-1 rounded-b-md bg-zinc-400 p-6 dark:bg-zinc-900'>
              <Skeleton className='mb-4 h-6 w-48 bg-zinc-500 dark:bg-zinc-700' />
              <div className='mb-6 space-y-3'>
                <Skeleton className='h-4 w-full bg-zinc-200 dark:bg-zinc-800' />
                <Skeleton className='h-4 w-full bg-zinc-200 dark:bg-zinc-800' />
                <Skeleton className='h-4 w-3/4 bg-zinc-200 dark:bg-zinc-800' />
                <Skeleton className='h-4 w-full bg-zinc-200 dark:bg-zinc-800' />
                <Skeleton className='h-4 w-5/6 bg-zinc-200 dark:bg-zinc-800' />
              </div>
              <Skeleton className='h-64 w-full rounded bg-zinc-200 dark:bg-zinc-800' />
              <Skeleton className='mt-2 h-4 w-24 bg-zinc-500 dark:bg-zinc-700' />
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className='mt-8 flex justify-end gap-4'>
          <Skeleton className='h-10 w-20 bg-zinc-500 dark:bg-zinc-700' />
          <Skeleton className='h-10 w-20 bg-red-900' />
          <Skeleton className='h-10 w-20 bg-teal-700' />
        </div>
      </div>
    </div>
  )
}
