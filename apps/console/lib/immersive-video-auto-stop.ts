import {
  isPlayingOrPaused,
  type ImmersivePlaybackStatus,
} from './immersive-video-playback-reducer'
import { formatSessionTimer } from './immersive-video-status'

/** Minutes the physio can pick for the **Session Time Limit**. */
export const IMMERSIVE_STOP_AFTER_MINUTES = [5, 10, 15, 20, 30, 45, 60] as const

/**
 * Session second the limit counts from; `null` counts from the play command.
 * Picking a limit while none is set starts the count at that moment; changing
 * a set limit keeps the count running.
 */
export function nextTimeLimitStartSec(input: {
  prevMinutes: number | null
  nextMinutes: number | null
  sessionElapsedSec: number | null
  startSec: number | null
}): number | null {
  if (input.nextMinutes == null) return null
  if (input.prevMinutes == null) return input.sessionElapsedSec
  return input.startSec
}

/** Seconds the limit has run; `null` without a limit or a running session. */
export function timeLimitElapsedSec(input: {
  sessionElapsedSec: number | null
  stopAfterMin: number | null
  startSec: number | null
}): number | null {
  const { sessionElapsedSec, stopAfterMin, startSec } = input
  if (sessionElapsedSec == null || stopAfterMin == null) return null
  return Math.max(0, sessionElapsedSec - (startSec ?? 0))
}

/** The time limit bar's labels and fill, held at full once the limit is due. */
export function formatTimeLimitProgress(input: {
  elapsedSec: number
  stopAfterMin: number
}): { elapsed: string; remaining: string; ratio: number } {
  const limitSec = input.stopAfterMin * 60
  const elapsed = Math.max(0, Math.min(input.elapsedSec, limitSec))
  return {
    elapsed: formatSessionTimer(elapsed),
    remaining: `-${formatSessionTimer(limitSec - elapsed)}`,
    ratio: limitSec > 0 ? elapsed / limitSec : 0,
  }
}

/**
 * Stop once the limit has run its length. `videoStop` is only honoured
 * while the headset holds a video, so a limit reached while Starting waits
 * for Playing, and one reached while commands are down waits for the room.
 */
export function shouldAutoStopImmersive(input: {
  elapsedSec: number | null
  stopAfterMin: number | null
  status: ImmersivePlaybackStatus
  commandsEnabled: boolean
}): boolean {
  const { elapsedSec, stopAfterMin, status, commandsEnabled } = input
  if (elapsedSec == null || stopAfterMin == null) return false
  if (!commandsEnabled || !isPlayingOrPaused(status)) return false
  return elapsedSec >= stopAfterMin * 60
}

/**
 * A limit the running count has already reached would stop the video the
 * moment it is picked, so it is offered only while nothing is counting.
 */
export function isStopAfterOptionAvailable(input: {
  minutes: number
  elapsedSec: number | null
}): boolean {
  if (input.elapsedSec == null) return true
  return input.minutes * 60 > input.elapsedSec
}

/** Bounds for a custom **Session Time Limit**, in whole minutes. */
export const IMMERSIVE_STOP_AFTER_CUSTOM_MIN = 1
export const IMMERSIVE_STOP_AFTER_CUSTOM_MAX = 180

export type CustomStopAfterResult =
  | { ok: true; minutes: number }
  | { ok: false; error: string }

/** Reads the physio's typed minutes; same rule as the presets mid-session. */
export function parseCustomStopAfter(input: {
  raw: string
  elapsedSec: number | null
}): CustomStopAfterResult {
  const text = input.raw.trim()
  const minutes = Number(text)
  if (text === '' || !Number.isInteger(minutes)) {
    return { ok: false, error: 'Enter whole minutes.' }
  }
  if (
    minutes < IMMERSIVE_STOP_AFTER_CUSTOM_MIN ||
    minutes > IMMERSIVE_STOP_AFTER_CUSTOM_MAX
  ) {
    return {
      ok: false,
      error: `Enter ${IMMERSIVE_STOP_AFTER_CUSTOM_MIN}–${IMMERSIVE_STOP_AFTER_CUSTOM_MAX} minutes.`,
    }
  }
  if (!isStopAfterOptionAvailable({ minutes, elapsedSec: input.elapsedSec })) {
    return { ok: false, error: 'The timer has already run that long.' }
  }
  return { ok: true, minutes }
}

export function formatStopAfterLabel(stopAfterMin: number | null): string {
  return stopAfterMin == null
    ? 'No time limit'
    : `Stop after ${stopAfterMin} min`
}
