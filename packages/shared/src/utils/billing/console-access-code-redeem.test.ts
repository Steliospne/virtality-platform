import { describe, expect, it, vi } from 'vitest'
import { FREE_PLAN_PRICE_ID } from './billing-plans.ts'
import {
  DEFAULT_TRIAL_REDEEM_DAYS,
  TRIAL_REDEEM_CODE_TTL_MS,
  type TrialRedeemCodeRecord,
} from './trial-redeem-code.ts'
import {
  TRIAL_REDEEM_SIGNUP_ALREADY_USED_MESSAGE,
  TRIAL_REDEEM_SIGNUP_EXPIRED_MESSAGE,
  type TrialRedeemConsumeStore,
} from './trial-redeem-sign-up.ts'
import {
  CONSOLE_ACCESS_CODE_INVALID_MESSAGE,
  classifyProfileBillingSeat,
  computeAccessCodeTrialEndUnix,
  evaluateAccessCodeAtProfile,
  formatAccessCodeAppliedMessage,
  isProfileBillingAccessCode,
  redeemAccessCodeOnProfile,
  routeProfileBillingCode,
  type ConsoleAccessCodeStore,
  type ConsoleAccessCodeStripeGateway,
  type ProfileBillingSeat,
} from './console-access-code-redeem.ts'

const NOW = new Date('2026-08-10T12:00:00.000Z')

function record(
  overrides: Partial<TrialRedeemCodeRecord> = {},
): TrialRedeemCodeRecord {
  return {
    id: 1,
    code: 'GO-ABCDEFGHIJ',
    status: 'unused',
    mode: 'timed_trial',
    trialDays: DEFAULT_TRIAL_REDEEM_DAYS,
    note: null,
    createdAt: NOW,
    usedAt: null,
    usedBy: null,
    ...overrides,
  }
}

function createMemoryStore(
  initial: TrialRedeemCodeRecord[] = [],
  seat: ProfileBillingSeat = null,
): ConsoleAccessCodeStore & { rows: TrialRedeemCodeRecord[] } {
  const rows = [...initial]
  const consumeUnusedAs =
    (status: 'redeemed' | 'already_entitled') =>
    async (id: number, usedBy: string, usedAt: Date) => {
      const row = rows.find((r) => r.id === id)
      if (!row || row.status !== 'unused') return false
      row.status = status
      row.usedAt = usedAt
      row.usedBy = usedBy
      return true
    }

  const consume: TrialRedeemConsumeStore = {
    findByCode: async (code) => rows.find((row) => row.code === code) ?? null,
    consumeAsRedeemed: consumeUnusedAs('redeemed'),
    consumeAsAlreadyEntitled: consumeUnusedAs('already_entitled'),
  }

  return {
    rows,
    ...consume,
    findBillingSeatByUserId: async () => seat,
    findStripeCustomerIdByUserId: async () => 'cus_default',
  }
}

function stripeGateway(
  overrides: Partial<ConsoleAccessCodeStripeGateway> = {},
): ConsoleAccessCodeStripeGateway {
  return {
    customerHasEntitledSubscription: async () => false,
    createNoCardTrialSubscription: async () => ({
      stripeSubscriptionId: 'sub_trial',
    }),
    createPermanentFreeSubscription: async () => ({
      stripeSubscriptionId: 'sub_permanent_free',
    }),
    attachTrialOnSubscription: async () => undefined,
    ...overrides,
  }
}

describe('routeProfileBillingCode', () => {
  it('routes GO- to Access Code and everything else to Promotion Code', () => {
    expect(routeProfileBillingCode('GO-ABCDEFGHIJ')).toEqual({
      kind: 'access_code',
      code: 'GO-ABCDEFGHIJ',
    })
    expect(routeProfileBillingCode('SPRING20')).toEqual({
      kind: 'promotion_code',
      code: 'SPRING20',
    })
  })
})

describe('isProfileBillingAccessCode', () => {
  it('matches the Access Code route', () => {
    expect(isProfileBillingAccessCode('GO-ABCDEFGHIJ')).toBe(true)
    expect(isProfileBillingAccessCode('SPRING20')).toBe(false)
  })
})

describe('classifyProfileBillingSeat', () => {
  it('classifies live seats for the redeem matrix', () => {
    expect(classifyProfileBillingSeat(null)).toBe('no_live_seat')
    expect(
      classifyProfileBillingSeat({
        status: 'active',
        plan: 'free',
        stripeSubscriptionId: 'sub_free',
      }),
    ).toBe('active_free_no_trial')
    expect(
      classifyProfileBillingSeat({
        status: 'trialing',
        plan: 'free',
        stripeSubscriptionId: 'sub_trial',
      }),
    ).toBe('trialing')
    expect(
      classifyProfileBillingSeat({
        status: 'active',
        plan: 'pro',
        stripeSubscriptionId: 'sub_pro',
      }),
    ).toBe('paid_pro_active')
    expect(
      classifyProfileBillingSeat({
        status: 'canceled',
        plan: 'free',
        stripeSubscriptionId: 'sub_canceled',
      }),
    ).toBe('no_live_seat')
  })
})

describe('evaluateAccessCodeAtProfile', () => {
  it('rejects unknown GO- codes without waitlist', async () => {
    const store = createMemoryStore()
    await expect(
      evaluateAccessCodeAtProfile(store, 'GO-NOSUCHCODE', NOW),
    ).resolves.toEqual({ action: 'invalid' })
  })

  it('blocks expired and already-used codes with sign-up copy', async () => {
    const expiredStore = createMemoryStore([
      record({
        createdAt: new Date(NOW.getTime() - TRIAL_REDEEM_CODE_TTL_MS),
      }),
    ])
    await expect(
      evaluateAccessCodeAtProfile(expiredStore, 'GO-ABCDEFGHIJ', NOW),
    ).resolves.toEqual({
      action: 'block',
      reason: 'expired',
    })

    const usedStore = createMemoryStore([record({ status: 'redeemed' })])
    await expect(
      evaluateAccessCodeAtProfile(usedStore, 'GO-ABCDEFGHIJ', NOW),
    ).resolves.toEqual({
      action: 'block',
      reason: 'already_used',
    })
  })
})

describe('redeemAccessCodeOnProfile', () => {
  it('creates permanent Free when there is no live seat', async () => {
    const store = createMemoryStore([
      record({ id: 10, mode: 'permanent_free', code: 'GO-PERMFREE01' }),
    ])
    const createPermanentFreeSubscription = vi.fn(async () => ({
      stripeSubscriptionId: 'sub_perm',
    }))
    const createNoCardTrialSubscription = vi.fn()

    const result = await redeemAccessCodeOnProfile(
      store,
      stripeGateway({
        createPermanentFreeSubscription,
        createNoCardTrialSubscription,
      }),
      {
        userId: 'user_1',
        code: 'GO-PERMFREE01',
        stripeCustomerId: 'cus_1',
        priceId: FREE_PLAN_PRICE_ID,
      },
      { now: () => NOW },
    )

    expect(result).toEqual({
      codeId: 10,
      effect: 'permanent_free_created',
      stripeSubscriptionId: 'sub_perm',
    })
    expect(createPermanentFreeSubscription).toHaveBeenCalledOnce()
    expect(createNoCardTrialSubscription).not.toHaveBeenCalled()
    expect(store.rows[0]?.status).toBe('redeemed')
  })

  it('creates a Free trial when there is no live seat', async () => {
    const store = createMemoryStore([record({ id: 11, trialDays: 21 })])
    const createNoCardTrialSubscription = vi.fn(async (input) => {
      expect(input.trialPeriodDays).toBe(21)
      return { stripeSubscriptionId: 'sub_new_trial' }
    })

    const result = await redeemAccessCodeOnProfile(
      store,
      stripeGateway({ createNoCardTrialSubscription }),
      {
        userId: 'user_2',
        code: 'GO-ABCDEFGHIJ',
        stripeCustomerId: 'cus_2',
        priceId: FREE_PLAN_PRICE_ID,
      },
      { now: () => NOW },
    )

    expect(result).toEqual({
      codeId: 11,
      effect: 'trial_created',
      stripeSubscriptionId: 'sub_new_trial',
    })
  })

  it('attaches a trial on active Free without creating a second subscription', async () => {
    const seat = {
      status: 'active',
      plan: 'free',
      stripeSubscriptionId: 'sub_live_free',
    }
    const store = createMemoryStore([record({ id: 12 })], seat)
    const attachTrialOnSubscription = vi.fn(async (input) => {
      expect(input.stripeSubscriptionId).toBe('sub_live_free')
      expect(input.trialEndUnix).toBe(
        computeAccessCodeTrialEndUnix(NOW, DEFAULT_TRIAL_REDEEM_DAYS),
      )
    })
    const createNoCardTrialSubscription = vi.fn()

    const result = await redeemAccessCodeOnProfile(
      store,
      stripeGateway({
        attachTrialOnSubscription,
        createNoCardTrialSubscription,
      }),
      {
        userId: 'user_3',
        code: 'GO-ABCDEFGHIJ',
        stripeCustomerId: 'cus_3',
        priceId: FREE_PLAN_PRICE_ID,
      },
      { now: () => NOW },
    )

    expect(result).toEqual({
      codeId: 12,
      effect: 'trial_attached',
      stripeSubscriptionId: 'sub_live_free',
    })
    expect(attachTrialOnSubscription).toHaveBeenCalledOnce()
    expect(createNoCardTrialSubscription).not.toHaveBeenCalled()
  })

  it('burns already_entitled for active Free plus permanent_free mode', async () => {
    const seat = {
      status: 'active',
      plan: 'free',
      stripeSubscriptionId: 'sub_live_free',
    }
    const store = createMemoryStore(
      [record({ id: 13, mode: 'permanent_free' })],
      seat,
    )
    const stripe = stripeGateway({
      createPermanentFreeSubscription: vi.fn(),
      attachTrialOnSubscription: vi.fn(),
    })

    const result = await redeemAccessCodeOnProfile(
      store,
      stripe,
      {
        userId: 'user_4',
        code: 'GO-ABCDEFGHIJ',
        stripeCustomerId: 'cus_4',
        priceId: FREE_PLAN_PRICE_ID,
      },
      { now: () => NOW },
    )

    expect(result).toEqual({ codeId: 13, effect: 'already_entitled' })
    expect(store.rows[0]?.status).toBe('already_entitled')
  })

  it('burns already_entitled for trialing and paid Pro seats', async () => {
    for (const seat of [
      {
        status: 'trialing',
        plan: 'free',
        stripeSubscriptionId: 'sub_trialing',
      },
      {
        status: 'active',
        plan: 'pro',
        stripeSubscriptionId: 'sub_pro',
      },
    ] as const) {
      const store = createMemoryStore([record({ id: 14 })], seat)
      const result = await redeemAccessCodeOnProfile(
        store,
        stripeGateway(),
        {
          userId: 'user_5',
          code: 'GO-ABCDEFGHIJ',
          stripeCustomerId: 'cus_5',
          priceId: FREE_PLAN_PRICE_ID,
        },
        { now: () => NOW },
      )
      expect(result.effect).toBe('already_entitled')
    }
  })

  it('throws for unknown Access Codes', async () => {
    const store = createMemoryStore()
    await expect(
      redeemAccessCodeOnProfile(store, stripeGateway(), {
        userId: 'user_6',
        code: 'GO-NOSUCHCODE',
        stripeCustomerId: 'cus_6',
        priceId: FREE_PLAN_PRICE_ID,
      }),
    ).rejects.toThrow(CONSOLE_ACCESS_CODE_INVALID_MESSAGE)
  })

  it('creates a Free trial after canceled or expired seats', async () => {
    const store = createMemoryStore([record({ id: 15 })], null)
    const createNoCardTrialSubscription = vi.fn(async () => ({
      stripeSubscriptionId: 'sub_after_cancel',
    }))

    const result = await redeemAccessCodeOnProfile(
      store,
      stripeGateway({ createNoCardTrialSubscription }),
      {
        userId: 'user_7',
        code: 'GO-ABCDEFGHIJ',
        stripeCustomerId: 'cus_7',
        priceId: FREE_PLAN_PRICE_ID,
      },
      { now: () => NOW },
    )

    expect(result).toEqual({
      codeId: 15,
      effect: 'trial_created',
      stripeSubscriptionId: 'sub_after_cancel',
    })
    expect(createNoCardTrialSubscription).toHaveBeenCalledOnce()
  })

  it('shares Expired and Already used copy with sign-up', async () => {
    const expiredStore = createMemoryStore([
      record({
        createdAt: new Date(NOW.getTime() - TRIAL_REDEEM_CODE_TTL_MS),
      }),
    ])
    await expect(
      redeemAccessCodeOnProfile(
        expiredStore,
        stripeGateway(),
        {
          userId: 'user_8',
          code: 'GO-ABCDEFGHIJ',
          stripeCustomerId: 'cus_8',
          priceId: FREE_PLAN_PRICE_ID,
        },
        { now: () => NOW },
      ),
    ).rejects.toThrow(TRIAL_REDEEM_SIGNUP_EXPIRED_MESSAGE)

    const usedStore = createMemoryStore([record({ status: 'redeemed' })])
    await expect(
      redeemAccessCodeOnProfile(usedStore, stripeGateway(), {
        userId: 'user_9',
        code: 'GO-ABCDEFGHIJ',
        stripeCustomerId: 'cus_9',
        priceId: FREE_PLAN_PRICE_ID,
      }),
    ).rejects.toThrow(TRIAL_REDEEM_SIGNUP_ALREADY_USED_MESSAGE)
  })
})

describe('formatAccessCodeAppliedMessage', () => {
  it('includes the headline and one-line effect', () => {
    expect(
      formatAccessCodeAppliedMessage({ effect: 'trial_attached' }),
    ).toContain('Access Code applied.')
    expect(
      formatAccessCodeAppliedMessage({ effect: 'trial_attached' }),
    ).toContain('free trial')
  })
})
