'use client'

/**
 * Catalog monthly price with amount + interval split.
 */

import { splitCatalogPriceLabel } from '@/lib/profile-billing'
import { BillingInlinePriceLine } from './billing-inline-price-line'

export function BillingCatalogMonthlyPrice({ price }: { price: string }) {
  const { amount, interval } = splitCatalogPriceLabel(price)
  return (
    <BillingInlinePriceLine
      parts={[{ amount, tone: 'catalog' }]}
      interval={interval}
    />
  )
}
