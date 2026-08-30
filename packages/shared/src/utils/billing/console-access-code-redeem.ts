/**
 * Console Profile → Billing Access Code redeem (#204 / #207).
 *
 * Prefix route: well-formed `GO-` codes use the Access path; Promotion Codes
 * stay in `console-promo-redeem.ts`. Implements the state × mode matrix with
 * existing Stripe create / attach-trial shapes only.
 */

import {
  isFreeSubscriptionPlan,
  isProSubscriptionPlan,
} from './billing-plans.ts'
import {
  TRIAL_REDEEM_CODE_PATTERN,
  getTrialRedeemDisplayStatus,
  type TrialRedeemCodeMode,
  type TrialRedeemCodeRecord,
  type TrialRedeemCodeStore,
} from './trial-redeem-code.ts'
import {
  TRIAL_REDEEM_SIGNUP_ALREADY_USED_MESSAGE,
  TRIAL_REDEEM_SIGNUP_EXPIRED_MESSAGE,
  type TrialRedeemConsumeStore,
  type TrialRedeemStripeGateway,
} from './trial-redeem-sign-up.ts'

export const CONSOLE_ACCESS_CODE_INVALID_MESSAGE =
  "That Access Code isn't valid." as const

export const CONSOLE_ACCESS_CODE_SUCCESS_HEADLINE =
  'Access Code applied.' as const

export type ProfileBillingCodeRoute =
  | { kind: 'access_code'; code: string }
  | { kind: 'promotion_code'; code: string }

/** Routes the unified Profile Billing field by Access Code format. */
export function routeProfileBillingCode(raw: string): ProfileBillingCodeRoute {
  const trimmed = raw.trim()
  if (TRIAL_REDEEM_CODE_PATTERN.test(trimmed)) {
    return { kind: 'access_code', code: trimmed.toUpperCase() }
  }
  return { kind: 'promotion_code', code: trimmed }
}

export function isProfileBillingAccessCode(raw: string): boolean {
  return routeProfileBillingCode(raw).kind === 'access_code'
}

export type ProfileBillingSeat = {
  status: string
  plan: string
  stripeSubscriptionId: string
} | null

export type ProfileBillingSeatKind =
  | 'no_live_seat'
  | 'active_free_no_trial'
  | 'trialing'
  | 'paid_pro_active'

export function classifyProfileBillingSeat(
  seat: ProfileBillingSeat,
): ProfileBillingSeatKind {
  if (!seat) return 'no_live_seat'
  if (seat.status === 'trialing') return 'trialing'
  if (
    (seat.status === 'active' || seat.status === 'past_due') &&
    isProSubscriptionPlan(seat.plan)
  ) {
    return 'paid_pro_active'
  }
  if (seat.status === 'active' && isFreeSubscriptionPlan(seat.plan)) {
    return 'active_free_no_trial'
  }
  return 'no_live_seat'
}

export type ConsoleAccessCodeStore = Pick<TrialRedeemCodeStore, 'findByCode'> &
  TrialRedeemConsumeStore & {
    findBillingSeatByUserId: (userId: string) => Promise<ProfileBillingSeat>
    findStripeCustomerIdByUserId: (userId: string) => Promise<string | null>
  }

export type ConsoleAccessCodeStripeGateway = TrialRedeemStripeGateway & {
  attachTrialOnSubscription: (input: {
    stripeSubscriptionId: string
    trialEndUnix: number
    metadata: { trialRedeemCodeId: string }
  }) => Promise<void>
}

export type AccessCodeProfileBlockReason = 'expired' | 'already_used'

export type AccessCodeProfileGate =
  | { action: 'proceed'; record: TrialRedeemCodeRecord }
  | { action: 'invalid' }
  | { action: 'block'; reason: AccessCodeProfileBlockReason }

/**
 * Profile Access Code gate: invalid store miss (no waitlist), Expired / Already
 * used shared with sign-up, unused proceeds to the matrix.
 */
export async function evaluateAccessCodeAtProfile(
  store: Pick<TrialRedeemCodeStore, 'findByCode'>,
  rawCode: string,
  now: Date = new Date(),
): Promise<AccessCodeProfileGate> {
  const routed = routeProfileBillingCode(rawCode)
  if (routed.kind !== 'access_code') return { action: 'invalid' }

  const record = await store.findByCode(routed.code)
  if (!record) return { action: 'invalid' }

  const displayStatus = getTrialRedeemDisplayStatus(record, now)
  switch (displayStatus) {
    case 'redeemed':
    case 'already_entitled':
      return { action: 'block', reason: 'already_used' }
    case 'expired':
      return { action: 'block', reason: 'expired' }
    case 'unused':
      return { action: 'proceed', record }
  }
}

export function computeAccessCodeTrialEndUnix(
  now: Date,
  trialDays: number,
): number {
  const end = new Date(now.getTime())
  end.setUTCDate(end.getUTCDate() + trialDays)
  return Math.floor(end.getTime() / 1000)
}

export type RedeemAccessCodeOnProfileInput = {
  userId: string
  code: string
  stripeCustomerId: string
  priceId: string
}

export type RedeemAccessCodeEffect =
  | 'permanent_free_created'
  | 'trial_created'
  | 'trial_attached'
  | 'already_entitled'

export type RedeemAccessCodeOnProfileResult = {
  codeId: number
  effect: RedeemAccessCodeEffect
  stripeSubscriptionId?: string
}

export class ConsoleAccessCodeValidationError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'ConsoleAccessCodeValidationError'
  }
}

export class ConsoleAccessCodeInvalidError extends Error {
  constructor() {
    super(CONSOLE_ACCESS_CODE_INVALID_MESSAGE)
    this.name = 'ConsoleAccessCodeInvalidError'
  }
}

export class ConsoleAccessCodeExpiredError extends Error {
  constructor() {
    super(TRIAL_REDEEM_SIGNUP_EXPIRED_MESSAGE)
    this.name = 'ConsoleAccessCodeExpiredError'
  }
}

export class ConsoleAccessCodeAlreadyUsedError extends Error {
  constructor() {
    super(TRIAL_REDEEM_SIGNUP_ALREADY_USED_MESSAGE)
    this.name = 'ConsoleAccessCodeAlreadyUsedError'
  }
}

export class ConsoleAccessCodeMissingCustomerError extends Error {
  constructor() {
    super('A Stripe Customer is required before redeeming an Access Code.')
    this.name = 'ConsoleAccessCodeMissingCustomerError'
  }
}

export class ConsoleAccessCodeFailedError extends Error {
  constructor() {
    super('Could not apply that Access Code. Try again shortly.')
    this.name = 'ConsoleAccessCodeFailedError'
  }
}

function profileMatrixAlreadyEntitled(
  seatKind: ProfileBillingSeatKind,
  mode: TrialRedeemCodeMode,
): boolean {
  if (seatKind === 'trialing' || seatKind === 'paid_pro_active') return true
  if (seatKind === 'active_free_no_trial' && mode === 'permanent_free') {
    return true
  }
  return false
}

/**
 * Redeem an Access Code on Profile Billing. Stripe-first; webhook-only local
 * sync. No admin audit / reason on this path.
 */
export async function redeemAccessCodeOnProfile(
  store: ConsoleAccessCodeStore,
  stripe: ConsoleAccessCodeStripeGateway,
  input: RedeemAccessCodeOnProfileInput,
  runtime: { now?: () => Date } = {},
): Promise<RedeemAccessCodeOnProfileResult> {
  if (!input.userId.trim()) {
    throw new ConsoleAccessCodeValidationError('userId is required')
  }
  if (!input.stripeCustomerId.trim()) {
    throw new ConsoleAccessCodeMissingCustomerError()
  }

  const now = runtime.now?.() ?? new Date()
  const gate = await evaluateAccessCodeAtProfile(store, input.code, now)
  if (gate.action === 'invalid') throw new ConsoleAccessCodeInvalidError()
  if (gate.action === 'block') {
    if (gate.reason === 'expired') throw new ConsoleAccessCodeExpiredError()
    throw new ConsoleAccessCodeAlreadyUsedError()
  }

  const { id: codeId, trialDays, mode } = gate.record
  const seat = await store.findBillingSeatByUserId(input.userId)
  const seatKind = classifyProfileBillingSeat(seat)
  const metadata = { trialRedeemCodeId: String(codeId) }

  if (profileMatrixAlreadyEntitled(seatKind, mode)) {
    const consumed = await store.consumeAsAlreadyEntitled(
      codeId,
      input.userId,
      now,
    )
    if (!consumed) throw new ConsoleAccessCodeFailedError()
    return { codeId, effect: 'already_entitled' }
  }

  if (seatKind === 'active_free_no_trial' && mode === 'timed_trial') {
    if (!seat) throw new ConsoleAccessCodeFailedError()
    const trialEndUnix = computeAccessCodeTrialEndUnix(now, trialDays)
    try {
      await stripe.attachTrialOnSubscription({
        stripeSubscriptionId: seat.stripeSubscriptionId,
        trialEndUnix,
        metadata,
      })
    } catch {
      throw new ConsoleAccessCodeFailedError()
    }
    const consumed = await store.consumeAsRedeemed(codeId, input.userId, now)
    if (!consumed) throw new ConsoleAccessCodeFailedError()
    return {
      codeId,
      effect: 'trial_attached',
      stripeSubscriptionId: seat.stripeSubscriptionId,
    }
  }

  const subscriptionInput = {
    customerId: input.stripeCustomerId,
    priceId: input.priceId,
    metadata,
  }

  let stripeSubscriptionId: string
  try {
    if (mode === 'permanent_free') {
      const created =
        await stripe.createPermanentFreeSubscription(subscriptionInput)
      stripeSubscriptionId = created.stripeSubscriptionId
    } else {
      const created = await stripe.createNoCardTrialSubscription({
        ...subscriptionInput,
        trialPeriodDays: trialDays,
      })
      stripeSubscriptionId = created.stripeSubscriptionId
    }
  } catch {
    throw new ConsoleAccessCodeFailedError()
  }

  const consumed = await store.consumeAsRedeemed(codeId, input.userId, now)
  if (!consumed) throw new ConsoleAccessCodeFailedError()

  return {
    codeId,
    effect:
      mode === 'permanent_free' ? 'permanent_free_created' : 'trial_created',
    stripeSubscriptionId,
  }
}

const ACCESS_CODE_EFFECT_COPY: Record<RedeemAccessCodeEffect, string> = {
  permanent_free_created: 'You now have permanent Free access.',
  trial_created: 'Your free trial has started.',
  trial_attached: 'A free trial was added to your subscription.',
  already_entitled: "You're already on a qualifying plan.",
}

/** Success toast / banner: headline plus one-line effect. */
export function formatAccessCodeAppliedMessage(
  result: Pick<RedeemAccessCodeOnProfileResult, 'effect'>,
): string {
  return `${CONSOLE_ACCESS_CODE_SUCCESS_HEADLINE} ${ACCESS_CODE_EFFECT_COPY[result.effect]}`
}
