import { describe, expect, it } from 'vitest'
import {
  formatCampaignAttachingStatus,
  fromDatetimeLocalValue,
  toDatetimeLocalValue,
} from './campaign-window.ts'

describe('campaign window display helpers', () => {
  it('describes attaching vs not attaching for Adminboard', () => {
    expect(formatCampaignAttachingStatus(true)).toMatch(/Attaching/)
    expect(formatCampaignAttachingStatus(false)).toMatch(/Not attaching/)
  })

  it('round-trips datetime-local values', () => {
    const iso = '2026-08-17T12:30:00.000Z'
    const local = toDatetimeLocalValue(iso)
    expect(local).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/)
    expect(fromDatetimeLocalValue(local).getTime()).toBe(
      new Date(local).getTime(),
    )
  })
})
