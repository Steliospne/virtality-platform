'use client'

import { useImmersiveVideoSession } from '@/context/immersive-video-session-context'
import { formatPlaybackClock } from '@/lib/immersive-video-status'
import { cn } from '@/lib/utils'

export function ImmersiveVideoPlaybackBar({
  className,
}: {
  className?: string
}) {
  const { playback } = useImmersiveVideoSession()
  const { elapsed, remaining, ratio } = formatPlaybackClock(
    playback.state.positionSec,
    playback.state.durationSec,
  )
  const percent = Math.round(ratio * 100)

  return (
    <div className={cn('flex flex-col gap-2', className)}>
      <div className='flex items-center justify-between text-sm'>
        <span>{elapsed}</span>
        <span>{remaining}</span>
      </div>
      <div
        role='progressbar'
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
