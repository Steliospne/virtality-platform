import { describe, expect, it, vi } from 'vitest'
import type { PrismaClient } from '@virtality/db'
import {
  renewPromptEpochKey,
  RENEW_PROMPT_MS_PER_DAY,
  type RenewPromptDeliveryRecord,
  type RenewPromptEmailPayload,
} from '@virtality/shared/utils'
import { createRenewPromptLifecycle } from './renew-prompt-lifecycle.ts'

const CLOCK_END = new Date('2026-08-17T12:00:00.000Z')
const PRIOR_CLOCK_END = new Date('2026-07-01T12:00:00.000Z')
const PRIOR_EPOCH = renewPromptEpochKey(PRIOR_CLOCK_END)
const NEXT_EPOCH = renewPromptEpochKey(CLOCK_END)

type TriggerSeed = {
  channel: 'email' | 'in_app'
  daysBefore: number
  active: boolean
}

function priorEpochDelivery(
  overrides: Partial<RenewPromptDeliveryRecord> = {},
): RenewPromptDeliveryRecord {
  return {
    id: 'old',
    userId: 'user-1',
    channel: 'email',
    daysBefore: 7,
    epochKey: PRIOR_EPOCH,
    deliveredAt: PRIOR_CLOCK_END,
    ...overrides,
  }
}

function createMockPrisma(seed?: {
  deliveries?: RenewPromptDeliveryRecord[]
  triggers?: TriggerSeed[]
}) {
  const deliveries = [...(seed?.deliveries ?? [])]
  const triggers = (seed?.triggers ?? []).map((row, index) => ({
    id: `trigger-${index}`,
    channel: row.channel,
    daysBefore: row.daysBefore,
    active: row.active,
    createdAt: CLOCK_END,
    updatedAt: CLOCK_END,
  }))

  const prisma = {
    renewPromptDelivery: {
      findMany: vi.fn(
        async ({ where }: { where: { userId: string; epochKey: string } }) =>
          deliveries.filter(
            (row) =>
              row.userId === where.userId && row.epochKey === where.epochKey,
          ),
      ),
      create: vi.fn(async ({ data }: { data: RenewPromptDeliveryRecord }) => {
        deliveries.push(data)
        return data
      }),
      deleteMany: vi.fn(
        async ({
          where,
        }: {
          where: { userId: string; epochKey: { not: string } }
        }) => {
          let count = 0
          for (let i = deliveries.length - 1; i >= 0; i -= 1) {
            const row = deliveries[i]!
            if (
              row.userId === where.userId &&
              row.epochKey !== where.epochKey.not
            ) {
              deliveries.splice(i, 1)
              count += 1
            }
          }
          return { count }
        },
      ),
    },
    renewTrigger: {
      findMany: vi.fn(
        async ({ where }: { where: { channel: 'email' | 'in_app' } }) =>
          triggers.filter((row) => row.channel === where.channel),
      ),
    },
  }

  return {
    prisma: prisma as unknown as PrismaClient,
    deliveries,
  }
}

describe('createRenewPromptLifecycle', () => {
  it('rearms for a new clock end and drops prior-epoch backlog', async () => {
    const { prisma, deliveries } = createMockPrisma({
      deliveries: [priorEpochDelivery()],
    })

    const result = await createRenewPromptLifecycle({
      prisma,
    }).rearmForNewClock({
      userId: 'user-1',
      clockEnd: CLOCK_END,
    })

    expect(result).toEqual({ epochKey: NEXT_EPOCH, dropped: 1 })
    expect(deliveries).toEqual([])
  })

  it('skips rearm after extension when the clock end is unchanged', async () => {
    const { prisma, deliveries } = createMockPrisma({
      deliveries: [priorEpochDelivery({ channel: 'in_app', daysBefore: 3 })],
    })

    const unchanged = await createRenewPromptLifecycle({
      prisma,
    }).rearmAfterExtension({
      userId: 'user-1',
      previousClockEnd: CLOCK_END,
      nextClockEnd: CLOCK_END,
    })

    expect(unchanged.rearmed).toBe(false)
    expect(deliveries).toHaveLength(1)
  })

  it('rearms after extension when the clock end changes', async () => {
    const { prisma, deliveries } = createMockPrisma({
      deliveries: [priorEpochDelivery({ channel: 'in_app', daysBefore: 3 })],
    })

    const changed = await createRenewPromptLifecycle({
      prisma,
    }).rearmAfterExtension({
      userId: 'user-1',
      previousClockEnd: PRIOR_CLOCK_END,
      nextClockEnd: CLOCK_END,
    })

    expect(changed).toEqual({
      rearmed: true,
      epochKey: NEXT_EPOCH,
      dropped: 1,
    })
    expect(deliveries).toEqual([])
  })

  it('rearms after checkout from the subscription live clock end', async () => {
    const { prisma, deliveries } = createMockPrisma({
      deliveries: [priorEpochDelivery()],
    })

    const result = await createRenewPromptLifecycle({
      prisma,
    }).rearmAfterCheckout({
      referenceId: 'user-1',
      status: 'trialing',
      trialEnd: CLOCK_END,
      periodEnd: null,
    })

    expect(result).toEqual({
      rearmed: true,
      epochKey: NEXT_EPOCH,
      dropped: 1,
    })
    expect(deliveries).toEqual([])
  })

  it('evaluates due offsets through System Email port and records deliveries', async () => {
    const now = new Date(CLOCK_END.getTime() - 3 * RENEW_PROMPT_MS_PER_DAY)
    const sent: RenewPromptEmailPayload[] = []
    const { prisma, deliveries } = createMockPrisma({
      triggers: [
        { channel: 'email', daysBefore: 3, active: true },
        { channel: 'in_app', daysBefore: 3, active: true },
      ],
    })

    const { delivered } = await createRenewPromptLifecycle({
      prisma,
      now: () => now,
      generateId: () => 'delivery-1',
      deliverEmail: async (payload) => {
        sent.push(payload)
      },
    }).evaluateSeat({
      userId: 'user-1',
      recipientEmail: 'seat@example.com',
      standing: {
        entitled: true,
        clockEnd: CLOCK_END,
        clockStart: null,
        remainingMs: 3 * RENEW_PROMPT_MS_PER_DAY,
        status: 'trialing',
      },
    })

    expect(delivered).toEqual([
      { channel: 'email', daysBefore: 3, epochKey: NEXT_EPOCH },
      { channel: 'in_app', daysBefore: 3, epochKey: NEXT_EPOCH },
    ])
    expect(sent).toEqual([
      {
        recipientEmail: 'seat@example.com',
        daysBefore: 3,
        clockEnd: CLOCK_END,
        epochKey: NEXT_EPOCH,
      },
    ])
    expect(deliveries).toHaveLength(2)
  })

  it('lists in-app deliveries for the live clock epoch only', async () => {
    const { prisma } = createMockPrisma({
      deliveries: [
        {
          id: 'current',
          userId: 'user-1',
          channel: 'in_app',
          daysBefore: 7,
          epochKey: NEXT_EPOCH,
          deliveredAt: CLOCK_END,
        },
        {
          id: 'stale',
          userId: 'user-1',
          channel: 'in_app',
          daysBefore: 3,
          epochKey: PRIOR_EPOCH,
          deliveredAt: PRIOR_CLOCK_END,
        },
        {
          id: 'email',
          userId: 'user-1',
          channel: 'email',
          daysBefore: 7,
          epochKey: NEXT_EPOCH,
          deliveredAt: CLOCK_END,
        },
      ],
    })

    const inApp = await createRenewPromptLifecycle({ prisma }).listInApp({
      userId: 'user-1',
      standing: {
        entitled: true,
        clockEnd: CLOCK_END,
        clockStart: null,
        remainingMs: 7 * RENEW_PROMPT_MS_PER_DAY,
        status: 'trialing',
      },
    })

    expect(inApp).toEqual([
      { daysBefore: 7, epochKey: NEXT_EPOCH, deliveredAt: CLOCK_END },
    ])
  })
})
