import { describe, expect, it } from 'vitest'
import {
  formatStopAfterLabel,
  formatTimeLimitProgress,
  isStopAfterOptionAvailable,
  nextTimeLimitStartSec,
  parseCustomStopAfter,
  shouldAutoStopImmersive,
  timeLimitElapsedSec,
} from './immersive-video-auto-stop.js'

const base = {
  elapsedSec: 600,
  stopAfterMin: 10,
  status: 'Playing',
  commandsEnabled: true,
} as const

describe('nextTimeLimitStartSec', () => {
  const start = {
    prevMinutes: null,
    nextMinutes: 20,
    sessionElapsedSec: null,
    startSec: null,
  }

  it('counts from the play command when picked before play', () => {
    expect(nextTimeLimitStartSec(start)).toBe(null)
  })

  it('counts from the pick when picked mid-session', () => {
    expect(nextTimeLimitStartSec({ ...start, sessionElapsedSec: 312 })).toBe(
      312,
    )
  })

  it('keeps the count when a set limit changes', () => {
    expect(
      nextTimeLimitStartSec({
        prevMinutes: 20,
        nextMinutes: 30,
        sessionElapsedSec: 900,
        startSec: 312,
      }),
    ).toBe(312)
    expect(
      nextTimeLimitStartSec({
        prevMinutes: 20,
        nextMinutes: 30,
        sessionElapsedSec: 900,
        startSec: null,
      }),
    ).toBe(null)
  })

  it('forgets the start when the limit is cleared', () => {
    expect(
      nextTimeLimitStartSec({
        prevMinutes: 20,
        nextMinutes: null,
        sessionElapsedSec: 900,
        startSec: 312,
      }),
    ).toBe(null)
  })
})

describe('timeLimitElapsedSec', () => {
  it('counts from the start second', () => {
    expect(
      timeLimitElapsedSec({
        sessionElapsedSec: 400,
        stopAfterMin: 20,
        startSec: 312,
      }),
    ).toBe(88)
    expect(
      timeLimitElapsedSec({
        sessionElapsedSec: 400,
        stopAfterMin: 20,
        startSec: null,
      }),
    ).toBe(400)
  })

  it('is null without a limit or a running session', () => {
    expect(
      timeLimitElapsedSec({
        sessionElapsedSec: 400,
        stopAfterMin: null,
        startSec: null,
      }),
    ).toBe(null)
    expect(
      timeLimitElapsedSec({
        sessionElapsedSec: null,
        stopAfterMin: 20,
        startSec: null,
      }),
    ).toBe(null)
  })
})

describe('formatTimeLimitProgress', () => {
  it('starts at 0:00 with the whole limit remaining', () => {
    expect(
      formatTimeLimitProgress({ elapsedSec: 0, stopAfterMin: 20 }),
    ).toEqual({ elapsed: '0:00', remaining: '-20:00', ratio: 0 })
  })

  it('fills as the limit runs', () => {
    expect(
      formatTimeLimitProgress({ elapsedSec: 300, stopAfterMin: 20 }),
    ).toEqual({ elapsed: '5:00', remaining: '-15:00', ratio: 0.25 })
  })

  it('holds at full while a due stop waits for the headset', () => {
    expect(
      formatTimeLimitProgress({ elapsedSec: 1250, stopAfterMin: 20 }),
    ).toEqual({ elapsed: '20:00', remaining: '-0:00', ratio: 1 })
  })

  it('shows hours for long limits', () => {
    expect(
      formatTimeLimitProgress({ elapsedSec: 60, stopAfterMin: 90 }).remaining,
    ).toBe('-1:29:00')
  })
})

describe('shouldAutoStopImmersive', () => {
  it('stops once the limit has run its length', () => {
    expect(shouldAutoStopImmersive({ ...base, elapsedSec: 599 })).toBe(false)
    expect(shouldAutoStopImmersive(base)).toBe(true)
    expect(shouldAutoStopImmersive({ ...base, elapsedSec: 601 })).toBe(true)
  })

  it('stops a paused video too', () => {
    expect(shouldAutoStopImmersive({ ...base, status: 'Paused' })).toBe(true)
  })

  it('never stops without a limit or a running session', () => {
    expect(shouldAutoStopImmersive({ ...base, stopAfterMin: null })).toBe(false)
    expect(shouldAutoStopImmersive({ ...base, elapsedSec: null })).toBe(false)
  })

  it('waits while the headset does not hold a video', () => {
    expect(shouldAutoStopImmersive({ ...base, status: 'Starting' })).toBe(false)
    expect(shouldAutoStopImmersive({ ...base, status: 'Idle' })).toBe(false)
  })

  it('waits while commands cannot reach the headset', () => {
    expect(shouldAutoStopImmersive({ ...base, commandsEnabled: false })).toBe(
      false,
    )
  })
})

describe('isStopAfterOptionAvailable', () => {
  it('offers every limit while no session runs', () => {
    expect(isStopAfterOptionAvailable({ minutes: 5, elapsedSec: null })).toBe(
      true,
    )
  })

  it('hides limits the running count has already reached', () => {
    expect(isStopAfterOptionAvailable({ minutes: 5, elapsedSec: 299 })).toBe(
      true,
    )
    expect(isStopAfterOptionAvailable({ minutes: 5, elapsedSec: 300 })).toBe(
      false,
    )
    expect(isStopAfterOptionAvailable({ minutes: 10, elapsedSec: 420 })).toBe(
      true,
    )
  })
})

describe('parseCustomStopAfter', () => {
  it('accepts whole minutes in range, ignoring surrounding spaces', () => {
    expect(parseCustomStopAfter({ raw: ' 25 ', elapsedSec: null })).toEqual({
      ok: true,
      minutes: 25,
    })
    expect(parseCustomStopAfter({ raw: '1', elapsedSec: null }).ok).toBe(true)
    expect(parseCustomStopAfter({ raw: '180', elapsedSec: null }).ok).toBe(true)
  })

  it('rejects empty, fractional and non-numeric input', () => {
    for (const raw of ['', '  ', '2.5', 'abc', '1e']) {
      expect(parseCustomStopAfter({ raw, elapsedSec: null })).toEqual({
        ok: false,
        error: 'Enter whole minutes.',
      })
    }
  })

  it('rejects minutes out of range', () => {
    for (const raw of ['0', '-5', '181']) {
      expect(parseCustomStopAfter({ raw, elapsedSec: null }).ok).toBe(false)
    }
  })

  it('rejects a limit the running count has already reached', () => {
    expect(parseCustomStopAfter({ raw: '7', elapsedSec: 420 })).toEqual({
      ok: false,
      error: 'The timer has already run that long.',
    })
    expect(parseCustomStopAfter({ raw: '8', elapsedSec: 420 }).ok).toBe(true)
  })
})

describe('formatStopAfterLabel', () => {
  it('names the limit or its absence', () => {
    expect(formatStopAfterLabel(null)).toBe('No time limit')
    expect(formatStopAfterLabel(25)).toBe('Stop after 25 min')
  })
})
