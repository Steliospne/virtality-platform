import { describe, expect, it, vi } from 'vitest'
import { getConsoleUrl } from '../../types/index.ts'
import {
  PRO_PLAN_ANNUAL_PRICE_ID,
  PRO_PLAN_MONTHLY_PRICE_ID,
} from './billing-plans.ts'
import {
  annualFlagForProPlanPriceId,
  authorizeAdminCyclePlanReference,
  buildCyclePlanChangeUpgradeInput,
  hasPendingCyclePlanChange,
  restoreSubscription,
  scheduleCyclePlanChange,
  type CyclePlanChangePort,
} from './cycle-plan-change.ts'

const consoleOrigin = getConsoleUrl()

function createFakePort(
  overrides: Partial<CyclePlanChangePort> = {},
): CyclePlanChangePort {
  return {
    upgrade: vi.fn(async () => ({
      data: {},
      stripeScheduleId: 'sub_sched_fake',
    })),
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

describe('annualFlagForProPlanPriceId', () => {
  it('maps yearly vs monthly Pro Prices to the Better Auth annual flag', () => {
    expect(annualFlagForProPlanPriceId(PRO_PLAN_ANNUAL_PRICE_ID)).toBe(true)
    expect(annualFlagForProPlanPriceId(PRO_PLAN_MONTHLY_PRICE_ID)).toBe(false)
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

describe('buildCyclePlanChangeUpgradeInput', () => {
  it('always schedules at period end with redirect disabled', () => {
    const input = buildCyclePlanChangeUpgradeInput({
      annual: true,
      returnUrl: '/user/u1/profile?tab=billing',
      referenceId: 'user_customer',
    })

    expect(input.plan).toBe('pro')
    expect(input.annual).toBe(true)
    expect(input.referenceId).toBe('user_customer')
    expect(input.scheduleAtPeriodEnd).toBe(true)
    expect(input.disableRedirect).toBe(true)
    expect(new URL(input.returnUrl).origin).toBe(new URL(consoleOrigin).origin)
    expect(new URL(input.successUrl).searchParams.get('checkoutReturn')).toBe(
      'success',
    )
    expect(new URL(input.cancelUrl).searchParams.get('checkoutReturn')).toBe(
      'cancel',
    )
  })
})

describe('scheduleCyclePlanChange', () => {
  it('schedules through the injected Better Auth port', async () => {
    const port = createFakePort()

    const result = await scheduleCyclePlanChange({
      port,
      referenceId: 'user_customer',
      annual: true,
      returnUrl: `${consoleOrigin}/user/user_customer/profile?tab=billing`,
    })

    expect(result).toEqual({ ok: true, stripeScheduleId: 'sub_sched_fake' })
    expect(port.upgrade).toHaveBeenCalledWith(
      expect.objectContaining({
        plan: 'pro',
        annual: true,
        referenceId: 'user_customer',
        scheduleAtPeriodEnd: true,
        disableRedirect: true,
      }),
    )
  })

  it('surfaces Better Auth upgrade errors', async () => {
    const port = createFakePort({
      upgrade: vi.fn(async () => ({
        error: { message: 'Already scheduled' },
      })),
    })

    await expect(
      scheduleCyclePlanChange({
        port,
        annual: false,
        returnUrl: '/billing',
      }),
    ).resolves.toEqual({
      ok: false,
      message: 'Already scheduled',
    })
  })
})

describe('restoreSubscription', () => {
  it('restores through the injected Better Auth port', async () => {
    const port = createFakePort()

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
    const port = createFakePort()

    await restoreSubscription({ port })

    expect(port.restore).toHaveBeenCalledWith({})
  })

  it('surfaces Better Auth restore errors', async () => {
    const port = createFakePort({
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
