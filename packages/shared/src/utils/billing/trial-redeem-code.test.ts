import { describe, expect, it, vi } from 'vitest'
import {
  DEFAULT_TRIAL_REDEEM_DAYS,
  TRIAL_REDEEM_CODE_PREFIX,
  TRIAL_REDEEM_CODE_TTL_MS,
  createTrialRedeemCode,
  deleteTrialRedeemCode,
  generateTrialRedeemCode,
  getTrialRedeemDisplayStatus,
  listTrialRedeemCodes,
  sendTrialRedeemCodeEmail,
  type TrialRedeemCodeRecord,
  type TrialRedeemCodeStore,
} from './trial-redeem-code.ts'

const NOW = new Date('2026-08-10T12:00:00.000Z')
const CONSOLE_URL = 'https://console.virtality.app'

function sendEmailRuntime(
  deliver: ReturnType<typeof vi.fn>,
  findUserByEmail: (
    email: string,
  ) => Promise<{ id: string } | null> = async () => null,
) {
  return {
    now: () => NOW,
    deliver,
    consoleUrl: CONSOLE_URL,
    findUserByEmail,
  }
}

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
): TrialRedeemCodeStore & { rows: TrialRedeemCodeRecord[] } {
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
  }
}

describe('generateTrialRedeemCode', () => {
  it('returns GO- plus ten alphanumeric characters', () => {
    const code = generateTrialRedeemCode(() => 'ABCDEFGHIJ')
    expect(code).toBe(`${TRIAL_REDEEM_CODE_PREFIX}ABCDEFGHIJ`)
    expect(code).toMatch(/^GO-[A-Z0-9]{10}$/)
  })
})

describe('getTrialRedeemDisplayStatus', () => {
  it('reports unused while inside the one-week TTL', () => {
    expect(
      getTrialRedeemDisplayStatus(
        record({
          status: 'unused',
          createdAt: new Date(NOW.getTime() - TRIAL_REDEEM_CODE_TTL_MS + 1),
        }),
        NOW,
      ),
    ).toBe('unused')
  })

  it('derives expired for unused codes past the one-week TTL', () => {
    expect(
      getTrialRedeemDisplayStatus(
        record({
          status: 'unused',
          createdAt: new Date(NOW.getTime() - TRIAL_REDEEM_CODE_TTL_MS),
        }),
        NOW,
      ),
    ).toBe('expired')
  })

  it('keeps redeemed and already_entitled above TTL', () => {
    const old = new Date(NOW.getTime() - TRIAL_REDEEM_CODE_TTL_MS * 2)
    expect(
      getTrialRedeemDisplayStatus(
        record({ status: 'redeemed', createdAt: old }),
        NOW,
      ),
    ).toBe('redeemed')
    expect(
      getTrialRedeemDisplayStatus(
        record({ status: 'already_entitled', createdAt: old }),
        NOW,
      ),
    ).toBe('already_entitled')
  })
})

describe('createTrialRedeemCode', () => {
  it('creates an unused GO- code with default 14-day trial and optional note', async () => {
    const store = createMemoryStore()
    const created = await createTrialRedeemCode(
      store,
      { note: 'pilot clinic' },
      {
        now: () => NOW,
        generateCode: () => 'GO-TESTCODE01',
      },
    )

    expect(created).toMatchObject({
      code: 'GO-TESTCODE01',
      status: 'unused',
      mode: 'timed_trial',
      trialDays: DEFAULT_TRIAL_REDEEM_DAYS,
      note: 'pilot clinic',
      createdAt: NOW,
      usedAt: null,
      usedBy: null,
    })
    expect(created).not.toHaveProperty('trialStart')
    expect(created).not.toHaveProperty('trialEnd')
    expect(created).not.toHaveProperty('periodEnd')
  })

  it('stores an optional per-code trial day override', async () => {
    const store = createMemoryStore()
    const created = await createTrialRedeemCode(
      store,
      { trialDays: 30 },
      {
        now: () => NOW,
        generateCode: () => 'GO-OVERRIDE01',
      },
    )

    expect(created.trialDays).toBe(30)
  })

  it('creates a permanent_free mode code without requiring trial days', async () => {
    const store = createMemoryStore()
    const created = await createTrialRedeemCode(
      store,
      { mode: 'permanent_free', note: 'partner clinic' },
      {
        now: () => NOW,
        generateCode: () => 'GO-FREEMODE01',
      },
    )

    expect(created).toMatchObject({
      code: 'GO-FREEMODE01',
      status: 'unused',
      mode: 'permanent_free',
      note: 'partner clinic',
    })
  })
})

describe('listTrialRedeemCodes', () => {
  it('lists codes with derived display status for Adminboard buckets', async () => {
    const store = createMemoryStore([
      record({
        id: 1,
        code: 'GO-UNUSED0001',
        status: 'unused',
        createdAt: NOW,
      }),
      record({
        id: 2,
        code: 'GO-EXPIRED001',
        status: 'unused',
        createdAt: new Date(NOW.getTime() - TRIAL_REDEEM_CODE_TTL_MS),
      }),
      record({
        id: 3,
        code: 'GO-REDEEMED01',
        status: 'redeemed',
        createdAt: NOW,
      }),
      record({
        id: 4,
        code: 'GO-ENTITLED01',
        status: 'already_entitled',
        createdAt: NOW,
      }),
    ])

    const listed = await listTrialRedeemCodes(store, { now: () => NOW })

    expect(listed.map((row) => [row.code, row.displayStatus])).toEqual([
      ['GO-ENTITLED01', 'already_entitled'],
      ['GO-REDEEMED01', 'redeemed'],
      ['GO-EXPIRED001', 'expired'],
      ['GO-UNUSED0001', 'unused'],
    ])
  })

  it('filters by display status buckets', async () => {
    const store = createMemoryStore([
      record({
        id: 1,
        code: 'GO-UNUSED0001',
        status: 'unused',
        createdAt: NOW,
      }),
      record({
        id: 2,
        code: 'GO-EXPIRED001',
        status: 'unused',
        createdAt: new Date(NOW.getTime() - TRIAL_REDEEM_CODE_TTL_MS),
      }),
      record({
        id: 3,
        code: 'GO-REDEEMED01',
        status: 'redeemed',
        createdAt: NOW,
      }),
    ])

    const filtered = await listTrialRedeemCodes(store, {
      now: () => NOW,
      displayStatuses: ['expired', 'redeemed'],
    })

    expect(filtered.map((row) => row.code)).toEqual([
      'GO-REDEEMED01',
      'GO-EXPIRED001',
    ])
  })
})

describe('deleteTrialRedeemCode', () => {
  it('deletes a code row by id', async () => {
    const store = createMemoryStore([record({ id: 9, code: 'GO-DELETEME01' })])

    await deleteTrialRedeemCode(store, 9)
    expect(store.rows).toEqual([])
  })

  it('rejects delete when the code row is missing', async () => {
    const store = createMemoryStore()
    await expect(deleteTrialRedeemCode(store, 404)).rejects.toMatchObject({
      name: 'TrialRedeemCodeNotFoundError',
    })
  })
})

describe('sendTrialRedeemCodeEmail', () => {
  it('delivers to a recipient entered at send time without binding email to the code', async () => {
    const store = createMemoryStore([
      record({
        id: 3,
        code: 'GO-SENDABLE01',
        status: 'unused',
        createdAt: NOW,
      }),
    ])
    const deliver = vi.fn().mockResolvedValue(undefined)

    const result = await sendTrialRedeemCodeEmail(
      store,
      { id: 3, recipientEmail: 'clinician@clinic.example' },
      sendEmailRuntime(deliver),
    )

    expect(result).toEqual({
      code: 'GO-SENDABLE01',
      recipientEmail: 'clinician@clinic.example',
      mode: 'timed_trial',
      trialDays: DEFAULT_TRIAL_REDEEM_DAYS,
      ctaVariant: 'no_account',
      ctaUrl: `${CONSOLE_URL}/sign-up?access_code=GO-SENDABLE01`,
    })
    expect(deliver).toHaveBeenCalledWith({
      recipientEmail: 'clinician@clinic.example',
      code: 'GO-SENDABLE01',
      mode: 'timed_trial',
      trialDays: DEFAULT_TRIAL_REDEEM_DAYS,
      ctaVariant: 'no_account',
      ctaUrl: `${CONSOLE_URL}/sign-up?access_code=GO-SENDABLE01`,
    })
    expect(store.rows[0]).toMatchObject({
      id: 3,
      code: 'GO-SENDABLE01',
      status: 'unused',
      usedAt: null,
      usedBy: null,
    })
    expect(store.rows[0]).not.toHaveProperty('recipientEmail')
    expect(store.rows[0]).not.toHaveProperty('email')
  })

  it('allows re-send while the code stays unused and inside TTL', async () => {
    const store = createMemoryStore([
      record({
        id: 4,
        code: 'GO-RESEND0001',
        status: 'unused',
        createdAt: NOW,
      }),
    ])
    const deliver = vi.fn().mockResolvedValue(undefined)

    await sendTrialRedeemCodeEmail(
      store,
      { id: 4, recipientEmail: 'first@clinic.example' },
      sendEmailRuntime(deliver),
    )
    await sendTrialRedeemCodeEmail(
      store,
      { id: 4, recipientEmail: 'other@clinic.example' },
      sendEmailRuntime(deliver),
    )

    expect(deliver).toHaveBeenCalledTimes(2)
    expect(deliver).toHaveBeenNthCalledWith(2, {
      recipientEmail: 'other@clinic.example',
      code: 'GO-RESEND0001',
      mode: 'timed_trial',
      trialDays: DEFAULT_TRIAL_REDEEM_DAYS,
      ctaVariant: 'no_account',
      ctaUrl: `${CONSOLE_URL}/sign-up?access_code=GO-RESEND0001`,
    })
    expect(store.rows[0]?.status).toBe('unused')
  })

  it('rejects send when the unused code is past the one-week TTL', async () => {
    const store = createMemoryStore([
      record({
        id: 5,
        code: 'GO-EXPIRED001',
        status: 'unused',
        createdAt: new Date(NOW.getTime() - TRIAL_REDEEM_CODE_TTL_MS),
      }),
    ])
    const deliver = vi.fn()

    await expect(
      sendTrialRedeemCodeEmail(
        store,
        { id: 5, recipientEmail: 'clinician@clinic.example' },
        sendEmailRuntime(deliver),
      ),
    ).rejects.toMatchObject({ name: 'TrialRedeemCodeNotSendableError' })
    expect(deliver).not.toHaveBeenCalled()
  })

  it('rejects send for redeemed and already_entitled codes', async () => {
    const store = createMemoryStore([
      record({
        id: 6,
        code: 'GO-REDEEMED01',
        status: 'redeemed',
        createdAt: NOW,
      }),
      record({
        id: 7,
        code: 'GO-ENTITLED01',
        status: 'already_entitled',
        createdAt: NOW,
      }),
    ])
    const deliver = vi.fn()

    await expect(
      sendTrialRedeemCodeEmail(
        store,
        { id: 6, recipientEmail: 'clinician@clinic.example' },
        sendEmailRuntime(deliver),
      ),
    ).rejects.toMatchObject({ name: 'TrialRedeemCodeNotSendableError' })
    await expect(
      sendTrialRedeemCodeEmail(
        store,
        { id: 7, recipientEmail: 'clinician@clinic.example' },
        sendEmailRuntime(deliver),
      ),
    ).rejects.toMatchObject({ name: 'TrialRedeemCodeNotSendableError' })
    expect(deliver).not.toHaveBeenCalled()
  })

  it('rejects send when the code row is missing', async () => {
    const store = createMemoryStore()
    const deliver = vi.fn()

    await expect(
      sendTrialRedeemCodeEmail(
        store,
        { id: 404, recipientEmail: 'clinician@clinic.example' },
        sendEmailRuntime(deliver),
      ),
    ).rejects.toMatchObject({ name: 'TrialRedeemCodeNotFoundError' })
    expect(deliver).not.toHaveBeenCalled()
  })

  it('delivers a billing CTA when the recipient already has an account', async () => {
    const store = createMemoryStore([
      record({
        id: 8,
        code: 'GO-EXISTING01',
        status: 'unused',
        createdAt: NOW,
      }),
    ])
    const deliver = vi.fn().mockResolvedValue(undefined)
    const findUserByEmail = vi.fn().mockResolvedValue({ id: 'user-existing' })

    const result = await sendTrialRedeemCodeEmail(
      store,
      { id: 8, recipientEmail: 'existing@clinic.example' },
      sendEmailRuntime(deliver, findUserByEmail),
    )

    expect(findUserByEmail).toHaveBeenCalledWith('existing@clinic.example')
    expect(result).toMatchObject({
      ctaVariant: 'existing_account',
      ctaUrl: `${CONSOLE_URL}/user/user-existing/profile?tab=billing&access_code=GO-EXISTING01&src=email`,
    })
    expect(deliver).toHaveBeenCalledWith(
      expect.objectContaining({
        ctaVariant: 'existing_account',
        ctaUrl: `${CONSOLE_URL}/user/user-existing/profile?tab=billing&access_code=GO-EXISTING01&src=email`,
      }),
    )
  })
})
