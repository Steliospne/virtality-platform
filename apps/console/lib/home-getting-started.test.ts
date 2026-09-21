import { describe, expect, it } from 'vitest'
import {
  buildGettingStarted,
  gettingStartedHeadline,
} from './home-getting-started'

describe('buildGettingStarted', () => {
  it('marks nothing done for a fresh account and points at pairing', () => {
    const result = buildGettingStarted({
      deviceCount: 0,
      pairedDeviceCount: 0,
      patientCount: 0,
      programCount: 0,
      sessionCount: 0,
    })

    expect(result.doneCount).toBe(0)
    expect(result.complete).toBe(false)
    expect(result.steps.map((s) => s.current)).toEqual([
      true,
      false,
      false,
      false,
    ])
    expect(gettingStartedHeadline(result)).toBe(
      'Four steps left before your first session.',
    )
  })

  it('needs a paired headset, not just an added one', () => {
    const result = buildGettingStarted({
      deviceCount: 1,
      pairedDeviceCount: 0,
      patientCount: 1,
      programCount: 0,
      sessionCount: 0,
    })

    expect(result.steps[0]).toMatchObject({
      done: false,
      current: true,
      detail: 'A headset is added but not paired yet.',
    })
    expect(result.steps[1]?.done).toBe(true)
    expect(result.doneCount).toBe(1)
  })

  it('makes the first open step current even when later ones are done', () => {
    const result = buildGettingStarted({
      deviceCount: 1,
      pairedDeviceCount: 1,
      patientCount: 1,
      programCount: 0,
      sessionCount: 0,
    })

    expect(result.steps.map((s) => s.current)).toEqual([
      false,
      false,
      true,
      false,
    ])
    expect(gettingStartedHeadline(result)).toBe(
      'Two steps left before your first session.',
    )
  })

  it('completes once a session has run', () => {
    const result = buildGettingStarted({
      deviceCount: 2,
      pairedDeviceCount: 2,
      patientCount: 3,
      programCount: 2,
      sessionCount: 1,
    })

    expect(result.complete).toBe(true)
    expect(result.steps.every((s) => !s.current)).toBe(true)
    expect(result.steps[0]?.detail).toBe('2 headsets paired')
    expect(gettingStartedHeadline(result)).toBe('You are all set.')
  })
})
