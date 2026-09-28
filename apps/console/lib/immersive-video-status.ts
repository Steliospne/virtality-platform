import { formatDurationLabel } from '@/lib/headset-library-format'
import {
  isPlayingOrPaused,
  type ImmersivePlaybackStatus,
} from '@/lib/immersive-video-playback-reducer'

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

/** The playback bar only means something once the headset reports position. */
/** The time limit bar shows while the headset holds a video under a limit. */
export function shouldShowImmersiveTimeLimitBar(input: {
  status: ImmersivePlaybackStatus
  timeLimitElapsedSec: number | null
}): boolean {
  return input.timeLimitElapsedSec != null && isPlayingOrPaused(input.status)
}

/** A session runs from the play command until playback returns to Idle. */
export function isImmersiveSessionActive(
  status: ImmersivePlaybackStatus,
): boolean {
  return status !== 'Idle'
}

export function formatSessionTimer(elapsedSec: number): string {
  const total = Math.max(0, Math.floor(elapsedSec))
  const hours = Math.floor(total / 3600)
  const rest = formatDurationLabel(total % 3600) ?? '0:00'
  if (hours === 0) return rest
  const [minutes, seconds] = rest.split(':')
  return `${hours}:${minutes.padStart(2, '0')}:${seconds}`
}
