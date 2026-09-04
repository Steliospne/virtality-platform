import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
} from '@virtality/ui/components/card'
import { Separator } from '@virtality/ui/components/separator'
import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/utils'

function ProfileTabsSkeleton() {
  const tabs = ['Info', 'Billing', 'Sessions'] as const

  return (
    <div className='flex flex-col gap-2'>
      <div className='inline-flex h-9 w-full items-center justify-center gap-2 rounded-lg bg-zinc-100 p-0.75 dark:bg-zinc-800'>
        {tabs.map((tab, index) => (
          <div
            key={tab}
            className={
              index === 0
                ? 'inline-flex h-[calc(100%-1px)] flex-1 items-center justify-center gap-1.5 rounded-md border border-zinc-400 bg-white px-2 py-1 shadow-sm dark:border-zinc-600 dark:bg-zinc-200/30'
                : 'inline-flex h-[calc(100%-1px)] flex-1 items-center justify-center gap-1.5 rounded-md border border-zinc-400 px-2 py-1 dark:border-zinc-800'
            }
          >
            <Skeleton className='size-4 shrink-0 rounded-sm' />
            <Skeleton className='h-4 w-14 rounded-md' />
          </div>
        ))}
      </div>
    </div>
  )
}

function ProfileFieldSkeleton({
  labelWidth = 'w-24',
}: {
  labelWidth?: string
}) {
  return (
    <div className='flex w-full flex-col gap-3'>
      <Skeleton className={cn('h-7 rounded-md', labelWidth)} />
      <Skeleton className='h-4 w-full max-w-md rounded-md' />
      <Skeleton className='h-10 w-full rounded-md' />
      <Skeleton className='h-4 w-56 rounded-md' />
    </div>
  )
}

function ProfileImageFieldSkeleton() {
  return (
    <div className='flex w-full flex-col gap-3'>
      <Skeleton className='h-7 w-16 rounded-md' />
      <Skeleton className='h-4 w-72 max-w-full rounded-md' />
      <Skeleton className='ml-auto size-24 rounded-full' />
      <Skeleton className='h-4 w-64 rounded-md' />
    </div>
  )
}

function ProfileSignInMethodsSkeleton() {
  return (
    <div className='flex w-full flex-col gap-3'>
      <Skeleton className='h-7 w-44 rounded-md' />
      <div className='flex flex-wrap gap-2'>
        <Skeleton className='h-10 w-44 rounded-md' />
        <Skeleton className='h-10 w-40 rounded-md' />
      </div>
    </div>
  )
}

function ProfilePrimaryCardSkeleton() {
  return (
    <Card>
      <CardContent>
        <div className='mb-6 flex w-full flex-col gap-7'>
          <ProfileImageFieldSkeleton />
          <Separator />
          <ProfileFieldSkeleton labelWidth='w-16' />
          <Separator />
          <ProfileFieldSkeleton labelWidth='w-32' />
          <Separator />
          <ProfileSignInMethodsSkeleton />
        </div>
      </CardContent>
      <CardFooter className='border-t'>
        <Skeleton className='h-10 w-32 rounded-md' />
        <Skeleton className='ml-auto h-10 w-16 rounded-md' />
      </CardFooter>
    </Card>
  )
}

function ProfileEmailCardSkeleton() {
  return (
    <Card>
      <CardContent>
        <div className='mb-6 flex w-full flex-col gap-7'>
          <ProfileFieldSkeleton labelWidth='w-14' />
        </div>
      </CardContent>
      <CardFooter className='border-t'>
        <Skeleton className='ml-auto h-10 w-28 rounded-md' />
      </CardFooter>
    </Card>
  )
}

function ProfilePasswordCardSkeleton() {
  return (
    <Card>
      <CardHeader>
        <Skeleton className='h-7 w-24 rounded-md' />
      </CardHeader>
      <CardContent>
        <Skeleton className='h-10 w-full rounded-md' />
      </CardContent>
      <CardFooter className='border-t'>
        <Skeleton className='ml-auto h-10 w-24 rounded-md' />
      </CardFooter>
    </Card>
  )
}

function ProfileDeleteAccountCardSkeleton() {
  return (
    <Card>
      <CardHeader>
        <Skeleton className='h-7 w-40 rounded-md' />
      </CardHeader>
      <CardContent className='space-y-2'>
        <Skeleton className='h-4 w-full rounded-md' />
        <Skeleton className='h-4 w-11/12 rounded-md' />
        <Skeleton className='h-4 w-10/12 rounded-md' />
      </CardContent>
      <CardFooter className='border-t'>
        <Skeleton className='ml-auto h-10 w-40 rounded-md' />
      </CardFooter>
    </Card>
  )
}

function ProfileInfoSkeleton() {
  return (
    <div className='flex flex-col gap-6 rounded-lg'>
      <ProfilePrimaryCardSkeleton />
      <ProfileEmailCardSkeleton />
      <ProfilePasswordCardSkeleton />
      <ProfileDeleteAccountCardSkeleton />
    </div>
  )
}

export function ProfileSkeleton() {
  return (
    <div className='h-full dark:bg-zinc-950'>
      <div className='mx-auto max-w-3xl p-4'>
        <div className='flex flex-col gap-2'>
          <ProfileTabsSkeleton />
          <ProfileInfoSkeleton />
        </div>
      </div>
    </div>
  )
}
