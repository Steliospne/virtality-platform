import {
  isPlayingOrPaused,
  type ImmersivePlaybackStatus,
} from './immersive-video-playback-reducer'

/** Minutes the physio can pick for the **Session Time Limit**. */
export const IMMERSIVE_STOP_AFTER_MINUTES = [5, 10, 15, 20, 30, 45, 60] as const

/**
 * Stop once the session clock reaches the limit. `videoStop` is only honoured
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
 * A limit the running session has already reached would stop the video the
 * moment it is picked, so it is offered only while no session runs.
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
    return { ok: false, error: 'The session has already run that long.' }
  }
  return { ok: true, minutes }
}

export function formatStopAfterLabel(stopAfterMin: number | null): string {
  return stopAfterMin == null
    ? 'No time limit'
    : `Stop after ${stopAfterMin} min`
}
