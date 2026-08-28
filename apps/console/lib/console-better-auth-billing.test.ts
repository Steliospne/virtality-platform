import { describe, expect, it, vi } from 'vitest'
import { getConsoleUrl } from '@virtality/shared/types'
import {
  CHECKOUT_RETURN_PARAM,
  buildProCheckoutUpgradeInput,
} from './subscription-checkout.js'
import {
  createConsoleBetterAuthBilling,
  notifyConsoleBillingAuthResult,
  CYCLE_PLAN_CHANGE_SCHEDULED_TOAST,
  type ConsoleBetterAuthBillingPort,
} from './console-better-auth-billing.js'

const consoleOrigin = getConsoleUrl()

function createPort(
  overrides: Partial<ConsoleBetterAuthBillingPort> = {},
): ConsoleBetterAuthBillingPort {
  return {
    upgrade: vi.fn().mockResolvedValue({ data: {} }),
    restore: vi.fn().mockResolvedValue({ data: {} }),
    billingPortal: vi.fn().mockResolvedValue({ data: {} }),
    ...overrides,
  }
}

describe('createConsoleBetterAuthBilling', () => {
  it('startCheckout upgrades immediately without scheduleAtPeriodEnd', async () => {
    const upgrade = vi.fn().mockResolvedValue({ data: {} })
    const billing = createConsoleBetterAuthBilling(createPort({ upgrade }))

    await expect(
      billing.startCheckout({
        returnUrl: `${consoleOrigin}/user/u1/profile?tab=billing`,
        annual: true,
      }),
    ).resolves.toEqual({ ok: true })

    expect(upgrade).toHaveBeenCalledWith(
      buildProCheckoutUpgradeInput(
        `${consoleOrigin}/user/u1/profile?tab=billing`,
        { annual: true },
      ),
    )
    const input = upgrade.mock.calls[0]![0] as Record<string, unknown>
    expect(input).not.toHaveProperty('scheduleAtPeriodEnd')
    expect(input).not.toHaveProperty('disableRedirect')
    expect(input.annual).toBe(true)
    expect(String(input.successUrl)).toContain(
      `${CHECKOUT_RETURN_PARAM}=success`,
    )
  })

  it('startCheckout surfaces Better Auth upgrade failures', async () => {
    const billing = createConsoleBetterAuthBilling(
      createPort({
        upgrade: vi
          .fn()
          .mockResolvedValue({ error: { message: 'Already subscribed' } }),
      }),
    )

    await expect(
      billing.startCheckout({ returnUrl: '/profile' }),
    ).resolves.toEqual({ ok: false, message: 'Already subscribed' })
  })

  it('scheduleCycleChange upgrades with period-end flags', async () => {
    const upgrade = vi.fn().mockResolvedValue({ data: {} })
    const billing = createConsoleBetterAuthBilling(createPort({ upgrade }))

    await expect(
      billing.scheduleCycleChange({
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

  it('scheduleCycleChange surfaces Better Auth errors', async () => {
    const billing = createConsoleBetterAuthBilling(
      createPort({
        upgrade: vi
          .fn()
          .mockResolvedValue({ error: { message: 'Schedule failed' } }),
      }),
    )

    await expect(
      billing.scheduleCycleChange({
        annual: false,
        returnUrl: '/billing',
      }),
    ).resolves.toEqual({ ok: false, message: 'Schedule failed' })
  })

  it('restore clears pending change via Better Auth restore', async () => {
    const restore = vi.fn().mockResolvedValue({ data: {} })
    const billing = createConsoleBetterAuthBilling(createPort({ restore }))

    await expect(billing.restore()).resolves.toEqual({ ok: true })
    expect(restore).toHaveBeenCalledWith({})
  })

  it('restore surfaces Better Auth errors', async () => {
    const billing = createConsoleBetterAuthBilling(
      createPort({
        restore: vi
          .fn()
          .mockResolvedValue({ error: { message: 'No pending change' } }),
      }),
    )

    await expect(billing.restore()).resolves.toEqual({
      ok: false,
      message: 'No pending change',
    })
  })

  it('openPortal starts Customer Portal at absolute console returnUrl', async () => {
    const billingPortal = vi.fn().mockResolvedValue({ data: {} })
    const billing = createConsoleBetterAuthBilling(
      createPort({ billingPortal }),
    )

    await expect(
      billing.openPortal({ returnUrl: '/user/abc/profile' }),
    ).resolves.toEqual({ ok: true })

    expect(billingPortal).toHaveBeenCalledWith({
      returnUrl: `${consoleOrigin}/user/abc/profile`,
    })
  })

  it('openPortal surfaces Better Auth portal failures', async () => {
    const billing = createConsoleBetterAuthBilling(
      createPort({
        billingPortal: vi
          .fn()
          .mockResolvedValue({ error: { message: 'No Stripe customer' } }),
      }),
    )

    await expect(billing.openPortal({ returnUrl: '/' })).resolves.toEqual({
      ok: false,
      message: 'No Stripe customer',
    })
  })
})

describe('notifyConsoleBillingAuthResult', () => {
  it('toasts errors and skips success copy', () => {
    const toastError = vi.fn()
    const toastSuccess = vi.fn()

    const result = notifyConsoleBillingAuthResult(
      { ok: false, message: 'Checkout failed' },
      {
        successToast: CYCLE_PLAN_CHANGE_SCHEDULED_TOAST,
        toastError,
        toastSuccess,
      },
    )

    expect(result).toEqual({ ok: false, message: 'Checkout failed' })
    expect(toastError).toHaveBeenCalledWith('Checkout failed')
    expect(toastSuccess).not.toHaveBeenCalled()
  })

  it('toasts schedule success copy when ok', () => {
    const toastError = vi.fn()
    const toastSuccess = vi.fn()

    const result = notifyConsoleBillingAuthResult(
      { ok: true },
      {
        successToast: CYCLE_PLAN_CHANGE_SCHEDULED_TOAST,
        toastError,
        toastSuccess,
      },
    )

    expect(result).toEqual({ ok: true })
    expect(toastError).not.toHaveBeenCalled()
    expect(toastSuccess).toHaveBeenCalledWith(CYCLE_PLAN_CHANGE_SCHEDULED_TOAST)
  })

  it('skips success toast when Checkout or portal succeeds without copy', () => {
    const toastError = vi.fn()
    const toastSuccess = vi.fn()

    notifyConsoleBillingAuthResult({ ok: true }, { toastError, toastSuccess })

    expect(toastError).not.toHaveBeenCalled()
    expect(toastSuccess).not.toHaveBeenCalled()
  })
})
