/**
 * Assigned Variant Pro catalog: discover monthly+yearly Stripe Price pairs by
 * lookup_key `{kebab-name}_{monthly|yearly}` (e.g. `early-bird_monthly`),
 * resolve charge Price ids, and read the sparse User assignment (`null` → `basic`).
 */

import {
  buildBillingCatalogFromMinor,
  buildBillingPlanPriceLabels,
  type BillingCatalogMinor,
  type BillingPlanPriceLabels,
} from './billing-catalog.ts'
import {
  FREE_PLAN_PRICE_ID,
  FREE_SUBSCRIPTION_PLAN,
  PRO_PLAN_ANNUAL_PRICE_ID,
  PRO_PLAN_MONTHLY_PRICE_ID,
  PRO_SUBSCRIPTION_PLAN,
} from './billing-plans.ts'

/** Default Assigned Variant when User.assignedProVariant is null. */
export const DEFAULT_ASSIGNED_PRO_VARIANT = 'basic' as const

/** Live-paid block copy for Adminboard assign UX and server guard. */
export const ASSIGN_PRO_VARIANT_LIVE_PAID_BLOCK_MESSAGE =
  'Cannot change Assigned Variant while this clinician has live paid Pro. Cancel or wait for the seat to end, then reassign.' as const

export const ASSIGN_PRO_VARIANT_ACTION = 'assign_pro_variant' as const

export type ProVariantInterval = 'month' | 'year'

export type ProVariantLookupInterval = 'monthly' | 'yearly'

export type StripeProVariantPriceSnapshot = {
  id: string
  lookup_key: string | null
  unit_amount: number | null
  currency: string
  recurring: { interval: string } | null
  active?: boolean
  metadata?: Record<string, string> | null
}

export type ProVariantPair = {
  name: string
  monthlyPriceId: string
  yearlyPriceId: string
  minor: BillingCatalogMinor
  labels: BillingPlanPriceLabels
}

export type ProVariantCatalog = {
  variants: ProVariantPair[]
  /** Complete `basic` pair when present. */
  basic: ProVariantPair | null
}

export type ResolveProVariantPairResult =
  | { ok: true; pair: ProVariantPair }
  | {
      ok: false
      reason: 'incomplete_pair' | 'unknown_variant' | 'basic_missing'
      variantName: string
    }

export type ProVariantChargePriceResult =
  | { ok: true; priceId: string; pair: ProVariantPair; annual: boolean }
  | {
      ok: false
      reason: 'incomplete_pair' | 'unknown_variant' | 'basic_missing'
      variantName: string
    }

const LOOKUP_KEY_SUFFIX_RE = /^(.+)_(monthly|yearly)$/

/**
 * Parse `{kebab-name}_{monthly|yearly}` from the right (interval suffix only).
 * Variant names use hyphens (e.g. `early-bird_monthly` → `early-bird`).
 * Returns null when the key does not match the Assigned Variant convention.
 */
export function parseProVariantLookupKey(
  lookupKey: string | null | undefined,
): { name: string; interval: ProVariantLookupInterval } | null {
  if (lookupKey == null || lookupKey.trim() === '') return null
  const match = LOOKUP_KEY_SUFFIX_RE.exec(lookupKey.trim())
  if (!match) return null
  const rawName = match[1]
  const interval = match[2] as ProVariantLookupInterval
  if (rawName == null || rawName === '') return null
  return { name: normalizeProVariantName(rawName), interval }
}

/**
 * Ops bridge: legacy `pro_*` lookup keys are the canonical `basic` pair until
 * Stripe rename completes. `pro` as a stored Assigned Variant name also reads
 * as `basic`.
 */
export function normalizeProVariantName(name: string): string {
  const trimmed = name.trim()
  if (trimmed === 'pro') return DEFAULT_ASSIGNED_PRO_VARIANT
  return trimmed
}

/** Sparse storage read: null/blank → `basic`. */
export function effectiveAssignedProVariant(
  assignedProVariant: string | null | undefined,
): string {
  if (assignedProVariant == null || assignedProVariant.trim() === '') {
    return DEFAULT_ASSIGNED_PRO_VARIANT
  }
  return normalizeProVariantName(assignedProVariant)
}

/** Adminboard primary label: `early-bird` → `Early Bird`. */
export function humanizeProVariantName(name: string): string {
  return effectiveAssignedProVariant(name)
    .split('-')
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ')
}

function isValidEurRecurringLeg(
  price: StripeProVariantPriceSnapshot,
  expectedInterval: ProVariantInterval,
): boolean {
  if (price.active === false) return false
  if (price.unit_amount == null || price.unit_amount <= 0) return false
  if (price.currency.toLowerCase() !== 'eur') return false
  if (price.recurring?.interval !== expectedInterval) return false
  return true
}

type PartialLegs = {
  monthly?: StripeProVariantPriceSnapshot
  yearly?: StripeProVariantPriceSnapshot
}

/**
 * Group active recurring Prices into complete Assigned Variant pairs.
 * Incomplete pairs are dropped. Prefer `basic_*` legs over legacy `pro_*`
 * when both exist for the same effective name.
 */
export function buildProVariantCatalogFromStripePrices(
  prices: readonly StripeProVariantPriceSnapshot[],
): ProVariantCatalog {
  const byName = new Map<string, PartialLegs>()

  for (const price of prices) {
    const parsed = parseProVariantLookupKey(price.lookup_key)
    if (!parsed) continue
    const expectedInterval: ProVariantInterval =
      parsed.interval === 'monthly' ? 'month' : 'year'
    if (!isValidEurRecurringLeg(price, expectedInterval)) continue

    const legs = byName.get(parsed.name) ?? {}
    if (parsed.interval === 'monthly') {
      // Prefer already-stored monthly when a second matching leg appears
      // (e.g. basic_* after aliasing pro_*); keep first valid unless
      // replacing a legacy pro_* id with an explicit basic_* source.
      if (
        !legs.monthly ||
        shouldPreferIncomingProVariantLeg(price, legs.monthly)
      ) {
        legs.monthly = price
      }
    } else if (
      !legs.yearly ||
      shouldPreferIncomingProVariantLeg(price, legs.yearly)
    ) {
      legs.yearly = price
    }
    byName.set(parsed.name, legs)
  }

  const variants: ProVariantPair[] = []
  for (const [name, legs] of byName) {
    const pair = toCompleteProVariantPair(name, legs)
    if (pair) variants.push(pair)
  }

  variants.sort((a, b) => {
    if (a.name === DEFAULT_ASSIGNED_PRO_VARIANT) return -1
    if (b.name === DEFAULT_ASSIGNED_PRO_VARIANT) return 1
    return a.name.localeCompare(b.name)
  })

  const basic =
    variants.find((v) => v.name === DEFAULT_ASSIGNED_PRO_VARIANT) ?? null

  return { variants, basic }
}

function shouldPreferIncomingProVariantLeg(
  incoming: StripeProVariantPriceSnapshot,
  existing: StripeProVariantPriceSnapshot,
): boolean {
  const incomingKey = incoming.lookup_key ?? ''
  const existingKey = existing.lookup_key ?? ''
  // Prefer keys that already say basic_* over legacy pro_*.
  if (
    incomingKey.startsWith(`${DEFAULT_ASSIGNED_PRO_VARIANT}_`) &&
    existingKey.startsWith('pro_')
  ) {
    return true
  }
  return false
}

function toCompleteProVariantPair(
  name: string,
  legs: PartialLegs,
): ProVariantPair | null {
  const monthly = legs.monthly
  const yearly = legs.yearly
  if (!monthly || !yearly) return null
  if (monthly.unit_amount == null || yearly.unit_amount == null) return null

  const minor: BillingCatalogMinor = {
    monthly: monthly.unit_amount,
    yearly: yearly.unit_amount,
  }
  const yearlySavingsLabel = yearly.metadata?.yearlySavingsLabel?.trim() || null

  return {
    name,
    monthlyPriceId: monthly.id,
    yearlyPriceId: yearly.id,
    minor,
    labels: buildBillingPlanPriceLabels(
      minor,
      yearlySavingsLabel && yearlySavingsLabel.length > 0
        ? yearlySavingsLabel
        : null,
    ),
  }
}

/**
 * Resolve a complete pair by Assigned Variant name. Fail closed: never invent
 * a silent fallback to `basic` for charging when the named pair is missing.
 */
export function resolveProVariantPair(
  catalog: ProVariantCatalog,
  assignedProVariant: string | null | undefined,
): ResolveProVariantPairResult {
  const variantName = effectiveAssignedProVariant(assignedProVariant)

  if (variantName === DEFAULT_ASSIGNED_PRO_VARIANT && catalog.basic == null) {
    return { ok: false, reason: 'basic_missing', variantName }
  }

  const pair = catalog.variants.find((v) => v.name === variantName)
  if (!pair) {
    return {
      ok: false,
      reason:
        variantName === DEFAULT_ASSIGNED_PRO_VARIANT
          ? 'basic_missing'
          : 'unknown_variant',
      variantName,
    }
  }

  return { ok: true, pair }
}

/** Charge Price id for Assigned Variant + billing interval. */
export function resolveProVariantChargePrice(
  catalog: ProVariantCatalog,
  assignedProVariant: string | null | undefined,
  annual: boolean,
): ProVariantChargePriceResult {
  const resolved = resolveProVariantPair(catalog, assignedProVariant)
  if (!resolved.ok) return resolved
  return {
    ok: true,
    pair: resolved.pair,
    annual,
    priceId: annual
      ? resolved.pair.yearlyPriceId
      : resolved.pair.monthlyPriceId,
  }
}

export function annualFlagForProVariantPriceId(
  catalog: ProVariantCatalog,
  priceId: string,
): boolean | null {
  for (const pair of catalog.variants) {
    if (pair.yearlyPriceId === priceId) return true
    if (pair.monthlyPriceId === priceId) return false
  }
  // Fallback for hardcoded basic ids before catalog is loaded.
  if (priceId === PRO_PLAN_ANNUAL_PRICE_ID) return true
  if (priceId === PRO_PLAN_MONTHLY_PRICE_ID) return false
  return null
}

export function isKnownProVariantPriceId(
  catalog: ProVariantCatalog,
  priceId: string,
): boolean {
  return annualFlagForProVariantPriceId(catalog, priceId) != null
}

export function formatProVariantPriceLabel(
  catalog: ProVariantCatalog,
  priceId: string,
): string {
  for (const pair of catalog.variants) {
    if (pair.monthlyPriceId === priceId) {
      return pair.name === DEFAULT_ASSIGNED_PRO_VARIANT
        ? 'Pro monthly'
        : `Pro monthly (${humanizeProVariantName(pair.name)})`
    }
    if (pair.yearlyPriceId === priceId) {
      return pair.name === DEFAULT_ASSIGNED_PRO_VARIANT
        ? 'Pro yearly'
        : `Pro yearly (${humanizeProVariantName(pair.name)})`
    }
  }
  if (priceId === PRO_PLAN_MONTHLY_PRICE_ID) return 'Pro monthly'
  if (priceId === PRO_PLAN_ANNUAL_PRICE_ID) return 'Pro yearly'
  return priceId
}

/** Profile Billing read shape: assigned slice + basic for compare-at. */
export type BillingCatalogForUserRead =
  | {
      ok: true
      assignedVariant: string
      showCompareAt: boolean
      assigned: {
        minor: BillingCatalogMinor
        labels: BillingPlanPriceLabels
        monthlyPriceId: string
        yearlyPriceId: string
      }
      basic: {
        minor: BillingCatalogMinor
        labels: BillingPlanPriceLabels
        monthlyPriceId: string
        yearlyPriceId: string
      }
    }
  | {
      ok: false
      reason:
        | 'stripe_unavailable'
        | 'invalid_price'
        | 'incomplete_pair'
        | 'unknown_variant'
        | 'basic_missing'
      assignedVariant: string
    }

export function buildBillingCatalogForUser(
  catalog: ProVariantCatalog,
  assignedProVariant: string | null | undefined,
): BillingCatalogForUserRead {
  const assignedVariant = effectiveAssignedProVariant(assignedProVariant)
  if (catalog.basic == null) {
    return { ok: false, reason: 'basic_missing', assignedVariant }
  }

  const resolved = resolveProVariantPair(catalog, assignedVariant)
  if (!resolved.ok) {
    return {
      ok: false,
      reason: resolved.reason,
      assignedVariant,
    }
  }

  const assigned = resolved.pair
  const basic = catalog.basic
  return {
    ok: true,
    assignedVariant,
    showCompareAt: assignedVariant !== DEFAULT_ASSIGNED_PRO_VARIANT,
    assigned: {
      minor: assigned.minor,
      labels: assigned.labels,
      monthlyPriceId: assigned.monthlyPriceId,
      yearlyPriceId: assigned.yearlyPriceId,
    },
    basic: {
      minor: basic.minor,
      labels: basic.labels,
      monthlyPriceId: basic.monthlyPriceId,
      yearlyPriceId: basic.yearlyPriceId,
    },
  }
}

/** Sandbox catalog when Stripe is unavailable in development. */
export function buildSandboxProVariantCatalog(): ProVariantCatalog {
  const minor = { monthly: 15_000, yearly: 150_000 }
  const basic: ProVariantPair = {
    name: DEFAULT_ASSIGNED_PRO_VARIANT,
    monthlyPriceId: PRO_PLAN_MONTHLY_PRICE_ID,
    yearlyPriceId: PRO_PLAN_ANNUAL_PRICE_ID,
    minor,
    labels: buildBillingPlanPriceLabels(minor, 'Save ~2 months'),
  }
  return { variants: [basic], basic }
}

export function buildSandboxBillingCatalogForUser(
  assignedProVariant: string | null | undefined,
): BillingCatalogForUserRead {
  return buildBillingCatalogForUser(
    buildSandboxProVariantCatalog(),
    assignedProVariant,
  )
}

/** Re-export catalog label builder for callers that already hold minor units. */
export function billingLabelsFromMinor(
  minor: BillingCatalogMinor,
  yearlySavingsLabel: string | null = null,
): BillingPlanPriceLabels {
  return buildBillingPlanPriceLabels(minor, yearlySavingsLabel)
}

export function catalogSliceFromPair(pair: ProVariantPair) {
  return buildBillingCatalogFromMinor(
    pair.minor,
    pair.labels.yearlySavingsLabel,
  )
}

/**
 * Better Auth Stripe plugin plan row. Several entries may share name `pro`
 * (one per Assigned Variant pair) so webhook Price matching covers every
 * catalog Price id while Checkout still selects plan name `pro`.
 */
export type BetterAuthStripePlanConfig = {
  name: string
  priceId: string
  annualDiscountPriceId?: string
  lookupKey?: string
  annualDiscountLookupKey?: string
}

/**
 * Expand the Assigned Variant catalog into Better Auth `subscription.plans`.
 * Free first; then one `pro` row per complete pair (basic first). Basic also
 * gets a legacy `pro_*` lookup_key alias until Stripe rename completes.
 * Empty catalog falls back to the canonical sandbox basic Price ids.
 */
export function buildBetterAuthStripePlansFromProVariantCatalog(
  catalog: ProVariantCatalog,
  freePriceId: string = FREE_PLAN_PRICE_ID,
): BetterAuthStripePlanConfig[] {
  const pairs =
    catalog.variants.length > 0
      ? catalog.variants
      : buildSandboxProVariantCatalog().variants

  const proPlans: BetterAuthStripePlanConfig[] = []
  for (const pair of pairs) {
    const row: BetterAuthStripePlanConfig = {
      name: PRO_SUBSCRIPTION_PLAN,
      priceId: pair.monthlyPriceId,
      annualDiscountPriceId: pair.yearlyPriceId,
      lookupKey: `${pair.name}_monthly`,
      annualDiscountLookupKey: `${pair.name}_yearly`,
    }
    proPlans.push(row)
    if (pair.name === DEFAULT_ASSIGNED_PRO_VARIANT) {
      proPlans.push({
        ...row,
        lookupKey: 'pro_monthly',
        annualDiscountLookupKey: 'pro_yearly',
      })
    }
  }

  return [
    {
      name: FREE_SUBSCRIPTION_PLAN,
      priceId: freePriceId,
      lookupKey: 'free_monthly',
    },
    ...proPlans,
  ]
}

/**
 * Whether Better Auth's plan matcher would accept this Price id (or lookup_key)
 * against plans built from the catalog. Mirrors `@better-auth/stripe` resolvePlanItem.
 */
export function betterAuthStripePlansMatchPrice(
  plans: readonly BetterAuthStripePlanConfig[],
  price: { id: string; lookup_key?: string | null },
): BetterAuthStripePlanConfig | undefined {
  return plans.find(
    (plan) =>
      plan.priceId === price.id ||
      plan.annualDiscountPriceId === price.id ||
      (price.lookup_key != null &&
        price.lookup_key !== '' &&
        (plan.lookupKey === price.lookup_key ||
          plan.annualDiscountLookupKey === price.lookup_key)),
  )
}
