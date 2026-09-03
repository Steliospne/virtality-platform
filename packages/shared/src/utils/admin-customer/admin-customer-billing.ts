import {
  billingSnapshotFromSubscription,
  type AdminCustomerBillingSnapshot,
} from './admin-customer-access.ts'
import {
  FREE_PLAN_PRICE_ID,
  DEFAULT_SUBSCRIPTION_PLAN,
  SUPPORTED_DEFAULT_PLAN_PRICE_IDS,
  buildPermanentFreeSubscriptionCreateParams,
  formatDefaultPlanPriceLabel,
  isDefaultPlanPriceId,
  isDefaultSubscriptionPlan,
  shouldScheduleSubscriptionChangeAtPeriodEnd,
} from '../billing/billing-plans.ts'
import {
  pickPrimaryCustomerSubscription,
  type CustomerSubscriptionSummary,
} from './admin-customer.ts'
import {
  annualFlagForDefaultPlanPriceId,
  hasPendingCyclePlanChange,
  restoreSubscription,
  scheduleCyclePlanChange,
  type CyclePlanChangePort,
} from '../billing/cycle-plan-change.ts'
import {
  buildCheckoutCancelReturnUrl,
  buildCheckoutSuccessUrl,
} from '../billing/checkout-success-url.ts'
import { withCheckoutReturnIntent } from '../billing/checkout-return-url.ts'
import { isLiveEntitlementSubscriptionStatus } from '../billing/entitlement-extension.ts'
import { hadPaidBillingHistory } from '../billing/paid-billing-history.ts'
import {
  annualFlagForPlanVariantPriceId,
  formatPlanVariantPriceLabel,
  isKnownPlanVariantPriceId,
  type PlanVariantCatalog,
} from '../billing/plan-variant-catalog.ts'

export const ADMIN_CUSTOMER_BILLING_ACTIONS = [
  'change_paid_plan',
  'cancel_immediately',
  'cancel_at_period_end',
  'reactivate_subscription',
  'cancel_cycle_plan_change',
  'assign_free_after_cancellation',
  'send_paid_checkout_link',
] as const

export type AdminCustomerBillingAction =
  (typeof ADMIN_CUSTOMER_BILLING_ACTIONS)[number]

export type AdminCustomerBillingAuditRecord = {
  targetUserId: string
  actorUserId: string
  action: AdminCustomerBillingAction
  reason: string
  outcome: 'success' | 'pending'
  stripeOperationId: string | null
  beforeBillingState: AdminCustomerBillingSnapshot
  afterBillingState: AdminCustomerBillingSnapshot | null
}

export type AdminCustomerBillingTargetUser = {
  id: string
  name: string
  email: string
  role: string | null
  stripeCustomerId: string | null
}

export type AdminCustomerBillingSubscriptionRow =
  CustomerSubscriptionSummary & {
    stripeCustomerId: string | null
  }

export type LivePaidDefaultSubscription = {
  stripeSubscriptionId: string
  stripeCustomerId: string
  subscriptionItemId: string
  currentPriceId: string
  status: string
  cancelAtPeriodEnd: boolean
  periodEnd: Date | null
}

export type AdminCustomerBillingStore = {
  findTargetUser: (
    userId: string,
  ) => Promise<AdminCustomerBillingTargetUser | null>
  updateStripeCustomerId: (
    userId: string,
    stripeCustomerId: string,
  ) => Promise<void>
  listSubscriptions: (
    userId: string,
  ) => Promise<AdminCustomerBillingSubscriptionRow[]>
  summarizeBillingState: (
    userId: string,
  ) => Promise<AdminCustomerBillingSnapshot>
  recordAudit: (
    record: AdminCustomerBillingAuditRecord,
  ) => Promise<{ id: string; record: AdminCustomerBillingAuditRecord }>
}

export type AdminCustomerBillingStripeGateway = {
  createCustomer: (input: {
    email: string
    name: string
    metadata: Record<string, string>
  }) => Promise<{ customerId: string }>
  customerHasDefaultPaymentMethod: (customerId: string) => Promise<boolean>
  retrievePaidDefaultSubscription: (
    stripeSubscriptionId: string,
  ) => Promise<LivePaidDefaultSubscription>
  previewPaidPlanChange: (input: {
    customerId: string
    stripeSubscriptionId: string
    subscriptionItemId: string
    newPriceId: string
  }) => Promise<{ prorationAmountCents: number; currency: string }>
  createPaidDefaultSubscription: (input: {
    customerId: string
    priceId: string
    metadata: Record<string, string>
  }) => Promise<{ stripeSubscriptionId: string }>
  cancelSubscriptionImmediately: (
    stripeSubscriptionId: string,
  ) => Promise<{ stripeSubscriptionId: string }>
  scheduleCancelAtPeriodEnd: (
    stripeSubscriptionId: string,
  ) => Promise<{ stripeSubscriptionId: string }>
  createPermanentFreeSubscription: (input: {
    customerId: string
    priceId: string
    metadata: Record<string, string>
  }) => Promise<{ stripeSubscriptionId: string }>
  createPaidCheckoutSession: (input: {
    customerId: string
    priceId: string
    successUrl: string
    cancelUrl: string
    metadata: Record<string, string>
  }) => Promise<{ checkoutSessionId: string; checkoutUrl: string }>
}

/** Better Auth Cycle plan change / restore port for admin mutations. */
export type AdminCustomerCyclePlanPort = CyclePlanChangePort

export type AdminCustomerBillingPreview = {
  action: AdminCustomerBillingAction
  effectiveTiming: 'immediate' | 'period_end' | 'on_checkout_completion'
  prorationSummary: string | null
  confirmationMessage: string
  requiresConfirmation: boolean
}

export type ChangePaidPlanInput = {
  userId: string
  actorUserId: string
  reason: string
  targetPriceId: string
  successUrl: string
  cancelUrl: string
  /**
   * When set (Assigned Variant catalog), targetPriceId may be any complete
   * catalog Price id, not only the canonical basic pair.
   */
  planVariantCatalog?: PlanVariantCatalog
}

export type CancelPaidSubscriptionInput = {
  userId: string
  actorUserId: string
  reason: string
  mode: 'immediate' | 'period_end'
}

export type ReactivatePaidSubscriptionInput = {
  userId: string
  actorUserId: string
  reason: string
}

export type CancelCyclePlanChangeInput = {
  userId: string
  actorUserId: string
  reason: string
}

export type AssignFreeAfterCancellationInput = {
  userId: string
  actorUserId: string
  reason: string
  priceId: string
}

export type SendPaidCheckoutLinkInput = {
  userId: string
  actorUserId: string
  reason: string
  targetPriceId: string
  successUrl: string
  cancelUrl: string
  /** See {@link ChangePaidPlanInput.planVariantCatalog}. */
  planVariantCatalog?: PlanVariantCatalog
}

export type AdminCustomerBillingMutationResult = {
  auditId: string
  stripeOperationId: string
  pendingWebhookSync: boolean
  checkoutUrl?: string
}

function profileBillingReturnUrl(userId: string): string {
  return `/user/${userId}/profile?tab=billing`
}

function checkoutSuccessUrlForSubscriptions(
  subscriptions: readonly AdminCustomerBillingSubscriptionRow[],
): string {
  return buildCheckoutSuccessUrl(
    hadPaidBillingHistory(subscriptions) ? 'renew' : 'subscribe',
  )
}

export class AdminCustomerBillingValidationError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'AdminCustomerBillingValidationError'
  }
}

export class AdminCustomerBillingNotFoundError extends Error {
  constructor(userId: string) {
    super(`Customer not found for user "${userId}".`)
    this.name = 'AdminCustomerBillingNotFoundError'
  }
}

export class AdminCustomerBillingStateError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'AdminCustomerBillingStateError'
  }
}

function assertReason(reason: string): void {
  const trimmed = reason.trim()
  if (trimmed.length < 3) {
    throw new AdminCustomerBillingValidationError(
      'Reason must be at least 3 characters.',
    )
  }
}

function assertActors(input: { userId: string; actorUserId: string }): void {
  if (!input.userId.trim()) {
    throw new AdminCustomerBillingValidationError('userId is required.')
  }
  if (!input.actorUserId.trim()) {
    throw new AdminCustomerBillingValidationError('actorUserId is required.')
  }
}

function assertSupportedDefaultPriceId(
  priceId: string,
  catalog?: PlanVariantCatalog,
): void {
  const supported =
    catalog != null
      ? isKnownPlanVariantPriceId(catalog, priceId)
      : isDefaultPlanPriceId(priceId)
  if (!supported) {
    throw new AdminCustomerBillingValidationError(
      'targetPriceId must be a supported Default monthly or yearly Price.',
    )
  }
}

function annualFlagForTargetDefaultPriceId(
  priceId: string,
  catalog?: PlanVariantCatalog,
): boolean {
  if (catalog != null) {
    const annual = annualFlagForPlanVariantPriceId(catalog, priceId)
    if (annual == null) {
      throw new AdminCustomerBillingValidationError(
        'targetPriceId must be a supported Default monthly or yearly Price.',
      )
    }
    return annual
  }
  return annualFlagForDefaultPlanPriceId(priceId)
}

function formatTargetDefaultPriceLabel(
  priceId: string,
  catalog?: PlanVariantCatalog,
): string {
  if (catalog != null) {
    return formatPlanVariantPriceLabel(catalog, priceId)
  }
  return formatDefaultPlanPriceLabel(priceId)
}

function stripeBillingMetadata(input: {
  actorUserId: string
  action: AdminCustomerBillingAction
}): Record<string, string> {
  return {
    adminCustomerActorUserId: input.actorUserId,
    adminCustomerAction: input.action,
  }
}

export function findLivePaidDefaultSubscription(
  subscriptions: readonly AdminCustomerBillingSubscriptionRow[],
): AdminCustomerBillingSubscriptionRow | null {
  return (
    subscriptions.find(
      (subscription) =>
        isDefaultSubscriptionPlan(subscription.plan) &&
        isLiveEntitlementSubscriptionStatus(subscription.status) &&
        Boolean(subscription.stripeSubscriptionId),
    ) ?? null
  )
}

/**
 * Assign Free after cancellation: Paid billing history, or a live Default seat
 * (`active`/`trialing`) so staff can cancel immediately and create Free.
 * Trialing Default alone is not Paid billing history; the live-seat arm covers it.
 */
export function qualifiesForAssignFreeAfterCancellation(
  subscriptions: readonly AdminCustomerBillingSubscriptionRow[],
): boolean {
  return (
    hadPaidBillingHistory(subscriptions) ||
    findLivePaidDefaultSubscription(subscriptions) != null
  )
}

function formatProrationSummary(input: {
  prorationAmountCents: number
  currency: string
}): string {
  const amount = Math.abs(input.prorationAmountCents) / 100
  const formatted = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: input.currency.toUpperCase(),
  }).format(amount)
  if (input.prorationAmountCents === 0) {
    return 'No proration charge is expected for this change.'
  }
  if (input.prorationAmountCents > 0) {
    return `Stripe may charge about ${formatted} in proration.`
  }
  return `Stripe may credit about ${formatted} in proration.`
}

function formatPeriodEndLabel(periodEnd: Date | null): string {
  if (!periodEnd) return 'the current billing period end'
  return periodEnd.toISOString()
}

async function ensureStripeCustomer(
  store: AdminCustomerBillingStore,
  stripe: AdminCustomerBillingStripeGateway,
  user: AdminCustomerBillingTargetUser,
  actorUserId: string,
): Promise<string> {
  if (user.stripeCustomerId) return user.stripeCustomerId

  const created = await stripe.createCustomer({
    email: user.email,
    name: user.name,
    metadata: {
      virtalityUserId: user.id,
      adminCustomerActorUserId: actorUserId,
    },
  })
  await store.updateStripeCustomerId(user.id, created.customerId)
  return created.customerId
}

async function loadBillingContext(
  store: AdminCustomerBillingStore,
  input: { userId: string; actorUserId: string },
): Promise<{
  user: AdminCustomerBillingTargetUser
  subscriptions: AdminCustomerBillingSubscriptionRow[]
  beforeBillingState: AdminCustomerBillingSnapshot
  livePaidDefault: AdminCustomerBillingSubscriptionRow | null
}> {
  const user = await store.findTargetUser(input.userId)
  if (!user) {
    throw new AdminCustomerBillingNotFoundError(input.userId)
  }

  const subscriptions = await store.listSubscriptions(user.id)
  const beforeBillingState = await store.summarizeBillingState(user.id)
  const livePaidDefault = findLivePaidDefaultSubscription(subscriptions)

  return { user, subscriptions, beforeBillingState, livePaidDefault }
}

export function buildChangePaidPlanPreview(input: {
  targetPriceId: string
  periodEnd: Date | null
  prorationAmountCents: number | null
  currency: string | null
  usesCheckout: boolean
  /** Live paid Default interval switch; Free → Paid create stays immediate. */
  schedulesAtPeriodEnd?: boolean
  planVariantCatalog?: PlanVariantCatalog
}): AdminCustomerBillingPreview {
  const planLabel = formatTargetDefaultPriceLabel(
    input.targetPriceId,
    input.planVariantCatalog,
  )
  if (input.usesCheckout) {
    return {
      action: 'send_paid_checkout_link',
      effectiveTiming: 'on_checkout_completion',
      prorationSummary: null,
      confirmationMessage: `Send a Checkout link for ${planLabel}. The customer stays on Free until purchase completes.`,
      requiresConfirmation: true,
    }
  }

  if (input.schedulesAtPeriodEnd) {
    return {
      action: 'change_paid_plan',
      effectiveTiming: 'period_end',
      prorationSummary: null,
      confirmationMessage: `Schedule change to ${planLabel} at period end (${formatPeriodEndLabel(input.periodEnd)}). Current pricing stays until then.`,
      requiresConfirmation: true,
    }
  }

  return {
    action: 'change_paid_plan',
    effectiveTiming: 'immediate',
    prorationSummary: null,
    confirmationMessage: `Start ${planLabel} immediately and charge the customer now.`,
    requiresConfirmation: true,
  }
}

export function buildCancelPaidSubscriptionPreview(input: {
  mode: 'immediate' | 'period_end'
  periodEnd: Date | null
}): AdminCustomerBillingPreview {
  if (input.mode === 'immediate') {
    return {
      action: 'cancel_immediately',
      effectiveTiming: 'immediate',
      prorationSummary:
        'Unused paid time may be credited per Stripe proration rules.',
      confirmationMessage:
        'Cancel the paid subscription immediately. Access ends now.',
      requiresConfirmation: true,
    }
  }

  return {
    action: 'cancel_at_period_end',
    effectiveTiming: 'period_end',
    prorationSummary: null,
    confirmationMessage: `Schedule cancellation at period end (${formatPeriodEndLabel(input.periodEnd)}). Access continues until then.`,
    requiresConfirmation: true,
  }
}

export function buildReactivatePaidSubscriptionPreview(
  periodEnd: Date | null,
): AdminCustomerBillingPreview {
  return {
    action: 'reactivate_subscription',
    effectiveTiming: 'period_end',
    prorationSummary: null,
    confirmationMessage: `Remove the scheduled cancellation. The subscription renews on ${formatPeriodEndLabel(periodEnd)}.`,
    requiresConfirmation: true,
  }
}

export function buildCancelCyclePlanChangePreview(
  periodEnd: Date | null,
): AdminCustomerBillingPreview {
  return {
    action: 'cancel_cycle_plan_change',
    effectiveTiming: 'immediate',
    prorationSummary: null,
    confirmationMessage: `Cancel the queued Cycle plan change. The customer stays on the current Default interval through ${formatPeriodEndLabel(periodEnd)}.`,
    requiresConfirmation: true,
  }
}

export function buildAssignFreeAfterCancellationPreview(): AdminCustomerBillingPreview {
  return {
    action: 'assign_free_after_cancellation',
    effectiveTiming: 'immediate',
    prorationSummary: null,
    confirmationMessage:
      'Assign permanent Free without a trial. Any live paid subscription is canceled immediately first.',
    requiresConfirmation: true,
  }
}

export async function previewChangePaidPlan(
  store: AdminCustomerBillingStore,
  stripe: AdminCustomerBillingStripeGateway,
  input: {
    userId: string
    targetPriceId: string
    planVariantCatalog?: PlanVariantCatalog
  },
): Promise<AdminCustomerBillingPreview> {
  assertSupportedDefaultPriceId(input.targetPriceId, input.planVariantCatalog)

  const { user, livePaidDefault } = await loadBillingContext(store, {
    userId: input.userId,
    actorUserId: 'preview',
  })

  const stripeCustomerId = user.stripeCustomerId
  const hasPaymentMethod = stripeCustomerId
    ? await stripe.customerHasDefaultPaymentMethod(stripeCustomerId)
    : false

  if (!hasPaymentMethod) {
    return buildChangePaidPlanPreview({
      targetPriceId: input.targetPriceId,
      periodEnd: livePaidDefault?.periodEnd ?? null,
      prorationAmountCents: null,
      currency: null,
      usesCheckout: true,
      planVariantCatalog: input.planVariantCatalog,
    })
  }

  if (!livePaidDefault?.stripeSubscriptionId) {
    return buildChangePaidPlanPreview({
      targetPriceId: input.targetPriceId,
      periodEnd: null,
      prorationAmountCents: null,
      currency: null,
      usesCheckout: false,
      schedulesAtPeriodEnd: false,
      planVariantCatalog: input.planVariantCatalog,
    })
  }

  const live = await stripe.retrievePaidDefaultSubscription(
    livePaidDefault.stripeSubscriptionId,
  )
  if (live.currentPriceId === input.targetPriceId) {
    throw new AdminCustomerBillingStateError(
      'Customer is already on the selected paid Default interval.',
    )
  }

  return buildChangePaidPlanPreview({
    targetPriceId: input.targetPriceId,
    periodEnd: live.periodEnd,
    prorationAmountCents: null,
    currency: null,
    usesCheckout: false,
    schedulesAtPeriodEnd: shouldScheduleSubscriptionChangeAtPeriodEnd(
      livePaidDefault.plan,
    ),
    planVariantCatalog: input.planVariantCatalog,
  })
}

export async function changePaidPlanForCustomer(
  store: AdminCustomerBillingStore,
  stripe: AdminCustomerBillingStripeGateway,
  cyclePlan: AdminCustomerCyclePlanPort,
  input: ChangePaidPlanInput,
): Promise<AdminCustomerBillingMutationResult> {
  assertActors(input)
  assertReason(input.reason)
  assertSupportedDefaultPriceId(input.targetPriceId, input.planVariantCatalog)

  const { user, subscriptions, beforeBillingState, livePaidDefault } =
    await loadBillingContext(store, input)
  const stripeCustomerId = await ensureStripeCustomer(
    store,
    stripe,
    user,
    input.actorUserId,
  )
  const hasPaymentMethod =
    await stripe.customerHasDefaultPaymentMethod(stripeCustomerId)

  if (!hasPaymentMethod) {
    return sendPaidCheckoutLinkForCustomer(store, stripe, {
      ...input,
      successUrl: checkoutSuccessUrlForSubscriptions(subscriptions),
      cancelUrl: buildCheckoutCancelReturnUrl(profileBillingReturnUrl(user.id)),
    })
  }

  let stripeOperationId: string

  if (livePaidDefault?.stripeSubscriptionId) {
    const live = await stripe.retrievePaidDefaultSubscription(
      livePaidDefault.stripeSubscriptionId,
    )
    if (live.currentPriceId === input.targetPriceId) {
      throw new AdminCustomerBillingStateError(
        'Customer is already on the selected paid Default interval.',
      )
    }

    if (!shouldScheduleSubscriptionChangeAtPeriodEnd(livePaidDefault.plan)) {
      throw new AdminCustomerBillingStateError(
        'Cycle plan change requires a live paid Default subscription.',
      )
    }

    const scheduled = await scheduleCyclePlanChange({
      port: cyclePlan,
      referenceId: user.id,
      annual: annualFlagForTargetDefaultPriceId(
        input.targetPriceId,
        input.planVariantCatalog,
      ),
      returnUrl: withCheckoutReturnIntent(
        profileBillingReturnUrl(user.id),
        'success',
      ),
    })
    if (!scheduled.ok) {
      throw new AdminCustomerBillingStateError(scheduled.message)
    }
    stripeOperationId = scheduled.stripeScheduleId ?? live.stripeSubscriptionId
  } else {
    const created = await stripe.createPaidDefaultSubscription({
      customerId: stripeCustomerId,
      priceId: input.targetPriceId,
      metadata: stripeBillingMetadata({
        actorUserId: input.actorUserId,
        action: 'change_paid_plan',
      }),
    })
    stripeOperationId = created.stripeSubscriptionId
  }

  const afterBillingState = await store.summarizeBillingState(user.id)
  const audit = await store.recordAudit({
    targetUserId: user.id,
    actorUserId: input.actorUserId,
    action: 'change_paid_plan',
    reason: input.reason.trim(),
    outcome: 'pending',
    stripeOperationId,
    beforeBillingState,
    afterBillingState,
  })

  return {
    auditId: audit.id,
    stripeOperationId,
    pendingWebhookSync: true,
  }
}

export async function sendPaidCheckoutLinkForCustomer(
  store: AdminCustomerBillingStore,
  stripe: AdminCustomerBillingStripeGateway,
  input: SendPaidCheckoutLinkInput,
): Promise<AdminCustomerBillingMutationResult> {
  assertActors(input)
  assertReason(input.reason)
  assertSupportedDefaultPriceId(input.targetPriceId, input.planVariantCatalog)

  const { user, subscriptions, beforeBillingState } = await loadBillingContext(
    store,
    input,
  )
  const stripeCustomerId = await ensureStripeCustomer(
    store,
    stripe,
    user,
    input.actorUserId,
  )

  const session = await stripe.createPaidCheckoutSession({
    customerId: stripeCustomerId,
    priceId: input.targetPriceId,
    successUrl: checkoutSuccessUrlForSubscriptions(subscriptions),
    cancelUrl: buildCheckoutCancelReturnUrl(profileBillingReturnUrl(user.id)),
    metadata: stripeBillingMetadata({
      actorUserId: input.actorUserId,
      action: 'send_paid_checkout_link',
    }),
  })

  const afterBillingState = await store.summarizeBillingState(user.id)
  const audit = await store.recordAudit({
    targetUserId: user.id,
    actorUserId: input.actorUserId,
    action: 'send_paid_checkout_link',
    reason: input.reason.trim(),
    outcome: 'pending',
    stripeOperationId: session.checkoutSessionId,
    beforeBillingState,
    afterBillingState,
  })

  return {
    auditId: audit.id,
    stripeOperationId: session.checkoutSessionId,
    pendingWebhookSync: true,
    checkoutUrl: session.checkoutUrl,
  }
}

export async function cancelPaidSubscriptionForCustomer(
  store: AdminCustomerBillingStore,
  stripe: AdminCustomerBillingStripeGateway,
  input: CancelPaidSubscriptionInput,
): Promise<AdminCustomerBillingMutationResult> {
  assertActors(input)
  assertReason(input.reason)

  const { user, beforeBillingState, livePaidDefault } =
    await loadBillingContext(store, input)
  if (!livePaidDefault?.stripeSubscriptionId) {
    throw new AdminCustomerBillingStateError(
      'Customer does not have a live paid Default subscription to cancel.',
    )
  }

  const action: AdminCustomerBillingAction =
    input.mode === 'immediate' ? 'cancel_immediately' : 'cancel_at_period_end'

  if (input.mode === 'period_end' && livePaidDefault.cancelAtPeriodEnd) {
    throw new AdminCustomerBillingStateError(
      'Paid subscription is already scheduled to cancel at period end.',
    )
  }

  const result =
    input.mode === 'immediate'
      ? await stripe.cancelSubscriptionImmediately(
          livePaidDefault.stripeSubscriptionId,
        )
      : await stripe.scheduleCancelAtPeriodEnd(
          livePaidDefault.stripeSubscriptionId,
        )

  const afterBillingState = await store.summarizeBillingState(user.id)
  const audit = await store.recordAudit({
    targetUserId: user.id,
    actorUserId: input.actorUserId,
    action,
    reason: input.reason.trim(),
    outcome: 'pending',
    stripeOperationId: result.stripeSubscriptionId,
    beforeBillingState,
    afterBillingState,
  })

  return {
    auditId: audit.id,
    stripeOperationId: result.stripeSubscriptionId,
    pendingWebhookSync: true,
  }
}

/**
 * Shared Better Auth restore + pending audit for Reactivate and Cancel Cycle
 * plan change (same restore underneath, distinct audit actions).
 */
async function restoreLivePaidDefaultAndRecordAudit(input: {
  store: AdminCustomerBillingStore
  cyclePlan: AdminCustomerCyclePlanPort
  user: AdminCustomerBillingTargetUser
  actorUserId: string
  reason: string
  action: 'reactivate_subscription' | 'cancel_cycle_plan_change'
  fallbackStripeSubscriptionId: string
  beforeBillingState: AdminCustomerBillingSnapshot
}): Promise<AdminCustomerBillingMutationResult> {
  const restored = await restoreSubscription({
    port: input.cyclePlan,
    referenceId: input.user.id,
  })
  if (!restored.ok) {
    throw new AdminCustomerBillingStateError(restored.message)
  }

  const stripeOperationId =
    restored.stripeSubscriptionId ?? input.fallbackStripeSubscriptionId
  const afterBillingState = await input.store.summarizeBillingState(
    input.user.id,
  )
  const audit = await input.store.recordAudit({
    targetUserId: input.user.id,
    actorUserId: input.actorUserId,
    action: input.action,
    reason: input.reason.trim(),
    outcome: 'pending',
    stripeOperationId,
    beforeBillingState: input.beforeBillingState,
    afterBillingState,
  })

  return {
    auditId: audit.id,
    stripeOperationId,
    pendingWebhookSync: true,
  }
}

export async function reactivatePaidSubscriptionForCustomer(
  store: AdminCustomerBillingStore,
  cyclePlan: AdminCustomerCyclePlanPort,
  input: ReactivatePaidSubscriptionInput,
): Promise<AdminCustomerBillingMutationResult> {
  assertActors(input)
  assertReason(input.reason)

  const { user, beforeBillingState, livePaidDefault } =
    await loadBillingContext(store, input)
  if (!livePaidDefault?.stripeSubscriptionId) {
    throw new AdminCustomerBillingStateError(
      'Customer does not have a live paid Default subscription to reactivate.',
    )
  }
  if (!livePaidDefault.cancelAtPeriodEnd) {
    throw new AdminCustomerBillingStateError(
      'Paid subscription is not scheduled for cancellation.',
    )
  }

  return restoreLivePaidDefaultAndRecordAudit({
    store,
    cyclePlan,
    user,
    actorUserId: input.actorUserId,
    reason: input.reason,
    action: 'reactivate_subscription',
    fallbackStripeSubscriptionId: livePaidDefault.stripeSubscriptionId,
    beforeBillingState,
  })
}

export async function cancelCyclePlanChangeForCustomer(
  store: AdminCustomerBillingStore,
  cyclePlan: AdminCustomerCyclePlanPort,
  input: CancelCyclePlanChangeInput,
): Promise<AdminCustomerBillingMutationResult> {
  assertActors(input)
  assertReason(input.reason)

  const { user, beforeBillingState, livePaidDefault } =
    await loadBillingContext(store, input)
  if (!livePaidDefault?.stripeSubscriptionId) {
    throw new AdminCustomerBillingStateError(
      'Customer does not have a live paid Default subscription.',
    )
  }
  if (!hasPendingCyclePlanChange(livePaidDefault)) {
    throw new AdminCustomerBillingStateError(
      'Customer does not have a pending Cycle plan change to cancel.',
    )
  }

  return restoreLivePaidDefaultAndRecordAudit({
    store,
    cyclePlan,
    user,
    actorUserId: input.actorUserId,
    reason: input.reason,
    action: 'cancel_cycle_plan_change',
    fallbackStripeSubscriptionId: livePaidDefault.stripeSubscriptionId,
    beforeBillingState,
  })
}

export async function assignFreeAfterCancellationForCustomer(
  store: AdminCustomerBillingStore,
  stripe: AdminCustomerBillingStripeGateway,
  input: AssignFreeAfterCancellationInput,
): Promise<AdminCustomerBillingMutationResult> {
  assertActors(input)
  assertReason(input.reason)
  if (!input.priceId.trim()) {
    throw new AdminCustomerBillingValidationError('priceId is required.')
  }

  const { user, subscriptions, beforeBillingState, livePaidDefault } =
    await loadBillingContext(store, input)

  if (!qualifiesForAssignFreeAfterCancellation(subscriptions)) {
    throw new AdminCustomerBillingStateError(
      'Assign Free after cancellation requires prior paid billing or a live paid subscription.',
    )
  }

  let stripeOperationId: string | null = null
  if (livePaidDefault?.stripeSubscriptionId) {
    const canceled = await stripe.cancelSubscriptionImmediately(
      livePaidDefault.stripeSubscriptionId,
    )
    stripeOperationId = canceled.stripeSubscriptionId
  }

  const stripeCustomerId = await ensureStripeCustomer(
    store,
    stripe,
    user,
    input.actorUserId,
  )

  const created = await stripe.createPermanentFreeSubscription({
    customerId: stripeCustomerId,
    priceId: input.priceId,
    metadata: stripeBillingMetadata({
      actorUserId: input.actorUserId,
      action: 'assign_free_after_cancellation',
    }),
  })

  const afterBillingState = await store.summarizeBillingState(user.id)
  const audit = await store.recordAudit({
    targetUserId: user.id,
    actorUserId: input.actorUserId,
    action: 'assign_free_after_cancellation',
    reason: input.reason.trim(),
    outcome: 'pending',
    stripeOperationId: created.stripeSubscriptionId,
    beforeBillingState,
    afterBillingState,
  })

  return {
    auditId: audit.id,
    stripeOperationId: created.stripeSubscriptionId,
    pendingWebhookSync: true,
  }
}

export function formatAdminCustomerBillingActionLabel(
  action: AdminCustomerBillingAction,
): string {
  switch (action) {
    case 'change_paid_plan':
      return 'Change paid plan'
    case 'cancel_immediately':
      return 'Cancel immediately'
    case 'cancel_at_period_end':
      return 'Cancel at period end'
    case 'reactivate_subscription':
      return 'Reactivate subscription'
    case 'cancel_cycle_plan_change':
      return 'Cancel Cycle plan change'
    case 'assign_free_after_cancellation':
      return 'Assign Free after cancellation'
    case 'send_paid_checkout_link':
      return 'Send paid Checkout link'
  }
}

export function isAdminCustomerBillingAction(
  value: string,
): value is AdminCustomerBillingAction {
  return (ADMIN_CUSTOMER_BILLING_ACTIONS as readonly string[]).includes(value)
}

export function billingSnapshotFromPrimarySubscription(input: {
  role: string | null
  stripeCustomerId: string | null
  assignedDefaultVariant?: string | null
  subscriptions: readonly CustomerSubscriptionSummary[]
}): AdminCustomerBillingSnapshot {
  const primary = pickPrimaryCustomerSubscription(input.subscriptions)
  return billingSnapshotFromSubscription({
    role: input.role,
    stripeCustomerId: input.stripeCustomerId,
    assignedDefaultVariant: input.assignedDefaultVariant ?? null,
    subscription: primary
      ? {
          plan: primary.plan,
          status: primary.status,
          stripeSubscriptionId: primary.stripeSubscriptionId ?? null,
        }
      : null,
  })
}

export function buildPermanentFreeAfterCancellationStripeParams(input: {
  customerId: string
  priceId: string
  actorUserId: string
}) {
  return buildPermanentFreeSubscriptionCreateParams({
    customerId: input.customerId,
    priceId: input.priceId,
    metadata: stripeBillingMetadata({
      actorUserId: input.actorUserId,
      action: 'assign_free_after_cancellation',
    }),
  })
}

export function buildPaidDefaultSubscriptionCreateParams(input: {
  customerId: string
  priceId: string
  metadata: Record<string, string>
}) {
  return {
    customer: input.customerId,
    items: [{ price: input.priceId }],
    metadata: {
      plan: DEFAULT_SUBSCRIPTION_PLAN,
      ...input.metadata,
    },
  }
}

export { FREE_PLAN_PRICE_ID, SUPPORTED_DEFAULT_PLAN_PRICE_IDS }
