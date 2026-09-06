'use client'

/**
 * Catalog yearly price group (monthly-equivalent + yearly total).
 */

import { splitCatalogPriceLabel } from '@/lib/profile-billing'
import { BillingInlinePriceLine } from './billing-inline-price-line'

export function BillingCatalogYearlyPriceGroup({
  lines,
}: {
  lines: { primary: string; secondary: string }
}) {
  const { amount, interval } = splitCatalogPriceLabel(lines.primary)
  return (
    <div className='space-y-0.5'>
      <BillingInlinePriceLine
        parts={[{ amount, tone: 'catalog' }]}
        interval={interval}
      />
      <p className='text-sm text-zinc-400 tabular-nums'>{lines.secondary}</p>
    </div>
  )
}
