import { describe, expect, it, vi } from 'vitest'
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
  type TrialRedeemAccessGateIssuer,
  type TrialRedeemConsumeStore,
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
    variant: null,
    createdAt: NOW,
    usedAt: null,
    usedBy: null,
    ...overrides,
  }
}

function createMemoryStore(
  initial: TrialRedeemCodeRecord[] = [],
  options: {
    hasLivePaidSub?: boolean
    applyVariant?: TrialRedeemConsumeStore['applyVariant']
  } = {},
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
    applyVariant: options.applyVariant ?? (async () => 'applied'),
    userHasLiveDefaultSubscription: async () => options.hasLivePaidSub ?? false,
  }
}

function accessGateIssuer(
  overrides: Partial<TrialRedeemAccessGateIssuer> = {},
): TrialRedeemAccessGateIssuer {
  return {
    issueFreeGrant: async () => ({ accessGateId: 'gate_free' }),
    grantActiveTrial: async () => ({ accessGateId: 'gate_trial' }),
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
  it('issues a timed Access Gate for timed_trial codes', async () => {
    const store = createMemoryStore([
      record({ id: 42, trialDays: 14, status: 'unused' }),
    ])
    const grantCalls: unknown[] = []
    const accessGate = accessGateIssuer({
      grantActiveTrial: async (input) => {
        grantCalls.push(input)
        return { accessGateId: 'gate_42' }
      },
    })

    const result = await redeemTrialCodeAfterSignUp(
      store,
      accessGate,
      { code: 'GO-ABCDEFGHIJ', userId: 'user_1' },
      { now: () => NOW },
    )

    expect(result).toEqual({
      status: 'redeemed',
      codeId: 42,
      accessGateId: 'gate_42',
    })
    expect(grantCalls).toEqual([{ userId: 'user_1', trialDays: 14 }])
    expect(store.rows[0]).toMatchObject({
      status: 'redeemed',
      usedAt: NOW,
      usedBy: 'user_1',
    })
  })

  it('uses per-code trial day override when granting the trial', async () => {
    const store = createMemoryStore([
      record({ id: 7, trialDays: 30, status: 'unused' }),
    ])
    const accessGate = accessGateIssuer({
      grantActiveTrial: async (input) => {
        expect(input.trialDays).toBe(30)
        return { accessGateId: 'gate_7' }
      },
    })

    const result = await redeemTrialCodeAfterSignUp(
      store,
      accessGate,
      { code: 'GO-ABCDEFGHIJ', userId: 'user_2' },
      { now: () => NOW },
    )

    expect(result).toMatchObject({ status: 'redeemed', accessGateId: 'gate_7' })
  })

  it('issues a permanent Access Gate for permanent_free mode codes', async () => {
    const store = createMemoryStore([
      record({
        id: 99,
        mode: 'permanent_free',
        status: 'unused',
        code: 'GO-PERMFREE01',
      }),
    ])
    const issueFreeGrant = vi.fn(async () => ({ accessGateId: 'gate_perm' }))
    const grantActiveTrial = vi.fn()
    const accessGate = accessGateIssuer({
      issueFreeGrant,
      grantActiveTrial,
    })

    const result = await redeemTrialCodeAfterSignUp(
      store,
      accessGate,
      { code: 'GO-PERMFREE01', userId: 'user_free' },
      { now: () => NOW },
    )

    expect(result).toEqual({
      status: 'redeemed',
      codeId: 99,
      accessGateId: 'gate_perm',
    })
    expect(issueFreeGrant).toHaveBeenCalledWith({ userId: 'user_free' })
    expect(grantActiveTrial).not.toHaveBeenCalled()
    expect(store.rows[0]).toMatchObject({
      status: 'redeemed',
      usedAt: NOW,
      usedBy: 'user_free',
    })
  })

  it('consumes as already_entitled for live paid Default without issuing a gate', async () => {
    const store = createMemoryStore(
      [record({ id: 55, status: 'unused', code: 'GO-ENTITLED01' })],
      { hasLivePaidSub: true },
    )
    const issueFreeGrant = vi.fn()
    const grantActiveTrial = vi.fn()
    const accessGate = accessGateIssuer({
      issueFreeGrant,
      grantActiveTrial,
    })

    const result = await redeemTrialCodeAfterSignUp(
      store,
      accessGate,
      { code: 'GO-ENTITLED01', userId: 'user_entitled' },
      { now: () => NOW },
    )

    expect(result).toEqual({
      status: 'already_entitled',
      codeId: 55,
    })
    expect(issueFreeGrant).not.toHaveBeenCalled()
    expect(grantActiveTrial).not.toHaveBeenCalled()
    expect(store.rows[0]).toMatchObject({
      status: 'already_entitled',
      usedAt: NOW,
      usedBy: 'user_entitled',
    })
  })

  it('blocks reuse of a bearer after already-entitled consume', async () => {
    const store = createMemoryStore(
      [record({ id: 55, status: 'unused', code: 'GO-ENTITLED01' })],
      { hasLivePaidSub: true },
    )

    await redeemTrialCodeAfterSignUp(
      store,
      accessGateIssuer(),
      { code: 'GO-ENTITLED01', userId: 'user_entitled' },
      { now: () => NOW },
    )

    await expect(
      evaluateTrialRedeemAtSignUp(store, 'GO-ENTITLED01', NOW),
    ).resolves.toEqual({
      action: 'block',
      message: TRIAL_REDEEM_SIGNUP_ALREADY_USED_MESSAGE,
    })
  })

  it('leaves the code unused when Access Gate issuance fails', async () => {
    const store = createMemoryStore([record({ status: 'unused' })])
    const accessGate = accessGateIssuer({
      grantActiveTrial: async () => {
        throw new Error('grant failed')
      },
    })

    const result = await redeemTrialCodeAfterSignUp(
      store,
      accessGate,
      { code: 'GO-ABCDEFGHIJ', userId: 'user_3' },
      { now: () => NOW },
    )

    expect(result).toEqual({ status: 'failed' })
    expect(store.rows[0]).toMatchObject({
      status: 'unused',
      usedAt: null,
      usedBy: null,
    })
  })

  it('keeps the bearer reusable after issuance failure', async () => {
    const store = createMemoryStore([record({ status: 'unused' })])
    const accessGate = accessGateIssuer({
      grantActiveTrial: async () => {
        throw new Error('grant failed')
      },
    })

    await redeemTrialCodeAfterSignUp(
      store,
      accessGate,
      { code: 'GO-ABCDEFGHIJ', userId: 'user_3' },
      { now: () => NOW },
    )

    await expect(
      evaluateTrialRedeemAtSignUp(store, 'GO-ABCDEFGHIJ', NOW),
    ).resolves.toEqual({
      action: 'proceed',
      record: store.rows[0],
    })
  })

  it('ignores non-proceed codes without issuing a gate', async () => {
    const store = createMemoryStore([record({ status: 'redeemed' })])
    const issueFreeGrant = vi.fn()
    const grantActiveTrial = vi.fn()
    const accessGate = accessGateIssuer({
      issueFreeGrant,
      grantActiveTrial,
    })

    const result = await redeemTrialCodeAfterSignUp(store, accessGate, {
      code: 'GO-ABCDEFGHIJ',
      userId: 'user_4',
    })

    expect(result).toEqual({ status: 'ignored' })
    expect(issueFreeGrant).not.toHaveBeenCalled()
    expect(grantActiveTrial).not.toHaveBeenCalled()
  })

  it('applies the baked-in variant before consuming the code', async () => {
    const applyVariant = vi.fn(async () => 'applied' as const)
    const store = createMemoryStore(
      [record({ id: 60, mode: 'permanent_free', variant: 'early-bird' })],
      { applyVariant },
    )

    await redeemTrialCodeAfterSignUp(
      store,
      accessGateIssuer(),
      { code: 'GO-ABCDEFGHIJ', userId: 'user_60' },
      { now: () => NOW },
    )

    expect(applyVariant).toHaveBeenCalledWith('user_60', 'early-bird')
    expect(store.rows[0]?.status).toBe('redeemed')
  })

  it('fails and leaves the code unused when the variant is blocked', async () => {
    const store = createMemoryStore(
      [record({ id: 61, mode: 'permanent_free', variant: 'early-bird' })],
      { applyVariant: async () => 'blocked' },
    )

    const result = await redeemTrialCodeAfterSignUp(
      store,
      accessGateIssuer(),
      { code: 'GO-ABCDEFGHIJ', userId: 'user_61' },
      { now: () => NOW },
    )

    expect(result).toEqual({ status: 'failed' })
    expect(store.rows[0]?.status).toBe('unused')
  })

  it('fails and leaves the code unused when the variant no longer resolves', async () => {
    const store = createMemoryStore(
      [record({ id: 62, mode: 'permanent_free', variant: 'retired-tier' })],
      { applyVariant: async () => 'unavailable' },
    )

    const result = await redeemTrialCodeAfterSignUp(
      store,
      accessGateIssuer(),
      { code: 'GO-ABCDEFGHIJ', userId: 'user_62' },
      { now: () => NOW },
    )

    expect(result).toEqual({ status: 'failed' })
    expect(store.rows[0]?.status).toBe('unused')
  })
})
