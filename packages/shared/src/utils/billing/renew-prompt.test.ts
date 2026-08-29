import { describe, expect, it, vi } from 'vitest'
import {
  evaluateAndDeliverRenewPrompts,
  isRenewOffsetDue,
  listInAppRenewPromptsForSeat,
  rearmRenewPromptEpoch,
  rearmRenewPromptEpochForSubscription,
  rearmRenewPromptEpochIfClockChanged,
  renewPromptEpochKey,
  selectDueRenewPrompts,
  RENEW_PROMPT_MS_PER_DAY,
  type RenewPromptDeliveryRecord,
  type RenewPromptDeliveryStore,
  type RenewPromptEmailPayload,
} from './renew-prompt.ts'
import type { RenewTriggerChannel } from '../../types/renew-trigger.ts'
import type { RenewTriggerRecord, RenewTriggerStore } from './renew-trigger.ts'

const CLOCK_END = new Date('2026-08-17T12:00:00.000Z')
const MS_PER_DAY = RENEW_PROMPT_MS_PER_DAY

describe('renewPromptEpochKey', () => {
  it('keys the epoch by Entitlement Clock end ISO instant', () => {
    expect(renewPromptEpochKey(CLOCK_END)).toBe('2026-08-17T12:00:00.000Z')
  })
})

describe('isRenewOffsetDue', () => {
  it('is due once now reaches clockEnd minus daysBefore', () => {
    expect(
      isRenewOffsetDue({
        now: new Date(CLOCK_END.getTime() - 7 * MS_PER_DAY),
        clockEnd: CLOCK_END,
        daysBefore: 7,
      }),
    ).toBe(true)

    expect(
      isRenewOffsetDue({
        now: new Date(CLOCK_END.getTime() - 7 * MS_PER_DAY - 1),
        clockEnd: CLOCK_END,
        daysBefore: 7,
      }),
    ).toBe(false)
  })

  it('treats trial and paid clock ends the same way', () => {
    const trialEnd = new Date('2026-09-01T00:00:00.000Z')
    const periodEnd = new Date('2026-10-01T00:00:00.000Z')
    const nowNearTrial = new Date(trialEnd.getTime() - 3 * MS_PER_DAY)
    const nowNearPaid = new Date(periodEnd.getTime() - 3 * MS_PER_DAY)

    expect(
      isRenewOffsetDue({
        now: nowNearTrial,
        clockEnd: trialEnd,
        daysBefore: 3,
      }),
    ).toBe(true)
    expect(
      isRenewOffsetDue({
        now: nowNearPaid,
        clockEnd: periodEnd,
        daysBefore: 3,
      }),
    ).toBe(true)
  })
})

describe('selectDueRenewPrompts', () => {
  it('returns nothing after expiry when there is no live clock', () => {
    expect(
      selectDueRenewPrompts({
        now: new Date('2026-08-18T12:00:00.000Z'),
        entitled: false,
        clockEnd: null,
        triggers: [
          { channel: 'email', daysBefore: 7, active: true },
          { channel: 'in_app', daysBefore: 7, active: true },
        ],
        alreadyDelivered: [],
      }),
    ).toEqual([])
  })

  it('catch-up fires each missed active offset once for the current epoch', () => {
    const epochKey = renewPromptEpochKey(CLOCK_END)
    const now = new Date(CLOCK_END.getTime() - 2 * MS_PER_DAY)

    const due = selectDueRenewPrompts({
      now,
      entitled: true,
      clockEnd: CLOCK_END,
      triggers: [
        { channel: 'email', daysBefore: 7, active: true },
        { channel: 'email', daysBefore: 3, active: true },
        { channel: 'email', daysBefore: 1, active: true },
        { channel: 'in_app', daysBefore: 7, active: true },
        { channel: 'in_app', daysBefore: 3, active: false },
      ],
      alreadyDelivered: [
        {
          channel: 'email',
          daysBefore: 7,
          epochKey,
        },
      ],
    })

    expect(due).toEqual([
      { channel: 'email', daysBefore: 3, epochKey },
      { channel: 'in_app', daysBefore: 7, epochKey },
    ])
  })

  it('does not re-select offsets already delivered for this epoch', () => {
    const epochKey = renewPromptEpochKey(CLOCK_END)
    const now = new Date(CLOCK_END.getTime() - 1 * MS_PER_DAY)

    expect(
      selectDueRenewPrompts({
        now,
        entitled: true,
        clockEnd: CLOCK_END,
        triggers: [{ channel: 'email', daysBefore: 1, active: true }],
        alreadyDelivered: [{ channel: 'email', daysBefore: 1, epochKey }],
      }),
    ).toEqual([])
  })

  it('ignores delivery records from a prior epoch keyed by a different clock end', () => {
    const priorEpoch = renewPromptEpochKey(new Date('2026-07-01T12:00:00.000Z'))
    const epochKey = renewPromptEpochKey(CLOCK_END)
    const now = new Date(CLOCK_END.getTime() - 7 * MS_PER_DAY)

    expect(
      selectDueRenewPrompts({
        now,
        entitled: true,
        clockEnd: CLOCK_END,
        triggers: [{ channel: 'email', daysBefore: 7, active: true }],
        alreadyDelivered: [
          { channel: 'email', daysBefore: 7, epochKey: priorEpoch },
        ],
      }),
    ).toEqual([{ channel: 'email', daysBefore: 7, epochKey }])
  })
})

function createTriggerStore(
  rows: Array<{
    channel: RenewTriggerChannel
    daysBefore: number
    active: boolean
  }>,
): RenewTriggerStore {
  const records: RenewTriggerRecord[] = rows.map((row, index) => ({
    id: `trigger-${index}`,
    channel: row.channel,
    daysBefore: row.daysBefore,
    active: row.active,
    createdAt: CLOCK_END,
    updatedAt: CLOCK_END,
  }))

  return {
    findById: async (id) => records.find((r) => r.id === id) ?? null,
    findByChannelAndDaysBefore: async (channel, daysBefore) =>
      records.find(
        (r) => r.channel === channel && r.daysBefore === daysBefore,
      ) ?? null,
    create: async () => {
      throw new Error('not used')
    },
    update: async () => {
      throw new Error('not used')
    },
    deleteById: async () => {},
    listByChannel: async (channel) =>
      records.filter((r) => r.channel === channel),
  }
}

function createDeliveryStore(
  initial: RenewPromptDeliveryRecord[] = [],
): RenewPromptDeliveryStore & { records: RenewPromptDeliveryRecord[] } {
  const records = [...initial]
  return {
    records,
    listForUserAndEpoch: vi.fn(async (userId, epochKey) =>
      records.filter((r) => r.userId === userId && r.epochKey === epochKey),
    ),
    create: vi.fn(async (data) => {
      const record: RenewPromptDeliveryRecord = { ...data }
      records.push(record)
      return record
    }),
    deleteOutsideEpoch: vi.fn(async (userId, epochKey) => {
      let dropped = 0
      for (let i = records.length - 1; i >= 0; i -= 1) {
        const row = records[i]!
        if (row.userId === userId && row.epochKey !== epochKey) {
          records.splice(i, 1)
          dropped += 1
        }
      }
      return dropped
    }),
  }
}

describe('rearmRenewPromptEpoch', () => {
  it('starts a new epoch and drops prior-epoch renew backlog', async () => {
    const priorEpoch = renewPromptEpochKey(new Date('2026-07-01T12:00:00.000Z'))
    const nextClockEnd = CLOCK_END
    const nextEpoch = renewPromptEpochKey(nextClockEnd)
    const store = createDeliveryStore([
      {
        id: 'old-email',
        userId: 'user-1',
        channel: 'email',
        daysBefore: 7,
        epochKey: priorEpoch,
        deliveredAt: new Date('2026-06-24T12:00:00.000Z'),
      },
      {
        id: 'old-in-app',
        userId: 'user-1',
        channel: 'in_app',
        daysBefore: 3,
        epochKey: priorEpoch,
        deliveredAt: new Date('2026-06-28T12:00:00.000Z'),
      },
      {
        id: 'other-user',
        userId: 'user-2',
        channel: 'email',
        daysBefore: 7,
        epochKey: priorEpoch,
        deliveredAt: new Date('2026-06-24T12:00:00.000Z'),
      },
    ])

    const result = await rearmRenewPromptEpoch(store, {
      userId: 'user-1',
      clockEnd: nextClockEnd,
    })

    expect(result).toEqual({ epochKey: nextEpoch, dropped: 2 })
    expect(store.records).toEqual([
      expect.objectContaining({ id: 'other-user', userId: 'user-2' }),
    ])
    await expect(
      listInAppRenewPromptsForSeat(store, {
        userId: 'user-1',
        standing: {
          entitled: true,
          clockEnd: nextClockEnd,
          remainingMs: 7 * MS_PER_DAY,
          status: 'trialing',
        },
      }),
    ).resolves.toEqual([])
  })

  it('lets offsets fire again toward the new clock end after Extension or Checkout', async () => {
    const priorClockEnd = new Date('2026-07-01T12:00:00.000Z')
    const priorEpoch = renewPromptEpochKey(priorClockEnd)
    const nextClockEnd = CLOCK_END
    const nextEpoch = renewPromptEpochKey(nextClockEnd)
    const now = new Date(nextClockEnd.getTime() - 7 * MS_PER_DAY)
    const emails: RenewPromptEmailPayload[] = []
    const deliveryStore = createDeliveryStore([
      {
        id: 'prior-email',
        userId: 'user-1',
        channel: 'email',
        daysBefore: 7,
        epochKey: priorEpoch,
        deliveredAt: new Date('2026-06-24T12:00:00.000Z'),
      },
      {
        id: 'prior-in-app',
        userId: 'user-1',
        channel: 'in_app',
        daysBefore: 7,
        epochKey: priorEpoch,
        deliveredAt: new Date('2026-06-24T12:00:00.000Z'),
      },
    ])
    const stores = {
      triggers: createTriggerStore([
        { channel: 'email', daysBefore: 7, active: true },
        { channel: 'in_app', daysBefore: 7, active: true },
      ]),
      deliveries: deliveryStore,
    }
    const seat = {
      userId: 'user-1',
      recipientEmail: 'seat@clinic.example',
      standing: {
        entitled: true,
        clockEnd: nextClockEnd,
        remainingMs: 7 * MS_PER_DAY,
        status: 'trialing' as const,
      },
    }
    const deps = {
      generateId: () => `delivery-${deliveryStore.records.length + 1}`,
      now: () => now,
      deliverEmail: async (payload: RenewPromptEmailPayload) => {
        emails.push(payload)
      },
    }

    await rearmRenewPromptEpoch(deliveryStore, {
      userId: 'user-1',
      clockEnd: nextClockEnd,
    })
    const result = await evaluateAndDeliverRenewPrompts(stores, deps, seat)

    expect(result.delivered).toEqual([
      { channel: 'email', daysBefore: 7, epochKey: nextEpoch },
      { channel: 'in_app', daysBefore: 7, epochKey: nextEpoch },
    ])
    expect(emails).toHaveLength(1)
    expect(emails[0]?.epochKey).toBe(nextEpoch)
  })

  it('still evaluates once per offset per epoch after re-arm', async () => {
    const nextClockEnd = CLOCK_END
    const nextEpoch = renewPromptEpochKey(nextClockEnd)
    const now = new Date(nextClockEnd.getTime() - 1 * MS_PER_DAY)
    const emails: RenewPromptEmailPayload[] = []
    const deliveryStore = createDeliveryStore()
    const stores = {
      triggers: createTriggerStore([
        { channel: 'email', daysBefore: 1, active: true },
      ]),
      deliveries: deliveryStore,
    }
    const seat = {
      userId: 'user-1',
      recipientEmail: 'seat@clinic.example',
      standing: {
        entitled: true,
        clockEnd: nextClockEnd,
        remainingMs: MS_PER_DAY,
        status: 'active' as const,
      },
    }
    const deps = {
      generateId: () =>
        `id-${emails.length + deliveryStore.records.length + 1}`,
      now: () => now,
      deliverEmail: async (payload: RenewPromptEmailPayload) => {
        emails.push(payload)
      },
    }

    await rearmRenewPromptEpoch(deliveryStore, {
      userId: 'user-1',
      clockEnd: nextClockEnd,
    })
    await evaluateAndDeliverRenewPrompts(stores, deps, seat)
    await evaluateAndDeliverRenewPrompts(stores, deps, seat)

    expect(emails).toHaveLength(1)
    expect(deliveryStore.records).toEqual([
      expect.objectContaining({
        channel: 'email',
        daysBefore: 1,
        epochKey: nextEpoch,
      }),
    ])
  })

  it('does not re-arm when Extension leaves the clock end unchanged', async () => {
    const priorEpoch = renewPromptEpochKey(new Date('2026-07-01T12:00:00.000Z'))
    const store = createDeliveryStore([
      {
        id: 'prior',
        userId: 'user-1',
        channel: 'email',
        daysBefore: 7,
        epochKey: priorEpoch,
        deliveredAt: new Date('2026-06-24T12:00:00.000Z'),
      },
    ])

    await expect(
      rearmRenewPromptEpochIfClockChanged(store, {
        userId: 'user-1',
        previousClockEnd: CLOCK_END,
        nextClockEnd: CLOCK_END,
      }),
    ).resolves.toEqual({
      rearmed: false,
      epochKey: renewPromptEpochKey(CLOCK_END),
      dropped: 0,
    })
    expect(store.records).toHaveLength(1)
  })

  it('re-arms when Extension changes the clock end', async () => {
    const priorEpoch = renewPromptEpochKey(new Date('2026-07-01T12:00:00.000Z'))
    const store = createDeliveryStore([
      {
        id: 'prior',
        userId: 'user-1',
        channel: 'email',
        daysBefore: 7,
        epochKey: priorEpoch,
        deliveredAt: new Date('2026-06-24T12:00:00.000Z'),
      },
    ])

    await expect(
      rearmRenewPromptEpochIfClockChanged(store, {
        userId: 'user-1',
        previousClockEnd: new Date('2026-07-01T12:00:00.000Z'),
        nextClockEnd: CLOCK_END,
      }),
    ).resolves.toEqual({
      rearmed: true,
      epochKey: renewPromptEpochKey(CLOCK_END),
      dropped: 1,
    })
    expect(store.records).toEqual([])
  })

  it('does not re-arm when Extension yields no next clock end', async () => {
    const store = createDeliveryStore()

    await expect(
      rearmRenewPromptEpochIfClockChanged(store, {
        userId: 'user-1',
        previousClockEnd: CLOCK_END,
        nextClockEnd: null,
      }),
    ).resolves.toEqual({ rearmed: false, epochKey: null, dropped: 0 })
  })

  it('starts a new epoch from a live Subscribe/Renew subscription clock', async () => {
    const priorEpoch = renewPromptEpochKey(new Date('2026-07-01T12:00:00.000Z'))
    const paidEnd = new Date('2026-09-10T12:00:00.000Z')
    const store = createDeliveryStore([
      {
        id: 'stale-in-app',
        userId: 'user-1',
        channel: 'in_app',
        daysBefore: 7,
        epochKey: priorEpoch,
        deliveredAt: new Date('2026-06-24T12:00:00.000Z'),
      },
    ])

    await expect(
      rearmRenewPromptEpochForSubscription(store, {
        referenceId: 'user-1',
        status: 'active',
        trialEnd: null,
        periodEnd: paidEnd,
      }),
    ).resolves.toEqual({
      rearmed: true,
      epochKey: renewPromptEpochKey(paidEnd),
      dropped: 1,
    })
    expect(store.records).toEqual([])
  })

  it('skips re-arm when the subscription has no live clock end', async () => {
    const paidEnd = new Date('2026-09-10T12:00:00.000Z')
    const store = createDeliveryStore([
      {
        id: 'stale-in-app',
        userId: 'user-1',
        channel: 'in_app',
        daysBefore: 7,
        epochKey: renewPromptEpochKey(new Date('2026-07-01T12:00:00.000Z')),
        deliveredAt: new Date('2026-06-24T12:00:00.000Z'),
      },
    ])

    await expect(
      rearmRenewPromptEpochForSubscription(store, {
        referenceId: 'user-1',
        status: 'canceled',
        trialEnd: null,
        periodEnd: paidEnd,
      }),
    ).resolves.toEqual({ rearmed: false, epochKey: null, dropped: 0 })
    expect(store.records).toHaveLength(1)
  })
})

describe('evaluateAndDeliverRenewPrompts', () => {
  it('sends System Email and records in-app once per channel offset per epoch', async () => {
    const epochKey = renewPromptEpochKey(CLOCK_END)
    const now = new Date(CLOCK_END.getTime() - 3 * MS_PER_DAY)
    const emails: RenewPromptEmailPayload[] = []
    const triggerStore = createTriggerStore([
      { channel: 'email', daysBefore: 3, active: true },
      { channel: 'in_app', daysBefore: 3, active: true },
    ])
    const deliveryStore = createDeliveryStore()

    const result = await evaluateAndDeliverRenewPrompts(
      { triggers: triggerStore, deliveries: deliveryStore },
      {
        generateId: () =>
          `delivery-${emails.length + deliveryStore.records.length + 1}`,
        now: () => now,
        deliverEmail: async (payload) => {
          emails.push(payload)
        },
      },
      {
        userId: 'user-1',
        recipientEmail: 'seat@clinic.example',
        standing: {
          entitled: true,
          clockEnd: CLOCK_END,
          remainingMs: 3 * MS_PER_DAY,
          status: 'trialing',
        },
      },
    )

    expect(result.delivered).toEqual([
      { channel: 'email', daysBefore: 3, epochKey },
      { channel: 'in_app', daysBefore: 3, epochKey },
    ])
    expect(emails).toEqual([
      {
        recipientEmail: 'seat@clinic.example',
        daysBefore: 3,
        clockEnd: CLOCK_END,
        epochKey,
      },
    ])
    expect(deliveryStore.records).toHaveLength(2)
    expect(deliveryStore.records.map((r) => r.channel).sort()).toEqual([
      'email',
      'in_app',
    ])
  })

  it('does not send further offset prompts after the Entitlement Clock expires', async () => {
    const emails: RenewPromptEmailPayload[] = []
    const result = await evaluateAndDeliverRenewPrompts(
      {
        triggers: createTriggerStore([
          { channel: 'email', daysBefore: 1, active: true },
          { channel: 'in_app', daysBefore: 1, active: true },
        ]),
        deliveries: createDeliveryStore(),
      },
      {
        generateId: () => 'delivery-1',
        now: () => new Date('2026-08-18T12:00:00.000Z'),
        deliverEmail: async (payload) => {
          emails.push(payload)
        },
      },
      {
        userId: 'user-1',
        recipientEmail: 'seat@clinic.example',
        standing: {
          entitled: false,
          clockEnd: null,
          remainingMs: 0,
          status: 'canceled',
        },
      },
    )

    expect(result.delivered).toEqual([])
    expect(emails).toEqual([])
  })

  it('skips a second evaluation for the same epoch offset', async () => {
    const epochKey = renewPromptEpochKey(CLOCK_END)
    const now = new Date(CLOCK_END.getTime() - 1 * MS_PER_DAY)
    const emails: RenewPromptEmailPayload[] = []
    const deps = {
      generateId: () => `id-${emails.length + 1}`,
      now: () => now,
      deliverEmail: async (payload: RenewPromptEmailPayload) => {
        emails.push(payload)
      },
    }
    const stores = {
      triggers: createTriggerStore([
        { channel: 'email', daysBefore: 1, active: true },
      ]),
      deliveries: createDeliveryStore(),
    }
    const seat = {
      userId: 'user-1',
      recipientEmail: 'seat@clinic.example',
      standing: {
        entitled: true,
        clockEnd: CLOCK_END,
        remainingMs: MS_PER_DAY,
        status: 'active' as const,
      },
    }

    await evaluateAndDeliverRenewPrompts(stores, deps, seat)
    await evaluateAndDeliverRenewPrompts(stores, deps, seat)

    expect(emails).toHaveLength(1)
    expect(stores.deliveries.records).toEqual([
      expect.objectContaining({
        userId: 'user-1',
        channel: 'email',
        daysBefore: 1,
        epochKey,
      }),
    ])
  })
})

describe('listInAppRenewPromptsForSeat', () => {
  it('returns current-epoch in-app deliveries while entitled and none after expiry', async () => {
    const epochKey = renewPromptEpochKey(CLOCK_END)
    const store = createDeliveryStore([
      {
        id: 'd1',
        userId: 'user-1',
        channel: 'in_app',
        daysBefore: 7,
        epochKey,
        deliveredAt: new Date('2026-08-10T12:00:00.000Z'),
      },
      {
        id: 'd2',
        userId: 'user-1',
        channel: 'email',
        daysBefore: 7,
        epochKey,
        deliveredAt: new Date('2026-08-10T12:00:00.000Z'),
      },
    ])

    await expect(
      listInAppRenewPromptsForSeat(store, {
        userId: 'user-1',
        standing: {
          entitled: true,
          clockEnd: CLOCK_END,
          remainingMs: 7 * MS_PER_DAY,
          status: 'active',
        },
      }),
    ).resolves.toEqual([
      {
        daysBefore: 7,
        epochKey,
        deliveredAt: new Date('2026-08-10T12:00:00.000Z'),
      },
    ])

    await expect(
      listInAppRenewPromptsForSeat(store, {
        userId: 'user-1',
        standing: {
          entitled: false,
          clockEnd: null,
          remainingMs: 0,
          status: 'canceled',
        },
      }),
    ).resolves.toEqual([])
  })
})
