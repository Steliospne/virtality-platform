import { Skeleton } from '@/components/ui/skeleton'

const DeviceCardSkeleton = () => {
  return (
    <div className='w-full max-w-[320px] space-y-4 rounded-2xl bg-zinc-400 p-6 dark:bg-zinc-900'>
      {/* Status badge skeleton */}
      <div className='flex justify-end'>
        <Skeleton className='h-6 w-24 rounded-full bg-zinc-200 dark:bg-zinc-800' />
      </div>

      {/* VR headset image skeleton */}
      <div className='flex justify-center'>
        <Skeleton className='h-32 w-40 rounded-lg bg-zinc-200 dark:bg-zinc-800' />
      </div>

      {/* Device name skeleton */}
      <div className='space-y-2'>
        <Skeleton className='h-7 w-32 bg-zinc-200 dark:bg-zinc-800' />
        <Skeleton className='h-5 w-24 bg-zinc-500 dark:bg-zinc-700' />
      </div>

      {/* Buttons skeleton */}
      <div className='flex gap-3 pt-4'>
        <Skeleton className='h-11 flex-1 rounded-lg bg-red-500 dark:bg-red-800' />
        <Skeleton className='h-11 flex-1 rounded-lg bg-zinc-500 dark:bg-zinc-700' />
      </div>
    </div>
  )
}

export default DeviceCardSkeleton
