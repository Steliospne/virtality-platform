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

/** The playback bar only means something once the headset reports position. */
export function shouldShowImmersivePlaybackBar(
  status: ImmersivePlaybackStatus,
): boolean {
  return isPlayingOrPaused(status)
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
