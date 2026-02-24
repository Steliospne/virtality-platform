import { Skeleton } from '@/components/ui/skeleton'

const AvatarSkeleton = () => {
  return (
    <div className='flex items-center gap-2'>
      <Skeleton className='h-6 w-40' />
      <Skeleton className='size-12 rounded-full' />
    </div>
  )
}

export default AvatarSkeleton
