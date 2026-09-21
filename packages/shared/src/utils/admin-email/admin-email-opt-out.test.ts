import { describe, expect, it } from 'vitest'
import {
  applyEmailOptOuts,
  isEmailOptOutCovered,
} from './admin-email-opt-out.ts'
import { resolveDraftRecipients } from './admin-email-recipient-resolution.ts'

const optOuts = [
  { email: 'all@example.com', topic: null },
  { email: 'News@example.com', topic: 'newsletter' as const },
]

describe('applyEmailOptOuts', () => {
  it('suppresses all-topic and matching-topic opt-outs only', () => {
    const applied = applyEmailOptOuts(
      ['all@example.com', 'news@example.com', 'keep@example.com'],
      optOuts,
      'newsletter',
    )
    expect(applied.recipients).toEqual(['keep@example.com'])
    expect(applied.suppressed).toEqual(['all@example.com', 'news@example.com'])
  })

  it('leaves a topic opt-out alone when sending under another topic', () => {
    const applied = applyEmailOptOuts(
      ['news@example.com'],
      optOuts,
      'promotions',
    )
    expect(applied.recipients).toEqual(['news@example.com'])
  })
})

describe('isEmailOptOutCovered', () => {
  it('treats an all-topics opt-out as covering every topic', () => {
    expect(
      isEmailOptOutCovered(optOuts, {
        email: 'ALL@example.com',
        topic: 'promotions',
      }),
    ).toBe(true)
    expect(
      isEmailOptOutCovered(optOuts, {
        email: 'news@example.com',
        topic: null,
      }),
    ).toBe(false)
  })
})

describe('resolveDraftRecipients', () => {
  it('unions the explicit list with the audience, then enforces opt-outs', () => {
    const resolved = resolveDraftRecipients({
      explicitRecipients: ['One@example.com', 'all@example.com'],
      audienceRecipients: ['one@example.com', 'two@example.com'],
      optOuts,
      topic: 'product_updates',
    })

    expect(resolved.recipients).toEqual(['one@example.com', 'two@example.com'])
    expect(resolved.suppressed).toEqual(['all@example.com'])
    expect(resolved).toMatchObject({
      explicitCount: 2,
      audienceCount: 2,
      overlapCount: 1,
      suppressedCount: 1,
      totalCount: 2,
    })
  })
})
