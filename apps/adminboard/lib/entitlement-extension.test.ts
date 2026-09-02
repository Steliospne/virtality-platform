import { describe, expect, it } from 'vitest'
import {
  formatExtensionSeatHint,
  formatExtensionSuccessMessage,
} from './entitlement-extension.ts'

describe('formatExtensionSeatHint', () => {
  it('explains create vs update seat selection', () => {
    expect(
      formatExtensionSeatHint({
        extensionMode: 'create',
        clockEnd: null,
      }),
    ).toMatch(/will create a new Trial Subscription/)
    expect(
      formatExtensionSeatHint({
        extensionMode: 'update',
        clockEnd: new Date('2026-08-17T12:00:00.000Z'),
      }),
    ).toMatch(/current clock ends/)
  })
})

describe('formatExtensionSuccessMessage', () => {
  it('distinguishes create vs update Extension outcomes', () => {
    const trialEnd = new Date('2026-08-17T12:00:00.000Z')
    expect(
      formatExtensionSuccessMessage({
        mode: 'created',
        previousStatus: 'none',
        trialEnd,
      }),
    ).toMatch(/Created a new Trial Subscription/)
    expect(
      formatExtensionSuccessMessage({
        mode: 'updated',
        previousStatus: 'trialing',
        trialEnd,
      }),
    ).toMatch(/Extended trialing seat/)
    expect(
      formatExtensionSuccessMessage({
        mode: 'updated',
        previousStatus: 'trialing',
        trialEnd,
        direction: 'reduce',
      }),
    ).toMatch(/Reduced trialing seat/)
  })
})
