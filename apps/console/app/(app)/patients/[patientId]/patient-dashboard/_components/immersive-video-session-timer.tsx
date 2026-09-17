'use client'

import { Timer } from 'lucide-react'
import { useImmersiveVideoSession } from '@/context/immersive-video-session-context'
import { useImmersiveSessionTimer } from '@/hooks/use-immersive-session-timer'
import {
  formatSessionTimer,
  isImmersiveSessionActive,
} from '@/lib/immersive-video-status'
import { cn } from '@/lib/utils'

export function ImmersiveVideoSessionTimer({
  className,
}: {
  className?: string
}) {
  const { playback } = useImmersiveVideoSession()
  const elapsedSec = useImmersiveSessionTimer(
    isImmersiveSessionActive(playback.state.status),
  )
  if (elapsedSec == null) return null

  return (
    <span
      aria-label='Session time'
      className={cn(
        'text-muted-foreground flex items-center gap-1 text-sm tabular-nums',
        className,
      )}
    >
      <Timer className='size-4' />
      {formatSessionTimer(elapsedSec)}
    </span>
  )
}
