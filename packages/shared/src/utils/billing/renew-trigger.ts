import {
  DEFAULT_RENEW_TRIGGER_DAYS_BEFORE,
  type CreateRenewTriggerInput,
  type RemoveRenewTriggerInput,
  type RenewTriggerChannel,
  type RenewTriggerListItem,
  type UpdateRenewTriggerInput,
} from '../../types/renew-trigger.ts'

export type RenewTriggerRecord = {
  id: string
  channel: RenewTriggerChannel
  daysBefore: number
  active: boolean
  createdAt: Date
  updatedAt: Date
}

export type RenewTriggerUpdateData = {
  daysBefore?: number
  active?: boolean
}

export type RenewTriggerStore = {
  findById: (id: string) => Promise<RenewTriggerRecord | null>
  findByChannelAndDaysBefore: (
    channel: RenewTriggerChannel,
    daysBefore: number,
  ) => Promise<RenewTriggerRecord | null>
  create: (data: {
    id: string
    channel: RenewTriggerChannel
    daysBefore: number
    active: boolean
  }) => Promise<RenewTriggerRecord>
  update: (
    id: string,
    data: RenewTriggerUpdateData,
  ) => Promise<RenewTriggerRecord>
  deleteById: (id: string) => Promise<void>
  listByChannel: (channel: RenewTriggerChannel) => Promise<RenewTriggerRecord[]>
}

export class RenewTriggerValidationError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'RenewTriggerValidationError'
  }
}

export class RenewTriggerNotFoundError extends Error {
  constructor(id: string) {
    super(`Renew trigger "${id}" was not found.`)
    this.name = 'RenewTriggerNotFoundError'
  }
}

export class RenewTriggerDuplicateDaysBeforeError extends Error {
  constructor(channel: RenewTriggerChannel, daysBefore: number) {
    super(
      `Renew trigger for channel "${channel}" already has daysBefore ${daysBefore}.`,
    )
    this.name = 'RenewTriggerDuplicateDaysBeforeError'
  }
}

export function mapRenewTriggerToListItem(
  record: RenewTriggerRecord,
): RenewTriggerListItem {
  return {
    id: record.id,
    channel: record.channel,
    daysBefore: record.daysBefore,
    active: record.active,
  }
}

function sortRenewTriggersByDaysBeforeDesc(
  records: readonly RenewTriggerRecord[],
): RenewTriggerRecord[] {
  return [...records].sort((left, right) => right.daysBefore - left.daysBefore)
}

function assertValidDaysBefore(daysBefore: number): void {
  if (!Number.isInteger(daysBefore) || daysBefore < 1) {
    throw new RenewTriggerValidationError(
      'daysBefore must be a positive integer.',
    )
  }
}

async function assertUniqueDaysBefore(
  store: RenewTriggerStore,
  channel: RenewTriggerChannel,
  daysBefore: number,
  exceptId?: string,
): Promise<void> {
  const duplicate = await store.findByChannelAndDaysBefore(channel, daysBefore)
  if (duplicate && duplicate.id !== exceptId) {
    throw new RenewTriggerDuplicateDaysBeforeError(channel, daysBefore)
  }
}

export function activeDaysBeforeForChannel(
  triggers: readonly Pick<RenewTriggerListItem, 'daysBefore' | 'active'>[],
): number[] {
  return triggers
    .filter((trigger) => trigger.active)
    .map((trigger) => trigger.daysBefore)
    .sort((left, right) => right - left)
}

export function isRenewChannelSilenced(
  triggers: readonly Pick<RenewTriggerListItem, 'active'>[],
): boolean {
  return triggers.length === 0 || triggers.every((trigger) => !trigger.active)
}

export async function listRenewTriggers(
  store: RenewTriggerStore,
  channel: RenewTriggerChannel,
): Promise<RenewTriggerListItem[]> {
  const records = await store.listByChannel(channel)
  return sortRenewTriggersByDaysBeforeDesc(records).map(
    mapRenewTriggerToListItem,
  )
}

export function defaultRenewTriggerSeedRows(
  channel: RenewTriggerChannel,
): Array<{
  channel: RenewTriggerChannel
  daysBefore: number
  active: true
}> {
  return DEFAULT_RENEW_TRIGGER_DAYS_BEFORE.map((daysBefore) => ({
    channel,
    daysBefore,
    active: true,
  }))
}

export async function createRenewTrigger(
  store: RenewTriggerStore,
  deps: { generateId: () => string },
  input: CreateRenewTriggerInput,
): Promise<RenewTriggerListItem> {
  assertValidDaysBefore(input.daysBefore)
  await assertUniqueDaysBefore(store, input.channel, input.daysBefore)

  const created = await store.create({
    id: deps.generateId(),
    channel: input.channel,
    daysBefore: input.daysBefore,
    active: input.active ?? true,
  })

  return mapRenewTriggerToListItem(created)
}

export async function updateRenewTrigger(
  store: RenewTriggerStore,
  input: UpdateRenewTriggerInput,
): Promise<RenewTriggerListItem> {
  const existing = await store.findById(input.id)
  if (!existing) {
    throw new RenewTriggerNotFoundError(input.id)
  }

  if (input.daysBefore === undefined && input.active === undefined) {
    throw new RenewTriggerValidationError(
      'At least one of daysBefore or active must be provided.',
    )
  }

  const nextDaysBefore = input.daysBefore ?? existing.daysBefore
  assertValidDaysBefore(nextDaysBefore)

  if (nextDaysBefore !== existing.daysBefore) {
    await assertUniqueDaysBefore(
      store,
      existing.channel,
      nextDaysBefore,
      existing.id,
    )
  }

  const patch: RenewTriggerUpdateData = {}
  if (input.daysBefore !== undefined) {
    patch.daysBefore = input.daysBefore
  }
  if (input.active !== undefined) {
    patch.active = input.active
  }

  const updated = await store.update(input.id, patch)
  return mapRenewTriggerToListItem(updated)
}

export async function removeRenewTrigger(
  store: RenewTriggerStore,
  input: RemoveRenewTriggerInput,
): Promise<{ id: string }> {
  const existing = await store.findById(input.id)
  if (!existing) {
    throw new RenewTriggerNotFoundError(input.id)
  }

  await store.deleteById(input.id)
  return { id: input.id }
}
