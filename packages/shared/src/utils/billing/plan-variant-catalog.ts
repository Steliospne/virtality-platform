/**
 * Assigned Variant Default catalog: discover monthly+yearly Stripe Price pairs by
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
  DEFAULT_PLAN_ANNUAL_PRICE_ID,
  DEFAULT_PLAN_MONTHLY_PRICE_ID,
  DEFAULT_SUBSCRIPTION_PLAN,
} from './billing-plans.ts'

/** Default Assigned Variant when User.assignedDefaultVariant is null. */
export const DEFAULT_ASSIGNED_PLAN_VARIANT = 'basic' as const

/** Live-paid block copy for Adminboard assign UX and server guard. */
export const ASSIGN_PLAN_VARIANT_LIVE_PAID_BLOCK_MESSAGE =
  'Cannot change Assigned Variant while this clinician has live paid Default. Cancel or wait for the seat to end, then reassign.' as const

export const ASSIGN_PLAN_VARIANT_ACTION = 'assign_plan_variant' as const

export type PlanVariantInterval = 'month' | 'year'

export type PlanVariantLookupInterval = 'monthly' | 'yearly'

export type StripePlanVariantPriceSnapshot = {
  id: string
  lookup_key: string | null
  unit_amount: number | null
  currency: string
  recurring: { interval: string } | null
  active?: boolean
  metadata?: Record<string, string> | null
}

export type PlanVariantPair = {
  name: string
  monthlyPriceId: string
  yearlyPriceId: string
  minor: BillingCatalogMinor
  labels: BillingPlanPriceLabels
}

export type PlanVariantCatalog = {
  variants: PlanVariantPair[]
  /** Complete `basic` pair when present. */
  basic: PlanVariantPair | null
  /** Stripe Product display name for the Default plan, when known. */
  productName: string | null
}

/** Display fallback when the Stripe Product name hasn't loaded. */
export const DEFAULT_PLAN_PRODUCT_NAME_FALLBACK = 'Default' as const

export type ResolvePlanVariantPairResult =
  | { ok: true; pair: PlanVariantPair }
  | {
      ok: false
      reason: 'incomplete_pair' | 'unknown_variant' | 'basic_missing'
      variantName: string
    }

export type PlanVariantChargePriceResult =
  | { ok: true; priceId: string; pair: PlanVariantPair; annual: boolean }
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
export function parsePlanVariantLookupKey(
  lookupKey: string | null | undefined,
): { name: string; interval: PlanVariantLookupInterval } | null {
  if (lookupKey == null || lookupKey.trim() === '') return null
  const match = LOOKUP_KEY_SUFFIX_RE.exec(lookupKey.trim())
  if (!match) return null
  const rawName = match[1]
  const interval = match[2] as PlanVariantLookupInterval
  if (rawName == null || rawName === '') return null
  return { name: normalizePlanVariantName(rawName), interval }
}

/**
 * Ops bridge: legacy `pro_*` lookup keys are the canonical `basic` pair until
 * Stripe rename completes. `pro` as a stored Assigned Variant name also reads
 * as `basic`.
 */
export function normalizePlanVariantName(name: string): string {
  const trimmed = name.trim()
  if (trimmed === 'pro') return DEFAULT_ASSIGNED_PLAN_VARIANT
  return trimmed
}

/** Sparse storage read: null/blank → `basic`. */
export function effectiveAssignedPlanVariant(
  assignedDefaultVariant: string | null | undefined,
): string {
  if (assignedDefaultVariant == null || assignedDefaultVariant.trim() === '') {
    return DEFAULT_ASSIGNED_PLAN_VARIANT
  }
  return normalizePlanVariantName(assignedDefaultVariant)
}

/** Adminboard primary label: `early-bird` → `Early Bird`. */
export function humanizePlanVariantName(name: string): string {
  return effectiveAssignedPlanVariant(name)
    .split('-')
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ')
}

function isValidEurRecurringLeg(
  price: StripePlanVariantPriceSnapshot,
  expectedInterval: PlanVariantInterval,
): boolean {
  if (price.active === false) return false
  if (price.unit_amount == null || price.unit_amount <= 0) return false
  if (price.currency.toLowerCase() !== 'eur') return false
  if (price.recurring?.interval !== expectedInterval) return false
  return true
}

type PartialLegs = {
  monthly?: StripePlanVariantPriceSnapshot
  yearly?: StripePlanVariantPriceSnapshot
}

/**
 * Group active recurring Prices into complete Assigned Variant pairs.
 * Incomplete pairs are dropped. Prefer `basic_*` legs over legacy `pro_*`
 * when both exist for the same effective name.
 */
export function buildPlanVariantCatalogFromStripePrices(
  prices: readonly StripePlanVariantPriceSnapshot[],
  productName: string | null = null,
): PlanVariantCatalog {
  const byName = new Map<string, PartialLegs>()

  for (const price of prices) {
    const parsed = parsePlanVariantLookupKey(price.lookup_key)
    if (!parsed) continue
    const expectedInterval: PlanVariantInterval =
      parsed.interval === 'monthly' ? 'month' : 'year'
    if (!isValidEurRecurringLeg(price, expectedInterval)) continue

    const legs = byName.get(parsed.name) ?? {}
    if (parsed.interval === 'monthly') {
      // Prefer already-stored monthly when a second matching leg appears
      // (e.g. basic_* after aliasing pro_*); keep first valid unless
      // replacing a legacy pro_* id with an explicit basic_* source.
      if (
        !legs.monthly ||
        shouldPreferIncomingPlanVariantLeg(price, legs.monthly)
      ) {
        legs.monthly = price
      }
    } else if (
      !legs.yearly ||
      shouldPreferIncomingPlanVariantLeg(price, legs.yearly)
    ) {
      legs.yearly = price
    }
    byName.set(parsed.name, legs)
  }

  const variants: PlanVariantPair[] = []
  for (const [name, legs] of byName) {
    const pair = toCompletePlanVariantPair(name, legs)
    if (pair) variants.push(pair)
  }

  variants.sort((a, b) => {
    const rankDiff = planVariantSortRank(a.name) - planVariantSortRank(b.name)
    if (rankDiff !== 0) return rankDiff
    return a.name.localeCompare(b.name)
  })

  const basic =
    variants.find((v) => v.name.startsWith(DEFAULT_ASSIGNED_PLAN_VARIANT)) ??
    null

  return { variants, basic, productName }
}

/**
 * Sort rank for the `basic` pair: exact `basic` first, then any
 * `basic`-prefixed name (e.g. `basic_v2`, `basic-2026` during a Stripe
 * migration), then everything else alphabetically.
 */
function planVariantSortRank(name: string): number {
  if (name === DEFAULT_ASSIGNED_PLAN_VARIANT) return 0
  if (name.startsWith(DEFAULT_ASSIGNED_PLAN_VARIANT)) return 1
  return 2
}

function shouldPreferIncomingPlanVariantLeg(
  incoming: StripePlanVariantPriceSnapshot,
  existing: StripePlanVariantPriceSnapshot,
): boolean {
  const incomingKey = incoming.lookup_key ?? ''
  const existingKey = existing.lookup_key ?? ''
  // Prefer keys that already say basic_* over legacy pro_*.
  if (
    incomingKey.startsWith(`${DEFAULT_ASSIGNED_PLAN_VARIANT}_`) &&
    existingKey.startsWith('pro_')
  ) {
    return true
  }
  return false
}

function toCompletePlanVariantPair(
  name: string,
  legs: PartialLegs,
): PlanVariantPair | null {
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
export function resolvePlanVariantPair(
  catalog: PlanVariantCatalog,
  assignedDefaultVariant: string | null | undefined,
): ResolvePlanVariantPairResult {
  const variantName = effectiveAssignedPlanVariant(assignedDefaultVariant)

  if (variantName === DEFAULT_ASSIGNED_PLAN_VARIANT) {
    if (catalog.basic == null) {
      return { ok: false, reason: 'basic_missing', variantName }
    }
    // catalog.basic is already resolved by basic-prefix match (e.g.
    // `basic-premium`), which may not equal `variantName` exactly.
    return { ok: true, pair: catalog.basic }
  }

  const pair = catalog.variants.find((v) => v.name === variantName)
  if (!pair) {
    return { ok: false, reason: 'unknown_variant', variantName }
  }

  return { ok: true, pair }
}

/** Charge Price id for Assigned Variant + billing interval. */
export function resolvePlanVariantChargePrice(
  catalog: PlanVariantCatalog,
  assignedDefaultVariant: string | null | undefined,
  annual: boolean,
): PlanVariantChargePriceResult {
  const resolved = resolvePlanVariantPair(catalog, assignedDefaultVariant)
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

export function annualFlagForPlanVariantPriceId(
  catalog: PlanVariantCatalog,
  priceId: string,
): boolean | null {
  for (const pair of catalog.variants) {
    if (pair.yearlyPriceId === priceId) return true
    if (pair.monthlyPriceId === priceId) return false
  }
  // Fallback for hardcoded basic ids before catalog is loaded.
  if (priceId === DEFAULT_PLAN_ANNUAL_PRICE_ID) return true
  if (priceId === DEFAULT_PLAN_MONTHLY_PRICE_ID) return false
  return null
}

export function isKnownPlanVariantPriceId(
  catalog: PlanVariantCatalog,
  priceId: string,
): boolean {
  return annualFlagForPlanVariantPriceId(catalog, priceId) != null
}

export function formatPlanVariantPriceLabel(
  catalog: PlanVariantCatalog,
  priceId: string,
): string {
  const productName = catalog.productName ?? DEFAULT_PLAN_PRODUCT_NAME_FALLBACK
  for (const pair of catalog.variants) {
    if (pair.monthlyPriceId === priceId) {
      return pair.name === DEFAULT_ASSIGNED_PLAN_VARIANT
        ? `${productName} monthly`
        : `${productName} monthly (${humanizePlanVariantName(pair.name)})`
    }
    if (pair.yearlyPriceId === priceId) {
      return pair.name === DEFAULT_ASSIGNED_PLAN_VARIANT
        ? `${productName} yearly`
        : `${productName} yearly (${humanizePlanVariantName(pair.name)})`
    }
  }
  if (priceId === DEFAULT_PLAN_MONTHLY_PRICE_ID) return `${productName} monthly`
  if (priceId === DEFAULT_PLAN_ANNUAL_PRICE_ID) return `${productName} yearly`
  return priceId
}

/** Profile Billing read shape: assigned slice + basic for compare-at. */
export type BillingCatalogForUserRead =
  | {
      ok: true
      assignedVariant: string
      showCompareAt: boolean
      /** Stripe Product display name for the Default plan. */
      productName: string
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
  catalog: PlanVariantCatalog,
  assignedDefaultVariant: string | null | undefined,
): BillingCatalogForUserRead {
  const assignedVariant = effectiveAssignedPlanVariant(assignedDefaultVariant)
  if (catalog.basic == null) {
    return { ok: false, reason: 'basic_missing', assignedVariant }
  }

  const resolved = resolvePlanVariantPair(catalog, assignedVariant)
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
    showCompareAt: assignedVariant !== DEFAULT_ASSIGNED_PLAN_VARIANT,
    productName: catalog.productName ?? DEFAULT_PLAN_PRODUCT_NAME_FALLBACK,
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
export function buildSandboxPlanVariantCatalog(): PlanVariantCatalog {
  const minor = { monthly: 15_000, yearly: 150_000 }
  const basic: PlanVariantPair = {
    name: DEFAULT_ASSIGNED_PLAN_VARIANT,
    monthlyPriceId: DEFAULT_PLAN_MONTHLY_PRICE_ID,
    yearlyPriceId: DEFAULT_PLAN_ANNUAL_PRICE_ID,
    minor,
    labels: buildBillingPlanPriceLabels(minor, 'Save ~2 months'),
  }
  return {
    variants: [basic],
    basic,
    productName: DEFAULT_PLAN_PRODUCT_NAME_FALLBACK,
  }
}

export function buildSandboxBillingCatalogForUser(
  assignedDefaultVariant: string | null | undefined,
): BillingCatalogForUserRead {
  return buildBillingCatalogForUser(
    buildSandboxPlanVariantCatalog(),
    assignedDefaultVariant,
  )
}

/** Re-export catalog label builder for callers that already hold minor units. */
export function billingLabelsFromMinor(
  minor: BillingCatalogMinor,
  yearlySavingsLabel: string | null = null,
): BillingPlanPriceLabels {
  return buildBillingPlanPriceLabels(minor, yearlySavingsLabel)
}

export function catalogSliceFromPair(pair: PlanVariantPair) {
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
export function buildBetterAuthStripePlansFromPlanVariantCatalog(
  catalog: PlanVariantCatalog,
  freePriceId: string = FREE_PLAN_PRICE_ID,
): BetterAuthStripePlanConfig[] {
  const pairs =
    catalog.variants.length > 0
      ? catalog.variants
      : buildSandboxPlanVariantCatalog().variants

  const proPlans: BetterAuthStripePlanConfig[] = []
  for (const pair of pairs) {
    const row: BetterAuthStripePlanConfig = {
      name: DEFAULT_SUBSCRIPTION_PLAN,
      priceId: pair.monthlyPriceId,
      annualDiscountPriceId: pair.yearlyPriceId,
      lookupKey: `${pair.name}_monthly`,
      annualDiscountLookupKey: `${pair.name}_yearly`,
    }
    proPlans.push(row)
    if (pair.name === DEFAULT_ASSIGNED_PLAN_VARIANT) {
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
