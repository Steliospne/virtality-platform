import {
  billingSnapshotFromSubscription,
  type AdminCustomerBillingSnapshot,
} from './admin-customer-access.ts'
import {
  FREE_PLAN_PRICE_ID,
  PRO_SUBSCRIPTION_PLAN,
  SUPPORTED_PRO_PLAN_PRICE_IDS,
  buildPermanentFreeSubscriptionCreateParams,
  formatProPlanPriceLabel,
  isProPlanPriceId,
  isProSubscriptionPlan,
  shouldScheduleSubscriptionChangeAtPeriodEnd,
} from '../billing/billing-plans.ts'
import {
  pickPrimaryCustomerSubscription,
  type CustomerSubscriptionSummary,
} from './admin-customer.ts'
import {
  annualFlagForProPlanPriceId,
  hasPendingCyclePlanChange,
  restoreSubscription,
  scheduleCyclePlanChange,
  type CyclePlanChangePort,
} from '../billing/cycle-plan-change.ts'
import { isLiveEntitlementSubscriptionStatus } from '../billing/entitlement-extension.ts'
import { hadPaidBillingHistory } from '../billing/paid-billing-history.ts'
import {
  annualFlagForProVariantPriceId,
  formatProVariantPriceLabel,
  isKnownProVariantPriceId,
  type ProVariantCatalog,
} from '../billing/pro-variant-catalog.ts'

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

export type LivePaidProSubscription = {
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
  retrievePaidProSubscription: (
    stripeSubscriptionId: string,
  ) => Promise<LivePaidProSubscription>
  previewPaidPlanChange: (input: {
    customerId: string
    stripeSubscriptionId: string
    subscriptionItemId: string
    newPriceId: string
  }) => Promise<{ prorationAmountCents: number; currency: string }>
  createPaidProSubscription: (input: {
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
  proVariantCatalog?: ProVariantCatalog
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
  /** See {@link ChangePaidPlanInput.proVariantCatalog}. */
  proVariantCatalog?: ProVariantCatalog
}

export type AdminCustomerBillingMutationResult = {
  auditId: string
  stripeOperationId: string
  pendingWebhookSync: boolean
  checkoutUrl?: string
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

function assertSupportedProPriceId(
  priceId: string,
  catalog?: ProVariantCatalog,
): void {
  const supported =
    catalog != null
      ? isKnownProVariantPriceId(catalog, priceId)
      : isProPlanPriceId(priceId)
  if (!supported) {
    throw new AdminCustomerBillingValidationError(
      'targetPriceId must be a supported Pro monthly or yearly Price.',
    )
  }
}

function annualFlagForTargetProPriceId(
  priceId: string,
  catalog?: ProVariantCatalog,
): boolean {
  if (catalog != null) {
    const annual = annualFlagForProVariantPriceId(catalog, priceId)
    if (annual == null) {
      throw new AdminCustomerBillingValidationError(
        'targetPriceId must be a supported Pro monthly or yearly Price.',
      )
    }
    return annual
  }
  return annualFlagForProPlanPriceId(priceId)
}

function formatTargetProPriceLabel(
  priceId: string,
  catalog?: ProVariantCatalog,
): string {
  if (catalog != null) {
    return formatProVariantPriceLabel(catalog, priceId)
  }
  return formatProPlanPriceLabel(priceId)
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

export function findLivePaidProSubscription(
  subscriptions: readonly AdminCustomerBillingSubscriptionRow[],
): AdminCustomerBillingSubscriptionRow | null {
  return (
    subscriptions.find(
      (subscription) =>
        isProSubscriptionPlan(subscription.plan) &&
        isLiveEntitlementSubscriptionStatus(subscription.status) &&
        Boolean(subscription.stripeSubscriptionId),
    ) ?? null
  )
}

/**
 * Assign Free after cancellation: Paid billing history, or a live Pro seat
 * (`active`/`trialing`) so staff can cancel immediately and create Free.
 * Trialing Pro alone is not Paid billing history; the live-seat arm covers it.
 */
export function qualifiesForAssignFreeAfterCancellation(
  subscriptions: readonly AdminCustomerBillingSubscriptionRow[],
): boolean {
  return (
    hadPaidBillingHistory(subscriptions) ||
    findLivePaidProSubscription(subscriptions) != null
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
  livePaidPro: AdminCustomerBillingSubscriptionRow | null
}> {
  const user = await store.findTargetUser(input.userId)
  if (!user) {
    throw new AdminCustomerBillingNotFoundError(input.userId)
  }

  const subscriptions = await store.listSubscriptions(user.id)
  const beforeBillingState = await store.summarizeBillingState(user.id)
  const livePaidPro = findLivePaidProSubscription(subscriptions)

  return { user, subscriptions, beforeBillingState, livePaidPro }
}

export function buildChangePaidPlanPreview(input: {
  targetPriceId: string
  periodEnd: Date | null
  prorationAmountCents: number | null
  currency: string | null
  usesCheckout: boolean
  /** Live paid Pro interval switch; Free → Paid create stays immediate. */
  schedulesAtPeriodEnd?: boolean
  proVariantCatalog?: ProVariantCatalog
}): AdminCustomerBillingPreview {
  const planLabel = formatTargetProPriceLabel(
    input.targetPriceId,
    input.proVariantCatalog,
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
    confirmationMessage: `Cancel the queued Cycle plan change. The customer stays on the current Pro interval through ${formatPeriodEndLabel(periodEnd)}.`,
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
    proVariantCatalog?: ProVariantCatalog
  },
): Promise<AdminCustomerBillingPreview> {
  assertSupportedProPriceId(input.targetPriceId, input.proVariantCatalog)

  const { user, livePaidPro } = await loadBillingContext(store, {
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
      periodEnd: livePaidPro?.periodEnd ?? null,
      prorationAmountCents: null,
      currency: null,
      usesCheckout: true,
      proVariantCatalog: input.proVariantCatalog,
    })
  }

  if (!livePaidPro?.stripeSubscriptionId) {
    return buildChangePaidPlanPreview({
      targetPriceId: input.targetPriceId,
      periodEnd: null,
      prorationAmountCents: null,
      currency: null,
      usesCheckout: false,
      schedulesAtPeriodEnd: false,
      proVariantCatalog: input.proVariantCatalog,
    })
  }

  const live = await stripe.retrievePaidProSubscription(
    livePaidPro.stripeSubscriptionId,
  )
  if (live.currentPriceId === input.targetPriceId) {
    throw new AdminCustomerBillingStateError(
      'Customer is already on the selected paid Pro interval.',
    )
  }

  return buildChangePaidPlanPreview({
    targetPriceId: input.targetPriceId,
    periodEnd: live.periodEnd,
    prorationAmountCents: null,
    currency: null,
    usesCheckout: false,
    schedulesAtPeriodEnd: shouldScheduleSubscriptionChangeAtPeriodEnd(
      livePaidPro.plan,
    ),
    proVariantCatalog: input.proVariantCatalog,
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
  assertSupportedProPriceId(input.targetPriceId, input.proVariantCatalog)

  const { user, beforeBillingState, livePaidPro } = await loadBillingContext(
    store,
    input,
  )
  const stripeCustomerId = await ensureStripeCustomer(
    store,
    stripe,
    user,
    input.actorUserId,
  )
  const hasPaymentMethod =
    await stripe.customerHasDefaultPaymentMethod(stripeCustomerId)

  if (!hasPaymentMethod) {
    return sendPaidCheckoutLinkForCustomer(store, stripe, input)
  }

  let stripeOperationId: string

  if (livePaidPro?.stripeSubscriptionId) {
    const live = await stripe.retrievePaidProSubscription(
      livePaidPro.stripeSubscriptionId,
    )
    if (live.currentPriceId === input.targetPriceId) {
      throw new AdminCustomerBillingStateError(
        'Customer is already on the selected paid Pro interval.',
      )
    }

    if (!shouldScheduleSubscriptionChangeAtPeriodEnd(livePaidPro.plan)) {
      throw new AdminCustomerBillingStateError(
        'Cycle plan change requires a live paid Pro subscription.',
      )
    }

    const scheduled = await scheduleCyclePlanChange({
      port: cyclePlan,
      referenceId: user.id,
      annual: annualFlagForTargetProPriceId(
        input.targetPriceId,
        input.proVariantCatalog,
      ),
      returnUrl: input.successUrl,
    })
    if (!scheduled.ok) {
      throw new AdminCustomerBillingStateError(scheduled.message)
    }
    stripeOperationId = scheduled.stripeScheduleId ?? live.stripeSubscriptionId
  } else {
    const created = await stripe.createPaidProSubscription({
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
  assertSupportedProPriceId(input.targetPriceId, input.proVariantCatalog)

  const { user, beforeBillingState } = await loadBillingContext(store, input)
  const stripeCustomerId = await ensureStripeCustomer(
    store,
    stripe,
    user,
    input.actorUserId,
  )

  const session = await stripe.createPaidCheckoutSession({
    customerId: stripeCustomerId,
    priceId: input.targetPriceId,
    successUrl: input.successUrl,
    cancelUrl: input.cancelUrl,
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

  const { user, beforeBillingState, livePaidPro } = await loadBillingContext(
    store,
    input,
  )
  if (!livePaidPro?.stripeSubscriptionId) {
    throw new AdminCustomerBillingStateError(
      'Customer does not have a live paid Pro subscription to cancel.',
    )
  }

  const action: AdminCustomerBillingAction =
    input.mode === 'immediate' ? 'cancel_immediately' : 'cancel_at_period_end'

  if (input.mode === 'period_end' && livePaidPro.cancelAtPeriodEnd) {
    throw new AdminCustomerBillingStateError(
      'Paid subscription is already scheduled to cancel at period end.',
    )
  }

  const result =
    input.mode === 'immediate'
      ? await stripe.cancelSubscriptionImmediately(
          livePaidPro.stripeSubscriptionId,
        )
      : await stripe.scheduleCancelAtPeriodEnd(livePaidPro.stripeSubscriptionId)

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
async function restoreLivePaidProAndRecordAudit(input: {
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

  const { user, beforeBillingState, livePaidPro } = await loadBillingContext(
    store,
    input,
  )
  if (!livePaidPro?.stripeSubscriptionId) {
    throw new AdminCustomerBillingStateError(
      'Customer does not have a live paid Pro subscription to reactivate.',
    )
  }
  if (!livePaidPro.cancelAtPeriodEnd) {
    throw new AdminCustomerBillingStateError(
      'Paid subscription is not scheduled for cancellation.',
    )
  }

  return restoreLivePaidProAndRecordAudit({
    store,
    cyclePlan,
    user,
    actorUserId: input.actorUserId,
    reason: input.reason,
    action: 'reactivate_subscription',
    fallbackStripeSubscriptionId: livePaidPro.stripeSubscriptionId,
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

  const { user, beforeBillingState, livePaidPro } = await loadBillingContext(
    store,
    input,
  )
  if (!livePaidPro?.stripeSubscriptionId) {
    throw new AdminCustomerBillingStateError(
      'Customer does not have a live paid Pro subscription.',
    )
  }
  if (!hasPendingCyclePlanChange(livePaidPro)) {
    throw new AdminCustomerBillingStateError(
      'Customer does not have a pending Cycle plan change to cancel.',
    )
  }

  return restoreLivePaidProAndRecordAudit({
    store,
    cyclePlan,
    user,
    actorUserId: input.actorUserId,
    reason: input.reason,
    action: 'cancel_cycle_plan_change',
    fallbackStripeSubscriptionId: livePaidPro.stripeSubscriptionId,
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

  const { user, subscriptions, beforeBillingState, livePaidPro } =
    await loadBillingContext(store, input)

  if (!qualifiesForAssignFreeAfterCancellation(subscriptions)) {
    throw new AdminCustomerBillingStateError(
      'Assign Free after cancellation requires prior paid billing or a live paid subscription.',
    )
  }

  let stripeOperationId: string | null = null
  if (livePaidPro?.stripeSubscriptionId) {
    const canceled = await stripe.cancelSubscriptionImmediately(
      livePaidPro.stripeSubscriptionId,
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
  assignedProVariant?: string | null
  subscriptions: readonly CustomerSubscriptionSummary[]
}): AdminCustomerBillingSnapshot {
  const primary = pickPrimaryCustomerSubscription(input.subscriptions)
  return billingSnapshotFromSubscription({
    role: input.role,
    stripeCustomerId: input.stripeCustomerId,
    assignedProVariant: input.assignedProVariant ?? null,
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

export function buildPaidProSubscriptionCreateParams(input: {
  customerId: string
  priceId: string
  metadata: Record<string, string>
}) {
  return {
    customer: input.customerId,
    items: [{ price: input.priceId }],
    metadata: {
      plan: PRO_SUBSCRIPTION_PLAN,
      ...input.metadata,
    },
  }
}

export { FREE_PLAN_PRICE_ID, SUPPORTED_PRO_PLAN_PRICE_IDS }
