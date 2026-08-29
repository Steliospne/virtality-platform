/**
 * Stripe-backed Assigned Variant catalog: list Pro Product Prices, cache ~15m,
 * resolve pairs for charge paths and Adminboard picker.
 */

import {
  PRO_PLAN_PRODUCT_ID,
  buildProVariantCatalogFromStripePrices,
  buildSandboxProVariantCatalog,
  buildBillingCatalogForUser,
  buildSandboxBillingCatalogForUser,
  effectiveAssignedProVariant,
  humanizeProVariantName,
  resolveProVariantChargePrice,
  type BillingCatalogForUserRead,
  type ProVariantCatalog,
  type ProVariantPair,
  type StripeProVariantPriceSnapshot,
} from '@virtality/shared/utils'
import type Stripe from 'stripe'

const CACHE_TTL_MS = 15 * 60 * 1000

let cachedCatalog: {
  readAtMs: number
  value: ProVariantCatalog
} | null = null

export function clearProVariantCatalogCache(): void {
  cachedCatalog = null
}

async function listActiveRecurringProPrices(
  stripeClient: Stripe,
): Promise<StripeProVariantPriceSnapshot[]> {
  const prices: StripeProVariantPriceSnapshot[] = []
  let startingAfter: string | undefined

  for (;;) {
    const page = await stripeClient.prices.list({
      product: PRO_PLAN_PRODUCT_ID,
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

export async function readProVariantCatalog(
  stripeClient: Stripe,
): Promise<ProVariantCatalog> {
  if (
    cachedCatalog &&
    Date.now() - cachedCatalog.readAtMs < CACHE_TTL_MS &&
    cachedCatalog.value.basic != null
  ) {
    return cachedCatalog.value
  }

  const prices = await listActiveRecurringProPrices(stripeClient)
  const value = buildProVariantCatalogFromStripePrices(prices)
  if (value.basic != null) {
    cachedCatalog = { readAtMs: Date.now(), value }
  }
  return value
}

export function readProVariantCatalogOrSandbox(
  stripeClient: Stripe | null,
): Promise<ProVariantCatalog> {
  if (!stripeClient) {
    return Promise.resolve(buildSandboxProVariantCatalog())
  }
  return readProVariantCatalog(stripeClient).catch(() =>
    buildSandboxProVariantCatalog(),
  )
}

/** Fresh catalog for Adminboard assign dialog (bypass TTL). */
export async function readProVariantCatalogFresh(
  stripeClient: Stripe | null,
): Promise<ProVariantCatalog> {
  clearProVariantCatalogCache()
  return readProVariantCatalogOrSandbox(stripeClient)
}

export async function readBillingCatalogForUser(
  stripeClient: Stripe | null,
  assignedProVariant: string | null | undefined,
): Promise<BillingCatalogForUserRead> {
  if (!stripeClient) {
    return buildSandboxBillingCatalogForUser(assignedProVariant)
  }
  try {
    const catalog = await readProVariantCatalog(stripeClient)
    return buildBillingCatalogForUser(catalog, assignedProVariant)
  } catch {
    return {
      ok: false,
      reason: 'stripe_unavailable',
      assignedVariant: effectiveAssignedProVariant(assignedProVariant),
    }
  }
}

export async function resolveAssignedProVariantChargePrice(input: {
  stripeClient: Stripe | null
  assignedProVariant: string | null | undefined
  annual: boolean
}): Promise<
  | { ok: true; priceId: string; pair: ProVariantPair; annual: boolean }
  | {
      ok: false
      reason: string
      assignedVariant: string
    }
> {
  const assignedVariant = effectiveAssignedProVariant(input.assignedProVariant)
  const catalog = await readProVariantCatalogOrSandbox(input.stripeClient)
  const resolved = resolveProVariantChargePrice(
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

export type AssignableProVariantOption = {
  name: string
  label: string
  secondaryLabel: string
  monthlyMinor: number
  yearlyMinor: number
}

export function toAssignableProVariantOptions(
  catalog: ProVariantCatalog,
): AssignableProVariantOption[] {
  return catalog.variants.map((pair) => ({
    name: pair.name,
    label: humanizeProVariantName(pair.name),
    secondaryLabel: pair.name,
    monthlyMinor: pair.minor.monthly,
    yearlyMinor: pair.minor.yearly,
  }))
}
