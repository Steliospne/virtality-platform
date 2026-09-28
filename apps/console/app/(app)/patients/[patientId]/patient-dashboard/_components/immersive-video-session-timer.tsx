'use client'

import { Timer } from 'lucide-react'
import { useImmersiveVideoSession } from '@/context/immersive-video-session-context'
import { formatSessionTimer } from '@/lib/immersive-video-status'
import { cn } from '@/lib/utils'

export function ImmersiveVideoSessionTimer({
  className,
}: {
  className?: string
}) {
  const { sessionElapsedSec } = useImmersiveVideoSession()
  if (sessionElapsedSec == null) return null

  return (
    <span
      aria-label='Session time'
      className={cn(
        'text-muted-foreground flex items-center gap-1 text-sm tabular-nums',
        className,
      )}
    >
      <Timer className='size-4' />
      {formatSessionTimer(sessionElapsedSec)}
    </span>
  )
}
