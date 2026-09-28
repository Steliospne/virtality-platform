'use client'

import { useImmersiveVideoSession } from '@/context/immersive-video-session-context'
import { formatTimeLimitProgress } from '@/lib/immersive-video-auto-stop'
import { cn } from '@/lib/utils'

/** How far the **Session Time Limit** has run, from 0:00 to the stop. */
export function ImmersiveVideoTimeLimitBar({
  className,
}: {
  className?: string
}) {
  const { timeLimitElapsedSec, stopAfterMin } = useImmersiveVideoSession()
  if (timeLimitElapsedSec == null || stopAfterMin == null) return null

  const { elapsed, remaining, ratio } = formatTimeLimitProgress({
    elapsedSec: timeLimitElapsedSec,
    stopAfterMin,
  })
  const percent = Math.round(ratio * 100)

  return (
    <div className={cn('flex flex-col gap-2', className)}>
      <div className='flex items-center justify-between text-sm tabular-nums'>
        <span>{elapsed}</span>
        <span>{remaining}</span>
      </div>
      <div
        role='progressbar'
        aria-label='Time limit'
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={percent}
        className='bg-muted h-2 w-full overflow-hidden rounded-full'
      >
        <div
          className='bg-primary h-full rounded-full'
          style={{ width: `${percent}%` }}
        />
      </div>
    </div>
  )
}
