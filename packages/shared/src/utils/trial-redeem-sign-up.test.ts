import { describe, expect, it, vi } from 'vitest'
import {
  DEFAULT_TRIAL_REDEEM_DAYS,
  TRIAL_REDEEM_CODE_TTL_MS,
  type TrialRedeemCodeRecord,
} from './trial-redeem-code.ts'
import {
  TRIAL_REDEEM_SIGNUP_ALREADY_USED_MESSAGE,
  TRIAL_REDEEM_SIGNUP_EXPIRED_MESSAGE,
  evaluateTrialRedeemAtSignUp,
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
    code: 'PAY-ABCDEFGHIJ',
    status: 'unused',
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
  let nextId = rows.reduce((max, row) => Math.max(max, row.id), 0) + 1

  return {
    rows,
    findByCode: async (code) => rows.find((row) => row.code === code) ?? null,
    findById: async (id) => rows.find((row) => row.id === id) ?? null,
    create: async (data) => {
      const created = { id: nextId++, ...data }
      rows.unshift(created)
      return created
    },
    listAll: async () => [...rows].sort((a, b) => b.id - a.id),
    deleteById: async (id) => {
      const index = rows.findIndex((row) => row.id === id)
      if (index === -1) throw new Error('NOT_FOUND')
      rows.splice(index, 1)
    },
    consumeAsRedeemed: async (id, usedBy, usedAt) => {
      const row = rows.find((r) => r.id === id)
      if (!row || row.status !== 'unused') return false
      row.status = 'redeemed'
      row.usedAt = usedAt
      row.usedBy = usedBy
      return true
    },
  }
}

describe('routeSignUpCode', () => {
  it('routes PAY- to trial redeem and TE- to tester', () => {
    expect(routeSignUpCode('PAY-ABCDEFGHIJ')).toEqual({
      kind: 'trial_redeem',
      code: 'PAY-ABCDEFGHIJ',
    })
    expect(routeSignUpCode('pay-abcdefghij')).toEqual({
      kind: 'trial_redeem',
      code: 'PAY-ABCDEFGHIJ',
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
    expect(routeSignUpCode('PAY-SHORT')).toEqual({ kind: 'none' })
    expect(routeSignUpCode('NOT-A-CODE')).toEqual({ kind: 'none' })
  })
})

describe('evaluateTrialRedeemAtSignUp', () => {
  it('ignores missing or non-matching PAY- lookups', async () => {
    const store = createMemoryStore()
    await expect(
      evaluateTrialRedeemAtSignUp(store, 'PAY-NOSUCHCODE', NOW),
    ).resolves.toEqual({ action: 'ignore' })
    await expect(
      evaluateTrialRedeemAtSignUp(store, 'PAY-SHORT', NOW),
    ).resolves.toEqual({ action: 'ignore' })
    await expect(evaluateTrialRedeemAtSignUp(store, '', NOW)).resolves.toEqual({
      action: 'ignore',
    })
  })

  it('blocks derived expired codes with Expired [COPY]', async () => {
    const store = createMemoryStore([
      record({
        status: 'unused',
        createdAt: new Date(NOW.getTime() - TRIAL_REDEEM_CODE_TTL_MS),
      }),
    ])

    await expect(
      evaluateTrialRedeemAtSignUp(store, 'PAY-ABCDEFGHIJ', NOW),
    ).resolves.toEqual({
      action: 'block',
      message: TRIAL_REDEEM_SIGNUP_EXPIRED_MESSAGE,
    })
  })

  it('blocks redeemed and already_entitled with shared Already used [COPY]', async () => {
    const redeemedStore = createMemoryStore([record({ status: 'redeemed' })])
    const entitledStore = createMemoryStore([
      record({ status: 'already_entitled' }),
    ])

    await expect(
      evaluateTrialRedeemAtSignUp(redeemedStore, 'PAY-ABCDEFGHIJ', NOW),
    ).resolves.toEqual({
      action: 'block',
      message: TRIAL_REDEEM_SIGNUP_ALREADY_USED_MESSAGE,
    })
    await expect(
      evaluateTrialRedeemAtSignUp(entitledStore, 'pay-abcdefghij', NOW),
    ).resolves.toEqual({
      action: 'block',
      message: TRIAL_REDEEM_SIGNUP_ALREADY_USED_MESSAGE,
    })
  })

  it('allows unused in-TTL codes to proceed', async () => {
    const unused = record({ status: 'unused', createdAt: NOW })
    const store = createMemoryStore([unused])

    await expect(
      evaluateTrialRedeemAtSignUp(store, 'PAY-ABCDEFGHIJ', NOW),
    ).resolves.toEqual({ action: 'proceed', record: unused })
  })
})

describe('redeemTrialCodeAfterSignUp', () => {
  it('creates a no-card trial Subscription then consumes as redeemed', async () => {
    const store = createMemoryStore([
      record({ id: 42, trialDays: 14, status: 'unused' }),
    ])
    const stripeCalls: unknown[] = []
    const stripe: TrialRedeemStripeGateway = {
      createNoCardTrialSubscription: async (input) => {
        stripeCalls.push(input)
        return { stripeSubscriptionId: 'sub_trial_1' }
      },
    }

    const result = await redeemTrialCodeAfterSignUp(
      store,
      stripe,
      {
        code: 'PAY-ABCDEFGHIJ',
        userId: 'user_1',
        stripeCustomerId: 'cus_1',
        priceId: 'price_1SeVrm4Fc2DAAhEfIWIRZ2v9',
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
        priceId: 'price_1SeVrm4Fc2DAAhEfIWIRZ2v9',
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
    const stripe: TrialRedeemStripeGateway = {
      createNoCardTrialSubscription: async (input) => {
        expect(input.trialPeriodDays).toBe(30)
        return { stripeSubscriptionId: 'sub_override' }
      },
    }

    const result = await redeemTrialCodeAfterSignUp(store, stripe, {
      code: 'PAY-ABCDEFGHIJ',
      userId: 'user_2',
      stripeCustomerId: 'cus_2',
      priceId: 'price_canonical',
    })

    expect(result).toMatchObject({ status: 'redeemed' })
  })

  it('leaves the code unused when Stripe create fails', async () => {
    const store = createMemoryStore([record({ status: 'unused' })])
    const stripe: TrialRedeemStripeGateway = {
      createNoCardTrialSubscription: async () => {
        throw new Error('stripe down')
      },
    }

    const result = await redeemTrialCodeAfterSignUp(store, stripe, {
      code: 'PAY-ABCDEFGHIJ',
      userId: 'user_3',
      stripeCustomerId: 'cus_3',
      priceId: 'price_canonical',
    })

    expect(result).toEqual({ status: 'failed' })
    expect(store.rows[0]).toMatchObject({
      status: 'unused',
      usedAt: null,
      usedBy: null,
    })
  })

  it('ignores non-proceed codes without calling Stripe', async () => {
    const store = createMemoryStore([record({ status: 'redeemed' })])
    const createNoCardTrialSubscription = vi.fn()
    const stripe: TrialRedeemStripeGateway = { createNoCardTrialSubscription }

    const result = await redeemTrialCodeAfterSignUp(store, stripe, {
      code: 'PAY-ABCDEFGHIJ',
      userId: 'user_4',
      stripeCustomerId: 'cus_4',
      priceId: 'price_canonical',
    })

    expect(result).toEqual({ status: 'ignored' })
    expect(createNoCardTrialSubscription).not.toHaveBeenCalled()
  })
})
