import {
  betterAuthStripePlansMatchPrice,
  type BetterAuthStripePlanConfig,
} from './pro-variant-catalog.ts'

export type ReconciliationStripeSubscriptionItem = {
  price: {
    id: string
    lookup_key?: string | null
    recurring?: { interval?: string } | null
  }
  quantity?: number | null
  current_period_start: number
  current_period_end: number
}

export type ReconciliationStripeSubscription = {
  id: string
  customer: string
  status: string
  metadata?: Record<string, string>
  items: { data: ReconciliationStripeSubscriptionItem[] }
  trial_start?: number | null
  trial_end?: number | null
  cancel_at_period_end?: boolean
  cancel_at?: number | null
  canceled_at?: number | null
  ended_at?: number | null
  schedule?: string | { id: string } | null
}

export type ReconciliationSubscriptionRow = {
  id: string
  referenceId: string
  stripeSubscriptionId: string | null
  stripeCustomerId: string | null
  plan: string
  status: string
  periodStart: Date | null
  periodEnd: Date | null
  cancelAtPeriodEnd: boolean | null
  cancelAt: Date | null
  canceledAt: Date | null
  endedAt: Date | null
  seats: number | null
  trialStart: Date | null
  trialEnd: Date | null
  billingInterval: string | null
  stripeScheduleId: string | null
}

export type StripeDerivedSubscriptionFields = {
  plan?: string
  status: string
  periodStart: Date | null
  periodEnd: Date | null
  cancelAtPeriodEnd: boolean | null
  cancelAt: Date | null
  canceledAt: Date | null
  endedAt: Date | null
  seats: number | null
  trialStart: Date | null
  trialEnd: Date | null
  billingInterval: string | null
  stripeScheduleId: string | null
  stripeCustomerId: string
  stripeSubscriptionId: string
}

export type ReconciliationStore = {
  findByStripeSubscriptionId: (
    stripeSubscriptionId: string,
  ) => Promise<ReconciliationSubscriptionRow | null>
  listWithStripeSubscriptionId: () => Promise<ReconciliationSubscriptionRow[]>
  updateStripeDerivedFields: (
    id: string,
    fields: StripeDerivedSubscriptionFields,
  ) => Promise<void>
  createSubscription: (row: ReconciliationSubscriptionRow) => Promise<void>
  userExists: (userId: string) => Promise<boolean>
}

export type ReconciliationStripeGateway = {
  listAllSubscriptions: () => Promise<ReconciliationStripeSubscription[]>
  retrieveCustomerMetadata: (
    customerId: string,
  ) => Promise<Record<string, string>>
}

export type ReconciliationLogger = {
  info: (event: string, attributes: Record<string, unknown>) => void
  warn: (event: string, attributes: Record<string, unknown>) => void
  error: (
    event: string,
    attributes: Record<string, unknown>,
    message?: string,
  ) => void
}

export type ReconcileStripeSubscriptionsInput = {
  gateway: ReconciliationStripeGateway
  store: ReconciliationStore
  plans: readonly BetterAuthStripePlanConfig[]
  logger: ReconciliationLogger
  createId: () => string
}

export type ReconcileStripeSubscriptionsResult = {
  matched: number
  created: number
  skipped: number
  orphaned: number
}

type ResolvedPlanItem = {
  item: ReconciliationStripeSubscriptionItem
  plan?: BetterAuthStripePlanConfig
}

type ReconciliationSkipReason =
  | 'plan_unresolved'
  | 'organization_owned'
  | 'unresolvable_user'

type StripeSubscriptionOutcome = 'matched' | 'created' | 'skipped'

function unixToDate(value: number | null | undefined): Date | null {
  return value == null ? null : new Date(value * 1000)
}

function resolveScheduleId(
  schedule: ReconciliationStripeSubscription['schedule'],
): string | null {
  if (!schedule) return null
  return typeof schedule === 'string' ? schedule : schedule.id
}

function resolvePlanItem(
  plans: readonly BetterAuthStripePlanConfig[],
  items: ReconciliationStripeSubscriptionItem[],
): ResolvedPlanItem | undefined {
  const first = items[0]
  if (!first) return undefined

  for (const item of items) {
    const plan = betterAuthStripePlansMatchPrice(plans, item.price)
    if (plan) return { item, plan }
  }

  return items.length === 1 ? { item: first, plan: undefined } : undefined
}

function extractOwnershipMetadata(
  subscriptionMetadata: Record<string, string> | undefined,
  customerMetadata: Record<string, string>,
): {
  userId?: string
  customerType?: string
  organizationId?: string
} {
  return {
    userId: subscriptionMetadata?.userId ?? customerMetadata.userId,
    customerType:
      subscriptionMetadata?.customerType ?? customerMetadata.customerType,
    organizationId:
      subscriptionMetadata?.organizationId ?? customerMetadata.organizationId,
  }
}

function isOrganizationOwned(metadata: {
  customerType?: string
  organizationId?: string
}): boolean {
  return (
    metadata.customerType === 'organization' || Boolean(metadata.organizationId)
  )
}

function logSkipped(
  logger: ReconciliationLogger,
  stripeSubscriptionId: string,
  reason: ReconciliationSkipReason,
): void {
  logger.warn('billing.subscription.reconcile.skipped', {
    stripeSubscriptionId,
    reason,
  })
}

function resolveTrialDates(subscription: ReconciliationStripeSubscription): {
  trialStart: Date | null
  trialEnd: Date | null
} {
  if (subscription.trial_start != null && subscription.trial_end != null) {
    return {
      trialStart: unixToDate(subscription.trial_start),
      trialEnd: unixToDate(subscription.trial_end),
    }
  }

  return { trialStart: null, trialEnd: null }
}

function buildStripeDerivedFields(
  subscription: ReconciliationStripeSubscription,
  resolved: ResolvedPlanItem,
): StripeDerivedSubscriptionFields {
  return {
    ...(resolved.plan ? { plan: resolved.plan.name.toLowerCase() } : {}),
    status: subscription.status,
    periodStart: unixToDate(resolved.item.current_period_start),
    periodEnd: unixToDate(resolved.item.current_period_end),
    cancelAtPeriodEnd: subscription.cancel_at_period_end ?? null,
    cancelAt: unixToDate(subscription.cancel_at),
    canceledAt: unixToDate(subscription.canceled_at),
    endedAt: unixToDate(subscription.ended_at),
    seats: resolved.item.quantity ?? 1,
    billingInterval: resolved.item.price.recurring?.interval ?? null,
    stripeScheduleId: resolveScheduleId(subscription.schedule),
    stripeCustomerId: subscription.customer,
    stripeSubscriptionId: subscription.id,
    ...resolveTrialDates(subscription),
  }
}

function toSubscriptionRow(
  subscriptionId: string,
  userId: string,
  plan: string,
  derived: StripeDerivedSubscriptionFields,
): ReconciliationSubscriptionRow {
  return {
    id: subscriptionId,
    referenceId: userId,
    stripeCustomerId: derived.stripeCustomerId,
    stripeSubscriptionId: derived.stripeSubscriptionId,
    plan,
    status: derived.status,
    periodStart: derived.periodStart,
    periodEnd: derived.periodEnd,
    cancelAtPeriodEnd: derived.cancelAtPeriodEnd,
    cancelAt: derived.cancelAt,
    canceledAt: derived.canceledAt,
    endedAt: derived.endedAt,
    seats: derived.seats,
    trialStart: derived.trialStart,
    trialEnd: derived.trialEnd,
    billingInterval: derived.billingInterval,
    stripeScheduleId: derived.stripeScheduleId,
  }
}

async function resolveUserOwnedReferenceId(
  subscription: ReconciliationStripeSubscription,
  gateway: ReconciliationStripeGateway,
  store: ReconciliationStore,
): Promise<
  | { ok: true; userId: string }
  | { ok: false; reason: 'organization_owned' | 'unresolvable_user' }
> {
  const customerMetadata = await gateway.retrieveCustomerMetadata(
    subscription.customer,
  )
  const ownership = extractOwnershipMetadata(
    subscription.metadata,
    customerMetadata,
  )

  if (isOrganizationOwned(ownership)) {
    return { ok: false, reason: 'organization_owned' }
  }

  const userId =
    ownership.userId ?? subscription.metadata?.referenceId ?? undefined
  if (!userId || !(await store.userExists(userId))) {
    return { ok: false, reason: 'unresolvable_user' }
  }

  return { ok: true, userId }
}

async function processStripeSubscription(
  stripeSubscription: ReconciliationStripeSubscription,
  deps: {
    gateway: ReconciliationStripeGateway
    store: ReconciliationStore
    plans: readonly BetterAuthStripePlanConfig[]
    logger: ReconciliationLogger
    createId: () => string
  },
): Promise<StripeSubscriptionOutcome> {
  const { gateway, store, plans, logger, createId } = deps

  const resolved = resolvePlanItem(plans, stripeSubscription.items.data)
  if (!resolved) {
    logSkipped(logger, stripeSubscription.id, 'plan_unresolved')
    return 'skipped'
  }

  const ownership = await resolveUserOwnedReferenceId(
    stripeSubscription,
    gateway,
    store,
  )
  if (!ownership.ok) {
    logSkipped(logger, stripeSubscription.id, ownership.reason)
    return 'skipped'
  }

  const derived = buildStripeDerivedFields(stripeSubscription, resolved)
  const existing = await store.findByStripeSubscriptionId(stripeSubscription.id)

  if (existing) {
    await store.updateStripeDerivedFields(existing.id, derived)
    logger.info('billing.subscription.reconcile.matched', {
      stripeSubscriptionId: stripeSubscription.id,
      subscriptionId: existing.id,
      userId: ownership.userId,
    })
    return 'matched'
  }

  if (!resolved.plan) {
    logSkipped(logger, stripeSubscription.id, 'plan_unresolved')
    return 'skipped'
  }

  const plan = resolved.plan.name.toLowerCase()
  const subscriptionId =
    stripeSubscription.metadata?.subscriptionId ?? createId()

  await store.createSubscription(
    toSubscriptionRow(subscriptionId, ownership.userId, plan, derived),
  )
  logger.info('billing.subscription.reconcile.created', {
    stripeSubscriptionId: stripeSubscription.id,
    subscriptionId,
    userId: ownership.userId,
  })
  return 'created'
}

async function countOrphanedSubscriptions(
  stripeIds: Set<string>,
  store: ReconciliationStore,
  logger: ReconciliationLogger,
): Promise<number> {
  const localRows = await store.listWithStripeSubscriptionId()
  let orphaned = 0

  for (const row of localRows) {
    if (!row.stripeSubscriptionId) continue
    if (stripeIds.has(row.stripeSubscriptionId)) continue
    if (!(await store.userExists(row.referenceId))) continue

    orphaned += 1
    logger.warn('billing.subscription.reconcile.orphaned', {
      subscriptionId: row.id,
      stripeSubscriptionId: row.stripeSubscriptionId,
      userId: row.referenceId,
    })
  }

  return orphaned
}

export async function reconcileStripeSubscriptions(
  input: ReconcileStripeSubscriptionsInput,
): Promise<ReconcileStripeSubscriptionsResult> {
  const { gateway, store, plans, logger, createId } = input
  const counts = { matched: 0, created: 0, skipped: 0, orphaned: 0 }

  try {
    const stripeSubscriptions = await gateway.listAllSubscriptions()
    const stripeIds = new Set(stripeSubscriptions.map((sub) => sub.id))

    for (const stripeSubscription of stripeSubscriptions) {
      const outcome = await processStripeSubscription(stripeSubscription, {
        gateway,
        store,
        plans,
        logger,
        createId,
      })
      counts[outcome] += 1
    }

    counts.orphaned = await countOrphanedSubscriptions(stripeIds, store, logger)

    logger.info('billing.subscription.reconcile.completed', counts)
    return counts
  } catch (error) {
    const normalized =
      error instanceof Error
        ? {
            errorName: error.name,
            errorMessage: error.message,
            errorStack: error.stack,
          }
        : {
            errorName: 'UnknownError',
            errorMessage: String(error),
          }

    logger.error(
      'billing.subscription.reconcile.failed',
      normalized,
      'Stripe subscription reconciliation failed',
    )
    throw error
  }
}
