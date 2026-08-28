import { describe, expect, it, vi } from 'vitest'
import { getConsoleUrl } from '@virtality/shared/types'
import { scheduleCyclePlanChange } from './subscription-cycle-plan-change.js'

const consoleOrigin = getConsoleUrl()

describe('scheduleCyclePlanChange', () => {
  it('schedules through Better Auth upgrade with period-end flags', async () => {
    const upgrade = vi.fn().mockResolvedValue({ data: {} })

    await expect(
      scheduleCyclePlanChange({
        upgrade,
        annual: true,
        returnUrl: `${consoleOrigin}/user/u1/profile?tab=billing`,
      }),
    ).resolves.toEqual({ ok: true })

    expect(upgrade).toHaveBeenCalledWith(
      expect.objectContaining({
        plan: 'pro',
        annual: true,
        scheduleAtPeriodEnd: true,
        disableRedirect: true,
      }),
    )
  })

  it('surfaces Better Auth errors', async () => {
    const upgrade = vi
      .fn()
      .mockResolvedValue({ error: { message: 'Schedule failed' } })

    await expect(
      scheduleCyclePlanChange({
        upgrade,
        annual: false,
        returnUrl: '/billing',
      }),
    ).resolves.toEqual({ ok: false, message: 'Schedule failed' })
  })
})
