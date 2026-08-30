import {
  TRIAL_REDEEM_CODE_PATTERN,
  getTrialRedeemDisplayStatus,
  type TrialRedeemCodeRecord,
  type TrialRedeemCodeStore,
} from './trial-redeem-code.ts'

/** Tester Codes share the sign-up field; format locked in #31 / #36. */
export const TESTER_CODE_PATTERN = /^TE-[A-Z0-9]{10}$/i

/** Sign-up block copy buckets; exact marketing strings remain placeholders. */
export const TRIAL_REDEEM_SIGNUP_EXPIRED_MESSAGE = 'Expired [COPY]' as const
export const TRIAL_REDEEM_SIGNUP_ALREADY_USED_MESSAGE =
  'Already used [COPY]' as const
/**
 * Machine signal for well-formatted GO- codes that are not in the store.
 * Clients redirect to the website waitlist; do not show as form copy.
 */
export const TRIAL_REDEEM_SIGNUP_WAITLIST_MESSAGE =
  'TRIAL_REDEEM_WAITLIST_REDIRECT' as const

export type SignUpCodeRoute =
  | { kind: 'none' }
  | { kind: 'tester'; code: string }
  | { kind: 'trial_redeem'; code: string }

/**
 * Routes the shared sign-up code field by prefix/format.
 * Empty and invalid/non-matching codes are not GO-/TE- routes.
 */
export function routeSignUpCode(
  raw: string | null | undefined,
): SignUpCodeRoute {
  const trimmed = raw?.trim()
  if (!trimmed) return { kind: 'none' }

  if (TRIAL_REDEEM_CODE_PATTERN.test(trimmed)) {
    return { kind: 'trial_redeem', code: trimmed.toUpperCase() }
  }
  if (TESTER_CODE_PATTERN.test(trimmed)) {
    return { kind: 'tester', code: trimmed.toUpperCase() }
  }
  return { kind: 'none' }
}

export type TrialRedeemSignUpGate =
  | { action: 'ignore' }
  | { action: 'waitlist' }
  | { action: 'block'; message: string }
  | { action: 'proceed'; record: TrialRedeemCodeRecord }

export function isTrialRedeemWaitlistRedirect(
  message: string | null | undefined,
): boolean {
  return message === TRIAL_REDEEM_SIGNUP_WAITLIST_MESSAGE
}

/**
 * Sign-up redeem check order:
 * empty → waitlist (no account);
 * invalid format / TE- → ignore (TE- consume stays elsewhere; invalid stays open);
 * well-formatted GO- lookup miss → waitlist (no account);
 * terminal → Already used; derived Expired → Expired; else proceed to Stripe.
 */
export async function evaluateTrialRedeemAtSignUp(
  store: Pick<TrialRedeemCodeStore, 'findByCode'>,
  rawCode: string | null | undefined,
  now: Date = new Date(),
): Promise<TrialRedeemSignUpGate> {
  const trimmed = rawCode?.trim()
  if (!trimmed) return { action: 'waitlist' }

  const routed = routeSignUpCode(trimmed)
  if (routed.kind !== 'trial_redeem') return { action: 'ignore' }

  const record = await store.findByCode(routed.code)
  if (!record) return { action: 'waitlist' }

  const displayStatus = getTrialRedeemDisplayStatus(record, now)
  switch (displayStatus) {
    case 'redeemed':
    case 'already_entitled':
      return {
        action: 'block',
        message: TRIAL_REDEEM_SIGNUP_ALREADY_USED_MESSAGE,
      }
    case 'expired':
      return {
        action: 'block',
        message: TRIAL_REDEEM_SIGNUP_EXPIRED_MESSAGE,
      }
    case 'unused':
      return { action: 'proceed', record }
  }
}

export type TrialRedeemConsumeStore = Pick<
  TrialRedeemCodeStore,
  'findByCode'
> & {
  /**
   * Atomically unused → redeemed with consume audit fields.
   * Returns false when the row is missing or no longer unused.
   */
  consumeAsRedeemed: (
    id: number,
    usedBy: string,
    usedAt: Date,
  ) => Promise<boolean>
  /**
   * Atomically unused → already_entitled with consume audit fields.
   * Returns false when the row is missing or no longer unused.
   */
  consumeAsAlreadyEntitled: (
    id: number,
    usedBy: string,
    usedAt: Date,
  ) => Promise<boolean>
}

/** Stripe Subscription statuses treated as already entitled (PRD #41). */
export const TRIAL_REDEEM_ENTITLED_SUBSCRIPTION_STATUSES = [
  'trialing',
  'active',
] as const

export type TrialRedeemStripeGateway = {
  /** True when the Customer already has a trialing or active Subscription. */
  customerHasEntitledSubscription: (customerId: string) => Promise<boolean>
  createNoCardTrialSubscription: (input: {
    customerId: string
    priceId: string
    trialPeriodDays: number
    metadata: { trialRedeemCodeId: string }
  }) => Promise<{ stripeSubscriptionId: string }>
}

export type RedeemTrialCodeInput = {
  code: string
  userId: string
  stripeCustomerId: string
  priceId: string
}

export type RedeemTrialCodeResult =
  | { status: 'ignored' }
  | { status: 'redeemed'; stripeSubscriptionId: string; codeId: number }
  | { status: 'already_entitled'; codeId: number }
  | { status: 'failed' }

/**
 * Stripe-first redeem: entitled Customers consume as already_entitled without a
 * second Subscription; otherwise create a no-card Free Trial Subscription then
 * consume as redeemed. Does not write a local Subscription row (webhook-only).
 * Does not set the tester role. On Stripe failure the code stays unused.
 */
export async function redeemTrialCodeAfterSignUp(
  store: TrialRedeemConsumeStore,
  stripe: TrialRedeemStripeGateway,
  input: RedeemTrialCodeInput,
  runtime: { now?: () => Date } = {},
): Promise<RedeemTrialCodeResult> {
  const now = runtime.now?.() ?? new Date()
  const gate = await evaluateTrialRedeemAtSignUp(store, input.code, now)
  if (gate.action !== 'proceed') return { status: 'ignored' }

  const { id: codeId, trialDays } = gate.record
  const alreadyEntitled = await stripe.customerHasEntitledSubscription(
    input.stripeCustomerId,
  )
  if (alreadyEntitled) {
    const consumed = await store.consumeAsAlreadyEntitled(
      codeId,
      input.userId,
      now,
    )
    if (!consumed) return { status: 'failed' }
    return { status: 'already_entitled', codeId }
  }

  let stripeSubscriptionId: string
  try {
    const created = await stripe.createNoCardTrialSubscription({
      customerId: input.stripeCustomerId,
      priceId: input.priceId,
      trialPeriodDays: trialDays,
      metadata: { trialRedeemCodeId: String(codeId) },
    })
    stripeSubscriptionId = created.stripeSubscriptionId
  } catch {
    return { status: 'failed' }
  }

  const consumed = await store.consumeAsRedeemed(codeId, input.userId, now)
  if (!consumed) return { status: 'failed' }

  return {
    status: 'redeemed',
    stripeSubscriptionId,
    codeId,
  }
}
