import { describe, expect, it } from 'vitest'
import { PROGRAM_EVENT, VIDEO_EVENT } from '@virtality/shared/types'
import { createSimulatedHeadset, type Emit } from './simulated-headset'

const exercises = [
  { id: 'ex-1', sets: 2, reps: 2, restTime: 0, holdTime: 0, speed: 1 },
  { id: 'ex-2', sets: 1, reps: 1, restTime: 0, holdTime: 0, speed: 1 },
]

const programStart = {
  exerciseData: exercises,
  settings: { avatarId: 'a', sessionNumber: 1, mapId: 'm' },
}

const json = (value: unknown) => JSON.stringify(value)
const jsonEmitted = (event: string, value: unknown): Emit => ({
  event,
  payload: json(value),
})

describe('program acks', () => {
  it.each<[string, unknown, string]>([
    [PROGRAM_EVENT.Start, programStart, PROGRAM_EVENT.StartAck],
    [PROGRAM_EVENT.Pause, undefined, PROGRAM_EVENT.PauseAck],
    [PROGRAM_EVENT.End, undefined, PROGRAM_EVENT.EndAck],
    [PROGRAM_EVENT.ChangeExercise, 'ex-1', PROGRAM_EVENT.ChangeExerciseAck],
    [
      PROGRAM_EVENT.SettingsChange,
      exercises[0],
      PROGRAM_EVENT.SettingsChangeAck,
    ],
    [PROGRAM_EVENT.WarmupStart, { settings: {} }, PROGRAM_EVENT.WarmupStartAck],
    [PROGRAM_EVENT.WarmupEnd, undefined, PROGRAM_EVENT.WarmupEndAck],
    [PROGRAM_EVENT.SittingChange, true, PROGRAM_EVENT.SittingChangeAck],
    [
      PROGRAM_EVENT.CalibrateHeight,
      undefined,
      PROGRAM_EVENT.CalibrateHeightAck,
    ],
    [PROGRAM_EVENT.ResetPosition, undefined, PROGRAM_EVENT.ResetPositionAck],
  ])('%s', (event, payload, ack) => {
    const headset = createSimulatedHeadset()
    expect(headset.handle(event, payload)).toEqual<Emit[]>([{ event: ack }])
  })
})

function collect(
  headset: ReturnType<typeof createSimulatedHeadset>,
  from: number,
  to: number,
  step: number,
) {
  const out: Emit[] = []
  for (let now = from; now <= to; now += step) out.push(...headset.tick(now))
  return out
}

describe('program progress', () => {
  const repIntervalMs = 100

  it('does nothing before a program starts', () => {
    const headset = createSimulatedHeadset({ repIntervalMs })
    expect(collect(headset, 0, 1000, 100)).toEqual([])
  })

  it('walks reps, sets and exercises, then ends the program', () => {
    const headset = createSimulatedHeadset({ repIntervalMs })
    headset.handle(PROGRAM_EVENT.Start, programStart)

    const emits = collect(headset, 0, 1000, 50).map((e) => [e.event, e.payload])

    expect(emits).toEqual([
      // ex-1, set 1
      [PROGRAM_EVENT.RepEnd, expect.stringContaining('"previousRep":0')],
      [PROGRAM_EVENT.RepEnd, expect.stringContaining('"previousRep":1')],
      [PROGRAM_EVENT.SetEnd, json({ previousSet: 1 })],
      // ex-1, set 2
      [PROGRAM_EVENT.RepEnd, expect.stringContaining('"previousRep":0')],
      [PROGRAM_EVENT.RepEnd, expect.stringContaining('"previousRep":1')],
      [PROGRAM_EVENT.SetEnd, json({ previousSet: 2 })],
      [PROGRAM_EVENT.ChangeExercise, 'ex-1'],
      // ex-2
      [PROGRAM_EVENT.RepEnd, expect.stringContaining('"previousRep":0')],
      [PROGRAM_EVENT.SetEnd, json({ previousSet: 1 })],
      [PROGRAM_EVENT.End, undefined],
    ])
  })

  it('reports a progress fraction on every rep', () => {
    const headset = createSimulatedHeadset({ repIntervalMs })
    headset.handle(PROGRAM_EVENT.Start, programStart)
    headset.tick(0)
    const [rep] = headset.tick(repIntervalMs)
    const parsed = JSON.parse(rep.payload as string)
    expect(parsed.progress).toBeGreaterThanOrEqual(0)
    expect(parsed.progress).toBeLessThanOrEqual(1)
  })

  it('accepts the JSON-text form of the start payload', () => {
    const headset = createSimulatedHeadset({ repIntervalMs })
    headset.handle(PROGRAM_EVENT.Start, json(programStart))
    headset.tick(0)
    expect(headset.tick(repIntervalMs)).toHaveLength(1)
  })

  it('pauses and resumes on the same event', () => {
    const headset = createSimulatedHeadset({ repIntervalMs })
    headset.handle(PROGRAM_EVENT.Start, programStart)
    headset.handle(PROGRAM_EVENT.Pause)
    expect(collect(headset, 0, 1000, 100)).toEqual([])
    headset.handle(PROGRAM_EVENT.Pause)
    expect(collect(headset, 1000, 1100, 100)).toHaveLength(1)
  })

  it('ignores a start with no exercises', () => {
    const headset = createSimulatedHeadset({ repIntervalMs })
    headset.handle(PROGRAM_EVENT.Start, { ...programStart, exerciseData: [] })
    expect(collect(headset, 0, 1000, 100)).toEqual([])
  })

  it('stops on programEnd', () => {
    const headset = createSimulatedHeadset({ repIntervalMs })
    headset.handle(PROGRAM_EVENT.Start, programStart)
    headset.handle(PROGRAM_EVENT.End)
    expect(collect(headset, 0, 1000, 100)).toEqual([])
  })

  it('jumps to the requested exercise and restarts its count', () => {
    const headset = createSimulatedHeadset({ repIntervalMs })
    headset.handle(PROGRAM_EVENT.Start, programStart)
    headset.tick(100)
    headset.handle(PROGRAM_EVENT.ChangeExercise, 'ex-2')
    expect(collect(headset, 200, 300, 100).map((e) => e.event)).toEqual([
      PROGRAM_EVENT.RepEnd,
      PROGRAM_EVENT.SetEnd,
      PROGRAM_EVENT.End,
    ])
  })
})

describe('video library', () => {
  const downloadDurationMs = 1000
  const progressIntervalMs = 250

  const create = () =>
    createSimulatedHeadset({ downloadDurationMs, progressIntervalMs })

  it('starts with an empty library', () => {
    const [state] = create().handle(VIDEO_EVENT.LibraryStateRequest)
    expect(state.event).toBe(VIDEO_EVENT.LibraryState)
    const parsed = JSON.parse(state.payload as string)
    expect(parsed.videos).toEqual([])
    expect(parsed.freeBytes).toBeGreaterThan(0)
  })

  it('acks a download start with the bare videoId', () => {
    expect(create().handle(VIDEO_EVENT.DownloadStart, 'vid-1')).toEqual([
      { event: VIDEO_EVENT.DownloadAck, payload: 'vid-1' },
    ])
  })

  it('fails a fail- prefixed id as unavailable instead of acking', () => {
    expect(create().handle(VIDEO_EVENT.DownloadStart, 'fail-x')).toEqual([
      jsonEmitted(VIDEO_EVENT.DownloadFailed, {
        videoId: 'fail-x',
        reason: 'unavailable',
      }),
    ])
  })

  it('ticks progress, completes, and then lists the video as ready', () => {
    const headset = create()
    headset.handle(VIDEO_EVENT.DownloadStart, 'vid-1')

    const emits = collect(headset, 0, 1000, 50)
    const events = emits.map((e) => e.event)

    expect(
      events.filter((e) => e === VIDEO_EVENT.DownloadProgress),
    ).toHaveLength(3)
    expect(events.at(-1)).toBe(VIDEO_EVENT.DownloadComplete)
    expect(emits.at(-1)?.payload).toBe('vid-1')

    const progress = emits
      .filter((e) => e.event === VIDEO_EVENT.DownloadProgress)
      .map((e) => JSON.parse(e.payload as string))
    expect(progress[0].videoId).toBe('vid-1')
    expect(progress[0].bytesDownloaded).toBeLessThan(
      progress[2].bytesDownloaded,
    )
    expect(progress[2].bytesDownloaded).toBeLessThanOrEqual(
      progress[2].sizeBytes,
    )

    expect(headset.tick(2000)).toEqual([])

    const [state] = headset.handle(VIDEO_EVENT.LibraryStateRequest)
    expect(JSON.parse(state.payload as string).videos).toEqual([
      { videoId: 'vid-1', status: 'ready' },
    ])
  })

  it('ticks 0/0 and completes an already-ready video immediately', () => {
    const headset = create()
    headset.handle(VIDEO_EVENT.DownloadStart, 'vid-1')
    collect(headset, 0, 1000, 50)
    expect(headset.handle(VIDEO_EVENT.DownloadStart, 'vid-1')).toEqual([
      { event: VIDEO_EVENT.DownloadAck, payload: 'vid-1' },
      jsonEmitted(VIDEO_EVENT.DownloadProgress, {
        videoId: 'vid-1',
        bytesDownloaded: 0,
        sizeBytes: 0,
      }),
      { event: VIDEO_EVENT.DownloadComplete, payload: 'vid-1' },
    ])
  })

  it('acks a cancel without stopping the download, like the headset build', () => {
    const headset = create()
    headset.handle(VIDEO_EVENT.DownloadStart, 'vid-1')
    expect(headset.handle(VIDEO_EVENT.DownloadCancel, 'vid-1')).toEqual([
      { event: VIDEO_EVENT.DownloadCancelAck, payload: 'vid-1' },
    ])
    expect(collect(headset, 0, 1000, 50).at(-1)?.event).toBe(
      VIDEO_EVENT.DownloadComplete,
    )
  })

  it('deletes a ready video', () => {
    const headset = create()
    headset.handle(VIDEO_EVENT.DownloadStart, 'vid-1')
    collect(headset, 0, 1000, 50)
    expect(headset.handle(VIDEO_EVENT.Delete, 'vid-1')).toEqual([
      { event: VIDEO_EVENT.DeleteAck, payload: 'vid-1' },
    ])
    const [state] = headset.handle(VIDEO_EVENT.LibraryStateRequest)
    expect(JSON.parse(state.payload as string).videos).toEqual([])
  })

  it('deleting an in-flight download stops it', () => {
    const headset = create()
    headset.handle(VIDEO_EVENT.DownloadStart, 'vid-1')
    headset.tick(0)
    headset.handle(VIDEO_EVENT.Delete, 'vid-1')
    expect(collect(headset, 100, 2000, 50)).toEqual([])
  })

  it.each([
    [VIDEO_EVENT.Play, VIDEO_EVENT.PlayAck],
    [VIDEO_EVENT.Stop, VIDEO_EVENT.StopAck],
  ])('%s acks with the videoId', (event, ack) => {
    expect(create().handle(event, 'vid-1')).toEqual([
      { event: ack, payload: 'vid-1' },
    ])
  })

  it.each([
    VIDEO_EVENT.DownloadPause,
    VIDEO_EVENT.Pause,
    VIDEO_EVENT.Recenter,
    'onRequestOffer',
    'roomComplete',
    'something-unknown',
  ])('ignores %s', (event) => {
    expect(create().handle(event, 'x')).toEqual([])
  })
})
