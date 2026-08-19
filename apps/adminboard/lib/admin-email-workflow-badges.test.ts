import { describe, expect, it } from 'vitest'
import { getAdminEmailWorkflowBadgeConfig } from './admin-email-workflow-badges'

describe('getAdminEmailWorkflowBadgeConfig', () => {
  it('uses warning styling when the draft is not send-ready', () => {
    expect(
      getAdminEmailWorkflowBadgeConfig({
        kind: 'send-readiness',
        ready: false,
      }),
    ).toEqual({
      label: 'Not send-ready',
      variant: 'outline',
      className: expect.stringContaining('amber'),
      minWidthClass: 'min-w-[6.75rem]',
    })
  })

  it('uses success styling when the draft is send-ready', () => {
    expect(
      getAdminEmailWorkflowBadgeConfig({ kind: 'send-readiness', ready: true }),
    ).toEqual({
      label: 'Send-ready',
      variant: 'outline',
      className: expect.stringContaining('emerald'),
      minWidthClass: 'min-w-[6.75rem]',
    })
  })
})
