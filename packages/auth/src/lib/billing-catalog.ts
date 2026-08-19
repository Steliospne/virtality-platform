import {
  buildBillingCatalogFromStripePrices,
  buildSandboxBillingCatalogRead,
  type BillingCatalogRead,
} from '@virtality/shared/utils'
import type Stripe from 'stripe'
import {
  PRO_PLAN_ANNUAL_PRICE_ID,
  PRO_PLAN_PRICE_ID,
} from '../auth-instance.ts'

const CACHE_TTL_MS = 15 * 60 * 1000

let cachedCatalog: { readAtMs: number; value: BillingCatalogRead } | null = null

export async function readConsoleBillingCatalog(
  stripeClient: Stripe,
): Promise<BillingCatalogRead> {
  if (
    cachedCatalog &&
    Date.now() - cachedCatalog.readAtMs < CACHE_TTL_MS &&
    cachedCatalog.value.ok
  ) {
    return cachedCatalog.value
  }

  try {
    const [monthlyPrice, yearlyPrice] = await Promise.all([
      stripeClient.prices.retrieve(PRO_PLAN_PRICE_ID),
      stripeClient.prices.retrieve(PRO_PLAN_ANNUAL_PRICE_ID),
    ])
    const value = buildBillingCatalogFromStripePrices(monthlyPrice, yearlyPrice)
    if (value.ok) {
      cachedCatalog = { readAtMs: Date.now(), value }
    }
    return value
  } catch {
    return { ok: false, reason: 'stripe_unavailable' }
  }
}

/** Console Billing catalog read; sandbox fallback when Stripe is not configured. */
export function readConsoleBillingCatalogOrSandbox(
  stripeClient: Stripe | null,
): Promise<BillingCatalogRead> {
  if (!stripeClient) {
    return Promise.resolve(buildSandboxBillingCatalogRead())
  }
  return readConsoleBillingCatalog(stripeClient)
}
