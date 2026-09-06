/**
 * Console Profile → Billing Access Code redeem (#204 / #207 / #257).
 *
 * Prefix route: well-formed `GO-` codes use the Access path; Promotion Codes
 * stay in `console-promo-redeem.ts`. Redemption issues Access Gates only.
 */

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
} from './trial-redeem-sign-up.ts'
import { type AccessCodeVariantOutcome } from './access-code-variant.ts'

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

export type ConsoleAccessCodeStore = Pick<TrialRedeemCodeStore, 'findByCode'> &
  TrialRedeemConsumeStore & {
    userHasLiveDefaultSubscription: (userId: string) => Promise<boolean>
  }

export type ConsoleAccessCodeAccessGateIssuer = {
  hasOpenGrantedAccessGate: (userId: string) => Promise<boolean>
  hasOpenTimedAccessGate: (userId: string) => Promise<boolean>
  issueFreeGrant: (input: {
    userId: string
  }) => Promise<{ accessGateId: string }>
  grantActiveTrial: (input: {
    userId: string
    trialDays: number
  }) => Promise<{ accessGateId: string }>
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

export type RedeemAccessCodeOnProfileInput = {
  userId: string
  code: string
}

export type RedeemAccessCodeEffect =
  | 'free_grant_created'
  | 'trial_grant_created'
  | 'already_entitled'

export type RedeemAccessCodeOnProfileResult = {
  codeId: number
  effect: RedeemAccessCodeEffect
  accessGateId?: string
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

export class ConsoleAccessCodeFailedError extends Error {
  constructor() {
    super('Could not apply that Access Code. Try again shortly.')
    this.name = 'ConsoleAccessCodeFailedError'
  }
}

export class ConsoleAccessCodeVariantBlockedError extends Error {
  constructor() {
    super(
      'Cannot apply this Access Code while a live paid plan is active. Cancel or wait for the seat to end, then use manual assignment.',
    )
    this.name = 'ConsoleAccessCodeVariantBlockedError'
  }
}

export class ConsoleAccessCodeVariantUnavailableError extends Error {
  constructor() {
    super("This code's plan is no longer available. Contact support.")
    this.name = 'ConsoleAccessCodeVariantUnavailableError'
  }
}

function profileMatrixAlreadyEntitled(input: {
  hasLivePaidSub: boolean
  hasOpenGrantedGate: boolean
  hasOpenTimedGate: boolean
  mode: TrialRedeemCodeMode
}): boolean {
  if (input.hasLivePaidSub || input.hasOpenTimedGate) {
    return true
  }
  if (input.hasOpenGrantedGate && input.mode === 'permanent_free') {
    return true
  }
  return false
}

/**
 * Redeem an Access Code on Profile Billing. Access-Gate-native; no Stripe
 * subscription create. No admin audit / reason on this path.
 */
export async function redeemAccessCodeOnProfile(
  store: ConsoleAccessCodeStore,
  accessGate: ConsoleAccessCodeAccessGateIssuer,
  input: RedeemAccessCodeOnProfileInput,
  runtime: { now?: () => Date } = {},
): Promise<RedeemAccessCodeOnProfileResult> {
  if (!input.userId.trim()) {
    throw new ConsoleAccessCodeValidationError('userId is required')
  }

  const now = runtime.now?.() ?? new Date()
  const gate = await evaluateAccessCodeAtProfile(store, input.code, now)
  if (gate.action === 'invalid') throw new ConsoleAccessCodeInvalidError()
  if (gate.action === 'block') {
    if (gate.reason === 'expired') throw new ConsoleAccessCodeExpiredError()
    throw new ConsoleAccessCodeAlreadyUsedError()
  }

  const { id: codeId, trialDays, mode, variant } = gate.record

  if (variant) {
    const variantOutcome = await store.applyVariant(input.userId, variant)
    if (variantOutcome === 'blocked') {
      throw new ConsoleAccessCodeVariantBlockedError()
    }
    if (variantOutcome === 'unavailable') {
      throw new ConsoleAccessCodeVariantUnavailableError()
    }
  }

  const [hasLivePaidSub, hasOpenGrantedGate, hasOpenTimedGate] =
    await Promise.all([
      store.userHasLiveDefaultSubscription(input.userId),
      accessGate.hasOpenGrantedAccessGate(input.userId),
      accessGate.hasOpenTimedAccessGate(input.userId),
    ])

  if (
    profileMatrixAlreadyEntitled({
      hasLivePaidSub,
      hasOpenGrantedGate,
      hasOpenTimedGate,
      mode,
    })
  ) {
    const consumed = await store.consumeAsAlreadyEntitled(
      codeId,
      input.userId,
      now,
    )
    if (!consumed) throw new ConsoleAccessCodeFailedError()
    return { codeId, effect: 'already_entitled' }
  }

  let accessGateId: string
  let effect: RedeemAccessCodeEffect
  try {
    if (mode === 'permanent_free') {
      const issued = await accessGate.issueFreeGrant({ userId: input.userId })
      accessGateId = issued.accessGateId
      effect = 'free_grant_created'
    } else {
      const issued = await accessGate.grantActiveTrial({
        userId: input.userId,
        trialDays,
      })
      accessGateId = issued.accessGateId
      effect = 'trial_grant_created'
    }
  } catch {
    throw new ConsoleAccessCodeFailedError()
  }

  const consumed = await store.consumeAsRedeemed(codeId, input.userId, now)
  if (!consumed) throw new ConsoleAccessCodeFailedError()

  return {
    codeId,
    effect,
    accessGateId,
  }
}

const ACCESS_CODE_EFFECT_COPY: Record<RedeemAccessCodeEffect, string> = {
  free_grant_created: 'You now have permanent Free access.',
  trial_grant_created: 'Your free trial has started.',
  already_entitled: "You're already on a qualifying plan.",
}

/** Success toast / banner: headline plus one-line effect. */
export function formatAccessCodeAppliedMessage(
  result: Pick<RedeemAccessCodeOnProfileResult, 'effect'>,
): string {
  return `${CONSOLE_ACCESS_CODE_SUCCESS_HEADLINE} ${ACCESS_CODE_EFFECT_COPY[result.effect]}`
}
