import { describe, expect, it, vi } from 'vitest'
import type { AdminCustomerBillingSnapshot } from '../admin-customer/admin-customer-access.ts'
import {
  assignPermanentAccessGateToCustomer,
  revokeAccessGateForCustomer,
  setAccessGateTrialForCustomer,
  StaffAccessGateConvertedError,
  StaffAccessGateOpenNotFoundError,
  StaffAccessGateValidationError,
  type StaffAccessGateStore,
} from './staff-access-gate.ts'

const NOW = new Date('2026-08-10T12:00:00.000Z')
const TRIAL_END = new Date('2026-08-17T12:00:00.000Z')
const ACTOR_ID = 'admin_1'

const USER = {
  id: 'user_1',
  name: 'Clinician',
  email: 'clinician@example.com',
  role: 'user',
} as const

function snapshot(): AdminCustomerBillingSnapshot {
  return {
    role: 'user',
    stripeCustomerId: null,
    primaryPlan: null,
    primaryStatus: null,
    stripeSubscriptionId: null,
    assignedDefaultVariant: null,
  }
}

function openGate(
  overrides: Partial<{
    id: string
    status: 'granted' | 'trialing'
    trialStart: Date | null
    trialEnd: Date | null
  }> = {},
) {
  return {
    id: 'gate_1',
    userId: USER.id,
    status: overrides.status ?? 'trialing',
    trialStart: overrides.trialStart ?? NOW,
    trialEnd: overrides.trialEnd === undefined ? TRIAL_END : overrides.trialEnd,
  }
}

function createStore(
  overrides: Partial<{
    user: typeof USER | null
    openGate: ReturnType<typeof openGate> | null
    converted: boolean
  }> = {},
): StaffAccessGateStore {
  let open = overrides.openGate === undefined ? null : overrides.openGate
  const converted = overrides.converted ?? false
  const user = overrides.user === undefined ? USER : overrides.user

  return {
    findTargetUser: async (userId) =>
      user && user.id === userId ? user : null,
    findOpenAccessGateByUserId: async () => open,
    userHasConvertedAccessGate: async () => converted,
    createAccessGate: vi.fn(async (input) => {
      const created = {
        id: 'gate_new',
        userId: input.userId,
        status: input.status,
        trialStart: input.trialStart,
        trialEnd: input.trialEnd,
      }
      open = created
      return created
    }),
    updateAccessGate: vi.fn(async (input) => {
      if (!open || open.id !== input.accessGateId) {
        throw new Error('missing gate')
      }
      open = {
        ...open,
        status: input.status,
        trialStart: input.trialStart ?? open.trialStart,
        trialEnd: input.trialEnd,
      }
      return open
    }),
    revokeAccessGate: vi.fn(async () => {
      if (!open) throw new Error('missing gate')
      open = {
        ...open,
        status: 'revoked',
      }
      return open
    }),
    updateRoleToUser: vi.fn(async () => {}),
    summarizeBillingState: async () => snapshot(),
    recordAudit: vi.fn(async () => ({ id: 'audit_1' })),
  }
}

describe('assignPermanentAccessGateToCustomer', () => {
  it('creates a granted Access Gate when none is open', async () => {
    const store = createStore({ openGate: null })

    const result = await assignPermanentAccessGateToCustomer(
      store,
      {
        userId: USER.id,
        actorUserId: ACTOR_ID,
        reason: 'Support grant',
      },
      { now: () => NOW },
    )

    expect(store.createAccessGate).toHaveBeenCalledWith({
      userId: USER.id,
      trialStart: NOW,
      trialEnd: null,
      status: 'granted',
    })
    expect(result.status).toBe('granted')
    expect(result.trialEnd).toBeNull()
    expect(store.recordAudit).toHaveBeenCalledWith(
      expect.objectContaining({ action: 'assign_permanent_access_gate' }),
    )
  })

  it('reverts an open trialing gate to granted without Stripe', async () => {
    const store = createStore({ openGate: openGate() })

    const result = await assignPermanentAccessGateToCustomer(store, {
      userId: USER.id,
      actorUserId: ACTOR_ID,
      reason: 'Remove trial clock',
    })

    expect(store.updateAccessGate).toHaveBeenCalledWith({
      accessGateId: 'gate_1',
      status: 'granted',
      trialEnd: null,
    })
    expect(result.status).toBe('granted')
  })

  it('blocks when the customer already converted an Access Gate', async () => {
    const store = createStore({ converted: true })

    await expect(
      assignPermanentAccessGateToCustomer(store, {
        userId: USER.id,
        actorUserId: ACTOR_ID,
        reason: 'Too late',
      }),
    ).rejects.toBeInstanceOf(StaffAccessGateConvertedError)
  })
})

describe('setAccessGateTrialForCustomer', () => {
  it('issues trial access on a new row', async () => {
    const store = createStore({ openGate: null })

    const result = await setAccessGateTrialForCustomer(
      store,
      {
        userId: USER.id,
        actorUserId: ACTOR_ID,
        reason: 'Issue timed access',
        amount: 7,
        unit: 'days',
      },
      { now: () => NOW },
    )

    expect(store.createAccessGate).toHaveBeenCalledWith({
      userId: USER.id,
      trialStart: NOW,
      trialEnd: TRIAL_END,
      status: 'trialing',
    })
    expect(result.mode).toBe('issued')
    expect(result.trialEnd).toEqual(TRIAL_END)
    expect(store.recordAudit).toHaveBeenCalledWith(
      expect.objectContaining({ action: 'set_access_gate_trial' }),
    )
  })

  it('extends an existing timed gate from the current clock end', async () => {
    const store = createStore({ openGate: openGate() })

    const result = await setAccessGateTrialForCustomer(
      store,
      {
        userId: USER.id,
        actorUserId: ACTOR_ID,
        reason: 'Extend access',
        amount: 7,
        unit: 'days',
      },
      { now: () => NOW },
    )

    expect(store.updateAccessGate).toHaveBeenCalledWith({
      accessGateId: 'gate_1',
      status: 'trialing',
      trialStart: NOW,
      trialEnd: new Date('2026-08-24T12:00:00.000Z'),
    })
    expect(result.mode).toBe('extended')
  })

  it('starts a timed gate from now when converting a granted gate', async () => {
    const store = createStore({
      openGate: openGate({ status: 'granted', trialEnd: null }),
    })

    await setAccessGateTrialForCustomer(
      store,
      {
        userId: USER.id,
        actorUserId: ACTOR_ID,
        reason: 'Add trial clock',
        amount: 7,
        unit: 'days',
      },
      { now: () => NOW },
    )

    expect(store.updateAccessGate).toHaveBeenCalledWith({
      accessGateId: 'gate_1',
      status: 'trialing',
      trialStart: NOW,
      trialEnd: TRIAL_END,
    })
  })

  it('rejects reduce that would end the gate in the past', async () => {
    const store = createStore({ openGate: openGate() })

    await expect(
      setAccessGateTrialForCustomer(
        store,
        {
          userId: USER.id,
          actorUserId: ACTOR_ID,
          reason: 'Too much',
          amount: 30,
          unit: 'days',
          direction: 'reduce',
        },
        { now: () => NOW },
      ),
    ).rejects.toBeInstanceOf(StaffAccessGateValidationError)
  })
})

describe('revokeAccessGateForCustomer', () => {
  it('revokes the open gate and records audit', async () => {
    const store = createStore({ openGate: openGate() })

    const result = await revokeAccessGateForCustomer(store, {
      userId: USER.id,
      actorUserId: ACTOR_ID,
      reason: 'Close access',
    })

    expect(store.revokeAccessGate).toHaveBeenCalledWith({ userId: USER.id })
    expect(result.status).toBe('revoked')
    expect(store.recordAudit).toHaveBeenCalledWith(
      expect.objectContaining({ action: 'revoke_access_gate' }),
    )
  })

  it('requires an open gate', async () => {
    const store = createStore({ openGate: null })

    await expect(
      revokeAccessGateForCustomer(store, {
        userId: USER.id,
        actorUserId: ACTOR_ID,
        reason: 'Nothing to revoke',
      }),
    ).rejects.toBeInstanceOf(StaffAccessGateOpenNotFoundError)
  })
})
