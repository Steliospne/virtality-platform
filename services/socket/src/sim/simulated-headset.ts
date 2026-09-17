import {
  PROGRAM_EVENT,
  VIDEO_DEVICE_STATUS,
  VIDEO_DOWNLOAD_FAILURE_REASON,
  VIDEO_EVENT,
  type ExercisePayload,
  type VideoDownloadFailedPayload,
  type VideoDownloadProgressPayload,
  type VideoLibraryStatePayload,
} from '@virtality/shared/types'

export type Emit = { event: string; payload?: unknown }

export type SimulatedHeadset = {
  handle(event: string, payload?: unknown): Emit[]
  tick(now: number): Emit[]
}

export type SimulatedHeadsetOptions = {
  repIntervalMs?: number
  downloadDurationMs?: number
  progressIntervalMs?: number
}

// ── Timing and sizes (the only place these live) ───────────────────────────

export const REP_INTERVAL_MS = 750
export const DOWNLOAD_DURATION_MS = 10_000
export const PROGRESS_INTERVAL_MS = 500
/** Every simulated bundle reports this size; the console draws from the catalog anyway. */
const VIDEO_SIZE_BYTES = 256 * 1024 * 1024
const FREE_BYTES = 64 * 1024 * 1024 * 1024
/** Ids with this prefix fail as `unavailable`, so the console's failure path needs no setup. */
const FAILING_VIDEO_ID_PREFIX = 'fail-'

// ── Payload framing ────────────────────────────────────────────────────────

/**
 * The console emits object payloads as objects, but a peer that mimics the
 * headset's own convention (ADR 0003) sends JSON text. Accept both.
 */
function parsePayload(payload: unknown): unknown {
  if (typeof payload !== 'string') return payload
  const first = payload.trimStart()[0]
  if (first !== '{' && first !== '[') return payload
  try {
    return JSON.parse(payload)
  } catch {
    return payload
  }
}

/** Headset → console object payloads travel as the JSON text the headset serialised. */
function jsonEmit(event: string, payload: unknown): Emit {
  return { event, payload: JSON.stringify(payload) }
}

const PROGRAM_ACK: Readonly<Record<string, string>> = {
  [PROGRAM_EVENT.Start]: PROGRAM_EVENT.StartAck,
  [PROGRAM_EVENT.Pause]: PROGRAM_EVENT.PauseAck,
  [PROGRAM_EVENT.End]: PROGRAM_EVENT.EndAck,
  [PROGRAM_EVENT.ChangeExercise]: PROGRAM_EVENT.ChangeExerciseAck,
  [PROGRAM_EVENT.SettingsChange]: PROGRAM_EVENT.SettingsChangeAck,
  [PROGRAM_EVENT.WarmupStart]: PROGRAM_EVENT.WarmupStartAck,
  [PROGRAM_EVENT.WarmupEnd]: PROGRAM_EVENT.WarmupEndAck,
  [PROGRAM_EVENT.SittingChange]: PROGRAM_EVENT.SittingChangeAck,
  [PROGRAM_EVENT.CalibrateHeight]: PROGRAM_EVENT.CalibrateHeightAck,
  [PROGRAM_EVENT.ResetPosition]: PROGRAM_EVENT.ResetPositionAck,
}

// ── Program ────────────────────────────────────────────────────────────────

type ProgramState = {
  status: 'idle' | 'running' | 'paused'
  exercises: ExercisePayload[]
  exerciseIndex: number
  set: number
  rep: number
  /** Armed lazily by the first tick after (re)start, so `handle` needs no clock. */
  nextRepAt: number | null
}

function idleProgram(): ProgramState {
  return {
    status: 'idle',
    exercises: [],
    exerciseIndex: 0,
    set: 0,
    rep: 0,
    nextRepAt: null,
  }
}

type Download = {
  /** Armed lazily by the first tick, like the rep timer. */
  startedAt: number | null
  lastProgressAt: number
}

function isProgramStart(
  payload: unknown,
): payload is { exerciseData: ExercisePayload[] } {
  return (
    typeof payload === 'object' &&
    payload !== null &&
    Array.isArray((payload as { exerciseData?: unknown }).exerciseData)
  )
}

export function createSimulatedHeadset(
  options: SimulatedHeadsetOptions = {},
): SimulatedHeadset {
  const repIntervalMs = options.repIntervalMs ?? REP_INTERVAL_MS
  const downloadDurationMs = options.downloadDurationMs ?? DOWNLOAD_DURATION_MS
  const progressIntervalMs = options.progressIntervalMs ?? PROGRESS_INTERVAL_MS

  let program = idleProgram()
  /** Ids the headset holds as `ready`. Starts empty; nothing is seeded. */
  const library = new Set<string>()
  const downloads = new Map<string, Download>()

  function handleProgram(event: string, payload: unknown) {
    switch (event) {
      case PROGRAM_EVENT.Start:
        if (isProgramStart(payload) && payload.exerciseData.length > 0) {
          program = {
            ...idleProgram(),
            status: 'running',
            exercises: payload.exerciseData,
          }
        }
        return
      case PROGRAM_EVENT.Pause:
        if (program.status === 'running') {
          program.status = 'paused'
          program.nextRepAt = null
        } else if (program.status === 'paused') {
          program.status = 'running'
        }
        return
      case PROGRAM_EVENT.End:
        program = idleProgram()
        return
      case PROGRAM_EVENT.ChangeExercise: {
        const index = program.exercises.findIndex((ex) => ex.id === payload)
        if (index === -1) return
        program.exerciseIndex = index
        program.set = 0
        program.rep = 0
        program.nextRepAt = null
        return
      }
    }
  }

  /** One rep completes: the same sequence the headset build emits. */
  function completeRep(): Emit[] {
    const emits: Emit[] = []
    const exercise = program.exercises[program.exerciseIndex]

    emits.push(
      jsonEmit(PROGRAM_EVENT.RepEnd, {
        previousRep: program.rep,
        progress: Math.random(),
      }),
    )

    if (program.rep < exercise.reps - 1) {
      program.rep++
      return emits
    }

    program.rep = 0
    program.set++
    emits.push(jsonEmit(PROGRAM_EVENT.SetEnd, { previousSet: program.set }))

    if (program.set < exercise.sets) {
      return emits
    }

    if (program.exerciseIndex < program.exercises.length - 1) {
      // The headset reports the exercise it just completed, not the next one.
      emits.push({ event: PROGRAM_EVENT.ChangeExercise, payload: exercise.id })
      program.exerciseIndex++
      program.set = 0
      return emits
    }

    emits.push({ event: PROGRAM_EVENT.End })
    program = idleProgram()
    return emits
  }

  function tickProgram(now: number): Emit[] {
    if (program.status !== 'running') return []
    if (program.nextRepAt === null) {
      program.nextRepAt = now + repIntervalMs
      return []
    }
    if (now < program.nextRepAt) return []
    program.nextRepAt = now + repIntervalMs
    return completeRep()
  }

  // ── Video library ────────────────────────────────────────────────────────

  function libraryState(): Emit {
    return jsonEmit(VIDEO_EVENT.LibraryState, {
      videos: [...library].map((videoId) => ({
        videoId,
        status: VIDEO_DEVICE_STATUS.Ready,
      })),
      freeBytes: FREE_BYTES,
    } satisfies VideoLibraryStatePayload)
  }

  function startDownload(videoId: string): Emit[] {
    if (videoId.startsWith(FAILING_VIDEO_ID_PREFIX)) {
      return [
        jsonEmit(VIDEO_EVENT.DownloadFailed, {
          videoId,
          reason: VIDEO_DOWNLOAD_FAILURE_REASON.Unavailable,
        } satisfies VideoDownloadFailedPayload),
      ]
    }

    const ack: Emit = { event: VIDEO_EVENT.DownloadAck, payload: videoId }

    if (library.has(videoId)) {
      // An already-cached bundle ticks 0/0 once, then completes.
      return [
        ack,
        jsonEmit(VIDEO_EVENT.DownloadProgress, {
          videoId,
          bytesDownloaded: 0,
          sizeBytes: 0,
        } satisfies VideoDownloadProgressPayload),
        { event: VIDEO_EVENT.DownloadComplete, payload: videoId },
      ]
    }

    downloads.set(videoId, { startedAt: null, lastProgressAt: 0 })
    return [ack]
  }

  function handleVideo(event: string, payload: unknown): Emit[] {
    if (event === VIDEO_EVENT.LibraryStateRequest) return [libraryState()]
    if (typeof payload !== 'string') return []

    switch (event) {
      case VIDEO_EVENT.DownloadStart:
        return startDownload(payload)
      case VIDEO_EVENT.DownloadCancel:
        // The headset build acks a cancel but does not stop a running download.
        return [{ event: VIDEO_EVENT.DownloadCancelAck, payload }]
      case VIDEO_EVENT.Delete:
        library.delete(payload)
        downloads.delete(payload)
        return [{ event: VIDEO_EVENT.DeleteAck, payload }]
      case VIDEO_EVENT.Play:
        return [{ event: VIDEO_EVENT.PlayAck, payload }]
      case VIDEO_EVENT.Stop:
        return [{ event: VIDEO_EVENT.StopAck, payload }]
      default:
        return []
    }
  }

  function tickDownloads(now: number): Emit[] {
    const emits: Emit[] = []

    for (const [videoId, download] of downloads) {
      if (download.startedAt === null) {
        download.startedAt = now
        download.lastProgressAt = now
        continue
      }

      const elapsed = now - download.startedAt
      if (elapsed >= downloadDurationMs) {
        downloads.delete(videoId)
        library.add(videoId)
        emits.push({ event: VIDEO_EVENT.DownloadComplete, payload: videoId })
        continue
      }

      if (now - download.lastProgressAt >= progressIntervalMs) {
        download.lastProgressAt = now
        emits.push(
          jsonEmit(VIDEO_EVENT.DownloadProgress, {
            videoId,
            bytesDownloaded: Math.floor(
              (VIDEO_SIZE_BYTES * elapsed) / downloadDurationMs,
            ),
            sizeBytes: VIDEO_SIZE_BYTES,
          } satisfies VideoDownloadProgressPayload),
        )
      }
    }

    return emits
  }

  // ── Public API ───────────────────────────────────────────────────────────

  function handle(event: string, rawPayload?: unknown): Emit[] {
    const payload = parsePayload(rawPayload)
    handleProgram(event, payload)
    const ack = PROGRAM_ACK[event]
    if (ack) return [{ event: ack }]
    return handleVideo(event, payload)
  }

  function tick(now: number): Emit[] {
    return [...tickProgram(now), ...tickDownloads(now)]
  }

  return { handle, tick }
}
