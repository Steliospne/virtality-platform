'use client'

/**
 * Yearly compare-at rows: catalog group, inline discount, struck basic.
 */

import type { BillingCompareAtYearlyRow } from '@/lib/profile-billing'
import { BillingCatalogYearlyPriceGroup } from './billing-catalog-yearly-price-group'
import { BillingInlinePriceLine } from './billing-inline-price-line'
import { BillingStruckPriceGroup } from './billing-struck-price-group'

export function BillingCompareAtYearlyPrice({
  rows,
}: {
  rows: BillingCompareAtYearlyRow[]
}) {
  return (
    <div className='space-y-3'>
      {rows.map((row, index) => {
        switch (row.kind) {
          case 'catalog':
            return (
              <BillingCatalogYearlyPriceGroup
                key={`catalog-${index}`}
                lines={row.lines}
              />
            )
          case 'discount-inline':
            return (
              <div key={`discount-${index}`} className='space-y-1'>
                <BillingInlinePriceLine
                  parts={[
                    { amount: row.primary.discounted, tone: 'discounted' },
                    { amount: row.primary.current, tone: 'struck' },
                  ]}
                  interval={row.primary.interval}
                />
                <BillingInlinePriceLine
                  parts={[
                    { amount: row.secondary.discounted, tone: 'discounted' },
                    { amount: row.secondary.current, tone: 'struck' },
                  ]}
                  interval={row.secondary.interval}
                  size='secondary'
                />
              </div>
            )
          case 'struck':
            return (
              <BillingStruckPriceGroup
                key={`struck-${index}`}
                lines={row.lines}
              />
            )
        }
      })}
    </div>
  )
}
