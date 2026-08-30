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
  TRIAL_REDEEM_SIGNUP_WAITLIST_MESSAGE,
  evaluateTrialRedeemAtSignUp,
  isTrialRedeemWaitlistRedirect,
  redeemTrialCodeAfterSignUp,
  routeSignUpCode,
  type TrialRedeemConsumeStore,
  type TrialRedeemStripeGateway,
} from './trial-redeem-sign-up.ts'

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
): TrialRedeemConsumeStore & {
  rows: TrialRedeemCodeRecord[]
} {
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

  return {
    rows,
    findByCode: async (code) => rows.find((row) => row.code === code) ?? null,
    consumeAsRedeemed: consumeUnusedAs('redeemed'),
    consumeAsAlreadyEntitled: consumeUnusedAs('already_entitled'),
  }
}

function stripeGateway(
  overrides: Partial<TrialRedeemStripeGateway> = {},
): TrialRedeemStripeGateway {
  return {
    customerHasEntitledSubscription: async () => false,
    createNoCardTrialSubscription: async () => ({
      stripeSubscriptionId: 'sub_default',
    }),
    createPermanentFreeSubscription: async () => ({
      stripeSubscriptionId: 'sub_permanent_free',
    }),
    ...overrides,
  }
}

describe('routeSignUpCode', () => {
  it('routes GO- to Access Code redeem and TE- to tester', () => {
    expect(routeSignUpCode('GO-ABCDEFGHIJ')).toEqual({
      kind: 'trial_redeem',
      code: 'GO-ABCDEFGHIJ',
    })
    expect(routeSignUpCode('go-abcdefghij')).toEqual({
      kind: 'trial_redeem',
      code: 'GO-ABCDEFGHIJ',
    })
    expect(routeSignUpCode('TE-ABCDEFGHIJ')).toEqual({
      kind: 'tester',
      code: 'TE-ABCDEFGHIJ',
    })
    expect(routeSignUpCode('te-abcdefghij')).toEqual({
      kind: 'tester',
      code: 'TE-ABCDEFGHIJ',
    })
  })

  it('treats empty or non-matching codes as none', () => {
    expect(routeSignUpCode('')).toEqual({ kind: 'none' })
    expect(routeSignUpCode('   ')).toEqual({ kind: 'none' })
    expect(routeSignUpCode(undefined)).toEqual({ kind: 'none' })
    expect(routeSignUpCode('GO-SHORT')).toEqual({ kind: 'none' })
    expect(routeSignUpCode('NOT-A-CODE')).toEqual({ kind: 'none' })
  })
})

describe('evaluateTrialRedeemAtSignUp', () => {
  it('waitlists empty codes and well-formatted GO- misses', async () => {
    const store = createMemoryStore()
    await expect(
      evaluateTrialRedeemAtSignUp(store, 'GO-NOSUCHCODE', NOW),
    ).resolves.toEqual({ action: 'waitlist' })
    await expect(evaluateTrialRedeemAtSignUp(store, '', NOW)).resolves.toEqual({
      action: 'waitlist',
    })
    await expect(
      evaluateTrialRedeemAtSignUp(store, '   ', NOW),
    ).resolves.toEqual({ action: 'waitlist' })
    await expect(
      evaluateTrialRedeemAtSignUp(store, undefined, NOW),
    ).resolves.toEqual({ action: 'waitlist' })
  })

  it('ignores non-matching formats and tester codes', async () => {
    const store = createMemoryStore()
    await expect(
      evaluateTrialRedeemAtSignUp(store, 'GO-SHORT', NOW),
    ).resolves.toEqual({ action: 'ignore' })
    await expect(
      evaluateTrialRedeemAtSignUp(store, 'TE-ABCDEFGHIJ', NOW),
    ).resolves.toEqual({ action: 'ignore' })
  })

  it('detects the waitlist redirect signal', () => {
    expect(
      isTrialRedeemWaitlistRedirect(TRIAL_REDEEM_SIGNUP_WAITLIST_MESSAGE),
    ).toBe(true)
    expect(
      isTrialRedeemWaitlistRedirect(TRIAL_REDEEM_SIGNUP_EXPIRED_MESSAGE),
    ).toBe(false)
  })

  it('blocks derived expired codes', async () => {
    const store = createMemoryStore([
      record({
        status: 'unused',
        createdAt: new Date(NOW.getTime() - TRIAL_REDEEM_CODE_TTL_MS),
      }),
    ])

    await expect(
      evaluateTrialRedeemAtSignUp(store, 'GO-ABCDEFGHIJ', NOW),
    ).resolves.toEqual({
      action: 'block',
      message: TRIAL_REDEEM_SIGNUP_EXPIRED_MESSAGE,
    })
  })

  it('blocks redeemed and already_entitled codes', async () => {
    const redeemedStore = createMemoryStore([record({ status: 'redeemed' })])
    const entitledStore = createMemoryStore([
      record({ status: 'already_entitled' }),
    ])

    await expect(
      evaluateTrialRedeemAtSignUp(redeemedStore, 'GO-ABCDEFGHIJ', NOW),
    ).resolves.toEqual({
      action: 'block',
      message: TRIAL_REDEEM_SIGNUP_ALREADY_USED_MESSAGE,
    })
    await expect(
      evaluateTrialRedeemAtSignUp(entitledStore, 'go-abcdefghij', NOW),
    ).resolves.toEqual({
      action: 'block',
      message: TRIAL_REDEEM_SIGNUP_ALREADY_USED_MESSAGE,
    })
  })

  it('keeps terminals above TTL with Already used messaging', async () => {
    const pastTtl = new Date(NOW.getTime() - TRIAL_REDEEM_CODE_TTL_MS)
    const store = createMemoryStore([
      record({
        status: 'already_entitled',
        createdAt: pastTtl,
        code: 'GO-OLDENTITLE',
      }),
    ])

    await expect(
      evaluateTrialRedeemAtSignUp(store, 'GO-OLDENTITLE', NOW),
    ).resolves.toEqual({
      action: 'block',
      message: TRIAL_REDEEM_SIGNUP_ALREADY_USED_MESSAGE,
    })
  })

  it('allows unused in-TTL codes to proceed', async () => {
    const unused = record({ status: 'unused', createdAt: NOW })
    const store = createMemoryStore([unused])

    await expect(
      evaluateTrialRedeemAtSignUp(store, 'GO-ABCDEFGHIJ', NOW),
    ).resolves.toEqual({ action: 'proceed', record: unused })
  })
})

describe('redeemTrialCodeAfterSignUp', () => {
  it('creates a no-card trial Subscription then consumes as redeemed', async () => {
    const store = createMemoryStore([
      record({ id: 42, trialDays: 14, status: 'unused' }),
    ])
    const stripeCalls: unknown[] = []
    const stripe = stripeGateway({
      createNoCardTrialSubscription: async (input) => {
        stripeCalls.push(input)
        return { stripeSubscriptionId: 'sub_trial_1' }
      },
    })

    const result = await redeemTrialCodeAfterSignUp(
      store,
      stripe,
      {
        code: 'GO-ABCDEFGHIJ',
        userId: 'user_1',
        stripeCustomerId: 'cus_1',
        priceId: FREE_PLAN_PRICE_ID,
      },
      { now: () => NOW },
    )

    expect(result).toEqual({
      status: 'redeemed',
      stripeSubscriptionId: 'sub_trial_1',
      codeId: 42,
    })
    expect(stripeCalls).toEqual([
      {
        customerId: 'cus_1',
        priceId: FREE_PLAN_PRICE_ID,
        trialPeriodDays: 14,
        metadata: { trialRedeemCodeId: '42' },
      },
    ])
    expect(store.rows[0]).toMatchObject({
      status: 'redeemed',
      usedAt: NOW,
      usedBy: 'user_1',
    })
  })

  it('uses per-code trial day override when creating the Stripe Subscription', async () => {
    const store = createMemoryStore([
      record({ id: 7, trialDays: 30, status: 'unused' }),
    ])
    const stripe = stripeGateway({
      createNoCardTrialSubscription: async (input) => {
        expect(input.trialPeriodDays).toBe(30)
        return { stripeSubscriptionId: 'sub_override' }
      },
    })

    const result = await redeemTrialCodeAfterSignUp(
      store,
      stripe,
      {
        code: 'GO-ABCDEFGHIJ',
        userId: 'user_2',
        stripeCustomerId: 'cus_2',
        priceId: FREE_PLAN_PRICE_ID,
      },
      { now: () => NOW },
    )

    expect(result).toMatchObject({ status: 'redeemed' })
  })

  it('creates a permanent Free subscription for permanent_free mode codes', async () => {
    const store = createMemoryStore([
      record({
        id: 99,
        mode: 'permanent_free',
        status: 'unused',
        code: 'GO-PERMFREE01',
      }),
    ])
    const stripeCalls: unknown[] = []
    const createNoCardTrialSubscription = vi.fn()
    const stripe = stripeGateway({
      createNoCardTrialSubscription,
      createPermanentFreeSubscription: async (input) => {
        stripeCalls.push(input)
        return { stripeSubscriptionId: 'sub_permanent_free' }
      },
    })

    const result = await redeemTrialCodeAfterSignUp(
      store,
      stripe,
      {
        code: 'GO-PERMFREE01',
        userId: 'user_free',
        stripeCustomerId: 'cus_free',
        priceId: FREE_PLAN_PRICE_ID,
      },
      { now: () => NOW },
    )

    expect(result).toEqual({
      status: 'redeemed',
      stripeSubscriptionId: 'sub_permanent_free',
      codeId: 99,
    })
    expect(stripeCalls).toEqual([
      {
        customerId: 'cus_free',
        priceId: FREE_PLAN_PRICE_ID,
        metadata: { trialRedeemCodeId: '99' },
      },
    ])
    expect(createNoCardTrialSubscription).not.toHaveBeenCalled()
    expect(store.rows[0]).toMatchObject({
      status: 'redeemed',
      usedAt: NOW,
      usedBy: 'user_free',
    })
  })

  it('consumes as already_entitled without creating a second Subscription', async () => {
    const store = createMemoryStore([
      record({ id: 55, status: 'unused', code: 'GO-ENTITLED01' }),
    ])
    const createNoCardTrialSubscription = vi.fn()
    const stripe = stripeGateway({
      customerHasEntitledSubscription: async (customerId) => {
        expect(customerId).toBe('cus_entitled')
        return true
      },
      createNoCardTrialSubscription,
    })

    const result = await redeemTrialCodeAfterSignUp(
      store,
      stripe,
      {
        code: 'GO-ENTITLED01',
        userId: 'user_entitled',
        stripeCustomerId: 'cus_entitled',
        priceId: FREE_PLAN_PRICE_ID,
      },
      { now: () => NOW },
    )

    expect(result).toEqual({
      status: 'already_entitled',
      codeId: 55,
    })
    expect(createNoCardTrialSubscription).not.toHaveBeenCalled()
    expect(store.rows[0]).toMatchObject({
      status: 'already_entitled',
      usedAt: NOW,
      usedBy: 'user_entitled',
    })
  })

  it('blocks reuse of a bearer after already-entitled consume', async () => {
    const store = createMemoryStore([
      record({ id: 55, status: 'unused', code: 'GO-ENTITLED01' }),
    ])
    const stripe = stripeGateway({
      customerHasEntitledSubscription: async () => true,
    })

    await redeemTrialCodeAfterSignUp(
      store,
      stripe,
      {
        code: 'GO-ENTITLED01',
        userId: 'user_entitled',
        stripeCustomerId: 'cus_entitled',
        priceId: FREE_PLAN_PRICE_ID,
      },
      { now: () => NOW },
    )

    await expect(
      evaluateTrialRedeemAtSignUp(store, 'GO-ENTITLED01', NOW),
    ).resolves.toEqual({
      action: 'block',
      message: TRIAL_REDEEM_SIGNUP_ALREADY_USED_MESSAGE,
    })
  })

  it('leaves the code unused when Stripe create fails', async () => {
    const store = createMemoryStore([record({ status: 'unused' })])
    const stripe = stripeGateway({
      createNoCardTrialSubscription: async () => {
        throw new Error('stripe down')
      },
    })

    const result = await redeemTrialCodeAfterSignUp(
      store,
      stripe,
      {
        code: 'GO-ABCDEFGHIJ',
        userId: 'user_3',
        stripeCustomerId: 'cus_3',
        priceId: FREE_PLAN_PRICE_ID,
      },
      { now: () => NOW },
    )

    expect(result).toEqual({ status: 'failed' })
    expect(store.rows[0]).toMatchObject({
      status: 'unused',
      usedAt: null,
      usedBy: null,
    })
  })

  it('keeps the bearer reusable after Stripe failure', async () => {
    const store = createMemoryStore([record({ status: 'unused' })])
    const stripe = stripeGateway({
      createNoCardTrialSubscription: async () => {
        throw new Error('stripe down')
      },
    })

    await redeemTrialCodeAfterSignUp(
      store,
      stripe,
      {
        code: 'GO-ABCDEFGHIJ',
        userId: 'user_3',
        stripeCustomerId: 'cus_3',
        priceId: FREE_PLAN_PRICE_ID,
      },
      { now: () => NOW },
    )

    await expect(
      evaluateTrialRedeemAtSignUp(store, 'GO-ABCDEFGHIJ', NOW),
    ).resolves.toEqual({
      action: 'proceed',
      record: store.rows[0],
    })
  })

  it('ignores non-proceed codes without calling Stripe', async () => {
    const store = createMemoryStore([record({ status: 'redeemed' })])
    const createNoCardTrialSubscription = vi.fn()
    const customerHasEntitledSubscription = vi.fn()
    const stripe = stripeGateway({
      createNoCardTrialSubscription,
      customerHasEntitledSubscription,
    })

    const result = await redeemTrialCodeAfterSignUp(store, stripe, {
      code: 'GO-ABCDEFGHIJ',
      userId: 'user_4',
      stripeCustomerId: 'cus_4',
      priceId: FREE_PLAN_PRICE_ID,
    })

    expect(result).toEqual({ status: 'ignored' })
    expect(createNoCardTrialSubscription).not.toHaveBeenCalled()
    expect(customerHasEntitledSubscription).not.toHaveBeenCalled()
  })
})
