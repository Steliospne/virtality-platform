import { formatDurationLabel } from '@/lib/headset-library-format'
import {
  isPlayingOrPaused,
  type ImmersivePlaybackStatus,
} from '@/lib/immersive-video-playback-reducer'

export function formatPlaybackClock(
  positionSec: number,
  durationSec: number,
): { elapsed: string; remaining: string; ratio: number } {
  const duration = Math.max(0, durationSec)
  const position = Math.max(0, Math.min(positionSec, duration || positionSec))
  const remaining = Math.max(0, duration - position)
  return {
    elapsed: formatDurationLabel(Math.floor(position)) ?? '0:00',
    remaining: `-${formatDurationLabel(Math.floor(remaining)) ?? '0:00'}`,
    ratio: duration > 0 ? position / duration : 0,
  }
}

export function immersiveStatusBadge(input: {
  status: ImmersivePlaybackStatus
  headsetName: string | null
}): string {
  if (input.status === 'Playing') {
    return input.headsetName ? `Playing on ${input.headsetName}` : 'Playing'
  }
  if (input.status === 'Paused') {
    return 'Paused'
  }
  return 'Ready to start'
}

export function immersiveHintLine(input: {
  status: ImmersivePlaybackStatus
}): string | null {
  if (isPlayingOrPaused(input.status)) return null
  return 'Ask the patient to face forward, then press play.'
}
