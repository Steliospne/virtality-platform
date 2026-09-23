import { describe, expect, it } from 'vitest'
import {
  applyCompletedRepToPlotData,
  normalizeRepEndPayload,
  normalizeSetEndPayload,
} from './progress-event-normalization.js'

describe('normalizeRepEndPayload', () => {
  it('normalizes valid rep-end payloads into one-based completed rep measurements', () => {
    expect(normalizeRepEndPayload({ previousRep: 0, progress: 0.82 })).toEqual({
      ok: true,
      event: { completedRep: 1, progress: 0.82 },
    })

    expect(normalizeRepEndPayload({ previousRep: 9, progress: 0.5 })).toEqual({
      ok: true,
      event: { completedRep: 10, progress: 0.5 },
    })
  })

  it('fails safely on malformed or unexpected rep-end payloads', () => {
    expect(normalizeRepEndPayload({ previousRep: '1' })).toEqual({ ok: false })
    expect(normalizeRepEndPayload({ progress: 0.5 })).toEqual({ ok: false })
    expect(normalizeRepEndPayload(undefined)).toEqual({ ok: false })
  })

  it('rejects unparsed JSON text, which only reaches it through a raw socket.on', () => {
    expect(
      normalizeRepEndPayload(JSON.stringify({ previousRep: 0, progress: 0.8 })),
    ).toEqual({ ok: false })
    expect(normalizeRepEndPayload('not-json')).toEqual({ ok: false })
  })
})

describe('normalizeSetEndPayload', () => {
  it('normalizes valid set-end payloads into one-based completed set events', () => {
    expect(normalizeSetEndPayload({ previousSet: 1 })).toEqual({
      ok: true,
      event: { completedSet: 1 },
    })

    expect(normalizeSetEndPayload({ previousSet: 3 })).toEqual({
      ok: true,
      event: { completedSet: 3 },
    })
  })

  it('fails safely on malformed or unexpected set-end payloads', () => {
    expect(normalizeSetEndPayload({ previousSet: 0 })).toEqual({ ok: false })
    expect(normalizeSetEndPayload({})).toEqual({ ok: false })
    expect(normalizeSetEndPayload(undefined)).toEqual({ ok: false })
  })

  it('rejects unparsed JSON text, which only reaches it through a raw socket.on', () => {
    expect(normalizeSetEndPayload(JSON.stringify({ previousSet: 1 }))).toEqual({
      ok: false,
    })
    expect(normalizeSetEndPayload('{')).toEqual({ ok: false })
  })
})

describe('applyCompletedRepToPlotData', () => {
  it('stores completed rep measurements against the active one-based set', () => {
    const updated = applyCompletedRepToPlotData([{ rep: 1 }, { rep: 2 }], {
      completedRep: 2,
      activeSet: 1,
      progressPercent: 88,
    })

    expect(updated).toEqual([{ rep: 1 }, { rep: 2, set_1: 88 }])
  })
})
