/**
 * Auth-side adapter for `@virtality/shared` plan-variant-catalog builders.
 * Stripe-backed Assigned Variant catalog: list Default Product Prices, cache ~15m,
 * resolve pairs for charge paths and Adminboard picker.
 */

import {
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

/** Stripe Product metadata marking the one subscribable Default plan Product. */
export const DEFAULT_PLAN_METADATA_KEY = 'virtality_plan' as const
export const DEFAULT_PLAN_METADATA_VALUE = 'default' as const

type DefaultPlanProduct = { id: string; name: string }

let cachedCatalog: {
  readAtMs: number
  value: PlanVariantCatalog
} | null = null

let cachedProduct: {
  readAtMs: number
  value: DefaultPlanProduct
} | null = null

export function clearPlanVariantCatalogCache(): void {
  cachedCatalog = null
  cachedProduct = null
}

/**
 * Resolve the live Default plan Product by Stripe metadata instead of a
 * hardcoded id, so swapping the underlying Product needs only a Stripe-side
 * metadata change, not a deploy. Billing supports exactly one plan today —
 * asserts exactly one active Product carries the tag, rather than silently
 * picking one of several.
 */
async function fetchDefaultPlanProduct(
  stripeClient: Stripe,
): Promise<DefaultPlanProduct> {
  const result = await stripeClient.products.search({
    query: `active:'true' AND metadata['${DEFAULT_PLAN_METADATA_KEY}']:'${DEFAULT_PLAN_METADATA_VALUE}'`,
    limit: 2,
  })

  if (result.data.length === 0) {
    throw new Error(
      `No active Stripe Product tagged metadata.${DEFAULT_PLAN_METADATA_KEY}="${DEFAULT_PLAN_METADATA_VALUE}" was found.`,
    )
  }
  if (result.data.length > 1) {
    throw new Error(
      `Expected exactly one active Stripe Product tagged metadata.${DEFAULT_PLAN_METADATA_KEY}="${DEFAULT_PLAN_METADATA_VALUE}", found ${result.data.length}.`,
    )
  }

  const product = result.data[0]!
  return { id: product.id, name: product.name }
}

async function resolveDefaultPlanProduct(
  stripeClient: Stripe,
): Promise<DefaultPlanProduct> {
  if (cachedProduct && Date.now() - cachedProduct.readAtMs < CACHE_TTL_MS) {
    return cachedProduct.value
  }
  const value = await fetchDefaultPlanProduct(stripeClient)
  cachedProduct = { readAtMs: Date.now(), value }
  return value
}

export async function resolveDefaultPlanProductId(
  stripeClient: Stripe,
): Promise<string> {
  const product = await resolveDefaultPlanProduct(stripeClient)
  return product.id
}

/** Live Default plan Product display name, e.g. for Console/Adminboard copy. */
export async function resolveDefaultPlanProductName(
  stripeClient: Stripe,
): Promise<string> {
  const product = await resolveDefaultPlanProduct(stripeClient)
  return product.name
}

async function listActiveRecurringDefaultPrices(
  stripeClient: Stripe,
): Promise<{ prices: StripePlanVariantPriceSnapshot[]; productName: string }> {
  const product = await resolveDefaultPlanProduct(stripeClient)
  const prices: StripePlanVariantPriceSnapshot[] = []
  let startingAfter: string | undefined

  for (;;) {
    const page = await stripeClient.prices.list({
      product: product.id,
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

  return { prices, productName: product.name }
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

  const { prices, productName } =
    await listActiveRecurringDefaultPrices(stripeClient)
  const value = buildPlanVariantCatalogFromStripePrices(prices, productName)
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
