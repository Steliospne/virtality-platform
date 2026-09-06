import { describe, expect, it, vi } from 'vitest'
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
  evaluateAccessCodeAtProfile,
  formatAccessCodeAppliedMessage,
  isProfileBillingAccessCode,
  redeemAccessCodeOnProfile,
  routeProfileBillingCode,
  type ConsoleAccessCodeAccessGateIssuer,
  type ConsoleAccessCodeStore,
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
    applyVariant: options.applyVariant ?? (async () => 'applied'),
    userHasLiveDefaultSubscription: async () => options.hasLivePaidSub ?? false,
  }

  return {
    rows,
    ...consume,
  }
}

function accessGateIssuer(
  overrides: Partial<ConsoleAccessCodeAccessGateIssuer> = {},
): ConsoleAccessCodeAccessGateIssuer {
  return {
    hasOpenGrantedAccessGate: async () => false,
    hasOpenTimedAccessGate: async () => false,
    issueFreeGrant: async () => ({ accessGateId: 'gate_free' }),
    grantActiveTrial: async () => ({ accessGateId: 'gate_trial' }),
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
  it('issues a permanent Access Gate when there is no existing gate', async () => {
    const store = createMemoryStore([
      record({ id: 10, mode: 'permanent_free', code: 'GO-PERMFREE01' }),
    ])
    const issueFreeGrant = vi.fn(async () => ({ accessGateId: 'gate_perm' }))
    const grantActiveTrial = vi.fn()

    const result = await redeemAccessCodeOnProfile(
      store,
      accessGateIssuer({ issueFreeGrant, grantActiveTrial }),
      { userId: 'user_1', code: 'GO-PERMFREE01' },
      { now: () => NOW },
    )

    expect(result).toEqual({
      codeId: 10,
      effect: 'free_grant_created',
      accessGateId: 'gate_perm',
    })
    expect(issueFreeGrant).toHaveBeenCalledWith({ userId: 'user_1' })
    expect(grantActiveTrial).not.toHaveBeenCalled()
    expect(store.rows[0]?.status).toBe('redeemed')
  })

  it('issues a timed Access Gate when there is no existing gate', async () => {
    const store = createMemoryStore([record({ id: 11, trialDays: 21 })])
    const issueFreeGrant = vi.fn()
    const grantActiveTrial = vi.fn(async (input) => {
      expect(input).toEqual({ userId: 'user_2', trialDays: 21 })
      return { accessGateId: 'gate_trial_11' }
    })

    const result = await redeemAccessCodeOnProfile(
      store,
      accessGateIssuer({ issueFreeGrant, grantActiveTrial }),
      { userId: 'user_2', code: 'GO-ABCDEFGHIJ' },
      { now: () => NOW },
    )

    expect(result).toEqual({
      codeId: 11,
      effect: 'trial_grant_created',
      accessGateId: 'gate_trial_11',
    })
    expect(issueFreeGrant).not.toHaveBeenCalled()
    expect(grantActiveTrial).toHaveBeenCalledOnce()
  })

  it('layers a timed Access Gate on an open granted gate', async () => {
    const store = createMemoryStore([record({ id: 12 })])
    const grantActiveTrial = vi.fn(async (input) => {
      expect(input).toEqual({
        userId: 'user_3',
        trialDays: DEFAULT_TRIAL_REDEEM_DAYS,
      })
      return { accessGateId: 'gate_layered' }
    })

    const result = await redeemAccessCodeOnProfile(
      store,
      accessGateIssuer({
        hasOpenGrantedAccessGate: async () => true,
        grantActiveTrial,
      }),
      { userId: 'user_3', code: 'GO-ABCDEFGHIJ' },
      { now: () => NOW },
    )

    expect(result).toEqual({
      codeId: 12,
      effect: 'trial_grant_created',
      accessGateId: 'gate_layered',
    })
    expect(grantActiveTrial).toHaveBeenCalledOnce()
  })

  it('burns already_entitled for open granted plus permanent_free mode', async () => {
    const store = createMemoryStore([
      record({ id: 13, mode: 'permanent_free' }),
    ])

    const result = await redeemAccessCodeOnProfile(
      store,
      accessGateIssuer({ hasOpenGrantedAccessGate: async () => true }),
      { userId: 'user_4', code: 'GO-ABCDEFGHIJ' },
      { now: () => NOW },
    )

    expect(result).toEqual({ codeId: 13, effect: 'already_entitled' })
    expect(store.rows[0]?.status).toBe('already_entitled')
  })

  it('burns already_entitled for an open timed gate', async () => {
    const store = createMemoryStore([record({ id: 14 })])
    const result = await redeemAccessCodeOnProfile(
      store,
      accessGateIssuer({ hasOpenTimedAccessGate: async () => true }),
      { userId: 'user_5', code: 'GO-ABCDEFGHIJ' },
      { now: () => NOW },
    )
    expect(result.effect).toBe('already_entitled')
  })

  it('burns already_entitled for a live paid Default subscription', async () => {
    const store = createMemoryStore([record({ id: 15 })], {
      hasLivePaidSub: true,
    })
    const result = await redeemAccessCodeOnProfile(
      store,
      accessGateIssuer(),
      { userId: 'user_6', code: 'GO-ABCDEFGHIJ' },
      { now: () => NOW },
    )
    expect(result.effect).toBe('already_entitled')
  })

  it('treats only revoked or converted gates as no gate', async () => {
    const store = createMemoryStore([
      record({ id: 16, mode: 'permanent_free' }),
    ])
    const issueFreeGrant = vi.fn(async () => ({ accessGateId: 'gate_fresh' }))

    const result = await redeemAccessCodeOnProfile(
      store,
      accessGateIssuer({
        hasOpenGrantedAccessGate: async () => false,
        hasOpenTimedAccessGate: async () => false,
        issueFreeGrant,
      }),
      { userId: 'user_7', code: 'GO-ABCDEFGHIJ' },
      { now: () => NOW },
    )

    expect(result).toEqual({
      codeId: 16,
      effect: 'free_grant_created',
      accessGateId: 'gate_fresh',
    })
  })

  it('throws for unknown Access Codes', async () => {
    const store = createMemoryStore()
    await expect(
      redeemAccessCodeOnProfile(store, accessGateIssuer(), {
        userId: 'user_8',
        code: 'GO-NOSUCHCODE',
      }),
    ).rejects.toThrow(CONSOLE_ACCESS_CODE_INVALID_MESSAGE)
  })

  it('shares Expired and Already used copy with sign-up', async () => {
    const expiredStore = createMemoryStore([
      record({
        createdAt: new Date(NOW.getTime() - TRIAL_REDEEM_CODE_TTL_MS),
      }),
    ])
    await expect(
      redeemAccessCodeOnProfile(expiredStore, accessGateIssuer(), {
        userId: 'user_9',
        code: 'GO-ABCDEFGHIJ',
      }),
    ).rejects.toThrow(TRIAL_REDEEM_SIGNUP_EXPIRED_MESSAGE)

    const usedStore = createMemoryStore([record({ status: 'redeemed' })])
    await expect(
      redeemAccessCodeOnProfile(usedStore, accessGateIssuer(), {
        userId: 'user_10',
        code: 'GO-ABCDEFGHIJ',
      }),
    ).rejects.toThrow(TRIAL_REDEEM_SIGNUP_ALREADY_USED_MESSAGE)
  })
})

describe('redeemAccessCodeOnProfile variant', () => {
  it('applies the baked-in variant before consuming the code', async () => {
    const applyVariant = vi.fn(async () => 'applied' as const)
    const store = createMemoryStore(
      [record({ id: 20, mode: 'permanent_free', variant: 'early-bird' })],
      { applyVariant },
    )

    await redeemAccessCodeOnProfile(
      store,
      accessGateIssuer(),
      { userId: 'user_20', code: 'GO-ABCDEFGHIJ' },
      { now: () => NOW },
    )

    expect(applyVariant).toHaveBeenCalledWith('user_20', 'early-bird')
    expect(store.rows[0]?.status).toBe('redeemed')
  })

  it('fails the whole redemption and leaves the code unused when blocked', async () => {
    const store = createMemoryStore(
      [record({ id: 21, mode: 'permanent_free', variant: 'early-bird' })],
      { applyVariant: async () => 'blocked' },
    )

    await expect(
      redeemAccessCodeOnProfile(
        store,
        accessGateIssuer(),
        { userId: 'user_21', code: 'GO-ABCDEFGHIJ' },
        { now: () => NOW },
      ),
    ).rejects.toThrow()
    expect(store.rows[0]?.status).toBe('unused')
  })

  it('fails the whole redemption when the variant no longer resolves', async () => {
    const store = createMemoryStore(
      [record({ id: 22, mode: 'permanent_free', variant: 'retired-tier' })],
      { applyVariant: async () => 'unavailable' },
    )

    await expect(
      redeemAccessCodeOnProfile(
        store,
        accessGateIssuer(),
        { userId: 'user_22', code: 'GO-ABCDEFGHIJ' },
        { now: () => NOW },
      ),
    ).rejects.toThrow()
    expect(store.rows[0]?.status).toBe('unused')
  })

  it('does not call applyVariant when the code has no variant', async () => {
    const applyVariant = vi.fn(async () => 'applied' as const)
    const store = createMemoryStore(
      [record({ id: 23, mode: 'permanent_free' })],
      { applyVariant },
    )

    await redeemAccessCodeOnProfile(
      store,
      accessGateIssuer(),
      { userId: 'user_23', code: 'GO-ABCDEFGHIJ' },
      { now: () => NOW },
    )

    expect(applyVariant).not.toHaveBeenCalled()
  })
})

describe('formatAccessCodeAppliedMessage', () => {
  it('includes the headline and one-line effect', () => {
    expect(
      formatAccessCodeAppliedMessage({ effect: 'trial_grant_created' }),
    ).toContain('Access Code applied.')
    expect(
      formatAccessCodeAppliedMessage({ effect: 'trial_grant_created' }),
    ).toContain('free trial')
  })
})
