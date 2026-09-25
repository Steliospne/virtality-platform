import { describe, expect, it } from 'vitest'
import {
  formatStopAfterLabel,
  isStopAfterOptionAvailable,
  parseCustomStopAfter,
  shouldAutoStopImmersive,
} from './immersive-video-auto-stop.js'

const base = {
  elapsedSec: 600,
  stopAfterMin: 10,
  status: 'Playing',
  commandsEnabled: true,
} as const

describe('shouldAutoStopImmersive', () => {
  it('stops once the session clock reaches the limit', () => {
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

  it('hides limits the running session has already reached', () => {
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

  it('rejects a limit the running session has already reached', () => {
    expect(parseCustomStopAfter({ raw: '7', elapsedSec: 420 })).toEqual({
      ok: false,
      error: 'The session has already run that long.',
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
