/**
 * Stripe-backed Assigned Variant catalog: list Default Product Prices, cache ~15m,
 * resolve pairs for charge paths and Adminboard picker.
 */

import {
  DEFAULT_PLAN_PRODUCT_ID,
  buildPlanVariantCatalogFromStripePrices,
  buildSandboxPlanVariantCatalog,
  buildBillingCatalogForUser,
  buildSandboxBillingCatalogForUser,
  effectiveAssignedPlanVariant,
  humanizePlanVariantName,
  resolvePlanVariantChargePrice,
  type BillingCatalogForUserRead,
  type PlanVariantCatalog,
  type PlanVariantPair,
  type StripePlanVariantPriceSnapshot,
} from '@virtality/shared/utils'
import type Stripe from 'stripe'

const CACHE_TTL_MS = 15 * 60 * 1000

let cachedCatalog: {
  readAtMs: number
  value: PlanVariantCatalog
} | null = null

export function clearPlanVariantCatalogCache(): void {
  cachedCatalog = null
}

async function listActiveRecurringDefaultPrices(
  stripeClient: Stripe,
): Promise<StripePlanVariantPriceSnapshot[]> {
  const prices: StripePlanVariantPriceSnapshot[] = []
  let startingAfter: string | undefined

  for (;;) {
    const page = await stripeClient.prices.list({
      product: DEFAULT_PLAN_PRODUCT_ID,
      active: true,
      type: 'recurring',
      limit: 100,
      ...(startingAfter ? { starting_after: startingAfter } : {}),
    })

    for (const price of page.data) {
      prices.push({
        id: price.id,
        lookup_key: price.lookup_key,
        unit_amount: price.unit_amount,
        currency: price.currency,
        recurring: price.recurring
          ? { interval: price.recurring.interval }
          : null,
        active: price.active,
        metadata: price.metadata,
      })
    }

    if (!page.has_more || page.data.length === 0) break
    startingAfter = page.data[page.data.length - 1]?.id
    if (!startingAfter) break
  }

  return prices
}

export async function readPlanVariantCatalog(
  stripeClient: Stripe,
): Promise<PlanVariantCatalog> {
  if (
    cachedCatalog &&
    Date.now() - cachedCatalog.readAtMs < CACHE_TTL_MS &&
    cachedCatalog.value.basic != null
  ) {
    return cachedCatalog.value
  }

  const prices = await listActiveRecurringDefaultPrices(stripeClient)
  const value = buildPlanVariantCatalogFromStripePrices(prices)
  if (value.basic != null) {
    cachedCatalog = { readAtMs: Date.now(), value }
  }
  return value
}

export function readPlanVariantCatalogOrSandbox(
  stripeClient: Stripe | null,
): Promise<PlanVariantCatalog> {
  if (!stripeClient) {
    return Promise.resolve(buildSandboxPlanVariantCatalog())
  }
  return readPlanVariantCatalog(stripeClient).catch(() =>
    buildSandboxPlanVariantCatalog(),
  )
}

/** Fresh catalog for Adminboard assign dialog (bypass TTL). */
export async function readPlanVariantCatalogFresh(
  stripeClient: Stripe | null,
): Promise<PlanVariantCatalog> {
  clearPlanVariantCatalogCache()
  return readPlanVariantCatalogOrSandbox(stripeClient)
}

export async function readBillingCatalogForUser(
  stripeClient: Stripe | null,
  assignedDefaultVariant: string | null | undefined,
): Promise<BillingCatalogForUserRead> {
  if (!stripeClient) {
    return buildSandboxBillingCatalogForUser(assignedDefaultVariant)
  }
  try {
    const catalog = await readPlanVariantCatalog(stripeClient)
    return buildBillingCatalogForUser(catalog, assignedDefaultVariant)
  } catch {
    return {
      ok: false,
      reason: 'stripe_unavailable',
      assignedVariant: effectiveAssignedPlanVariant(assignedDefaultVariant),
    }
  }
}

export async function resolveAssignedPlanVariantChargePrice(input: {
  stripeClient: Stripe | null
  assignedDefaultVariant: string | null | undefined
  annual: boolean
}): Promise<
  | { ok: true; priceId: string; pair: PlanVariantPair; annual: boolean }
  | {
      ok: false
      reason: string
      assignedVariant: string
    }
> {
  const assignedVariant = effectiveAssignedPlanVariant(
    input.assignedDefaultVariant,
  )
  const catalog = await readPlanVariantCatalogOrSandbox(input.stripeClient)
  const resolved = resolvePlanVariantChargePrice(
    catalog,
    assignedVariant,
    input.annual,
  )
  if (!resolved.ok) {
    return {
      ok: false,
      reason: resolved.reason,
      assignedVariant,
    }
  }
  return resolved
}

export type AssignablePlanVariantOption = {
  name: string
  label: string
  secondaryLabel: string
  monthlyMinor: number
  yearlyMinor: number
}

export function toAssignablePlanVariantOptions(
  catalog: PlanVariantCatalog,
): AssignablePlanVariantOption[] {
  return catalog.variants.map((pair) => ({
    name: pair.name,
    label: humanizePlanVariantName(pair.name),
    secondaryLabel: pair.name,
    monthlyMinor: pair.minor.monthly,
    yearlyMinor: pair.minor.yearly,
  }))
}
