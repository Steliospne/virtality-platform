import { describe, expect, it, vi } from 'vitest'
import type { RenewTriggerChannel } from '../types/renew-trigger.ts'
import { DEFAULT_RENEW_TRIGGER_DAYS_BEFORE } from '../types/renew-trigger.ts'
import {
  activeDaysBeforeForChannel,
  createRenewTrigger,
  defaultRenewTriggerSeedRows,
  isRenewChannelSilenced,
  listRenewTriggers,
  removeRenewTrigger,
  RenewTriggerDuplicateDaysBeforeError,
  RenewTriggerNotFoundError,
  RenewTriggerValidationError,
  updateRenewTrigger,
  type RenewTriggerRecord,
  type RenewTriggerStore,
} from './renew-trigger.ts'

const now = new Date('2026-08-10T12:00:00.000Z')

function createStore(
  initialRecords: RenewTriggerRecord[] = [],
): RenewTriggerStore & { records: RenewTriggerRecord[] } {
  const records = [...initialRecords]

  return {
    records,
    findById: vi.fn(
      async (id: string) => records.find((record) => record.id === id) ?? null,
    ),
    findByChannelAndDaysBefore: vi.fn(
      async (channel: RenewTriggerChannel, daysBefore: number) =>
        records.find(
          (record) =>
            record.channel === channel && record.daysBefore === daysBefore,
        ) ?? null,
    ),
    create: vi.fn(
      async (data: {
        id: string
        channel: RenewTriggerChannel
        daysBefore: number
        active: boolean
      }) => {
        const record: RenewTriggerRecord = {
          ...data,
          createdAt: now,
          updatedAt: now,
        }
        records.push(record)
        return record
      },
    ),
    update: vi.fn(
      async (id: string, data: { daysBefore?: number; active?: boolean }) => {
        const record = records.find((entry) => entry.id === id)
        if (!record) {
          throw new Error(`Record ${id} not found`)
        }
        Object.assign(record, data, { updatedAt: now })
        return record
      },
    ),
    deleteById: vi.fn(async (id: string) => {
      const index = records.findIndex((record) => record.id === id)
      if (index === -1) {
        return
      }
      records.splice(index, 1)
    }),
    listByChannel: vi.fn(async (channel: RenewTriggerChannel) =>
      records.filter((record) => record.channel === channel),
    ),
  }
}

async function seedDefaults(
  store: RenewTriggerStore,
  channel: RenewTriggerChannel,
  generateId: () => string,
) {
  for (const row of defaultRenewTriggerSeedRows(channel)) {
    await createRenewTrigger(store, { generateId }, row)
  }
}

describe('renew trigger domain', () => {
  it('defines default seed rows as 7/3/1 all active for a channel', () => {
    expect(defaultRenewTriggerSeedRows('email')).toEqual(
      DEFAULT_RENEW_TRIGGER_DAYS_BEFORE.map((daysBefore) => ({
        channel: 'email' as const,
        daysBefore,
        active: true,
      })),
    )
    expect(defaultRenewTriggerSeedRows('in_app')).toEqual(
      DEFAULT_RENEW_TRIGGER_DAYS_BEFORE.map((daysBefore) => ({
        channel: 'in_app' as const,
        daysBefore,
        active: true,
      })),
    )
  })

  it('lists email and in-app trigger rows independently', async () => {
    const store = createStore()
    let nextId = 0
    const generateId = () => `trigger-${++nextId}`

    await seedDefaults(store, 'email', generateId)
    await createRenewTrigger(
      store,
      { generateId },
      { channel: 'in_app', daysBefore: 14, active: true },
    )

    const email = await listRenewTriggers(store, 'email')
    const inApp = await listRenewTriggers(store, 'in_app')

    expect(email.map((row) => row.daysBefore)).toEqual([7, 3, 1])
    expect(inApp.map((row) => row.daysBefore)).toEqual([14])
  })

  it('silences a channel when rows are removed or all inactive', async () => {
    const store = createStore()
    let nextId = 0
    const generateId = () => `trigger-${++nextId}`

    await seedDefaults(store, 'email', generateId)
    await seedDefaults(store, 'in_app', generateId)

    const emailRows = await listRenewTriggers(store, 'email')
    for (const row of emailRows) {
      await removeRenewTrigger(store, { id: row.id })
    }

    const inAppRows = await listRenewTriggers(store, 'in_app')
    for (const row of inAppRows) {
      await updateRenewTrigger(store, { id: row.id, active: false })
    }

    const emptiedEmail = await listRenewTriggers(store, 'email')
    const inactiveInApp = await listRenewTriggers(store, 'in_app')

    expect(isRenewChannelSilenced(emptiedEmail)).toBe(true)
    expect(activeDaysBeforeForChannel(emptiedEmail)).toEqual([])
    expect(isRenewChannelSilenced(inactiveInApp)).toBe(true)
    expect(activeDaysBeforeForChannel(inactiveInApp)).toEqual([])
  })

  it('creates, updates, and removes trigger rows through the public API', async () => {
    const store = createStore()
    let nextId = 0
    const generateId = () => `trigger-${++nextId}`

    const created = await createRenewTrigger(
      store,
      { generateId },
      { channel: 'email', daysBefore: 5, active: true },
    )
    expect(created).toMatchObject({
      channel: 'email',
      daysBefore: 5,
      active: true,
    })

    const updated = await updateRenewTrigger(store, {
      id: created.id,
      daysBefore: 10,
      active: false,
    })
    expect(updated).toMatchObject({ daysBefore: 10, active: false })

    await removeRenewTrigger(store, { id: created.id })
    expect(await listRenewTriggers(store, 'email')).toEqual([])
  })

  it('rejects duplicate daysBefore within the same channel', async () => {
    const store = createStore()
    let nextId = 0
    const generateId = () => `trigger-${++nextId}`

    await createRenewTrigger(
      store,
      { generateId },
      { channel: 'email', daysBefore: 7 },
    )

    await expect(
      createRenewTrigger(
        store,
        { generateId },
        { channel: 'email', daysBefore: 7 },
      ),
    ).rejects.toBeInstanceOf(RenewTriggerDuplicateDaysBeforeError)

    await expect(
      createRenewTrigger(
        store,
        { generateId },
        { channel: 'in_app', daysBefore: 7 },
      ),
    ).resolves.toMatchObject({ channel: 'in_app', daysBefore: 7 })
  })

  it('rejects non-positive daysBefore values', async () => {
    const store = createStore()

    await expect(
      createRenewTrigger(
        store,
        { generateId: () => 'trigger-1' },
        { channel: 'email', daysBefore: 0 },
      ),
    ).rejects.toBeInstanceOf(RenewTriggerValidationError)

    await expect(
      updateRenewTrigger(store, { id: 'missing', daysBefore: 3 }),
    ).rejects.toBeInstanceOf(RenewTriggerNotFoundError)
  })
})
