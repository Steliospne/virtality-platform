import { describe, expect, it, vi } from 'vitest'
import {
  DEFAULT_PLAN_ANNUAL_PRICE_ID,
  DEFAULT_PLAN_MONTHLY_PRICE_ID,
} from './billing-plans.ts'
import {
  annualFlagForDefaultPlanPriceId,
  authorizeAdminCyclePlanReference,
  hasPendingCyclePlanChange,
  restoreSubscription,
  type CyclePlanChangeRestorePort,
} from './cycle-plan-change.ts'

function createFakeRestorePort(
  overrides: Partial<CyclePlanChangeRestorePort> = {},
): CyclePlanChangeRestorePort {
  return {
    restore: vi.fn(async () => ({
      data: {},
      stripeSubscriptionId: 'sub_pro_1',
    })),
    ...overrides,
  }
}

describe('authorizeAdminCyclePlanReference', () => {
  it('allows admin upgrade and restore only', () => {
    expect(
      authorizeAdminCyclePlanReference({
        role: 'admin',
        action: 'upgrade-subscription',
      }),
    ).toBe(true)
    expect(
      authorizeAdminCyclePlanReference({
        role: 'admin',
        action: 'restore-subscription',
      }),
    ).toBe(true)
    expect(
      authorizeAdminCyclePlanReference({
        role: 'admin',
        action: 'cancel-subscription',
      }),
    ).toBe(false)
  })

  it('denies non-admin roles for every action', () => {
    expect(
      authorizeAdminCyclePlanReference({
        role: 'user',
        action: 'upgrade-subscription',
      }),
    ).toBe(false)
  })
})

describe('annualFlagForDefaultPlanPriceId', () => {
  it('maps yearly vs monthly Default Prices to the yearly interval flag', () => {
    expect(annualFlagForDefaultPlanPriceId(DEFAULT_PLAN_ANNUAL_PRICE_ID)).toBe(
      true,
    )
    expect(annualFlagForDefaultPlanPriceId(DEFAULT_PLAN_MONTHLY_PRICE_ID)).toBe(
      false,
    )
  })
})

describe('hasPendingCyclePlanChange', () => {
  it('is true only when a Stripe schedule id is present', () => {
    expect(hasPendingCyclePlanChange({ stripeScheduleId: 'sub_sched_1' })).toBe(
      true,
    )
    expect(hasPendingCyclePlanChange({ stripeScheduleId: null })).toBe(false)
    expect(hasPendingCyclePlanChange({})).toBe(false)
  })
})

describe('restoreSubscription', () => {
  it('restores through the injected Better Auth port', async () => {
    const port = createFakeRestorePort()

    const result = await restoreSubscription({
      port,
      referenceId: 'user_customer',
    })

    expect(result).toEqual({
      ok: true,
      stripeSubscriptionId: 'sub_pro_1',
    })
    expect(port.restore).toHaveBeenCalledWith({
      referenceId: 'user_customer',
    })
  })

  it('omits referenceId for self-serve restore', async () => {
    const port = createFakeRestorePort()

    await restoreSubscription({ port })

    expect(port.restore).toHaveBeenCalledWith({})
  })

  it('surfaces Better Auth restore errors', async () => {
    const port = createFakeRestorePort({
      restore: vi.fn(async () => ({
        error: { message: 'No pending change' },
      })),
    })

    await expect(restoreSubscription({ port })).resolves.toEqual({
      ok: false,
      message: 'No pending change',
    })
  })
})
