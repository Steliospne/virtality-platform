import { describe, expect, it } from 'vitest'
import {
  computeExtensionTrialEnd,
  EntitlementExtensionValidationError,
} from './entitlement-extension.ts'

const NOW = new Date('2026-08-10T12:00:00.000Z')

describe('computeExtensionTrialEnd', () => {
  it('extends by days from the base instant', () => {
    expect(computeExtensionTrialEnd(NOW, 7, 'days')).toEqual(
      new Date('2026-08-17T12:00:00.000Z'),
    )
  })

  it('reduces by days from the base instant', () => {
    const base = new Date('2026-08-20T12:00:00.000Z')
    expect(computeExtensionTrialEnd(base, 3, 'days', 'reduce')).toEqual(
      new Date('2026-08-17T12:00:00.000Z'),
    )
  })

  it('rejects invalid amounts', () => {
    expect(() => computeExtensionTrialEnd(NOW, 0, 'days')).toThrow(
      EntitlementExtensionValidationError,
    )
  })
})
