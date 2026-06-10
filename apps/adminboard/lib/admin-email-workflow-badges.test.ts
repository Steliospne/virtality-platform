import { describe, expect, it } from 'vitest'
import { getAdminEmailWorkflowBadgeConfig } from './admin-email-workflow-badges'

describe('getAdminEmailWorkflowBadgeConfig', () => {
  it('uses warning styling for incomplete test send state', () => {
    expect(getAdminEmailWorkflowBadgeConfig({ kind: 'test-send', complete: false })).toEqual({
      label: 'Test send required',
      variant: 'outline',
      className: expect.stringContaining('amber'),
    })
  })

  it('uses success styling for completed test send state', () => {
    expect(getAdminEmailWorkflowBadgeConfig({ kind: 'test-send', complete: true })).toEqual({
      label: 'Test send complete',
      variant: 'outline',
      className: expect.stringContaining('emerald'),
    })
  })

  it('uses warning styling when the draft is not send-ready', () => {
    expect(getAdminEmailWorkflowBadgeConfig({ kind: 'send-readiness', ready: false })).toEqual({
      label: 'Not send-ready',
      variant: 'outline',
      className: expect.stringContaining('amber'),
    })
  })

  it('uses success styling when the draft is send-ready', () => {
    expect(getAdminEmailWorkflowBadgeConfig({ kind: 'send-readiness', ready: true })).toEqual({
      label: 'Send-ready',
      variant: 'outline',
      className: expect.stringContaining('emerald'),
    })
  })
})
