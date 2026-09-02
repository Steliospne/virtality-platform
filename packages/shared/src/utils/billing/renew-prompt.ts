/**
 * Renew prompt evaluator: System Email + in-app delivery keyed by Entitlement
 * Clock epoch (current clock end). Does not use Stripe Billing reminder emails
 * for these offsets (ADR 0003).
 */

import type { RenewTriggerChannel } from '../../types/renew-trigger.ts'
import type { EntitlementClockStanding } from './entitlement-clock.ts'
import {
  clockEndForEntitlementSource,
  type TrialGrantClock,
} from './trial-grant.ts'
import type { EntitlementClockSubscription } from './entitlement-clock.ts'
import { listRenewTriggers, type RenewTriggerStore } from './renew-trigger.ts'

export const RENEW_PROMPT_MS_PER_DAY = 24 * 60 * 60 * 1000

export type RenewPromptDeliveryKey = {
  channel: RenewTriggerChannel
  daysBefore: number
  epochKey: string
}

export type DueRenewPrompt = RenewPromptDeliveryKey

export type RenewPromptDeliveryRecord = RenewPromptDeliveryKey & {
  id: string
  userId: string
  deliveredAt: Date
}

export type RenewPromptDeliveryCreateData = {
  id: string
  userId: string
  channel: RenewTriggerChannel
  daysBefore: number
  epochKey: string
  deliveredAt: Date
}

export type RenewPromptDeliveryStore = {
  listForUserAndEpoch: (
    userId: string,
    epochKey: string,
  ) => Promise<RenewPromptDeliveryRecord[]>
  create: (
    data: RenewPromptDeliveryCreateData,
  ) => Promise<RenewPromptDeliveryRecord>
  /** Drop this user's delivery rows outside the live clock epoch. */
  deleteOutsideEpoch: (userId: string, epochKey: string) => Promise<number>
}

/** Live subscription fields needed to derive Entitlement Clock end. */
export type RenewPromptSubscriptionClock = {
  referenceId: string
  status: string
  trialEnd?: Date | null
  periodEnd?: Date | null
}

export type RearmRenewPromptEpochResult = {
  epochKey: string
  dropped: number
}

export type RearmRenewPromptEpochAttempt = {
  rearmed: boolean
  epochKey: string | null
  dropped: number
}

export type RenewPromptEmailPayload = {
  recipientEmail: string
  daysBefore: number
  clockEnd: Date
  epochKey: string
}

export type RenewPromptEvaluateDeps = {
  generateId: () => string
  now?: () => Date
  /**
   * Virtality System Email delivery. Never Stripe Billing customer emails.
   */
  deliverEmail: (payload: RenewPromptEmailPayload) => Promise<void>
}

export type RenewPromptSeat = {
  userId: string
  /** Seat holder primary email. */
  recipientEmail: string
  standing: EntitlementClockStanding
}

/** Live clock end when entitled; otherwise null (no delivery after expiry). */
function liveClockEnd(
  standing: Pick<EntitlementClockStanding, 'entitled' | 'clockEnd'>,
): Date | null {
  if (!standing.entitled || standing.clockEnd == null) {
    return null
  }
  return standing.clockEnd
}

function renewPromptOffsetKey(
  channel: RenewTriggerChannel,
  daysBefore: number,
): string {
  return `${channel}:${daysBefore}`
}

/** Epoch identity is the live Entitlement Clock end (Stripe SoT). */
export function renewPromptEpochKey(clockEnd: Date): string {
  return clockEnd.toISOString()
}

/**
 * Start a new renew epoch at `clockEnd`: drop prior-epoch delivery backlog so
 * offsets can fire again toward the new Entitlement Clock end.
 */
export async function rearmRenewPromptEpoch(
  deliveries: Pick<RenewPromptDeliveryStore, 'deleteOutsideEpoch'>,
  input: { userId: string; clockEnd: Date },
): Promise<RearmRenewPromptEpochResult> {
  const epochKey = renewPromptEpochKey(input.clockEnd)
  const dropped = await deliveries.deleteOutsideEpoch(input.userId, epochKey)
  return { epochKey, dropped }
}

function sameRenewPromptEpoch(
  left: Date | null | undefined,
  right: Date,
): boolean {
  return (
    left != null && renewPromptEpochKey(left) === renewPromptEpochKey(right)
  )
}

/**
 * Extension path: re-arm only when the live Entitlement Clock end changes.
 */
export async function rearmRenewPromptEpochIfClockChanged(
  deliveries: Pick<RenewPromptDeliveryStore, 'deleteOutsideEpoch'>,
  input: {
    userId: string
    previousClockEnd: Date | null
    nextClockEnd: Date | null
  },
): Promise<RearmRenewPromptEpochAttempt> {
  if (input.nextClockEnd == null) {
    return { rearmed: false, epochKey: null, dropped: 0 }
  }

  const epochKey = renewPromptEpochKey(input.nextClockEnd)
  if (sameRenewPromptEpoch(input.previousClockEnd, input.nextClockEnd)) {
    return { rearmed: false, epochKey, dropped: 0 }
  }

  const { dropped } = await rearmRenewPromptEpoch(deliveries, {
    userId: input.userId,
    clockEnd: input.nextClockEnd,
  })
  return { rearmed: true, epochKey, dropped }
}

/**
 * Subscribe/Renew Checkout or live webhook sync: re-arm from the
 * subscription's live clock end and drop prior-epoch backlog.
 */
export async function rearmRenewPromptEpochForSubscription(
  deliveries: Pick<RenewPromptDeliveryStore, 'deleteOutsideEpoch'>,
  subscription: RenewPromptSubscriptionClock,
  trialGrant?: TrialGrantClock | null,
): Promise<RearmRenewPromptEpochAttempt> {
  const clockEnd = clockEndForEntitlementSource({
    subscriptions: [subscription],
    trialGrant,
  })
  if (clockEnd == null) {
    return { rearmed: false, epochKey: null, dropped: 0 }
  }

  const result = await rearmRenewPromptEpoch(deliveries, {
    userId: subscription.referenceId,
    clockEnd,
  })
  return { rearmed: true, ...result }
}

/** Re-arm from the shared entitlement resolver (Stripe first, else TrialGrant). */
export async function rearmRenewPromptEpochForEntitlementSource(
  deliveries: Pick<RenewPromptDeliveryStore, 'deleteOutsideEpoch'>,
  input: {
    userId: string
    subscriptions: readonly EntitlementClockSubscription[]
    trialGrant?: TrialGrantClock | null
  },
): Promise<RearmRenewPromptEpochAttempt> {
  const clockEnd = clockEndForEntitlementSource(input)
  if (clockEnd == null) {
    return { rearmed: false, epochKey: null, dropped: 0 }
  }

  const result = await rearmRenewPromptEpoch(deliveries, {
    userId: input.userId,
    clockEnd,
  })
  return { rearmed: true, ...result }
}

/**
 * An offset is due when now is at or past (clockEnd - daysBefore days) and
 * still before clockEnd. Same rule for trialEnd or periodEnd as clockEnd.
 */
export function isRenewOffsetDue(input: {
  now: Date
  clockEnd: Date
  daysBefore: number
}): boolean {
  const nowMs = input.now.getTime()
  const endMs = input.clockEnd.getTime()
  if (nowMs >= endMs) return false
  const fireAtMs = endMs - input.daysBefore * RENEW_PROMPT_MS_PER_DAY
  return nowMs >= fireAtMs
}

export function selectDueRenewPrompts(input: {
  now: Date
  entitled: boolean
  clockEnd: Date | null
  triggers: readonly {
    channel: RenewTriggerChannel
    daysBefore: number
    active: boolean
  }[]
  alreadyDelivered: readonly RenewPromptDeliveryKey[]
}): DueRenewPrompt[] {
  const clockEnd = liveClockEnd(input)
  if (clockEnd == null) {
    return []
  }

  const epochKey = renewPromptEpochKey(clockEnd)
  const delivered = new Set(
    input.alreadyDelivered
      .filter((entry) => entry.epochKey === epochKey)
      .map((entry) => renewPromptOffsetKey(entry.channel, entry.daysBefore)),
  )

  const due: DueRenewPrompt[] = []
  for (const trigger of input.triggers) {
    if (!trigger.active) continue
    if (
      !isRenewOffsetDue({
        now: input.now,
        clockEnd,
        daysBefore: trigger.daysBefore,
      })
    ) {
      continue
    }
    const key = renewPromptOffsetKey(trigger.channel, trigger.daysBefore)
    if (delivered.has(key)) continue
    due.push({
      channel: trigger.channel,
      daysBefore: trigger.daysBefore,
      epochKey,
    })
  }
  return due
}

/**
 * Evaluate Adminboard trigger rows against the seat's live Entitlement Clock.
 * Fires each due channel×offset once per epoch (catch-up included). After
 * expiry, delivers nothing. Email uses System Email; in-app is a delivery
 * record for console chrome.
 */
export async function evaluateAndDeliverRenewPrompts(
  stores: {
    triggers: RenewTriggerStore
    deliveries: RenewPromptDeliveryStore
  },
  deps: RenewPromptEvaluateDeps,
  seat: RenewPromptSeat,
): Promise<{ delivered: DueRenewPrompt[] }> {
  const now = deps.now?.() ?? new Date()
  const clockEnd = liveClockEnd(seat.standing)
  if (clockEnd == null) {
    return { delivered: [] }
  }

  const epochKey = renewPromptEpochKey(clockEnd)
  const [emailTriggers, inAppTriggers, existing] = await Promise.all([
    listRenewTriggers(stores.triggers, 'email'),
    listRenewTriggers(stores.triggers, 'in_app'),
    stores.deliveries.listForUserAndEpoch(seat.userId, epochKey),
  ])

  const due = selectDueRenewPrompts({
    now,
    entitled: true,
    clockEnd,
    triggers: [...emailTriggers, ...inAppTriggers],
    alreadyDelivered: existing,
  })

  const delivered: DueRenewPrompt[] = []

  for (const item of due) {
    if (item.channel === 'email') {
      await deps.deliverEmail({
        recipientEmail: seat.recipientEmail,
        daysBefore: item.daysBefore,
        clockEnd,
        epochKey: item.epochKey,
      })
    }

    await stores.deliveries.create({
      id: deps.generateId(),
      userId: seat.userId,
      channel: item.channel,
      daysBefore: item.daysBefore,
      epochKey: item.epochKey,
      deliveredAt: now,
    })
    delivered.push(item)
  }

  return { delivered }
}

export type InAppRenewPrompt = {
  daysBefore: number
  epochKey: string
  deliveredAt: Date
}

/**
 * In-app offset prompts for the current epoch only. Empty after expiry.
 */
export async function listInAppRenewPromptsForSeat(
  deliveries: RenewPromptDeliveryStore,
  seat: Pick<RenewPromptSeat, 'userId' | 'standing'>,
): Promise<InAppRenewPrompt[]> {
  const clockEnd = liveClockEnd(seat.standing)
  if (clockEnd == null) {
    return []
  }

  const epochKey = renewPromptEpochKey(clockEnd)
  const records = await deliveries.listForUserAndEpoch(seat.userId, epochKey)
  return records
    .filter((record) => record.channel === 'in_app')
    .map((record) => ({
      daysBefore: record.daysBefore,
      epochKey: record.epochKey,
      deliveredAt: record.deliveredAt,
    }))
    .sort((left, right) => right.daysBefore - left.daysBefore)
}
